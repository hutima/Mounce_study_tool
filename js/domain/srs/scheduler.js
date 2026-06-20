// SRS scheduling logic — pure functions, no state access
import { SRS_DAY_MS, SRS_FULL_DAY_MS, SRS_AGAIN_MS, SRS_UNCERTAIN_MIN_MS, SRS_UNSPACED_RECOVERY_MS, DEFAULT_SRS_CADENCE, getCadencePreset } from './constants.js';
import { clamp } from '../../utils/helpers.js';
import { getConfidencePct } from './confidence.js';

// Default cadence preset used when a caller doesn't pass one (keeps these pure
// functions and any legacy call site on the historical 2-month tuning).
const DEFAULT_CADENCE = getCadencePreset(DEFAULT_SRS_CADENCE);

// Confidence → "easy" growth multiplier for a cadence's piecewise curve.
function easyMultiplierFor(recentPct, curve) {
  if (recentPct >= 90) return curve.high;
  if (recentPct >= 70) return curve.midBase + (recentPct - 70) / curve.midDiv;
  return curve.lowBase + (recentPct - 50) / curve.lowDiv;
}

// An N-day interval is due in 24N - 2 hours: the first day is pulled in 2h
// (SRS_DAY_MS = 22h) and every later day is a full calendar day
// (SRS_FULL_DAY_MS = 24h), so a card's due time never drifts later into a day.
// Fractional sub-day intervals scale by the first-day rate. msFromDays and
// daysFromMs are exact inverses (integer day counts round-trip).
export function msFromDays(days) {
  if (!(days > 0)) return 0;
  if (days <= 1) return Math.round(days * SRS_DAY_MS);
  return Math.round(SRS_DAY_MS + (days - 1) * SRS_FULL_DAY_MS);
}

export function daysFromMs(ms) {
  if (!(ms > 0)) return 0;
  if (ms <= SRS_DAY_MS) return ms / SRS_DAY_MS;
  return 1 + (ms - SRS_DAY_MS) / SRS_FULL_DAY_MS;
}

export function msFromHours(hours) {
  return Math.round(hours * 60 * 60 * 1000);
}

export function setProgressDelay(progress, delayMs, now = Date.now()) {
  progress.intervalDays = daysFromMs(delayMs);
  progress.dueAt = now + delayMs;
}

export function getRemainingProgressDelayMs(progress, now = Date.now()) {
  if (!progress || !progress.dueAt) return 0;
  return Math.max(0, progress.dueAt - now);
}

export function setMinimumProgressDelay(progress, minimumDelayMs, now = Date.now()) {
  const remainingDelayMs = getRemainingProgressDelayMs(progress, now);
  if (remainingDelayMs < minimumDelayMs) {
    setProgressDelay(progress, minimumDelayMs, now);
    return true;
  }
  progress.intervalDays = daysFromMs(remainingDelayMs);
  return false;
}

export function getSrsEase(progress) {
  const rawEase = Number(progress?.ease);
  const safeEase = Number.isFinite(rawEase) ? rawEase : 2.3;
  progress.ease = clamp(safeEase, 1.3, 3.0);
  return progress.ease;
}

export function getSrsStage(progress) {
  const rawStage = Number(progress?.srsStage);
  return Number.isFinite(rawStage) ? Math.max(0, Math.floor(rawStage)) : 0;
}

export function getLastEasyIntervalDays(progress) {
  const rawDays = Number(progress?.lastEasyIntervalDays);
  return Number.isFinite(rawDays) ? Math.max(0, rawDays) : 0;
}

