// Navigation + marking + study-mode toggles.
//
// navigate(dir), markCard(outcome), setStudyMode, setAppProfile and all the
// toggles (shuffle/required/direction/spaced/morph self-check) live here.
// Also reshuffleEligible, fastForward day/week, resetCurrentDeck,
// resetAllStats. Reads/writes runtime state directly; host callbacks cover
// the SRS scheduler, deck builder, study-state primitives, and the
// directional-store helpers that still live in main.js.

import { runtime } from '../state/runtime.js';
import { shuffleArray } from '../utils/helpers.js';
import { SRS_DAY_MS, SRS_CYCLE_ADVANCE_MS } from '../domain/srs/constants.js';
import { expandSessionSets } from '../domain/deck/ordering.js';
import { sanitizeGamificationState } from '../state/store.js';
import { renderCard } from './render.js';
import { renderProgress, renderReview } from './progress.js';
import {
  loadDeckFromKeys,
  buildSessions,
  buildChapterSelector,
  buildSupplementalSelector,
  buildAdvancedSelector
} from './selectors.js';

let host = {
  noteStudyInteraction: () => {},
  isMorphologyMode: () => false,
  isReaderMode: () => false,
  normalizeStudyMode: (m) => m,
  resetMorphAnswerState: () => {},
  ensureDirectionalStores: () => {},
  getDirectionalMarksStore: () => ({}),
  getDirectionalProgressStore: () => ({}),
  syncToggleButtons: () => {},
  startNextCycle: () => {},
  getKnownCount: () => 0,
  advanceScheduledCards: () => {},
  buildStudyDeck: () => [],
  captureSpacedUndoSnapshot: () => {},
  applySpacedReview: () => {},
  clearSpacedUndoSnapshot: () => {},
  clearSavedState: () => {},
  maybeReturnConfirmedDeferredCard: () => {},
  maybePeriodicReshuffle: () => {},
  recordStudyOutcome: () => {},
  applyUnspacedSharedSchedule: () => {},
  getRemainingCards: () => [],
  resetUnspacedCycleState: () => {},
  saveCurrentDeckStateToBank: () => {},
  saveState: () => {},
  renderReaderModule: () => {},
  getDeckStateKey: () => ''
};

export function configureNavigation(deps) {
  host = { ...host, ...deps };
}

