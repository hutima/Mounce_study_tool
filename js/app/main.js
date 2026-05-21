// ═══════════════════════════════════════════════════════
//  GREEK FLASHCARDS — Modular Entry Point
// ═══════════════════════════════════════════════════════
//
// ┌─ LLM ORIENTATION ─ READ FIRST ──────────────────────────────────────┐
// │                                                                     │
// │ This file (main.js) is the entry point + glue. Most logic lives in  │
// │ modules under js/ui/, js/state/, and js/domain/. For most changes   │
// │ you do NOT need to load this file — load the relevant module(s)     │
// │ and js/state/runtime.js, that's it. See the task-to-files map below.│
// │                                                                     │
// │ STATE                                                               │
// │   All cross-module state lives in js/state/runtime.js as a single   │
// │   mutable `runtime` object. Modules `import { runtime }` and        │
// │   mutate properties directly (runtime.deck = ..., runtime.marks[id] │
// │   = 'known'). main.js does NOT own any module-level state.          │
// │                                                                     │
// │ WIRING                                                              │
// │   This file imports each module, then calls configure*(deps) at the │
// │   top to inject host callbacks the module needs. New host callbacks │
// │   go in the matching configure* block; new modules add their own    │
// │   configure call here. GLOBAL_CLICK_HANDLERS at the bottom is the   │
// │   onclick="..." surface used by index.html — every name there must  │
// │   resolve to either a local function or a named import.             │
// │                                                                     │
// │ MODULE MAP (load these, not this file, for the matching task)       │
// │   js/state/runtime.js       all shared mutable state                │
// │   js/state/persistence.js   save/restore, JSON export/import,       │
// │                             Transfer modal, deck-state bank         │
// │   js/state/store.js         storage keys, gamification sanitize     │
// │   js/state/migrations.js    versioned state migrations              │
// │   js/domain/srs/*           SRS scheduler, confidence, constants    │
// │   js/domain/deck/*          deck ordering + filters (pure)          │
// │   js/domain/gamification/   XP math, levels, usage-stats primitives │
// │   js/domain/grammar/        grammar-support HTML                    │
// │   js/ui/reader.js           Reader tab (drills + verses)            │
// │   js/ui/keyboard.js         keyboard shortcuts                      │
// │   js/ui/toast.js            level-up / badge toast queue            │
// │   js/ui/touchTapBridge.js   iOS synthetic-tap polyfill              │
// │   js/ui/modals.js           disclaimer, what's new, study selector, │
// │                             shortcuts, analytics open/close,        │
// │                             startStudying, isXxxOpen predicates     │
// │   js/ui/charts.js           pure SVG/HTML builders (histogram,      │
// │                             line, heatmap, ring, word stat card)    │
// │   js/ui/progress.js         progress bar + Review panel +           │
// │                             returnSeenCardToDeck                    │
// │   js/ui/render.js           renderCard, flipCard (vocab + grammar)  │
// │   js/ui/selectors.js        Study Selector overlay + load flow      │
// │                             (buildSessions/Chapter/Suppl/Advanced,  │
// │                             toggle/deselect, loadDeckFromKeys)      │
// │   js/ui/navigation.js       navigate, markCard, setStudyMode,       │
// │                             toggles (shuffle/required/direction/    │
// │                             spaced/morphSelfCheck), reshuffle,      │
// │                             fastForward, resetCurrentDeck,          │
// │                             resetAllStats                           │
// │   js/ui/analytics.js        renderAnalyticsOverlay + ~16 helpers,   │
// │                             runtime-bound XP wrappers, celebrate-   │
// │                             on-level-up/badge plumbing              │
// │   js/utils/*                helpers, time, storage, Greek sort      │
// │   js/logic/pos_logic.js     parsing helpers                         │
// │                                                                     │
// │ WHAT STAYS IN main.js (you only need this file for these)           │
// │   - Theme bootstrap (resolve/applyThemeMode, sync*Buttons, init)    │
// │   - Usage tracking (accumulate*, noteStudyInteraction,              │
// │     startUsageTracking, updateUsageMeta)                            │
// │   - Deck primitives: buildStudyDeck, applySpacedReview,             │
// │     getDueCount, getKnownCount, getHighConfidenceCount,             │
// │     getRemainingCards, moveCardToBackOfActivePile, reshuffle*,      │
// │     maybe*, capture/restore SpacedUndoSnapshot,                     │
// │     applyUnspacedSharedSchedule, recordStudyOutcome,                │
// │     advanceScheduledCards, getWordProgress, getDeckAggregateStats   │
// │   - Morphology answer flow (answerMorphologyChoice,                 │
// │     revealMorphologyAnswer, rateMorphologySelfCheck,                │
// │     passMorphologyChoice)                                           │
// │   - Mode predicates (isMorphologyMode, isReaderMode,                │
// │     canAccessGrammarUi, getDirectionalMarksStore, etc.)             │
// │   - startNextCycle, resetStudyState, resetUnspacedCycleState        │
// │   - GLOBAL_CLICK_HANDLERS, init at bottom                           │
// │                                                                     │
// │ TASK → MINIMAL FILE SET                                             │
// │   "fix a card-render bug"           render.js + runtime.js          │
// │   "fix an analytics chart"          analytics.js + charts.js +      │
// │                                       runtime.js                    │
// │   "tweak SRS scheduling"            domain/srs/scheduler.js +       │
// │                                       main.js (applySpacedReview,   │
// │                                       buildStudyDeck) + runtime.js  │
// │   "change progress-bar text"        progress.js + runtime.js        │
// │   "add a new toggle"                navigation.js + runtime.js +    │
// │                                       main.js (configureNavigation, │
// │                                       GLOBAL_CLICK_HANDLERS,        │
// │                                       syncToggleButtons) +          │
// │                                       index.html                    │
// │   "add a new onclick handler"       owning module + main.js         │
// │                                       (GLOBAL_CLICK_HANDLERS) +     │
// │                                       index.html                    │
// │   "add a Study Selector section"    selectors.js + runtime.js +     │
// │                                       index.html                    │
// │   "tweak export/import JSON shape"  persistence.js + runtime.js +   │
// │                                       state/migrations.js (if       │
// │                                       schema-breaking)              │
// │   "add a new XP source"             domain/gamification/levels.js + │
// │                                       domain/gamification/xp.js +   │
// │                                       maybe analytics.js            │
// │   "fix a modal close bug"           modals.js                       │
// │   "fix the reader drill flow"       reader.js                       │
// │                                                                     │
// │ WHEN TO LOAD THIS FILE                                              │
// │   - Wiring a brand-new module (you need to add a configure* call)   │
// │   - A bug in one of the deck primitives or morphology answer flow   │
// │   - A bug in the boot sequence (init at bottom of file)             │
// │   - Adding a new onclick handler (GLOBAL_CLICK_HANDLERS)            │
// │   In all other cases, prefer the relevant module(s). main.js is     │
// │   ~1,450 lines; loading it for a small change wastes tokens.        │
// │                                                                     │
// │ DEPLOY                                                              │
// │   Bump CACHE_NAME in sw.js (e.g. v64 → v65) AND every ?v=64 in      │
// │   sw.js + index.html. New js/* files must be added to                │
// │   APP_SHELL_PATHS in sw.js.                                         │
// │                                                                     │
// │ VERIFICATION                                                        │
// │   Strict-import parse catches more than `node --check`:             │
// │     node --input-type=module -e \                                   │
// │       "import('./js/app/main.js').catch(e=>{                        │
// │         console.error(e.message); process.exit(1);})"               │
// │   `document is not defined` is a successful parse (DOM unavailable  │
// │   in Node) — only treat actual SyntaxError / Invalid… as failures.  │
// │                                                                     │
// │ HISTORY                                                             │
// │   See REFACTOR_PLAN.txt for module-by-module rationale, the         │
// │   runtime-sweep methodology, and patterns to follow for future      │
// │   extractions.                                                      │
// └─────────────────────────────────────────────────────────────────────┘

// Utils
import { clamp, isPlainObject, shuffleArray, escapeHtml, cloneForUndo } from '../utils/helpers.js';
import { formatUsageDuration, formatAnalyticsDate, formatAnalyticsDateTime, getUsageDayKey, getUnspacedArchiveDayKey } from '../utils/time.js';
import { getStorage, isLikelyIOS } from '../utils/storage.js';
import { compareGreekAlphabetical } from '../utils/greekSort.js';