export function getNextEasyIntervalDays(progress, cadence = DEFAULT_CADENCE) {
  // Stabilization rule: cap "easy" at 1 day until the card has 5+ recent flips
  // AND ≥50% last-10-flip confidence. This prevents a fresh card from jumping
  // straight to multi-day intervals after a few lucky guesses; intervals only
  // grow once the learner has demonstrated real retention.
  const history = Array.isArray(progress?.confidenceHistory)
    ? progress.confidenceHistory.filter(Number.isFinite)
    : [];
  const pct = history.length
    ? (history.reduce((s, v) => s + v, 0) / history.length) * 100
    : 0;

  if (history.length < 5 || pct < 50) return 1;

  // Post-stabilization: confidence-scaled multiplier resumes growth from the
  // actual previous interval. The cadence preset supplies the curve and cap
  // (intensive 1 → 3 → 8 → 14; relaxed base 1 → 4 → 14 → 49 → 120, then
  // modulated per-card below).
  let multiplier = easyMultiplierFor(pct, cadence.easyCurve);
  if (cadence.useCardDifficulty) {
    // Blend the card's persistent ease (per-card difficulty, 1.3–3.0) into the
    // confidence multiplier: a stubborn card grows slower, a consistently-easy
    // one faster. Neutral at the cadence's reference ease so a fresh card still
    // matches the base curve; the minNext floor below keeps even a hard card
    // growing by at least 1 day rather than shrinking.
    const neutralEase = cadence.difficultyNeutralEase || 2.3;
    multiplier *= getSrsEase(progress) / neutralEase;
  }

  const previousDays = Math.max(
    1,
    getLastEasyIntervalDays(progress),
    Number.isFinite(Number(progress?.intervalDays)) ? Math.max(0, Number(progress.intervalDays)) : 0
  );
  const proposedDays = previousDays * multiplier;
  const minNext = Math.ceil(previousDays + 1);
  let cappedDays = Math.min(cadence.maxIntervalDays, Math.max(Math.round(proposedDays), minNext));

  // Recent-3-flip uncertain ceiling: any shaky flip in the last 3 caps the
  // next 'easy' interval at 1 day × certainty, floored at 1 hour so a run
  // of recent 'again's can't push the cap to immediately-due. Overrides
  // the SRS_MAX_INTERVAL_DAYS cap when stricter.
  const uncertainCeilingMs = getRecentUncertainCeilingMs(progress, { capDays: 1, floorMs: 60 * 60 * 1000 });
  if (uncertainCeilingMs !== null) {
    const uncertainCeilingDays = daysFromMs(uncertainCeilingMs);
    cappedDays = Math.min(cappedDays, uncertainCeilingDays);
  }
  return cappedDays;
}

export function getEasyDelayMs(progress, cadence = DEFAULT_CADENCE) {
  return msFromDays(getNextEasyIntervalDays(progress, cadence));
}

// Caps an interval after a recent stumble at capDays × recent certainty (avg
// over the consulted flips). The lookback window is severity-aware
// (recordConfidenceSample runs before scheduling, so the flip just made is the
// last element here; samples are 1 easy / 0.5 uncertain / 0 hard):
//   • A hard miss (sample 0, a 'Hard'/'again' flip) inside the last
//     `hardLookback` (3) flips keeps the cap on for the full 3-flip window — a
//     real miss should resurface the card several times before it earns normal
//     cadence again.
//   • A soft 'uncertain' stumble (sample 0.5) with no hard miss in range only
//     lingers for `softLookback` (1) flip: a single clean flip afterward lifts
//     the cap, so a transient mistake costs one review cycle, not three.
// Because the window is position-based, an 'uncertain' that follows a hard miss
// still counts as one of the three flips that must pass before the 0 leaves the
// window — so Hard → Uncertain needs only two more clean flips while never
// short-circuiting to the soft one-flip path (0.5 is not < HARD_MISS_SAMPLE_MAX).
// Easy passes capDays:1 + floorMs:1h so the next 'easy' lands between 1 h and 1
// day; Pass/Uncertain use the default capDays:7 (no floor — its own
// UNCERTAIN_MIN_MS handles the floor at the call site). Returns null when no
// stumble is in range.
const HARD_MISS_SAMPLE_MAX = 0.5; // sample strictly below this = a 'Hard'/again miss
export function getRecentUncertainCeilingMs(progress, { capDays = 7, floorMs = 0, hardLookback = 3, softLookback = 1 } = {}) {
  const history = Array.isArray(progress?.confidenceHistory)
    ? progress.confidenceHistory.filter(Number.isFinite)
    : [];
  if (!history.length) return null;
  const hardWindow = Math.max(1, Math.floor(hardLookback) || 1);
  const softWindow = Math.max(1, Math.floor(softLookback) || 1);
  // A hard miss anywhere in the last `hardWindow` flips holds the longer
  // window; otherwise only the soft window's most-recent flip(s) are consulted.
  const hasRecentHardMiss = history.slice(-hardWindow).some(value => value < HARD_MISS_SAMPLE_MAX);
  const window = hasRecentHardMiss ? hardWindow : softWindow;
  const recent = history.slice(-window);
  if (!recent.some(value => value < 1)) return null;
  const certainty = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  return Math.max(floorMs, msFromDays(capDays * certainty));
}