export function navigate(dir, options = {}) {
  if (!runtime.deck.length) return;
  host.noteStudyInteraction();

  if (dir < 0) {
    runtime.currentIdx = Math.max(0, runtime.currentIdx - 1);
    host.resetMorphAnswerState();
    renderCard();
    return;
  }

  if (!runtime.spacedRepetition && runtime.currentIdx >= runtime.deck.length) {
    if (runtime.unspacedPendingRecycle) {
      host.startNextCycle('remaining');
      host.resetMorphAnswerState();
      renderCard();
      renderReview();
      renderProgress();
      host.saveState();
    } else if (host.getKnownCount() === runtime.originalDeck.length) {
      host.startNextCycle('full');
      host.resetMorphAnswerState();
      renderCard();
      renderReview();
      renderProgress();
      host.saveState();
    }
    return;
  }

  if (runtime.spacedRepetition && runtime.currentIdx >= runtime.activeDeckCount) {
    host.advanceScheduledCards(runtime.originalDeck, SRS_CYCLE_ADVANCE_MS);
    runtime.deck = host.buildStudyDeck(runtime.originalDeck);
    runtime.currentIdx = 0;
    host.resetMorphAnswerState();
    renderCard();
    renderReview();
    renderProgress();
    host.saveState();
    return;
  }

  if (runtime.spacedRepetition && runtime.currentIdx < runtime.activeDeckCount && !options.skipAutoReview && !host.isMorphologyMode()) {
    host.captureSpacedUndoSnapshot();
    host.applySpacedReview(runtime.deck[runtime.currentIdx], 'again');
    runtime.deck = host.buildStudyDeck(runtime.originalDeck);
  }

  if (runtime.spacedRepetition) {
    if (host.isMorphologyMode()) {
      if (runtime.morphPendingAdvance) {
        runtime.deck = host.buildStudyDeck(runtime.originalDeck);
        runtime.currentIdx = Math.min(runtime.currentIdx, runtime.activeDeckCount);
      } else {
        runtime.currentIdx = Math.min(runtime.currentIdx + 1, runtime.activeDeckCount);
      }
      host.clearSpacedUndoSnapshot();
    } else {
      runtime.currentIdx = Math.min(runtime.currentIdx, runtime.activeDeckCount);
      host.maybeReturnConfirmedDeferredCard();
      host.maybePeriodicReshuffle();
    }
    host.resetMorphAnswerState();
    renderCard();
    renderReview();
    renderProgress();
    host.saveState();
    return;
  }

  if (host.isMorphologyMode()) {
    const nextIdx = runtime.currentIdx + 1;
    if (nextIdx >= runtime.deck.length) {
      if (host.getKnownCount() === runtime.originalDeck.length) {
        runtime.currentIdx = runtime.deck.length;
        runtime.unspacedPendingRecycle = false;
      } else {
        runtime.currentIdx = runtime.deck.length;
        runtime.unspacedPendingRecycle = true;
      }
    } else {
      runtime.currentIdx = nextIdx;
      runtime.unspacedPendingRecycle = false;
    }
    host.clearSpacedUndoSnapshot();
    host.resetMorphAnswerState();
    renderCard();
    renderReview();
    renderProgress();
    host.saveState();
    return;
  }

  for (let i = runtime.currentIdx + 1; i < runtime.deck.length; i++) {
    if (runtime.marks[runtime.deck[i].id] !== 'known' && !runtime.unspacedDeferredIds.has(runtime.deck[i].id)) {
      runtime.currentIdx = i;
      host.maybePeriodicReshuffle();
      renderCard();
      return;
    }
  }

  if (host.getKnownCount() === runtime.originalDeck.length && runtime.unspacedDeferredIds.size === 0) {
    runtime.currentIdx = runtime.deck.length;
    runtime.unspacedPendingRecycle = false;
  } else {
    runtime.currentIdx = runtime.deck.length;
    runtime.unspacedPendingRecycle = true;
  }

  host.resetMorphAnswerState();
  renderCard();
}

