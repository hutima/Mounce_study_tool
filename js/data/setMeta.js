// Set metadata — chapter-to-part mapping for Mounce, Basics of Biblical Greek (BBG3, 36 chapters)
//
//   Part I   — Introduction         : Ch 1–4
//   Part II  — Noun System          : Ch 5–14
//   Part III — Indicative Verb      : Ch 15–25
//   Part IV  — Nonindicative & μι   : Ch 26–36
//
// CHAPTER_TO_WEEK is retained as the export name only because the deck and
// supplemental selectors group on a numeric "week" field. Here that number is
// the Mounce *part*, and the UI relabels the heading accordingly.

export const CHAPTER_TO_WEEK = {
  1: 1, 2: 1, 3: 1, 4: 1,
  5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 2, 14: 2,
  15: 3, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3, 21: 3, 22: 3, 23: 3, 24: 3, 25: 3,
  26: 4, 27: 4, 28: 4, 29: 4, 30: 4, 31: 4, 32: 4, 33: 4, 34: 4, 35: 4, 36: 4
};

export const CHAPTER_TO_PART = CHAPTER_TO_WEEK;

export const PART_LABELS = {
  1: 'Part I — Introduction',
  2: 'Part II — Noun System',
  3: 'Part III — Indicative Verb',
  4: 'Part IV — Nonindicative & μι Verbs'
};
