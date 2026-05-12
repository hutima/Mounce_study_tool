// ═══════════════════════════════════════════════════════
//  GREEK FLASHCARDS — Modular Entry Point
// ═══════════════════════════════════════════════════════

// Utils
import { clamp, isPlainObject, shuffleArray, escapeHtml, cloneForUndo } from '../utils/helpers.js';
import { formatUsageDuration, formatAnalyticsDate, formatAnalyticsDateTime, getUsageDayKey } from '../utils/time.js';
import { getStorage, isLikelyIOS } from '../utils/storage.js';
import { compareGreekAlphabetical } from '../utils/greekSort.js';

// Domain — SRS
import { SRS_DAY_MS, SRS_AGAIN_MS, SRS_UNCERTAIN_MIN_MS, SRS_NEAR_WINDOW_MS, SRS_CYCLE_ADVANCE_MS } from '../domain/srs/constants.js';
import { msFromDays, setProgressDelay, setMinimumProgressDelay,
         getSrsEase, getSrsStage, getLastEasyIntervalDays, getNextEasyIntervalDays,
         getEasyDelayMs, getUncertainDelayMs, formatRemainingForTable } from '../domain/srs/scheduler.js';
import { recordConfidenceSample, getConfidencePct, computeCardXpAward } from '../domain/srs/confidence.js';

// Domain — Gamification
import { XP_LEVELS, REVIEW_XP_SCHEDULE } from '../domain/gamification/levels.js';
import {
  sanitizeUsageStats,
  accumulateUsageTime as accumulateUsageTimeForStats,
  accumulateActiveStudyTime as accumulateActiveStudyTimeForStats,
  finalizeStudySession as finalizeStudySessionForStats,
  noteStudyInteraction as noteStudyInteractionForStats,
  getUsageMsForDay,
  getActiveStudyMsForDay
} from '../domain/gamification/usageStats.js';

// Domain — Deck
import { isChapterKey, isAdvancedKey, sortSetKeys, sourceHint, expandSessionSets } from '../domain/deck/ordering.js';
import { getSelectedVocabCards, getSelectedGrammarCards, getAllVocabKeys, getAllChapterKeys,
         getAllVocabCards, getAllGrammarCards, getChapterVocabCards,
         getCardReviewLeft, getCardReviewRight, getCardMetaLine, getCardAuxLine } from '../domain/deck/filters.js';

// Domain — Grammar
import { buildGrammarSupportHtml } from '../domain/grammar/explanations.js';

// State
import { STATE_MIGRATIONS, summarizePersistedState, formatPersistedStateSummary } from '../state/migrations.js';
import {
  sanitizeGamificationState,
  STORAGE_KEY,
  CONSENT_STORAGE_KEY,
  WHATS_NEW_V1_1_STORAGE_KEY,
  THEME_STORAGE_KEY,
  PROGRESS_EXPORT_FORMAT,
  PROGRESS_EXPORT_VERSION,
  STUDY_IDLE_MS,
  STUDY_SESSION_BREAK_MS,
  MAX_STUDY_SESSION_HISTORY
} from '../state/store.js';
let appUsageStats = {
  totalMs: 0,
  dailyMs: {},
  activeStudyMs: 0,
  activeDailyMs: {},
  lastActiveAt: 0,
  lastStudyInteractionAt: 0,
  lastStudyCountedAt: 0,
  firstStudyAt: 0,
  studySessionHistory: [],
  currentStudySession: null
};
let appProfile = 'vocab_grammar';
let appGamification = { lastCelebratedLevel: null, lastCelebratedBadgeDay: null, lastEarnedAchievementIds: [] };
let hasAcceptedDisclaimer = false;
let disclaimerModalRequiresAgreement = false;
let transferModalMode = '';
let themeMode = 'system';
let transferPrimaryAction = null;
let transferSecondaryAction = null;
let usageTickHandle = null;
let usageVisibilityBound = false;
let usageTickCounter = 0;
let studyMode = 'vocab';
let levelToastHideTimer = null;
let levelToastRemoveTimer = null;
let toastQueue = [];
let toastActive = false;
let morphSelfCheck = false;
let morphAnswerState = { answered: false, revealed: false, selfRated: false, selectedIndex: -1, isCorrect: null, skipped: false };
let morphPendingAdvance = false;

let deckStates = {};
let globalWordMarks = {};
let globalWordProgress = {};

function getDirectionKey() {
  return directionToGreek ? 'e2g' : 'g2e';
}

function getStudyStoreKey() {
  if (studyMode === 'morph') {
    return directionToGreek ? 'morph_e2g' : 'morph';
  }
  return getDirectionKey();
}

function isReverseGrammarActive() {
  return studyMode === 'morph' && directionToGreek;
}

function reverseDisplayActive(card) {
  return isReverseGrammarActive() && !!card && card.reversible === true;
}

function ensureDirectionalStores() {
  if (!globalWordMarks || typeof globalWordMarks !== 'object' || Array.isArray(globalWordMarks)) globalWordMarks = {};
  if (!globalWordProgress || typeof globalWordProgress !== 'object' || Array.isArray(globalWordProgress)) globalWordProgress = {};

  const migrateLegacyBucket = (bucketObj) => {
    const keys = Object.keys(bucketObj || {});
    if (keys.length && !('g2e' in bucketObj) && !('e2g' in bucketObj) && !('morph' in bucketObj)) {
      return { g2e: { ...bucketObj }, e2g: {}, morph: {} };
    }
    return bucketObj;
  };

  globalWordMarks = migrateLegacyBucket(globalWordMarks);
  globalWordProgress = migrateLegacyBucket(globalWordProgress);

  if (!globalWordMarks.g2e || typeof globalWordMarks.g2e !== 'object') globalWordMarks.g2e = {};
  if (!globalWordMarks.e2g || typeof globalWordMarks.e2g !== 'object') globalWordMarks.e2g = {};
  if (!globalWordMarks.morph || typeof globalWordMarks.morph !== 'object') globalWordMarks.morph = {};
  if (!globalWordMarks.morph_e2g || typeof globalWordMarks.morph_e2g !== 'object') globalWordMarks.morph_e2g = {};
  if (!globalWordProgress.g2e || typeof globalWordProgress.g2e !== 'object') globalWordProgress.g2e = {};
  if (!globalWordProgress.e2g || typeof globalWordProgress.e2g !== 'object') globalWordProgress.e2g = {};
  if (!globalWordProgress.morph || typeof globalWordProgress.morph !== 'object') globalWordProgress.morph = {};
  if (!globalWordProgress.morph_e2g || typeof globalWordProgress.morph_e2g !== 'object') globalWordProgress.morph_e2g = {};
}

function getDirectionalMarksStore() {
  ensureDirectionalStores();
  return globalWordMarks[getStudyStoreKey()];
}

function getDirectionalProgressStore() {
  ensureDirectionalStores();
  return globalWordProgress[getStudyStoreKey()];
}

let currentSession = null;
let selectedKeys = [];
let deck = [];
let originalDeck = [];
let currentIdx = 0;
let isFlipped = false;
let shuffled = true;          // shuffle on by default
let requiredOnly = true;
let directionToGreek = false; // false = Greek→English, true = English→Greek
let spacedRepetition = true;
let activeDeckCount = 0;
let unspacedPendingRecycle = false;
let unspacedCycleState = {};
let unspacedDeferredIds = new Set(); // 'pass' cards excluded from current pass
let flipsSinceReshuffle = 0;         // forward navigations since last periodic reshuffle
let spacedUndoSnapshot = null;

// Fixed 1-in-N chance per flip (not scaled by pool size) to return one
// random known card to the active pile. 100 → ~1 return per 100 flips.
const KNOWN_CARD_RANDOM_RETURN_FLIP_ODDS = 100;
// Same idea but for spaced-mode confirmed cards (>75% confidence): 1-in-50
// pseudo-random chance per flip (~2%).
const CONFIRMED_CARD_RANDOM_RETURN_FLIP_ODDS = 50;

let marks = {};

function isMorphologyMode() {
  return studyMode === 'morph';
}

function isReaderMode() {
  return studyMode === 'reader';
}

function isCardStudyMode() {
  return studyMode === 'vocab' || studyMode === 'morph' || studyMode === 'reader';
}

function isReviewDeckMode() {
  return studyMode === 'vocab' || studyMode === 'morph';
}

function isVocabOnlyProfile() {
  return false;
}

function canAccessGrammarUi() {
  return !isVocabOnlyProfile();
}

function getSessions() {
  return Array.isArray(window.SESSIONS) ? window.SESSIONS : [];
}

function getProfileDescription() {
  return 'Full layout with vocabulary, grammar, translation drills, and memorization. Time totals stay shared, while progress remains separate by module.';
}

function normalizeStudyMode(mode) {
  if (mode === 'morph' && canAccessGrammarUi()) return 'morph';
  if (mode === 'reader') return 'reader';
  return 'vocab';
}

function isMorphCard(card) {
  return !!card && card.kind === 'morph';
}

function resetMorphAnswerState() {
  morphAnswerState = { answered: false, revealed: false, selfRated: false, selectedIndex: -1, isCorrect: null, skipped: false };
  morphPendingAdvance = false;
}

function getModeDescription() {
  if (isMorphologyMode()) return 'Grammar Quiz';
  if (isReaderMode()) return 'Reader';
  return 'Vocabulary Flashcards';
}

function resolveThemeMode(mode = themeMode) {
  if (mode === 'light' || mode === 'dark') return mode;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function applyThemeMode(mode = themeMode, persist = true) {
  themeMode = mode === 'light' || mode === 'dark' ? mode : 'system';
  const resolved = resolveThemeMode(themeMode);
  document.documentElement.setAttribute('data-theme', resolved);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', resolved === 'light' ? '#f4efe3' : '#0e0f14');

  const storage = getStorage();
  if (persist && storage) storage.setItem(THEME_STORAGE_KEY, themeMode);
  syncThemeButtons();
}

function syncThemeButtons() {
  const systemBtn = document.getElementById('themeSystemBtn');
  const darkBtn = document.getElementById('themeDarkBtn');
  const lightBtn = document.getElementById('themeLightBtn');
  if (systemBtn) systemBtn.classList.toggle('active', themeMode === 'system');
  if (darkBtn) darkBtn.classList.toggle('active', themeMode === 'dark');
  if (lightBtn) lightBtn.classList.toggle('active', themeMode === 'light');
}

function setThemeMode(mode) {
  applyThemeMode(mode, true);
}

function initializeThemeMode() {
  const storage = getStorage();
  const savedMode = storage ? storage.getItem(THEME_STORAGE_KEY) : null;
  themeMode = savedMode === 'light' || savedMode === 'dark' || savedMode === 'system' ? savedMode : 'system';
  applyThemeMode(themeMode, false);

  if (window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') applyThemeMode('system', false);
    };
    if (typeof media.addEventListener === 'function') media.addEventListener('change', handleChange);
    else if (typeof media.addListener === 'function') media.addListener(handleChange);
  }
}

function syncToggleButtons() {
  const requiredSwitch  = document.getElementById('requiredBtn');
  const shuffleSwitch   = document.getElementById('shuffleBtn');
  const directionSwitch = document.getElementById('directionBtn');
  const spacedSwitch    = document.getElementById('spacedBtn');
  const selfCheckBtn    = document.getElementById('selfCheckBtn');
  const shuffleToggle   = document.getElementById('shuffleToggle');
  const requiredToggle  = document.getElementById('requiredToggle');
  const directionToggle = document.getElementById('directionToggle');
  const spacedToggle    = document.getElementById('spacedToggle');
  const selfCheckToggle = document.getElementById('selfCheckToggle');
  const modeVocabBtn    = document.getElementById('modeVocabBtn');
  const modeMorphBtn    = document.getElementById('modeMorphBtn');
  const modeReaderBtn   = document.getElementById('modeReaderBtn');
  const modeShortcutVocabBtn = document.getElementById('modeShortcutVocabBtn');
  const modeShortcutMorphBtn = document.getElementById('modeShortcutMorphBtn');
  const modeShortcutReaderBtn = document.getElementById('modeShortcutReaderBtn');
  const resetDeckBtn = document.getElementById('resetDeckBtn');

  if (shuffleSwitch)   shuffleSwitch.classList.toggle('on',   !!shuffled);
  if (requiredSwitch)  requiredSwitch.classList.toggle('on',  !!requiredOnly);
  if (directionSwitch) directionSwitch.classList.toggle('on', !!directionToGreek);
  if (spacedSwitch)    spacedSwitch.classList.toggle('on',    !!spacedRepetition);
  if (selfCheckBtn)    selfCheckBtn.classList.toggle('on',    !!morphSelfCheck && isMorphologyMode());
  if (shuffleToggle)   shuffleToggle.setAttribute('aria-checked',   shuffled ? 'true' : 'false');
  if (requiredToggle)  requiredToggle.setAttribute('aria-checked',  requiredOnly ? 'true' : 'false');
  if (directionToggle) directionToggle.setAttribute('aria-checked', directionToGreek ? 'true' : 'false');
  if (spacedToggle)    spacedToggle.setAttribute('aria-checked',    spacedRepetition ? 'true' : 'false');
  if (selfCheckToggle) selfCheckToggle.setAttribute('aria-checked', (morphSelfCheck && isMorphologyMode()) ? 'true' : 'false');

  if (directionToggle) {
    const directionLabel = directionToggle.querySelector('.toggle-text');
    if (directionLabel) {
      directionLabel.textContent = isMorphologyMode()
        ? 'English → Greek'
        : 'Eng → Gk';
    }
  }
  if (modeVocabBtn)    modeVocabBtn.classList.toggle('active', studyMode === 'vocab');
  if (modeMorphBtn)    modeMorphBtn.classList.toggle('active', studyMode === 'morph');
  if (modeReaderBtn)   modeReaderBtn.classList.toggle('active', studyMode === 'reader');
  if (modeShortcutVocabBtn) modeShortcutVocabBtn.classList.toggle('active', studyMode === 'vocab');
  if (modeShortcutMorphBtn) modeShortcutMorphBtn.classList.toggle('active', studyMode === 'morph');
  if (modeShortcutReaderBtn) modeShortcutReaderBtn.classList.toggle('active', studyMode === 'reader');
  syncThemeButtons();
  if (resetDeckBtn) {
    resetDeckBtn.textContent = spacedRepetition ? 'Reset spaced' : 'Reset unspaced';
    resetDeckBtn.title = spacedRepetition
      ? 'Reset spaced-review scheduling for this deck only'
      : 'Reset unspaced marks for this deck only';
  }

  const subtitle = document.getElementById('appSubtitle');
  if (subtitle) subtitle.textContent = getModeDescription();

  syncLayoutVisibility();
}

function syncLayoutVisibility() {
  const controlsBar = document.getElementById('controlsBar');
  const navRow = document.getElementById('navRow');
  const markRow = document.getElementById('markRow');
  const fastForwardRow = document.getElementById('fastForwardRow');
  const prevBtn = navRow ? navRow.querySelector('.nav-prev') : null;
  const nextBtn = navRow ? navRow.querySelector('.nav-next') : null;
  const undoBtn = document.getElementById('spacedUndoBtn');
  const directionToggle = document.getElementById('directionToggle');
  const requiredToggle = document.getElementById('requiredToggle');
  const selfCheckToggle = document.getElementById('selfCheckToggle');
  const modeGroup = document.querySelector('.mode-group[aria-label="Study mode"]');
  const cardArea = document.getElementById('cardArea');
  const reviewShell = document.querySelector('.review-shell');
  const cardMode = isCardStudyMode();
  const reviewDeckMode = isReviewDeckMode();

  if (controlsBar) controlsBar.style.display = 'flex';
  if (cardArea) cardArea.style.display = cardMode ? '' : 'none';
  if (reviewShell) reviewShell.style.display = reviewDeckMode ? '' : 'none';
  if (navRow) navRow.style.display = reviewDeckMode && selectedKeys.length ? 'flex' : 'none';
  if (markRow) markRow.style.display = reviewDeckMode && selectedKeys.length && !isMorphologyMode() ? 'flex' : 'none';
  if (fastForwardRow) fastForwardRow.style.display = reviewDeckMode && selectedKeys.length && spacedRepetition ? 'flex' : 'none';
  if (directionToggle) directionToggle.style.display = (studyMode === 'vocab' || studyMode === 'morph') ? 'flex' : 'none';
  if (requiredToggle) requiredToggle.style.display = studyMode === 'vocab' ? 'flex' : 'none';
  if (selfCheckToggle) selfCheckToggle.style.display = isMorphologyMode() && canAccessGrammarUi() ? 'flex' : 'none';
  if (modeGroup) modeGroup.style.display = canAccessGrammarUi() ? 'inline-flex' : 'none';
  if (!reviewDeckMode) return;
  if (prevBtn) {
    if (isMorphologyMode()) {
      prevBtn.style.display = 'none';
    } else {
      prevBtn.style.display = spacedRepetition ? 'none' : '';
      prevBtn.disabled = currentIdx <= 0;
    }
  }
  if (undoBtn) {
    const showUndo = isMorphologyMode()
      ? (morphAnswerState.answered && !!spacedUndoSnapshot)
      : (spacedRepetition && !!spacedUndoSnapshot);
    undoBtn.style.display = showUndo ? '' : 'none';
  }
  if (nextBtn) {
    if (isMorphologyMode()) {
      nextBtn.textContent = 'Next →';
      nextBtn.classList.remove('spaced-again');
    } else {
      nextBtn.textContent = spacedRepetition ? 'Again →' : 'Next →';
      nextBtn.classList.toggle('spaced-again', !!spacedRepetition);
    }
  }

}

function ensureUsageStats(stats = appUsageStats) {
  const safe = sanitizeUsageStats(stats, MAX_STUDY_SESSION_HISTORY);
  if (stats !== safe) appUsageStats = safe;
  return safe;
}

function accumulateUsageTime(now = Date.now()) {
  const usage = ensureUsageStats();
  return accumulateUsageTimeForStats(usage, now);
}

function accumulateActiveStudyTime(now = Date.now()) {
  const usage = ensureUsageStats();
  return accumulateActiveStudyTimeForStats(usage, STUDY_IDLE_MS, now);
}

function finalizeStudySession(now = Date.now()) {
  const usage = ensureUsageStats();
  finalizeStudySessionForStats(usage, STUDY_IDLE_MS, MAX_STUDY_SESSION_HISTORY, now);
}

function noteStudyInteraction(now = Date.now()) {
  const usage = ensureUsageStats();
  noteStudyInteractionForStats(usage, {
    now,
    documentHidden: document.hidden,
    hasSelectedCards: selectedKeys.length > 0,
    studyIdleMs: STUDY_IDLE_MS,
    studySessionBreakMs: STUDY_SESSION_BREAK_MS,
    maxStudySessionHistory: MAX_STUDY_SESSION_HISTORY
  });
}

function getTodayUsageMs() {
  const usage = ensureUsageStats();
  return getUsageMsForDay(usage, getUsageDayKey());
}

function getTodayActiveStudyMs() {
  const usage = ensureUsageStats();
  return getActiveStudyMsForDay(usage, getUsageDayKey());
}

function updateUsageMeta() {
  const el = document.getElementById('progressMeta');
  if (!el) return;
  const usage = ensureUsageStats();
  el.textContent = `Today ${formatUsageDuration(getTodayActiveStudyMs())} · Study ${formatUsageDuration(usage.activeStudyMs)} · Total ${formatUsageDuration(usage.totalMs)}`;
}

function startUsageTracking() {
  ensureUsageStats();
  if (!document.hidden && !appUsageStats.lastActiveAt) {
    appUsageStats.lastActiveAt = Date.now();
  }

  if (!usageVisibilityBound) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const now = Date.now();
        accumulateUsageTime(now);
        finalizeStudySession(now);
        appUsageStats.lastActiveAt = 0;
        updateUsageMeta();
        saveState();
      } else {
        appUsageStats.lastActiveAt = Date.now();
        updateUsageMeta();
      }
    });

    window.addEventListener('pagehide', () => {
      const now = Date.now();
      accumulateUsageTime(now);
      finalizeStudySession(now);
      appUsageStats.lastActiveAt = 0;
      saveState();
    });

    usageVisibilityBound = true;
  }

  if (!usageTickHandle) {
    usageTickHandle = window.setInterval(() => {
      if (document.hidden) return;
      const now = Date.now();
      const delta = accumulateUsageTime(now);
      const activeDelta = accumulateActiveStudyTime(now);
      if (delta > 0 || activeDelta > 0) {
        updateUsageMeta();
        if (isAnalyticsModalOpen()) renderAnalyticsOverlay();
        usageTickCounter += 1;
        if (usageTickCounter >= 4) {
          usageTickCounter = 0;
          saveState();
        }
      }
    }, 15000);
  }
}


// ── Unspaced cycle state helpers (state-coupled) ──

function resetUnspacedCycleState() {
  unspacedCycleState = {};
  unspacedDeferredIds = new Set();
  flipsSinceReshuffle = 0;
}

function getUnspacedCycleEntry(cardId) {
  if (!unspacedCycleState[cardId] || typeof unspacedCycleState[cardId] !== 'object') {
    unspacedCycleState[cardId] = { wrongThisCycle: false, correctCount: 0, lastOutcome: null };
  }
  return unspacedCycleState[cardId];
}

function applyUnspacedSharedSchedule(card, outcome, reviewedAt = Date.now()) {
  const progress = getWordProgress(card.id);
  const cycleEntry = getUnspacedCycleEntry(card.id);
  const normalizedOutcome = outcome === 'easy' ? 'easy' : outcome === 'pass' ? 'pass' : 'again';

  if (normalizedOutcome === 'again') {
    cycleEntry.wrongThisCycle = true;
    cycleEntry.lastOutcome = 'again';
    setProgressDelay(progress, SRS_AGAIN_MS, reviewedAt);
    return progress;
  }

  const recoveringFromMiss = cycleEntry.wrongThisCycle;
  const minimumDelayMs = (normalizedOutcome === 'pass' || recoveringFromMiss)
    ? SRS_UNCERTAIN_MIN_MS
    : SRS_DAY_MS;

  cycleEntry.correctCount += 1;
  cycleEntry.lastOutcome = normalizedOutcome;
  setMinimumProgressDelay(progress, minimumDelayMs, reviewedAt);
  return progress;
}

// ── Card selection wrapper (state-coupled) ──

function getSelectedCards(keys) {
  if (isMorphologyMode()) {
    const cards = getSelectedGrammarCards(keys);
    if (isReverseGrammarActive()) {
      return cards.filter(card => card && card.reversible === true);
    }
    return cards;
  }
  return getSelectedVocabCards(keys, false);
}


function isSupplementalCard(card) {
  const key = String((card && card.sourceKey) || '');
  const set = key && window.SETS && typeof window.SETS === 'object' ? window.SETS[key] : null;
  return !!(
    card && (
      card.supplemental ||
      (set && (set.supplemental || set.type === 'supplemental')) ||
      /^W\d+O$/.test(key) ||
      /^W\d+_/.test(key)
    )
  );
}