export function getUncertainDelayMs(progress, cadence = DEFAULT_CADENCE) {
  // Delay for an 'uncertain/pass' outcome:
  //   <70% confidence → 2h floor (SRS_UNCERTAIN_MIN_MS)
  //   otherwise       → ½ previous interval, capped at the cadence's uncertain
  //                     ceiling × recent certainty (last-3-flip avg; falls back
  //                     to the cadence max interval otherwise).
  const pct = getConfidencePct(progress);
  if (pct === null || pct < 70) return SRS_UNCERTAIN_MIN_MS;
  const prevIntervalDays = Number(progress?.intervalDays) || 0;
  if (prevIntervalDays <= 0) return SRS_UNCERTAIN_MIN_MS;
  const halfMs = msFromDays(prevIntervalDays * 0.5);
  const rawCeiling = getRecentUncertainCeilingMs(progress, { capDays: cadence.uncertainCeilingDays }) ?? msFromDays(cadence.maxIntervalDays);
  const ceiling = Math.max(rawCeiling, SRS_UNCERTAIN_MIN_MS);
  return clamp(halfMs, SRS_UNCERTAIN_MIN_MS, ceiling);
}

export function formatRemainingForTable(dueAt) {
  const now = Date.now();
  if (!dueAt || dueAt <= now) return 'now';
  const remaining = dueAt - now;
  if (remaining > 12 * 60 * 60 * 1000) {
    return `${Math.max(1, Math.ceil(daysFromMs(remaining)))}d`;
  }
  if (remaining >= 60 * 60 * 1000) {
    return `${Math.max(1, Math.ceil(remaining / (60 * 60 * 1000)))}h`;
  }
  return `${Math.max(1, Math.ceil(remaining / (60 * 1000)))}m`;
}

// Apply unspaced schedule — takes cycleState and progress as arguments
export function applyUnspacedSchedule(progress, cycleEntry, outcome, reviewedAt = Date.now()) {
  const normalizedOutcome = outcome === 'easy' ? 'easy' : outcome === 'pass' ? 'pass' : 'again';

  if (normalizedOutcome === 'again') {
    cycleEntry.wrongThisCycle = true;
    cycleEntry.lastOutcome = 'again';
    setProgressDelay(progress, SRS_AGAIN_MS, reviewedAt);
    return progress;
  }

  const recoveringFromMiss = cycleEntry.wrongThisCycle;
  const minimumDelayMs = (normalizedOutcome === 'pass' || recoveringFromMiss)
    ? SRS_UNSPACED_RECOVERY_MS
    : SRS_DAY_MS;

  cycleEntry.correctCount += 1;
  cycleEntry.lastOutcome = normalizedOutcome;
  setMinimumProgressDelay(progress, minimumDelayMs, reviewedAt);
  return progress;
}