// Domain — SRS
import { SRS_DAY_MS, SRS_AGAIN_MS, SRS_NEAR_WINDOW_MS, SRS_CYCLE_ADVANCE_MS } from '../domain/srs/constants.js';
import { msFromDays, setProgressDelay,
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
// xp.js wrappers are exposed by analytics.js (which owns the runtime-bound
// versions). Importing them here keeps existing call sites in main.js working.

// Domain — Deck
import { isChapterKey, isAdvancedKey, sortSetKeys, sourceHint, expandSessionSets } from '../domain/deck/ordering.js';
import { getSelectedVocabCards, getSelectedGrammarCards, getAllVocabKeys, getAllChapterKeys,
         getAllVocabCards, getAllGrammarCards, getChapterVocabCards,
         getCardReviewLeft, getCardReviewRight, getCardMetaLine, getCardAuxLine } from '../domain/deck/filters.js';

// Domain — Grammar
import { buildGrammarSupportHtml } from '../domain/grammar/explanations.js';

// UI
import {
  configureReader,
  renderReaderModule,
  advanceReaderDrill,
  selectReaderDrillChoice,
  openReaderTab
} from '../ui/reader.js';
import { installKeyboardShortcuts } from '../ui/keyboard.js';
import { showLevelToast, showBadgeToast } from '../ui/toast.js';
import { installTouchSafeTapBridge } from '../ui/touchTapBridge.js';
import { installClickShield } from '../utils/clickShield.js';
import {
  configureModals,
  updateConsentButtonState,
  openDisclaimerModal,
  closeDisclaimerModal,
  handleConsentAction,
  initializeConsentGate,
  showDisclaimerModal,
  isDisclaimerModalOpen,
  maybeShowWhatsNewV1_1Modal,
  openWhatsNewV1_1Modal,
  closeWhatsNewV1_1Modal,
  isWhatsNewV1_1ModalOpen,
  isTransferModalOpen,
  isStudySelectorOpen,
  openStudySelector,
  closeStudySelector,
  isShortcutsModalOpen,
  openShortcutsModal,
  closeShortcutsModal,
  isAnalyticsModalOpen,
  openAnalyticsOverlay,
  closeAnalyticsOverlay,
  startStudying
} from '../ui/modals.js';
import {
  configureProgress,
  renderProgress,
  renderReview,
  returnSeenCardToDeck,
  setReviewSortMode
} from '../ui/progress.js';
import { configureRender, renderCard, flipCard } from '../ui/render.js';
import {
  configureSelectors,
  isSessionFullySelected,
  findExactSessionMatch,
  setActiveSessionButton,
  setActiveSetButtons,
  buildSessions,
  buildChapterSelector,
  buildSupplementalSelector,
  buildAdvancedSelector,
  deselectAllSupplementals,
  deselectAllAdvanced,
  deselectAllChapters,
  deselectAll,
  toggleAdvancedSubGroup,
  loadDeckFromKeys,
  loadSession,
  toggleSession,
  getParadigmBaseKey,
  toggleSet
} from '../ui/selectors.js';
import {
  configureNavigation,
  navigate,
  markCard,
  setStudyMode,
  setAppProfile,
  toggleMorphSelfCheck,
  toggleShuffle,
  toggleRequiredOnly,
  toggleHardVocabReview,
  toggleDirection,
  toggleSpacedRepetition,
  toggleSplitSelection,
  toggleUnspacedDailyReset,
  reshuffleEligible,
  fastForwardOneDay,
  fastForwardOneWeek,
  resetCurrentDeck,
  resetRequiredOnly,
  closeResetSpacedModal,
  confirmResetSpacedTimingOnly,
  confirmResetSpacedProgress,
  closeResetUnspacedModal,
  confirmResetUnspacedMarks,
  openResetStatsModal,
  closeResetStatsModal,
  confirmResetStatsKeepSettings,
  confirmResetToStart,
  resetAllStats
} from '../ui/navigation.js';
import {
  configureAnalytics,
  migrateLegacyXp,
  computeXpAndLevel,
  computeAchievements,
  syncEarnedAchievementSnapshot,
  maybeCelebrateLevelUp,
  maybeCelebrateAchievements,
  renderAnalyticsOverlay
} from '../ui/analytics.js';
import {
  configurePersistence,
  closeTransferModal,
  handleTransferPrimaryAction,
  handleTransferSecondaryAction,
  exportProgressJson,
  triggerImportProgress,
  getDeckStateKey,
  saveCurrentDeckStateToBank,
  markActiveDeckRef,
  saveState,
  clearSavedState,
  reorderDeckFromIds,
  restoreState,
  buildPersistedStatePayload
} from '../state/persistence.js';
import {
  backfillConfirmedMilestones,
  buildDailyCumulativeSeriesFromMap,
  buildCumulativeConfirmationSeries,
  getCertaintyBucketForCard,
  buildCertaintyBuckets,
  buildConfirmationHistogram,
  buildHistogramSvg,
  buildLineChartSvg,
  buildBarChartSvg,
  buildHeatmapSvg,
  buildCircularProgressSvg,
  buildLevelBarHtml,
  buildTitleLadderHtml,
  buildWordStatCardHtml
} from '../ui/charts.js';

// State
import { runtime } from '../state/runtime.js';
import { STATE_MIGRATIONS, summarizePersistedState, formatPersistedStateSummary } from '../state/migrations.js';
import {
  sanitizeGamificationState,
  STORAGE_KEY,
  CONSENT_STORAGE_KEY,
  WHATS_NEW_V1_1_STORAGE_KEY,
  THEME_STORAGE_KEY,
  FONT_FAMILY_STORAGE_KEY,
  TEXT_SIZE_STORAGE_KEY,
  PROGRESS_EXPORT_FORMAT,
  PROGRESS_EXPORT_VERSION,
  STUDY_IDLE_MS,
  STUDY_SESSION_BREAK_MS,
  MAX_STUDY_SESSION_HISTORY
} from '../state/store.js';

// Wire UI modules with the host helpers they call back into.
// Function declarations are hoisted; getter/setter closures defer reads to
// invocation time, so let-binding values are valid by the time they're called.
configureReader({ noteStudyInteraction, setStudyMode });
configureModals({
  renderAnalyticsOverlay: () => renderAnalyticsOverlay(),
  buildSessions: () => buildSessions(),
  buildChapterSelector: () => buildChapterSelector(),
  buildSupplementalSelector: () => buildSupplementalSelector(),
  buildAdvancedSelector: () => buildAdvancedSelector(),
  getHasAcceptedDisclaimer: () => runtime.hasAcceptedDisclaimer,
  setHasAcceptedDisclaimer: (v) => { runtime.hasAcceptedDisclaimer = v; },
  getDisclaimerModalRequiresAgreement: () => runtime.disclaimerModalRequiresAgreement,
  setDisclaimerModalRequiresAgreement: (v) => { runtime.disclaimerModalRequiresAgreement = v; },
  hasSelectedKeys: () => runtime.selectedKeys.length > 0
});
configureProgress({
  accumulateUsageTime: () => accumulateUsageTime(),
  accumulateActiveStudyTime: () => accumulateActiveStudyTime(),
  updateUsageMeta: () => updateUsageMeta(),
  getKnownCount: () => getKnownCount(),
  getDueCount: (cards) => getDueCount(cards),
  getRemainingCards: () => getRemainingCards(),
  getHighConfidenceCount: () => getHighConfidenceCount(),
  getWordProgress: (id, opts) => getWordProgress(id, opts),
  isMorphologyMode: () => isMorphologyMode(),
  renderAnalyticsOverlay: () => renderAnalyticsOverlay(),
  moveCardToBackOfActivePile: (card) => moveCardToBackOfActivePile(card),
  buildStudyDeck: (cards, opts) => buildStudyDeck(cards, opts),
  renderCard: () => renderCard(),
  saveState: () => saveState()
});
configureRender({
  saveState: () => saveState(),
  syncLayoutVisibility: () => syncLayoutVisibility(),
  noteStudyInteraction: () => noteStudyInteraction(),
  isMorphologyMode: () => isMorphologyMode(),
  isReverseGrammarActive: () => isReverseGrammarActive(),
  isMorphCard: (card) => isMorphCard(card),
  reverseDisplayActive: (card) => reverseDisplayActive(card),
  startNextCycle: (mode) => startNextCycle(mode),
  resetMorphAnswerState: () => resetMorphAnswerState(),
  maybeReturnKnownCardToActivePile: () => maybeReturnKnownCardToActivePile(),
  formatGreekHeadword: (g) => typeof window !== 'undefined' && typeof window.formatGreekHeadword === 'function' ? window.formatGreekHeadword(g) : (g || '—'),
  transliterateGreek: (s) => typeof window !== 'undefined' && typeof window.transliterateGreek === 'function' ? window.transliterateGreek(s) : s,
  detectPartOfSpeech: (card) => typeof window !== 'undefined' && typeof window.detectPartOfSpeech === 'function' ? window.detectPartOfSpeech(card) : '',
  isMultiCasePreposition: (card) => typeof window !== 'undefined' && typeof window.isMultiCasePreposition === 'function' ? window.isMultiCasePreposition(card) : false
});
configureSelectors({
  getSessions: () => getSessions(),
  getSelectedCards: (keys) => getSelectedCards(keys),
  getDirectionalMarksStore: () => getDirectionalMarksStore(),
  getDirectionalProgressStore: () => getDirectionalProgressStore(),
  resetMorphAnswerState: () => resetMorphAnswerState(),
  getDeckStateKey: (keys, req, spaced) => getDeckStateKey(keys, req, spaced),
  reorderDeckFromIds: (cards, ids) => reorderDeckFromIds(cards, ids),
  buildStudyDeck: (cards, opts) => buildStudyDeck(cards, opts),
  getDueCount: (cards) => getDueCount(cards),
  resetUnspacedCycleState: () => resetUnspacedCycleState(),
  resetStudyState: () => resetStudyState(),
  syncToggleButtons: () => syncToggleButtons(),
  clearSpacedUndoSnapshot: () => clearSpacedUndoSnapshot(),
  saveCurrentDeckStateToBank: () => saveCurrentDeckStateToBank(),
  markActiveDeckRef: () => markActiveDeckRef(),
  saveState: () => saveState(),
  canAccessGrammarUi: () => canAccessGrammarUi()
});
configureNavigation({
  noteStudyInteraction: () => noteStudyInteraction(),
  isMorphologyMode: () => isMorphologyMode(),
  isReaderMode: () => isReaderMode(),
  normalizeStudyMode: (m) => normalizeStudyMode(m),
  resetMorphAnswerState: () => resetMorphAnswerState(),
  ensureDirectionalStores: () => ensureDirectionalStores(),
  getDirectionalMarksStore: () => getDirectionalMarksStore(),
  getDirectionalProgressStore: () => getDirectionalProgressStore(),
  syncToggleButtons: () => syncToggleButtons(),
  syncLayoutVisibility: () => syncLayoutVisibility(),
  startNextCycle: (mode) => startNextCycle(mode),
  getKnownCount: () => getKnownCount(),
  advanceScheduledCards: (cards, ms) => advanceScheduledCards(cards, ms),
  buildStudyDeck: (cards, opts) => buildStudyDeck(cards, opts),
  captureSpacedUndoSnapshot: () => captureSpacedUndoSnapshot(),
  applySpacedReview: (card, outcome) => applySpacedReview(card, outcome),
  clearSpacedUndoSnapshot: () => clearSpacedUndoSnapshot(),
  restoreSpacedUndo: () => restoreSpacedUndo(),
  pushUnspacedHistory: (type) => pushUnspacedHistory(type),
  restoreUnspacedHistoryStep: () => restoreUnspacedHistoryStep(),
  clearSavedState: () => clearSavedState(),
  maybeReturnConfirmedDeferredCard: () => maybeReturnConfirmedDeferredCard(),
  maybePeriodicReshuffle: () => maybePeriodicReshuffle(),
  recordStudyOutcome: (id, outcome, at) => recordStudyOutcome(id, outcome, at),
  applyUnspacedSharedSchedule: (card, outcome, at) => applyUnspacedSharedSchedule(card, outcome, at),
  getRemainingCards: () => getRemainingCards(),
  resetUnspacedCycleState: () => resetUnspacedCycleState(),
  noteUnspacedArchiveActivity: () => noteUnspacedArchiveActivity(),
  saveCurrentDeckStateToBank: () => saveCurrentDeckStateToBank(),
  markActiveDeckRef: () => markActiveDeckRef(),
  saveState: () => saveState(),
  renderReaderModule: () => renderReaderModule(),
  getDeckStateKey: (keys, req, spaced) => getDeckStateKey(keys, req, spaced),
  getSessions: () => getSessions()
});
configureAnalytics({
  ensureUsageStats: () => ensureUsageStats(),
  accumulateActiveStudyTime: () => accumulateActiveStudyTime(),
  canAccessGrammarUi: () => canAccessGrammarUi(),
  saveState: () => saveState()
});
configurePersistence({
  ensureUsageStats: (stats) => ensureUsageStats(stats),
  normalizeStudyMode: (m) => normalizeStudyMode(m),
  ensureDirectionalStores: () => ensureDirectionalStores(),
  getDirectionalMarksStore: () => getDirectionalMarksStore(),
  getStudyStoreKey: () => getStudyStoreKey(),
  accumulateUsageTime: () => accumulateUsageTime(),
  accumulateActiveStudyTime: () => accumulateActiveStudyTime(),
  getSessions: () => getSessions(),
  getSelectedCards: (keys) => getSelectedCards(keys),
  buildStudyDeck: (cards, opts) => buildStudyDeck(cards, opts),
  getDueCount: (cards) => getDueCount(cards),
  resetMorphAnswerState: () => resetMorphAnswerState(),
  resetUnspacedCycleState: () => resetUnspacedCycleState(),
  clearSpacedUndoSnapshot: () => clearSpacedUndoSnapshot(),
  syncToggleButtons: () => syncToggleButtons(),
  syncLayoutVisibility: () => syncLayoutVisibility(),
  getDirectionalProgressStore: () => getDirectionalProgressStore(),
  isReaderMode: () => isReaderMode(),
  renderReaderModule: () => renderReaderModule(),
  maybeAutoResetUnspacedArchives: () => maybeAutoResetUnspacedArchives()
});


function getDirectionKey() {
  return runtime.directionToGreek ? 'e2g' : 'g2e';
}

function getStudyStoreKey() {
  if (runtime.studyMode === 'morph') {
    return runtime.directionToGreek ? 'morph_e2g' : 'morph';
  }
  return getDirectionKey();
}

function isReverseGrammarActive() {
  return runtime.studyMode === 'morph' && runtime.directionToGreek;
}

function reverseDisplayActive(card) {
  return isReverseGrammarActive() && !!card && card.reversible === true;
}

function ensureDirectionalStores() {
  if (!runtime.globalWordMarks || typeof runtime.globalWordMarks !== 'object' || Array.isArray(runtime.globalWordMarks)) runtime.globalWordMarks = {};
  if (!runtime.globalWordProgress || typeof runtime.globalWordProgress !== 'object' || Array.isArray(runtime.globalWordProgress)) runtime.globalWordProgress = {};

  const migrateLegacyBucket = (bucketObj) => {
    const keys = Object.keys(bucketObj || {});
    if (keys.length && !('g2e' in bucketObj) && !('e2g' in bucketObj) && !('morph' in bucketObj)) {
      return { g2e: { ...bucketObj }, e2g: {}, morph: {} };
    }
    return bucketObj;
  };

  runtime.globalWordMarks = migrateLegacyBucket(runtime.globalWordMarks);
  runtime.globalWordProgress = migrateLegacyBucket(runtime.globalWordProgress);

  if (!runtime.globalWordMarks.g2e || typeof runtime.globalWordMarks.g2e !== 'object') runtime.globalWordMarks.g2e = {};
  if (!runtime.globalWordMarks.e2g || typeof runtime.globalWordMarks.e2g !== 'object') runtime.globalWordMarks.e2g = {};
  if (!runtime.globalWordMarks.morph || typeof runtime.globalWordMarks.morph !== 'object') runtime.globalWordMarks.morph = {};
  if (!runtime.globalWordMarks.morph_e2g || typeof runtime.globalWordMarks.morph_e2g !== 'object') runtime.globalWordMarks.morph_e2g = {};
  if (!runtime.globalWordProgress.g2e || typeof runtime.globalWordProgress.g2e !== 'object') runtime.globalWordProgress.g2e = {};
  if (!runtime.globalWordProgress.e2g || typeof runtime.globalWordProgress.e2g !== 'object') runtime.globalWordProgress.e2g = {};
  if (!runtime.globalWordProgress.morph || typeof runtime.globalWordProgress.morph !== 'object') runtime.globalWordProgress.morph = {};
  if (!runtime.globalWordProgress.morph_e2g || typeof runtime.globalWordProgress.morph_e2g !== 'object') runtime.globalWordProgress.morph_e2g = {};
}

function getDirectionalMarksStore() {
  ensureDirectionalStores();
  return runtime.globalWordMarks[getStudyStoreKey()];
}

function getDirectionalProgressStore() {
  ensureDirectionalStores();
  return runtime.globalWordProgress[getStudyStoreKey()];
}


// Fixed 1-in-N chance per flip (not scaled by pool size) to return one
// random known card to the active pile. 100 → ~1 return per 100 flips.
const KNOWN_CARD_RANDOM_RETURN_FLIP_ODDS = 100;
// Same idea but for spaced-mode confirmed cards (>75% confidence): 1-in-50
// pseudo-random chance per flip (~2%).
const CONFIRMED_CARD_RANDOM_RETURN_FLIP_ODDS = 50;


function isMorphologyMode() {
  return runtime.studyMode === 'morph';
}

function isReaderMode() {
  return runtime.studyMode === 'reader';
}

function isCardStudyMode() {
  return runtime.studyMode === 'vocab' || runtime.studyMode === 'morph' || runtime.studyMode === 'reader';
}

function isReviewDeckMode() {
  return runtime.studyMode === 'vocab' || runtime.studyMode === 'morph';
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
  runtime.morphAnswerState = { answered: false, revealed: false, selfRated: false, selectedIndex: -1, isCorrect: null, skipped: false };
  runtime.morphPendingAdvance = false;
}

function getModeDescription() {
  if (isMorphologyMode()) return 'Grammar Quiz';
  if (isReaderMode()) return 'Reader';
  return 'Vocabulary Flashcards';
}

function resolveThemeMode(mode = runtime.themeMode) {
  if (mode === 'light' || mode === 'dark') return mode;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function applyThemeMode(mode = runtime.themeMode, persist = true) {
  runtime.themeMode = mode === 'light' || mode === 'dark' ? mode : 'system';
  const resolved = resolveThemeMode(runtime.themeMode);
  document.documentElement.setAttribute('data-theme', resolved);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', resolved === 'light' ? '#f4efe3' : '#0e0f14');

  const storage = getStorage();
  if (persist && storage) storage.setItem(THEME_STORAGE_KEY, runtime.themeMode);
  syncThemeButtons();
}

function syncThemeButtons() {
  const systemBtn = document.getElementById('themeSystemBtn');
  const darkBtn = document.getElementById('themeDarkBtn');
  const lightBtn = document.getElementById('themeLightBtn');
  if (systemBtn) systemBtn.classList.toggle('active', runtime.themeMode === 'system');
  if (darkBtn) darkBtn.classList.toggle('active', runtime.themeMode === 'dark');
  if (lightBtn) lightBtn.classList.toggle('active', runtime.themeMode === 'light');
}

function setThemeMode(mode) {
  applyThemeMode(mode, true);
}

function initializeThemeMode() {
  const storage = getStorage();
  const savedMode = storage ? storage.getItem(THEME_STORAGE_KEY) : null;
  runtime.themeMode = savedMode === 'light' || savedMode === 'dark' || savedMode === 'system' ? savedMode : 'system';
  applyThemeMode(runtime.themeMode, false);

  if (window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (runtime.themeMode === 'system') applyThemeMode('system', false);
    };
    if (typeof media.addEventListener === 'function') media.addEventListener('change', handleChange);
    else if (typeof media.addListener === 'function') media.addListener(handleChange);
  }
}

const FONT_FAMILY_OPTIONS = ['serif', 'sans'];
const TEXT_SIZE_OPTIONS = ['medium', 'large', 'x-large'];

function applyFontFamily(value = runtime.fontFamily, persist = true) {
  runtime.fontFamily = FONT_FAMILY_OPTIONS.includes(value) ? value : 'serif';
  document.documentElement.setAttribute('data-font-family', runtime.fontFamily);
  const storage = getStorage();
  if (persist && storage) storage.setItem(FONT_FAMILY_STORAGE_KEY, runtime.fontFamily);
  syncFontFamilyButtons();
}

function syncFontFamilyButtons() {
  const serifBtn = document.getElementById('fontSerifBtn');
  const sansBtn = document.getElementById('fontSansBtn');
  if (serifBtn) serifBtn.classList.toggle('active', runtime.fontFamily === 'serif');
  if (sansBtn) sansBtn.classList.toggle('active', runtime.fontFamily === 'sans');
}

function setFontFamily(value) {
  applyFontFamily(value, true);
}

function initializeFontFamily() {
  const storage = getStorage();
  const saved = storage ? storage.getItem(FONT_FAMILY_STORAGE_KEY) : null;
  runtime.fontFamily = FONT_FAMILY_OPTIONS.includes(saved) ? saved : 'serif';
  applyFontFamily(runtime.fontFamily, false);
}

function applyTextSize(value = runtime.textSize, persist = true) {
  runtime.textSize = TEXT_SIZE_OPTIONS.includes(value) ? value : 'medium';
  document.documentElement.setAttribute('data-text-size', runtime.textSize);
  const storage = getStorage();
  if (persist && storage) storage.setItem(TEXT_SIZE_STORAGE_KEY, runtime.textSize);
  syncTextSizeButtons();
}

function syncTextSizeButtons() {
  const map = {
    'medium': 'textSizeMediumBtn',
    'large': 'textSizeLargeBtn',
    'x-large': 'textSizeXLargeBtn'
  };
  for (const [size, id] of Object.entries(map)) {
    const btn = document.getElementById(id);
    if (btn) btn.classList.toggle('active', runtime.textSize === size);
  }
}

function setTextSize(value) {
  applyTextSize(value, true);
}

function initializeTextSize() {
  const storage = getStorage();
  const saved = storage ? storage.getItem(TEXT_SIZE_STORAGE_KEY) : null;
  runtime.textSize = TEXT_SIZE_OPTIONS.includes(saved) ? saved : 'medium';
  applyTextSize(runtime.textSize, false);
}

function syncToggleButtons() {
  const requiredSwitch  = document.getElementById('requiredBtn');
  const shuffleSwitch   = document.getElementById('shuffleBtn');
  const directionSwitch = document.getElementById('directionBtn');
  const spacedSwitch    = document.getElementById('spacedBtn');
  const hardReviewSwitch = document.getElementById('hardReviewBtn');
  const splitSelectionSwitch = document.getElementById('splitSelectionBtn');
  const selfCheckBtn    = document.getElementById('selfCheckBtn');
  const dailyResetSwitch = document.getElementById('unspacedDailyResetBtn');
  const shuffleToggle   = document.getElementById('shuffleToggle');
  const requiredToggle  = document.getElementById('requiredToggle');
  const directionToggle = document.getElementById('directionToggle');
  const spacedToggle    = document.getElementById('spacedToggle');
  const hardReviewToggle = document.getElementById('hardReviewToggle');
  const splitSelectionToggle = document.getElementById('splitSelectionToggle');
  const selfCheckToggle = document.getElementById('selfCheckToggle');
  const dailyResetToggle = document.getElementById('unspacedDailyResetToggle');
  const modeVocabBtn    = document.getElementById('modeVocabBtn');
  const modeMorphBtn    = document.getElementById('modeMorphBtn');
  const modeReaderBtn   = document.getElementById('modeReaderBtn');
  const modeShortcutVocabBtn = document.getElementById('modeShortcutVocabBtn');
  const modeShortcutMorphBtn = document.getElementById('modeShortcutMorphBtn');
  const modeShortcutReaderBtn = document.getElementById('modeShortcutReaderBtn');
  const resetDeckBtn = document.getElementById('resetDeckBtn');

  if (shuffleSwitch)   shuffleSwitch.classList.toggle('on',   !!runtime.shuffled);
  if (requiredSwitch)  requiredSwitch.classList.toggle('on',  !!runtime.requiredOnly);
  if (directionSwitch) directionSwitch.classList.toggle('on', !!runtime.directionToGreek);
  if (spacedSwitch)    spacedSwitch.classList.toggle('on',    !!runtime.spacedRepetition);
  if (hardReviewSwitch) hardReviewSwitch.classList.toggle('on', !!runtime.hardVocabReviewMode);
  if (splitSelectionSwitch) splitSelectionSwitch.classList.toggle('on', !!runtime.splitSelection);
  if (selfCheckBtn)    selfCheckBtn.classList.toggle('on',    !!runtime.morphSelfCheck && isMorphologyMode());
  if (dailyResetSwitch) dailyResetSwitch.classList.toggle('on', !!runtime.unspacedAutoResetEnabled);
  if (shuffleToggle)   shuffleToggle.setAttribute('aria-checked',   runtime.shuffled ? 'true' : 'false');
  if (requiredToggle)  requiredToggle.setAttribute('aria-checked',  runtime.requiredOnly ? 'true' : 'false');
  if (directionToggle) directionToggle.setAttribute('aria-checked', runtime.directionToGreek ? 'true' : 'false');
  if (spacedToggle)    spacedToggle.setAttribute('aria-checked',    runtime.spacedRepetition ? 'true' : 'false');
  if (hardReviewToggle) hardReviewToggle.setAttribute('aria-checked', runtime.hardVocabReviewMode ? 'true' : 'false');
  if (splitSelectionToggle) splitSelectionToggle.setAttribute('aria-checked', runtime.splitSelection ? 'true' : 'false');
  if (selfCheckToggle) selfCheckToggle.setAttribute('aria-checked', (runtime.morphSelfCheck && isMorphologyMode()) ? 'true' : 'false');
  if (dailyResetToggle) dailyResetToggle.setAttribute('aria-checked', runtime.unspacedAutoResetEnabled ? 'true' : 'false');

  if (directionToggle) {
    const directionLabel = directionToggle.querySelector('.toggle-text');
    if (directionLabel) {
      directionLabel.textContent = isMorphologyMode()
        ? 'English → Greek'
        : 'Eng → Gk';
    }
  }
  if (modeVocabBtn)    modeVocabBtn.classList.toggle('active', runtime.studyMode === 'vocab');
  if (modeMorphBtn)    modeMorphBtn.classList.toggle('active', runtime.studyMode === 'morph');
  if (modeReaderBtn)   modeReaderBtn.classList.toggle('active', runtime.studyMode === 'reader');
  if (modeShortcutVocabBtn) modeShortcutVocabBtn.classList.toggle('active', runtime.studyMode === 'vocab');
  if (modeShortcutMorphBtn) modeShortcutMorphBtn.classList.toggle('active', runtime.studyMode === 'morph');
  if (modeShortcutReaderBtn) modeShortcutReaderBtn.classList.toggle('active', runtime.studyMode === 'reader');
  syncThemeButtons();
  if (resetDeckBtn) {
    resetDeckBtn.textContent = runtime.spacedRepetition ? 'Reset spaced' : 'Reset unspaced';
    resetDeckBtn.title = runtime.spacedRepetition
      ? 'Choose to set every card due now or fully reset SRS progress for this deck'
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
  const navResetBtn = document.getElementById('navResetBtn');
  const directionToggle = document.getElementById('directionToggle');
  const requiredToggle = document.getElementById('requiredToggle');
  const hardReviewToggle = document.getElementById('hardReviewToggle');
  const splitSelectionToggle = document.getElementById('splitSelectionToggle');
  const selfCheckToggle = document.getElementById('selfCheckToggle');
  const shuffleToggle = document.getElementById('shuffleToggle');
  const spacedToggle = document.getElementById('spacedToggle');
  const dailyResetToggle = document.getElementById('unspacedDailyResetToggle');
  const modeGroup = document.querySelector('.mode-group[aria-label="Study mode"]');
  const cardArea = document.getElementById('cardArea');
  const reviewShell = document.querySelector('.review-shell');
  const cardMode = isCardStudyMode();
  const reviewDeckMode = isReviewDeckMode();

  if (controlsBar) controlsBar.style.display = 'flex';
  if (cardArea) cardArea.style.display = cardMode ? '' : 'none';
  if (reviewShell) reviewShell.style.display = reviewDeckMode ? '' : 'none';
  if (navRow) navRow.style.display = reviewDeckMode && runtime.selectedKeys.length ? 'flex' : 'none';
  if (markRow) markRow.style.display = reviewDeckMode && runtime.selectedKeys.length && !isMorphologyMode() ? 'flex' : 'none';
  if (fastForwardRow) fastForwardRow.style.display = reviewDeckMode && runtime.selectedKeys.length && runtime.spacedRepetition ? 'flex' : 'none';
  if (directionToggle) directionToggle.style.display = (runtime.studyMode === 'vocab' || runtime.studyMode === 'morph') ? 'flex' : 'none';
  if (requiredToggle) requiredToggle.style.display = runtime.studyMode === 'vocab' ? 'flex' : 'none';
  if (hardReviewToggle) hardReviewToggle.style.display = runtime.studyMode === 'vocab' ? 'flex' : 'none';
  if (splitSelectionToggle) splitSelectionToggle.style.display = canAccessGrammarUi() ? 'flex' : 'none';
  if (selfCheckToggle) selfCheckToggle.style.display = isMorphologyMode() && canAccessGrammarUi() ? 'flex' : 'none';
  if (shuffleToggle) shuffleToggle.style.display = reviewDeckMode ? 'flex' : 'none';
  if (spacedToggle) spacedToggle.style.display = reviewDeckMode ? 'flex' : 'none';
  if (dailyResetToggle) dailyResetToggle.style.display = (reviewDeckMode && !runtime.spacedRepetition && runtime.studyMode === 'vocab') ? 'flex' : 'none';
  if (modeGroup) modeGroup.style.display = canAccessGrammarUi() ? 'inline-flex' : 'none';
  if (!reviewDeckMode) return;
  const unspacedVocab = !runtime.spacedRepetition && !isMorphologyMode();
  const unspacedHistoryTop = unspacedVocab ? getUnspacedHistoryTopType() : null;
  const unspacedHasHistory = !!unspacedHistoryTop;
  if (prevBtn) {
    // Spaced/morph keep their dedicated Undo button. In unspaced vocab
    // Prev walks the history stack: each Next/Mark/Reshuffle pushed an
    // entry, and Prev pops one at a time. Label flips to "↶ Undo" when
    // the next pop will roll back a confidence-impacting mark, so the
    // user sees the warning at exactly that step.
    const atStart = !runtime.deck.length || runtime.currentIdx <= 0;
    const hidePrev = isMorphologyMode()
      || (runtime.spacedRepetition && !isMorphologyMode())
      || (unspacedVocab && atStart && !unspacedHasHistory);
    prevBtn.style.display = hidePrev ? 'none' : '';
    const prevDisabled = unspacedVocab ? (!unspacedHasHistory && atStart) : atStart;
    prevBtn.disabled = prevDisabled;
    prevBtn.classList.toggle('nav-disabled', prevDisabled);
    if (unspacedVocab) {
      prevBtn.textContent = unspacedHistoryTop === 'mark' ? '↶ Undo' : '← Prev';
    } else {
      prevBtn.textContent = '← Prev';
    }
  }
  if (undoBtn) {
    const morphUndoActive = isMorphologyMode() && runtime.morphAnswerState.answered && !!runtime.spacedUndoSnapshot;
    const vocabUndoActive = runtime.spacedRepetition && !isMorphologyMode() && !!runtime.spacedUndoSnapshot;
    // Unspaced now routes undo through the Prev button, so the separate
    // Undo control only shows for spaced/morph.
    undoBtn.style.display = (morphUndoActive || vocabUndoActive) ? '' : 'none';
  }
  if (navResetBtn) {
    // Unspaced vocab keeps the inline Reset visible at all times so the
    // user has a one-tap escape from the all-archived "Session Confirmed"
    // state without Next having to morph.
    navResetBtn.style.display = unspacedVocab && runtime.selectedKeys.length > 0 ? '' : 'none';
  }
  if (nextBtn) {
    if (isMorphologyMode()) {
      nextBtn.textContent = 'Next →';
      nextBtn.classList.remove('spaced-again', 'nav-next-as-reset');
    } else if (runtime.spacedRepetition) {
      nextBtn.textContent = 'Again →';
      nextBtn.classList.toggle('spaced-again', true);
      nextBtn.classList.remove('nav-next-as-reset');
    } else {
      nextBtn.textContent = 'Next →';
      nextBtn.classList.remove('spaced-again', 'nav-next-as-reset');
    }
  }

}

function ensureUsageStats(stats = runtime.appUsageStats) {
  const safe = sanitizeUsageStats(stats, MAX_STUDY_SESSION_HISTORY);
  if (stats !== safe) runtime.appUsageStats = safe;
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
    hasSelectedCards: runtime.selectedKeys.length > 0,
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
  if (!document.hidden && !runtime.appUsageStats.lastActiveAt) {
    runtime.appUsageStats.lastActiveAt = Date.now();
  }

  if (!runtime.usageVisibilityBound) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const now = Date.now();
        accumulateUsageTime(now);
        finalizeStudySession(now);
        runtime.appUsageStats.lastActiveAt = 0;
        updateUsageMeta();
        saveState();
      } else {
        runtime.appUsageStats.lastActiveAt = Date.now();
        updateUsageMeta();
        maybeAutoResetUnspacedArchivesAndRefresh();
      }
    });

    window.addEventListener('pagehide', () => {
      const now = Date.now();
      accumulateUsageTime(now);
      finalizeStudySession(now);
      runtime.appUsageStats.lastActiveAt = 0;
      saveState();
    });

    runtime.usageVisibilityBound = true;
  }

  if (!runtime.usageTickHandle) {
    runtime.usageTickHandle = window.setInterval(() => {
      if (document.hidden) return;
      const now = Date.now();
      const delta = accumulateUsageTime(now);
      const activeDelta = accumulateActiveStudyTime(now);
      if (delta > 0 || activeDelta > 0) {
        updateUsageMeta();
        if (isAnalyticsModalOpen()) renderAnalyticsOverlay();
        runtime.usageTickCounter += 1;
        if (runtime.usageTickCounter >= 4) {
          runtime.usageTickCounter = 0;
          saveState();
        }
      }
    }, 15000);
  }
}


