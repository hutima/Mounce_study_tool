// Analytics overlay: hero summary, level/XP, heatmap, achievements, chapter
// grid, personal records, stubborn-card lists, vocab/grammar progress
// sections, and the celebrate-on-level-up / earned-badge plumbing.
//
// All cumulative state (XP, gamification, expanded chapter/word) lives in
// runtime.* so we read/write it directly. Functions that need host helpers
// (ensureUsageStats, the SRS scheduler primitives, the filters that take
// runtime-mode into account) get them via configureAnalytics.

import { runtime } from '../state/runtime.js';
import { escapeHtml } from '../utils/helpers.js';
import {
  formatUsageDuration,
  formatAnalyticsDate,
  formatAnalyticsDateTime,
  getUsageDayKey
} from '../utils/time.js';
import { getConfidencePct } from '../domain/srs/confidence.js';
import {
  getSelectedVocabCards,
  getSelectedGrammarCards,
  getAllChapterKeys,
  getAllVocabCards,
  getAllGrammarCards,
  getChapterVocabCards
} from '../domain/deck/filters.js';
import {
  migrateLegacyXp as migrateLegacyXpPure,
  computeXpAndLevel as computeXpAndLevelPure,
  computeStudyStreaks,
  computeTodayStats,
  computeAchievements as computeAchievementsPure,
  getRegressionProjection
} from '../domain/gamification/xp.js';
import {
  buildDailyCumulativeSeriesFromMap,
  buildCumulativeConfirmationSeries,
  buildConfirmationHistogram,
  buildHistogramSvg,
  buildLineChartSvg,
  buildHeatmapSvg,
  buildCircularProgressSvg,
  buildLevelBarHtml,
  buildTitleLadderHtml,
  buildWordStatCardHtml
} from './charts.js';
import { showLevelToast, showBadgeToast } from './toast.js';

let host = {
  ensureUsageStats: () => runtime.appUsageStats,
  accumulateActiveStudyTime: () => {},
  canAccessGrammarUi: () => true
};

export function configureAnalytics(deps) {
  host = { ...host, ...deps };
}

// ── Pure wrappers around xp.js that bind runtime stores ────────────────

export function migrateLegacyXp(usage) {
  return migrateLegacyXpPure(usage, runtime.globalWordProgress);
}

export function computeXpAndLevel(usage) {
  return computeXpAndLevelPure(usage, runtime.globalWordProgress);
}

export function computeAchievements(usage, courseData, streaks, sessionCount, todayStats = null) {
  return computeAchievementsPure(usage, courseData, streaks, sessionCount, todayStats, runtime.globalWordMarks);
}

function renderAnalyticsSection(containerId, config) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!config || !config.total) { el.innerHTML = `<div class="analytics-section"><div class="analytics-empty">Select a study set to see this chart.</div></div>`; return; }
  const metrics = config.metrics || [];
  el.innerHTML = `
    <section class="analytics-section">
      <div class="analytics-section-head"><div><h3>${escapeHtml(config.title || 'Analytics')}</h3><p>${escapeHtml(config.subtitle || '')}</p></div></div>
      <div class="analytics-chart-card"><div class="analytics-chart-title">${escapeHtml(config.barTitle)}</div>${config.barSvg}</div>
      <div class="analytics-metrics-grid">${metrics.map(metric => `
          <div class="analytics-metric-card">
            <div class="analytics-metric-label">${escapeHtml(metric.label)}</div>
            <div class="analytics-metric-value">${escapeHtml(metric.value)}</div>
            ${metric.note ? `<div class="analytics-metric-note">${escapeHtml(metric.note)}</div>` : ''}
          </div>
        `).join('')}</div>
      <div class="analytics-chart-card"><div class="analytics-chart-title">${escapeHtml(config.lineTitle)}</div>${config.lineSvg}</div>
    </section>
  `;
}

function buildGamificationSnapshot() {
  const usage = host.ensureUsageStats();
  const sessionHistory = [...usage.studySessionHistory];
  if (usage.currentStudySession && usage.currentStudySession.startedAt) {
    sessionHistory.push({
      startedAt: usage.currentStudySession.startedAt,
      endedAt: usage.lastStudyCountedAt || Date.now(),
      durationMs: usage.currentStudySession.durationMs || 0,
      interactionCount: usage.currentStudySession.interactionCount || 0
    });
  }
  const streaks = computeStudyStreaks(usage.activeDailyMs);
  const courseData = computeCourseWideData();
  const g2eProgressStore = runtime.globalWordProgress.g2e || {};
  const e2gProgressStore = runtime.globalWordProgress.e2g || {};
  const morphProgressStore = runtime.globalWordProgress.morph || {};
  const mergedProgressStore = {};
  [g2eProgressStore, e2gProgressStore, morphProgressStore].forEach(store => {
    Object.entries(store).forEach(([cardId, entry]) => {
      const existing = mergedProgressStore[cardId] || {};
      mergedProgressStore[cardId] = {
        ...existing,
        ...entry,
        lastReviewedAt: Math.max(Number(existing.lastReviewedAt) || 0, Number(entry?.lastReviewedAt) || 0),
        firstConfirmedAt: Math.max(Number(existing.firstConfirmedAt) || 0, Number(entry?.firstConfirmedAt) || 0)
      };
    });
  });
  const allCourseCards = [...courseData.allVocabCards, ...courseData.allGrammarCards];
  const mergedMarks = { ...(runtime.globalWordMarks.g2e || {}), ...(runtime.globalWordMarks.e2g || {}), ...(runtime.globalWordMarks.morph || {}) };
  const todayStats = computeTodayStats(usage.activeDailyMs, allCourseCards, mergedMarks, mergedProgressStore);
  const achievements = computeAchievements(usage, courseData, streaks, sessionHistory.length, todayStats);
  return { usage, sessionHistory, streaks, courseData, todayStats, achievements };
}

