// Progress bar + Review panel rendering, plus the "return seen card to deck"
// affordance from the review list. Reads runtime state directly and calls
// back into main.js for the deck helpers that mutate runtime.deck /
// runtime.currentIdx via buildStudyDeck and the unspaced-pile manipulations.

import { runtime } from '../state/runtime.js';
import { compareGreekAlphabetical } from '../utils/greekSort.js';
import { getConfidencePct } from '../domain/srs/confidence.js';
import { formatRemainingForTable, getSrsStage } from '../domain/srs/scheduler.js';
import { getCardReviewLeft, getCardReviewRight, getCardMetaLine } from '../domain/deck/filters.js';
import { isAnalyticsModalOpen } from './modals.js';
import {
  getAllLemmaStats,
  getLemmaFormStatus,
  clearLemmaFormRecent,
  isLemmaFormKnown,
  createValueBreakdownAcc,
  accumulateValueBreakdown,
  finalizeValueBreakdown,
  summarizeLemmaValueBreakdown
} from '../domain/grammar/morph_steps.js';
import { buildDimValueBarsHtml } from './charts.js';

let host = {
  accumulateUsageTime: () => {},
  accumulateActiveStudyTime: () => {},
  updateUsageMeta: () => {},
  getKnownCount: () => 0,
  getDueCount: () => 0,
  getRemainingCards: () => [],
  getHighConfidenceCount: () => 0,
  getWordProgress: () => ({}),
  getMorphCardsForLemma: () => [],
  getInScopeParadigmLemmas: () => [],
  isMorphologyMode: () => false,
  isParsingMode: () => false,
  renderAnalyticsOverlay: () => {},
  moveCardToBackOfActivePile: () => {},
  buildStudyDeck: () => [],
  renderCard: () => {},
  saveState: () => {},
  getEnabledParsingDims: () => null,
  rebuildParsingDeck: () => {}
};

export function configureProgress(deps) {
  host = { ...host, ...deps };
}

export function renderProgress() {
  if (!document.hidden) {
    host.accumulateUsageTime();
    host.accumulateActiveStudyTime();
  }
  const total = runtime.originalDeck.length || runtime.deck.length;
  const confirmed = host.getKnownCount();
  const remaining = Math.max(total - confirmed, 0);
  const progressPercentEl = document.getElementById('progressPercent');
  host.updateUsageMeta();

  if (runtime.spacedRepetition) {
    const dueCount = host.getDueCount(runtime.originalDeck);
    const nextCard = dueCount && runtime.currentIdx < dueCount ? runtime.currentIdx + 1 : dueCount;
    const progressTextEl = document.getElementById('progressText');
    if (progressTextEl) progressTextEl.textContent = total
      ? `${nextCard} / ${dueCount} due · Confirmed ${confirmed} · Scheduled ${Math.max(total - dueCount, 0)}`
      : '0 / 0';
    const pct = total ? Math.round(((total - dueCount) / total) * 100) : 0;
    const progressFillEl = document.getElementById('progressFill');
    if (progressFillEl) progressFillEl.style.width = pct + '%';
    if (progressPercentEl) progressPercentEl.textContent = `${pct}%`;
    if (isAnalyticsModalOpen()) host.renderAnalyticsOverlay();
    return;
  }

  const cycleSize = host.isMorphologyMode() ? total : (host.getRemainingCards().length || total);
  const nextCard = total && runtime.currentIdx < runtime.deck.length ? Math.min(runtime.currentIdx + 1, cycleSize) : total;
  const progressTextEl2 = document.getElementById('progressText');
  if (progressTextEl2) progressTextEl2.textContent = total
    ? `${nextCard} / ${cycleSize} · Confirmed ${confirmed} · Remaining ${remaining}${host.isMorphologyMode() ? ' · Grammar' : ''}`
    : '0 / 0';
  const pct = total ? Math.round((confirmed / total) * 100) : 0;
  const progressFillEl2 = document.getElementById('progressFill');
  if (progressFillEl2) progressFillEl2.style.width = pct + '%';
  if (progressPercentEl) progressPercentEl.textContent = `${pct}%`;
  if (isAnalyticsModalOpen()) host.renderAnalyticsOverlay();
}