function isAdvancedCard(card) {
  const key = String((card && card.sourceKey) || '');
  const set = key && window.SETS && typeof window.SETS === 'object' ? window.SETS[key] : null;
  return !!(
    card && (
      card.advanced ||
      (set && (set.advanced || set.type === 'advanced')) ||
      isAdvancedKey(key)
    )
  );
}

function advanceScheduledCards(cards = originalDeck, advanceMs = SRS_CYCLE_ADVANCE_MS) {
  const now = Date.now();
  (cards || []).forEach(card => {
    const progress = getWordProgress(card.id);
    if (progress.dueAt && progress.dueAt > now) {
      progress.dueAt = Math.max(now, progress.dueAt - advanceMs);
      progress.intervalDays = Math.max(0, (progress.dueAt - now) / SRS_DAY_MS);
    }
  });
}

function getWordProgress(cardId) {
  const progressStore = getDirectionalProgressStore();
  const existing = progressStore[cardId];
  if (existing && typeof existing === 'object') {
    existing.seenCount = Number.isFinite(existing.seenCount) ? Math.max(0, existing.seenCount) : 0;
    existing.passCount = Number.isFinite(existing.passCount) ? Math.max(0, existing.passCount) : 0;
    existing.failCount = Number.isFinite(existing.failCount) ? Math.max(0, existing.failCount) : 0;
    existing.streak = Number.isFinite(existing.streak) ? Math.max(0, existing.streak) : 0;
    existing.easyStreak = Number.isFinite(existing.easyStreak) ? Math.max(0, existing.easyStreak) : 0;
    existing.srsStage = Number.isFinite(existing.srsStage) ? Math.max(0, Math.floor(existing.srsStage)) : 0;
    existing.ease = clamp(Number.isFinite(existing.ease) ? existing.ease : 2.3, 1.3, 3.0);
    existing.intervalDays = Number.isFinite(existing.intervalDays) ? Math.max(0, existing.intervalDays) : 0;
    existing.lastEasyIntervalDays = Number.isFinite(existing.lastEasyIntervalDays) ? Math.max(0, existing.lastEasyIntervalDays) : 0;
    existing.dueAt = Number.isFinite(existing.dueAt) ? Math.max(0, existing.dueAt) : 0;
    existing.lastReviewedAt = Number.isFinite(existing.lastReviewedAt) ? Math.max(0, existing.lastReviewedAt) : 0;
    existing.firstSeenAt = Number.isFinite(existing.firstSeenAt) ? Math.max(0, existing.firstSeenAt) : 0;
    existing.firstConfirmedAt = Number.isFinite(existing.firstConfirmedAt) ? Math.max(0, existing.firstConfirmedAt) : 0;
    existing.confidence = Number.isFinite(existing.confidence) ? Math.max(0, existing.confidence) : 0;
    existing.confidenceHistory = Array.isArray(existing.confidenceHistory) ? existing.confidenceHistory.filter(value => Number.isFinite(value)).slice(-10) : [];
    return existing;
  }
  const fresh = {
    seenCount: 0,
    passCount: 0,
    failCount: 0,
    streak: 0,
    easyStreak: 0,
    srsStage: 0,
    ease: 2.3,
    intervalDays: 0,
    lastEasyIntervalDays: 0,
    dueAt: 0,
    lastReviewedAt: 0,
    firstSeenAt: 0,
    firstConfirmedAt: 0,
    confidence: 0,
    confidenceHistory: []
  };
  progressStore[cardId] = fresh;
  return fresh;
}

function isCardDue(card) {
  if (!spacedRepetition) return true;
  const progress = getWordProgress(card.id);
  return !progress.dueAt || progress.dueAt <= Date.now();
}

function sortCardsByDue(cards) {
  return [...cards].sort((a, b) => {
    const aDue = getWordProgress(a.id).dueAt || 0;
    const bDue = getWordProgress(b.id).dueAt || 0;
    if (aDue !== bDue) return aDue - bDue;
    return a.id.localeCompare(b.id);
  });
}

function clearSpacedUndoSnapshot() {
  spacedUndoSnapshot = null;
}

function captureSpacedUndoSnapshot() {
  if (!selectedKeys.length || !deck[currentIdx]) {
    clearSpacedUndoSnapshot();
    return;
  }
  if (!isMorphologyMode()) {
    if (!spacedRepetition || currentIdx >= activeDeckCount) {
      clearSpacedUndoSnapshot();
      return;
    }
  }
  spacedUndoSnapshot = {
    selectedKeys: cloneForUndo(selectedKeys),
    currentSessionId: currentSession ? currentSession.id : null,
    studyMode,
    directionToGreek,
    requiredOnly,
    shuffled,
    spacedRepetition,
    currentIdx,
    activeDeckCount,
    isFlipped,
    unspacedPendingRecycle,
    deck: cloneForUndo(deck),
    originalDeck: cloneForUndo(originalDeck),
    marksStore: cloneForUndo(getDirectionalMarksStore()),
    progressStore: cloneForUndo(getDirectionalProgressStore()),
    appUsageStats: cloneForUndo(appUsageStats),
    appGamification: cloneForUndo(appGamification)
  };
}

function restoreSpacedUndo() {
  if (!spacedUndoSnapshot) return;
  if (studyMode !== spacedUndoSnapshot.studyMode) return;
  if (!isMorphologyMode() && !spacedUndoSnapshot.spacedRepetition) return;
  if (directionToGreek !== spacedUndoSnapshot.directionToGreek) return;
  if (requiredOnly !== spacedUndoSnapshot.requiredOnly) return;
  if (shuffled !== spacedUndoSnapshot.shuffled) return;
  if (JSON.stringify(selectedKeys) !== JSON.stringify(spacedUndoSnapshot.selectedKeys || [])) return;
  if ((currentSession ? currentSession.id : null) !== (spacedUndoSnapshot.currentSessionId || null)) return;

  const marksStore = getDirectionalMarksStore();
  Object.keys(marksStore).forEach(key => delete marksStore[key]);
  Object.assign(marksStore, cloneForUndo(spacedUndoSnapshot.marksStore) || {});

  const progressStore = getDirectionalProgressStore();
  Object.keys(progressStore).forEach(key => delete progressStore[key]);
  Object.assign(progressStore, cloneForUndo(spacedUndoSnapshot.progressStore) || {});

  marks = marksStore;
  originalDeck = cloneForUndo(spacedUndoSnapshot.originalDeck) || [];
  deck = cloneForUndo(spacedUndoSnapshot.deck) || [];
  appUsageStats = ensureUsageStats(cloneForUndo(spacedUndoSnapshot.appUsageStats));
  appGamification = sanitizeGamificationState(cloneForUndo(spacedUndoSnapshot.appGamification));
  const restoredLevel = computeXpAndLevel(appUsageStats).currentLevel.level;
  if (!Number.isFinite(appGamification.lastCelebratedLevel) || appGamification.lastCelebratedLevel < 1 || appGamification.lastCelebratedLevel > restoredLevel) {
    appGamification.lastCelebratedLevel = restoredLevel;
  }
  currentIdx = Math.max(0, Math.min(spacedUndoSnapshot.currentIdx || 0, deck.length ? deck.length - 1 : 0));
  activeDeckCount = Math.max(0, spacedUndoSnapshot.activeDeckCount || 0);
  isFlipped = !!spacedUndoSnapshot.isFlipped;
  unspacedPendingRecycle = !!spacedUndoSnapshot.unspacedPendingRecycle;
  clearSpacedUndoSnapshot();
  resetMorphAnswerState();
  renderCard();
  renderReview();
  renderProgress();
  syncLayoutVisibility();
  saveState();
}

function buildStudyDeck(cards, options = {}) {
  if (!spacedRepetition) {
    activeDeckCount = cards.filter(card => marks[card.id] !== 'known').length;
    return shuffled ? shuffleArray([...cards]) : [...cards];
  }

  const forceShuffle = !!options.forceShuffle;
  let promotedNearCards = false;
  let dueCards = cards.filter(isCardDue);

  // Backstop: if nothing is due but cards are deferred within 1 hour,
  // promote them to due immediately so the user never hits a dead deck.
  if (!dueCards.length) {
    const now = Date.now();
    const nearCards = cards.filter(card => {
      const p = getWordProgress(card.id);
      return p.dueAt && p.dueAt > now && p.dueAt <= now + SRS_NEAR_WINDOW_MS;
    });
    if (nearCards.length) {
      nearCards.forEach(card => {
        const progress = getWordProgress(card.id);
        progress.dueAt = now;
        progress.intervalDays = 0;
      });
      promotedNearCards = true;
      dueCards = cards.filter(isCardDue);
    }
  }

  const deferredCards = cards.filter(card => !isCardDue(card));

  // Preserve existing order of due cards already in the current deck;
  // append newly-eligible cards (including "(x) return to deck" and
  // time-promoted cards) at the back.
  const prevDueIds = new Set(
    (deck || []).slice(0, activeDeckCount || 0)
      .filter(card => card && dueCards.some(d => d.id === card.id))
      .map(card => card.id)
  );

  const existingInOrder = [];
  (deck || []).forEach(card => {
    if (card && prevDueIds.has(card.id)) {
      const match = dueCards.find(d => d.id === card.id);
      if (match) existingInOrder.push(match);
    }
  });
  const newlyDue = dueCards.filter(card => !prevDueIds.has(card.id));

  let orderedDue;
  if (forceShuffle || promotedNearCards) {
    orderedDue = shuffleArray([...dueCards]);
  } else if (!existingInOrder.length) {
    // First build for this deck — apply shuffle preference if set.
    orderedDue = shuffled ? shuffleArray([...dueCards]) : sortCardsByDue(dueCards);
  } else {
    // Keep in-flight order stable; newly eligible cards go to the back.
    orderedDue = [...existingInOrder, ...newlyDue];
  }

  const orderedDeferred = sortCardsByDue(deferredCards);
  activeDeckCount = orderedDue.length;
  return [...orderedDue, ...orderedDeferred];
}

function recordStudyOutcome(cardId, outcome, reviewedAt = Date.now()) {
  const progress = getWordProgress(cardId);
  const isFirstConfirmation = !progress.firstConfirmedAt;
  const xpAward = computeCardXpAward(outcome, isFirstConfirmation, spacedRepetition);
  const usage = ensureUsageStats();
  if (usage.cardXpEarned < 0) migrateLegacyXp(usage);
  usage.cardXpEarned = (usage.cardXpEarned || 0) + xpAward;
  progress.seenCount += 1;
  progress.lastReviewedAt = reviewedAt;
  progress.firstSeenAt = progress.firstSeenAt || reviewedAt;
  recordConfidenceSample(progress, outcome);
  if (!progress.firstConfirmedAt) {
    const pct = getConfidencePct(progress);
    if (pct !== null && pct >= 70) progress.firstConfirmedAt = reviewedAt;
  }
  if (outcome === 'easy' || outcome === 'known') {
    progress.passCount += 1;
    progress.firstConfirmedAt = progress.firstConfirmedAt || reviewedAt;
  } else {
    progress.failCount += 1;
  }
  return progress;
}

function seedMinimumUncertainSchedule(cardId, reviewedAt = Date.now()) {
  const progress = getWordProgress(cardId);
  const minimumDelayMs = getUncertainDelayMs(progress);
  const minimumDueAt = reviewedAt + minimumDelayMs;
  if (!progress.dueAt || progress.dueAt < minimumDueAt) {
    setProgressDelay(progress, minimumDelayMs, reviewedAt);
  }
  return progress;
}

function getDeckAggregateStats(cards = originalDeck) {
  return (cards || []).reduce((totals, card) => {
    const progress = getWordProgress(card.id);
    totals.seenCount += progress.seenCount || 0;
    totals.passCount += progress.passCount || 0;
    totals.failCount += progress.failCount || 0;
    return totals;
  }, { seenCount: 0, passCount: 0, failCount: 0 });
}

function applySpacedReview(card, outcome) {
  const now = Date.now();
  const normalizedOutcome = outcome === 'pass' ? 'pass' : outcome === 'easy' ? 'easy' : 'again';
  const progress = recordStudyOutcome(card.id, normalizedOutcome, now);

  if (normalizedOutcome === 'easy') {
    const nextIntervalDays = getNextEasyIntervalDays(progress);
    progress.streak += 1;
    progress.easyStreak = (progress.easyStreak || 0) + 1;
    progress.srsStage = getSrsStage(progress) + 1;
    progress.ease = clamp(getSrsEase(progress) + 0.08, 1.3, 3.0);
    progress.lastEasyIntervalDays = nextIntervalDays;
    progress.firstConfirmedAt = progress.firstConfirmedAt || now;
    setProgressDelay(progress, msFromDays(nextIntervalDays), now);
    getDirectionalMarksStore()[card.id] = 'known';
  } else if (normalizedOutcome === 'pass') {
    progress.streak += 1;
    progress.easyStreak = 0;
    progress.ease = clamp(getSrsEase(progress) - 0.05, 1.3, 3.0);
    progress.lastEasyIntervalDays = Math.max(getLastEasyIntervalDays(progress), progress.intervalDays || 0);
    setProgressDelay(progress, getUncertainDelayMs(progress), now);
    getDirectionalMarksStore()[card.id] = 'unsure';
  } else {
    // 'again' (default for any unknown outcome)
    progress.streak = 0;
    progress.easyStreak = 0;
    progress.srsStage = Math.max(0, getSrsStage(progress) - 1);
    progress.ease = clamp(getSrsEase(progress) - 0.2, 1.3, 3.0);
    progress.lastEasyIntervalDays = Math.max(getLastEasyIntervalDays(progress), progress.intervalDays || 0);
    setProgressDelay(progress, SRS_AGAIN_MS, now);
    getDirectionalMarksStore()[card.id] = 'unsure';
  }

  progress.lastSpacedOutcome = normalizedOutcome;
  marks = getDirectionalMarksStore();
}

function getDueCount(cards = originalDeck) {
  return (cards || []).filter(isCardDue).length;
}




function getMorphSpacedOutcome(card, isCorrect) {
  if (!isCorrect) return 'again';
  const progress = getWordProgress(card.id);
  return progress.lastSpacedOutcome === 'again' ? 'pass' : 'easy';
}