export function syncEarnedAchievementSnapshot() {
  const snapshot = buildGamificationSnapshot();
  runtime.appGamification.lastEarnedAchievementIds = snapshot.achievements.filter(a => a.earned).map(a => a.id);
  runtime.appGamification.lastCelebratedBadgeDay = getUsageDayKey();
  return snapshot;
}

export function maybeCelebrateLevelUp() {
  const usage = host.ensureUsageStats();
  const xpData = computeXpAndLevel(usage);
  const currentLevel = xpData.currentLevel?.level || 1;
  const previousLevel = Number.isFinite(runtime.appGamification.lastCelebratedLevel) && runtime.appGamification.lastCelebratedLevel >= 1
    ? runtime.appGamification.lastCelebratedLevel
    : currentLevel;

  if (currentLevel < previousLevel) {
    runtime.appGamification.lastCelebratedLevel = currentLevel;
    return;
  }

  if (currentLevel > previousLevel) {
    showLevelToast(xpData.currentLevel, xpData.totalXp);
  }

  runtime.appGamification.lastCelebratedLevel = currentLevel;
}

export function maybeCelebrateAchievements() {
  const todayKey = getUsageDayKey();
  if (runtime.appGamification.lastCelebratedBadgeDay && runtime.appGamification.lastCelebratedBadgeDay !== todayKey) {
    runtime.appGamification.lastEarnedAchievementIds = (runtime.appGamification.lastEarnedAchievementIds || []).filter(id => id !== 'daily_first_card');
  }

  const snapshot = buildGamificationSnapshot();
  const earnedAchievements = snapshot.achievements.filter(a => a.earned);
  const priorEarnedIds = new Set(Array.isArray(runtime.appGamification.lastEarnedAchievementIds) ? runtime.appGamification.lastEarnedAchievementIds : []);
  const newlyEarned = earnedAchievements.filter(a => !priorEarnedIds.has(a.id));

  newlyEarned.forEach(showBadgeToast);
  runtime.appGamification.lastEarnedAchievementIds = earnedAchievements.map(a => a.id);
  runtime.appGamification.lastCelebratedBadgeDay = todayKey;
}

function computeCourseWideData() {
  const allVocab = getAllVocabCards(false);
  const reqVocab = getAllVocabCards(true);
  const allGrammar = getAllGrammarCards();

  // Use g2e marks/progress as the canonical direction for course completion;
  // grammar uses the morph store regardless of which mode is currently active.
  const g2eMarks = runtime.globalWordMarks.g2e || {};
  const morphMarks = runtime.globalWordMarks.morph || {};
  const g2eProgress = runtime.globalWordProgress.g2e || {};
  const morphProgress = runtime.globalWordProgress.morph || {};

  const isEffectivelyConfirmed = (card, marksMap, store) => {
    if (marksMap[card.id] === 'known') return true;
    const pct = getConfidencePct(store?.[card.id]);
    return pct !== null && pct >= 70;
  };
  const allVocabConfirmed = allVocab.filter(c => isEffectivelyConfirmed(c, g2eMarks, g2eProgress)).length;
  const reqVocabConfirmed = reqVocab.filter(c => isEffectivelyConfirmed(c, g2eMarks, g2eProgress)).length;
  const allGrammarConfirmed = allGrammar.filter(c => isEffectivelyConfirmed(c, morphMarks, morphProgress)).length;

  return {
    allVocabTotal: allVocab.length,
    allVocabConfirmed,
    allVocabCards: allVocab,
    reqVocabTotal: reqVocab.length,
    reqVocabConfirmed,
    reqVocabCards: reqVocab,
    allGrammarTotal: allGrammar.length,
    allGrammarConfirmed,
    allGrammarCards: allGrammar
  };
}

function computeChapterMastery(progressStore, marksStore) {
  const marksMap = marksStore || runtime.globalWordMarks.g2e || {};
  const store = progressStore || runtime.globalWordProgress.g2e || {};
  const isConfirmed = (card) => {
    if (marksMap[card.id] === 'known') return true;
    const pct = getConfidencePct(store?.[card.id]);
    return pct !== null && pct >= 70;
  };
  return getAllChapterKeys().map(chKey => {
    const cards = getChapterVocabCards(chKey, false);
    const total = cards.length;
    const confirmed = cards.filter(isConfirmed).length;
    return { chapterKey: chKey, total, confirmed, pct: total ? confirmed / total : 0 };
  });
}

function buildChapterGridHtml(mastery) {
  if (!mastery.length) return '';
  const expandedKey = runtime.analyticsExpandedChapter || '';
  const tile = (row) => {
    const pctRound = Math.round(row.pct * 100);
    const label = `Ch. ${row.chapterKey}: ${row.confirmed} / ${row.total} (${pctRound}%) — tap for word stats`;
    let className = 'chapter-tile';
    if (row.pct >= 0.9) className += ' tile-mastered';
    else if (row.pct >= 0.7) className += ' tile-confirmed';
    else if (row.pct > 0) className += ' tile-building';
    else className += ' tile-empty';
    if (String(row.chapterKey) === expandedKey) className += ' chapter-tile-active';
    return `<button type="button" class="${className}" data-chapter="${escapeHtml(String(row.chapterKey))}" title="${escapeHtml(label)}" aria-expanded="${String(row.chapterKey) === expandedKey ? 'true' : 'false'}"><span class="chapter-tile-num">${escapeHtml(row.chapterKey)}</span><span class="chapter-tile-pct">${pctRound}%</span></button>`;
  };
  return `
    <div class="analytics-chart-card chapter-grid-card">
      <div class="analytics-chart-title">Chapter map</div>
      <div class="chapter-grid">${mastery.map(tile).join('')}</div>
      <div class="stacked-legend">
        <span class="stacked-legend-item"><span class="stacked-legend-dot stacked-seg-100"></span>≥ 90%</span>
        <span class="stacked-legend-item"><span class="stacked-legend-dot stacked-seg-50"></span>70–89%</span>
        <span class="stacked-legend-item"><span class="stacked-legend-dot stacked-seg-0"></span>1–69%</span>
        <span class="stacked-legend-item"><span class="stacked-legend-dot stacked-seg-unseen"></span>Unstarted</span>
      </div>
      <div class="chapter-detail-panel${expandedKey ? ' open' : ''}" id="chapterDetailPanel">${expandedKey ? buildChapterDetailHtml(expandedKey) : ''}</div>
    </div>
  `;
}