// Bar columns + total for the "cards due by day" histogram. Columns:
//   now    — the current study session: the active rotation + the middle pile
//            (due cards parked to shuffle in before the session ends), i.e. the
//            first activeDeckCount+middleDeckCount entries of runtime.deck.
//            Matches the panel's "Due now" stat; the middle pile grows as cards
//            come due across rebuilds, so this tracks the session rather than
//            the raw dueAt<=now set (an Uncertain card bumped a couple of hours
//            leaves the session and lands in "today" instead).
//   today  — deferred but due later today (before tonight's midnight).
//   k      — deferred, due k calendar days from today (k = 1 is tomorrow, …),
//            out to a "14d+" overflow so a long-cadence (8-month) tail stays
//            bounded.
// Day buckets are CALENDAR days (local time): "today" runs until midnight, then
// one column per calendar day — not rolling 24h periods from now. Returns null
// in unspaced mode or when the deck is empty. dueNow is the "now"-column count
// (= active+middle).
function buildDueHistogramBars() {
  if (!runtime.spacedRepetition) return null;
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const MAX_DAY = 14;                         // day bars 1..13, then a 14d+ overflow
  const COL_NOW = 0, COL_TODAY = 1;
  const COL_OVERFLOW = MAX_DAY + 1;           // index of the "14d+" bucket
  const counts = new Array(COL_OVERFLOW + 1).fill(0);
  const sessionCount = (runtime.activeDeckCount || 0) + (runtime.middleDeckCount || 0);
  const sessionIds = new Set((runtime.deck || []).slice(0, sessionCount).map(c => c.id));
  let total = 0;
  let lastIdx = 0;
  (runtime.originalDeck || []).forEach(card => {
    const p = host.getWordProgress(card.id);
    total += 1;
    let col;
    if (sessionIds.has(card.id)) {
      col = COL_NOW;                          // active + middle = the current session
    } else {
      // Deferred (not in the session). Bucket by CALENDAR day from today's
      // midnight. Never-seen cards are always due, so they live in the active
      // section above and never reach this branch.
      const dueDay = new Date(p.dueAt); dueDay.setHours(0, 0, 0, 0);
      const calDays = Math.max(0, Math.round((dueDay.getTime() - startOfToday.getTime()) / DAY_MS));
      col = calDays === 0 ? COL_TODAY : Math.min(calDays + 1, COL_OVERFLOW);
    }
    counts[col] += 1;
    if (col > lastIdx) lastIdx = col;
  });
  if (!total) return null;
  const maxCount = Math.max(...counts.slice(0, lastIdx + 1), 1);
  let bars = '';
  for (let i = 0; i <= lastIdx; i++) {
    const c = counts[i];
    const h = c === 0 ? 2 : Math.max(4, Math.round((c / maxCount) * 48));
    const days = i - 1;                       // i>=2 → that many study days
    const label = i === COL_NOW ? 'now'
      : i === COL_TODAY ? 'today'
      : i === COL_OVERFLOW ? `${MAX_DAY}d+`
      : `${days}`;
    const title = i === COL_NOW ? `Due now: ${c}`
      : i === COL_TODAY ? `Due later today: ${c}`
      : i === COL_OVERFLOW ? `Due in ${MAX_DAY} or more days: ${c}`
      : `Due in ${days} day${days === 1 ? '' : 's'}: ${c}`;
    bars += `<div class="due-hist-col${i === COL_NOW ? ' due-hist-now' : ''}" title="${title}">`
      + `<span class="due-hist-count">${c || ''}</span>`
      + `<span class="due-hist-bar" style="height:${h}px"></span>`
      + `<span class="due-hist-label">${label}</span></div>`;
  }
  return { total, bars, dueNow: counts[COL_NOW] };
}

// Collapsible "Due by day" histogram. Two variants:
//   - default (review panel): a <details> that self-persists open/closed in
//     runtime.analyticsCollapsed['dueByDayPanel'] via an inline ontoggle.
//   - { collapseKey } (analytics overlay): a data-collapse-key <details> that
//     the overlay's own collapse-sync manages + persists.
// `{ data }` lets a caller reuse an already-computed bar set (renderReview
// shares the same buildDueHistogramBars result that feeds its "Due now" stat).
// Both variants default to open.
export function buildDueHistogramHtml(opts = {}) {
  const data = opts.data || buildDueHistogramBars();
  if (!data) return '';
  const { total, bars } = data;
  if (opts.collapseKey) {
    return `<details class="analytics-collapse due-histogram-collapse" data-collapse-key="${opts.collapseKey}">`
      + `<summary class="analytics-collapse-summary"><span class="analytics-collapse-caret" aria-hidden="true">▾</span>`
      + `<div class="analytics-collapse-title-wrap"><h4>Due by day <span class="analytics-collapse-meta">${total}</span></h4></div></summary>`
      + `<div class="analytics-collapse-body"><div class="due-hist-bars">${bars}</div></div></details>`;
  }
  const collapsed = (runtime.analyticsCollapsed || {})['dueByDayPanel'] === true;
  return `<details class="due-histogram"${collapsed ? '' : ' open'} ontoggle="onDueHistogramToggle('dueByDayPanel', this)">`
    + `<summary class="due-hist-summary">Due by day <span class="due-hist-meta">${total}</span></summary>`
    + `<div class="due-hist-bars">${bars}</div></details>`;
}