function answerMorphologyChoice(choiceIndex) {
  if (!isMorphologyMode()) return;
  noteStudyInteraction();
  const card = deck[currentIdx];
  if (!card || morphAnswerState.answered) return;

  const reversed = reverseDisplayActive(card);
  const choices = reversed ? card.reverseChoices : card.choices;
  if (!Array.isArray(choices)) return;

  captureSpacedUndoSnapshot();

  const selected = choices[choiceIndex];
  const correctAnswer = reversed ? card.form : card.answer;
  const isCorrect = selected === correctAnswer;
  morphAnswerState = {
    answered: true,
    revealed: true,
    selfRated: true,
    selectedIndex: choiceIndex,
    isCorrect,
    skipped: false
  };

  if (spacedRepetition) {
    applySpacedReview(card, getMorphSpacedOutcome(card, isCorrect));
    morphPendingAdvance = true;
  } else {
    const mark = isCorrect ? 'known' : 'unsure';
    const reviewedAt = Date.now();
    recordStudyOutcome(card.id, isCorrect ? 'known' : 'review', reviewedAt);
    applyUnspacedSharedSchedule(card, isCorrect ? 'easy' : 'again', reviewedAt);
    getDirectionalMarksStore()[card.id] = mark;
    marks = getDirectionalMarksStore();
  }

  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function revealMorphologyAnswer() {
  if (!isMorphologyMode()) return;
  noteStudyInteraction();
  const card = deck[currentIdx];
  if (!card || morphAnswerState.revealed) return;
  morphAnswerState = {
    ...morphAnswerState,
    revealed: true
  };
  renderCard();
}

function rateMorphologySelfCheck(isCorrect) {
  if (!isMorphologyMode()) return;
  noteStudyInteraction();
  const card = deck[currentIdx];
  if (!card || !morphAnswerState.revealed || morphAnswerState.answered) return;

  captureSpacedUndoSnapshot();

  morphAnswerState = {
    answered: true,
    revealed: true,
    selfRated: true,
    selectedIndex: -1,
    isCorrect: !!isCorrect,
    skipped: false
  };

  if (spacedRepetition) {
    applySpacedReview(card, getMorphSpacedOutcome(card, isCorrect));
    morphPendingAdvance = true;
  } else {
    const mark = isCorrect ? 'known' : 'unsure';
    const reviewedAt = Date.now();
    recordStudyOutcome(card.id, isCorrect ? 'known' : 'review', reviewedAt);
    applyUnspacedSharedSchedule(card, isCorrect ? 'easy' : 'again', reviewedAt);
    getDirectionalMarksStore()[card.id] = mark;
    marks = getDirectionalMarksStore();
  }

  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function passMorphologyChoice() {
  if (!isMorphologyMode()) return;
  noteStudyInteraction();
  const card = deck[currentIdx];
  if (!card || morphAnswerState.answered) return;

  captureSpacedUndoSnapshot();

  morphAnswerState = {
    answered: true,
    revealed: true,
    selfRated: true,
    selectedIndex: -1,
    isCorrect: false,
    skipped: true
  };

  if (spacedRepetition) {
    applySpacedReview(card, 'pass');
    morphPendingAdvance = true;
  } else {
    const reviewedAt = Date.now();
    recordStudyOutcome(card.id, 'pass', reviewedAt);
    applyUnspacedSharedSchedule(card, 'pass', reviewedAt);
    getDirectionalMarksStore()[card.id] = 'unsure';
    marks = getDirectionalMarksStore();
  }

  renderCard();
  renderProgress();
  renderReview();
  saveState();
}



function getKnownCount() {
  return originalDeck.filter(card => marks[card.id] === 'known').length;
}

function getRemainingCards() {
  if (spacedRepetition) {
    return deck.slice(0, activeDeckCount);
  }
  return deck.filter(card => marks[card.id] !== 'known');
}

function moveCardToBackOfActivePile(card) {
  if (!card) return false;
  const directionalMarks = getDirectionalMarksStore();

  const currentCardId = deck[currentIdx]?.id || null;
  directionalMarks[card.id] = 'unsure';
  marks = directionalMarks;

  deck = deck.filter(candidate => candidate.id !== card.id);
  const splitAt = deck.findIndex(candidate => marks[candidate.id] === 'known');
  const insertAt = splitAt === -1 ? deck.length : splitAt;
  deck.splice(insertAt, 0, card);

  activeDeckCount = originalDeck.filter(candidate => marks[candidate.id] !== 'known').length;
  if (currentCardId) {
    const restoredIdx = deck.findIndex(candidate => candidate.id === currentCardId);
    if (restoredIdx >= 0) currentIdx = restoredIdx;
  }
  unspacedPendingRecycle = false;
  return true;
}

function maybePeriodicReshuffle() {
  if (!shuffled) return;
  flipsSinceReshuffle++;
  if (flipsSinceReshuffle >= 10) {
    flipsSinceReshuffle = 0;
    reshuffleUpcomingCards();
  }
}

function reshuffleUpcomingCards() {
  const start = currentIdx + 1;
  // In spaced mode keep deferred (not-yet-due) cards in their dueAt order at
  // the tail; only reshuffle the active (due) portion ahead of currentIdx.
  const end = spacedRepetition
    ? Math.min(activeDeckCount, deck.length)
    : deck.length;
  if (start >= end) return;
  const upcoming = [];
  const pinned = [];
  for (let i = start; i < end; i++) {
    const id = deck[i].id;
    if (marks[id] === 'known' || unspacedDeferredIds.has(id)) pinned.push(deck[i]);
    else upcoming.push(deck[i]);
  }
  if (upcoming.length < 2) return;
  const tail = deck.slice(end);
  deck = [...deck.slice(0, start), ...shuffleArray(upcoming), ...pinned, ...tail];
}

function maybeReturnKnownCardToActivePile() {
  if (spacedRepetition || isMorphologyMode() || KNOWN_CARD_RANDOM_RETURN_FLIP_ODDS <= 0) return false;
  if (!originalDeck.length || currentIdx >= deck.length) return false;

  const currentCardId = deck[currentIdx]?.id || null;
  const knownCards = originalDeck.filter(card => card.id !== currentCardId && marks[card.id] === 'known');
  if (!knownCards.length) return false;

  const returnChance = 1 / KNOWN_CARD_RANDOM_RETURN_FLIP_ODDS;
  if (Math.random() >= returnChance) return false;

  const card = knownCards[Math.floor(Math.random() * knownCards.length)];
  return moveCardToBackOfActivePile(card);
}

function maybeReturnConfirmedDeferredCard() {
  if (!spacedRepetition || !shuffled || isMorphologyMode()) return false;
  if (CONFIRMED_CARD_RANDOM_RETURN_FLIP_ODDS <= 0) return false;
  if (Math.random() >= 1 / CONFIRMED_CARD_RANDOM_RETURN_FLIP_ODDS) return false;

  const eligible = (originalDeck || []).filter(card => {
    if (isCardDue(card)) return false;
    const pct = getConfidencePct(getWordProgress(card.id));
    return pct !== null && pct > 75;
  });
  if (!eligible.length) return false;

  const pick = eligible[Math.floor(Math.random() * eligible.length)];
  getWordProgress(pick.id).dueAt = Date.now();
  deck = buildStudyDeck(originalDeck);
  return true;
}


function buildPersistedStatePayload() {
  saveCurrentDeckStateToBank();
  const usage = ensureUsageStats();
  return {
    currentSessionId: currentSession ? currentSession.id : null,
    selectedKeys: [...selectedKeys],
    shuffled,
    requiredOnly,
    requiredOnlyDefaultedV1: true,
    directionToGreek,
    spacedRepetition,
    studyMode,
    appProfile,
    morphSelfCheck,
    gamification: sanitizeGamificationState(appGamification),
    deckStates,
    globalWordMarks,
    globalWordProgress,
    appUsageStats: {
      totalMs: usage.totalMs,
      dailyMs: usage.dailyMs,
      activeStudyMs: usage.activeStudyMs,
      activeDailyMs: usage.activeDailyMs,
      firstStudyAt: usage.firstStudyAt,
      studySessionHistory: usage.studySessionHistory,
      cardXpEarned: usage.cardXpEarned,
      lastActiveAt: 0,
      lastStudyInteractionAt: 0,
      lastStudyCountedAt: 0,
      currentStudySession: null
    }
  };
}

function sanitizeImportedState(candidate) {
  if (!isPlainObject(candidate)) return null;
  const hasRecognizedStateShape = ['selectedKeys', 'deckStates', 'globalWordMarks', 'globalWordProgress', 'appUsageStats']
    .some(key => key in candidate);
  if (!hasRecognizedStateShape) return null;

  const state = { ...candidate };
  state.selectedKeys = Array.isArray(candidate.selectedKeys) ? candidate.selectedKeys.map(String) : [];
  state.deckStates = isPlainObject(candidate.deckStates) ? candidate.deckStates : {};
  state.globalWordMarks = isPlainObject(candidate.globalWordMarks) ? candidate.globalWordMarks : {};
  state.globalWordProgress = isPlainObject(candidate.globalWordProgress) ? candidate.globalWordProgress : {};
  state.studyMode = normalizeStudyMode(candidate.studyMode);
  state.appProfile = 'vocab_grammar';
  state.gamification = sanitizeGamificationState(candidate.gamification);
  state.shuffled = candidate.shuffled !== false;
  state.requiredOnly = candidate.requiredOnly !== false;
  state.directionToGreek = !!candidate.directionToGreek;
  state.spacedRepetition = candidate.spacedRepetition !== false;
  state.morphSelfCheck = !!candidate.morphSelfCheck;

  const usage = ensureUsageStats(candidate.appUsageStats);
  state.appUsageStats = {
    totalMs: usage.totalMs,
    dailyMs: usage.dailyMs,
    activeStudyMs: usage.activeStudyMs,
    activeDailyMs: usage.activeDailyMs,
    firstStudyAt: usage.firstStudyAt,
    studySessionHistory: usage.studySessionHistory,
    cardXpEarned: usage.cardXpEarned,
    lastActiveAt: 0,
    lastStudyInteractionAt: 0,
    lastStudyCountedAt: 0,
    currentStudySession: null
  };

  return state;
}

function applyImportedState(state, options = {}) {
  const storage = getStorage();
  if (!storage) return false;

  const sanitized = sanitizeImportedState(state);
  if (!sanitized) return false;

  storage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  if (options.disclaimerAccepted) {
    storage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    hasAcceptedDisclaimer = true;
  }

  const restored = restoreState();
  if (!restored) {
    currentSession = null;
    selectedKeys = [];
    deck = [];
    originalDeck = [];
    currentIdx = 0;
    isFlipped = false;
    marks = getDirectionalMarksStore();
    resetMorphAnswerState();
    resetUnspacedCycleState();
    unspacedPendingRecycle = false;
    activeDeckCount = 0;
    setActiveSessionButton();
    setActiveSetButtons();
    syncToggleButtons();
    syncLayoutVisibility();
    renderCard();
    renderProgress();
    renderReview();
  } else {
    syncLayoutVisibility();
  }

  saveState();
  return true;
}

function buildProgressExportPayload() {
  const storage = getStorage();
  if (!storage) return null;

  // Flush any uncounted time so the export captures the latest totals
  accumulateUsageTime();
  accumulateActiveStudyTime();

  const appState = buildPersistedStatePayload();

  // The persisted payload zeros currentStudySession. If there was an
  // in-progress session, push a snapshot into the exported history so
  // session time is not lost on import.
  const liveSession = appUsageStats.currentStudySession;
  if (liveSession && liveSession.startedAt && liveSession.durationMs > 0) {
    const sessionSnapshot = {
      startedAt: liveSession.startedAt,
      endedAt: appUsageStats.lastStudyCountedAt || Date.now(),
      durationMs: liveSession.durationMs,
      interactionCount: liveSession.interactionCount || 0
    };
    if (!appState.appUsageStats.studySessionHistory) appState.appUsageStats.studySessionHistory = [];
    appState.appUsageStats.studySessionHistory.push(sessionSnapshot);
  }

  return {
    format: PROGRESS_EXPORT_FORMAT,
    version: PROGRESS_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    disclaimerAccepted: storage.getItem(CONSENT_STORAGE_KEY) === 'accepted',
    summary: summarizePersistedState(appState),
    appState
  };
}

function createProgressExportBundle() {
  const payload = buildProgressExportPayload();
  if (!payload) return null;
  const jsonText = JSON.stringify(payload, null, 2);
  const stamp = payload.exportedAt.slice(0, 19).replace(/[:T]/g, '-');
  return {
    payload,
    jsonText,
    filename: `greek-flashcards-progress-${stamp}.json`
  };
}

async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {}
  return false;
}

function setTransferModalContent({ label = 'Progress tools', title = '', copy = '', textareaValue = '', textareaPlaceholder = '', primaryText = 'Close', secondaryText = '', showTextarea = false }) {
  const labelEl = document.getElementById('transferLabel');
  const titleEl = document.getElementById('transferTitle');
  const copyEl = document.getElementById('transferCopy');
  const textarea = document.getElementById('transferTextarea');
  const primaryBtn = document.getElementById('transferPrimaryBtn');
  const secondaryBtn = document.getElementById('transferSecondaryBtn');

  if (labelEl) labelEl.textContent = label;
  if (titleEl) titleEl.textContent = title;
  if (copyEl) copyEl.textContent = copy;
  if (textarea) {
    textarea.value = textareaValue;
    textarea.placeholder = textareaPlaceholder;
    textarea.style.display = showTextarea ? 'block' : 'none';
  }
  if (primaryBtn) {
    primaryBtn.textContent = primaryText;
    primaryBtn.style.display = primaryText ? 'inline-flex' : 'none';
  }
  if (secondaryBtn) {
    secondaryBtn.textContent = secondaryText;
    secondaryBtn.style.display = secondaryText ? 'inline-flex' : 'none';
  }
}

function openTransferModal(config) {
  const overlay = document.getElementById('transferOverlay');
  if (!overlay) return;

  transferModalMode = config?.mode || '';
  transferPrimaryAction = typeof config?.primaryAction === 'function' ? config.primaryAction : null;
  transferSecondaryAction = typeof config?.secondaryAction === 'function' ? config.secondaryAction : null;
  setTransferModalContent(config || {});
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  const textarea = document.getElementById('transferTextarea');
  if (config?.showTextarea && textarea) {
    setTimeout(() => textarea.focus(), 0);
  }
}

function closeTransferModal() {
  const overlay = document.getElementById('transferOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  transferModalMode = '';
  transferPrimaryAction = null;
  transferSecondaryAction = null;
  if (!isDisclaimerModalOpen() && !isAnalyticsModalOpen()) document.body.classList.remove('modal-open');
}

function handleTransferPrimaryAction() {
  if (typeof transferPrimaryAction === 'function') transferPrimaryAction();
}

function handleTransferSecondaryAction() {
  if (typeof transferSecondaryAction === 'function') transferSecondaryAction();
}

function tryDownloadProgressJsonFile(jsonText, filename) {
  if (isLikelyIOS()) return false;

  try {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return true;
  } catch (err) {
    return false;
  }
}

async function tryShareProgressJsonFile(jsonText, filename) {
  if (!navigator.share || typeof File === 'undefined') return false;

  try {
    const file = new File([jsonText], filename, { type: 'application/json' });
    if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;
    await navigator.share({
      title: 'Greek flashcards progress export',
      text: 'Progress backup exported from the Greek flashcards app.',
      files: [file]
    });
    return true;
  } catch (err) {
    return err?.name === 'AbortError' ? true : false;
  }
}

function showExportFallbackModal(jsonText, filename) {
  openTransferModal({
    mode: 'export',
    label: 'Progress export',
    title: 'Save your progress JSON',
    copy: 'iPhone Safari and standalone web apps are temperamental about file downloads. Use the button below to copy the JSON, then paste it into a new plain-text file in Files, Notes, or another app.',
    textareaValue: jsonText,
    primaryText: 'Copy JSON',
    secondaryText: '',
    showTextarea: true,
    primaryAction: async () => {
      const textarea = document.getElementById('transferTextarea');
      const text = textarea?.value || jsonText;
      let copied = await copyTextToClipboard(text);
      if (!copied && textarea) {
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        try { copied = document.execCommand('copy'); } catch (err) {}
      }
      window.alert(copied
        ? `JSON copied. Save it as ${filename} somewhere you can reach from your iPhone.`
        : 'Copy did not complete automatically. The JSON is shown in the box so you can select and copy it manually.');
    }
  });
}

async function exportProgressJson() {
  const storage = getStorage();
  if (!storage) {
    window.alert('Local storage is unavailable, so progress export cannot run on this device.');
    return;
  }

  const bundle = createProgressExportBundle();
  if (!bundle) {
    window.alert('Progress export could not be prepared on this device.');
    return;
  }

  const { jsonText, filename } = bundle;

  if (await tryShareProgressJsonFile(jsonText, filename)) return;
  if (tryDownloadProgressJsonFile(jsonText, filename)) return;

  showExportFallbackModal(jsonText, filename);
}

function importProgressFromJsonText(rawText, options = {}) {
  const parsed = JSON.parse(String(rawText || '{}'));
  const wrappedState = parsed?.format === PROGRESS_EXPORT_FORMAT && isPlainObject(parsed.appState)
    ? parsed.appState
    : parsed;
  const disclaimerAccepted = parsed?.format === PROGRESS_EXPORT_FORMAT
    ? !!parsed.disclaimerAccepted
    : !!options.disclaimerAccepted;
  const summary = parsed?.format === PROGRESS_EXPORT_FORMAT && isPlainObject(parsed.summary)
    ? parsed.summary
    : summarizePersistedState(wrappedState);

  const success = applyImportedState(wrappedState, { disclaimerAccepted });
  if (!success) throw new Error('Invalid progress file shape.');
  return summary;
}

function openNativeImportPicker() {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.width = '1px';
    input.style.height = '1px';
    input.style.opacity = '0';

    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };

    input.addEventListener('change', event => {
      handleImportedProgressFile(event);
      setTimeout(cleanup, 0);
    }, { once: true });

    document.body.appendChild(input);
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
    return true;
  } catch (err) {
    return false;
  }
}

function triggerImportProgress() {
  openTransferModal({
    mode: 'import',
    label: 'Progress import',
    title: 'Import saved progress',
    copy: 'Choose a progress JSON file. If your iPhone does not open the file picker, paste the exported JSON into the box below instead.',
    textareaValue: '',
    textareaPlaceholder: 'Paste exported progress JSON here…',
    primaryText: 'Import pasted JSON',
    secondaryText: 'Choose JSON file',
    showTextarea: true,
    primaryAction: () => {
      const textarea = document.getElementById('transferTextarea');
      const rawText = textarea?.value?.trim() || '';
      if (!rawText) {
        window.alert('Paste the exported JSON into the box first, or use “Choose JSON file.”');
        return;
      }

      try {
        const summary = importProgressFromJsonText(rawText);
        closeTransferModal();
        window.alert(`Progress imported successfully. ${formatPersistedStateSummary(summary)}`);
      } catch (err) {
        window.alert('Import failed. Please paste a valid progress JSON exported from this app.');
      }
    },
    secondaryAction: () => {
      const opened = openNativeImportPicker();
      if (!opened) {
        window.alert('This device would not open the file picker. Please paste the exported JSON into the box instead.');
      }
    }
  });
}

function handleImportedProgressFile(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const summary = importProgressFromJsonText(reader.result);
      closeTransferModal();
      window.alert(`Progress imported successfully. ${formatPersistedStateSummary(summary)}`);
    } catch (err) {
      window.alert('Import failed. Please choose a valid progress JSON exported from this app.');
    } finally {
      if (event?.target) event.target.value = '';
    }
  };
  reader.onerror = () => {
    window.alert('Import failed because the selected file could not be read.');
    if (event?.target) event.target.value = '';
  };
  reader.readAsText(file);
}

function getDeckStateKey(keys = selectedKeys, requiredFlag = requiredOnly, spacedFlag = spacedRepetition) {
  const normalizedKeys = sortSetKeys((keys || []).map(String));
  return JSON.stringify({
    keys: normalizedKeys,
    requiredOnly: !!requiredFlag,
    spacedRepetition: !!spacedFlag,
    direction: getStudyStoreKey(),
    mode: studyMode
  });
}

function saveCurrentDeckStateToBank() {
  if (!selectedKeys.length) return;

  const deckKey = getDeckStateKey(selectedKeys, requiredOnly);
  deckStates[deckKey] = {
    currentSessionId: currentSession ? currentSession.id : null,
    selectedKeys: [...selectedKeys],
    deckIds: deck.map(card => card.id),
    currentIdx,
    unspacedPendingRecycle: !spacedRepetition && !!unspacedPendingRecycle
  };
}

function saveState() {
  const storage = getStorage();
  if (!storage) return;
  maybeCelebrateLevelUp();
  maybeCelebrateAchievements();
  storage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedStatePayload()));
}

function clearSavedState() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
}

function reorderDeckFromIds(cards, deckIds) {
  if (!Array.isArray(deckIds) || !deckIds.length) return null;
  const byId = new Map(cards.map(card => [card.id, card]));
  const ordered = [];
  deckIds.forEach(id => {
    const match = byId.get(id);
    if (match) {
      ordered.push(match);
      byId.delete(id);
    }
  });
  ordered.push(...byId.values());
  return ordered;
}

function restoreState() {
  const storage = getStorage();
  if (!storage) return false;

  let raw = storage.getItem(STORAGE_KEY);
  // One-time fallback: if no V16 data exists yet, load older saved data and migrate it.
  if (!raw) {
    const legacyV17 = storage.getItem('greekFlashcardsStateV17');
    if (legacyV17) raw = legacyV17;
  }
  if (!raw) {
    const legacyV15 = storage.getItem('greekFlashcardsStateV15');
    if (legacyV15) raw = legacyV15;
  }
  if (!raw) {
    const legacyV14 = storage.getItem('greekFlashcardsStateV14');
    if (legacyV14) raw = legacyV14;
  }
  if (!raw) {
    const legacyV12 = storage.getItem('greekFlashcardsStateV12');
    if (legacyV12) raw = legacyV12;
  }
  if (!raw) {
    const legacyV11 = storage.getItem('greekFlashcardsStateV11');
    if (legacyV11) raw = legacyV11;
  }
  if (!raw) {
    const legacyV10 = storage.getItem('greekFlashcardsStateV10');
    if (legacyV10) raw = legacyV10;
  }
  if (!raw) return false;

  try {
    let saved = JSON.parse(raw);

    // Run any applicable migrations.
    for (const migration of STATE_MIGRATIONS) {
      try {
        if (migration.match(saved)) saved = migration.migrate(saved);
      } catch (err) {
        console.warn(`Migration "${migration.name}" failed:`, err);
      }
    }

    selectedKeys = Array.isArray(saved.selectedKeys) ? sortSetKeys(saved.selectedKeys.map(String)) : [];
    requiredOnly = saved.requiredOnly !== false;
    directionToGreek = !!saved.directionToGreek;
    spacedRepetition = saved.spacedRepetition !== false;
    appProfile = 'vocab_grammar';
    const hadSavedAchievementSnapshot = Array.isArray(saved?.gamification?.lastEarnedAchievementIds);
    appGamification = sanitizeGamificationState(saved.gamification);
    studyMode = normalizeStudyMode(saved.studyMode);
    morphSelfCheck = !!saved.morphSelfCheck;
    shuffled = saved.shuffled !== false;
    deckStates = saved.deckStates && typeof saved.deckStates === 'object' ? saved.deckStates : {};
    globalWordMarks = saved.globalWordMarks && typeof saved.globalWordMarks === 'object' ? saved.globalWordMarks : {};
    globalWordProgress = saved.globalWordProgress && typeof saved.globalWordProgress === 'object' ? saved.globalWordProgress : {};
    appUsageStats = ensureUsageStats(saved.appUsageStats);
    appUsageStats.lastActiveAt = 0;
    const restoredLevel = computeXpAndLevel(appUsageStats).currentLevel.level;
    if (!Number.isFinite(appGamification.lastCelebratedLevel) || appGamification.lastCelebratedLevel < 1 || appGamification.lastCelebratedLevel > restoredLevel) {
      appGamification.lastCelebratedLevel = restoredLevel;
    }
    if (appGamification.lastCelebratedBadgeDay && !/^\d{4}-\d{2}-\d{2}$/.test(appGamification.lastCelebratedBadgeDay)) {
      appGamification.lastCelebratedBadgeDay = null;
    }
    ensureDirectionalStores();
    if (hadSavedAchievementSnapshot && !Array.isArray(appGamification.lastEarnedAchievementIds)) {
      appGamification.lastEarnedAchievementIds = [];
    }

    if (!selectedKeys.length) {
      clearSpacedUndoSnapshot();
      syncToggleButtons();
      return false;
    }

    currentSession = saved.currentSessionId ? getSessions().find(s => s.id === saved.currentSessionId) || null : null;

    const selectedCards = getSelectedCards(selectedKeys);
    originalDeck = requiredOnly ? selectedCards.filter(card => card.required) : selectedCards;
    resetMorphAnswerState();
    const savedDeckState = deckStates[getDeckStateKey(selectedKeys, requiredOnly)] || null;
    marks = getDirectionalMarksStore();
    const restoredDeck = savedDeckState ? reorderDeckFromIds(originalDeck, savedDeckState.deckIds) : null;
    if (spacedRepetition && restoredDeck) {
      deck = restoredDeck;
      activeDeckCount = restoredDeck.length;
      deck = buildStudyDeck(originalDeck, { forceShuffle: shuffled });
    } else if (restoredDeck) {
      deck = shuffled ? shuffleArray([...restoredDeck]) : restoredDeck;
    } else {
      deck = buildStudyDeck(originalDeck);
    }
    resetUnspacedCycleState();
    activeDeckCount = spacedRepetition ? getDueCount(originalDeck) : originalDeck.filter(card => marks[card.id] !== 'known').length;
    currentIdx = savedDeckState && Number.isInteger(savedDeckState.currentIdx)
      ? Math.min(Math.max(savedDeckState.currentIdx, 0), spacedRepetition ? activeDeckCount : deck.length)
      : 0;
    unspacedPendingRecycle = !spacedRepetition && !!(savedDeckState && savedDeckState.unspacedPendingRecycle);
    isFlipped = false;
    clearSpacedUndoSnapshot();

    setActiveSessionButton();
    setActiveSetButtons();
    syncToggleButtons();
    renderCard();
    renderProgress();
    renderReview();
    return true;
  } catch (err) {
    clearSavedState();
    return false;
  }
}

function startNextCycle(mode = 'remaining') {
  unspacedDeferredIds = new Set();
  flipsSinceReshuffle = 0;
  if (mode === 'full') {
    const directionalMarks = getDirectionalMarksStore();
    (originalDeck || []).forEach(card => {
      delete directionalMarks[card.id];
    });
    marks = directionalMarks;
    const fullDeck = shuffleArray([...(originalDeck || [])]);
    deck = fullDeck;
    currentIdx = fullDeck.length ? 0 : deck.length;
  } else {
    const remaining = shuffleArray([...getRemainingCards()]);
    const known = (originalDeck || []).filter(card => marks[card.id] === 'known');
    deck = [...remaining, ...known];
    currentIdx = remaining.length ? 0 : deck.length;
  }
  resetUnspacedCycleState();
  unspacedPendingRecycle = false;
  saveState();
}

function resetStudyState() {
  marks = getDirectionalMarksStore();
  currentIdx = 0;
  activeDeckCount = spacedRepetition ? getDueCount(originalDeck) : originalDeck.filter(card => marks[card.id] !== 'known').length;
  resetUnspacedCycleState();
  unspacedPendingRecycle = false;
  isFlipped = false;
}

function isSessionFullySelected(session, keys = selectedKeys) {
  const sessionKeys = expandSessionSets(session);
  return sessionKeys.length > 0 && sessionKeys.every(key => keys.includes(String(key)));
}

function findExactSessionMatch(keys = selectedKeys) {
  const normalizedKeys = sortSetKeys((keys || []).map(String));
  return getSessions().find(session => {
    const sessionKeys = expandSessionSets(session);
    return sessionKeys.length === normalizedKeys.length && sessionKeys.every((key, idx) => key === normalizedKeys[idx]);
  }) || null;
}

function setActiveSessionButton() {
  document.querySelectorAll('.session-btn').forEach(btn => {
    const session = getSessions().find(s => s.id === btn.dataset.sessionId);
    btn.classList.toggle('active', !!session && isSessionFullySelected(session));
  });
}

function setActiveSetButtons() {
  document.querySelectorAll('.chapter-btn').forEach(btn => {
    const key = btn.dataset.key;
    btn.classList.toggle('active', selectedKeys.includes(key));
  });
}

// ═══════════════════════════════════════════════════════
//  BUILD SELECTORS
// ═══════════════════════════════════════════════════════
function buildSessions() {
  const grid = document.getElementById('sessionsGrid');
  grid.innerHTML = '';
  getSessions().forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'session-btn' + (s.special ? ' special' : '');
    btn.id = 'sess-' + s.id;
    btn.dataset.sessionId = s.id;
    const summaryHtml = canAccessGrammarUi()
      ? `<br><span class="session-chapters">${s.summary}</span>`
      : '';
    btn.innerHTML = `<span class="session-tag">${s.tag}</span>${s.label}${summaryHtml}`;
    btn.onclick = () => toggleSession(s);
    grid.appendChild(btn);
  });

  const deselectBtn = document.createElement('button');
  deselectBtn.type = 'button';
  deselectBtn.className = 'chapter-btn supplemental-deselect-all';
  deselectBtn.textContent = 'Deselect all sessions';
  deselectBtn.onclick = () => deselectAllChapters();
  grid.appendChild(deselectBtn);

  setActiveSessionButton();
}

function buildChapterSelector() {
  const grid = document.getElementById('chaptersGrid');
  if (!grid) return;
  grid.innerHTML = '';
  grid.classList.add('chapters-grid');

  const sets = window.SETS && typeof window.SETS === 'object' ? window.SETS : {};
  const chapterKeys = Object.keys(sets).filter(isChapterKey).sort((a, b) => Number(a) - Number(b));

  const deselectBtn = document.createElement('button');
  deselectBtn.type = 'button';
  deselectBtn.className = 'chapter-btn supplemental-deselect-all';
  deselectBtn.textContent = 'Deselect all chapters';
  deselectBtn.onclick = () => deselectAllChapters();
  grid.appendChild(deselectBtn);

  chapterKeys.forEach(key => {
    const set = sets[key];
    if (!set) return;
    const morphCount = window.getMorphologyCountForKey ? window.getMorphologyCountForKey(key) : 0;
    const grammarCount = window.getGrammarCountForKey ? window.getGrammarCountForKey(key) : 0;
    const studyCount = morphCount + grammarCount;
    const vocabCount = Array.isArray(set.cards) ? set.cards.length : 0;
    if (!vocabCount && !studyCount) return;
    if (!canAccessGrammarUi() && !vocabCount) return;

    const btn = document.createElement('button');
    btn.className = 'chapter-btn';
    btn.dataset.key = key;
    const countLabel = canAccessGrammarUi()
      ? `${vocabCount} vocab${studyCount ? ` · ${studyCount} grammar` : ''}`
      : `${vocabCount} vocab`;
    btn.innerHTML = `${set.label}<span class="chapter-count">${countLabel}</span>`;
    btn.onclick = () => toggleSet(key);
    grid.appendChild(btn);
  });

  setActiveSetButtons();
}

