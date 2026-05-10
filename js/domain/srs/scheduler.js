// SRS scheduling logic — pure functions, no state access
import { SRS_DAY_MS, SRS_AGAIN_MS, SRS_UNCERTAIN_MIN_MS, SRS_UNCERTAIN_MAX_MS, SRS_UNSPACED_RECOVERY_MS, SRS_GUIDE_STEPS_DAYS, SRS_MAX_INTERVAL_DAYS } from './constants.js';
import { clamp } from '../../utils/helpers.js';
import { getConfidencePct } from './confidence.js';

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

export function getNextEasyIntervalDays(progress) {
  const stage = getSrsStage(progress);
  const guideDays = SRS_GUIDE_STEPS_DAYS;

  // Guide phase: fixed ramp regardless of confidence
  if (stage < guideDays.length) return guideDays[stage];

  // Post-guide: derive multiplier from the last-10-flip confidence window.
  // Confidence pct → multiplier:
  //   90–100% → 2.5  (fast track to 30-day cap, ~2 more reviews to cap from 14d)
  //   70–89%  → 1.5–2.0  (steady confirmed growth)
  //   50–69%  → 1.2–1.4  (shaky, grow slowly)
  //   <50%    → 1.1  (got "easy" this flip but history is rough — don't over-reward)
  // Falls back to the stored ease factor when fewer than 5 flips are recorded.
  const history = Array.isArray(progress?.confidenceHistory)
    ? progress.confidenceHistory.filter(Number.isFinite)
    : [];
  let multiplier;
  if (history.length >= 5) {
    const pct = (history.reduce((s, v) => s + v, 0) / history.length) * 100;
    if (pct >= 90)      multiplier = 2.5;
    else if (pct >= 70) multiplier = 1.5 + (pct - 70) / 40;  // 1.5→2.0 across 70–90%
    else if (pct >= 50) multiplier = 1.2 + (pct - 50) / 100; // 1.2→1.4 across 50–70%
    else                multiplier = 1.1;
  } else {
    multiplier = getSrsEase(progress);
  }

  const previousDays = Math.max(
    guideDays[guideDays.length - 1],
    getLastEasyIntervalDays(progress),
    Number.isFinite(Number(progress?.intervalDays)) ? Math.max(0, Number(progress.intervalDays)) : 0
  );
  const proposedDays = previousDays * multiplier;
  return Math.min(SRS_MAX_INTERVAL_DAYS, Math.max(Math.round(proposedDays), Math.ceil(previousDays + 1)));
}

export function getEasyDelayMs(progress) {
  return msFromDays(getNextEasyIntervalDays(progress));
}

export function getUncertainDelayMs(progress) {
  // Delay for an 'uncertain/pass' outcome, tiered by recent confidence:
  //   <70%  → 1h floor (keep review pressure up before weekly quizzes)
  //   70–89% → ½ previous interval, capped at 1 week
  //   ≥90%  → ½ previous interval, capped at 30 days (normal easy-interval ceiling)
  const pct = getConfidencePct(progress);
  if (pct === null || pct < 70) return SRS_UNCERTAIN_MIN_MS;
  const prevIntervalDays = Number(progress?.intervalDays) || 0;
  if (prevIntervalDays <= 0) return SRS_UNCERTAIN_MIN_MS;
  const halfMs = msFromDays(prevIntervalDays * 0.5);
  const ceiling = pct >= 90
    ? msFromDays(SRS_MAX_INTERVAL_DAYS)
    : SRS_UNCERTAIN_MAX_MS;
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