export function renderReview() {
  const panel = document.getElementById('reviewPanel');
  if (!panel) return;
  panel.classList.add('show');

  // Parsing mode has no card-level confidence stats (no SRS / no main-stats
  // writes), so the standard "due now / high / low / unseen" buckets would
  // all read 0 + "unseen". Render a per-paradigm rolling-window summary
  // instead — same paradigmStepStats that the analytics tile uses, scoped
  // to the lemmas the user has actually parsed.
  if (host.isParsingMode && host.isParsingMode()) {
    renderParsingReviewPanel();
    return;
  }

  // Bucket the deck by confidence so the progress frame stays focused on
  // certainty rather than raw activity counts. A card is "high" when its
  // confidence reads above 75%; everything else (including unseen) is "low".
  // Folding unseen into low keeps the two-row review stats consistent — the
  // high/low totals always equal the deck size.
  let highCount = 0;
  let lowCount = 0;
  runtime.originalDeck.forEach(card => {
    const progress = host.getWordProgress(card.id);
    const pct = getConfidencePct(progress);
    if (pct !== null && pct > 75) highCount += 1;
    else lowCount += 1;
  });
  // Three-section partition: active (in deck right now), middle (waiting to
  // dump in), and the rest (deferred in spaced / archived in unspaced).
  // Two-row display: row 1 surfaces the deck partition; row 2 surfaces
  // confidence. Row totals each equal the deck size.
  const inDeckCount = runtime.activeDeckCount;
  const middleCount = runtime.spacedRepetition
    ? (runtime.middleDeckCount || 0)
    : (runtime.unspacedMiddleCount || 0);
  const totalCount = runtime.originalDeck.length;
  // "Due now" is the current study session: the active rotation + the middle
  // pile (due cards parked to shuffle in before the session ends). The middle
  // pile grows as cards come due across rebuilds. The histogram's "now" column
  // is built from the same active+middle set, so the stat, the "Due later"
  // remainder, and the chart agree.
  const histData = runtime.spacedRepetition ? buildDueHistogramBars() : null;
  const sessionDueCount = inDeckCount + middleCount;
  const laterCount = runtime.spacedRepetition
    ? Math.max(totalCount - sessionDueCount, 0)
    : host.getKnownCount();
  const sessionDueLabel = runtime.spacedRepetition ? 'Due now' : 'Unconfirmed';
  const laterLabel = runtime.spacedRepetition ? 'Due later' : 'Archived';

  const deckTagEl = document.getElementById('reviewDeckTag');
  if (deckTagEl) {
    deckTagEl.textContent = host.isMorphologyMode()
      ? 'Grammar deck'
      : (runtime.requiredOnly ? 'Required-only deck' : 'Full deck');
  }

  document.getElementById('reviewStats').innerHTML = `
      <div class="review-stats-row">
        <span class="stat-deck">▦ In deck: ${inDeckCount}</span>
        <span class="stat-deck">● ${sessionDueLabel}: ${sessionDueCount}</span>
        <span class="stat-total">⌛ ${laterLabel}: ${laterCount}</span>
      </div>
      <div class="review-stats-row">
        <span class="stat-known">✓ High confidence: ${highCount}</span>
        <span class="stat-unsure">○ Low confidence: ${lowCount}</span>
      </div>
      ${buildDueHistogramHtml({ data: histData })}`;

  const sortMode = runtime.reviewSortMode === 'confidence' ? 'confidence'
    : runtime.reviewSortMode === 'alphabetical' ? 'alphabetical'
    : 'lastSeen';
  const sortRowEl = document.getElementById('reviewSortRow');
  if (sortRowEl) {
    const btn = (mode, label) => {
      const active = sortMode === mode;
      return `<button type="button" class="ctrl-btn chapter-detail-sort-btn${active ? ' active-toggle' : ''}" onclick="setReviewSortMode('${mode}')" aria-pressed="${active ? 'true' : 'false'}">${label}</button>`;
    };
    sortRowEl.innerHTML = `
      <span class="review-sort-label">Sort</span>
      <div class="review-sort-group" role="group" aria-label="Sort cards">
        ${btn('lastSeen', 'Last seen')}
        ${btn('alphabetical', 'A–Ω')}
        ${btn('confidence', 'Confidence')}
      </div>`;
  }

  let listHtml = '';
  const visibleRows = runtime.originalDeck
    .map((card, idx) => ({ card, idx }))
    .filter(({ card }) => {
      const status = runtime.marks[card.id];
      const progress = host.getWordProgress(card.id);
      return status || progress.seenCount;
    });

  if (sortMode === 'confidence') {
    // Raw confidence pct from getConfidencePct (no smoothing) so the lowest
    // recall rises to the top of the drill list. Null (unseen) is treated as
    // -1 so it sorts above 0% — unseen cards are typically the most urgent
    // signal of "haven't touched this yet". Ties break alphabetically.
    visibleRows.sort((a, b) => {
      const pa = getConfidencePct(host.getWordProgress(a.card.id));
      const pb = getConfidencePct(host.getWordProgress(b.card.id));
      const va = pa === null ? -1 : pa;
      const vb = pb === null ? -1 : pb;
      if (va !== vb) return va - vb;
      return compareGreekAlphabetical(a.card, b.card);
    });
  } else if (sortMode === 'lastSeen') {
    // Most recently reviewed first, so the card just answered tops the list.
    // Rows with no lastReviewedAt (marked but never graded, e.g. imported
    // marks) sink to the bottom. Ties break alphabetically.
    visibleRows.sort((a, b) => {
      const ta = host.getWordProgress(a.card.id).lastReviewedAt || 0;
      const tb = host.getWordProgress(b.card.id).lastReviewedAt || 0;
      if (ta !== tb) return tb - ta;
      return compareGreekAlphabetical(a.card, b.card);
    });
  } else {
    visibleRows.sort((a, b) => compareGreekAlphabetical(a.card, b.card));
  }

  visibleRows.forEach(({ card }) => {
      const status = runtime.marks[card.id];
      const progress = host.getWordProgress(card.id);
      const confidencePct = getConfidencePct(progress);
      const confidenceMeta = confidencePct === null ? 'confidence —' : `confidence ${confidencePct}%`;
      const srsMeta = runtime.spacedRepetition
        ? `<span style="display:block;color:var(--muted);font-size:12px">${progress.dueAt && progress.dueAt > Date.now() ? `due in ${formatRemainingForTable(progress.dueAt)}` : 'due now'} · seen ×${progress.seenCount || 0} · ${confidenceMeta}</span>`
        : (progress.seenCount || progress.passCount || progress.failCount)
          ? `<span style="display:block;color:var(--muted);font-size:12px">seen ×${progress.seenCount || 0} · ${confidenceMeta}</span>`
          : '';
      const returnBtn = `<button class="return-btn" title="Return this card to circulation now" onclick="returnSeenCardToDeck('${encodeURIComponent(card.id)}')">✕</button>`;
      listHtml += `<div class="review-item">
        <span class="rg">${getCardReviewLeft(card)}${srsMeta}</span>
        <span class="re">${getCardReviewRight(card)}<span style="display:block;color:var(--muted);font-size:12px">${getCardMetaLine(card)}</span></span>
        <span class="rb ${status || 'unsure'}">${status === 'known' ? '✓' : '○'}</span>
        ${returnBtn}
      </div>`;
    });
  document.getElementById('reviewList').innerHTML = listHtml || '<span style="color:var(--muted);font-size:14px;font-style:italic">Mark cards as you study to track your progress in this direction.</span>';
}

