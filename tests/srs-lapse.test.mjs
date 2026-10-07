import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function loadApplyHardLapse() {
  const source = readFileSync(new URL('../js/app/main.js', import.meta.url), 'utf8');
  const start = source.indexOf('function preLapseIntervalDays(progress)');
  const end = source.indexOf('// Uncertain lapse:', start);
  assert.ok(start >= 0 && end > start, 'expected hard-lapse source block');
  const snippet = source.slice(start, end);
  const context = {
    clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
    getLastEasyIntervalDays: progress => Math.max(0, Number(progress.lastEasyIntervalDays) || 0),
    getSrsStage: progress => Math.max(0, Math.floor(Number(progress.srsStage) || 0)),
    getSrsEase: progress => {
      const ease = Math.min(3, Math.max(1.3, Number(progress.ease) || 2.3));
      progress.ease = ease;
      return ease;
    },
    setProgressDelay: (progress, delayMs, now) => {
      progress.intervalDays = delayMs > 0 ? delayMs / (22 * 60 * 60 * 1000) : 0;
      progress.dueAt = now + delayMs;
    },
    msFromDays: days => days <= 1
      ? days * 22 * 60 * 60 * 1000
      : (22 + (days - 1) * 24) * 60 * 60 * 1000,
    SRS_HARD_RELEARN_STEPS: 2,
    LEECH_LAPSE_THRESHOLD: 4,
    LEECH_DRILL_DAYS: 1
  };
  vm.createContext(context);
  vm.runInContext(`${snippet}\nthis.__applyHardLapse = applyHardLapse;`, context);
  return context.__applyHardLapse;
}

const relaxed = { leechEnabled: true, lapseResumeCapDays: 14 };
const almostEqual = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ~= ${expected}`);

test('fresh-card Again retries never become lapses or leeches', () => {
  const applyHardLapse = loadApplyHardLapse();
  const progress = {
    streak: 0, easyStreak: 0, srsStage: 0, ease: 2.3,
    intervalDays: 0, lastEasyIntervalDays: 0,
    inRelearn: false, relearnLeft: 0, preLapseIntervalDays: 0,
    lapseCount: 0, leechDrill: false, leechStreak: 0
  };
  for (let n = 0; n < 6; n++) {
    const now = 1_800_000_000_000 + n * 1000;
    assert.equal(applyHardLapse(progress, relaxed, now), true);
    assert.equal(progress.dueAt, now);
  }
  assert.equal(progress.lapseCount, 0);
  assert.equal(progress.leechDrill, false);
  almostEqual(progress.ease, 2.3);
});

test('repeated Again in one established-card relearn episode counts one lapse', () => {
  const applyHardLapse = loadApplyHardLapse();
  const progress = {
    streak: 5, easyStreak: 5, srsStage: 4, ease: 2.3,
    intervalDays: 14, lastEasyIntervalDays: 14,
    inRelearn: false, relearnLeft: 0, preLapseIntervalDays: 0,
    lapseCount: 0, leechDrill: false, leechStreak: 0
  };
  applyHardLapse(progress, relaxed, 1_800_000_000_000);
  assert.equal(progress.lapseCount, 1);
  almostEqual(progress.ease, 2.1);
  assert.equal(progress.srsStage, 3);
  for (let n = 1; n <= 4; n++) {
    const now = 1_800_000_000_000 + n * 1000;
    assert.equal(applyHardLapse(progress, relaxed, now), true);
    assert.equal(progress.dueAt, now);
  }
  assert.equal(progress.lapseCount, 1);
  assert.equal(progress.leechDrill, false);
  almostEqual(progress.ease, 2.1);
  assert.equal(progress.srsStage, 3);
});

test('fourth genuine lapse marks a leech but Hard still retries in-session', () => {
  const applyHardLapse = loadApplyHardLapse();
  const now = 1_800_000_000_000;
  const progress = {
    streak: 5, easyStreak: 5, srsStage: 4, ease: 2.3,
    intervalDays: 14, lastEasyIntervalDays: 14,
    inRelearn: false, relearnLeft: 0, preLapseIntervalDays: 14,
    lapseCount: 3, leechDrill: false, leechStreak: 2
  };
  assert.equal(applyHardLapse(progress, relaxed, now), true);
  assert.equal(progress.lapseCount, 4);
  assert.equal(progress.leechDrill, true);
  assert.equal(progress.leechStreak, 0);
  assert.equal(progress.dueAt, now);
  assert.equal(applyHardLapse(progress, relaxed, now + 1000), true);
  assert.equal(progress.lapseCount, 4);
  assert.equal(progress.dueAt, now + 1000);
});
