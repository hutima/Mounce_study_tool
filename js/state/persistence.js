// State persistence: save/restore the runtime to localStorage, plus
// JSON export/import (with the Transfer modal UI for paste/share/file-pick).
//
// The deck-state bank (per-selection deck IDs + cursor) and the per-direction
// stores live on runtime.* and are written/read here. Host helpers (the deck
// builders, render hooks, study-mode normalizer, scheduler primitives) come
// in via configurePersistence — same pattern as the other UI modules.

import { runtime } from './runtime.js';
import { isPlainObject, shuffleArray } from '../utils/helpers.js';
import { getStorage, isLikelyIOS } from '../utils/storage.js';
import { sortSetKeys } from '../domain/deck/ordering.js';
import { filterHardVocabCards } from '../domain/deck/filters.js';
import { STATE_MIGRATIONS, summarizePersistedState, formatPersistedStateSummary, compactPersistedState, compactRuntimeStores } from './migrations.js';
import {
  sanitizeGamificationState,
  STORAGE_KEY,
  CONSENT_STORAGE_KEY,
  PROGRESS_EXPORT_FORMAT,
  PROGRESS_EXPORT_VERSION,
  EXPORT_MAX_DECK_STATE_ENTRIES
} from './store.js';
import { isAnalyticsModalOpen, isDisclaimerModalOpen } from '../ui/modals.js';
import {
  setActiveSessionButton,
  setActiveSetButtons
} from '../ui/selectors.js';
import { renderCard } from '../ui/render.js';
import { renderProgress, renderReview } from '../ui/progress.js';
import {
  computeXpAndLevel,
  maybeCelebrateLevelUp,
  maybeCelebrateAchievements
} from '../ui/analytics.js';

let host = {
  ensureUsageStats: () => runtime.appUsageStats,
  normalizeStudyMode: (m) => m,
  ensureDirectionalStores: () => {},
  getDirectionalMarksStore: () => ({}),
  getStudyStoreKey: () => 'g2e',
  accumulateUsageTime: () => {},
  accumulateActiveStudyTime: () => {},
  getSessions: () => [],
  getSelectedCards: () => [],
  buildStudyDeck: () => [],
  getDueCount: () => 0,
  resetMorphAnswerState: () => {},
  resetUnspacedCycleState: () => {},
  clearSpacedUndoSnapshot: () => {},
  syncToggleButtons: () => {},
  syncLayoutVisibility: () => {},
  getDirectionalProgressStore: () => ({}),
  isReaderMode: () => false,
  renderReaderModule: () => {}
};

export function configurePersistence(deps) {
  host = { ...host, ...deps };
}

// ── Persisted-state payload + sanitization for import ────────────────────

export function buildPersistedStatePayload(compactOptions) {
  saveCurrentDeckStateToBank();
  // Keep the active mode's selection snapshot fresh before persisting.
  if (runtime.splitSelection && (runtime.studyMode === 'vocab' || runtime.studyMode === 'morph')) {
    runtime.modeSelections[runtime.studyMode] = {
      selectedKeys: [...runtime.selectedKeys],
      currentSessionId: runtime.currentSession ? runtime.currentSession.id : null
    };
  }
  const usage = host.ensureUsageStats();
  // Trim the live runtime stores first (in place, so references like
  // runtime.marks stay valid): getWordProgress re-seeds a default entry for
  // every card rendered, so the in-memory state must be compacted too or it
  // regrows across a session. compactPersistedState then guarantees the
  // serialized payload is compact regardless of how it was sourced.
  compactRuntimeStores(runtime);
  return compactPersistedState({
    currentSessionId: runtime.currentSession ? runtime.currentSession.id : null,
    selectedKeys: [...runtime.selectedKeys],
    splitSelection: runtime.splitSelection,
    modeSelections: runtime.modeSelections,
    shuffled: runtime.shuffled,
    requiredOnly: runtime.requiredOnly,
    requiredOnlyDefaultedV1: true,
    srsIntervalCapAlignedV1: true,
    directionToGreek: runtime.directionToGreek,
    spacedRepetition: runtime.spacedRepetition,
    hardVocabReviewMode: runtime.hardVocabReviewMode,
    studyMode: runtime.studyMode,
    appProfile: runtime.appProfile,
    morphSelfCheck: runtime.morphSelfCheck,
    analyticsVocabDirection: runtime.analyticsVocabDirection,
    analyticsVocabScope: runtime.analyticsVocabScope,
    analyticsCollapsed: runtime.analyticsCollapsed,
    gamification: sanitizeGamificationState(runtime.appGamification),
    deckStates: runtime.deckStates,
    globalWordMarks: runtime.globalWordMarks,
    globalWordProgress: runtime.globalWordProgress,
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
  }, compactOptions);
}