function escapeHtmlSmall(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// A compact "weakest: <value> <pct>%" pointer for a collapsed paradigm row.
// The headline pct can read healthy while one mood/tense lags, so this calls
// out the worst seen value. Dot colour tracks the shared 5-band gradient.
function parsingWeakestTagHtml(weakest) {
  if (!weakest) return '';
  const band = weakest.pct < 20 ? 'stacked-seg-b0'
    : weakest.pct < 40 ? 'stacked-seg-b20'
    : weakest.pct < 60 ? 'stacked-seg-b40'
    : weakest.pct < 80 ? 'stacked-seg-b60'
    : 'stacked-seg-b80';
  return `<span class="parsing-review-weakest"><span class="parsing-review-weakest-dot ${band}"></span>weakest: ${escapeHtmlSmall(weakest.label)} ${weakest.pct}%</span>`;
}

// Replacement for renderReview when in parsing mode. The standard
// confidence/seen/unseen breakdown doesn't apply (parsing has no SRS or
// main-stats writes); instead we surface the per-lemma rolling-window
// stats from runtime.paradigmStepStats — same data the analytics tile
// uses — so the bottom panel becomes "here's how each paradigm I've
// drilled is going."
//
// Each row is tappable: tapping expands an inline per-value breakdown
// (accuracy per tense, mood, voice, … on the shared 5-band gradient).
// The "All paradigms" row at the top aggregates across every drilled
// paradigm. Expansion state is tracked separately from the analytics
// tile (runtime.parsingReviewExpanded) so opening a row here doesn't
// auto-open the same row inside the analytics overlay.
function renderParsingReviewPanel() {
  const deckTagEl = document.getElementById('reviewDeckTag');
  if (deckTagEl) deckTagEl.textContent = 'Paradigm parsing';

  const stats = runtime.paradigmStepStats || {};
  const enabledDims = host.getEnabledParsingDims();
  const allStats = getAllLemmaStats(stats, enabledDims);
  const drilledByLemma = new Map(allStats.map((s) => [s.lemma, s]));

  // Memoize the chapter-gated form pool per lemma — it's read once to decide
  // whether a paradigm has anything in scope and again to fold its breakdown,
  // and the default view walks every in-scope paradigm (not just drilled ones).
  const cardCache = new Map();
  const cardsFor = (lemma) => {
    if (!cardCache.has(lemma)) cardCache.set(lemma, host.getMorphCardsForLemma(lemma) || []);
    return cardCache.get(lemma);
  };

  // Which paradigms the panel lists:
  //  • Custom-set mode — a live scorecard for the hand-picked deck: the
  //    *selected* paradigms (ticked in runtime.parsingCustomParadigms),
  //    including selected-but-undrilled ones, with drilled paradigms outside
  //    the set dropped. No paradigm is pinned (the dropdown is hidden).
  //  • Default — every in-scope paradigm whose chapter gate the current
  //    selection has met (host.getInScopeParadigmLemmas), so unseen-but-in-scope
  //    paradigms show too, unioned with any already-drilled paradigm (so a form
  //    attempted earlier never vanishes if the chapter selection later narrows).
  //    The focused paradigm pins to the top.
  // The analytics overlay is untouched — it always keeps the full all-paradigms
  // view regardless of mode.
  const customMode = !!runtime.parsingCustomReview;
  const focused = customMode ? '' : (runtime.morphFocusedParadigm || '');

  const entryFor = (lemma) => drilledByLemma.get(lemma) || { lemma, attempts: 0 };
  let baseStats;
  if (customMode) {
    const selectedMap = runtime.parsingCustomParadigms || {};
    baseStats = Object.keys(selectedMap)
      .filter((lemma) => selectedMap[lemma])
      .map(entryFor)
      .filter((s) => cardsFor(s.lemma).length > 0);
  } else {
    const order = [];
    const seenLemma = new Set();
    const pushLemma = (lemma) => { if (lemma && !seenLemma.has(lemma)) { seenLemma.add(lemma); order.push(lemma); } };
    (host.getInScopeParadigmLemmas() || []).forEach(pushLemma);
    allStats.forEach((s) => pushLemma(s.lemma));
    // Keep a lemma if it has in-scope forms (chapter gate met) OR it's been
    // drilled (so an attempt under a now-out-of-scope chapter still shows).
    baseStats = order
      .map(entryFor)
      .filter((s) => cardsFor(s.lemma).length > 0 || drilledByLemma.has(s.lemma));
  }

  // Each paradigm's breakdown comes from its in-scope forms (up to two recent
  // attempts per form, chapter-gated), folded into the cross-paradigm
  // accumulator so the overall row matches the per-lemma rows. The headline %
  // is this per-form tally — every form, not a capped rolling window —
  // consistent with the bars.
  const overallAcc = createValueBreakdownAcc();
  const lemmaBreakdowns = new Map();
  baseStats.forEach((s) => {
    const cards = cardsFor(s.lemma);
    accumulateValueBreakdown(overallAcc, stats, s.lemma, cards, enabledDims);
    lemmaBreakdowns.set(s.lemma, summarizeLemmaValueBreakdown(stats, s.lemma, cards, enabledDims));
  });
  const pctOf = (lemma) => {
    const b = lemmaBreakdowns.get(lemma);
    return b && b.totals ? b.totals.pct : null;
  };

  // Focused paradigm pinned on top; the rest worst-first by per-form accuracy
  // (paradigms with nothing seen yet sink to the bottom).
  const focusedEntry = focused ? baseStats.find((s) => s.lemma === focused) : null;
  const otherEntries = focused ? baseStats.filter((s) => s.lemma !== focused) : baseStats.slice();
  otherEntries.sort((a, b) => {
    const pa = pctOf(a.lemma), pb = pctOf(b.lemma);
    if (pa == null && pb == null) return 0;
    if (pa == null) return 1;
    if (pb == null) return -1;
    return pa - pb;
  });
  const ordered = focusedEntry ? [focusedEntry, ...otherEntries] : otherEntries;

  const shownCount = ordered.length;
  const drilledCount = ordered.filter((s) => drilledByLemma.has(s.lemma)).length;
  const deckLabel = customMode
    ? `▦ Custom set: ${shownCount}`
    : `▦ Paradigms: ${drilledCount} drilled · ${shownCount} in scope`;

  document.getElementById('reviewStats').innerHTML = `
    <div class="review-stats-row">
      <span class="stat-deck">${deckLabel}</span>
      <span class="stat-total">· Tap any row to break it down by mood, tense, and voice</span>
    </div>`;

  const sortRowEl = document.getElementById('reviewSortRow');
  if (sortRowEl) sortRowEl.innerHTML = '';

  const expandedKey = runtime.parsingReviewExpanded;

  // Overall row (always rendered, even when no paradigms have been drilled,
  // so the user can see the empty state). When ordered is empty, only the
  // overall row + empty hint appear.
  const { groups: overallGroups, weakest: overallWeakest, totals: overallTotals } = finalizeValueBreakdown(overallAcc);
  const overallPct = overallTotals.pct;
  const overallPctClass = overallPct == null ? 'parsing-review-pct-mid'
    : overallPct >= 80 ? 'parsing-review-pct-high'
    : overallPct >= 50 ? 'parsing-review-pct-mid'
    : 'parsing-review-pct-low';
  const overallExpanded = expandedKey === '__overall';
  const overallRow = `
    <div class="parsing-review-row parsing-review-row-overall${overallExpanded ? ' parsing-review-row-active' : ''}"
         role="button"
         tabindex="0"
         aria-expanded="${overallExpanded ? 'true' : 'false'}"
         data-parsing-row="__overall">
      <div class="parsing-review-header">
        <span class="parsing-review-lemma parsing-review-lemma-overall">${customMode ? 'Selected paradigms' : 'All paradigms'}</span>
        <span class="parsing-review-pct ${overallPctClass}">${overallPct == null ? '—' : `${overallPct}%`}</span>
        <span class="parsing-review-attempts">${overallTotals.seen}/${overallTotals.scope} forms · ${shownCount} paradigm${shownCount === 1 ? '' : 's'}</span>
      </div>
      ${overallWeakest ? `<div class="parsing-review-weakline">${parsingWeakestTagHtml(overallWeakest)}</div>` : ''}
      ${overallExpanded ? `<div class="parsing-review-chart">${buildDimValueBarsHtml(overallGroups, { caption: `Per-dimension accuracy per value, across ${customMode ? 'your selected paradigms' : 'every paradigm'} · seen / in scope` })}</div>` : ''}
    </div>`;

  if (!ordered.length) {
    document.getElementById('reviewList').innerHTML = `
      <div class="parsing-review-list">${overallRow}</div>
      <span style="color:var(--muted);font-size:14px;font-style:italic">${customMode ? 'Pick at least one paradigm in the custom set to see its accuracy here.' : 'No paradigms are in scope for parsing at your current chapter selection.'}</span>`;
    bindParsingReviewInteractivity();
    return;
  }

  const lemmaRows = ordered.map((s) => {
    const { groups, weakest, totals } = lemmaBreakdowns.get(s.lemma)
      || { groups: [], weakest: null, totals: { pct: null, seen: 0, scope: 0 } };
    const pct = totals.pct;
    const pctClass = pct == null ? 'parsing-review-pct-mid'
      : pct >= 80 ? 'parsing-review-pct-high' : pct >= 50 ? 'parsing-review-pct-mid' : 'parsing-review-pct-low';
    const focusBadge = s.lemma === focused
      ? '<span class="parsing-review-focused-badge">FOCUSED</span>'
      : '';
    const isExpanded = expandedKey === s.lemma;
    const breakdownHtml = isExpanded ? buildDimValueBarsHtml(groups) : '';
    // Keep the full per-form list (every in-scope morph, colour-dotted by its
    // recent status) below the breakdown on expand.
    const formsHtml = isExpanded ? buildLemmaTestableFormsHtml(s.lemma) : '';
    return `
      <div class="parsing-review-row${isExpanded ? ' parsing-review-row-active' : ''}"
           role="button"
           tabindex="0"
           aria-expanded="${isExpanded ? 'true' : 'false'}"
           data-parsing-row="${escapeHtmlSmall(s.lemma)}">
        <div class="parsing-review-header">
          <span class="parsing-review-lemma">${escapeHtmlSmall(s.lemma)}</span>
          ${focusBadge}
          <span class="parsing-review-pct ${pctClass}">${pct == null ? '—' : `${pct}%`}</span>
          <span class="parsing-review-attempts">${totals.seen}/${totals.scope} forms</span>
        </div>
        ${weakest ? `<div class="parsing-review-weakline">${parsingWeakestTagHtml(weakest)}</div>` : ''}
        ${isExpanded ? `<div class="parsing-review-chart">${breakdownHtml}</div>${formsHtml}` : ''}
      </div>`;
  }).join('');

  document.getElementById('reviewList').innerHTML =
    `<div class="parsing-review-list">${overallRow}${lemmaRows}</div>`;
  bindParsingReviewInteractivity();
}

function bindParsingReviewInteractivity() {
  const list = document.querySelector('#reviewList .parsing-review-list');
  if (!list || list.dataset.parsingRowsBound === '1') return;
  list.dataset.parsingRowsBound = '1';
  const toggle = (key) => {
    if (!key) return;
    runtime.parsingReviewExpanded = runtime.parsingReviewExpanded === key ? null : key;
    renderParsingReviewPanel();
  };
  list.addEventListener('click', (event) => {
    // Inner per-form rows are non-interactive so a click on one shouldn't
    // collapse the parent paradigm row.
    if (event.target.closest('.parsing-review-form-row')) return;
    const row = event.target.closest('[data-parsing-row]');
    if (!row || !list.contains(row)) return;
    toggle(row.dataset.parsingRow || '');
  });
  list.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const row = event.target.closest('[data-parsing-row]');
    if (!row || !list.contains(row)) return;
    event.preventDefault();
    toggle(row.dataset.parsingRow || '');
  });
}

