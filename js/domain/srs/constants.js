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
// 2h re-test floor for an 'uncertain' (pass) flip: marking a card uncertain
// re-queues it 2h out so it returns next session for one confirming pass
// before its interval resumes (see the lapse ladder in applySpacedReview).
export const SRS_UNCERTAIN_MIN_MS = 2 * 60 * 60 * 1000;
// Unspaced "recovery" gap after a wrong-this-cycle card lands a pass/easy:
// 1h, decoupled from the spaced uncertain floor so the unspaced loop stays
// tight (you'll see the card again in the same study session).
export const SRS_UNSPACED_RECOVERY_MS = 60 * 60 * 1000;
export const SRS_MAX_INTERVAL_DAYS = 14;

// ── Lapse relearn ladder + leech (applied in applySpacedReview, main.js) ──
// A miss no longer craters a well-known card. It enters a short relearn ladder
// and then resumes at HALF its pre-lapse interval (capped per cadence):
//   • Uncertain → 2h re-test, then ½ prev on the next pass.
//   • Hard      → re-queued in-session, then two 1-day passes, then ½ prev.
export const SRS_RELEARN_STEP_DAYS = 1;    // spacing between hard-relearn passes
export const SRS_HARD_RELEARN_STEPS = 2;   // hard: in-session → 1d → 1d → graduate
// Leech (8-month cadence only): a card missed this many times is drilled at a
// 1-day interval until it strings together LEECH_UNPIN_STREAK correct passes,
// then it rejoins normal growth.
export const LEECH_LAPSE_THRESHOLD = 4;
export const LEECH_UNPIN_STREAK = 3;
export const LEECH_DRILL_DAYS = 1;

// ── Spacing-cadence presets ──────────────────────────────────────────────
// The "easy" growth, the hard cap, and the lapse caps are tuned to how long
// the course runs. A 2-month intensive wants tight intervals so everything
// resurfaces soon; the 8-month cadence (enabled for continued review after the
// class) rests well-known cards far longer and leans on per-card ease.
// Each preset supplies:
//   maxIntervalDays    — hard cap on any scheduled interval (in SRS_DAY_MS days)
//   lapseResumeCapDays — cap on the ½-previous interval a card resumes at after
//                        an uncertain/hard lapse (see the relearn ladder)
//   maxEasyStepDays    — (optional) cap on how many days a single easy step may
//                        add, so the top of the ramp climbs gently/linearly
//   easyCurve          — confidence → "easy" growth multiplier, piecewise:
//                        ≥90% → high; 70–89% → midBase+(pct-70)/midDiv;
//                        50–69% → lowBase+(pct-50)/lowDiv
//   useCardDifficulty  — blend per-card ease (1.3–3.0) into the easy multiplier
//   leechEnabled       — drill chronically-missed cards (see LEECH_* above)
export const SRS_CADENCE_PRESETS = {
  intensive: {
    id: 'intensive',
    label: '2-month intensive',
    maxIntervalDays: SRS_MAX_INTERVAL_DAYS,   // easy ramp 1 → 3 → 8 → 14
    lapseResumeCapDays: 7,                     // lapse resumes at ½ prev, capped 7d
    easyCurve: { high: 2.5, midBase: 1.5, midDiv: 40, lowBase: 1.2, lowDiv: 100 },
    // Course is short — a global confidence curve is enough; per-card
    // difficulty doesn't have time to matter, and there's no time to drill
    // leeches, so both stay off.
    useCardDifficulty: false,
    leechEnabled: false
  },
  relaxed: {
    id: 'relaxed',
    label: '8-month / continuous review',
    // ~2 months — roughly 4× the 14-day intensive cap, matching the ~4×
    // longer horizon. Easy ramp climbs gently: 14 → 28 → 42 → 56 → 60.
    maxIntervalDays: 60,
    lapseResumeCapDays: 14,                    // lapse resumes at ½ prev, capped 14d
    maxEasyStepDays: 14,                       // never add more than ~2 weeks per easy step
    easyCurve: { high: 2.0, midBase: 1.5, midDiv: 40, lowBase: 1.2, lowDiv: 50 },
    // Long horizon → blend each card's persistent ease (1.3–3.0) into the easy
    // growth: a stubborn card crawls, a consistently-easy one stretches out to
    // the step cap. Neutral at the default ease (2.3). Leech drilling on so a
    // chronically-missed card can't drift out to the 2-month cap.
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
