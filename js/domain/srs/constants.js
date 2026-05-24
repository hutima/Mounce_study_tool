// SRS scheduling constants

export const SRS_DAY_MS = 20 * 60 * 60 * 1000;
export const SRS_AGAIN_MS = 5 * 60 * 1000;
// 2h floor for uncertain spaced reviews. Spaced 'again' marks no longer set
// a 5-min deferred timer (they route to the middle pile instead and resurface
// when active drains), so the uncertain floor now sets the minimum gap before
// a card seen via 'pass' can come back — long enough to actually count as
// retrieval practice rather than a flash echo.
export const SRS_UNCERTAIN_MIN_MS = 2 * 60 * 60 * 1000;
export const SRS_UNCERTAIN_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 1-week ceiling for uncertain cards (scaled by certainty)
export const SRS_UNCERTAIN_CAP_MS = SRS_UNCERTAIN_MIN_MS;  // legacy alias
// Unspaced "recovery" gap after a wrong-this-cycle card lands a pass/easy:
// 1h, decoupled from the spaced uncertain floor so the unspaced loop stays
// tight (you'll see the card again in the same study session).
export const SRS_UNSPACED_RECOVERY_MS = 60 * 60 * 1000;
export const SRS_MAX_INTERVAL_DAYS = 14;
export const SRS_NEAR_WINDOW_MS = 30 * 60 * 1000;
export const SRS_CYCLE_ADVANCE_MS = 60 * 60 * 1000;
// Idle gap that ends a study session. Used by spaced-mode buildStudyDeck to
// decide "fresh start" (middle → active dump + reshuffle), and by the
// persistence layer to decide whether to restore the saved active/middle
// membership across reloads. Resets on any study interaction (vocab,
// grammar, or reader — anything that fires noteStudyInteraction).
export const SESSION_IDLE_RESET_MS = 5 * 60 * 60 * 1000;