// Compact parse-string formatter for the testable-forms list, where the
// column is narrow and the canonical long-form ("present active indicative
// first person singular") truncates with ellipsis on a phone. Maps every
// canonical token to its short form (pres / act / ind / 1sg / nom / masc /
// …) so the full parse fits in the column unabbreviated. Multi-word
// person+number tokens collapse first ("first person singular" → "1sg")
// before the single-word substitutions so they don't get half-replaced.
const PARSE_PHRASE_ABBREVS = [
  ['first person singular', '1sg'],
  ['second person singular', '2sg'],
  ['third person singular', '3sg'],
  ['first person plural', '1pl'],
  ['second person plural', '2pl'],
  ['third person plural', '3pl'],
  ['first person', '1'],
  ['second person', '2'],
  ['third person', '3'],
  ['second aorist', '2aor'],
  ['first aorist', '1aor'],
  ['middle/passive', 'm/p'],
  ['middle or passive', 'm/p']
];
const PARSE_WORD_ABBREVS = {
  present: 'pres', future: 'fut', imperfect: 'impf',
  aorist: 'aor', perfect: 'pf', pluperfect: 'plpf',
  active: 'act', middle: 'mid', passive: 'pass',
  indicative: 'ind', subjunctive: 'subj', imperative: 'impv',
  infinitive: 'inf', participle: 'ptcp',
  singular: 'sg', plural: 'pl',
  nominative: 'nom', accusative: 'acc', genitive: 'gen', dative: 'dat', vocative: 'voc',
  masculine: 'masc', feminine: 'fem', neuter: 'neut'
};
function abbreviateParse(text) {
  if (!text) return '';
  let out = String(text);
  for (const [from, to] of PARSE_PHRASE_ABBREVS) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), to);
  }
  for (const [from, to] of Object.entries(PARSE_WORD_ABBREVS)) {
    out = out.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
  }
  return out;
}