// ── Per-chapter word breakdown (shown when a chapter tile is tapped) ──
// Reads the same g2e marks/progress as the chapter map so the headline %
// and the per-word % match. Sorted weakest → strongest so it doubles as
// a "what to drill next" list.
function buildChapterDetailHtml(chapterKey) {
  if (!chapterKey) return '';
  const cards = getChapterVocabCards(String(chapterKey), false);
  if (!cards.length) return `<div class="analytics-empty">No vocabulary for Ch. ${escapeHtml(String(chapterKey))} yet.</div>`;
  const marksMap = runtime.globalWordMarks.g2e || {};
  const store = runtime.globalWordProgress.g2e || {};
  const required = cards.filter(c => c.required).length;
  const headwordOf = (card) => typeof window !== 'undefined' && typeof window.formatGreekHeadword === 'function'
    ? window.formatGreekHeadword(card.g)
    : (card.g || '—');

  // Each row reflects the rolling last-10-flips confidence (getConfidencePct),
  // independent of any "marked known" override — the user wants real signal,
  // not the manual toggle. The "isConfirmed" tally below still counts known
  // marks because that headline is about course-completion, not recall.
  const rowFor = (card) => {
    const progress = store[card.id];
    const isKnownMark = marksMap[card.id] === 'known';
    const rawPct = getConfidencePct(progress);
    const seen = !!(progress?.seenCount) || !!progress?.lastReviewedAt;
    let bandClass;
    let bandLabel;
    let pctText;
    let sortPct;
    if (rawPct === null && !seen) {
      bandClass = 'stacked-seg-unseen'; bandLabel = 'Unseen'; pctText = '—'; sortPct = -1;
    } else {
      const pct = rawPct ?? 0;
      sortPct = pct;
      pctText = `${pct}%`;
      if (pct >= 80)      bandClass = 'stacked-seg-b80';
      else if (pct >= 60) bandClass = 'stacked-seg-b60';
      else if (pct >= 40) bandClass = 'stacked-seg-b40';
      else if (pct >= 20) bandClass = 'stacked-seg-b20';
      else                bandClass = 'stacked-seg-b0';
    }
    return {
      card, bandClass, bandLabel, pctText, sortPct,
      isConfirmed: isKnownMark || (rawPct !== null && rawPct >= 70)
    };
  };
  const rows = cards.map(rowFor);
  const sortMode = runtime.analyticsChapterSort === 'alphabetical' ? 'alphabetical' : 'confidence';
  if (sortMode === 'alphabetical') {
    rows.sort((a, b) => (a.card.g || '').localeCompare(b.card.g || ''));
  } else {
    rows.sort((a, b) => {
      if (a.sortPct !== b.sortPct) return a.sortPct - b.sortPct;
      return (a.card.g || '').localeCompare(b.card.g || '');
    });
  }
  const confirmedCount = rows.filter(r => r.isConfirmed).length;
  const headlinePct = cards.length ? Math.round((confirmedCount / cards.length) * 100) : 0;

  const rowHtml = rows.map(r => {
    const expanded = runtime.analyticsExpandedWord === r.card.id;
    const cardHtml = expanded ? buildWordStatCardHtml(r.card, store[r.card.id], marksMap[r.card.id] === 'known') : '';
    return `
      <li class="chapter-detail-row${expanded ? ' chapter-detail-row-active' : ''}"
          role="button"
          tabindex="0"
          aria-expanded="${expanded ? 'true' : 'false'}"
          data-word-id="${escapeHtml(String(r.card.id))}">
        <span class="chapter-detail-dot ${r.bandClass}" aria-hidden="true"></span>
        <span class="chapter-detail-word">${headwordOf(r.card)}</span>
        <span class="chapter-detail-gloss">${escapeHtml(r.card.e || '')}</span>
        <span class="chapter-detail-pct">${escapeHtml(r.pctText)}</span>
      </li>
      ${expanded ? `<li class="chapter-detail-statcard-row" aria-hidden="false">${cardHtml}</li>` : ''}
    `;
  }).join('');

  const sortBtn = (mode, label) => {
    const active = sortMode === mode;
    return `<button type="button" class="ctrl-btn chapter-detail-sort-btn${active ? ' active-toggle' : ''}" data-chapter-sort="${mode}" aria-pressed="${active ? 'true' : 'false'}">${escapeHtml(label)}</button>`;
  };
  return `
    <div class="chapter-detail-head">
      <div class="chapter-detail-title">Ch. ${escapeHtml(String(chapterKey))} — ${confirmedCount} / ${cards.length} confirmed <span class="chapter-detail-meta">${headlinePct}%${required ? ` · ${required} required` : ''}</span></div>
      <div class="chapter-detail-controls">
        <div class="chapter-detail-sort" role="group" aria-label="Sort words">
          ${sortBtn('confidence', 'Confidence')}
          ${sortBtn('alphabetical', 'A–Ω')}
        </div>
        <button type="button" class="chapter-detail-close" data-chapter-close="1" aria-label="Close chapter details">×</button>
      </div>
    </div>
    <ol class="chapter-detail-list">${rowHtml}</ol>
  `;
}

