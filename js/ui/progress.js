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
  getParadigmStepDimensionLabel,
  getParadigmStepAttemptWindow,
  getParadigmBucketHistorySize,
  getLemmaBucketSeries,
  getOverallBucketSeries,
  summarizeOverallRolling
} from '../domain/grammar/morph_steps.js';
import { buildParadigmBucketBarsHtml } from './charts.js';

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
  isMorphologyMode: () => false,
  isParsingMode: () => false,
  renderAnalyticsOverlay: () => {},
  moveCardToBackOfActivePile: () => {},
  buildStudyDeck: () => [],
  renderCard: () => {},
  saveState: () => {}
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
  const sessionDueCount = inDeckCount + middleCount;
  const totalCount = runtime.originalDeck.length;
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
      </div>`;

  const sortMode = runtime.reviewSortMode === 'confidence' ? 'confidence' : 'alphabetical';
  const sortRowEl = document.getElementById('reviewSortRow');
  if (sortRowEl) {
    const btn = (mode, label) => {
      const active = sortMode === mode;
      return `<button type="button" class="ctrl-btn chapter-detail-sort-btn${active ? ' active-toggle' : ''}" onclick="setReviewSortMode('${mode}')" aria-pressed="${active ? 'true' : 'false'}">${label}</button>`;
    };
    sortRowEl.innerHTML = `
      <span class="review-sort-label">Sort</span>
      <div class="review-sort-group" role="group" aria-label="Sort cards">
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