// Lists every form currently in scope for `lemma` (chapter-gated, and
// including optional-extension forms iff the user has the toggle on)
// under the expanded paradigm row. Each form is dotted with its last-
// attempt outcome so the panel reads as "here's what I can drill for
// εἰμί, and here's how I did the last time I saw each one." The pool
// matches getCardsForFocusedParadigm exactly — same dedup/supersession,
// same chapter cap — so the user's mental model of the deck aligns with
// what's shown.
function buildLemmaTestableFormsHtml(lemma) {
  const cards = host.getMorphCardsForLemma(lemma) || [];
  if (!cards.length) {
    return `<div class="parsing-review-forms parsing-review-forms-empty">No forms in scope for this paradigm at your current chapter selection.</div>`;
  }
  // Pass the card objects, not bare form strings: the comparator derives its
  // sort key from card.kind/card.form, so a plain string degrades to an empty
  // key and the whole sort becomes a no-op.
  const sorted = cards.slice().sort(compareGreekAlphabetical);
  const stats = runtime.paradigmStepStats || {};
  const enabledDims = host.getEnabledParsingDims();
  const counts = { known: 0, right: 0, wrong: 0, uncertain: 0, unseen: 0 };
  const rows = sorted.map((card) => {
    const status = getLemmaFormStatus(stats, lemma, card.id, enabledDims);
    counts[status] += 1;
    const dotClass = status === 'known' ? 'parsing-review-form-dot-known'
      : status === 'right' ? 'parsing-review-form-dot-right'
      : status === 'wrong' ? 'parsing-review-form-dot-wrong'
      : status === 'uncertain' ? 'parsing-review-form-dot-uncertain'
      : 'parsing-review-form-dot-unseen';
    const statusLabel = status === 'known' ? 'both recent attempts correct'
      : status === 'right' ? 'recent attempt correct'
      : status === 'wrong' ? 'recent attempts all wrong'
      : status === 'uncertain' ? '1 of last 2 attempts correct'
      : 'not yet attempted';
    const parseFull = card.parsedAnswer || card.answer || '';
    const parseShort = abbreviateParse(parseFull);
    // A ✕ that drops this form's recent tally so it re-enters the deck under
    // "skip confident" (exclude-known-morphs). Unseen forms have no tally to
    // clear, so they get an invisible placeholder that keeps the grid column
    // aligned without offering a no-op button.
    const clearBtn = status === 'unseen'
      ? '<span class="parsing-review-form-clear placeholder" aria-hidden="true">✕</span>'
      : `<button type="button" class="parsing-review-form-clear" title="Clear this form's recent tally so it re-enters the deck" aria-label="Clear recent tally for ${escapeHtmlSmall(card.form || '')}" onclick="clearParsingMorph('${encodeURIComponent(lemma)}','${encodeURIComponent(card.id)}')">✕</button>`;
    return `
      <li class="parsing-review-form-row">
        <span class="parsing-review-form-dot ${dotClass}" title="${escapeHtmlSmall(statusLabel)}" aria-label="${escapeHtmlSmall(statusLabel)}"></span>
        <span class="parsing-review-form-greek">${escapeHtmlSmall(card.form || '')}</span>
        <span class="parsing-review-form-parse" title="${escapeHtmlSmall(parseFull)}">${escapeHtmlSmall(parseShort)}</span>
        ${clearBtn}
      </li>`;
  }).join('');
  const summary = `${counts.known} known · ${counts.right} correct · ${counts.uncertain} uncertain · ${counts.wrong} missed · ${counts.unseen} unseen`;
  return `
    <div class="parsing-review-forms">
      <div class="parsing-review-forms-header">
        <span class="parsing-review-forms-title">Testable forms (${sorted.length})</span>
        <span class="parsing-review-forms-summary">${escapeHtmlSmall(summary)}</span>
      </div>
      <ul class="parsing-review-forms-list">${rows}</ul>
    </div>`;
}