function renderChapterDetailPanel() {
  const panel = document.getElementById('chapterDetailPanel');
  if (!panel) return;
  if (!runtime.analyticsExpandedChapter) {
    panel.innerHTML = '';
    panel.classList.remove('open');
    runtime.analyticsExpandedWord = null;
    return;
  }
  panel.innerHTML = buildChapterDetailHtml(runtime.analyticsExpandedChapter);
  panel.classList.add('open');
}

function setupChapterGridInteractivity(rootEl) {
  if (!rootEl || rootEl.dataset.chapterClickBound === '1') return;
  rootEl.dataset.chapterClickBound = '1';

  const handleWordRowToggle = (row) => {
    const wordId = row.dataset.wordId || '';
    if (!wordId) return;
    // The panel innerHTML is fully replaced on re-render, which destroys the
    // inner <ol> and resets its scrollTop. Capture the tapped row's position
    // within the scrollable list, then after re-render, adjust scrollTop so
    // the same row stays visually fixed — otherwise the list jumps back to
    // the top each time a word is opened or closed.
    const list = row.closest('.chapter-detail-list');
    const prevScrollTop = list ? list.scrollTop : 0;
    const prevRowTop = list ? row.offsetTop : 0;

    runtime.analyticsExpandedWord = runtime.analyticsExpandedWord === wordId ? null : wordId;
    renderChapterDetailPanel();

    const newList = document.querySelector('#chapterDetailPanel .chapter-detail-list');
    if (!newList) return;
    const newRow = newList.querySelector(`.chapter-detail-row[data-word-id="${CSS.escape(wordId)}"]`);
    newList.scrollTop = newRow
      ? prevScrollTop + (newRow.offsetTop - prevRowTop)
      : prevScrollTop;
  };

  rootEl.addEventListener('click', (event) => {
    const closeBtn = event.target.closest('[data-chapter-close]');
    if (closeBtn) {
      runtime.analyticsExpandedChapter = null;
      runtime.analyticsExpandedWord = null;
      rootEl.querySelectorAll('.chapter-tile').forEach(t => {
        t.classList.remove('chapter-tile-active');
        t.setAttribute('aria-expanded', 'false');
      });
      renderChapterDetailPanel();
      return;
    }
    const sortToggle = event.target.closest('[data-chapter-sort]');
    if (sortToggle && rootEl.contains(sortToggle)) {
      const nextMode = sortToggle.dataset.chapterSort === 'alphabetical' ? 'alphabetical' : 'confidence';
      if (runtime.analyticsChapterSort !== nextMode) {
        runtime.analyticsChapterSort = nextMode;
        renderChapterDetailPanel();
      }
      return;
    }
    const wordRow = event.target.closest('.chapter-detail-row[data-word-id]');
    if (wordRow && rootEl.contains(wordRow)) {
      handleWordRowToggle(wordRow);
      return;
    }
    const tile = event.target.closest('.chapter-tile');
    if (!tile || !rootEl.contains(tile)) return;
    const key = tile.dataset.chapter || '';
    if (!key) return;
    const nextKey = runtime.analyticsExpandedChapter === key ? null : key;
    if (nextKey !== runtime.analyticsExpandedChapter) runtime.analyticsExpandedWord = null;
    runtime.analyticsExpandedChapter = nextKey;
    rootEl.querySelectorAll('.chapter-tile').forEach(t => {
      const active = t.dataset.chapter === runtime.analyticsExpandedChapter;
      t.classList.toggle('chapter-tile-active', active);
      t.setAttribute('aria-expanded', active ? 'true' : 'false');
    });
    renderChapterDetailPanel();
  });

  rootEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const wordRow = event.target.closest('.chapter-detail-row[data-word-id]');
    if (!wordRow || !rootEl.contains(wordRow)) return;
    event.preventDefault();
    handleWordRowToggle(wordRow);
  });
}

function computePersonalRecords(usage, sessionHistory, streaks, courseData) {
  const longestSessionMs = sessionHistory.reduce((max, s) => Math.max(max, s.durationMs || 0), 0);

  // Best day = day with most cards first-confirmed.
  const byDay = {};
  const mergeFirstConfirmed = (store) => {
    Object.values(store || {}).forEach(entry => {
      const ts = Number(entry?.firstConfirmedAt) || 0;
      if (!ts) return;
      const key = getUsageDayKey(ts);
      byDay[key] = (byDay[key] || 0) + 1;
    });
  };
  mergeFirstConfirmed(runtime.globalWordProgress.g2e);
  mergeFirstConfirmed(runtime.globalWordProgress.e2g);
  mergeFirstConfirmed(runtime.globalWordProgress.morph);
  let bestDayCount = 0;
  let bestDayKey = '';
  Object.entries(byDay).forEach(([key, count]) => {
    if (count > bestDayCount) { bestDayCount = count; bestDayKey = key; }
  });

  const totalConfirmed = courseData.allVocabConfirmed + (host.canAccessGrammarUi() ? courseData.allGrammarConfirmed : 0);
  return {
    longestSessionMs,
    bestStreak: streaks.longest || 0,
    bestDayCount,
    bestDayKey,
    totalConfirmed
  };
}

function buildRecordsHtml(records) {
  const items = [
    { label: 'Longest session',  value: records.longestSessionMs ? formatUsageDuration(records.longestSessionMs) : '—', note: 'Active study, single sitting' },
    { label: 'Best day',          value: records.bestDayCount ? `${records.bestDayCount} cards` : '—', note: records.bestDayKey ? `On ${formatAnalyticsDate(new Date(records.bestDayKey + 'T00:00:00').getTime())}` : 'First confirmations in a single day' },
    { label: 'Best streak',       value: records.bestStreak ? `${records.bestStreak} day${records.bestStreak === 1 ? '' : 's'}` : '—', note: 'Longest consecutive run' },
    { label: 'Cards confirmed',   value: records.totalConfirmed.toLocaleString(), note: 'Course-wide, all directions' }
  ];
  return `
    <div class="analytics-chart-card records-card">
      <div class="analytics-chart-title">Personal records</div>
      <div class="records-grid">${items.map(it => `
        <div class="records-cell">
          <div class="records-value">${escapeHtml(it.value)}</div>
          <div class="records-label">${escapeHtml(it.label)}</div>
          <div class="records-note">${escapeHtml(it.note)}</div>
        </div>
      `).join('')}</div>
    </div>
  `;
}