function sanitizeImportedState(candidate) {
  if (!isPlainObject(candidate)) return null;
  // These are persisted-JSON property names — they must stay as the bare
  // identifiers used in saveState's payload, not the runtime.* references.
  const hasRecognizedStateShape = ['selectedKeys', 'deckStates', 'globalWordMarks', 'globalWordProgress', 'appUsageStats']
    .some(key => key in candidate);
  if (!hasRecognizedStateShape) return null;

  const state = { ...candidate };
  state.selectedKeys = Array.isArray(candidate.selectedKeys) ? candidate.selectedKeys.map(String) : [];
  state.deckStates = isPlainObject(candidate.deckStates) ? candidate.deckStates : {};
  state.globalWordMarks = isPlainObject(candidate.globalWordMarks) ? candidate.globalWordMarks : {};
  state.globalWordProgress = isPlainObject(candidate.globalWordProgress) ? candidate.globalWordProgress : {};
  state.studyMode = host.normalizeStudyMode(candidate.studyMode);
  state.appProfile = 'vocab_grammar';
  state.gamification = sanitizeGamificationState(candidate.gamification);
  state.shuffled = candidate.shuffled !== false;
  state.requiredOnly = candidate.requiredOnly !== false;
  state.directionToGreek = !!candidate.directionToGreek;
  state.spacedRepetition = candidate.spacedRepetition !== false;
  state.hardVocabReviewMode = !!candidate.hardVocabReviewMode;
  state.splitSelection = !!candidate.splitSelection;
  state.modeSelections = isPlainObject(candidate.modeSelections) ? candidate.modeSelections : {};
  state.morphSelfCheck = !!candidate.morphSelfCheck;

  // Older exports made while the user was in reader mode persist reader as the
  // top-level studyMode, with selectedKeys/currentSessionId left over from the
  // last vocab/grammar mode and (often) hardVocabReviewMode quietly on. After
  // import that combination quietly narrows the vocab deck once the user
  // switches out of reader. Re-normalize on import so existing bad bundles
  // rehydrate into a sane vocab/grammar starting state regardless of when they
  // were exported.
  if (state.studyMode === 'reader') {
    const vocabSel = state.modeSelections.vocab;
    const morphSel = state.modeSelections.morph;
    if (vocabSel && Array.isArray(vocabSel.selectedKeys)) {
      state.studyMode = 'vocab';
      state.selectedKeys = vocabSel.selectedKeys.map(String);
      state.currentSessionId = vocabSel.currentSessionId || null;
    } else if (morphSel && Array.isArray(morphSel.selectedKeys)) {
      state.studyMode = 'morph';
      state.selectedKeys = morphSel.selectedKeys.map(String);
      state.currentSessionId = morphSel.currentSessionId || null;
    } else {
      state.studyMode = 'vocab';
    }
    state.hardVocabReviewMode = false;
  }

  const usage = host.ensureUsageStats(candidate.appUsageStats);
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

  // Imported files can be multi-megabyte legacy exports. Compact before it is
  // written to localStorage so the import itself can't trip the iOS quota.
  return compactPersistedState(state);
}