export function markCard(outcome) {
  // outcome: 'again' | 'pass' | 'easy'
  if (host.isMorphologyMode()) return;
  host.noteStudyInteraction();
  if ((!runtime.spacedRepetition && runtime.currentIdx >= runtime.deck.length) || (runtime.spacedRepetition && runtime.currentIdx >= runtime.activeDeckCount)) return;
  const currentCard = runtime.deck[runtime.currentIdx];
  if (runtime.spacedRepetition) {
    host.captureSpacedUndoSnapshot();
    host.applySpacedReview(currentCard, outcome);
    runtime.deck = host.buildStudyDeck(runtime.originalDeck);
    if (runtime.activeDeckCount <= 0) {
      runtime.currentIdx = runtime.activeDeckCount;
      host.resetMorphAnswerState();
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
    host.recordStudyOutcome(currentCard.id, recordedOutcome, reviewedAt);
    host.applyUnspacedSharedSchedule(currentCard, outcome, reviewedAt);
    host.getDirectionalMarksStore()[currentCard.id] = mark;
    runtime.marks = host.getDirectionalMarksStore();

    if (outcome === 'again') {
      // Remove from current position; remaining cards shift down by 1,
      // so currentIdx now points to what was the next card.
      const cardToReturn = currentCard;
      runtime.deck.splice(runtime.currentIdx, 1);
      // Find the last non-known, non-deferred card that comes after currentIdx.
      let lastActiveIdx = -1;
      for (let i = runtime.currentIdx; i < runtime.deck.length; i++) {
        if (runtime.marks[runtime.deck[i].id] !== 'known' && !runtime.unspacedDeferredIds.has(runtime.deck[i].id)) lastActiveIdx = i;
      }
      runtime.deck.splice(lastActiveIdx >= 0 ? lastActiveIdx + 1 : runtime.deck.length, 0, cardToReturn);
      // currentIdx already points to the correct next card (or loops if it was the last).
      renderCard();
    } else {
      if (outcome === 'pass') runtime.unspacedDeferredIds.add(currentCard.id);
      navigate(1);
    }
  }
  renderReview();
  renderProgress();
  host.saveState();
}

export function setStudyMode(mode) {
  const nextMode = host.normalizeStudyMode(mode);
  if (runtime.studyMode === nextMode) return;

  host.saveCurrentDeckStateToBank();
  runtime.studyMode = nextMode;
  host.clearSpacedUndoSnapshot();
  host.resetMorphAnswerState();
  host.ensureDirectionalStores();
  runtime.marks = host.getDirectionalMarksStore();
  host.syncToggleButtons();

  if (host.isReaderMode()) {
    host.renderReaderModule();
    renderProgress();
    host.saveState();
    return;
  }

  if (!runtime.selectedKeys.length) {
    host.saveState();
    renderCard();
    renderProgress();
    renderReview();
    return;
  }

  const keysToLoad = runtime.currentSession ? expandSessionSets(runtime.currentSession) : runtime.selectedKeys;
  loadDeckFromKeys(keysToLoad, runtime.currentSession ? runtime.currentSession.id : null);
}

export function setAppProfile(profile) {
  const nextProfile = 'vocab_grammar';
  if (runtime.appProfile === nextProfile) return;

  host.saveCurrentDeckStateToBank();
  runtime.appProfile = nextProfile;
  host.clearSpacedUndoSnapshot();

  host.ensureDirectionalStores();
  runtime.marks = host.getDirectionalMarksStore();
  buildSessions();
  buildChapterSelector();
  buildSupplementalSelector();
  buildAdvancedSelector();
  host.syncToggleButtons();

  if (!runtime.selectedKeys.length) {
    renderCard();
    renderProgress();
    renderReview();
    host.saveState();
    return;
  }

  const keysToLoad = runtime.currentSession ? expandSessionSets(runtime.currentSession) : runtime.selectedKeys;
  loadDeckFromKeys(keysToLoad, runtime.currentSession ? runtime.currentSession.id : null);
}

export function toggleMorphSelfCheck() {
  if (!host.isMorphologyMode()) return;
  runtime.morphSelfCheck = !runtime.morphSelfCheck;
  host.resetMorphAnswerState();
  host.syncToggleButtons();
  renderCard();
  host.saveState();
}

export function toggleShuffle() {
  if (host.isReaderMode()) return;
  runtime.shuffled = !runtime.shuffled;
  runtime.flipsSinceReshuffle = 0;
  host.syncToggleButtons();

  if (runtime.spacedRepetition) {
    runtime.deck = host.buildStudyDeck(runtime.originalDeck, { forceShuffle: runtime.shuffled });
    runtime.currentIdx = Math.min(runtime.currentIdx, runtime.activeDeckCount);
  } else {
    const activeCards = host.getRemainingCards();
    const knownCards = runtime.deck.filter(card => runtime.marks[card.id] === 'known');
    runtime.deck = runtime.shuffled ? [...shuffleArray([...activeCards]), ...knownCards] : [...activeCards, ...knownCards];

    if (runtime.currentIdx >= activeCards.length) {
      runtime.currentIdx = activeCards.length ? 0 : runtime.deck.length;
    }
  }

  runtime.isFlipped = false;
  renderCard();
  renderProgress();
  renderReview();
  host.saveState();
}

export function toggleRequiredOnly() {
  runtime.requiredOnly = !runtime.requiredOnly;
  host.syncToggleButtons();
  if (!runtime.selectedKeys.length) {
    host.saveState();
    return;
  }
  const keysToLoad = runtime.currentSession ? expandSessionSets(runtime.currentSession) : runtime.selectedKeys;
  loadDeckFromKeys(keysToLoad, runtime.currentSession ? runtime.currentSession.id : null);
}

export function toggleDirection() {
  runtime.directionToGreek = !runtime.directionToGreek;
  host.clearSpacedUndoSnapshot();
  host.ensureDirectionalStores();
  runtime.marks = host.getDirectionalMarksStore();
  host.resetMorphAnswerState();
  host.syncToggleButtons();
  if (runtime.selectedKeys.length) {
    const keysToLoad = runtime.currentSession ? expandSessionSets(runtime.currentSession) : runtime.selectedKeys;
    loadDeckFromKeys(keysToLoad, runtime.currentSession ? runtime.currentSession.id : null);
    return;
  }
  runtime.isFlipped = false;
  renderCard();
  renderProgress();
  renderReview();
  host.saveState();
}

export function toggleSpacedRepetition() {
  if (host.isReaderMode()) return;
  runtime.spacedRepetition = !runtime.spacedRepetition;
  host.clearSpacedUndoSnapshot();
  host.resetUnspacedCycleState();
  host.syncToggleButtons();
  if (!runtime.selectedKeys.length) {
    host.saveState();
    return;
  }
  runtime.deck = host.buildStudyDeck(runtime.originalDeck);
  runtime.currentIdx = 0;
  host.resetMorphAnswerState();
  runtime.isFlipped = false;
  renderCard();
  renderProgress();
  renderReview();
  host.saveState();
}

export function reshuffleEligible() {
  if (!runtime.selectedKeys.length) return;

  if (runtime.spacedRepetition) {
    // Shuffle only currently-eligible (due) cards. SRS progress and
    // scheduled-ahead deferrals are left untouched.
    runtime.deck = host.buildStudyDeck(runtime.originalDeck, { forceShuffle: true });
    runtime.currentIdx = runtime.activeDeckCount ? 0 : runtime.currentIdx;
  } else {
    // Non-spaced: shuffle the still-active (not-yet-known) portion only;
    // known cards stay pinned to the end of the cycle.
    const activeCards = host.getRemainingCards();
    const knownCards = runtime.deck.filter(card => runtime.marks[card.id] === 'known');
    runtime.deck = [...shuffleArray([...activeCards]), ...knownCards];
    runtime.currentIdx = activeCards.length ? 0 : runtime.deck.length;
  }

  runtime.isFlipped = false;
  renderCard();
  renderProgress();
  renderReview();
  host.saveState();
}

function fastForwardScheduling(advanceMs) {
  if (!runtime.spacedRepetition || !runtime.originalDeck.length) return;
  host.advanceScheduledCards(runtime.originalDeck, advanceMs);
  runtime.deck = host.buildStudyDeck(runtime.originalDeck);
  runtime.currentIdx = 0;
  runtime.isFlipped = false;
  host.resetMorphAnswerState();
  renderCard();
  renderProgress();
  renderReview();
  host.saveState();
}

export function fastForwardOneDay() {
  fastForwardScheduling(SRS_DAY_MS);
}

export function fastForwardOneWeek() {
  fastForwardScheduling(7 * SRS_DAY_MS);
}

export function resetCurrentDeck() {
  if (!runtime.selectedKeys.length) {
    host.clearSpacedUndoSnapshot();
    host.clearSavedState();
    return;
  }

  if (runtime.spacedRepetition) {
    openResetSpacedModal();
    return;
  }

  const confirmed = window.confirm(
    'Reset unspaced marks for this deck only? This keeps your spaced-review scheduling and intervals.'
  );
  if (!confirmed) return;

  host.clearSpacedUndoSnapshot();
  performUnspacedDeckReset();
}

function performUnspacedDeckReset() {
  const deckKey = host.getDeckStateKey(runtime.selectedKeys, runtime.requiredOnly, runtime.spacedRepetition);
  delete runtime.deckStates[deckKey];
  const directionalMarks = host.getDirectionalMarksStore();

  runtime.originalDeck.forEach(card => {
    delete directionalMarks[card.id];
  });

  runtime.marks = directionalMarks;
  host.resetUnspacedCycleState();
  runtime.currentIdx = 0;
  runtime.isFlipped = false;
  host.resetMorphAnswerState();
  runtime.deck = [];
  runtime.activeDeckCount = 0;
  runtime.deck = host.buildStudyDeck(runtime.originalDeck);
  renderCard();
  renderProgress();
  renderReview();
  host.saveState();
}

function performSpacedProgressReset() {
  const deckKey = host.getDeckStateKey(runtime.selectedKeys, runtime.requiredOnly, runtime.spacedRepetition);
  delete runtime.deckStates[deckKey];
  const directionalProgress = host.getDirectionalProgressStore();

  runtime.originalDeck.forEach(card => {
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

  runtime.marks = host.getDirectionalMarksStore();
  host.resetUnspacedCycleState();
  runtime.currentIdx = 0;
  runtime.isFlipped = false;
  host.resetMorphAnswerState();
  runtime.deck = [];
  runtime.activeDeckCount = 0;
  runtime.deck = host.buildStudyDeck(runtime.originalDeck);
  renderCard();
  renderProgress();
  renderReview();
  host.saveState();
}

function performSpacedTimingReset() {
  const directionalProgress = host.getDirectionalProgressStore();

  runtime.originalDeck.forEach(card => {
    const p = directionalProgress[card.id];
    if (p && typeof p === 'object') {
      p.dueAt = 0;
      p.intervalDays = 0;
      // streak, easyStreak, srsStage, ease, lastEasyIntervalDays,
      // confidence, confidenceHistory intentionally kept
    }
  });

  runtime.currentIdx = 0;
  runtime.isFlipped = false;
  host.resetMorphAnswerState();
  runtime.deck = host.buildStudyDeck(runtime.originalDeck);
  renderCard();
  renderProgress();
  renderReview();
  host.saveState();
}

function openResetSpacedModal() {
  const overlay = document.getElementById('resetSpacedOverlay');
  if (!overlay) {
    // Fall back to legacy confirm if the modal markup isn't present.
    if (window.confirm('Reset spaced-review scheduling for this deck only? This keeps your unspaced marks and pass history.')) {
      host.clearSpacedUndoSnapshot();
      performSpacedProgressReset();
    }
    return;
  }
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

export function closeResetSpacedModal() {
  const overlay = document.getElementById('resetSpacedOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  // Match the behavior of the other modal close handlers: only drop
  // modal-open when no other overlay is currently visible.
  const anyOtherOpen = document.querySelector('.consent-overlay.show');
  if (!anyOtherOpen) document.body.classList.remove('modal-open');
}

export function confirmResetSpacedTimingOnly() {
  closeResetSpacedModal();
  if (!runtime.selectedKeys.length || !runtime.spacedRepetition) return;
  host.clearSpacedUndoSnapshot();
  performSpacedTimingReset();
}

export function confirmResetSpacedProgress() {
  closeResetSpacedModal();
  if (!runtime.selectedKeys.length || !runtime.spacedRepetition) return;
  host.clearSpacedUndoSnapshot();
  performSpacedProgressReset();
}

export function resetAllStats() {
  host.clearSpacedUndoSnapshot();
  const confirmed = window.confirm('Reset all saved study stats, marks, and spaced-review scheduling for both directions?');
  if (!confirmed) return;

  runtime.globalWordMarks = { g2e: {}, e2g: {}, morph: {} };
  runtime.globalWordProgress = { g2e: {}, e2g: {}, morph: {} };
  runtime.deckStates = {};
  runtime.appUsageStats = {
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
  runtime.appGamification = sanitizeGamificationState({});
  host.ensureDirectionalStores();
  host.resetUnspacedCycleState();
  runtime.marks = host.getDirectionalMarksStore();

  if (runtime.selectedKeys.length) {
    runtime.currentIdx = 0;
    runtime.isFlipped = false;
    runtime.deck = [];
    runtime.activeDeckCount = 0;
    runtime.deck = host.buildStudyDeck(runtime.originalDeck);
    renderCard();
    renderProgress();
    renderReview();
  } else {
    renderReview();
    renderProgress();
  }

  host.saveState();
}