function computeStubbornCards(cards, progressStore) {
  return (cards || [])
    .map(card => {
      const p = progressStore?.[card.id];
      if (!p) return null;
      const fails = Number(p.failCount) || 0;
      const passes = Number(p.passCount) || 0;
      const seen = Number(p.seenCount) || 0;
      if (fails < 2 || seen < 3) return null;
      const total = fails + passes;
      const failRate = total ? fails / total : 0;
      return { card, fails, passes, seen, failRate };
    })
    .filter(Boolean)
    .sort((a, b) => (b.fails - a.fails) || (b.failRate - a.failRate))
    .slice(0, 5);
}

function buildStubbornListHtml(vocabRows, grammarRows) {
  if (!vocabRows.length && !grammarRows.length) return '';
  const renderRow = (row, kind) => {
    const card = row.card;
    const headword = kind === 'grammar'
      ? `${card.form || card.lemma || '—'}${card.lemma && card.form && card.form !== card.lemma ? ` <span class="stubborn-lemma">(${escapeHtml(card.lemma)})</span>` : ''}`
      : escapeHtml(card.g || '—');
    const gloss = kind === 'grammar' ? (card.answer || card.gloss || '') : (card.e || '');
    return `
      <li class="stubborn-row">
        <div class="stubborn-word">${headword}</div>
        <div class="stubborn-gloss">${escapeHtml(gloss)}</div>
        <div class="stubborn-stats">${row.fails} miss${row.fails === 1 ? '' : 'es'} · ${Math.round(row.failRate * 100)}% miss rate · ${row.seen} flips</div>
      </li>
    `;
  };

  const vocabSection = vocabRows.length ? `
    <div class="stubborn-group">
      <div class="stubborn-group-label">Stubborn vocabulary</div>
      <ol class="stubborn-list">${vocabRows.map(r => renderRow(r, 'vocab')).join('')}</ol>
    </div>
  ` : '';
  const grammarSection = grammarRows.length ? `
    <div class="stubborn-group">
      <div class="stubborn-group-label">Stubborn grammar</div>
      <ol class="stubborn-list">${grammarRows.map(r => renderRow(r, 'grammar')).join('')}</ol>
    </div>
  ` : '';

  return `
    <div class="analytics-chart-card stubborn-card">
      <div class="analytics-chart-title">Most stubborn in this selection</div>
      <div class="stubborn-subtitle">Cards you've missed most — worth a focused pass.</div>
      ${vocabSection}
      ${grammarSection}
    </div>
  `;
}

function computeAtRiskCount(cards, progressStore) {
  if (!cards?.length) return 0;
  const now = Date.now();
  let count = 0;
  cards.forEach(card => {
    const p = progressStore?.[card.id];
    if (!p) return;
    if (!p.dueAt || !p.firstConfirmedAt) return;
    if (p.dueAt > now) return;
    const pct = getConfidencePct(p);
    if (pct === null || pct < 70) count++;
  });
  return count;
}

