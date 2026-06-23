// SRS scheduling constants

// Day model (see msFromDays/daysFromMs in scheduler.js): an N-day interval is
// due in 24N - 2 hours. The FIRST day is pulled in 2h (SRS_DAY_MS = 22h) so a
// daily card settles a touch earlier than its first review; every later day is
// a full calendar day (SRS_FULL_DAY_MS = 24h), so the cadence tracks the
// calendar and a card is never pushed later into a day. 1d = 22h, 2d = 46h,
// 3d = 70h, …
export const SRS_DAY_MS = 22 * 60 * 60 * 1000;
export const SRS_FULL_DAY_MS = 24 * 60 * 60 * 1000;
export const SRS_AGAIN_MS = 5 * 60 * 1000;
// 2h floor for uncertain spaced reviews. Spaced 'again' marks no longer set
// a 5-min deferred timer (they route to the middle pile instead and resurface
// when active drains), so the uncertain floor now sets the minimum gap before
// a card seen via 'pass' can come back — long enough to actually count as
// retrieval practice rather than a flash echo.
export const SRS_UNCERTAIN_MIN_MS = 2 * 60 * 60 * 1000;
// Variant-form ROUND WINDOW: a "split card" set (base verb + its derived
// principal-part faces) gets 2h from when its first face is seen to clear every
// face, after which the round is closed out (its confidence recorded, unreached
// faces counting 0%) and a fresh one begins. Same 2h as the uncertain floor.
export const SRS_VARIANT_HOLD_MS = SRS_UNCERTAIN_MIN_MS;
// Unspaced "recovery" gap after a wrong-this-cycle card lands a pass/easy:
// 1h, decoupled from the spaced uncertain floor so the unspaced loop stays
// tight (you'll see the card again in the same study session).
export const SRS_UNSPACED_RECOVERY_MS = 60 * 60 * 1000;
export const SRS_MAX_INTERVAL_DAYS = 14;

// ── Lapse / relearn ladder ───────────────────────────────────────────────
// A lapse (Uncertain or Hard) no longer wipes a well-known card's spacing.
// Instead the card runs a short relearn ladder and then RESUMES at half its
// pre-lapse interval (preserved on the entry). Caps are per-cadence
// (lapseResumeCapDays). See applySpacedReview in js/app/main.js.
//   • Uncertain → one confirming pass in 2h, then resume at ½ previous.
//   • Hard      → relearn in-session (due now), then SRS_HARD_RELEARN_STEPS
//                 passes one day apart, then resume at ½ previous.
export const SRS_RELEARN_STEP_DAYS = 1;
export const SRS_HARD_RELEARN_STEPS = 2;

// ── Leech (8-month / relaxed cadence only) ───────────────────────────────
// A card that keeps lapsing Hard gets pulled out of normal growth and drilled
// at 1 day until it survives a short clean streak, then rejoins the curve.
export const LEECH_LAPSE_THRESHOLD = 4;
export const LEECH_UNPIN_STREAK = 3;
export const LEECH_DRILL_DAYS = 1;

// ── Spacing-cadence presets ──────────────────────────────────────────────
// The "easy" interval growth and the hard cap are tuned to how long the
// course runs. A 2-month intensive wants tight intervals so everything
// resurfaces soon; an 8-month course can let well-known cards rest far longer.
// Each preset supplies:
//   maxIntervalDays    — hard cap on any scheduled interval (in SRS_DAY_MS days)
//   lapseResumeCapDays — cap on the ½-previous interval a card resumes at after
//                        a lapse's relearn ladder (see applySpacedReview)
//   maxEasyStepDays    — optional per-step cap: a single 'easy' may add at most
//                        this many days (keeps the relaxed ramp near-linear and
//                        softens a 2-month → 8-month switch)
//   easyCurve          — confidence → "easy" growth multiplier, piecewise:
//                        ≥90% → high; 70–89% → midBase+(pct-70)/midDiv;
//                        50–69% → lowBase+(pct-50)/lowDiv
//   leechEnabled       — drill a card that keeps lapsing Hard (relaxed only)
// `intensive` reproduces the historical hard-coded easy ramp exactly, so it
// stays the default and existing schedules grow the same.
export const SRS_CADENCE_PRESETS = {
  intensive: {
    id: 'intensive',
    label: '2-month intensive',
    maxIntervalDays: SRS_MAX_INTERVAL_DAYS,      // top-confidence ramp 1 → 3 → 8 → 14
    lapseResumeCapDays: 7,
    easyCurve: { high: 2.5, midBase: 1.5, midDiv: 40, lowBase: 1.2, lowDiv: 100 },
    // Course is short — a global confidence curve is enough; per-card
    // difficulty doesn't have time to matter.
    useCardDifficulty: false,
    leechEnabled: false
  },
  relaxed: {
    id: 'relaxed',
    label: '8-month / continuous review',
    maxIntervalDays: 60,                          // ~2-month cap; gentle ramp 14 → 28 → 42 → 56 → 60
    lapseResumeCapDays: 14,
    maxEasyStepDays: 14,                          // a single easy adds ≤14d (near-linear growth)
    easyCurve: { high: 2.0, midBase: 1.5, midDiv: 40, lowBase: 1.3, lowDiv: 40 },
    // Long horizon → blend each card's persistent ease (1.3–3.0) into the easy
    // growth: a stubborn card crawls (1.3 → 14 → 16 → 18 …), a consistently-easy
    // one stretches toward the cap. Neutral at the default ease (2.3) so a fresh
    // card matches the base curve.
    useCardDifficulty: true,
    difficultyNeutralEase: 2.3,
    leechEnabled: true
  }
};
export const DEFAULT_SRS_CADENCE = 'intensive';
export function getCadencePreset(id) {
  return SRS_CADENCE_PRESETS[id] || SRS_CADENCE_PRESETS[DEFAULT_SRS_CADENCE];
}

export const SRS_NEAR_WINDOW_MS = 30 * 60 * 1000;
export const SRS_CYCLE_ADVANCE_MS = 60 * 60 * 1000;
// Idle gap that ends a study session. Used by spaced-mode buildStudyDeck to
// decide "fresh start" (middle → active dump + reshuffle), and by the
// persistence layer to decide whether to restore the saved active/middle
// membership across reloads. Resets on any study interaction (vocab,
// grammar, or reader — anything that fires noteStudyInteraction).
export const SESSION_IDLE_RESET_MS = 5 * 60 * 60 * 1000;
