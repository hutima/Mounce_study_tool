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
  analyticsGrammarReviewMode: 'review', // 'review' | 'all'

  // ── Modal / disclaimer / transfer / theme ───────────────────────────
  hasAcceptedDisclaimer: false,
  disclaimerModalRequiresAgreement: false,
  transferModalMode: '',
  transferPrimaryAction: null,
  transferSecondaryAction: null,
  themeMode: 'system',

  // ── Study mode / morphology answer state ────────────────────────────
  studyMode: 'vocab',
  morphSelfCheck: false,
  morphAnswerState: { answered: false, revealed: false, selfRated: false, selectedIndex: -1, isCorrect: null, skipped: false },
  morphPendingAdvance: false,

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
  unspacedPendingRecycle: false,
  unspacedCycleState: {},
  unspacedDeferredIds: new Set(), // 'pass' cards excluded from current pass
  flipsSinceReshuffle: 0,         // forward navigations since last periodic reshuffle
  spacedUndoSnapshot: null,

  // ── Per-direction mark store for the active study mode ──────────────
  marks: {}
};