function getSupplementalParadigmsForKey(key) {
  const raw = String(key);
  const paradigms = [];
  const morphSet = window.MORPHOLOGY_SETS?.[raw];
  if (morphSet && Array.isArray(morphSet.items)) {
    morphSet.items.forEach((item, idx) => {
      paradigms.push({
        key: `${raw}::morph::${idx}`,
        type: 'Morphology',
        label: item.family || item.lemma || `Morphology ${idx + 1}`,
        count: Array.isArray(item.questions) ? item.questions.length : 0
      });
    });
  }

  const grammarSet = window.GRAMMAR_SETS?.[raw];
  if (grammarSet && Array.isArray(grammarSet.items)) {
    grammarSet.items.forEach((item, idx) => {
      paradigms.push({
        key: `${raw}::grammar::${idx}`,
        type: 'Grammar',
        label: item.family || item.lemma || `Grammar ${idx + 1}`,
        count: Array.isArray(item.questions) ? item.questions.length : 0
      });
    });
  }

  return paradigms.filter(paradigm => paradigm.count > 0);
}

function deselectAllSupplementals() {
  const remaining = selectedKeys.filter(k => {
    const base = getParadigmBaseKey(k) || k;
    return isChapterKey(base) || isAdvancedKey(base);
  });
  if (remaining.length === selectedKeys.length) return;
  saveCurrentDeckStateToBank();
  currentSession = null;
  selectedKeys = remaining;
  if (!selectedKeys.length) {
    setActiveSessionButton();
    setActiveSetButtons();
    deck = [];
    originalDeck = [];
    marks = {};
    currentIdx = 0;
    document.getElementById('cardArea').innerHTML = '<div class="empty-state"><div class="big">αβγ</div>Tap to choose a session and start studying.</div>';
    clearSpacedUndoSnapshot();
    syncToggleButtons();
    renderReview();
    saveState();
    return;
  }
  loadDeckFromKeys(selectedKeys, null);
}

function buildSupplementalSelector() {
  const list = document.getElementById('supplementalGrid');
  if (!list) return;
  list.innerHTML = '';

  const sets = window.SETS && typeof window.SETS === 'object' ? window.SETS : {};
  const supplementalKeys = sortSetKeys(Object.keys(sets).filter(k => !isChapterKey(k) && !isAdvancedKey(k)));

  const deselectBtn = document.createElement('button');
  deselectBtn.type = 'button';
  deselectBtn.className = 'chapter-btn supplemental-deselect-all';
  deselectBtn.textContent = 'Deselect all supplementals';
  deselectBtn.onclick = () => deselectAllSupplementals();
  list.appendChild(deselectBtn);

  const weekGroups = new Map();
  supplementalKeys.forEach(key => {
    const set = sets[key];
    if (!set) return;
    const vocabCount = Array.isArray(set.cards) ? set.cards.length : 0;
    const morphCount = window.getMorphologyCountForKey ? window.getMorphologyCountForKey(key) : 0;
    const grammarCount = window.getGrammarCountForKey ? window.getGrammarCountForKey(key) : 0;
    const studyCount = morphCount + grammarCount;
    if (!vocabCount && !studyCount) return;
    if (!canAccessGrammarUi() && !vocabCount) return;

    const weekNum = Number.isFinite(Number(set.week)) ? Number(set.week) : null;
    if (!weekGroups.has(weekNum)) weekGroups.set(weekNum, []);
    weekGroups.get(weekNum).push({ key, set, vocabCount, studyCount });
  });

  const orderedWeeks = [...weekGroups.keys()].sort((a, b) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });

  orderedWeeks.forEach(weekNum => {
    const entries = weekGroups.get(weekNum);
    if (!entries || !entries.length) return;
    const weekDetails = document.createElement('details');
    weekDetails.className = 'supplemental-week';
    const weekKeys = entries.map(e => String(e.key));
    weekDetails.open = entries.some(({ key }) =>
      selectedKeys.includes(String(key)) ||
      getSupplementalParadigmsForKey(key).some(p => selectedKeys.includes(p.key))
    );
    const weekSummary = document.createElement('summary');
    weekSummary.className = 'supplemental-week-summary';
    const totalVocab = entries.reduce((s, e) => s + e.vocabCount, 0);
    const totalStudy = entries.reduce((s, e) => s + e.studyCount, 0);
    const weekLabel = weekNum == null ? 'Other supplements' : `Chapter ${weekNum}`;
    const weekCount = canAccessGrammarUi()
      ? `${entries.length} paradigm${entries.length === 1 ? '' : 's'} · ${totalVocab} vocab${totalStudy ? ` · ${totalStudy} grammar` : ''}`
      : `${entries.length} paradigm${entries.length === 1 ? '' : 's'} · ${totalVocab} vocab`;
    weekSummary.innerHTML = `<span>${weekLabel}</span><span class="chapter-count">${weekCount}</span>`;
    weekDetails.appendChild(weekSummary);

    const weekBody = document.createElement('div');
    weekBody.className = 'supplemental-week-body';

    entries.forEach(({ key, set, vocabCount, studyCount }) => {
      const countLabel = canAccessGrammarUi()
        ? `${vocabCount} vocab${studyCount ? ` · ${studyCount} grammar` : ''}`
        : `${vocabCount} vocab`;
      const paradigmList = canAccessGrammarUi() ? getSupplementalParadigmsForKey(key) : [];

      if (paradigmList.length <= 1) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chapter-btn supplemental-set-flat';
        btn.dataset.key = key;
        btn.innerHTML = `<span>${set.label}</span><span class="chapter-count">${countLabel}</span>`;
        btn.onclick = () => toggleSet(key);
        weekBody.appendChild(btn);
        return;
      }

      const details = document.createElement('details');
      details.className = 'supplemental-set';
      details.open = selectedKeys.includes(String(key)) || paradigmList.some(paradigm => selectedKeys.includes(paradigm.key));

      const summary = document.createElement('summary');
      summary.className = 'supplemental-summary';
      summary.innerHTML = `<span>${set.label}</span><span class="chapter-count">${countLabel}</span>`;
      details.appendChild(summary);

      const controls = document.createElement('div');
      controls.className = 'supplemental-paradigm-list';

      const allBtn = document.createElement('button');
      allBtn.className = 'chapter-btn supplemental-all-btn';
      allBtn.dataset.key = key;
      allBtn.innerHTML = `All ${set.label}<span class="chapter-count">${countLabel}</span>`;
      allBtn.onclick = () => toggleSet(key);
      controls.appendChild(allBtn);

      paradigmList.forEach(paradigm => {
        const btn = document.createElement('button');
        btn.className = 'chapter-btn supplemental-paradigm-btn';
        btn.dataset.key = paradigm.key;
        btn.innerHTML = `${paradigm.label}<span class="chapter-count">${paradigm.type} · ${paradigm.count} card${paradigm.count === 1 ? '' : 's'}</span>`;
        btn.onclick = () => toggleSet(paradigm.key);
        controls.appendChild(btn);
      });

      details.appendChild(controls);
      weekBody.appendChild(details);
    });

    weekDetails.appendChild(weekBody);
    list.appendChild(weekDetails);
  });

  setActiveSetButtons();
}

function getAdvancedSubGroups(set) {
  const cards = Array.isArray(set?.cards) ? set.cards : [];
  if (!cards.length) return [];
  const groups = new Map();
  cards.forEach((card, index) => {
    const sub = card && card.sub ? String(card.sub) : 'group';
    if (!groups.has(sub)) groups.set(sub, { sub, count: 0, firstIndex: index });
    groups.get(sub).count += 1;
  });
  return [...groups.values()].sort((a, b) => a.firstIndex - b.firstIndex);
}

function buildAdvancedSelector() {
  const list = document.getElementById('advancedGrid');
  if (!list) return;
  list.innerHTML = '';

  const sets = window.SETS && typeof window.SETS === 'object' ? window.SETS : {};
  const advancedKeys = sortSetKeys(Object.keys(sets).filter(isAdvancedKey));

  const meta = document.getElementById('advancedSectionMeta');
  if (meta) {
    if (!advancedKeys.length) {
      meta.textContent = '';
    } else {
      const totalCards = advancedKeys.reduce((sum, key) => sum + (Array.isArray(sets[key]?.cards) ? sets[key].cards.length : 0), 0);
      meta.textContent = `${advancedKeys.length} buckets · ${totalCards.toLocaleString()} lemmas`;
    }
  }

  if (!advancedKeys.length) {
    const empty = document.createElement('div');
    empty.className = 'advanced-empty';
    empty.textContent = 'Advanced vocabulary data has not loaded yet.';
    list.appendChild(empty);
    return;
  }

  const deselectBtn = document.createElement('button');
  deselectBtn.type = 'button';
  deselectBtn.className = 'chapter-btn supplemental-deselect-all';
  deselectBtn.textContent = 'Deselect all advanced';
  deselectBtn.onclick = () => deselectAllAdvanced();
  list.appendChild(deselectBtn);

  const body = document.createElement('div');
  body.className = 'advanced-week-body';

  advancedKeys.forEach(key => {
    const set = sets[key];
    if (!set) return;
    const cardCount = Array.isArray(set.cards) ? set.cards.length : 0;
    if (!cardCount) return;
    const subGroups = getAdvancedSubGroups(set);
    const countLabel = `${cardCount} lemmas${set.notes ? '' : ''}`;

    const details = document.createElement('details');
    details.className = 'supplemental-set advanced-set';
    details.open = selectedKeys.includes(String(key));

    const summary = document.createElement('summary');
    summary.className = 'supplemental-summary advanced-summary';
    summary.innerHTML = `<span>${set.label || key}</span><span class="chapter-count">${countLabel}</span>`;
    details.appendChild(summary);

    if (set.notes) {
      const notes = document.createElement('div');
      notes.className = 'advanced-notes';
      notes.textContent = set.notes;
      details.appendChild(notes);
    }

    const controls = document.createElement('div');
    controls.className = 'supplemental-paradigm-list advanced-sub-list';

    const allBtn = document.createElement('button');
    allBtn.className = 'chapter-btn supplemental-all-btn';
    allBtn.dataset.key = key;
    allBtn.innerHTML = `All of ${set.label || key}<span class="chapter-count">${cardCount} lemmas</span>`;
    allBtn.onclick = () => toggleSet(key);
    controls.appendChild(allBtn);

    subGroups.forEach(group => {
      const btn = document.createElement('button');
      btn.className = 'chapter-btn supplemental-paradigm-btn advanced-sub-btn';
      btn.dataset.key = `${key}::sub::${group.sub}`;
      btn.innerHTML = `Sub ${group.sub}<span class="chapter-count">${group.count} lemmas</span>`;
      btn.onclick = () => toggleAdvancedSubGroup(key, group.sub);
      controls.appendChild(btn);
    });

    details.appendChild(controls);
    body.appendChild(details);
  });

  list.appendChild(body);
  setActiveSetButtons();
}

function deselectAllAdvanced() {
  const remaining = selectedKeys.filter(k => {
    const base = getParadigmBaseKey(k) || k;
    return !isAdvancedKey(base);
  });
  if (remaining.length === selectedKeys.length) return;
  saveCurrentDeckStateToBank();
  currentSession = null;
  selectedKeys = remaining;
  if (!selectedKeys.length) {
    setActiveSessionButton();
    setActiveSetButtons();
    deck = [];
    originalDeck = [];
    marks = {};
    currentIdx = 0;
    document.getElementById('cardArea').innerHTML = '<div class="empty-state"><div class="big">αβγ</div>Tap to choose a session and start studying.</div>';
    clearSpacedUndoSnapshot();
    syncToggleButtons();
    renderReview();
    saveState();
    return;
  }
  loadDeckFromKeys(selectedKeys, null);
}

function deselectAllChapters() {
  const remaining = selectedKeys.filter(k => {
    const base = getParadigmBaseKey(k) || k;
    return !isChapterKey(base);
  });
  const sessionWasActive = !!currentSession;
  if (remaining.length === selectedKeys.length && !sessionWasActive) return;
  saveCurrentDeckStateToBank();
  currentSession = null;
  selectedKeys = remaining;
  if (!selectedKeys.length) {
    setActiveSessionButton();
    setActiveSetButtons();
    deck = [];
    originalDeck = [];
    marks = {};
    currentIdx = 0;
    document.getElementById('cardArea').innerHTML = '<div class="empty-state"><div class="big">αβγ</div>Tap to choose a session and start studying.</div>';
    clearSpacedUndoSnapshot();
    syncToggleButtons();
    renderReview();
    saveState();
    return;
  }
  loadDeckFromKeys(selectedKeys, null);
}

function toggleAdvancedSubGroup(setKey, subKey) {
  // Sub-groups load only the cards in that sub-bucket. We model this as a
  // pseudo-key that getAdvancedSubKeyCards expands at deck-build time.
  const pseudoKey = `${setKey}::sub::${subKey}`;
  toggleSet(pseudoKey);
}

