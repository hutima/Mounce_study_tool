// SRS scheduling logic — pure functions, no state access
import { SRS_DAY_MS, SRS_AGAIN_MS, SRS_UNCERTAIN_MIN_MS, SRS_UNSPACED_RECOVERY_MS, DEFAULT_SRS_CADENCE, getCadencePreset } from './constants.js';
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

export function msFromDays(days) {
  return Math.round(days * SRS_DAY_MS);
}

export function msFromHours(hours) {
  return Math.round(hours * 60 * 60 * 1000);
}

export function setProgressDelay(progress, delayMs, now = Date.now()) {
  progress.intervalDays = delayMs / SRS_DAY_MS;
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
  progress.intervalDays = remainingDelayMs / SRS_DAY_MS;
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
    const uncertainCeilingDays = uncertainCeilingMs / SRS_DAY_MS;
    cappedDays = Math.min(cappedDays, uncertainCeilingDays);
  }
  return cappedDays;
}

export function getEasyDelayMs(progress, cadence = DEFAULT_CADENCE) {
  return msFromDays(getNextEasyIntervalDays(progress, cadence));
}

// If any of the last 3 flips were uncertain or unknown (sample < 1), the
// card is treated as uncertain and its interval is capped at capDays ×
// recent certainty (last-3 avg). Easy passes capDays:1 + floorMs:1h so the
// next 'easy' lands between 1 h and 1 day; Pass/Uncertain use the default
// capDays:7 (no floor — its own UNCERTAIN_MIN_MS handles the floor at the
// call site). Returns null when the rule does not apply.
export function getRecentUncertainCeilingMs(progress, { capDays = 7, floorMs = 0 } = {}) {
  const history = Array.isArray(progress?.confidenceHistory)
    ? progress.confidenceHistory.filter(Number.isFinite)
    : [];
  const last3 = history.slice(-3);
  if (!last3.length) return null;
  if (!last3.some(value => value < 1)) return null;
  const certainty = last3.reduce((sum, value) => sum + value, 0) / last3.length;
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
    return `${Math.max(1, Math.ceil(remaining / SRS_DAY_MS))}d`;
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
