// The application's mutable runtime state — every binding that used to live
// as a top-level `let` in main.js. Modules that need read or write access
// import this object directly and operate on its properties. Mutations on
// object/array properties propagate because there's a single shared
// reference; reassignments to primitive fields (e.g. `runtime.studyMode =
// 'morph'`) work because callers always go through this object.
//
// Initial values match what main.js used to declare. Anything that needs to
// be reset later (resetAllStats, restoreState) reassigns runtime.foo just
// like main.js used to reassign the bare `foo`.

import { ANALYTICS_COLLAPSED_DEFAULTS } from './store.js';

export const runtime = {
  // ── Usage / gamification ────────────────────────────────────────────
  appUsageStats: {
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
  },
  appProfile: 'vocab_grammar',
  appGamification: { lastCelebratedLevel: null, lastCelebratedBadgeDay: null, lastEarnedAchievementIds: [] },
  usageTickHandle: null,
  usageVisibilityBound: false,
  usageTickCounter: 0,
  analyticsExpandedChapter: null,
  analyticsExpandedWord: null,
  analyticsChapterSort: 'confidence', // 'confidence' | 'alphabetical'
  analyticsGrammarExpandedChapter: null,
  analyticsGrammarExpandedConcept: null,
  analyticsGrammarExpandedCard: null,
  analyticsGrammarConceptSort: 'confidence', // 'confidence' | 'alphabetical'
  // Inline-expansion state for the paradigm parsing rows on the analytics
  // tile vs the in-study parsing review panel. Tracked separately so opening
  // a row in analytics doesn't auto-open the same row at the bottom of the
  // study screen. Value is a lemma string, or '__overall' for the
  // all-paradigms summary row, or null when nothing is expanded.
  analyticsParadigmExpanded: null,
  parsingReviewExpanded: null,
  // Sort order of the per-deck progress card list. Defaults to alphabetical
  // because that's the predictable "find a word" lookup; confidence flips it
  // to lowest-raw-pct-first for the "what should I drill next" view.
  reviewSortMode: 'alphabetical', // 'alphabetical' | 'confidence'
  // Word IDs currently expanded inside the stubborn / improved / slipping
  // lists. Keyed by the list's collapseKey so each list tracks its own
  // expansion independently — opening a row in "Most stubborn" doesn't
  // close one in "Slipping list".
  analyticsExpandedListWords: {},
  // Analytics-page-local vocab view (separate from the study deck's
  // directionToGreek / requiredOnly so analyzing one direction doesn't force
  // a deck rebuild).
  analyticsVocabDirection: 'g2e',     // 'g2e' | 'e2g'
  analyticsVocabScope: 'required',    // 'required' | 'all'
  // Per-section open/closed state for the analytics overlay's collapsibles.
  // Defaults live in ANALYTICS_COLLAPSED_DEFAULTS (store.js) so migrations
  // and compaction can share the canonical key list.
  analyticsCollapsed: { ...ANALYTICS_COLLAPSED_DEFAULTS },

  // ── Modal / disclaimer / transfer / theme ───────────────────────────
  hasAcceptedDisclaimer: false,
  disclaimerModalRequiresAgreement: false,
  transferModalMode: '',
  transferPrimaryAction: null,
  transferSecondaryAction: null,
  themeMode: 'system',
  fontFamily: 'serif',  // 'serif' | 'sans'
  textSize: 'medium',   // 'medium' | 'large' | 'x-large'

  // ── Study mode / morphology answer state ────────────────────────────
  studyMode: 'vocab',
  morphSelfCheck: false,
  morphAnswerState: { answered: false, revealed: false, selfRated: false, selectedIndex: -1, isCorrect: null, skipped: false },
  morphPendingAdvance: false,

  // ── Step-by-step paradigm drill (off by default, no SRS/main-stats writes)
  // morphStepByStep: gates the alternate render + deck filter in grammar mode.
  // morphFocusedParadigm: lemma string the user is drilling (default = first
  // paradigm in selection). morphStepState: ephemeral per-card walk progress.
  // paradigmStepStats: { byLemma: { lemma: { attempts: [{ at, dims }] } } }
  // — sliding window capped at 20 attempts per lemma (see morph_steps.js).
  morphStepByStep: false,
  morphFocusedParadigm: null,
  morphStepState: { cardId: null, steps: [], stepIdx: 0, answers: [], completed: false },
  paradigmStepStats: { byLemma: {} },

  // ── Persisted directional stores (rebuilt from localStorage) ────────
  deckStates: {},
  globalWordMarks: {},
  globalWordProgress: {},

  // ── Current study session + deck cursor ─────────────────────────────
  currentSession: null,
  selectedKeys: [],
  splitSelection: false,    // separate chapter selections for vocab vs grammar
  modeSelections: {},       // { vocab: {selectedKeys, currentSessionId}, morph: {...} }
  deck: [],
  originalDeck: [],
  // Identity of the deck currently in `deck` — which deck-state-bank entry it
  // belongs to. Set whenever a deck is freshly built; consulted by
  // saveCurrentDeckStateToBank so the in-flight deck is always filed under its
  // own key even when callers have already mutated studyMode / direction /
  // selectedKeys ahead of the rebuild.
  activeDeckRef: null,      // { key, selectedKeys, currentSessionId }
  currentIdx: 0,
  isFlipped: false,
  shuffled: true,           // shuffle on by default
  requiredOnly: true,
  directionToGreek: false,  // false = Greek→English, true = English→Greek
  spacedRepetition: true,
  hardVocabReviewMode: false, // restrict vocab deck to cards missed >10× and still under 40% confidence
  activeDeckCount: 0,
  // Cards in the "middle deck" — currently due but not yet seen this session.
  // Builds up as deferred cards' timers expire mid-session; gets dumped into
  // active when the active section drains, on manual reshuffle, on 2% revival,
  // or after a 5-hour idle. In-memory only (not persisted, recomputed each
  // build).
  middleDeckCount: 0,
  // IDs that should land in the active section on the next buildStudyDeck.
  // Drains as those cards are reviewed; replenishes when middle dumps in
  // (active-empties / manual reshuffle / 2% revival / 5 h idle). Persisted
  // through reload only when lastStudyActivityAt is within the 5 h window;
  // see persistence.js for the gating logic.
  spacedActiveIds: [],
  // Timestamp (ms) of the most recent study activity in any mode (vocab,
  // grammar, or reader — anything that fires noteStudyInteraction).
  // Persisted, so the timer survives reload. persistence.js gates restore
  // of session state (spacedActiveIds, unspacedMiddleIds) on
  // (now - lastStudyActivityAt) <= SESSION_IDLE_RESET_MS.
  lastStudyActivityAt: 0,
  // Snapshot of lastStudyActivityAt taken at the start of each
  // noteStudyInteraction, before the field is bumped to "now". Used by
  // buildStudyDeck's in-session idle check so it sees the timestamp of the
  // previous activity instead of the one we just recorded. In-memory.
  previousStudyActivityAt: 0,
  unspacedPendingRecycle: false,
  unspacedCycleState: {},
  unspacedDeferredIds: new Set(), // 'pass' and 'again' cards excluded from current pass; reappear in next cycle
  // Cards Hard/Uncertain-marked in the current unspaced round, awaiting the
  // next reshuffle. Sits between active and archived in the deck layout.
  // In-memory only — on reload everything unmarked goes back to active so a
  // fresh round starts. Never persisted (Sets aren't in saveStateImpl's
  // allow-list).
  unspacedMiddleIds: new Set(),
  unspacedMiddleCount: 0,
  // Round bookkeeping for the unspaced flip-deck flow. A "round" is one pass
  // through the active deck — Hard/Uncertain bump the card to the back of the
  // active queue (it'll reappear in the same round); Easy archives it. When
  // every card present at the start of the round has been marked, the
  // remaining (non-archived) cards reshuffle for the next round.
  unspacedRoundSize: 0,
  unspacedRoundMarks: 0,
  // 5 AM-cutoff day key recorded the last time an unspaced archive (Easy
  // mark) was active. When the current day key drifts past this and
  // unspacedAutoResetEnabled is on, the daily auto-clear wipes all
  // unspaced 'known' marks across both vocab directions.
  lastUnspacedArchiveDayKey: '',
  // Off by default: Easy-archived cards persist across sessions and chapter
  // changes until the user explicitly resets, or until they opt in to the
  // 5 AM daily reset via the deck control toggle.
  unspacedAutoResetEnabled: false,
  flipsSinceReshuffle: 0,         // forward navigations since last periodic reshuffle
  lastPeriodicReshuffleAt: 0,     // wall-clock ms timestamp anchor for the hourly reshuffle throttle
  spacedUndoSnapshot: null,
  // History stack of pre-action snapshots for vocab unspaced. Each Next
  // press, Hard/Uncertain/Easy mark, and end-of-deck reshuffle pushes one
  // entry; Prev pops the top and restores it. Entries are tagged 'next',
  // 'mark', or 'reshuffle' so the Prev button label can switch to "Undo"
  // when the next pop would roll back a confidence-impacting mark.
  // Capped at runtime; not persisted (session-only).
  unspacedHistory: [],

  // ── Per-direction mark store for the active study mode ──────────────
  marks: {}
};