function loadDeckFromKeys(keys, sessionId = null) {
  saveCurrentDeckStateToBank();
  clearSpacedUndoSnapshot();

  selectedKeys = sortSetKeys(keys.map(String));
  currentSession = sessionId
    ? getSessions().find(s => s.id === sessionId) || findExactSessionMatch(selectedKeys)
    : findExactSessionMatch(selectedKeys);

  const selectedCards = getSelectedCards(selectedKeys);
  originalDeck = requiredOnly ? selectedCards.filter(card => card.required) : selectedCards;
  resetMorphAnswerState();

  const savedDeckState = deckStates[getDeckStateKey(selectedKeys, requiredOnly)] || null;
  marks = getDirectionalMarksStore();
  if (savedDeckState) {
    const restoredDeck = reorderDeckFromIds(originalDeck, savedDeckState.deckIds);
    if (spacedRepetition && restoredDeck) {
      deck = restoredDeck;
      activeDeckCount = restoredDeck.length;
      deck = buildStudyDeck(originalDeck, { forceShuffle: shuffled });
    } else if (restoredDeck) {
      deck = shuffled ? shuffleArray([...restoredDeck]) : restoredDeck;
    } else {
      deck = buildStudyDeck(originalDeck);
    }
    activeDeckCount = spacedRepetition ? getDueCount(originalDeck) : originalDeck.filter(card => marks[card.id] !== 'known').length;
    currentIdx = Number.isInteger(savedDeckState.currentIdx)
      ? Math.min(Math.max(savedDeckState.currentIdx, 0), spacedRepetition ? activeDeckCount : deck.length)
      : 0;
    unspacedPendingRecycle = !spacedRepetition && !!savedDeckState.unspacedPendingRecycle;
    resetUnspacedCycleState();
    isFlipped = false;
  } else {
    resetStudyState();
    deck = buildStudyDeck(originalDeck);
  }

  setActiveSessionButton();
  setActiveSetButtons();

  syncToggleButtons();

  resetMorphAnswerState();
  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function loadSession(session) {
  currentSession = session;
  loadDeckFromKeys(expandSessionSets(session), session.id);
}

function toggleSession(session) {
  saveCurrentDeckStateToBank();

  const sessionKeys = expandSessionSets(session);
  if (!sessionKeys.length) return;

  const alreadySelected = isSessionFullySelected(session);
  const nextKeys = alreadySelected
    ? selectedKeys.filter(key => !sessionKeys.includes(key))
    : sortSetKeys([...new Set([...selectedKeys, ...sessionKeys])]);

  currentSession = null;

  if (!nextKeys.length) {
    selectedKeys = [];
    setActiveSessionButton();
    setActiveSetButtons();
    deck = [];
    originalDeck = [];
    marks = getDirectionalMarksStore();
    currentIdx = 0;
    document.getElementById('cardArea').innerHTML = '<div class="empty-state"><div class="big">αβγ</div>Tap to choose a session and start studying.</div>';
    clearSpacedUndoSnapshot();
    syncToggleButtons();
    renderReview();
    saveState();
    return;
  }

  loadDeckFromKeys(nextKeys, null);
}

function getParadigmBaseKey(key) {
  const match = String(key).match(/^(.+)::(grammar|morph)::\d+$/);
  if (match) return match[1];
  const subMatch = String(key).match(/^(.+)::sub::.+$/);
  return subMatch ? subMatch[1] : null;
}

function toggleSet(key) {
  saveCurrentDeckStateToBank();
  currentSession = null;
  const raw = String(key);
  const baseKey = getParadigmBaseKey(raw);
  if (selectedKeys.includes(raw)) {
    selectedKeys = selectedKeys.filter(k => k !== raw);
  } else if (baseKey) {
    selectedKeys = [...selectedKeys.filter(k => k !== baseKey), raw];
  } else {
    selectedKeys = [...selectedKeys.filter(k => getParadigmBaseKey(k) !== raw), raw];
  }

  if (!selectedKeys.length) {
    setActiveSessionButton();
    setActiveSetButtons();
    deck = [];
    originalDeck = [];
    marks = {};
    currentIdx = 0;
    document.getElementById('cardArea').innerHTML = '<div class="empty-state"><div class="big">αβγ</div>Tap to choose a session and start studying.</div>';
    clearSpacedUndoSnapshot();
    syncToggleButtons();
    renderReview();
    saveState();
    return;
  }

  loadDeckFromKeys(selectedKeys, null);
}


const readerDrillState = new Map();

function getReaderDrillIdx(chapterNum) {
  return readerDrillState.get(chapterNum) || 0;
}

function setReaderDrillIdx(chapterNum, idx) {
  readerDrillState.set(chapterNum, idx);
}

function sortReaderDrillsByLevel(drills) {
  if (!Array.isArray(drills)) return [];
  return drills.map((d, i) => ({ d, i })).sort((a, b) => {
    const la = Number.isFinite(a.d && a.d.level) ? a.d.level : 99;
    const lb = Number.isFinite(b.d && b.d.level) ? b.d.level : 99;
    if (la !== lb) return la - lb;
    return a.i - b.i;
  }).map(x => x.d);
}

function renderReaderModule() {
  const area = document.getElementById('cardArea');
  if (!area) return;
  const chapters = Array.isArray(window.READER_CHAPTERS) ? window.READER_CHAPTERS : [];
  const drillSets = (window.READER_TRANSLATION_SETS && typeof window.READER_TRANSLATION_SETS === 'object')
    ? window.READER_TRANSLATION_SETS
    : {};

  const drillChapters = Object.keys(drillSets)
    .map(k => Number(k))
    .filter(n => Number.isFinite(n));
  const verseChapters = chapters.map(ch => ch.chapter);
  const allChapterNums = Array.from(new Set([...drillChapters, ...verseChapters])).sort((a, b) => a - b);

  if (!allChapterNums.length) {
    area.innerHTML = '<div class="empty-state"><div class="big">βίβλος</div>Reader data not available.</div>';
    return;
  }

  const verseByChapter = new Map(chapters.map(ch => [ch.chapter, ch.verses || []]));

  let html = '<div class="reader-wrap"><div class="reader-intro">Short author-written Greek phrases per Mounce chapter, increasing in difficulty. Drills use only vocabulary and grammar introduced through that chapter. The Mounce variant ships without NT-verse curation — the focus here is bridging from flashcards to syntax, one chapter at a time.</div>';

  for (const chapterNum of allChapterNums) {
    const drillsRaw = drillSets[chapterNum] && Array.isArray(drillSets[chapterNum].sentences)
      ? drillSets[chapterNum].sentences
      : [];
    const verses = verseByChapter.get(chapterNum) || [];

    if (!drillsRaw.length && !verses.length) continue;

    const drills = sortReaderDrillsByLevel(drillsRaw);
    const summaryBits = [];
    if (drills.length) summaryBits.push(`${drills.length} drill${drills.length === 1 ? '' : 's'}`);
    if (verses.length) summaryBits.push(`${verses.length} verse${verses.length === 1 ? '' : 's'}`);

    html += `<details class="reader-chapter"><summary class="reader-chapter-header"><span class="reader-ch-label">After Chapter ${chapterNum}</span><span class="reader-ch-count">${summaryBits.join(' · ')}</span><span class="reader-ch-arrow" aria-hidden="true">▶</span></summary>`;

    if (drills.length) {
      html += renderReaderDrillSectionHtml(chapterNum, drills);
    }

    if (verses.length) {
      const versesWithTranslations = verses.filter(v => v && v.literal).length;
      const verseLabel = versesWithTranslations
        ? `Verses (${verses.length}, ${versesWithTranslations} with translation)`
        : `Verses (${verses.length})`;
      html += `<details class="reader-verses-block" open><summary class="reader-verses-header">${verseLabel}</summary><div class="reader-verse-list">`;
      verses.forEach((verse, vIdx) => {
        html += renderReaderVerseHtml(chapterNum, vIdx, verse);
      });
      html += '</div></details>';
    }

    html += '</details>';
  }
  html += '</div>';
  area.innerHTML = html;
}

function readerDrillId(chapterNum, idx) {
  return `reader-drill-ch${chapterNum}-${idx}`;
}

function readerDrillSectionId(chapterNum) {
  return `reader-drill-section-ch${chapterNum}`;
}

function readerVerseRevealId(chapterNum, vIdx) {
  return `reader-verse-reveal-ch${chapterNum}-${vIdx}`;
}

function renderReaderDrillSectionHtml(chapterNum, drillsSorted) {
  const sectionId = readerDrillSectionId(chapterNum);
  const total = drillsSorted.length;
  if (!total) {
    return `<div class="reader-drill-section" id="${sectionId}"><div class="reader-section-label">Translation drills</div></div>`;
  }
  const idx = Math.max(0, Math.min(getReaderDrillIdx(chapterNum), total - 1));
  setReaderDrillIdx(chapterNum, idx);
  const drill = drillsSorted[idx];
  const drillHtml = renderReaderDrillHtml(chapterNum, idx, drill);
  const prevDisabled = idx === 0 ? 'disabled' : '';
  const nextDisabled = idx === total - 1 ? 'disabled' : '';
  return `<div class="reader-drill-section" id="${sectionId}">
    <div class="reader-drill-section-head">
      <div class="reader-section-label">Translation drills</div>
      <div class="reader-drill-progress">Drill ${idx + 1} of ${total}</div>
    </div>
    ${drillHtml}
    <div class="reader-drill-nav">
      <button class="reader-drill-nav-btn" type="button" ${prevDisabled} onclick="advanceReaderDrill(${chapterNum}, -1)">← Previous</button>
      <button class="reader-drill-nav-btn" type="button" ${nextDisabled} onclick="advanceReaderDrill(${chapterNum}, 1)">Next →</button>
    </div>
  </div>`;
}

function advanceReaderDrill(chapterNum, delta) {
  const drillSets = (window.READER_TRANSLATION_SETS && typeof window.READER_TRANSLATION_SETS === 'object')
    ? window.READER_TRANSLATION_SETS : {};
  const drillsRaw = drillSets[chapterNum] && Array.isArray(drillSets[chapterNum].sentences)
    ? drillSets[chapterNum].sentences : [];
  const drills = sortReaderDrillsByLevel(drillsRaw);
  if (!drills.length) return;

  const cur = getReaderDrillIdx(chapterNum);
  const next = Math.max(0, Math.min(drills.length - 1, cur + delta));
  if (next === cur) return;

  setReaderDrillIdx(chapterNum, next);
  const sectionEl = document.getElementById(readerDrillSectionId(chapterNum));
  if (!sectionEl) return;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderReaderDrillSectionHtml(chapterNum, drills);
  const replacement = wrapper.firstElementChild;
  if (replacement) sectionEl.replaceWith(replacement);
}

function renderReaderDrillHtml(chapterNum, idx, drill) {
  const id = readerDrillId(chapterNum, idx);
  const choices = Array.isArray(drill.choices) ? shuffleArray([...drill.choices]) : [];
  const level = Number.isFinite(drill.level) ? drill.level : null;
  const levelLabel = level === 1 ? 'Easy'
    : level === 2 ? 'Mixed order'
    : level === 3 ? 'Greek-style order'
    : '';
  const levelClass = level === 1 ? 'level-1'
    : level === 2 ? 'level-2'
    : level === 3 ? 'level-3'
    : '';
  const choiceButtons = choices.map((choice, cIdx) => {
    const safeChoice = escapeHtml(choice);
    return `<button class="reader-choice-btn" type="button" data-drill="${id}" data-idx="${cIdx}" onclick="selectReaderDrillChoice('${id}', ${cIdx})">${safeChoice}</button>`;
  }).join('');
  const noteHtml = drill.note ? `<div class="reader-drill-note" id="${id}-note" style="display:none">${escapeHtml(drill.note)}</div>` : '';
  return `
    <div class="reader-drill" id="${id}" data-answer="${escapeHtml(drill.en || '')}">
      <div class="reader-drill-head">
        ${levelLabel ? `<span class="reader-difficulty ${levelClass}">${levelLabel}</span>` : ''}
        <span class="reader-drill-prompt">Translate</span>
      </div>
      <div class="reader-drill-greek">${escapeHtml(drill.g)}</div>
      <div class="reader-choices">${choiceButtons}</div>
      <div class="reader-drill-result" id="${id}-result"></div>
      ${noteHtml}
    </div>`;
}

function renderReaderVerseHtml(chapterNum, vIdx, verse) {
  if (!verse) return '';
  const greek = escapeHtml(verse.g || '');
  const ref = escapeHtml(verse.r || '');
  const literal = verse.literal;
  const literalText = typeof literal === 'string'
    ? literal
    : (literal && typeof literal === 'object' ? (literal.en || '') : '');
  const noteText = (literal && typeof literal === 'object') ? (literal.note || '') : '';

  if (!literalText) {
    return `<div class="reader-verse"><span class="reader-verse-greek">${greek}</span><span class="reader-verse-ref">${ref}</span></div>`;
  }

  const id = readerVerseRevealId(chapterNum, vIdx);
  const noteHtml = noteText ? `<div class="reader-drill-note">${escapeHtml(noteText)}</div>` : '';
  return `
    <div class="reader-verse reader-verse-with-drill">
      <div class="reader-verse-row">
        <span class="reader-verse-greek">${greek}</span>
        <span class="reader-verse-ref">${ref}</span>
      </div>
      <details class="reader-verse-reveal" id="${id}">
        <summary class="reader-verse-reveal-summary">Tap to reveal translation</summary>
        <div class="reader-verse-literal-text">${escapeHtml(literalText)}</div>
        ${noteHtml}
      </details>
    </div>`;
}

function selectReaderDrillChoice(drillId, choiceIdx) {
  const root = document.getElementById(drillId);
  if (!root) return;
  noteStudyInteraction();
  const buttons = Array.from(root.querySelectorAll('.reader-choice-btn'));
  if (!buttons.length) return;
  const expected = root.getAttribute('data-answer') || '';
  const chosen = buttons[choiceIdx];
  if (!chosen || chosen.disabled) return;
  const chosenText = chosen.textContent || '';
  const isCorrect = chosenText === expected;

  buttons.forEach((btn) => {
    btn.disabled = true;
    btn.classList.remove('correct', 'incorrect');
    if ((btn.textContent || '') === expected) btn.classList.add('correct');
  });
  if (!isCorrect) chosen.classList.add('incorrect');

  const resultEl = document.getElementById(`${drillId}-result`);
  if (resultEl) {
    resultEl.textContent = isCorrect
      ? 'Correct.'
      : `Not quite. Answer: ${expected}`;
    resultEl.className = `reader-drill-result ${isCorrect ? 'correct' : 'incorrect'}`;
  }

  const noteEl = document.getElementById(`${drillId}-note`);
  if (noteEl) noteEl.style.display = '';
}

// ═══════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════
function renderCard() {
  const area = document.getElementById('cardArea');
  saveState();
  syncLayoutVisibility();

  if (!deck.length) {
    let emptyMessage;
    if (isMorphologyMode()) {
      emptyMessage = isReverseGrammarActive()
        ? 'No reversible grammar items in this selection. Toggle “English → Greek” off to see all questions.'
        : 'No grammar quiz material is available yet for this selection.';
    } else {
      emptyMessage = requiredOnly ? 'No required-vocabulary cards match this selection.' : 'No cards in this deck.';
    }
    area.innerHTML = `<div class="empty-state"><div class="big">—</div>${emptyMessage}</div>`;
    return;
  }

  if (!spacedRepetition && currentIdx >= deck.length && unspacedPendingRecycle) {
    startNextCycle('remaining');
    resetMorphAnswerState();
    renderCard();
    renderReview();
    renderProgress();
    return;
  }

  if ((!spacedRepetition && currentIdx >= deck.length) || (spacedRepetition && currentIdx >= activeDeckCount)) {
    const doneTitle = spacedRepetition
      ? 'No cards currently due ✦'
      : (isMorphologyMode() ? 'Grammar pass complete ✦' : 'Session Confirmed 🎉');

    const doneSub = spacedRepetition
      ? 'Everything in this selection is scheduled ahead. Press next to advance the review clock by 1 hour and pull the next near-due cards back in.'
      : (isMorphologyMode()
        ? 'Everything in this grammar selection is currently marked correct. Press next to reshuffle the full selected set and run it again.'
        : 'Every card in this deck is currently marked “I know this.”<br><span style="color:var(--muted);font-size:13px">Press next to reshuffle the full selected set for another unspaced pass.</span>');

    area.innerHTML = `
      <div class="done-card show">
        <div class="done-title">${doneTitle}</div>
        <div class="done-sub">${doneSub}</div>
      </div>`;
    document.getElementById('markRow').style.display = 'none';
    return;
  }

  document.getElementById('markRow').style.display = isMorphologyMode() ? 'none' : 'flex';
  const card = deck[currentIdx];

  if (isMorphCard(card)) {
    const reversed = reverseDisplayActive(card);
    const displayPrompt = reversed
      ? (card.reversePrompt || 'Choose the correct Greek form.')
      : (card.prompt || 'Parse this form.');
    const displayForm = reversed ? card.answer : card.form;
    const displayChoices = reversed ? (card.reverseChoices || []) : (card.choices || []);
    const correctAnswer = reversed ? card.form : card.answer;
    const formClass = reversed ? 'morph-form morph-form-english' : 'morph-form';

    const noteHtml = card.note ? `<div class="morph-note">${card.note}</div>` : '';
    const contextHtml = card.context
      ? `<div class="morph-context"><span class="morph-context-label">Context:</span> ${card.context}</div>`
      : '';

    const resultBody = reversed
      ? `${card.answer} = ${card.form}`
      : `${card.form} = ${card.answer}`;

    let interactionHtml = '';
    let resultHtml = '';

    if (morphSelfCheck) {
      if (!morphAnswerState.revealed) {
        const placeholder = reversed
          ? 'Recall the Greek form yourself first, then reveal the answer.'
          : 'Parse it yourself first, then reveal the answer.';
        interactionHtml = `<div class="morph-selfcheck-actions">
            <button class="ctrl-btn morph-reveal-btn" type="button" onclick="revealMorphologyAnswer()">Reveal answer</button>
            <button class="ctrl-btn morph-dontknow-btn" type="button" onclick="passMorphologyChoice()">I don't know</button>
          </div>`;
        resultHtml = `<div class="morph-result pending">${placeholder}</div>`;
      } else {
        const resultClass = morphAnswerState.answered
          ? (morphAnswerState.skipped ? 'skipped' : (morphAnswerState.isCorrect ? 'correct' : 'incorrect'))
          : 'pending';
        const resultTitle = morphAnswerState.answered
          ? (morphAnswerState.skipped ? 'Marked unsure' : (morphAnswerState.isCorrect ? 'You had it' : 'Needs more review'))
          : 'Answer';
        const ratingHtml = morphAnswerState.answered
          ? ''
          : `<div class="morph-selfcheck-actions">
               <button class="choice-btn selfcheck-good" type="button" onclick="rateMorphologySelfCheck(true)">I had it</button>
               <button class="choice-btn selfcheck-bad" type="button" onclick="rateMorphologySelfCheck(false)">Needs review</button>
             </div>`;

        resultHtml = `<div class="morph-result ${resultClass}">
            <div class="morph-result-title">${resultTitle}</div>
            <div class="morph-result-body">${resultBody}</div>
            <div class="morph-result-meta">${card.lemma}${card.gloss ? ` · “${card.gloss}”` : ''}${card.family ? ` · ${card.family}` : ''}</div>
            ${buildGrammarSupportHtml(card, null, { reversed })}
            ${noteHtml}
          </div>${ratingHtml}`;
      }
    } else {
      const choiceButtons = displayChoices.map((choice, idx) => {
        const classes = ['choice-btn'];
        if (reversed) classes.push('choice-btn-greek');
        if (morphAnswerState.answered) {
          if (choice === correctAnswer) classes.push('correct');
          if (idx === morphAnswerState.selectedIndex && choice !== correctAnswer) classes.push('incorrect');
        }
        return `<button class="${classes.join(' ')}" type="button" ${morphAnswerState.answered ? 'disabled' : ''} onclick="answerMorphologyChoice(${idx})">${choice}</button>`;
      }).join('');

      const dontKnowButton = `<button class="choice-btn choice-btn-dontknow" type="button" ${morphAnswerState.answered ? 'disabled' : ''} onclick="passMorphologyChoice()">I don't know</button>`;
      interactionHtml = `<div class="morph-choices">${choiceButtons}</div><div class="morph-pass-row">${dontKnowButton}</div>`;
      const wrongChoice = morphAnswerState.answered
        && !morphAnswerState.isCorrect
        && morphAnswerState.selectedIndex >= 0
        ? displayChoices[morphAnswerState.selectedIndex]
        : null;
      const pendingLabel = reversed
        ? 'Choose the correct Greek form.'
        : 'Choose the best parsing option.';
      const resultClass = morphAnswerState.skipped
        ? 'skipped'
        : (morphAnswerState.isCorrect ? 'correct' : 'incorrect');
      const resultTitle = morphAnswerState.skipped
        ? 'Marked unsure'
        : (morphAnswerState.isCorrect ? 'Correct' : 'Not quite');
      resultHtml = morphAnswerState.answered
        ? `<div class="morph-result ${resultClass}">
            <div class="morph-result-title">${resultTitle}</div>
            <div class="morph-result-body">${resultBody}</div>
            <div class="morph-result-meta">${card.lemma}${card.gloss ? ` · “${card.gloss}”` : ''}${card.family ? ` · ${card.family}` : ''}</div>
            ${buildGrammarSupportHtml(card, wrongChoice, { reversed })}
            ${noteHtml}
          </div>`
        : `<div class="morph-result pending">${pendingLabel}</div>`;
    }

    area.innerHTML = `
      <div class="morph-card">
        <div class="morph-label">Grammar${reversed ? ' · English → Greek' : ''}</div>
        <div class="morph-prompt">${displayPrompt}</div>
        ${card.gloss ? `<div class="morph-gloss">Gloss: “${card.gloss}”</div>` : ''}
        <div class="${formClass}">${displayForm}</div>
        ${contextHtml}
        <div class="morph-hint">${card.lemma}</div>
        <div class="morph-source">${card.sourceLabel}${card.family ? ` · ${card.family}` : ''}${morphSelfCheck ? ' · Self-check' : ''}</div>
        ${interactionHtml}
        ${resultHtml}
      </div>`;
    isFlipped = false;
    renderProgress();
    return;
  }

  const advancedCountSuffix = (card.advanced && Number.isFinite(Number(card.count)))
    ? ` [${Number(card.count)}× in NT]`
    : '';
  const sourceLabelDisplay = `${card.sourceLabel}${advancedCountSuffix}`;

  let frontHTML, backHTML;
  if (!directionToGreek) {
    frontHTML = `
        <div class="card-face card-front">
          <span class="card-label">Greek</span>
          <div class="card-greek">${formatGreekHeadword(card.g)}</div>
          <div class="card-hint">${sourceLabelDisplay}</div>
          <div class="flip-hint">click to reveal →</div>
        </div>`;
    backHTML = `
        <div class="card-face card-back">
          <span class="card-label">English</span>
          <div class="card-english">${card.e || '—'}</div>
          <div class="card-greek-small">${formatGreekHeadword(card.g)}</div>
          <div class="card-hint">${transliterateGreek(formatGreekHeadword(card.g))}${advancedCountSuffix}</div>
          <div class="card-pos">${detectPartOfSpeech(card)}</div>
        </div>`;
  } else {
    frontHTML = `
        <div class="card-face card-front">
          <span class="card-label">English</span>
          <div class="card-english">${card.e || '—'}</div>
          <div class="card-hint">${sourceLabelDisplay}</div>
          <div class="flip-hint">click to reveal →</div>
        </div>`;
    backHTML = `
        <div class="card-face card-back">
          <span class="card-label">Greek</span>
          <div class="card-greek">${formatGreekHeadword(card.g)}</div>
          <div class="card-hint">${transliterateGreek(formatGreekHeadword(card.g))}${advancedCountSuffix}</div>
          <div class="card-pos">${detectPartOfSpeech(card)}</div>
        </div>`;
  }

  area.innerHTML = `
    <div class="card-wrapper" id="cardWrapper" onclick="flipCard()">
      <div class="card-inner" id="cardInner">
        ${frontHTML}
        ${backHTML}
      </div>
    </div>`;

  isFlipped = false;
  renderProgress();
}

function flipCard() {
  const wrapper = document.getElementById('cardWrapper');
  if (!wrapper) return;
  noteStudyInteraction();
  isFlipped = !isFlipped;
  wrapper.classList.toggle('flipped', isFlipped);

  if (isFlipped && (maybeReturnKnownCardToActivePile() || maybeReturnConfirmedDeferredCard())) {
    renderProgress();
    renderReview();
    saveState();
  }
}

// ═══════════════════════════════════════════════════════
//  NAVIGATE + MARK
// ═══════════════════════════════════════════════════════
function navigate(dir, options = {}) {
  if (!deck.length) return;
  noteStudyInteraction();

  if (dir < 0) {
    if (currentIdx <= 0) return;
    currentIdx = currentIdx - 1;
    resetMorphAnswerState();
    renderCard();
    renderProgress();
    renderReview();
    return;
  }

  if (!spacedRepetition && currentIdx >= deck.length) {
    if (unspacedPendingRecycle) {
      startNextCycle('remaining');
      resetMorphAnswerState();
      renderCard();
      renderReview();
      renderProgress();
      saveState();
    } else if (getKnownCount() === originalDeck.length) {
      startNextCycle('full');
      resetMorphAnswerState();
      renderCard();
      renderReview();
      renderProgress();
      saveState();
    }
    return;
  }

  if (spacedRepetition && currentIdx >= activeDeckCount) {
    advanceScheduledCards(originalDeck, SRS_CYCLE_ADVANCE_MS);
    deck = buildStudyDeck(originalDeck);
    currentIdx = 0;
    resetMorphAnswerState();
    renderCard();
    renderReview();
    renderProgress();
    saveState();
    return;
  }

  if (spacedRepetition && currentIdx < activeDeckCount && !options.skipAutoReview && !isMorphologyMode()) {
    captureSpacedUndoSnapshot();
    applySpacedReview(deck[currentIdx], 'again');
    deck = buildStudyDeck(originalDeck);
  }

  if (spacedRepetition) {
    if (isMorphologyMode()) {
      if (morphPendingAdvance) {
        deck = buildStudyDeck(originalDeck);
        currentIdx = Math.min(currentIdx, activeDeckCount);
      } else {
        currentIdx = Math.min(currentIdx + 1, activeDeckCount);
      }
    } else {
      currentIdx = Math.min(currentIdx, activeDeckCount);
      maybePeriodicReshuffle();
    }
    resetMorphAnswerState();
    renderCard();
    renderReview();
    renderProgress();
    saveState();
    return;
  }

  if (isMorphologyMode()) {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= deck.length) {
      if (getKnownCount() === originalDeck.length) {
        currentIdx = deck.length;
        unspacedPendingRecycle = false;
      } else {
        currentIdx = deck.length;
        unspacedPendingRecycle = true;
      }
    } else {
      currentIdx = nextIdx;
      unspacedPendingRecycle = false;
    }
    resetMorphAnswerState();
    renderCard();
    renderReview();
    renderProgress();
    saveState();
    return;
  }

  for (let i = currentIdx + 1; i < deck.length; i++) {
    if (marks[deck[i].id] !== 'known' && !unspacedDeferredIds.has(deck[i].id)) {
      currentIdx = i;
      maybePeriodicReshuffle();
      renderCard();
      return;
    }
  }

  if (getKnownCount() === originalDeck.length && unspacedDeferredIds.size === 0) {
    currentIdx = deck.length;
    unspacedPendingRecycle = false;
  } else {
    currentIdx = deck.length;
    unspacedPendingRecycle = true;
  }

  resetMorphAnswerState();
  renderCard();
}

function markCard(outcome) {
  // outcome: 'again' | 'pass' | 'easy'
  if (isMorphologyMode()) return;
  noteStudyInteraction();
  if ((!spacedRepetition && currentIdx >= deck.length) || (spacedRepetition && currentIdx >= activeDeckCount)) return;
  const currentCard = deck[currentIdx];
  if (spacedRepetition) {
    captureSpacedUndoSnapshot();
    applySpacedReview(currentCard, outcome);
    deck = buildStudyDeck(originalDeck);
    if (activeDeckCount <= 0) {
      currentIdx = activeDeckCount;
      resetMorphAnswerState();
      renderCard();
    } else {
      navigate(1, { skipAutoReview: true });
    }
  } else {
    // Non-SRS cards still write to the same shared schedule used by spaced review.
    // Deck behaviour:
    // - 'again' (wrong)    → immediately moved to back of active pile for same-pass retry.
    // - 'pass' (uncertain) → deferred until the end of the pile; reappears next cycle.
    // - 'easy' (known)     → pushed out of active pile as usual.
    const mark = outcome === 'easy' ? 'known' : 'unsure';
    const recordedOutcome = outcome === 'easy' ? 'known' : outcome === 'pass' ? 'pass' : 'review';
    const reviewedAt = Date.now();
    recordStudyOutcome(currentCard.id, recordedOutcome, reviewedAt);
    applyUnspacedSharedSchedule(currentCard, outcome, reviewedAt);
    getDirectionalMarksStore()[currentCard.id] = mark;
    marks = getDirectionalMarksStore();

    if (outcome === 'again') {
      // Remove from current position; remaining cards shift down by 1,
      // so currentIdx now points to what was the next card.
      const cardToReturn = currentCard;
      deck.splice(currentIdx, 1);
      // Find the last non-known, non-deferred card that comes after currentIdx.
      let lastActiveIdx = -1;
      for (let i = currentIdx; i < deck.length; i++) {
        if (marks[deck[i].id] !== 'known' && !unspacedDeferredIds.has(deck[i].id)) lastActiveIdx = i;
      }
      deck.splice(lastActiveIdx >= 0 ? lastActiveIdx + 1 : deck.length, 0, cardToReturn);
      // currentIdx already points to the correct next card (or loops if it was the last).
      renderCard();
    } else {
      if (outcome === 'pass') unspacedDeferredIds.add(currentCard.id);
      navigate(1);
    }
  }
  renderReview();
  renderProgress();
  saveState();
}


function setStudyMode(mode) {
  const nextMode = normalizeStudyMode(mode);
  if (studyMode === nextMode) return;

  saveCurrentDeckStateToBank();
  studyMode = nextMode;
  clearSpacedUndoSnapshot();
  resetMorphAnswerState();
  ensureDirectionalStores();
  marks = getDirectionalMarksStore();
  syncToggleButtons();

  if (isReaderMode()) {
    renderReaderModule();
    renderProgress();
    saveState();
    return;
  }

  if (!selectedKeys.length) {
    saveState();
    renderCard();
    renderProgress();
    renderReview();
    return;
  }

  const keysToLoad = currentSession ? expandSessionSets(currentSession) : selectedKeys;
  loadDeckFromKeys(keysToLoad, currentSession ? currentSession.id : null);
}

function setAppProfile(profile) {
  const nextProfile = 'vocab_grammar';
  if (appProfile === nextProfile) return;

  saveCurrentDeckStateToBank();
  appProfile = nextProfile;
  clearSpacedUndoSnapshot();

  ensureDirectionalStores();
  marks = getDirectionalMarksStore();
  buildSessions();
  buildChapterSelector();
  buildSupplementalSelector();
  buildAdvancedSelector();
  syncToggleButtons();

  if (!selectedKeys.length) {
    renderCard();
    renderProgress();
    renderReview();
    saveState();
    return;
  }

  const keysToLoad = currentSession ? expandSessionSets(currentSession) : selectedKeys;
  loadDeckFromKeys(keysToLoad, currentSession ? currentSession.id : null);
}

function toggleMorphSelfCheck() {
  if (!isMorphologyMode()) return;
  morphSelfCheck = !morphSelfCheck;
  resetMorphAnswerState();
  syncToggleButtons();
  renderCard();
  saveState();
}