function applyImportedState(state, options = {}) {
  const storage = getStorage();
  if (!storage) return false;

  const sanitized = sanitizeImportedState(state);
  if (!sanitized) return false;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    // sanitized is already compacted; if it still won't fit, persist without
    // the deck-state bank (a pure resume convenience) rather than failing the
    // whole import.
    sanitized.deckStates = {};
    storage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  }
  if (options.disclaimerAccepted) {
    storage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    runtime.hasAcceptedDisclaimer = true;
  }

  const restored = restoreState();
  if (!restored) {
    runtime.currentSession = null;
    runtime.selectedKeys = [];
    runtime.deck = [];
    runtime.originalDeck = [];
    runtime.currentIdx = 0;
    runtime.isFlipped = false;
    runtime.marks = host.getDirectionalMarksStore();
    host.resetMorphAnswerState();
    host.resetUnspacedCycleState();
    runtime.unspacedPendingRecycle = false;
    runtime.activeDeckCount = 0;
    setActiveSessionButton();
    setActiveSetButtons();
    host.syncToggleButtons();
    host.syncLayoutVisibility();
    renderCard();
    renderProgress();
    renderReview();
    if (host.isReaderMode()) host.renderReaderModule();
  } else {
    host.syncLayoutVisibility();
  }

  saveState();
  return true;
}

// ── Progress export (JSON) ───────────────────────────────────────────────