export function renderAnalyticsOverlay() {
  const overlay = document.getElementById('analyticsOverlay');
  if (!overlay) return;
  host.accumulateActiveStudyTime();
  const usage = host.ensureUsageStats();
  const usageSeries = buildDailyCumulativeSeriesFromMap(usage.activeDailyMs, usage.firstStudyAt || 0);
  const sessionHistory = [...usage.studySessionHistory];
  if (usage.currentStudySession && usage.currentStudySession.startedAt) sessionHistory.push({ startedAt: usage.currentStudySession.startedAt, endedAt: usage.lastStudyCountedAt || Date.now(), durationMs: usage.currentStudySession.durationMs || 0, interactionCount: usage.currentStudySession.interactionCount || 0 });
  const latestSession = sessionHistory[sessionHistory.length - 1] || null;

  // ── Per-direction progress stores. Analytics needs to read vocab progress
  //    from the g2e/e2g store and grammar progress from the morph store
  //    regardless of the current studyMode, otherwise getWordProgress()
  //    (which is keyed on the active mode) reports every off-mode card as
  //    "Unseen". ──
  const g2eProgressStore = runtime.globalWordProgress.g2e || {};
  const e2gProgressStore = runtime.globalWordProgress.e2g || {};
  const morphProgressStore = runtime.globalWordProgress.morph || {};
  const vocabProgressStore = runtime.directionToGreek ? e2gProgressStore : g2eProgressStore;

  // ── Vocab & Grammar data (used by both gamification and section renders) ──
  const vocabCards = runtime.selectedKeys.length ? getSelectedVocabCards(runtime.selectedKeys, runtime.requiredOnly) : [];
  const vocabMarks = runtime.directionToGreek ? runtime.globalWordMarks.e2g : runtime.globalWordMarks.g2e;
  const vocabProgress = buildCumulativeConfirmationSeries(vocabCards, vocabMarks, vocabProgressStore);
  const vocabProjection = getRegressionProjection(vocabProgress.series, vocabProgress.currentConfirmed, vocabProgress.total);
  const vocabBuckets = buildConfirmationHistogram(vocabCards, vocabProgressStore);
  const grammarCards = host.canAccessGrammarUi() && runtime.selectedKeys.length ? getSelectedGrammarCards(runtime.selectedKeys) : [];
  const grammarMarks = runtime.globalWordMarks.morph;
  const grammarProgress = buildCumulativeConfirmationSeries(grammarCards, grammarMarks, morphProgressStore);
  const grammarProjection = getRegressionProjection(grammarProgress.series, grammarProgress.currentConfirmed, grammarProgress.total);
  const grammarBuckets = buildConfirmationHistogram(grammarCards, morphProgressStore);

  // ── Course-wide data (selection-independent, represents full course) ──
  const courseData = computeCourseWideData();

  // ── Gamification computations (all course-wide) ──
  const streaks = computeStudyStreaks(usage.activeDailyMs);
  const xpData = computeXpAndLevel(usage);
  const mergedProgressStore = {};
  [g2eProgressStore, e2gProgressStore, morphProgressStore].forEach(store => {
    Object.entries(store).forEach(([cardId, entry]) => {
      const existing = mergedProgressStore[cardId] || {};
      mergedProgressStore[cardId] = {
        ...existing,
        ...entry,
        lastReviewedAt: Math.max(Number(existing.lastReviewedAt) || 0, Number(entry?.lastReviewedAt) || 0),
        firstConfirmedAt: Math.max(Number(existing.firstConfirmedAt) || 0, Number(entry?.firstConfirmedAt) || 0)
      };
    });
  });
  const allCourseCards = [...courseData.allVocabCards, ...courseData.allGrammarCards];
  const mergedMarks = { ...(runtime.globalWordMarks.g2e || {}), ...(runtime.globalWordMarks.e2g || {}), ...(runtime.globalWordMarks.morph || {}) };
  const todayStats = computeTodayStats(usage.activeDailyMs, allCourseCards, mergedMarks, mergedProgressStore);
  const achievements = computeAchievements(usage, courseData, streaks, sessionHistory.length, todayStats);
  const dailyAwards = achievements.filter(a => a.group === 'daily');
  const milestones = achievements.filter(a => a.group !== 'chapter' && a.group !== 'daily');
  const chapterAwards = achievements.filter(a => a.group === 'chapter');
  const earnedDaily = dailyAwards.filter(a => a.earned).length;
  const earnedMilestones = milestones.filter(a => a.earned).length;
  const earnedChapters = chapterAwards.filter(a => a.earned).length;

  // ── Hero section ──
  const heroEl = document.getElementById('analyticsHero');
  if (heroEl) {
    const streakLabel = streaks.current === 1 ? '1 day' : `${streaks.current} days`;
    const streakFlame = streaks.current >= 7 ? '\u{1F525}' : streaks.current >= 3 ? '♨️' : '✧';
    const todayGoalFraction = Math.min(1, todayStats.todayMs / (15 * 60 * 1000)); // 15-min daily goal
    heroEl.innerHTML = `
      <div class="hero-grid">
        <div class="hero-card hero-streak">
          <div class="hero-icon">${streakFlame}</div>
          <div class="hero-big">${streakLabel}</div>
          <div class="hero-sub">Current streak${streaks.longest > streaks.current ? ` · Best: ${streaks.longest}d` : ''}</div>
        </div>
        <div class="hero-card hero-level">
          <div class="hero-rank-badge">Lv. ${xpData.currentLevel.level}</div>
          <div class="hero-big">${escapeHtml(xpData.currentLevel.title)}</div>
          <div class="hero-sub">${xpData.totalXp.toLocaleString()} XP${xpData.currentLevel.flav ? ' · ' + escapeHtml(xpData.currentLevel.flav) : ''}</div>
          ${buildLevelBarHtml(xpData)}
        </div>
        <div class="hero-card hero-today">
          ${buildCircularProgressSvg(todayGoalFraction, 'Today progress', formatUsageDuration(todayStats.todayMs))}
          <div class="hero-today-stats">
            <span>${todayStats.reviewedToday} reviewed</span>
            <span>${todayStats.newToday} new</span>
          </div>
        </div>
      </div>
    `;
  }

  // ── Title ladder ──
  const titlesEl = document.getElementById('analyticsTitles');
  if (titlesEl) {
    titlesEl.innerHTML = buildTitleLadderHtml(xpData);
  }

  // ── Course completion stacked bars (always course-wide) ──
  const courseEl = document.getElementById('analyticsCourseCompletion');
  if (courseEl) {
    const courseVocabBuckets = buildConfirmationHistogram(courseData.allVocabCards, g2eProgressStore);
    const showGrammar = host.canAccessGrammarUi();
    let courseGrammarHtml = '';
    if (showGrammar) {
      const courseGrammarBuckets = buildConfirmationHistogram(courseData.allGrammarCards, morphProgressStore);
      courseGrammarHtml = `
        <div class="analytics-chart-card" style="margin-top:10px">
          <div class="analytics-chart-title">Grammar — ${courseData.allGrammarConfirmed} / ${courseData.allGrammarTotal} confirmed</div>
          ${buildHistogramSvg(courseGrammarBuckets, { title: 'Course grammar confirmation %' })}
        </div>`;
    }
    courseEl.innerHTML = `
      <div class="analytics-chart-card">
        <div class="analytics-chart-title">Vocabulary — ${courseData.allVocabConfirmed} / ${courseData.allVocabTotal} confirmed (${courseData.reqVocabConfirmed} / ${courseData.reqVocabTotal} required)</div>
        ${buildHistogramSvg(courseVocabBuckets, { title: 'Course vocabulary confirmation %' })}
      </div>
      ${courseGrammarHtml}
    `;
  }

  // ── Chapter mastery grid (course-wide) ──
  const chapterGridEl = document.getElementById('analyticsChapterGrid');
  if (chapterGridEl) {
    const mastery = computeChapterMastery(g2eProgressStore, runtime.globalWordMarks.g2e || {});
    if (mastery.length) {
      // Drop the expanded chapter if it's no longer in the mastery list (e.g.
      // sets were removed) so we don't try to render a phantom panel.
      if (runtime.analyticsExpandedChapter && !mastery.some(m => String(m.chapterKey) === runtime.analyticsExpandedChapter)) {
        runtime.analyticsExpandedChapter = null;
        runtime.analyticsExpandedWord = null;
      }
      chapterGridEl.innerHTML = buildChapterGridHtml(mastery);
      setupChapterGridInteractivity(chapterGridEl);
    } else {
      chapterGridEl.innerHTML = '';
      runtime.analyticsExpandedChapter = null;
      runtime.analyticsExpandedWord = null;
    }
  }

  // ── Personal records (course-wide) ──
  const recordsEl = document.getElementById('analyticsRecords');
  if (recordsEl) {
    const records = computePersonalRecords(usage, sessionHistory, streaks, courseData);
    recordsEl.innerHTML = buildRecordsHtml(records);
  }

  // ── Heatmap ──
  const heatmapEl = document.getElementById('analyticsHeatmap');
  if (heatmapEl) {
    const hasData = Object.keys(usage.activeDailyMs || {}).some(k => usage.activeDailyMs[k] > 0);
    heatmapEl.innerHTML = hasData
      ? `<div class="analytics-chart-card heatmap-card">
           <div class="analytics-chart-title">Study activity</div>
           ${buildHeatmapSvg(usage.activeDailyMs)}
           <div class="heatmap-legend">
             <span class="heatmap-legend-label">Less</span>
             <span class="heatmap-swatch" style="background:rgba(255,255,255,0.05)"></span>
             <span class="heatmap-swatch" style="background:rgba(201,168,76,0.25)"></span>
             <span class="heatmap-swatch" style="background:rgba(201,168,76,0.50)"></span>
             <span class="heatmap-swatch" style="background:rgba(201,168,76,0.75)"></span>
             <span class="heatmap-swatch" style="background:rgba(201,168,76,0.90)"></span>
             <span class="heatmap-legend-label">More</span>
           </div>
         </div>`
      : '';
  }

  // ── Achievements (grouped: milestones + chapters) ──
  const achieveEl = document.getElementById('analyticsAchievements');
  if (achieveEl) {
    const dailyHtml = dailyAwards.length ? `
      <div class="achieve-group-label">Daily <span class="achieve-counter">${earnedDaily} / ${dailyAwards.length}</span></div>
      <div class="achieve-grid">${dailyAwards.map(a => `
        <div class="achieve-badge ${a.earned ? 'earned' : 'locked'}" title="${escapeHtml(a.desc)}">
          <div class="achieve-icon">${a.icon}</div>
          <div class="achieve-name">${escapeHtml(a.name)}</div>
        </div>
      `).join('')}</div>
    ` : '';
    const chapterHtml = chapterAwards.length ? `
      <div class="achieve-group-label">Chapters <span class="achieve-counter">${earnedChapters} / ${chapterAwards.length}</span></div>
      <div class="achieve-grid achieve-grid-chapters">${chapterAwards.map(a => `
        <div class="achieve-badge ${a.earned ? 'earned' : 'locked'}" title="${escapeHtml(a.desc)}">
          <div class="achieve-icon">${a.icon}</div>
          <div class="achieve-name">${escapeHtml(a.name)}</div>
        </div>
      `).join('')}</div>
    ` : '';
    achieveEl.innerHTML = `
      <div class="analytics-chart-card achieve-card">
        <div class="analytics-chart-title">Achievements</div>
        ${dailyHtml}
        <div class="achieve-group-label">Milestones <span class="achieve-counter">${earnedMilestones} / ${milestones.length}</span></div>
        <div class="achieve-grid">${milestones.map(a => `
          <div class="achieve-badge ${a.earned ? 'earned' : 'locked'}" title="${escapeHtml(a.desc)}">
            <div class="achieve-icon">${a.icon}</div>
            <div class="achieve-name">${escapeHtml(a.name)}</div>
          </div>
        `).join('')}</div>
        ${chapterHtml}
      </div>
    `;
  }

  // ── Overall time metrics (existing, reorganized) ──
  const overallMetricsEl = document.getElementById('analyticsOverallMetrics');
  const overallChartEl = document.getElementById('analyticsTimeChart');
  const sessionEl = document.getElementById('analyticsSessionSummary');
  if (overallMetricsEl) overallMetricsEl.innerHTML = `
      <div class="analytics-metric-card"><div class="analytics-metric-label">Active study time</div><div class="analytics-metric-value">${escapeHtml(formatUsageDuration(usage.activeStudyMs))}</div><div class="analytics-metric-note">Stricter interaction-based timer</div></div>
      <div class="analytics-metric-card"><div class="analytics-metric-label">Foreground time</div><div class="analytics-metric-value">${escapeHtml(formatUsageDuration(usage.totalMs))}</div><div class="analytics-metric-note">App visible on screen</div></div>
      <div class="analytics-metric-card"><div class="analytics-metric-label">Study sessions logged</div><div class="analytics-metric-value">${sessionHistory.length}</div><div class="analytics-metric-note">${latestSession ? `Latest ${formatAnalyticsDateTime(latestSession.startedAt)}` : 'No completed sessions yet'}</div></div>
      <div class="analytics-metric-card"><div class="analytics-metric-label">Average session length</div><div class="analytics-metric-value">${escapeHtml(formatUsageDuration(sessionHistory.length ? sessionHistory.reduce((sum, entry) => sum + (entry.durationMs || 0), 0) / sessionHistory.length : 0))}</div><div class="analytics-metric-note">Across saved study sessions</div></div>`;
  if (overallChartEl) overallChartEl.innerHTML = usageSeries.length ? buildLineChartSvg(usageSeries, { title: 'Cumulative active study time' }) : `<div class="analytics-empty">Start studying and this cumulative time chart will wake up.</div>`;
  if (sessionEl) sessionEl.textContent = latestSession ? `Latest session: ${formatAnalyticsDateTime(latestSession.startedAt)} → ${formatAnalyticsDateTime(latestSession.endedAt)} · ${formatUsageDuration(latestSession.durationMs)} · ${latestSession.interactionCount || 0} study actions` : 'No study session history yet.';

  // ── Current-selection subtitle (frames the section below) ──
  const selectionSubtitleEl = document.getElementById('analyticsSelectionSubtitle');
  if (selectionSubtitleEl) {
    if (!runtime.selectedKeys.length) {
      selectionSubtitleEl.textContent = 'Pick a session or chapter on the home screen to populate these stats.';
    } else {
      const scopeBit = runtime.requiredOnly ? 'Required-only (graded) vocabulary' : 'All vocabulary, graded + nice-to-haves';
      const grammarBit = host.canAccessGrammarUi() ? ' plus the matching grammar drills' : '';
      selectionSubtitleEl.textContent = `${scopeBit}${grammarBit} across ${runtime.selectedKeys.length} set${runtime.selectedKeys.length === 1 ? '' : 's'}.`;
    }
  }

  // ── Vocab section (selection-scoped). Required-only IS the graded subset,
  //    so the toggle is a real lever — surface it in the subtitle, not as a metric. ──
  const vocabAtRisk = computeAtRiskCount(vocabCards, runtime.directionToGreek ? e2gProgressStore : g2eProgressStore);
  renderAnalyticsSection('analyticsVocabSection', {
    title: 'Vocabulary progress',
    subtitle: runtime.selectedKeys.length
      ? `${runtime.requiredOnly ? 'Required-only (graded) vocabulary' : 'All vocabulary, graded + nice-to-haves'} in the current selection`
      : 'Choose one or more vocabulary sets to populate this view.',
    total: vocabProgress.total,
    metrics: [
      { label: 'Confirmed now',     value: `${vocabProgress.currentConfirmed} / ${vocabProgress.total || 0}`, note: 'Marked known or ≥70% recent accuracy' },
      { label: 'New this week',     value: `${vocabProgress.weeklyPct.toFixed(1)}%`, note: 'Share first confirmed in the last 7 days' },
      { label: 'Slipping now',      value: `${vocabAtRisk}`, note: 'Confirmed before but accuracy now < 70%' },
      { label: 'Projected finish',  value: vocabProgress.currentConfirmed >= vocabProgress.total && vocabProgress.total ? 'Complete' : (vocabProjection ? formatAnalyticsDate(vocabProjection.projectedTs) : '—'), note: vocabProjection ? `${vocabProjection.cardsPerDay.toFixed(2)} words/day regression` : 'Needs more recent progress data' }
    ],
    lineTitle: 'Cumulative confirmed vocabulary fraction',
    lineSvg: vocabProgress.series.length ? buildLineChartSvg(vocabProgress.series, { title: 'Vocabulary progress', percent: true, maxValue: 1 }) : `<div class="analytics-empty">No confirmed vocabulary history yet for this selection.</div>`,
    barTitle: 'Vocabulary confirmation breakdown',
    barSvg: buildHistogramSvg(vocabBuckets, { title: 'Vocabulary confirmation' })
  });

  // ── Grammar section (selection-scoped). All paradigms are required, so the
  //    required-only toggle does not apply here — the 'Required toggle' pseudo-metric is gone. ──
  const grammarAtRisk = computeAtRiskCount(grammarCards, morphProgressStore);
  renderAnalyticsSection('analyticsGrammarSection', {
    title: 'Grammar progress',
    subtitle: host.canAccessGrammarUi() ? 'Morphology and grammar drills in the current selection. Paradigms are all required.' : 'Switch to the full vocabulary + grammar layout to track grammar progress here.',
    total: grammarProgress.total,
    metrics: [
      { label: 'Confirmed now',    value: `${grammarProgress.currentConfirmed} / ${grammarProgress.total || 0}`, note: 'Marked known or ≥70% recent accuracy' },
      { label: 'New this week',    value: `${grammarProgress.weeklyPct.toFixed(1)}%`, note: 'Share first confirmed in the last 7 days' },
      { label: 'Slipping now',     value: `${grammarAtRisk}`, note: 'Confirmed before but accuracy now < 70%' },
      { label: 'Projected finish', value: grammarProgress.currentConfirmed >= grammarProgress.total && grammarProgress.total ? 'Complete' : (grammarProjection ? formatAnalyticsDate(grammarProjection.projectedTs) : '—'), note: grammarProjection ? `${grammarProjection.cardsPerDay.toFixed(2)} items/day regression` : 'Needs more recent progress data' }
    ],
    lineTitle: 'Cumulative confirmed grammar fraction',
    lineSvg: grammarProgress.series.length ? buildLineChartSvg(grammarProgress.series, { title: 'Grammar progress', percent: true, maxValue: 1 }) : `<div class="analytics-empty">No confirmed grammar history yet for this selection.</div>`,
    barTitle: 'Grammar confirmation breakdown',
    barSvg: buildHistogramSvg(grammarBuckets, { title: 'Grammar confirmation' })
  });

  // ── Stubborn cards (selection-scoped, vocab + grammar) ──
  const stubbornEl = document.getElementById('analyticsStubbornWords');
  if (stubbornEl) {
    const vocabStubborn = computeStubbornCards(vocabCards, runtime.directionToGreek ? e2gProgressStore : g2eProgressStore);
    const grammarStubborn = host.canAccessGrammarUi() ? computeStubbornCards(grammarCards, morphProgressStore) : [];
    stubbornEl.innerHTML = runtime.selectedKeys.length ? buildStubbornListHtml(vocabStubborn, grammarStubborn) : '';
  }
}