// ✕ handler for a single testable form. Drops that form's recent tally so it
// reads as 'unseen' again (its per-paradigm rolling %, buckets, and the
// overall aggregate are left intact — same scoping as resetKnownMorphs but
// for one form). A full deck rebuild is only needed when the form was
// actually being excluded by "skip confident" (exclude-known-morphs on AND
// the form was 2/2 known): clearing it re-admits it to the deck. For any
// other form the membership doesn't change, so we just refresh the review
// panel + persist — rebuilding would needlessly reset the user's deck cursor.
export function clearParsingMorph(encodedLemma, encodedCardId) {
  const lemma = decodeURIComponent(encodedLemma);
  const cardId = decodeURIComponent(encodedCardId);
  const stats = runtime.paradigmStepStats;
  const wasExcluded = !!runtime.excludeKnownMorphs
    && isLemmaFormKnown(stats, lemma, cardId, host.getEnabledParsingDims());
  if (!clearLemmaFormRecent(stats, lemma, cardId)) return;
  if (wasExcluded) {
    host.rebuildParsingDeck();
    return;
  }
  renderReview();
  host.saveState();
}

// Sort-mode toggle for the per-deck progress list. Lives in runtime only —
// the user's pick resets to 'lastSeen' on reload, matching how the
// analytics chapter sort behaves.
export function setReviewSortMode(mode) {
  const next = mode === 'confidence' || mode === 'alphabetical' ? mode : 'lastSeen';
  if (runtime.reviewSortMode === next) return;
  runtime.reviewSortMode = next;
  renderReview();
}