// ── Unspaced cycle state helpers (state-coupled) ──

function resetUnspacedCycleState() {
  runtime.unspacedCycleState = {};
  runtime.unspacedDeferredIds = new Set();
  runtime.flipsSinceReshuffle = 0;
  runtime.lastPeriodicReshuffleAt = 0;
}

// Stamp the current archive day so subsequent auto-reset checks know the
// "current batch" started today. Called whenever an archive (Easy mark in
// unspaced vocab) is created.
function noteUnspacedArchiveActivity() {
  runtime.lastUnspacedArchiveDayKey = getUnspacedArchiveDayKey();
}

// Clears all unspaced 'known' marks across g2e and e2g when the local
// archive-day key has rolled past the 5 AM cutoff since the last archive
// activity. Morph marks are untouched. Returns true if anything was
// cleared so callers can rebuild the active deck.
function maybeAutoResetUnspacedArchives() {
  if (!runtime.unspacedAutoResetEnabled) return false;
  const todayKey = getUnspacedArchiveDayKey();
  const lastKey = runtime.lastUnspacedArchiveDayKey || '';
  if (!lastKey) {
    runtime.lastUnspacedArchiveDayKey = todayKey;
    return false;
  }
  if (lastKey === todayKey) return false;

  ensureDirectionalStores();
  let didClear = false;
  ['g2e', 'e2g'].forEach(dirKey => {
    const bucket = runtime.globalWordMarks[dirKey];
    if (!bucket) return;
    Object.keys(bucket).forEach(cardId => {
      if (bucket[cardId] === 'known') {
        delete bucket[cardId];
        didClear = true;
      }
    });
  });
  runtime.lastUnspacedArchiveDayKey = todayKey;
  runtime.marks = getDirectionalMarksStore();
  return didClear;
}

