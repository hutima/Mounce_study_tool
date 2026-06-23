// Confidence tracking and per-card XP award calculation — no state access

export function getConfidenceSample(outcome) {
  const normalized = String(outcome || '').toLowerCase();
  if (normalized === 'easy' || normalized === 'known') return 1;
  if (normalized === 'pass' || normalized === 'uncertain' || normalized === 'unsure') return 0.5;
  return 0;
}

export function recordConfidenceSample(progress, outcome) {
  const history = Array.isArray(progress.confidenceHistory) ? [...progress.confidenceHistory] : [];
  history.push(getConfidenceSample(outcome));
  progress.confidenceHistory = history.slice(-10);
  const avg = progress.confidenceHistory.length
    ? progress.confidenceHistory.reduce((sum, value) => sum + value, 0) / progress.confidenceHistory.length
    : 0;
  progress.confidence = avg * 5;
}

export function getConfidencePct(progress) {
  const history = Array.isArray(progress?.confidenceHistory) ? progress.confidenceHistory.filter(value => Number.isFinite(value)) : [];
  if (history.length) {
    const avg = history.reduce((sum, value) => sum + value, 0) / history.length;
    return Math.round(avg * 100);
  }
  const passCount = progress?.passCount || 0;
  const failCount = progress?.failCount || 0;
  const responseCount = passCount + failCount;
  return responseCount ? Math.round((passCount / responseCount) * 100) : null;
}

// ── Variant "split card" per-round confidence ───────────────────────────────
// A base verb and its derived principal-part faces (the "… as cards" toggles)
// share one progress entry. Rather than push one rolling sample per individual
// face review — which lets a single shaky form, repeated until known, dominate
// the history — the confidence for a split card is computed once per ROUND (one
// attempt at clearing every face, bounded by a 2 h window from when the set is
// first seen). During the round each face's outcome samples are collected in
// `cycleFaceSamples` (face → [0 | 0.5 | 1, …]); when the round ends the score is
// the mean across all active faces, where a face's value is the mean of its own
// samples and a face never reached this round counts as 0 (the learner left
// before getting to that form).

// Mean confidence across a round's faces. `siblingFaces` is every face active in
// the deck this round; an unseen face contributes 0.
export function computeVariantRoundConfidence(cycleFaceSamples, siblingFaces) {
  const samples = (cycleFaceSamples && typeof cycleFaceSamples === 'object') ? cycleFaceSamples : {};
  const faces = Array.isArray(siblingFaces) ? siblingFaces : Array.from(siblingFaces || []);
  if (!faces.length) return 0;
  let total = 0;
  faces.forEach(face => {
    const arr = samples[face];
    if (Array.isArray(arr) && arr.length) {
      total += arr.reduce((sum, value) => sum + value, 0) / arr.length;
    }
    // else: face unseen this round → contributes 0
  });
  return total / faces.length;
}

// Append one outcome sample to a face's tally for the in-progress round.
export function addVariantFaceSample(progress, face, outcome) {
  if (!progress.cycleFaceSamples || typeof progress.cycleFaceSamples !== 'object' || Array.isArray(progress.cycleFaceSamples)) {
    progress.cycleFaceSamples = {};
  }
  const arr = Array.isArray(progress.cycleFaceSamples[face]) ? progress.cycleFaceSamples[face] : [];
  arr.push(getConfidenceSample(outcome));
  progress.cycleFaceSamples[face] = arr;
}

// Record one finalized round's confidence onto the shared rolling history (same
// 0..1 scale and 10-deep window as recordConfidenceSample) and refresh the
// derived 0..5 confidence. Mutates `progress`; returns the round sample.
export function recordVariantRoundConfidence(progress, siblingFaces) {
  const sample = computeVariantRoundConfidence(progress.cycleFaceSamples, siblingFaces);
  const history = Array.isArray(progress.confidenceHistory) ? [...progress.confidenceHistory] : [];
  history.push(sample);
  progress.confidenceHistory = history.slice(-10);
  const avg = progress.confidenceHistory.length
    ? progress.confidenceHistory.reduce((sum, value) => sum + value, 0) / progress.confidenceHistory.length
    : 0;
  progress.confidence = avg * 5;
  return sample;
}

// Per-review XP awards:
//   again/review  -> 1 XP
//   pass/uncertain -> 3 XP
//   easy/known (spaced, first confirmation) -> 10 XP
//   easy/known (spaced, subsequent)         ->  5 XP
//   easy/known (unspaced)                   ->  1 XP
export function computeCardXpAward(outcome, isFirstConfirmation, isSpaced) {
  const norm = String(outcome || '').toLowerCase();
  if (norm === 'easy' || norm === 'known') {
    if (!isSpaced) return 1;
    return isFirstConfirmation ? 10 : 5;
  }
  if (norm === 'pass' || norm === 'uncertain' || norm === 'unsure') return 3;
  return 1;
}