function buildProgressExportPayload() {
  const storage = getStorage();
  if (!storage) return null;

  // Flush any uncounted time so the export captures the latest totals
  host.accumulateUsageTime();
  host.accumulateActiveStudyTime();

  // Card-shuffle resume cursors aren't worth their weight (~30 KB per entry)
  // in a JSON backup — trim the deck-state bank to a much smaller cap for
  // exports than the live localStorage cap.
  const appState = buildPersistedStatePayload({ maxDeckStates: EXPORT_MAX_DECK_STATE_ENTRIES });

  // Reader mode doesn't own a deck, so the top-level studyMode/selectedKeys/
  // currentSessionId snapshot is whatever vocab or grammar mode was active
  // before switching to reader — plus any flags (hardVocabReviewMode in
  // particular) that were on at that point. Exporting that as-is means a
  // re-imported bundle lands in reader UI with a stale vocab/grammar selection
  // and any narrowing filter still applied: on the user's next switch out of
  // reader, the deck rebuilds against that filter and they see a tiny deck of
  // "hard" cards instead of their full selection. Standardize exports to land
  // in vocab mode (or morph, if no vocab selection was ever recorded), and
  // clear vocab-only narrowing filters so an import is reproducible regardless
  // of what was on screen at export time.
  if (appState.studyMode === 'reader') {
    const vocabSel = appState.modeSelections && appState.modeSelections.vocab;
    const morphSel = appState.modeSelections && appState.modeSelections.morph;
    if (vocabSel && Array.isArray(vocabSel.selectedKeys)) {
      appState.studyMode = 'vocab';
      appState.selectedKeys = [...vocabSel.selectedKeys];
      appState.currentSessionId = vocabSel.currentSessionId || null;
    } else if (morphSel && Array.isArray(morphSel.selectedKeys)) {
      appState.studyMode = 'morph';
      appState.selectedKeys = [...morphSel.selectedKeys];
      appState.currentSessionId = morphSel.currentSessionId || null;
    } else {
      appState.studyMode = 'vocab';
    }
    // hardVocabReviewMode is a vocab-only deck filter; in reader mode it can't
    // be toggled, so its state at export time is whatever was last set in
    // vocab mode. A re-import with the filter quietly on hides most of the
    // user's vocab — clear it so the export rehydrates to a full deck.
    appState.hardVocabReviewMode = false;
  }

  // The persisted payload zeros currentStudySession. If there was an
  // in-progress session, push a snapshot into the exported history so
  // session time is not lost on import.
  const liveSession = runtime.appUsageStats.currentStudySession;
  if (liveSession && liveSession.startedAt && liveSession.durationMs > 0) {
    const sessionSnapshot = {
      startedAt: liveSession.startedAt,
      endedAt: runtime.appUsageStats.lastStudyCountedAt || Date.now(),
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

// ── Transfer modal (paste/copy UI) ───────────────────────────────────────

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

  runtime.transferModalMode = config?.mode || '';
  runtime.transferPrimaryAction = typeof config?.primaryAction === 'function' ? config.primaryAction : null;
  runtime.transferSecondaryAction = typeof config?.secondaryAction === 'function' ? config.secondaryAction : null;
  setTransferModalContent(config || {});
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  const textarea = document.getElementById('transferTextarea');
  if (config?.showTextarea && textarea) {
    setTimeout(() => textarea.focus(), 0);
  }
}

export function closeTransferModal() {
  const overlay = document.getElementById('transferOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  runtime.transferModalMode = '';
  runtime.transferPrimaryAction = null;
  runtime.transferSecondaryAction = null;
  if (!isDisclaimerModalOpen() && !isAnalyticsModalOpen()) document.body.classList.remove('modal-open');
}

export function handleTransferPrimaryAction() {
  if (typeof runtime.transferPrimaryAction === 'function') runtime.transferPrimaryAction();
}

export function handleTransferSecondaryAction() {
  if (typeof runtime.transferSecondaryAction === 'function') runtime.transferSecondaryAction();
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

export async function exportProgressJson() {
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

export function triggerImportProgress() {
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

// ── Deck state bank + save/restore ───────────────────────────────────────

export function getDeckStateKey(keys = runtime.selectedKeys, requiredFlag = runtime.requiredOnly, spacedFlag = runtime.spacedRepetition) {
  const normalizedKeys = sortSetKeys((keys || []).map(String));
  return JSON.stringify({
    keys: normalizedKeys,
    requiredOnly: !!requiredFlag,
    spacedRepetition: !!spacedFlag,
    hardVocabReviewMode: !!runtime.hardVocabReviewMode,
    direction: host.getStudyStoreKey(),
    mode: runtime.studyMode
  });
}

// Snapshot which deck-state-bank entry the current runtime.deck belongs to.
// Call this whenever a deck is freshly built so saveCurrentDeckStateToBank can
// file it correctly. Recomputing the key from live runtime state at save time
// is unsafe: setStudyMode / toggleDirection / loadDeckFromKeys mutate the
// key-relevant fields (studyMode, direction, selectedKeys) *before* the new
// deck is built, so a save in that window would file the stale deck under the
// new deck's key and corrupt it.
export function markActiveDeckRef() {
  if (!runtime.selectedKeys.length) {
    runtime.activeDeckRef = null;
    return;
  }
  runtime.activeDeckRef = {
    key: getDeckStateKey(runtime.selectedKeys, runtime.requiredOnly),
    selectedKeys: [...runtime.selectedKeys],
    currentSessionId: runtime.currentSession ? runtime.currentSession.id : null
  };
}

// Obsolete localStorage keys from earlier save formats. restoreState reads
// them once as a migration fallback (see the fallback chain below); left in
// place afterwards they are pure dead weight against the small iOS Safari
// quota, which is what eventually makes setItem throw.
const LEGACY_STORAGE_KEYS = [
  'greekFlashcardsStateV17',
  'greekFlashcardsStateV15',
  'greekFlashcardsStateV14',
  'greekFlashcardsStateV12',
  'greekFlashcardsStateV11',
  'greekFlashcardsStateV10'
];

function clearLegacySaves(storage) {
  let cleared = false;
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      if (storage.getItem(key) !== null) {
        storage.removeItem(key);
        cleared = true;
      }
    } catch (err) {
      // A removeItem failure just means we couldn't reclaim that one key.
    }
  }
  return cleared;
}

export function saveCurrentDeckStateToBank() {
  const ref = runtime.activeDeckRef;
  if (!ref || !runtime.deck.length) return;

  runtime.deckStates[ref.key] = {
    currentSessionId: ref.currentSessionId,
    selectedKeys: ref.selectedKeys,
    deckIds: runtime.deck.map(card => card.id),
    currentIdx: runtime.currentIdx,
    unspacedPendingRecycle: !runtime.spacedRepetition && !!runtime.unspacedPendingRecycle,
    // Recency stamp so compaction can keep the most recently used selections
    // and evict stale ones instead of letting the bank grow unbounded.
    savedAt: Date.now()
  };
}

export function saveState() {
  const storage = getStorage();
  if (!storage) return;
  maybeCelebrateLevelUp();
  maybeCelebrateAchievements();
  // saveState runs at the top of renderCard(): a throw here (iOS localStorage
  // QuotaExceededError is the common one) would abort the re-render and leave
  // the current card frozen. The payload is already compacted; if it still
  // won't fit, retry without the deck-state bank, then give up silently —
  // losing a resume cursor is far better than a frozen UI.
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedStatePayload()));
  } catch (err) {
    // Almost always QuotaExceededError on iOS. Reclaim space by dropping
    // obsolete legacy-format saves, then retry; if it still won't fit, drop
    // the deck-state bank (a pure resume convenience) and try once more.
    clearLegacySaves(storage);
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedStatePayload()));
    } catch (err2) {
      try {
        const payload = buildPersistedStatePayload();
        payload.deckStates = {};
        storage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (err3) {
        console.warn('saveState: unable to persist progress to localStorage.', err3);
      }
    }
  }
}