// Return a previously-known card to the active deck. Flips its mark back to
// 'unsure', clears its due timer, and rebuilds the deck so the card lands at
// the back (per buildStudyDeck's newly-eligible logic).
export function returnSeenCardToDeck(encodedId) {
  const cardId = decodeURIComponent(encodedId);
  const card = runtime.originalDeck.find(c => c.id === cardId);
  if (!card) return;

  host.moveCardToBackOfActivePile(card);

  // Writes scheduling fields, so the entry must be persisted into the store.
  const progress = host.getWordProgress(cardId, { persist: true });
  progress.dueAt = Date.now();
  progress.intervalDays = 0;
  progress.streak = 0;
  progress.easyStreak = 0;
  progress.srsStage = Math.max(0, getSrsStage(progress) - 1);

  if (runtime.spacedRepetition) {
    runtime.deck = host.buildStudyDeck(runtime.originalDeck);
    const dueIdx = runtime.deck.findIndex(c => c.id === cardId);
    if (dueIdx >= 0 && dueIdx < runtime.activeDeckCount) {
      runtime.currentIdx = dueIdx;
      runtime.isFlipped = false;
    } else if (runtime.activeDeckCount > 0) {
      runtime.currentIdx = Math.min(runtime.currentIdx, runtime.activeDeckCount - 1);
    }
  } else {
    const returnedIdx = runtime.deck.findIndex(c => c.id === cardId);
    runtime.currentIdx = returnedIdx >= 0 ? returnedIdx : Math.min(runtime.currentIdx, Math.max(runtime.deck.length - 1, 0));
    runtime.isFlipped = false;
  }

  host.renderCard();
  renderProgress();
  renderReview();
  host.saveState();
}