// Wrapper that runs the auto-reset and, if it actually cleared archives,
// rebuilds the active vocab unspaced deck + repaints so the freshly
// restored cards show up immediately.
function maybeAutoResetUnspacedArchivesAndRefresh() {
  const didClear = maybeAutoResetUnspacedArchives();
  if (!didClear) return;
  if (!runtime.selectedKeys.length) return;
  if (runtime.spacedRepetition || isMorphologyMode()) return;
  runtime.deck = buildStudyDeck(runtime.originalDeck);
  runtime.currentIdx = 0;
  runtime.isFlipped = false;
  resetMorphAnswerState();
  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function getUnspacedCycleEntry(cardId) {
  if (!runtime.unspacedCycleState[cardId] || typeof runtime.unspacedCycleState[cardId] !== 'object') {
    runtime.unspacedCycleState[cardId] = { wrongThisCycle: false, correctCount: 0, lastOutcome: null };
  }
  return runtime.unspacedCycleState[cardId];
}

function applyUnspacedSharedSchedule(card, outcome, _reviewedAt = Date.now()) {
  // Unspaced reviews update only the unspaced cycle bookkeeping. The spaced
  // SRS schedule (progress.dueAt / intervalDays) is intentionally NOT touched
  // here, so flipping into spaced-repetition mode later finds untouched
  // schedules that reflect only previous spaced reviews.
  const cycleEntry = getUnspacedCycleEntry(card.id);
  const normalizedOutcome = outcome === 'easy' ? 'easy' : outcome === 'pass' ? 'pass' : 'again';

  if (normalizedOutcome === 'again') {
    cycleEntry.wrongThisCycle = true;
    cycleEntry.lastOutcome = 'again';
    return;
  }

  cycleEntry.correctCount += 1;
  cycleEntry.lastOutcome = normalizedOutcome;
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

function advanceScheduledCards(cards = runtime.originalDeck, advanceMs = SRS_CYCLE_ADVANCE_MS) {
  const now = Date.now();
  (cards || []).forEach(card => {
    const progress = getWordProgress(card.id);
    if (progress.dueAt && progress.dueAt > now) {
      progress.dueAt = Math.max(now, progress.dueAt - advanceMs);
      progress.intervalDays = Math.max(0, (progress.dueAt - now) / SRS_DAY_MS);
    }
  });
}

// Read-only callers (deck building, review list, analytics, scheduling
// queries) far outnumber the handful that actually record progress. Only the
// latter pass { persist: true }; everyone else gets a throwaway default object
// and the store is never polluted with no-information entries — which is what
// kept bloating both the in-memory state and the saved payload.
function getWordProgress(cardId, { persist = false } = {}) {
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
  if (persist) progressStore[cardId] = fresh;
  return fresh;
}

function isCardDue(card) {
  if (!runtime.spacedRepetition) return true;
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
  // Clears both the single-level spaced/morph snapshot and the unspaced
  // history stack. The two share the same "the deck context just
  // changed, drop any pending undo" invalidation points (mode toggles,
  // deck rebuilds, resets, selection changes), so collapsing them into
  // one clear keeps every call site honest.
  runtime.spacedUndoSnapshot = null;
  runtime.unspacedHistory = [];
}

// Snapshot of everything markCard / applyUnspacedMark / a reshuffle can
// mutate. Used by both the single-shot spaced/morph undo and the
// multi-step unspaced history stack.
function buildUndoSnapshot(extra = {}) {
  return {
    selectedKeys: cloneForUndo(runtime.selectedKeys),
    currentSessionId: runtime.currentSession ? runtime.currentSession.id : null,
    studyMode: runtime.studyMode,
    directionToGreek: runtime.directionToGreek,
    requiredOnly: runtime.requiredOnly,
    shuffled: runtime.shuffled,
    spacedRepetition: runtime.spacedRepetition,
    currentIdx: runtime.currentIdx,
    activeDeckCount: runtime.activeDeckCount,
    isFlipped: runtime.isFlipped,
    unspacedPendingRecycle: runtime.unspacedPendingRecycle,
    unspacedRoundSize: runtime.unspacedRoundSize,
    unspacedRoundMarks: runtime.unspacedRoundMarks,
    unspacedCycleState: cloneForUndo(runtime.unspacedCycleState),
    lastUnspacedArchiveDayKey: runtime.lastUnspacedArchiveDayKey,
    morphAnswerState: cloneForUndo(runtime.morphAnswerState),
    morphPendingAdvance: runtime.morphPendingAdvance,
    deck: cloneForUndo(runtime.deck),
    originalDeck: cloneForUndo(runtime.originalDeck),
    marksStore: cloneForUndo(getDirectionalMarksStore()),
    progressStore: cloneForUndo(getDirectionalProgressStore()),
    appUsageStats: cloneForUndo(runtime.appUsageStats),
    appGamification: cloneForUndo(runtime.appGamification),
    ...extra
  };
}

// Restore runtime.* from a previously built snapshot. Returns false if
// the snapshot is incompatible with the current selection/mode (in
// which case the caller should discard it rather than apply).
function applyUndoSnapshot(snapshot) {
  if (!snapshot) return false;
  if (runtime.studyMode !== snapshot.studyMode) return false;
  if (runtime.directionToGreek !== snapshot.directionToGreek) return false;
  if (runtime.requiredOnly !== snapshot.requiredOnly) return false;
  if (runtime.shuffled !== snapshot.shuffled) return false;
  if (!isMorphologyMode() && runtime.spacedRepetition !== snapshot.spacedRepetition) return false;
  if (JSON.stringify(runtime.selectedKeys) !== JSON.stringify(snapshot.selectedKeys || [])) return false;
  if ((runtime.currentSession ? runtime.currentSession.id : null) !== (snapshot.currentSessionId || null)) return false;

  const marksStore = getDirectionalMarksStore();
  Object.keys(marksStore).forEach(key => delete marksStore[key]);
  Object.assign(marksStore, cloneForUndo(snapshot.marksStore) || {});

  const progressStore = getDirectionalProgressStore();
  Object.keys(progressStore).forEach(key => delete progressStore[key]);
  Object.assign(progressStore, cloneForUndo(snapshot.progressStore) || {});

  runtime.marks = marksStore;
  runtime.originalDeck = cloneForUndo(snapshot.originalDeck) || [];
  runtime.deck = cloneForUndo(snapshot.deck) || [];
  runtime.appUsageStats = ensureUsageStats(cloneForUndo(snapshot.appUsageStats));
  runtime.appGamification = sanitizeGamificationState(cloneForUndo(snapshot.appGamification));
  const restoredLevel = computeXpAndLevel(runtime.appUsageStats).currentLevel.level;
  if (!Number.isFinite(runtime.appGamification.lastCelebratedLevel) || runtime.appGamification.lastCelebratedLevel < 1 || runtime.appGamification.lastCelebratedLevel > restoredLevel) {
    runtime.appGamification.lastCelebratedLevel = restoredLevel;
  }
  // Reshuffle entries park the cursor at deck.length, so clamp to deck.length
  // (inclusive) rather than deck.length - 1.
  const maxIdx = runtime.deck.length;
  runtime.currentIdx = Math.max(0, Math.min(snapshot.currentIdx || 0, maxIdx));
  runtime.activeDeckCount = Math.max(0, snapshot.activeDeckCount || 0);
  runtime.isFlipped = !!snapshot.isFlipped;
  runtime.unspacedPendingRecycle = !!snapshot.unspacedPendingRecycle;
  if (Number.isFinite(snapshot.unspacedRoundSize)) runtime.unspacedRoundSize = snapshot.unspacedRoundSize;
  if (Number.isFinite(snapshot.unspacedRoundMarks)) runtime.unspacedRoundMarks = snapshot.unspacedRoundMarks;
  if (snapshot.unspacedCycleState) runtime.unspacedCycleState = cloneForUndo(snapshot.unspacedCycleState);
  if (typeof snapshot.lastUnspacedArchiveDayKey === 'string') runtime.lastUnspacedArchiveDayKey = snapshot.lastUnspacedArchiveDayKey;
  if (isMorphologyMode() && snapshot.morphAnswerState) {
    runtime.morphAnswerState = cloneForUndo(snapshot.morphAnswerState);
    runtime.morphPendingAdvance = !!snapshot.morphPendingAdvance;
  } else {
    resetMorphAnswerState();
  }
  return true;
}

function captureSpacedUndoSnapshot() {
  if (!runtime.selectedKeys.length || !runtime.deck[runtime.currentIdx]) {
    runtime.spacedUndoSnapshot = null;
    return;
  }
  if (!isMorphologyMode()) {
    if (!runtime.spacedRepetition || runtime.currentIdx >= runtime.activeDeckCount) {
      runtime.spacedUndoSnapshot = null;
      return;
    }
  }
  runtime.spacedUndoSnapshot = buildUndoSnapshot();
}

// Capacity cap on the unspaced history stack — full snapshots aren't
// tiny, and the user gets multi-step Prev without keeping every
// breadcrumb from a long session in memory.
const UNSPACED_HISTORY_MAX = 30;

// Push a snapshot tagged with the kind of action it's the inverse of.
// 'mark' entries roll back a confidence-impacting Hard/Uncertain/Easy
// (Prev label shows "↶ Undo"); 'next' entries roll back the neutral
// pass; 'reshuffle' entries roll back the end-of-deck shuffle.
function pushUnspacedHistory(entryType) {
  if (!Array.isArray(runtime.unspacedHistory)) runtime.unspacedHistory = [];
  if (!runtime.selectedKeys.length) return;
  // Reshuffles capture from the end-of-deck parked state, where
  // deck[currentIdx] is undefined; everything else needs a real card.
  if (entryType !== 'reshuffle' && (runtime.currentIdx >= runtime.deck.length || !runtime.deck[runtime.currentIdx])) return;

  const snapshot = buildUndoSnapshot({ entryType });
  runtime.unspacedHistory.push(snapshot);
  if (runtime.unspacedHistory.length > UNSPACED_HISTORY_MAX) {
    runtime.unspacedHistory.splice(0, runtime.unspacedHistory.length - UNSPACED_HISTORY_MAX);
  }
}

function restoreUnspacedHistoryStep() {
  if (!Array.isArray(runtime.unspacedHistory) || !runtime.unspacedHistory.length) return false;
  const snapshot = runtime.unspacedHistory.pop();
  const restored = applyUndoSnapshot(snapshot);
  if (!restored) {
    // Snapshot from a different mode/selection — discard the whole stack
    // rather than leaving incompatible entries to surface later.
    runtime.unspacedHistory = [];
    return false;
  }
  renderCard();
  renderReview();
  renderProgress();
  syncLayoutVisibility();
  saveState();
  return true;
}

function getUnspacedHistoryTopType() {
  if (!Array.isArray(runtime.unspacedHistory) || !runtime.unspacedHistory.length) return null;
  return runtime.unspacedHistory[runtime.unspacedHistory.length - 1].entryType || null;
}

function restoreSpacedUndo() {
  if (!runtime.spacedUndoSnapshot) return;
  const restored = applyUndoSnapshot(runtime.spacedUndoSnapshot);
  if (!restored) return;
  clearSpacedUndoSnapshot();
  renderCard();
  renderReview();
  renderProgress();
  syncLayoutVisibility();
  saveState();
}

function buildStudyDeck(cards, options = {}) {
  if (!runtime.spacedRepetition) {
    // Unspaced flip deck: keep the deck partitioned as [active..., archived...].
    // markCard's "move to end of active section" logic assumes that layout, and
    // it makes "Next" navigation a straight forward scan past archived cards.
    const active = cards.filter(card => runtime.marks[card.id] !== 'known');
    const known = cards.filter(card => runtime.marks[card.id] === 'known');
    runtime.activeDeckCount = active.length;
    const orderedActive = runtime.shuffled ? shuffleArray([...active]) : [...active];
    // Default: every fresh build starts a new round so the round counter
    // matches the deck we're about to show. Callers (notably restoreState)
    // that need to preserve mid-round bookkeeping pass preserveUnspacedRound.
    if (options.preserveUnspacedRound !== true) {
      runtime.unspacedRoundSize = orderedActive.length;
      runtime.unspacedRoundMarks = 0;
    }
    return [...orderedActive, ...known];
  }

  const forceShuffle = !!options.forceShuffle;
  let promotedNearCards = false;
  let dueCards = cards.filter(isCardDue);

  // Backstop: if nothing is due but cards are deferred within 1 hour,
  // promote them to due immediately so the user never hits a dead runtime.deck.
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

  // Preserve existing order of due cards already in the current runtime.deck;
  // append newly-eligible cards (including "(x) return to runtime.deck" and
  // time-promoted cards) at the back.
  const prevDueIds = new Set(
    (runtime.deck || []).slice(0, runtime.activeDeckCount || 0)
      .filter(card => card && dueCards.some(d => d.id === card.id))
      .map(card => card.id)
  );

  const existingInOrder = [];
  (runtime.deck || []).forEach(card => {
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
    // First build for this runtime.deck — apply shuffle preference if set.
    orderedDue = runtime.shuffled ? shuffleArray([...dueCards]) : sortCardsByDue(dueCards);
  } else {
    // Keep in-flight order stable; newly eligible cards go to the back.
    orderedDue = [...existingInOrder, ...newlyDue];
  }

  const orderedDeferred = sortCardsByDue(deferredCards);
  runtime.activeDeckCount = orderedDue.length;
  return [...orderedDue, ...orderedDeferred];
}

function recordStudyOutcome(cardId, outcome, reviewedAt = Date.now()) {
  const progress = getWordProgress(cardId, { persist: true });
  const isFirstConfirmation = !progress.firstConfirmedAt;
  const xpAward = computeCardXpAward(outcome, isFirstConfirmation, runtime.spacedRepetition);
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
  const progress = getWordProgress(cardId, { persist: true });
  const minimumDelayMs = getUncertainDelayMs(progress);
  const minimumDueAt = reviewedAt + minimumDelayMs;
  if (!progress.dueAt || progress.dueAt < minimumDueAt) {
    setProgressDelay(progress, minimumDelayMs, reviewedAt);
  }
  return progress;
}

function getDeckAggregateStats(cards = runtime.originalDeck) {
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
  runtime.marks = getDirectionalMarksStore();
}

function getDueCount(cards = runtime.originalDeck) {
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
  const card = runtime.deck[runtime.currentIdx];
  if (!card || runtime.morphAnswerState.answered) return;

  const reversed = reverseDisplayActive(card);
  const choices = reversed ? card.reverseChoices : card.choices;
  if (!Array.isArray(choices)) return;

  captureSpacedUndoSnapshot();

  const selected = choices[choiceIndex];
  const correctAnswer = reversed ? card.form : card.answer;
  const isCorrect = selected === correctAnswer;
  runtime.morphAnswerState = {
    answered: true,
    revealed: true,
    selfRated: true,
    selectedIndex: choiceIndex,
    isCorrect,
    skipped: false
  };

  if (runtime.spacedRepetition) {
    applySpacedReview(card, getMorphSpacedOutcome(card, isCorrect));
    runtime.morphPendingAdvance = true;
  } else {
    const mark = isCorrect ? 'known' : 'unsure';
    const reviewedAt = Date.now();
    recordStudyOutcome(card.id, isCorrect ? 'known' : 'review', reviewedAt);
    applyUnspacedSharedSchedule(card, isCorrect ? 'easy' : 'again', reviewedAt);
    getDirectionalMarksStore()[card.id] = mark;
    runtime.marks = getDirectionalMarksStore();
  }

  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function revealMorphologyAnswer() {
  if (!isMorphologyMode()) return;
  noteStudyInteraction();
  const card = runtime.deck[runtime.currentIdx];
  if (!card || runtime.morphAnswerState.revealed) return;
  runtime.morphAnswerState = {
    ...runtime.morphAnswerState,
    revealed: true
  };
  renderCard();
}

function rateMorphologySelfCheck(isCorrect) {
  if (!isMorphologyMode()) return;
  noteStudyInteraction();
  const card = runtime.deck[runtime.currentIdx];
  if (!card || !runtime.morphAnswerState.revealed || runtime.morphAnswerState.answered) return;

  captureSpacedUndoSnapshot();

  runtime.morphAnswerState = {
    answered: true,
    revealed: true,
    selfRated: true,
    selectedIndex: -1,
    isCorrect: !!isCorrect,
    skipped: false
  };

  if (runtime.spacedRepetition) {
    applySpacedReview(card, getMorphSpacedOutcome(card, isCorrect));
    runtime.morphPendingAdvance = true;
  } else {
    const mark = isCorrect ? 'known' : 'unsure';
    const reviewedAt = Date.now();
    recordStudyOutcome(card.id, isCorrect ? 'known' : 'review', reviewedAt);
    applyUnspacedSharedSchedule(card, isCorrect ? 'easy' : 'again', reviewedAt);
    getDirectionalMarksStore()[card.id] = mark;
    runtime.marks = getDirectionalMarksStore();
  }

  renderCard();
  renderProgress();
  renderReview();
  saveState();
}

function passMorphologyChoice() {
  if (!isMorphologyMode()) return;
  noteStudyInteraction();
  const card = runtime.deck[runtime.currentIdx];
  if (!card || runtime.morphAnswerState.answered) return;

  captureSpacedUndoSnapshot();

  runtime.morphAnswerState = {
    answered: true,
    revealed: true,
    selfRated: true,
    selectedIndex: -1,
    isCorrect: false,
    skipped: true
  };

  if (runtime.spacedRepetition) {
    applySpacedReview(card, 'pass');
    runtime.morphPendingAdvance = true;
  } else {
    const reviewedAt = Date.now();
    recordStudyOutcome(card.id, 'review', reviewedAt);
    applyUnspacedSharedSchedule(card, 'again', reviewedAt);
    getDirectionalMarksStore()[card.id] = 'unsure';
    runtime.marks = getDirectionalMarksStore();
  }

  renderCard();
  renderProgress();
  renderReview();
  saveState();
}



function getKnownCount() {
  return runtime.originalDeck.filter(card => runtime.marks[card.id] === 'known').length;
}

function getHighConfidenceCount() {
  return runtime.originalDeck.filter(card => {
    const pct = getConfidencePct(getWordProgress(card.id));
    return pct !== null && pct > 75;
  }).length;
}

function getRemainingCards() {
  if (runtime.spacedRepetition) {
    return runtime.deck.slice(0, runtime.activeDeckCount);
  }
  return runtime.deck.filter(card => runtime.marks[card.id] !== 'known');
}

function moveCardToBackOfActivePile(card) {
  if (!card) return false;
  const directionalMarks = getDirectionalMarksStore();

  const currentCardId = runtime.deck[runtime.currentIdx]?.id || null;
  directionalMarks[card.id] = 'unsure';
  runtime.marks = directionalMarks;

  runtime.deck = runtime.deck.filter(candidate => candidate.id !== card.id);
  const splitAt = runtime.deck.findIndex(candidate => runtime.marks[candidate.id] === 'known');
  const insertAt = splitAt === -1 ? runtime.deck.length : splitAt;
  runtime.deck.splice(insertAt, 0, card);

  runtime.activeDeckCount = runtime.originalDeck.filter(candidate => runtime.marks[candidate.id] !== 'known').length;
  if (currentCardId) {
    const restoredIdx = runtime.deck.findIndex(candidate => candidate.id === currentCardId);
    if (restoredIdx >= 0) runtime.currentIdx = restoredIdx;
  }
  runtime.unspacedPendingRecycle = false;
  return true;
}

// Periodic reshuffle is throttled to once per hour. The old behaviour
// (every 10 flips) shuffled cards out from under the learner mid-session,
// which made it hard to predict when an "again" card would resurface. The
// hourly cap means within a single study session the order stays stable
// after the initial shuffle.
const PERIODIC_RESHUFFLE_MIN_MS = 60 * 60 * 1000;

function maybePeriodicReshuffle() {
  if (!runtime.shuffled) return;
  runtime.flipsSinceReshuffle++;
  const now = Date.now();
  const lastAt = Number(runtime.lastPeriodicReshuffleAt) || 0;
  // Seed lastPeriodicReshuffleAt on the first navigation so the first hour
  // measures from when the user actually started navigating, not from the
  // epoch.
  if (!lastAt) {
    runtime.lastPeriodicReshuffleAt = now;
    return;
  }
  if (now - lastAt < PERIODIC_RESHUFFLE_MIN_MS) return;
  runtime.lastPeriodicReshuffleAt = now;
  runtime.flipsSinceReshuffle = 0;
  reshuffleUpcomingCards();
}

// Per-flip ~1/50 (2%) chance to bring one high-confidence (>75%) deferred card
// back into the active pile. Skipped when shuffle is off or in morphology mode.
function maybeReturnConfirmedDeferredCard() {
  if (!runtime.spacedRepetition || !runtime.shuffled || isMorphologyMode()) return false;
  if (CONFIRMED_CARD_RANDOM_RETURN_FLIP_ODDS <= 0) return false;
  if (Math.random() >= 1 / CONFIRMED_CARD_RANDOM_RETURN_FLIP_ODDS) return false;

  const eligible = (runtime.originalDeck || []).filter(card => {
    if (isCardDue(card)) return false;
    const pct = getConfidencePct(getWordProgress(card.id));
    return pct !== null && pct > 75;
  });
  if (!eligible.length) return false;

  const pick = eligible[Math.floor(Math.random() * eligible.length)];
  getWordProgress(pick.id).dueAt = Date.now();
  runtime.deck = buildStudyDeck(runtime.originalDeck);
  return true;
}

function reshuffleUpcomingCards() {
  const start = runtime.currentIdx + 1;
  // In spaced mode keep deferred (not-yet-due) cards in their dueAt order at
  // the tail; only reshuffle the active (due) portion ahead of runtime.currentIdx.
  const end = runtime.spacedRepetition
    ? Math.min(runtime.activeDeckCount, runtime.deck.length)
    : runtime.deck.length;
  if (start >= end) return;
  const upcoming = [];
  const pinned = [];
  for (let i = start; i < end; i++) {
    const id = runtime.deck[i].id;
    if (runtime.marks[id] === 'known' || runtime.unspacedDeferredIds.has(id)) pinned.push(runtime.deck[i]);
    else upcoming.push(runtime.deck[i]);
  }
  if (upcoming.length < 2) return;
  const tail = runtime.deck.slice(end);
  runtime.deck = [...runtime.deck.slice(0, start), ...shuffleArray(upcoming), ...pinned, ...tail];
}

function maybeReturnKnownCardToActivePile() {
  if (runtime.spacedRepetition || isMorphologyMode() || KNOWN_CARD_RANDOM_RETURN_FLIP_ODDS <= 0) return false;
  if (!runtime.originalDeck.length || runtime.currentIdx >= runtime.deck.length) return false;

  const currentCardId = runtime.deck[runtime.currentIdx]?.id || null;
  const knownCards = runtime.originalDeck.filter(card => card.id !== currentCardId && runtime.marks[card.id] === 'known');
  if (!knownCards.length) return false;

  const returnChance = 1 / KNOWN_CARD_RANDOM_RETURN_FLIP_ODDS;
  if (Math.random() >= returnChance) return false;

  const card = knownCards[Math.floor(Math.random() * knownCards.length)];
  return moveCardToBackOfActivePile(card);
}


// Save/restore + JSON export/import + Transfer modal live in js/state/persistence.js

function startNextCycle(mode = 'remaining') {
  runtime.unspacedDeferredIds = new Set();
  runtime.flipsSinceReshuffle = 0;
  // A new cycle is a fresh shuffle anchor — reset the hourly timer so the
  // next periodic reshuffle counts from now.
  runtime.lastPeriodicReshuffleAt = Date.now();
  if (mode === 'full') {
    const directionalMarks = getDirectionalMarksStore();
    (runtime.originalDeck || []).forEach(card => {
      delete directionalMarks[card.id];
    });
    runtime.marks = directionalMarks;
    const fullDeck = shuffleArray([...(runtime.originalDeck || [])]);
    runtime.deck = fullDeck;
    runtime.currentIdx = fullDeck.length ? 0 : runtime.deck.length;
  } else {
    const remaining = shuffleArray([...getRemainingCards()]);
    const known = (runtime.originalDeck || []).filter(card => runtime.marks[card.id] === 'known');
    runtime.deck = [...remaining, ...known];
    runtime.currentIdx = remaining.length ? 0 : runtime.deck.length;
  }
  resetUnspacedCycleState();
  runtime.unspacedPendingRecycle = false;
  saveState();
}

// Onclick target for the Next button. Defers to navigate(1), which detects
// the "deck fully archived" case in unspaced vocab mode and re-routes the
// press to a no-confirm reset (the button's label morphs to "↻ Reset" via
// syncLayoutVisibility so the affordance matches the behaviour).
function handleNavNext() {
  navigate(1);
}

function resetStudyState() {
  runtime.marks = getDirectionalMarksStore();
  runtime.currentIdx = 0;
  runtime.activeDeckCount = runtime.spacedRepetition ? getDueCount(runtime.originalDeck) : runtime.originalDeck.filter(card => runtime.marks[card.id] !== 'known').length;
  resetUnspacedCycleState();
  runtime.unspacedPendingRecycle = false;
  runtime.isFlipped = false;
}

// Study Selector builders + toggle/deselect/load flow live in js/ui/selectors.js
// Reader UI (drills + verses) lives in js/ui/reader.js; configured at module-top above.
// ═══════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════
// renderCard and flipCard live in js/ui/render.js

// ═══════════════════════════════════════════════════════
//  NAVIGATE + MARK
// ═══════════════════════════════════════════════════════
// Navigation, marking, mode/profile setters, toggles and resets live in js/ui/navigation.js
// ═══════════════════════════════════════════════════════
//  PROGRESS + REVIEW
// ═══════════════════════════════════════════════════════
// Progress bar, Review panel, returnSeenCardToDeck live in js/ui/progress.js

// Modal/overlay control (disclaimer, what's new, study selector, shortcuts,
// analytics open/close, startStudying) lives in js/ui/modals.js


// Touch-safe tap bridge for iOS/pointer quirks lives in js/ui/touchTapBridge.js

// Pure SVG/HTML chart builders and series helpers now live in js/ui/charts.js

// Analytics overlay (renderAnalyticsOverlay + all its compute/build helpers,
// plus the celebrate-on-level-up plumbing) lives in js/ui/analytics.js

installKeyboardShortcuts({
  isAnalyticsModalOpen, closeAnalyticsOverlay,
  isStudySelectorOpen, closeStudySelector,
  isShortcutsModalOpen, closeShortcutsModal,
  isWhatsNewV1_1ModalOpen, closeWhatsNewV1_1Modal,
  isDisclaimerModalOpen, isTransferModalOpen,
  isReviewDeckMode,
  getSelectedKeys: () => runtime.selectedKeys,
  isMorphologyMode,
  navigate, answerMorphologyChoice, passMorphologyChoice, flipCard, markCard,
  restoreSpacedUndo,
  getMorphAnswerState: () => runtime.morphAnswerState,
  getSpacedUndoSnapshot: () => runtime.spacedUndoSnapshot
});

// ═══════════════════════════════════════════════════════
//  GLOBAL EXPORTS — needed for HTML onclick handlers
//  Export these BEFORE startup runs, so one later init error does not
//  leave the page rendered-but-unclickable.
// ═══════════════════════════════════════════════════════
const GLOBAL_CLICK_HANDLERS = {
  flipCard, navigate, markCard, handleNavNext, answerMorphologyChoice,
  revealMorphologyAnswer, rateMorphologySelfCheck, passMorphologyChoice, returnSeenCardToDeck,
  closeAnalyticsOverlay, closeTransferModal, exportProgressJson,
  closeShortcutsModal, closeStudySelector,
  deselectAllChapters, deselectAllSupplementals, deselectAllAdvanced, deselectAll,
  handleConsentAction, handleTransferPrimaryAction, handleTransferSecondaryAction,
  openShortcutsModal, openStudySelector,
  openAnalyticsOverlay, resetAllStats, resetCurrentDeck, resetRequiredOnly,
  closeResetSpacedModal, confirmResetSpacedTimingOnly, confirmResetSpacedProgress,
  closeResetUnspacedModal, confirmResetUnspacedMarks,
  openResetStatsModal, closeResetStatsModal,
  confirmResetStatsKeepSettings, confirmResetToStart,
  setReviewSortMode,
  reshuffleEligible,
  fastForwardOneDay, fastForwardOneWeek,
  restoreSpacedUndo, setAppProfile, setStudyMode, setThemeMode, setFontFamily, setTextSize,
  showDisclaimerModal, startStudying, toggleDirection, toggleMorphSelfCheck,
  toggleRequiredOnly, toggleHardVocabReview, toggleShuffle, toggleSpacedRepetition, toggleSplitSelection, toggleUnspacedDailyReset, triggerImportProgress,
  openReaderTab, selectReaderDrillChoice, advanceReaderDrill,
  closeWhatsNewV1_1Modal
};
if (typeof globalThis !== 'undefined') Object.assign(globalThis, GLOBAL_CLICK_HANDLERS);
if (typeof window !== 'undefined' && window !== globalThis) Object.assign(window, GLOBAL_CLICK_HANDLERS);

initializeThemeMode();
initializeFontFamily();
initializeTextSize();
// Initial build with default state (needed so restoreState can find DOM elements)
buildSessions();
buildChapterSelector();
buildSupplementalSelector();
buildAdvancedSelector();
if (!restoreState()) {
  syncToggleButtons(); // reflect default controls on load
}
// Rebuild after restore: runtime.appProfile may have changed, affecting grammar summary text
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
  if (runtime.selectedKeys.length && runtime.selectedKeys.some(key => window.SETS?.[key]?.type === 'other')) {
    const keysToLoad = runtime.currentSession ? expandSessionSets(runtime.currentSession) : runtime.selectedKeys;
    loadDeckFromKeys(keysToLoad, runtime.currentSession ? runtime.currentSession.id : null);
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
installClickShield();

// Prevent mobile double-tap zoom on interactive controls
function preventDoubleTapZoom(el) {
  let lastTouchEnd = 0;
  el.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
  }, false);
}

['shuffleToggle','requiredToggle','directionToggle','spacedToggle','splitSelectionToggle','selfCheckToggle','unspacedDailyResetToggle','modeVocabBtn','modeMorphBtn','modeReaderBtn','modeShortcutVocabBtn','modeShortcutMorphBtn','modeShortcutReaderBtn','themeSystemBtn','themeDarkBtn','themeLightBtn'].forEach(id => {
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