function toggleShuffle() {
  shuffled = !shuffled;
  flipsSinceReshuffle = 0;
  syncToggleButtons();

  if (spacedRepetition) {
    deck = buildStudyDeck(originalDeck, { forceShuffle: shuffled });
    currentIdx = Math.min(currentIdx, activeDeckCount);
  } else {
    const activeCards = getRemainingCards();
    const knownCards = deck.filter(card => marks[card.id] === 'known');
    deck = shuffled ? [...shuffleArray([...activeCards]), ...knownCards] : [...activeCards, ...knownCards];

    if (currentIdx >= activeCards.length) {
      currentIdx = activeCards.length ? 0 : deck.length;
    }
  }

  isFlipped = false;
  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function toggleRequiredOnly() {
  requiredOnly = !requiredOnly;
  syncToggleButtons();
  if (!selectedKeys.length) {
    saveState();
    return;
  }
  const keysToLoad = currentSession ? expandSessionSets(currentSession) : selectedKeys;
  loadDeckFromKeys(keysToLoad, currentSession ? currentSession.id : null);
}

function toggleDirection() {
  directionToGreek = !directionToGreek;
  clearSpacedUndoSnapshot();
  ensureDirectionalStores();
  marks = getDirectionalMarksStore();
  resetMorphAnswerState();
  syncToggleButtons();
  if (selectedKeys.length) {
    const keysToLoad = currentSession ? expandSessionSets(currentSession) : selectedKeys;
    loadDeckFromKeys(keysToLoad, currentSession ? currentSession.id : null);
    return;
  }
  isFlipped = false;
  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function toggleSpacedRepetition() {
  spacedRepetition = !spacedRepetition;
  clearSpacedUndoSnapshot();
  resetUnspacedCycleState();
  syncToggleButtons();
  if (!selectedKeys.length) {
    saveState();
    return;
  }
  deck = buildStudyDeck(originalDeck);
  currentIdx = 0;
  resetMorphAnswerState();
  isFlipped = false;
  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function reshuffleEligible() {
  if (!selectedKeys.length) return;

  if (spacedRepetition) {
    // Shuffle only currently-eligible (due) cards. SRS progress and
    // scheduled-ahead deferrals are left untouched.
    deck = buildStudyDeck(originalDeck, { forceShuffle: true });
    currentIdx = activeDeckCount ? 0 : currentIdx;
  } else {
    // Non-spaced: shuffle the still-active (not-yet-known) portion only;
    // known cards stay pinned to the end of the cycle.
    const activeCards = getRemainingCards();
    const knownCards = deck.filter(card => marks[card.id] === 'known');
    deck = [...shuffleArray([...activeCards]), ...knownCards];
    currentIdx = activeCards.length ? 0 : deck.length;
  }

  isFlipped = false;
  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function resetCurrentDeck() {
  clearSpacedUndoSnapshot();
  if (!selectedKeys.length) {
    clearSavedState();
    return;
  }

  const confirmed = window.confirm(
    spacedRepetition
      ? 'Reset spaced-review scheduling for this deck only? This keeps your unspaced marks and pass history.'
      : 'Reset unspaced marks for this deck only? This keeps your spaced-review scheduling and intervals.'
  );
  if (!confirmed) return;

  const deckKey = getDeckStateKey(selectedKeys, requiredOnly, spacedRepetition);
  delete deckStates[deckKey];
  const directionalMarks = getDirectionalMarksStore();
  const directionalProgress = getDirectionalProgressStore();

  if (spacedRepetition) {
    originalDeck.forEach(card => {
      const p = directionalProgress[card.id];
      if (p && typeof p === 'object') {
        p.dueAt = 0;
        p.intervalDays = 0;
        p.streak = 0;
        p.easyStreak = 0;
        p.srsStage = 0;
        p.ease = 2.3;
        p.lastEasyIntervalDays = 0;
        p.confidence = 0;
        p.confidenceHistory = [];
        // seenCount, passCount, failCount, lastReviewedAt intentionally kept
      }
    });
  } else {
    originalDeck.forEach(card => {
      delete directionalMarks[card.id];
    });
  }

  marks = directionalMarks;
  resetUnspacedCycleState();
  currentIdx = 0;
  isFlipped = false;
  resetMorphAnswerState();
  deck = [];
  activeDeckCount = 0;
  deck = buildStudyDeck(originalDeck);
  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function fastForwardSchedule(advanceMs) {
  if (!spacedRepetition || !selectedKeys.length || !originalDeck.length) return;
  clearSpacedUndoSnapshot();
  advanceScheduledCards(originalDeck, advanceMs);
  deck = buildStudyDeck(originalDeck);
  currentIdx = 0;
  isFlipped = false;
  resetMorphAnswerState();
  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function fastForwardOneDay() {
  fastForwardSchedule(SRS_DAY_MS);
}

function fastForwardOneWeek() {
  fastForwardSchedule(7 * SRS_DAY_MS);
}

function resetAllStats() {
  clearSpacedUndoSnapshot();
  const confirmed = window.confirm('Reset all saved study stats, marks, and spaced-review scheduling for both directions?');
  if (!confirmed) return;

  globalWordMarks = { g2e: {}, e2g: {}, morph: {} };
  globalWordProgress = { g2e: {}, e2g: {}, morph: {} };
  deckStates = {};
  appUsageStats = {
    totalMs: 0,
    dailyMs: {},
    activeStudyMs: 0,
    activeDailyMs: {},
    lastActiveAt: document.hidden ? 0 : Date.now(),
    lastStudyInteractionAt: 0,
    lastStudyCountedAt: 0,
    firstStudyAt: 0,
    studySessionHistory: [],
    currentStudySession: null
  };
  appGamification = sanitizeGamificationState({});
  ensureDirectionalStores();
  resetUnspacedCycleState();
  marks = getDirectionalMarksStore();

  if (selectedKeys.length) {
    currentIdx = 0;
    isFlipped = false;
    deck = [];
    activeDeckCount = 0;
    deck = buildStudyDeck(originalDeck);
    renderCard();
    renderProgress();
    renderReview();
  } else {
    renderReview();
    renderProgress();
  }

  saveState();
}

// ═══════════════════════════════════════════════════════
//  PROGRESS + REVIEW
// ═══════════════════════════════════════════════════════
function renderProgress() {
  if (!document.hidden) {
    accumulateUsageTime();
    accumulateActiveStudyTime();
  }
  const total = originalDeck.length || deck.length;
  const confirmed = getKnownCount();
  const remaining = Math.max(total - confirmed, 0);
  const progressPercentEl = document.getElementById('progressPercent');
  updateUsageMeta();

  if (spacedRepetition) {
    const dueCount = getDueCount(originalDeck);
    const nextCard = dueCount && currentIdx < dueCount ? currentIdx + 1 : dueCount;
    const progressTextEl = document.getElementById('progressText');
    if (progressTextEl) progressTextEl.textContent = total
      ? `${nextCard} / ${dueCount} due · Confirmed ${confirmed} · Scheduled ${Math.max(total - dueCount, 0)}`
      : '0 / 0';
    const pct = total ? Math.round(((total - dueCount) / total) * 100) : 0;
    const progressFillEl = document.getElementById('progressFill');
    if (progressFillEl) progressFillEl.style.width = pct + '%';
    if (progressPercentEl) progressPercentEl.textContent = `${pct}%`;
    if (isAnalyticsModalOpen()) renderAnalyticsOverlay();
    return;
  }

  const cycleSize = isMorphologyMode() ? total : (getRemainingCards().length || total);
  const nextCard = total && currentIdx < deck.length ? Math.min(currentIdx + 1, cycleSize) : total;
  const progressTextEl2 = document.getElementById('progressText');
  if (progressTextEl2) progressTextEl2.textContent = total
    ? `${nextCard} / ${cycleSize} · Confirmed ${confirmed} · Remaining ${remaining}${isMorphologyMode() ? ' · Grammar' : ''}`
    : '0 / 0';
  const pct = total ? Math.round((confirmed / total) * 100) : 0;
  const progressFillEl2 = document.getElementById('progressFill');
  if (progressFillEl2) progressFillEl2.style.width = pct + '%';
  if (progressPercentEl) progressPercentEl.textContent = `${pct}%`;
  if (isAnalyticsModalOpen()) renderAnalyticsOverlay();
}


function renderReview() {
  const panel = document.getElementById('reviewPanel');
  panel.classList.add('show');

  const knownCount = getKnownCount();
  const unsureCount = originalDeck.filter(card => marks[card.id] === 'unsure').length;
  const remainingCount = Math.max(originalDeck.length - knownCount, 0);
  const aggregateStats = getDeckAggregateStats(originalDeck);

  if (spacedRepetition) {
    const dueCount = getDueCount(originalDeck);
    document.getElementById('reviewStats').innerHTML = `
      <span class="stat-known">✓ Known: ${knownCount}</span>
      <span class="stat-unsure">○ Due now: ${dueCount}</span>
      <span class="stat-total">· Scheduled ahead: ${Math.max(originalDeck.length - dueCount, 0)}</span>
      <span class="stat-total">· Seen ×${aggregateStats.seenCount}</span>
      <span class="stat-total">· ${isMorphologyMode() ? 'Grammar deck' : (requiredOnly ? 'Required-only deck' : 'Full deck')}</span>`;
  } else {
    document.getElementById('reviewStats').innerHTML = `
      <span class="stat-known">✓ Known: ${knownCount}</span>
      <span class="stat-unsure">○ Not yet known: ${unsureCount}</span>
      <span class="stat-total">· ${remainingCount} still to confirm</span>
      <span class="stat-total">· Seen ×${aggregateStats.seenCount}</span>
      <span class="stat-total">· ${isMorphologyMode() ? 'Grammar deck' : (requiredOnly ? 'Required-only deck' : 'Full deck')}</span>`;
  }

  let listHtml = '';
  originalDeck
    .map((card, idx) => ({ card, idx }))
    .filter(({ card }) => {
      const status = marks[card.id];
      const progress = getWordProgress(card.id);
      return status || progress.seenCount;
    })
    .sort((a, b) => compareGreekAlphabetical(a.card, b.card))
    .forEach(({ card }) => {
      const status = marks[card.id];
      const progress = getWordProgress(card.id);
      const confidencePct = getConfidencePct(progress);
      const confidenceMeta = confidencePct === null ? 'confidence —' : `confidence ${confidencePct}%`;
      const srsMeta = spacedRepetition
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

// Return a previously-known card to the active deck. Flips its mark back
// to 'unsure', clears its due timer, and rebuilds the deck so the card
// lands at the back (per buildStudyDeck's newly-eligible logic).
function returnSeenCardToDeck(encodedId) {
  const cardId = decodeURIComponent(encodedId);
  const card = originalDeck.find(c => c.id === cardId);
  if (!card) return;

  moveCardToBackOfActivePile(card);

  const progress = getWordProgress(cardId);
  progress.dueAt = Date.now();
  progress.intervalDays = 0;
  progress.streak = 0;
  progress.easyStreak = 0;
  progress.srsStage = Math.max(0, getSrsStage(progress) - 1);

  if (spacedRepetition) {
    deck = buildStudyDeck(originalDeck);
    const dueIdx = deck.findIndex(c => c.id === cardId);
    if (dueIdx >= 0 && dueIdx < activeDeckCount) {
      currentIdx = dueIdx;
      isFlipped = false;
    } else if (activeDeckCount > 0) {
      currentIdx = Math.min(currentIdx, activeDeckCount - 1);
    }
  } else {
    const returnedIdx = deck.findIndex(c => c.id === cardId);
    currentIdx = returnedIdx >= 0 ? returnedIdx : Math.min(currentIdx, Math.max(deck.length - 1, 0));
    isFlipped = false;
  }

  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function updateConsentButtonState() {
  const checkbox = document.getElementById('consentCheckbox');
  const btn = document.getElementById('consentContinueBtn');
  if (!btn) return;
  if (!disclaimerModalRequiresAgreement) {
    btn.disabled = false;
    btn.textContent = 'Close';
    return;
  }
  btn.textContent = 'Agree and continue';
  btn.disabled = !(checkbox && checkbox.checked);
}

function openDisclaimerModal(requireAgreement = !hasAcceptedDisclaimer) {
  const overlay = document.getElementById('consentOverlay');
  const checkRow = document.getElementById('consentCheckRow');
  const checkbox = document.getElementById('consentCheckbox');
  if (!overlay) return;

  disclaimerModalRequiresAgreement = !!requireAgreement;
  if (checkRow) checkRow.style.display = disclaimerModalRequiresAgreement ? 'flex' : 'none';
  if (checkbox) checkbox.checked = false;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  updateConsentButtonState();
}

function closeDisclaimerModal() {
  const overlay = document.getElementById('consentOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  if (!isTransferModalOpen() && !isAnalyticsModalOpen()) document.body.classList.remove('modal-open');
}

function handleConsentAction() {
  if (!disclaimerModalRequiresAgreement) {
    closeDisclaimerModal();
    return;
  }

  const checkbox = document.getElementById('consentCheckbox');
  if (!checkbox || !checkbox.checked) return;

  hasAcceptedDisclaimer = true;
  const storage = getStorage();
  if (storage) {
    storage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    // First-time accepters already see the new features as part of the base
    // experience, so suppress the v1.1 announcement for them.
    storage.setItem(WHATS_NEW_V1_1_STORAGE_KEY, 'seen');
  }
  closeDisclaimerModal();
  openStudySelector();
}

function initializeConsentGate() {
  const storage = getStorage();
  hasAcceptedDisclaimer = storage ? storage.getItem(CONSENT_STORAGE_KEY) === 'accepted' : false;

  const checkbox = document.getElementById('consentCheckbox');
  if (checkbox) checkbox.addEventListener('change', updateConsentButtonState);

  if (!hasAcceptedDisclaimer) {
    openDisclaimerModal(true);
  } else {
    updateConsentButtonState();
    maybeShowWhatsNewV1_1Modal();
  }
}

function maybeShowWhatsNewV1_1Modal() {
  if (!hasAcceptedDisclaimer) return;
  const storage = getStorage();
  if (!storage) return;
  if (storage.getItem(WHATS_NEW_V1_1_STORAGE_KEY) === 'seen') return;
  openWhatsNewV1_1Modal();
}

function openWhatsNewV1_1Modal() {
  const overlay = document.getElementById('whatsNewV1_1Overlay');
  if (!overlay) return;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeWhatsNewV1_1Modal() {
  const overlay = document.getElementById('whatsNewV1_1Overlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  const storage = getStorage();
  if (storage) storage.setItem(WHATS_NEW_V1_1_STORAGE_KEY, 'seen');
  if (!isDisclaimerModalOpen() && !isTransferModalOpen() && !isAnalyticsModalOpen() && !isStudySelectorOpen() && !isShortcutsModalOpen()) {
    document.body.classList.remove('modal-open');
  }
}

function isWhatsNewV1_1ModalOpen() {
  return !!document.getElementById('whatsNewV1_1Overlay')?.classList.contains('show');
}

function showDisclaimerModal() {
  openDisclaimerModal(false);
}

function isDisclaimerModalOpen() {
  return !!document.getElementById('consentOverlay')?.classList.contains('show');
}

function isTransferModalOpen() {
  return !!document.getElementById('transferOverlay')?.classList.contains('show');
}

function isStudySelectorOpen() {
  return !!document.getElementById('studySelectorOverlay')?.classList.contains('show');
}

function isShortcutsModalOpen() {
  return !!document.getElementById('shortcutsOverlay')?.classList.contains('show');
}

// ═══════════════════════════════════════════════════════
//  KEYBOARD + INIT
// ═══════════════════════════════════════════════════════
function isAnalyticsModalOpen() {
  const overlay = document.getElementById('analyticsOverlay');
  return !!overlay && overlay.classList.contains('show');
}

function openAnalyticsOverlay() {
  const overlay = document.getElementById('analyticsOverlay');
  if (!overlay) return;
  renderAnalyticsOverlay();
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeAnalyticsOverlay() {
  const overlay = document.getElementById('analyticsOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  if (!isDisclaimerModalOpen() && !isTransferModalOpen() && !isStudySelectorOpen() && !isShortcutsModalOpen()) document.body.classList.remove('modal-open');
}

function openStudySelector() {
  buildSessions();
  buildChapterSelector();
  buildSupplementalSelector();
  buildAdvancedSelector();

  const overlay = document.getElementById('studySelectorOverlay');
  if (!overlay) return;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeStudySelector() {
  const overlay = document.getElementById('studySelectorOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  if (!isDisclaimerModalOpen() && !isTransferModalOpen() && !isAnalyticsModalOpen() && !isShortcutsModalOpen()) document.body.classList.remove('modal-open');
}

function openShortcutsModal() {
  const overlay = document.getElementById('shortcutsOverlay');
  if (!overlay) return;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeShortcutsModal() {
  const overlay = document.getElementById('shortcutsOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  if (!isDisclaimerModalOpen() && !isTransferModalOpen() && !isAnalyticsModalOpen() && !isStudySelectorOpen()) document.body.classList.remove('modal-open');
}

function startStudying() {
  if (!selectedKeys.length) {
    openStudySelector();
    return;
  }
  const cardArea = document.getElementById('cardArea');
  if (cardArea) cardArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


function installTouchSafeTapBridge() {
  const TOUCH_TAP_SELECTOR = [
    'button',
    '[role="button"]',
    '[role="switch"]',
    '.card-wrapper',
    '[onclick]'
  ].join(',');
  const MAX_TAP_MOVEMENT_PX = 14;
  const MAX_TAP_SCROLL_PX = 8;

  let lastTouchTriggeredEl = null;
  let lastTouchTriggeredAt = 0;
  let syntheticTapDispatchDepth = 0;
  let activeTouchGesture = null;
  let activePointerGesture = null;

  function getTapTarget(startEl) {
    if (!startEl || !startEl.closest) return null;
    const el = startEl.closest(TOUCH_TAP_SELECTOR);
    if (!el) return null;
    if (el.closest('label') && !el.matches('button,[role="button"],[role="switch"],.card-wrapper,[onclick]')) return null;
    return el;
  }

  function isDisabledTapTarget(el) {
    return !el || el.disabled || el.getAttribute('aria-disabled') === 'true';
  }

  function shouldIgnoreTouchEvent(event) {
    if (event.type === 'pointerup' || event.type === 'pointerdown' || event.type === 'pointermove' || event.type === 'pointercancel') {
      return event.pointerType && event.pointerType !== 'touch' && event.pointerType !== 'pen';
    }
    return false;
  }

  function getEventPoint(event) {
    const touch = (event.changedTouches && event.changedTouches[0]) || (event.touches && event.touches[0]);
    if (touch) {
      return { id: touch.identifier, x: touch.clientX, y: touch.clientY };
    }
    if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
      return { id: event.pointerId || 'pointer', x: event.clientX, y: event.clientY };
    }
    return null;
  }

  function getScrollSnapshots(el) {
    const snapshots = [];
    let node = el instanceof Element ? el.parentElement : null;
    while (node) {
      const style = window.getComputedStyle(node);
      const overflowY = style.overflowY || '';
      const overflowX = style.overflowX || '';
      const isScrollable = /(auto|scroll|overlay)/.test(`${overflowY} ${overflowX}`)
        && (node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1);
      if (isScrollable) {
        snapshots.push({ el: node, top: node.scrollTop, left: node.scrollLeft });
      }
      node = node.parentElement;
    }
    snapshots.push({
      el: window,
      top: window.scrollY || window.pageYOffset || 0,
      left: window.scrollX || window.pageXOffset || 0
    });
    return snapshots;
  }

  function hasScrollGesture(snapshots) {
    return snapshots.some(({ el, top, left }) => {
      const currentTop = el === window ? (window.scrollY || window.pageYOffset || 0) : el.scrollTop;
      const currentLeft = el === window ? (window.scrollX || window.pageXOffset || 0) : el.scrollLeft;
      return Math.abs(currentTop - top) > MAX_TAP_SCROLL_PX || Math.abs(currentLeft - left) > MAX_TAP_SCROLL_PX;
    });
  }

  function createGesture(event, target) {
    const point = getEventPoint(event);
    if (!point || !target) return null;
    return {
      id: point.id,
      target,
      startX: point.x,
      startY: point.y,
      moved: false,
      scrolled: false,
      scrollSnapshots: getScrollSnapshots(target)
    };
  }

  function updateGesture(gesture, event) {
    if (!gesture) return gesture;
    const point = getEventPoint(event);
    if (point && point.id === gesture.id) {
      if (Math.abs(point.x - gesture.startX) > MAX_TAP_MOVEMENT_PX || Math.abs(point.y - gesture.startY) > MAX_TAP_MOVEMENT_PX) {
        gesture.moved = true;
      }
    }
    if (!gesture.scrolled && gesture.scrollSnapshots && gesture.scrollSnapshots.length) {
      gesture.scrolled = hasScrollGesture(gesture.scrollSnapshots);
    }
    return gesture;
  }

  function clearGestureForEvent(event) {
    if (event.type.startsWith('pointer')) {
      activePointerGesture = null;
    } else {
      activeTouchGesture = null;
    }
  }

  function dispatchSyntheticClick(el) {
    syntheticTapDispatchDepth += 1;
    try {
      el.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
    } finally {
      syntheticTapDispatchDepth = Math.max(0, syntheticTapDispatchDepth - 1);
    }
  }

  function onTouchLikeStart(event) {
    if (shouldIgnoreTouchEvent(event)) return;
    if (event.defaultPrevented) return;
    if (event.touches && event.touches.length > 1) {
      activeTouchGesture = null;
      return;
    }
    const el = getTapTarget(event.target);
    if (isDisabledTapTarget(el)) return;
    const gesture = createGesture(event, el);
    if (event.type === 'pointerdown') activePointerGesture = gesture;
    else activeTouchGesture = gesture;
  }

  function onTouchLikeMove(event) {
    if (shouldIgnoreTouchEvent(event)) return;
    if (event.type === 'pointermove') updateGesture(activePointerGesture, event);
    else updateGesture(activeTouchGesture, event);
  }

  function onTouchLikeTap(event) {
    if (shouldIgnoreTouchEvent(event)) return;
    const gesture = event.type === 'pointerup' ? activePointerGesture : activeTouchGesture;
    updateGesture(gesture, event);
    if (!gesture) return;

    const el = getTapTarget(event.target) || gesture.target;
    const gestureTarget = gesture.target;
    clearGestureForEvent(event);
    if (event.defaultPrevented) return;
    if (isDisabledTapTarget(gestureTarget) || !el || el !== gestureTarget) return;
    if (gesture.moved || gesture.scrolled) return;

    const now = Date.now();
    if (lastTouchTriggeredEl === gestureTarget && (now - lastTouchTriggeredAt) < 700) {
      event.preventDefault();
      return;
    }

    lastTouchTriggeredEl = gestureTarget;
    lastTouchTriggeredAt = now;
    event.preventDefault();
    dispatchSyntheticClick(gestureTarget);
  }

  function onTouchLikeCancel(event) {
    if (shouldIgnoreTouchEvent(event)) return;
    clearGestureForEvent(event);
  }

  function suppressNativeFollowupClick(event) {
    if (syntheticTapDispatchDepth > 0) return;
    const el = getTapTarget(event.target);
    if (!el) return;
    if (lastTouchTriggeredEl === el && (Date.now() - lastTouchTriggeredAt) < 700) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }

  document.addEventListener('touchstart', onTouchLikeStart, true);
  document.addEventListener('touchmove', onTouchLikeMove, true);
  document.addEventListener('touchend', onTouchLikeTap, true);
  document.addEventListener('touchcancel', onTouchLikeCancel, true);
  document.addEventListener('pointerdown', onTouchLikeStart, true);
  document.addEventListener('pointermove', onTouchLikeMove, true);
  document.addEventListener('pointerup', onTouchLikeTap, true);
  document.addEventListener('pointercancel', onTouchLikeCancel, true);
  document.addEventListener('click', suppressNativeFollowupClick, true);
}

function backfillConfirmedMilestones(cards, marksStore) {
  (cards || []).forEach(card => {
    const progress = getWordProgress(card.id);
    if (!progress.firstSeenAt && progress.lastReviewedAt) progress.firstSeenAt = progress.lastReviewedAt;
    if (!progress.firstConfirmedAt && marksStore?.[card.id] === 'known' && progress.lastReviewedAt) progress.firstConfirmedAt = progress.lastReviewedAt;
  });
}

function buildDailyCumulativeSeriesFromMap(dailyMap, startTs = 0) {
  const entries = Object.entries(dailyMap || {}).filter(([, value]) => Number.isFinite(value) && value > 0);
  if (!entries.length) return [];
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const firstKey = startTs ? getUsageDayKey(startTs) : entries[0][0];
  const lastKey = getUsageDayKey();
  let cursor = new Date(`${firstKey}T00:00:00`);
  const last = new Date(`${lastKey}T00:00:00`);
  let cumulative = 0;
  const series = [];
  while (cursor <= last) {
    const key = getUsageDayKey(cursor.getTime());
    cumulative += dailyMap[key] || 0;
    series.push({ key, ts: cursor.getTime(), value: cumulative / (60 * 60 * 1000) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return series;
}

function buildCumulativeConfirmationSeries(cards, marksStore) {
  const total = (cards || []).length;
  if (!total) return { total: 0, currentConfirmed: 0, weeklyPct: 0, series: [] };
  backfillConfirmedMilestones(cards, marksStore);
  const confirmedTimes = cards.map(card => getWordProgress(card.id).firstConfirmedAt || 0).filter(Boolean).sort((a, b) => a - b);
  const currentConfirmed = (cards || []).filter(card => {
    if (marksStore?.[card.id] === 'known') return true;
    const p = getWordProgress(card.id);
    const pct = getConfidencePct(p);
    return pct !== null && pct >= 70;
  }).length;
  if (!confirmedTimes.length) return { total, currentConfirmed, weeklyPct: 0, series: [] };
  const dailyAdds = {};
  confirmedTimes.forEach(ts => { const key = getUsageDayKey(ts); dailyAdds[key] = (dailyAdds[key] || 0) + 1; });
  const firstKey = Object.keys(dailyAdds).sort()[0];
  const lastKey = getUsageDayKey();
  let cursor = new Date(`${firstKey}T00:00:00`);
  const last = new Date(`${lastKey}T00:00:00`);
  let cumulative = 0;
  const series = [];
  while (cursor <= last) {
    const key = getUsageDayKey(cursor.getTime());
    cumulative += dailyAdds[key] || 0;
    series.push({ key, ts: cursor.getTime(), value: cumulative / total, count: cumulative });
    cursor.setDate(cursor.getDate() + 1);
  }
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentCount = confirmedTimes.filter(ts => ts >= cutoff).length;
  const weeklyPct = total ? (recentCount / total) * 100 : 0;
  return { total, currentConfirmed, weeklyPct, series };
}

function getRegressionProjection(series, currentCount, totalCount) {
  if (!Array.isArray(series) || series.length < 2 || !totalCount || currentCount >= totalCount) return null;
  const recent = series.slice(-28);
  if (recent.length < 2) return null;
  const x0 = recent[0].ts;
  const points = recent.map(point => ({ x: (point.ts - x0) / (24 * 60 * 60 * 1000), y: point.count }));
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + (p.x * p.y), 0);
  const sumXX = points.reduce((sum, p) => sum + (p.x * p.x), 0);
  const denom = (n * sumXX) - (sumX * sumX);
  if (!denom) return null;
  const slope = ((n * sumXY) - (sumX * sumY)) / denom;
  const intercept = (sumY - (slope * sumX)) / n;
  if (!(slope > 0.01)) return null;
  const projectedX = (totalCount - intercept) / slope;
  if (!Number.isFinite(projectedX)) return null;
  const projectedTs = x0 + (projectedX * 24 * 60 * 60 * 1000);
  return projectedTs >= Date.now() ? { cardsPerDay: slope, projectedTs } : null;
}

function getCertaintyBucketForCard(card, marksStore) {
  const progress = getWordProgress(card.id);
  const confidence = getConfidencePct(progress);
  if ((!progress.seenCount && confidence === null) && marksStore?.[card.id] !== 'known') return 'unseen';
  if (marksStore?.[card.id] === 'known') return '100';
  if (confidence === null) return progress.seenCount ? '0' : 'unseen';
  if (confidence >= 80) return '100';
  if (confidence >= 25) return '50';
  return '0';
}

function buildCertaintyBuckets(cards, marksStore) {
  const buckets = { unseen: 0, '0': 0, '50': 0, '100': 0 };
  (cards || []).forEach(card => { buckets[getCertaintyBucketForCard(card, marksStore)] += 1; });
  return buckets;
}

// Returns array of 11 counts: [unseen, 0-9%, 10-19%, ..., 90-100%]
function buildConfirmationHistogram(cards) {
  const counts = new Array(11).fill(0);
  (cards || []).forEach(card => {
    const progress = getWordProgress(card.id);
    const pct = getConfidencePct(progress);
    if (pct === null && !progress.seenCount) {
      counts[0]++;
    } else {
      const p = pct === null ? 0 : pct;
      counts[Math.min(10, Math.floor(p / 10) + 1)]++;
    }
  });
  return counts;
}

function buildHistogramSvg(counts, options = {}) {
  const width = options.width || 860;
  const height = options.height || 180;
  const padLeft = 36, padRight = 14, padTop = 16, padBottom = 28;
  const n = 11;
  const totalW = width - padLeft - padRight;
  const barW = totalW / n;
  const gap = 3;
  const maxCount = Math.max(...counts, 1);
  const usableH = height - padTop - padBottom;

  const bars = counts.map((count, i) => {
    const barH = Math.max(0, (count / maxCount) * usableH);
    const x = padLeft + i * barW + gap / 2;
    const y = height - padBottom - barH;
    const w = Math.max(0, barW - gap);
    const minPct = (i - 1) * 10;
    let fill;
    if (i === 0) fill = 'rgba(138,143,168,0.4)';
    else if (minPct >= 70) fill = 'rgba(102,164,120,0.85)';
    else if (minPct >= 60) fill = 'rgba(201,168,76,0.85)';
    else fill = 'rgba(166,88,88,0.7)';
    const label = i === 0 ? '?' : `${minPct}–${minPct + 9}%`;
    return barH > 0 ? `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${barH.toFixed(1)}" fill="${fill}" rx="2"><title>${label}: ${count}</title></rect>` : '';
  });

  // Dashed 70% threshold line between bar 7 (60-69%) and bar 8 (70-79%)
  const threshX = (padLeft + 8 * barW).toFixed(1);
  const threshLine = `<line x1="${threshX}" y1="${padTop}" x2="${threshX}" y2="${height - padBottom}" stroke="rgba(102,164,120,0.5)" stroke-width="1.5" stroke-dasharray="4,3"/>
    <text x="${threshX}" y="${padTop + 10}" text-anchor="middle" class="analytics-axis-text" fill="rgba(102,164,120,0.8)">70%+</text>`;

  const xLabels = counts.map((_, i) => {
    const x = padLeft + i * barW + barW / 2;
    const label = i === 0 ? '?' : `${(i - 1) * 10}%`;
    return `<text x="${x.toFixed(1)}" y="${height - 6}" text-anchor="middle" class="analytics-axis-text">${label}</text>`;
  }).join('');

  const yLabels = [0, Math.ceil(maxCount / 2), maxCount].map(v => {
    const y = (height - padBottom - (v / maxCount) * usableH).toFixed(1);
    return `<line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" class="analytics-grid-line"></line>
      <text x="${padLeft - 5}" y="${(parseFloat(y) + 4).toFixed(1)}" text-anchor="end" class="analytics-axis-text">${v}</text>`;
  }).join('');

  return `
    <svg class="analytics-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeHtml(options.title || 'Confirmation histogram')}">
      ${yLabels}
      <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" class="analytics-axis-line"></line>
      <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" class="analytics-axis-line"></line>
      ${threshLine}
      ${bars.join('')}
      ${xLabels}
    </svg>
  `;
}

function buildLineChartSvg(series, options = {}) {
  const width = options.width || 860;
  const height = options.height || 220;
  const padLeft = 36; const padRight = 14; const padTop = 12; const padBottom = 24;
  const values = (series || []).map(point => Number(point.value) || 0);
  if (!values.length) return `<div class="analytics-empty">Not enough data yet.</div>`;
  const maxValue = Math.max(...values, options.maxValue || 0);
  const safeMax = maxValue > 0 ? maxValue : 1;
  const minTs = series[0].ts; const maxTs = series[series.length - 1].ts || (minTs + 1); const span = Math.max(1, maxTs - minTs);
  const toX = ts => padLeft + (((ts - minTs) / span) * (width - padLeft - padRight));
  const toY = value => (height - padBottom) - ((value / safeMax) * (height - padTop - padBottom));
  const path = series.map((point, idx) => `${idx ? 'L' : 'M'} ${toX(point.ts).toFixed(1)} ${toY(point.value).toFixed(1)}`).join(' ');
  const lastPoint = series[series.length - 1]; const midPoint = series[Math.max(0, Math.floor(series.length / 2) - 1)];
  const axisLabels = [{ x: toX(series[0].ts), label: formatAnalyticsDate(series[0].ts) }, { x: toX(midPoint.ts), label: formatAnalyticsDate(midPoint.ts) }, { x: toX(lastPoint.ts), label: formatAnalyticsDate(lastPoint.ts) }];
  const yLabels = [0, safeMax / 2, safeMax];
  return `
    <svg class="analytics-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeHtml(options.title || 'Chart')}">
      <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" class="analytics-axis-line"></line>
      <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" class="analytics-axis-line"></line>
      ${yLabels.map(value => { const y = toY(value); return `
          <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" class="analytics-grid-line"></line>
          <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" class="analytics-axis-text">${options.percent ? `${Math.round(value * 100)}%` : value.toFixed(value >= 10 ? 0 : 1)}</text>
        `; }).join('')}
      <path d="${path}" class="analytics-line-path"></path>
      <circle cx="${toX(lastPoint.ts)}" cy="${toY(lastPoint.value)}" r="4" class="analytics-line-point"></circle>
      ${axisLabels.map(item => `<text x="${item.x}" y="${height - 6}" text-anchor="middle" class="analytics-axis-text">${escapeHtml(item.label)}</text>`).join('')}
    </svg>
  `;
}

function buildBarChartSvg(buckets, options = {}) {
  const segments = [
    { key: '100',    label: 'Easy',      className: 'stacked-seg-100' },
    { key: '50',     label: 'Uncertain', className: 'stacked-seg-50' },
    { key: '0',      label: 'Hard',      className: 'stacked-seg-0' },
    { key: 'unseen', label: 'Unseen',    className: 'stacked-seg-unseen' }
  ];
  const total = segments.reduce((sum, s) => sum + (Number(buckets?.[s.key]) || 0), 0);
  if (!total) return `<div class="analytics-empty">No cards in this selection yet.</div>`;
  const segs = segments.map(s => {
    const count = Number(buckets?.[s.key]) || 0;
    const pct = (count / total) * 100;
    return { ...s, count, pct };
  }).filter(s => s.count > 0);

  const barHtml = segs.map(s =>
    `<div class="stacked-seg ${s.className}" style="width:${s.pct.toFixed(2)}%" title="${s.label}: ${s.count} (${Math.round(s.pct)}%)"></div>`
  ).join('');

  const legendHtml = segs.map(s =>
    `<span class="stacked-legend-item"><span class="stacked-legend-dot ${s.className}"></span>${s.label} ${s.count} <span class="stacked-legend-pct">${Math.round(s.pct)}%</span></span>`
  ).join('');

  return `
    <div class="stacked-bar-wrap">
      <div class="stacked-bar">${barHtml}</div>
      <div class="stacked-legend">${legendHtml}</div>
    </div>
  `;
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

// ═══════════════════════════════════════════════════════
//  GAMIFICATION HELPERS
// ═══════════════════════════════════════════════════════

// Per-card XP: again=1, uncertain=3, easy=10 (first)/5 (subsequent) spaced, 1 unspaced.
// Time XP: 2 per minute of active study.
// 30 levels, exponential gaps; extends to 200K XP.
// Legacy XP totals are carried forward on migration.
function ensureLevelToastElement() {
  let host = document.getElementById('levelToastHost');
  if (host) return host;
  host = document.createElement('div');
  host.id = 'levelToastHost';
  host.className = 'level-toast-host';
  document.body.appendChild(host);
  return host;
}

function clearToastTimers() {
  if (levelToastHideTimer) {
    window.clearTimeout(levelToastHideTimer);
    levelToastHideTimer = null;
  }
  if (levelToastRemoveTimer) {
    window.clearTimeout(levelToastRemoveTimer);
    levelToastRemoveTimer = null;
  }
}

function dismissLevelToast() {
  const host = document.getElementById('levelToastHost');
  if (!host) return;
  host.classList.remove('show');
  clearToastTimers();
  levelToastRemoveTimer = window.setTimeout(() => {
    host.innerHTML = '';
    levelToastRemoveTimer = null;
    toastActive = false;
    showNextToast();
  }, 220);
}

function renderToast(toast) {
  if (!toast) return;
  const host = ensureLevelToastElement();
  const badgeHtml = toast.badgeHtml || escapeHtml(toast.badgeText || '★');
  host.innerHTML = `
    <button class="level-toast ${toast.variant === 'badge' ? 'level-toast-achievement' : ''}" type="button" aria-label="Dismiss notification">
      <span class="level-toast-badge">${badgeHtml}</span>
      <span class="level-toast-copy">
        <span class="level-toast-title">${escapeHtml(toast.title || 'Well done')}</span>
        <span class="level-toast-sub">${escapeHtml(toast.sub || 'Tap to dismiss')}</span>
      </span>
      <span class="level-toast-close" aria-hidden="true">×</span>
    </button>
  `;
  const button = host.querySelector('.level-toast');
  if (button) {
    button.addEventListener('click', dismissLevelToast);
    button.addEventListener('keydown', event => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        dismissLevelToast();
      }
    });
  }
  clearToastTimers();
  requestAnimationFrame(() => host.classList.add('show'));
  toastActive = true;
  levelToastHideTimer = window.setTimeout(() => {
    levelToastHideTimer = null;
    dismissLevelToast();
  }, 1800);
}

function enqueueToast(toast) {
  if (!toast) return;
  toastQueue.push(toast);
  if (!toastActive) showNextToast();
}

function showNextToast() {
  if (toastActive || !toastQueue.length) return;
  const nextToast = toastQueue.shift();
  renderToast(nextToast);
}

function showLevelToast(levelData, totalXp) {
  if (!levelData || !levelData.level) return;
  enqueueToast({
    variant: 'level',
    badgeText: `Lv. ${levelData.level}`,
    title: `Congratulations — you have earned ${levelData.title}`,
    sub: `${levelData.flav || 'Well done.'} · ${Number(totalXp || 0).toLocaleString()} XP · Tap to dismiss`
  });
}

function showBadgeToast(achievement) {
  if (!achievement || !achievement.id) return;
  enqueueToast({
    variant: 'badge',
    badgeHtml: `<span class="toast-achievement-icon">${achievement.icon || '★'}</span><span class="toast-achievement-label">Badge</span>`,
    title: `Congratulations — you have earned ${achievement.name}`,
    sub: `${achievement.desc || 'Badge earned'} · Tap to dismiss`
  });
}

function buildGamificationSnapshot() {
  const usage = ensureUsageStats();
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
  const g2eProgressStore = globalWordProgress.g2e || {};
  const e2gProgressStore = globalWordProgress.e2g || {};
  const morphProgressStore = globalWordProgress.morph || {};
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
  const mergedMarks = { ...(globalWordMarks.g2e || {}), ...(globalWordMarks.e2g || {}), ...(globalWordMarks.morph || {}) };
  const todayStats = computeTodayStats(usage.activeDailyMs, allCourseCards, mergedMarks, mergedProgressStore);
  const achievements = computeAchievements(usage, courseData, streaks, sessionHistory.length, todayStats);
  return { usage, sessionHistory, streaks, courseData, todayStats, achievements };
}

function syncEarnedAchievementSnapshot() {
  const snapshot = buildGamificationSnapshot();
  appGamification.lastEarnedAchievementIds = snapshot.achievements.filter(a => a.earned).map(a => a.id);
  appGamification.lastCelebratedBadgeDay = getUsageDayKey();
  return snapshot;
}

function maybeCelebrateLevelUp() {
  const usage = ensureUsageStats();
  const xpData = computeXpAndLevel(usage);
  const currentLevel = xpData.currentLevel?.level || 1;
  const previousLevel = Number.isFinite(appGamification.lastCelebratedLevel) && appGamification.lastCelebratedLevel >= 1
    ? appGamification.lastCelebratedLevel
    : currentLevel;

  if (currentLevel < previousLevel) {
    appGamification.lastCelebratedLevel = currentLevel;
    return;
  }

  if (currentLevel > previousLevel) {
    showLevelToast(xpData.currentLevel, xpData.totalXp);
  }

  appGamification.lastCelebratedLevel = currentLevel;
}

function maybeCelebrateAchievements() {
  const todayKey = getUsageDayKey();
  if (appGamification.lastCelebratedBadgeDay && appGamification.lastCelebratedBadgeDay !== todayKey) {
    appGamification.lastEarnedAchievementIds = (appGamification.lastEarnedAchievementIds || []).filter(id => id !== 'daily_first_card');
  }

  const snapshot = buildGamificationSnapshot();
  const earnedAchievements = snapshot.achievements.filter(a => a.earned);
  const priorEarnedIds = new Set(Array.isArray(appGamification.lastEarnedAchievementIds) ? appGamification.lastEarnedAchievementIds : []);
  const newlyEarned = earnedAchievements.filter(a => !priorEarnedIds.has(a.id));

  newlyEarned.forEach(showBadgeToast);
  appGamification.lastEarnedAchievementIds = earnedAchievements.map(a => a.id);
  appGamification.lastCelebratedBadgeDay = todayKey;
}

// One-time migration: compute old XP from seenCount and store as cardXpEarned
function migrateLegacyXp(usage) {
  let legacyCardXp = 0;
  ['g2e', 'e2g', 'morph'].forEach(bucket => {
    const store = globalWordProgress[bucket];
    if (!store || typeof store !== 'object') return;
    const keys = Object.keys(store);
    for (let k = 0; k < keys.length; k++) {
      const entry = store[keys[k]];
      if (!entry || typeof entry !== 'object') continue;
      const seen = Math.max(0, entry.seenCount || 0);
      for (let i = 0; i < seen; i++) {
        legacyCardXp += i < REVIEW_XP_SCHEDULE.length ? REVIEW_XP_SCHEDULE[i] : 1;
      }
    }
  });
  usage.cardXpEarned = legacyCardXp;
}

function computeTotalXp(usage) {
  if (usage.cardXpEarned < 0) migrateLegacyXp(usage);
  const cardXp = Math.max(0, usage.cardXpEarned || 0);
  const timeXp = Math.floor((usage.activeStudyMs || 0) / (60 * 1000)) * 2;
  return cardXp + timeXp;
}

function computeStudyStreaks(activeDailyMs) {
  const map = activeDailyMs || {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let current = 0;
  let cursor = new Date(today);
  // Allow today to have 0 — streak is still alive if yesterday had activity
  if (!map[getUsageDayKey(cursor.getTime())]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (map[getUsageDayKey(cursor.getTime())] > 0) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  // Longest streak
  const keys = Object.keys(map).filter(k => map[k] > 0).sort();
  let longest = 0; let run = 0; let prev = null;
  for (const key of keys) {
    const d = new Date(key + 'T00:00:00');
    if (prev) {
      const diff = Math.round((d - prev) / (24 * 60 * 60 * 1000));
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }
  return { current, longest };
}

function computeXpAndLevel(usage) {
  const totalXp = computeTotalXp(usage);
  let currentLevel = XP_LEVELS[0];
  let nextLevel = XP_LEVELS[1] || null;
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= XP_LEVELS[i].threshold) {
      currentLevel = XP_LEVELS[i];
      nextLevel = XP_LEVELS[i + 1] || null;
      break;
    }
  }
  const levelProgress = nextLevel
    ? (totalXp - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)
    : 1;
  return { totalXp, currentLevel, nextLevel, levelProgress: Math.min(1, Math.max(0, levelProgress)) };
}

function computeTodayStats(activeDailyMs, cards, marksStore, progressStore) {
  const todayKey = getUsageDayKey();
  const todayMs = (activeDailyMs || {})[todayKey] || 0;
  let reviewedToday = 0;
  let newToday = 0;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime();

  const sourceEntries = progressStore && typeof progressStore === 'object'
    ? Object.entries(progressStore)
    : [];

  if (sourceEntries.length) {
    sourceEntries.forEach(([cardId, p]) => {
      if (!p) return;
      if (p.lastReviewedAt && p.lastReviewedAt >= todayTs) {
        reviewedToday++;
      }
      if (p.firstConfirmedAt && p.firstConfirmedAt >= todayTs) {
        newToday++;
      }
    });
  } else {
    (cards || []).forEach(card => {
      const p = progressStore?.[card.id];
      if (!p) return;
      if (p.lastReviewedAt && p.lastReviewedAt >= todayTs) reviewedToday++;
      if (p.firstConfirmedAt && p.firstConfirmedAt >= todayTs) newToday++;
    });
  }

  const firstCardTodayEarned = reviewedToday > 0 || newToday > 0;
  return { todayMs, reviewedToday, newToday, firstCardTodayEarned };
}

function computeAchievements(usage, courseData, streaks, sessionCount, todayStats = null) {
  const earned = [];
  const check = (id, icon, name, desc, condition, group) => {
    earned.push({ id, icon, name, desc, earned: !!condition, group: group || 'milestone' });
  };

  const totalConfirmed = courseData.allVocabConfirmed + courseData.allGrammarConfirmed;
  const reviewedToday = Number(todayStats?.reviewedToday) || 0;
  const newToday = Number(todayStats?.newToday) || 0;
  const firstCardTodayEarned = !!todayStats?.firstCardTodayEarned;

  // ── Daily ──
  check('daily_first_card', '\u2605', 'First Card Today', 'Review your first card today', firstCardTodayEarned || reviewedToday > 0 || newToday > 0, 'daily');

  // ── Card milestones ──
  check('first_card',    '\u2726', 'First Light',     'Confirm your first card',            totalConfirmed >= 1);
  check('ten_cards',     '\u2605', 'Kindled',         'Confirm 10 cards',                   totalConfirmed >= 10);
  check('fifty_cards',   '\u2662', 'Diligent',        'Confirm 50 cards',                   totalConfirmed >= 50);
  check('hundred_cards', '\u2736', 'Centurion',       'Confirm 100 cards',                  totalConfirmed >= 100);
  check('twofifty',      '\u2741', 'Quarter-master',  'Confirm 250 cards',                  totalConfirmed >= 250);
  check('five_hundred',  '\u2743', 'Half a Thousand', 'Confirm 500 cards',                  totalConfirmed >= 500);

  // ── Streaks ──
  check('streak_3',      '\u2668', 'Three-fold Cord', '3-day study streak',                 streaks.current >= 3 || streaks.longest >= 3);
  check('streak_7',      '\u2604', 'Weekly Flame',    '7-day study streak',                 streaks.current >= 7 || streaks.longest >= 7);
  check('streak_14',     '\u269D', 'Fortnight',       '14-day study streak',                streaks.current >= 14 || streaks.longest >= 14);
  check('streak_30',     '\u2600', 'Monthly Devotion','30-day study streak',                streaks.current >= 30 || streaks.longest >= 30);

  // ── Time & sessions ──
  check('hour_one',      '\u231B', 'First Hour',      'Reach 1 hour of active study',       (usage.activeStudyMs || 0) >= 60 * 60 * 1000);
  check('hour_five',     '\u23F3', 'Five Hours',      'Reach 5 hours of active study',      (usage.activeStudyMs || 0) >= 5 * 60 * 60 * 1000);
  check('hour_ten',      '\u2316', 'Ten Hours',       'Reach 10 hours of active study',     (usage.activeStudyMs || 0) >= 10 * 60 * 60 * 1000);
  check('sessions_10',   '\u2692', 'Seasoned',        'Log 10 study sessions',              sessionCount >= 10);
  check('sessions_50',   '\u2694', 'Veteran',         'Log 50 study sessions',              sessionCount >= 50);

  // ── Completion awards (course-wide, persist across selection) ──
  check('req_vocab',     '\u2655', 'Required Lexicon','Confirm all required vocabulary',     courseData.reqVocabConfirmed >= courseData.reqVocabTotal && courseData.reqVocabTotal > 0);
  check('all_vocab',     '\u265B', 'Full Lexicon',    'Confirm every vocabulary card',       courseData.allVocabConfirmed >= courseData.allVocabTotal && courseData.allVocabTotal > 0);
  check('all_grammar',   '\u2654', 'Grammar Master',  'Confirm all grammar cards',           courseData.allGrammarConfirmed >= courseData.allGrammarTotal && courseData.allGrammarTotal > 0);

  // ── Per-chapter awards (vocab, persist regardless of selection) ──
  const chapterKeys = getAllChapterKeys();
  chapterKeys.forEach(chKey => {
    const chNum = Number(chKey);
    const chCards = getChapterVocabCards(chKey, false);
    if (!chCards.length) return;
    // Check g2e marks (the primary direction)
    const g2eMarks = globalWordMarks.g2e || {};
    const confirmed = chCards.filter(c => g2eMarks[c.id] === 'known').length;
    check(
      `ch_${chNum}`,
      '\u2720',
      `Ch. ${chNum}`,
      `Confirm all Ch. ${chNum} vocabulary (${chCards.length} cards)`,
      confirmed >= chCards.length,
      'chapter'
    );
  });

  return earned;
}

function computeCourseWideData() {
  const allVocab = getAllVocabCards(false);
  const reqVocab = getAllVocabCards(true);
  const allGrammar = getAllGrammarCards();

  // Use g2e marks as the canonical direction for course completion
  const g2eMarks = globalWordMarks.g2e || {};
  const morphMarks = globalWordMarks.morph || {};

  const isEffectivelyConfirmed = (card, marks) => {
    if (marks[card.id] === 'known') return true;
    const pct = getConfidencePct(getWordProgress(card.id));
    return pct !== null && pct >= 70;
  };
  const allVocabConfirmed = allVocab.filter(c => isEffectivelyConfirmed(c, g2eMarks)).length;
  const reqVocabConfirmed = reqVocab.filter(c => isEffectivelyConfirmed(c, g2eMarks)).length;
  const allGrammarConfirmed = allGrammar.filter(c => isEffectivelyConfirmed(c, morphMarks)).length;

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

function buildHeatmapSvg(activeDailyMs) {
  const weeks = 15;
  const cellSize = 13;
  const cellGap = 3;
  const totalDays = weeks * 7;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=Sun
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalDays - 1) - dayOfWeek);

  // collect values
  const cells = [];
  let maxVal = 0;
  const cursor = new Date(startDate);
  for (let i = 0; i < totalDays + dayOfWeek + 1; i++) {
    const key = getUsageDayKey(cursor.getTime());
    const val = (activeDailyMs || {})[key] || 0;
    const msVal = val / (60 * 1000); // minutes
    if (msVal > maxVal) maxVal = msVal;
    cells.push({ key, val: msVal, date: new Date(cursor), dow: cursor.getDay() });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Build grid: columns = weeks, rows = days of week (Mon-Sun reordered)
  const dayLabels = ['', 'M', '', 'W', '', 'F', ''];
  const labelWidth = 20;
  const gridWidth = (weeks + 1) * (cellSize + cellGap);
  const gridHeight = 7 * (cellSize + cellGap);
  const svgW = labelWidth + gridWidth + 10;
  const svgH = gridHeight + 28;

  // month labels
  const monthLabels = [];
  let lastMonth = -1;
  cells.forEach((cell, i) => {
    const m = cell.date.getMonth();
    if (m !== lastMonth && cell.dow === 0) {
      const week = Math.floor(i / 7);
      monthLabels.push({ label: cell.date.toLocaleDateString(undefined, { month: 'short' }), x: labelWidth + week * (cellSize + cellGap) });
      lastMonth = m;
    }
  });

  const safeMax = maxVal > 0 ? maxVal : 1;
  const rects = cells.map((cell, i) => {
    const week = Math.floor(i / 7);
    const dow = i % 7;
    const x = labelWidth + week * (cellSize + cellGap);
    const y = 18 + dow * (cellSize + cellGap);
    const isFuture = cell.date > today;
    let fill;
    if (isFuture) {
      fill = 'rgba(255,255,255,0.02)';
    } else if (cell.val === 0) {
      fill = 'rgba(255,255,255,0.05)';
    } else {
      const intensity = Math.min(1, cell.val / safeMax);
      const alpha = 0.2 + intensity * 0.7;
      fill = `rgba(201,168,76,${alpha.toFixed(2)})`;
    }
    const title = `${cell.key}: ${Math.round(cell.val)}m`;
    return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="3" fill="${fill}"><title>${escapeHtml(title)}</title></rect>`;
  }).join('');

  const dayLabelsSvg = dayLabels.map((label, i) => {
    if (!label) return '';
    const y = 18 + i * (cellSize + cellGap) + cellSize - 2;
    return `<text x="0" y="${y}" class="analytics-axis-text heatmap-day-label">${label}</text>`;
  }).join('');

  const monthLabelsSvg = monthLabels.map(m => `<text x="${m.x}" y="12" class="analytics-axis-text">${escapeHtml(m.label)}</text>`).join('');

  return `<svg class="heatmap-svg" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMinYMin meet" role="img" aria-label="Study activity heatmap">${monthLabelsSvg}${dayLabelsSvg}${rects}</svg>`;
}

function buildCircularProgressSvg(fraction, label, sublabel) {
  const size = 100;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, Math.max(0, fraction)));
  const pct = Math.round(fraction * 100);
  return `
    <svg class="ring-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeHtml(label)}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--gold)" stroke-width="${stroke}"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
        transform="rotate(-90 ${size/2} ${size/2})" class="ring-progress"/>
      <text x="${size/2}" y="${size/2 - 4}" text-anchor="middle" class="ring-value">${pct}%</text>
      <text x="${size/2}" y="${size/2 + 12}" text-anchor="middle" class="ring-label">${escapeHtml(sublabel)}</text>
    </svg>
  `;
}

function buildLevelBarHtml(xpData) {
  const pct = Math.round(xpData.levelProgress * 100);
  const nextLabel = xpData.nextLevel ? `${xpData.nextLevel.threshold - xpData.totalXp} XP to ${xpData.nextLevel.title}` : 'Max level reached';
  return `
    <div class="level-bar-wrap">
      <div class="level-bar-track">
        <div class="level-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="level-bar-caption">${escapeHtml(nextLabel)}</div>
    </div>
  `;
}


function buildTitleLadderHtml(xpData) {
  const totalXp = Number(xpData?.totalXp || 0);
  const currentLevel = Number(xpData?.currentLevel?.level || 1);
  const items = XP_LEVELS.map(level => {
    const earned = totalXp >= level.threshold;
    const isCurrent = currentLevel === level.level;
    const star = earned ? '<span class="title-ladder-star" aria-hidden="true">★</span>' : '<span class="title-ladder-star muted" aria-hidden="true">☆</span>';
    return `
      <div class="title-ladder-row ${earned ? 'earned' : 'locked'} ${isCurrent ? 'current' : ''}">
        <div class="title-ladder-main">
          <div class="title-ladder-name-wrap">${star}<span class="title-ladder-name">${escapeHtml(level.title)}</span>${isCurrent ? '<span class="title-ladder-current">Current</span>' : ''}</div>
          <div class="title-ladder-note">Level ${level.level}${level.flav ? ` · ${escapeHtml(level.flav)}` : ''}</div>
        </div>
        <div class="title-ladder-xp">${level.threshold.toLocaleString()} XP</div>
      </div>
    `;
  }).join('');

  return `
    <div class="analytics-chart-card title-ladder-card">
      <div class="analytics-chart-title">Titles and XP required</div>
      <div class="title-ladder-list">${items}</div>
    </div>
  `;
}

function renderAnalyticsOverlay() {
  const overlay = document.getElementById('analyticsOverlay'); if (!overlay) return;
  accumulateActiveStudyTime();
  const usage = ensureUsageStats();
  const usageSeries = buildDailyCumulativeSeriesFromMap(usage.activeDailyMs, usage.firstStudyAt || 0);
  const sessionHistory = [...usage.studySessionHistory];
  if (usage.currentStudySession && usage.currentStudySession.startedAt) sessionHistory.push({ startedAt: usage.currentStudySession.startedAt, endedAt: usage.lastStudyCountedAt || Date.now(), durationMs: usage.currentStudySession.durationMs || 0, interactionCount: usage.currentStudySession.interactionCount || 0 });
  const latestSession = sessionHistory[sessionHistory.length - 1] || null;

  // ── Vocab & Grammar data (used by both gamification and section renders) ──
  const vocabCards = selectedKeys.length ? getSelectedVocabCards(selectedKeys, requiredOnly) : [];
  const vocabMarks = directionToGreek ? globalWordMarks.e2g : globalWordMarks.g2e;
  const vocabProgress = buildCumulativeConfirmationSeries(vocabCards, vocabMarks);
  const vocabProjection = getRegressionProjection(vocabProgress.series, vocabProgress.currentConfirmed, vocabProgress.total);
  const vocabBuckets = buildConfirmationHistogram(vocabCards);
  const activePerConfirmed = vocabProgress.currentConfirmed ? usage.activeStudyMs / vocabProgress.currentConfirmed : 0;
  const grammarCards = canAccessGrammarUi() && selectedKeys.length ? getSelectedGrammarCards(selectedKeys) : [];
  const grammarMarks = globalWordMarks.morph;
  const grammarProgress = buildCumulativeConfirmationSeries(grammarCards, grammarMarks);
  const grammarProjection = getRegressionProjection(grammarProgress.series, grammarProgress.currentConfirmed, grammarProgress.total);
  const grammarBuckets = buildConfirmationHistogram(grammarCards);

  // ── Course-wide data (selection-independent, represents full course) ──
  const courseData = computeCourseWideData();

  // ── Gamification computations (all course-wide) ──
  const streaks = computeStudyStreaks(usage.activeDailyMs);
  const xpData = computeXpAndLevel(usage);
  const g2eProgressStore = globalWordProgress.g2e || {};
  const e2gProgressStore = globalWordProgress.e2g || {};
  const morphProgressStore = globalWordProgress.morph || {};
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
  const mergedMarks = { ...(globalWordMarks.g2e || {}), ...(globalWordMarks.e2g || {}), ...(globalWordMarks.morph || {}) };
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
    const streakFlame = streaks.current >= 7 ? '\u{1F525}' : streaks.current >= 3 ? '\u2668\uFE0F' : '\u2727';
    const todayGoalFraction = Math.min(1, todayStats.todayMs / (15 * 60 * 1000)); // 15-min daily goal
    heroEl.innerHTML = `
      <div class="hero-grid">
        <div class="hero-card hero-streak">
          <div class="hero-icon">${streakFlame}</div>
          <div class="hero-big">${streakLabel}</div>
          <div class="hero-sub">Current streak${streaks.longest > streaks.current ? ` \u00B7 Best: ${streaks.longest}d` : ''}</div>
        </div>
        <div class="hero-card hero-level">
          <div class="hero-rank-badge">Lv. ${xpData.currentLevel.level}</div>
          <div class="hero-big">${escapeHtml(xpData.currentLevel.title)}</div>
          <div class="hero-sub">${xpData.totalXp.toLocaleString()} XP${xpData.currentLevel.flav ? ' \u00B7 ' + escapeHtml(xpData.currentLevel.flav) : ''}</div>
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
    const g2eMarks = globalWordMarks.g2e || {};
    const morphMarksAll = globalWordMarks.morph || {};
    const courseVocabBuckets = buildConfirmationHistogram(courseData.allVocabCards);
    const showGrammar = canAccessGrammarUi();
    let courseGrammarHtml = '';
    if (showGrammar) {
      const courseGrammarBuckets = buildConfirmationHistogram(courseData.allGrammarCards);
      courseGrammarHtml = `
        <div class="analytics-chart-card" style="margin-top:10px">
          <div class="analytics-chart-title">Grammar \u2014 ${courseData.allGrammarConfirmed} / ${courseData.allGrammarTotal} confirmed</div>
          ${buildHistogramSvg(courseGrammarBuckets, { title: 'Course grammar confirmation %' })}
        </div>`;
    }
    courseEl.innerHTML = `
      <div class="analytics-chart-card">
        <div class="analytics-chart-title">Vocabulary \u2014 ${courseData.allVocabConfirmed} / ${courseData.allVocabTotal} confirmed (${courseData.reqVocabConfirmed} / ${courseData.reqVocabTotal} required)</div>
        ${buildHistogramSvg(courseVocabBuckets, { title: 'Course vocabulary confirmation %' })}
      </div>
      ${courseGrammarHtml}
    `;
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
  if (sessionEl) sessionEl.textContent = latestSession ? `Latest session: ${formatAnalyticsDateTime(latestSession.startedAt)} \u2192 ${formatAnalyticsDateTime(latestSession.endedAt)} \u00B7 ${formatUsageDuration(latestSession.durationMs)} \u00B7 ${latestSession.interactionCount || 0} study actions` : 'No study session history yet.';

  // ── Vocab section (untouched logic) ──
  renderAnalyticsSection('analyticsVocabSection', { title: 'Vocabulary progress', subtitle: selectedKeys.length ? `${requiredOnly ? 'Required-only' : 'All selected'} vocabulary for the current selection` : 'Choose one or more vocabulary sets to populate this view.', total: vocabProgress.total, metrics: [ { label: 'Confirmed now', value: `${vocabProgress.currentConfirmed} / ${vocabProgress.total || 0}`, note: 'Marked known or ≥70% recent accuracy' }, { label: 'Weekly progress', value: `${vocabProgress.weeklyPct.toFixed(1)}%`, note: 'Share of selected vocabulary first confirmed in the last 7 days' }, { label: 'Avg active time / confirmed word', value: vocabProgress.currentConfirmed ? formatUsageDuration(activePerConfirmed) : '\u2014', note: 'Based on total active study time' }, { label: 'Projected completion', value: vocabProgress.currentConfirmed >= vocabProgress.total && vocabProgress.total ? 'Complete' : (vocabProjection ? formatAnalyticsDate(vocabProjection.projectedTs) : '\u2014'), note: vocabProjection ? `${vocabProjection.cardsPerDay.toFixed(2)} words/day regression` : 'Needs more recent progress data' } ], lineTitle: 'Cumulative confirmed vocabulary fraction', lineSvg: vocabProgress.series.length ? buildLineChartSvg(vocabProgress.series, { title: 'Vocabulary progress', percent: true, maxValue: 1 }) : `<div class="analytics-empty">No confirmed vocabulary history yet for this selection.</div>`, barTitle: 'Vocabulary confirmation % (last 10 flips)', barSvg: buildHistogramSvg(vocabBuckets, { title: 'Vocabulary confirmation %' }) });

  // ── Grammar section (untouched logic) ──
  renderAnalyticsSection('analyticsGrammarSection', { title: 'Grammar progress', subtitle: canAccessGrammarUi() ? 'Morphology and grammar items in the current selection' : 'Switch to the full vocabulary + grammar layout to track grammar progress here.', total: grammarProgress.total, metrics: [ { label: 'Confirmed now', value: `${grammarProgress.currentConfirmed} / ${grammarProgress.total || 0}`, note: 'Marked known or ≥70% recent accuracy' }, { label: 'Weekly progress', value: `${grammarProgress.weeklyPct.toFixed(1)}%`, note: 'Share first confirmed in the last 7 days' }, { label: 'Projected completion', value: grammarProgress.currentConfirmed >= grammarProgress.total && grammarProgress.total ? 'Complete' : (grammarProjection ? formatAnalyticsDate(grammarProjection.projectedTs) : '\u2014'), note: grammarProjection ? `${grammarProjection.cardsPerDay.toFixed(2)} items/day regression` : 'Needs more recent progress data' }, { label: 'Required toggle', value: requiredOnly ? 'Vocabulary only' : 'All vocabulary', note: 'Grammar totals are not filtered by required-only' } ], lineTitle: 'Cumulative confirmed grammar fraction', lineSvg: grammarProgress.series.length ? buildLineChartSvg(grammarProgress.series, { title: 'Grammar progress', percent: true, maxValue: 1 }) : `<div class="analytics-empty">No confirmed grammar history yet for this selection.</div>`, barTitle: 'Grammar confirmation % (last 10 flips)', barSvg: buildHistogramSvg(grammarBuckets, { title: 'Grammar confirmation %' }) });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isAnalyticsModalOpen()) { closeAnalyticsOverlay(); return; }
  if (e.key === 'Escape' && isStudySelectorOpen()) { closeStudySelector(); return; }
  if (e.key === 'Escape' && isShortcutsModalOpen()) { closeShortcutsModal(); return; }
  if (e.key === 'Escape' && isWhatsNewV1_1ModalOpen()) { closeWhatsNewV1_1Modal(); return; }
  if (isDisclaimerModalOpen() || isTransferModalOpen() || isAnalyticsModalOpen() || isStudySelectorOpen() || isShortcutsModalOpen() || isWhatsNewV1_1ModalOpen()) return;
  if (!isReviewDeckMode() || !selectedKeys.length) return;

  if (isMorphologyMode()) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp') {
      if (morphAnswerState.answered && spacedUndoSnapshot) restoreSpacedUndo();
    }
    if (/^[1-4]$/.test(e.key)) {
      const idx = Number(e.key) - 1;
      answerMorphologyChoice(idx);
    }
    if (e.key === '0' || e.key === '5') passMorphologyChoice();
    return;
  }

  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigate(-1);
  if (e.key === '1') markCard('again');
  if (e.key === '2') markCard('pass');
  if (e.key === '3') markCard('easy');
  if (e.key === 'k' || e.key === 'K') markCard('easy');
  if (e.key === 'r' || e.key === 'R') markCard('again');
});

// ═══════════════════════════════════════════════════════
//  READER TAB
// ═══════════════════════════════════════════════════════
function openReaderTab() {
  setStudyMode('reader');
}

// ═══════════════════════════════════════════════════════
//  GLOBAL EXPORTS — needed for HTML onclick handlers
//  Export these BEFORE startup runs, so one later init error does not
//  leave the page rendered-but-unclickable.
// ═══════════════════════════════════════════════════════
const GLOBAL_CLICK_HANDLERS = {
  flipCard, navigate, markCard, answerMorphologyChoice, passMorphologyChoice,
  revealMorphologyAnswer, rateMorphologySelfCheck, returnSeenCardToDeck,
  closeAnalyticsOverlay, closeTransferModal, exportProgressJson,
  closeShortcutsModal, closeStudySelector,
  handleConsentAction, handleTransferPrimaryAction, handleTransferSecondaryAction,
  openShortcutsModal, openStudySelector,
  openAnalyticsOverlay, fastForwardOneDay, fastForwardOneWeek,
  resetAllStats, resetCurrentDeck, reshuffleEligible,
  restoreSpacedUndo, setAppProfile, setStudyMode, setThemeMode,
  showDisclaimerModal, startStudying, toggleDirection, toggleMorphSelfCheck,
  toggleRequiredOnly, toggleShuffle, toggleSpacedRepetition, triggerImportProgress,
  openReaderTab, selectReaderDrillChoice, advanceReaderDrill,
  closeWhatsNewV1_1Modal
};
if (typeof globalThis !== 'undefined') Object.assign(globalThis, GLOBAL_CLICK_HANDLERS);
if (typeof window !== 'undefined' && window !== globalThis) Object.assign(window, GLOBAL_CLICK_HANDLERS);

initializeThemeMode();
// Initial build with default state (needed so restoreState can find DOM elements)
buildSessions();
buildChapterSelector();
buildSupplementalSelector();
buildAdvancedSelector();
if (!restoreState()) {
  syncToggleButtons(); // reflect default controls on load
}
// Rebuild after restore: appProfile may have changed, affecting grammar summary text
buildSessions();
buildChapterSelector();
buildSupplementalSelector();
buildAdvancedSelector();
initializeConsentGate();
if (isReaderMode()) renderReaderModule();

window.addEventListener('greekSupplementalDataChanged', () => {
  buildSessions();
  buildChapterSelector();
  buildSupplementalSelector();
  buildAdvancedSelector();
  if (selectedKeys.length && selectedKeys.some(key => window.SETS?.[key]?.type === 'other')) {
    const keysToLoad = currentSession ? expandSessionSets(currentSession) : selectedKeys;
    loadDeckFromKeys(keysToLoad, currentSession ? currentSession.id : null);
  }
});

const cardArea = document.getElementById('cardArea');
if (cardArea) {
  cardArea.addEventListener('click', (event) => {
    const target = event.target;
    if (!target || !(target instanceof Element)) return;
    if (target.closest('.empty-state')) openStudySelector();
  });
}

startUsageTracking();
syncLayoutVisibility();
renderProgress();
installTouchSafeTapBridge();

// Prevent mobile double-tap zoom on interactive controls
function preventDoubleTapZoom(el) {
  let lastTouchEnd = 0;
  el.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
  }, false);
}

['shuffleToggle','requiredToggle','directionToggle','spacedToggle','selfCheckToggle','modeVocabBtn','modeMorphBtn','modeReaderBtn','modeShortcutVocabBtn','modeShortcutMorphBtn','modeShortcutReaderBtn','themeSystemBtn','themeDarkBtn','themeLightBtn'].forEach(id => {
  const el = document.getElementById(id);
  if (el) preventDoubleTapZoom(el);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then(reg => { try { reg.update(); } catch (_) {} })
      .catch(() => {});
  });
}