// Replacement for renderReview when in parsing mode. The standard
// confidence/seen/unseen breakdown doesn't apply (parsing has no SRS or
// main-stats writes); instead we surface the per-lemma rolling-window
// stats from runtime.paradigmStepStats — same data the analytics tile
// uses — so the bottom panel becomes "here's how each paradigm I've
// drilled is going."
//
// Each row is tappable: tapping expands an inline performance bar chart
// (10 disjoint 20-attempt buckets + an in-progress trailing column).
// The "All paradigms" row at the top aggregates across every drilled
// paradigm. Expansion state is tracked separately from the analytics
// tile (runtime.parsingReviewExpanded) so opening a row here doesn't
// auto-open the same row inside the analytics overlay.
function renderParsingReviewPanel() {
  const deckTagEl = document.getElementById('reviewDeckTag');
  if (deckTagEl) deckTagEl.textContent = 'Paradigm parsing';

  const focused = runtime.morphFocusedParadigm || '';
  const stats = runtime.paradigmStepStats || {};
  const allStats = getAllLemmaStats(stats);

  // Pull out the currently-focused paradigm so it always reads at the top,
  // even if other paradigms have more attempts.
  const focusedEntry = allStats.find((s) => s.lemma === focused);
  const otherEntries = allStats.filter((s) => s.lemma !== focused);
  otherEntries.sort((a, b) => b.attempts - a.attempts);
  const ordered = focusedEntry ? [focusedEntry, ...otherEntries] : otherEntries;

  const attemptWindow = getParadigmStepAttemptWindow();
  const bucketHistory = getParadigmBucketHistorySize();
  const drilledCount = ordered.length;

  document.getElementById('reviewStats').innerHTML = `
    <div class="review-stats-row">
      <span class="stat-deck">▦ Paradigms drilled: ${drilledCount}</span>
      <span class="stat-total">· Tap any row for the ${bucketHistory}-bucket chart (${attemptWindow} parses each)</span>
    </div>`;

  const sortRowEl = document.getElementById('reviewSortRow');
  if (sortRowEl) sortRowEl.innerHTML = '';

  const expandedKey = runtime.parsingReviewExpanded;

  // Overall row (always rendered, even when no paradigms have been drilled,
  // so the user can see the empty-state of the chart). When ordered is
  // empty, only the overall row + empty hint appear.
  const overallSummary = summarizeOverallRolling(stats);
  const overallBucketSeries = getOverallBucketSeries(stats);
  const overallPct = Math.round(100 * overallSummary.correct / Math.max(1, overallSummary.total));
  const overallPctClass = !overallSummary.total ? 'parsing-review-pct-mid'
    : overallPct >= 80 ? 'parsing-review-pct-high'
    : overallPct >= 50 ? 'parsing-review-pct-mid'
    : 'parsing-review-pct-low';
  const overallExpanded = expandedKey === '__overall';
  const overallChartHtml = overallExpanded
    ? buildParadigmBucketBarsHtml(
        overallBucketSeries.buckets,
        overallBucketSeries.inProgress,
        { bucketSize: attemptWindow, maxBuckets: bucketHistory, title: 'Overall parsing performance' }
      )
    : '';
  const overallRow = `
    <div class="parsing-review-row parsing-review-row-overall${overallExpanded ? ' parsing-review-row-active' : ''}"
         role="button"
         tabindex="0"
         aria-expanded="${overallExpanded ? 'true' : 'false'}"
         data-parsing-row="__overall">
      <div class="parsing-review-header">
        <span class="parsing-review-lemma parsing-review-lemma-overall">All paradigms</span>
        <span class="parsing-review-pct ${overallPctClass}">${overallSummary.total ? `${overallPct}%` : '—'}</span>
        <span class="parsing-review-attempts">${overallSummary.attempts} attempt${overallSummary.attempts === 1 ? '' : 's'} · ${overallSummary.paradigms} paradigm${overallSummary.paradigms === 1 ? '' : 's'}</span>
      </div>
      ${overallExpanded ? `<div class="parsing-review-chart">${overallChartHtml}</div>` : ''}
    </div>`;

  if (!ordered.length) {
    document.getElementById('reviewList').innerHTML = `
      <div class="parsing-review-list">${overallRow}</div>
      <span style="color:var(--muted);font-size:14px;font-style:italic">Complete a parse to start seeing per-paradigm accuracy here.</span>`;
    bindParsingReviewInteractivity();
    return;
  }

  const lemmaRows = ordered.map((s) => {
    const pct = Math.round(100 * s.correct / Math.max(1, s.total));
    const pctClass = pct >= 80 ? 'parsing-review-pct-high' : pct >= 50 ? 'parsing-review-pct-mid' : 'parsing-review-pct-low';
    const chips = Object.entries(s.perDim).map(([dim, agg]) => {
      const dpct = Math.round(100 * agg.correct / Math.max(1, agg.seen));
      return `<span class="parsing-review-chip">${escapeHtmlSmall(getParadigmStepDimensionLabel(dim))} ${dpct}%</span>`;
    }).join('');
    const focusBadge = s.lemma === focused
      ? '<span class="parsing-review-focused-badge">FOCUSED</span>'
      : '';
    const isExpanded = expandedKey === s.lemma;
    const series = isExpanded ? getLemmaBucketSeries(stats, s.lemma) : null;
    const chartHtml = isExpanded
      ? buildParadigmBucketBarsHtml(series.buckets, series.inProgress, {
          bucketSize: attemptWindow,
          maxBuckets: bucketHistory,
          title: `${s.lemma} parsing performance`
        })
      : '';
    return `
      <div class="parsing-review-row${isExpanded ? ' parsing-review-row-active' : ''}"
           role="button"
           tabindex="0"
           aria-expanded="${isExpanded ? 'true' : 'false'}"
           data-parsing-row="${escapeHtmlSmall(s.lemma)}">
        <div class="parsing-review-header">
          <span class="parsing-review-lemma">${escapeHtmlSmall(s.lemma)}</span>
          ${focusBadge}
          <span class="parsing-review-pct ${pctClass}">${pct}%</span>
          <span class="parsing-review-attempts">${s.attempts}/${attemptWindow} attempts</span>
        </div>
        <div class="parsing-review-chips">${chips}</div>
        ${isExpanded ? `<div class="parsing-review-chart">${chartHtml}</div>` : ''}
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

// Sort-mode toggle for the per-deck progress list. Lives in runtime only —
// the user's pick resets to 'alphabetical' on reload, matching how the
// analytics chapter sort behaves.
export function setReviewSortMode(mode) {
  const next = mode === 'confidence' ? 'confidence' : 'alphabetical';
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