export function clearSavedState() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
}

export function reorderDeckFromIds(cards, deckIds) {
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
  // Zero overlap means these ids belong to a different deck entirely — e.g. a
  // stale cross-mode bank entry. Signal "no usable saved order" so callers
  // fall back to a fresh deck instead of trusting its currentIdx.
  if (!ordered.length) return null;
  ordered.push(...byId.values());
  return ordered;
}

export function restoreState() {
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

    // Drop legacy/default bloat (empty progress entries, dead direction
    // buckets, an overgrown deck-state bank) before it is loaded into runtime,
    // so an oversized legacy save shrinks on first load instead of repeatedly
    // failing to persist.
    saved = compactPersistedState(saved);
    // Once the current-format save exists, the obsolete legacy-format keys are
    // pure dead weight against the iOS quota — reclaim that space. Guarded so
    // we never drop a legacy save still being used as the load source.
    if (storage.getItem(STORAGE_KEY) !== null) clearLegacySaves(storage);

    runtime.selectedKeys = Array.isArray(saved.selectedKeys) ? sortSetKeys(saved.selectedKeys.map(String)) : [];
    runtime.requiredOnly = saved.requiredOnly !== false;
    runtime.directionToGreek = !!saved.directionToGreek;
    runtime.spacedRepetition = saved.spacedRepetition !== false;
    runtime.hardVocabReviewMode = !!saved.hardVocabReviewMode;
    runtime.splitSelection = !!saved.splitSelection;
    runtime.modeSelections = saved.modeSelections && typeof saved.modeSelections === 'object' ? saved.modeSelections : {};
    runtime.appProfile = 'vocab_grammar';
    const hadSavedAchievementSnapshot = Array.isArray(saved?.gamification?.lastEarnedAchievementIds);
    runtime.appGamification = sanitizeGamificationState(saved.gamification);
    runtime.studyMode = host.normalizeStudyMode(saved.studyMode);
    runtime.morphSelfCheck = !!saved.morphSelfCheck;
    runtime.analyticsVocabDirection = saved.analyticsVocabDirection === 'e2g' ? 'e2g' : 'g2e';
    runtime.analyticsVocabScope = saved.analyticsVocabScope === 'all' ? 'all' : 'required';
    if (saved.analyticsCollapsed && typeof saved.analyticsCollapsed === 'object') {
      Object.keys(runtime.analyticsCollapsed).forEach(key => {
        if (typeof saved.analyticsCollapsed[key] === 'boolean') {
          runtime.analyticsCollapsed[key] = saved.analyticsCollapsed[key];
        }
      });
    }
    runtime.shuffled = saved.shuffled !== false;
    runtime.deckStates = saved.deckStates && typeof saved.deckStates === 'object' ? saved.deckStates : {};
    runtime.globalWordMarks = saved.globalWordMarks && typeof saved.globalWordMarks === 'object' ? saved.globalWordMarks : {};
    runtime.globalWordProgress = saved.globalWordProgress && typeof saved.globalWordProgress === 'object' ? saved.globalWordProgress : {};
    runtime.appUsageStats = host.ensureUsageStats(saved.appUsageStats);
    runtime.appUsageStats.lastActiveAt = 0;
    const restoredLevel = computeXpAndLevel(runtime.appUsageStats).currentLevel.level;
    if (!Number.isFinite(runtime.appGamification.lastCelebratedLevel) || runtime.appGamification.lastCelebratedLevel < 1 || runtime.appGamification.lastCelebratedLevel > restoredLevel) {
      runtime.appGamification.lastCelebratedLevel = restoredLevel;
    }
    if (runtime.appGamification.lastCelebratedBadgeDay && !/^\d{4}-\d{2}-\d{2}$/.test(runtime.appGamification.lastCelebratedBadgeDay)) {
      runtime.appGamification.lastCelebratedBadgeDay = null;
    }
    host.ensureDirectionalStores();
    if (hadSavedAchievementSnapshot && !Array.isArray(runtime.appGamification.lastEarnedAchievementIds)) {
      runtime.appGamification.lastEarnedAchievementIds = [];
    }

    if (!runtime.selectedKeys.length) {
      host.clearSpacedUndoSnapshot();
      host.syncToggleButtons();
      return false;
    }

    runtime.currentSession = saved.currentSessionId ? host.getSessions().find(s => s.id === saved.currentSessionId) || null : null;

    const selectedCards = host.getSelectedCards(runtime.selectedKeys);
    let scopedCards = runtime.requiredOnly ? selectedCards.filter(card => card.required) : selectedCards;
    if (runtime.hardVocabReviewMode && runtime.studyMode === 'vocab') {
      scopedCards = filterHardVocabCards(scopedCards, host.getDirectionalProgressStore());
    }
    runtime.originalDeck = scopedCards;
    host.resetMorphAnswerState();
    const savedDeckState = runtime.deckStates[getDeckStateKey(runtime.selectedKeys, runtime.requiredOnly)] || null;
    runtime.marks = host.getDirectionalMarksStore();
    const restoredDeck = savedDeckState ? reorderDeckFromIds(runtime.originalDeck, savedDeckState.deckIds) : null;
    // A bank entry whose ids don't line up with the current deck is a stale
    // cross-mode save — ignore its cursor entirely rather than clamp a
    // meaningless index onto a different deck.
    const usableDeckState = restoredDeck ? savedDeckState : null;
    if (runtime.spacedRepetition && restoredDeck) {
      runtime.deck = restoredDeck;
      runtime.activeDeckCount = restoredDeck.length;
      runtime.deck = host.buildStudyDeck(runtime.originalDeck, { forceShuffle: runtime.shuffled });
    } else if (restoredDeck) {
      runtime.deck = runtime.shuffled ? shuffleArray([...restoredDeck]) : restoredDeck;
    } else {
      runtime.deck = host.buildStudyDeck(runtime.originalDeck);
    }
    host.resetUnspacedCycleState();
    runtime.activeDeckCount = runtime.spacedRepetition ? host.getDueCount(runtime.originalDeck) : runtime.originalDeck.filter(card => runtime.marks[card.id] !== 'known').length;
    runtime.currentIdx = usableDeckState && Number.isInteger(usableDeckState.currentIdx)
      ? Math.min(Math.max(usableDeckState.currentIdx, 0), runtime.spacedRepetition ? runtime.activeDeckCount : runtime.deck.length)
      : 0;
    runtime.unspacedPendingRecycle = !runtime.spacedRepetition && !!(usableDeckState && usableDeckState.unspacedPendingRecycle);
    runtime.isFlipped = false;
    host.clearSpacedUndoSnapshot();
    markActiveDeckRef();

    setActiveSessionButton();
    setActiveSetButtons();
    host.syncToggleButtons();
    renderCard();
    renderProgress();
    renderReview();
    // Reader mode owns the cardArea; renderCard above drew a vocab card into
    // it, so re-render the reader UI on top, otherwise an imported/restored
    // reader-mode save shows a stale vocab card with the nav/mark rows hidden.
    if (host.isReaderMode()) host.renderReaderModule();
    return true;
  } catch (err) {
    clearSavedState();
    return false;
  }
}
