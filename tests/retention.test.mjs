import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as Retention from '../js/domain/deck/retention.js';
import { getBatch, rateBatch, sanitizeSessions } from '../js/domain/deck/retention.js';
import { getUnspacedArchiveDayKey } from '../js/utils/time.js';
import { progressCardId } from '../js/domain/deck/filters.js';
import { addVariantFaceSample, recordVariantRoundConfidence } from '../js/domain/srs/confidence.js';

const cards = Array.from({ length: 700 }, (_, i) => ({ id: `card-${i}`, due: i < 80 }));

test('20 base cards include all virtual faces without using extra slots', () => {
  const families = Array.from({ length: 40 }, (_, i) => [
    { id: `word-${i}` }, { id: `word-${i}::2aor` }, { id: `word-${i}::mi::0` }
  ]).flat();
  const batch = getBatch({}, 'families', families, () => true, Math.random, c => progressCardId(c.id));
  assert.equal(new Set(batch.ids.map(progressCardId)).size, 20);
  assert.equal(batch.ids.length, 60);
  for (const id of batch.ids) {
    const base = progressCardId(id);
    assert.ok(batch.ids.includes(base) && batch.ids.includes(`${base}::2aor`) && batch.ids.includes(`${base}::mi::0`));
  }
  const restored = sanitizeSessions({ families: batch }).families;
  assert.deepEqual(restored.ids, batch.ids, 'saving must not truncate the virtual faces at 20');
  assert.deepEqual(restored.pending, batch.pending);
});

test('legacy and partially reviewed batches acquire missing enabled siblings', () => {
  const family = [{ id: 'say' }, { id: 'say::2aor' }, { id: 'say::perfact' }];
  const sessions = { deck: { ids: ['say'], pending: [], savedAt: Date.now() } };
  const batch = getBatch(sessions, 'deck', family, c => c.id !== 'say', Math.random, c => progressCardId(c.id));
  assert.deepEqual(batch.ids, family.map(c => c.id));
  assert.deepEqual([...batch.pending].sort(), ['say::2aor', 'say::perfact'].sort());
  assert.equal(batch.groupsVersion, 2);
  const saved = JSON.parse(JSON.stringify(sessions));
  assert.deepEqual(getBatch(saved, 'deck', family, () => false, Math.random, c => progressCardId(c.id)).pending, batch.pending);
});

test('a word with only one eligible face brings its siblings without importing unrelated words', () => {
  const family = [{ id: 'say' }, { id: 'say::2aor' }, { id: 'unrelated' }];
  const batch = getBatch({}, 'deck', family, c => c.id === 'say::2aor', Math.random, c => progressCardId(c.id));
  assert.deepEqual(batch.ids, ['say', 'say::2aor']);
  assert.deepEqual(batch.pending, ['say::2aor']);
});

test('enabling more virtual forms expands the same batch without sampling new base cards', () => {
  const sessions = {};
  const scope = [{ id: 'say' }, { id: 'say::2aor' }];
  const batch = getBatch(sessions, 'deck', scope, () => true, () => 0.9999, c => progressCardId(c.id));
  rateBatch(batch, 'easy');
  const expanded = [...scope, { id: 'say::perfact' }, { id: 'unrelated' }];
  getBatch(sessions, 'deck', expanded, () => true, Math.random, c => progressCardId(c.id));
  assert.deepEqual(batch.ids, ['say', 'say::2aor', 'say::perfact']);
  assert.deepEqual([...batch.pending].sort(), ['say::2aor', 'say::perfact'].sort());
});

function loadRetentionFlow(spacedRepetition, deckCards = cards) {
  const source = readFileSync(new URL('../js/app/main.js', import.meta.url), 'utf8');
  const start = source.indexOf('function isRetentionActive()');
  const end = source.indexOf('function buildStudyDeck(', start);
  const elements = new Map();
  const scheduled = new Set();
  const calls = [];
  const runtime = {
    retentionMode: true, retentionSessions: {}, studyMode: 'vocab',
    originalDeck: deckCards, marks: {}, spacedRepetition,
    selectedKeys: ['1'], directionToGreek: false, deck: []
  };
  const context = vm.createContext({
    runtime, Retention,
    shuffleArray: cards => [...cards].reverse(),
    maybeAutoResetUnspacedArchives() {}, noteUnspacedArchiveActivity() {},
    progressCardId, getVariantCycleInfo: () => null,
    getDeckStateKey: () => `${runtime.directionToGreek}:${runtime.selectedKeys.join(',')}:${runtime.spacedRepetition}`,
    isCardDue: card => card.due && !scheduled.has(card.id),
    noteStudyInteraction() {}, clearSpacedUndoSnapshot() {},
    applySpacedReview(card, outcome) { calls.push(outcome); if (outcome !== 'again') scheduled.add(card.id); },
    recordStudyOutcome(id, outcome) { calls.push(outcome); },
    applyUnspacedSharedSchedule() {}, saveState() {}, renderCard() {},
    renderProgress() {}, renderReview() {}, isAnalyticsModalOpen: () => false,
    document: { getElementById(id) {
      if (!elements.has(id)) elements.set(id, { textContent: '', innerHTML: '', style: {} });
      return elements.get(id);
    } }
  });
  vm.runInContext(source.slice(start, end), context);
  runtime.deck = context.buildRetentionDeck();
  return { context, runtime, elements, calls };
}

function loadVariantFlow() {
  const family = [{ id: 'say', due: true }, { id: 'say::2aor', due: true }, { id: 'say::perfact', due: true }];
  const flow = loadRetentionFlow(true, family);
  const ctx = flow.context;
  const progress = {};
  Object.assign(ctx, {
    clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
    SRS_VARIANT_HOLD_MS: 2 * 60 * 60 * 1000,
    getDirectionalProgressStore: () => progress,
    getDirectionalMarksStore: () => flow.runtime.marks,
    derivedCardFaceKey: card => card.id.includes('::') ? card.id.split('::').slice(1).join('::') : 'base',
    addVariantFaceSample, recordVariantRoundConfidence,
    getActiveCadence: () => ({}),
    setProgressDelay(p, delay, now) { p.dueAt = now + delay; p.intervalDays = delay / 86400000; },
    applyCorrectOutcome(p, cadence, now) { p.dueAt = now + 86400000; flow.calls.push('scheduled'); },
    recordStudyOutcome(id, outcome) { flow.calls.push(outcome); return ctx.getWordProgress(id, { persist: true }); }
  });
  const source = readFileSync(new URL('../js/app/main.js', import.meta.url), 'utf8');
  // Exercise the actual shared-progress scheduler and round bookkeeping.
  vm.runInContext(source.slice(source.indexOf('function getWordProgress('), source.indexOf('function sortCardsByDue(')), ctx);
  vm.runInContext(source.slice(source.indexOf('function applySpacedReview('), source.indexOf('function getDueCount(')), ctx);
  flow.runtime.deck = ctx.buildRetentionDeck();
  return { ...flow, progress };
}

test('shared split-card rounds stay in the batch after Uncertain and schedule only after all Easy', () => {
  const { context: flow, runtime, progress, calls } = loadVariantFlow();
  assert.equal(runtime.deck.length, 3);
  flow.retentionMark('easy');
  assert.equal(runtime.deck.length, 2);
  assert.equal(flow.retentionCounts(flow.retentionBatch()).done, 0);
  flow.retentionMark('pass');
  assert.equal(runtime.deck.length, 2);
  flow.retentionMark('easy');
  assert.equal(runtime.deck.length, 3, 'Uncertain resets the complete shared set in this batch');
  assert.equal(flow.retentionCounts(flow.retentionBatch()).done, 0);
  for (let i = 0; i < 3; i++) flow.retentionMark('easy');
  assert.equal(runtime.deck.length, 0);
  assert.equal(flow.retentionCounts(flow.retentionBatch()).done, 1);
  assert.equal(calls.filter(c => c === 'scheduled').length, 1);
  assert.ok(progress.say.dueAt > Date.now());
});

test('an expired shared round requeues its cleared siblings instead of falsely finishing the batch', () => {
  const { context: flow, runtime, progress } = loadVariantFlow();
  flow.retentionMark('easy');
  assert.equal(runtime.deck.length, 2);
  progress.say.cycleStartedAt = Date.now() - 3 * 60 * 60 * 1000;
  progress.say.dueAt = Date.now() - 1;
  runtime.deck = flow.buildRetentionDeck();
  assert.equal(runtime.deck.length, 3);
  assert.equal(flow.retentionCounts(flow.retentionBatch()).done, 0);
  for (let i = 0; i < 3; i++) flow.retentionMark('easy');
  assert.equal(runtime.deck.length, 0);
});

for (const spaced of [true, false]) test(`app flow completes and resumes batches (${spaced ? 'spaced' : 'unspaced'})`, () => {
  const { context: flow, runtime, elements, calls } = loadRetentionFlow(spaced);
  const original = Array.from(runtime.deck, c => c.id);
  flow.nextRetentionBatch();
  assert.deepEqual(Array.from(runtime.deck, c => c.id), original, 'cannot advance unfinished batch');
  flow.retentionMark('pass');
  assert.equal(runtime.deck.length, 20, 'Uncertain repeats immediately even when scheduled ahead');
  flow.retentionMark('again');
  flow.retentionNavigate(1);
  assert.equal(calls.length, 2, 'skip never grades');
  flow.retentionMark('easy');
  assert.equal(runtime.deck.length, 19);
  flow.renderRetentionProgress();
  assert.match(elements.get('progressText').textContent, /1 \/ 20 base cards completed/);
  runtime.retentionSessions = sanitizeSessions(JSON.parse(JSON.stringify(runtime.retentionSessions)));
  const remaining = Array.from(runtime.deck, c => c.id);
  runtime.deck = flow.buildRetentionDeck();
  assert.deepEqual(Array.from(runtime.deck, c => c.id), remaining);
  while (runtime.deck.length) flow.retentionMark('easy');
  const area = { innerHTML: '' };
  assert.equal(flow.renderRetentionComplete(area), true);
  assert.match(area.innerHTML, /Batch complete/);
  assert.equal(flow.buildRetentionDeck().length, 0, 'waits at completion');
  flow.nextRetentionBatch();
  assert.equal(runtime.deck.length, 20);
  assert.ok(runtime.deck.every(card => !original.includes(card.id)));
  const next = Array.from(runtime.deck, c => c.id);
  runtime.directionToGreek = true;
  runtime.deck = flow.buildRetentionDeck();
  runtime.directionToGreek = false;
  runtime.deck = flow.buildRetentionDeck();
  assert.deepEqual(Array.from(runtime.deck, c => c.id), next);
  runtime.studyMode = 'morph';
  assert.equal(flow.retentionMark('easy'), false, 'other study modes retain their own behavior');
});

test('samples 20 distinct cards exclusively from the eligible selection', () => {
  const batch = getBatch({}, 'deck', cards, card => card.due);
  assert.equal(batch.ids.length, 20);
  assert.equal(new Set(batch.ids).size, 20);
  assert.ok(batch.ids.every(id => cards.find(card => card.id === id).due));
  assert.deepEqual([...batch.pending].sort(), [...batch.ids].sort());
});

test('small, empty, and duplicate pools never invent cards', () => {
  assert.equal(getBatch({}, 'small', cards.slice(0, 7), () => true).ids.length, 7);
  assert.deepEqual(getBatch({}, 'empty', cards, () => false).ids, []);
  const duplicate = [cards[0], cards[0], cards[1]];
  assert.equal(getBatch({}, 'dup', duplicate, () => true).ids.length, 2);
});

test('Hard, Uncertain, and skip stay in the same batch until Easy', () => {
  const sessions = {};
  const batch = getBatch(sessions, 'deck', cards, card => card.due);
  const original = [...batch.ids];
  for (const outcome of ['again', 'pass', 'skip']) {
    const id = batch.pending[0];
    rateBatch(batch, outcome);
    assert.equal(batch.pending.at(-1), id);
    assert.equal(batch.pending.length, 20);
    assert.deepEqual(batch.ids, original);
  }
  rateBatch(batch, 'easy');
  assert.equal(batch.pending.length, 19);
  // Resuming ignores due-date changes for the already selected batch.
  assert.equal(getBatch(sessions, 'deck', cards, () => false), batch);
  while (batch.pending.length) rateBatch(batch, 'easy');
  assert.equal(getBatch(sessions, 'deck', cards, () => true).pending.length, 0);
  assert.deepEqual(batch.ids, original, 'completed batches wait for explicit next');
});

test('serialized progress resumes exactly and selections have independent batches', () => {
  const sessions = {};
  const first = getBatch(sessions, 'g2e:chapter1', cards, () => true);
  rateBatch(first, 'easy');
  const restored = sanitizeSessions(JSON.parse(JSON.stringify(sessions)));
  assert.deepEqual(getBatch(restored, 'g2e:chapter1', cards, () => false).pending, first.pending);
  getBatch(restored, 'e2g:chapter2', cards.slice(30, 60), () => true);
  assert.deepEqual(restored['g2e:chapter1'].pending, first.pending);
  delete restored['g2e:chapter1'];
  const next = getBatch(restored, 'g2e:chapter1', cards.slice(100, 150), () => true);
  assert.ok(next.ids.every(id => Number(id.slice(5)) >= 100));
});

test('restoring filters corrupt queues, limits size, and drops removed cards', () => {
  const sanitized = sanitizeSessions({ bad: null, deck: { ids: ['a', 'a', 'b', 1], pending: ['b', 'x', 'b'], savedAt: 0 } });
  assert.deepEqual(sanitized.deck.ids, ['a', 'b']);
  assert.deepEqual(sanitized.deck.pending, ['b']);
  const batch = getBatch(sanitized, 'deck', [{ id: 'a' }], () => true);
  assert.deepEqual(batch.ids, ['a']);
  assert.deepEqual(batch.pending, []);
  assert.deepEqual(sanitizeSessions([]), {});
  const many = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [String(i), { ids: ['a'], pending: ['a'], savedAt: i }]));
  assert.equal(Object.keys(sanitizeSessions(many)).length, 16);
});


for (const spaced of [true, false]) test(`pick new 20 works before completion and preserves reviews (${spaced ? 'spaced' : 'unspaced'})`, () => {
  const { context: flow, runtime, calls } = loadRetentionFlow(spaced);
  const original = runtime.deck.map(card => card.id);
  flow.retentionMark('easy');
  const marked = { ...runtime.marks };
  const graded = [...calls];
  flow.pickNewRetentionBatch();
  assert.equal(runtime.deck.length, 20);
  assert.ok(runtime.deck.every(card => !original.includes(card.id)));
  assert.deepEqual(runtime.marks, marked);
  assert.deepEqual(calls, graded, 'replacing a batch never grades or postpones cards');
  const saved = sanitizeSessions(JSON.parse(JSON.stringify(runtime.retentionSessions)));
  const pending = Array.from(runtime.deck, card => card.id);
  runtime.retentionSessions = saved;
  runtime.deck = flow.buildRetentionDeck();
  assert.deepEqual(Array.from(runtime.deck, card => card.id), pending);
});

test('replacement favors new words and fills a small pool without splitting families', () => {
  const families = Array.from({ length: 25 }, (_, i) => [{ id: `word-${i}` }, { id: `word-${i}::2aor` }]).flat();
  const sessions = {};
  const group = card => progressCardId(card.id);
  const first = getBatch(sessions, 'deck', families, () => true, () => 0, group);
  const second = getBatch(sessions, 'deck', families, () => true, () => 0, group, { replace: true });
  const oldWords = new Set(first.ids.map(progressCardId));
  const newWords = new Set(second.ids.map(progressCardId));
  assert.equal(newWords.size, 20);
  assert.equal([...newWords].filter(id => !oldWords.has(id)).length, 5);
  assert.equal(second.ids.length, 40);
  assert.deepEqual([...second.pending].sort(), [...second.ids].sort());
  const small = getBatch(sessions, 'small', families.slice(0, 6), () => true);
  rateBatch(small, 'easy');
  assert.equal(getBatch(sessions, 'small', families.slice(0, 6), () => true, Math.random, group, { replace: true }).pending.length, 6);
  assert.equal(getBatch(sessions, 'empty', families, () => false, Math.random, group, { replace: true }).ids.length, 0);
});

test('batch day rolls at 5 AM, independently of save time and reloads', () => {
  const at = (day, hour, minute = 0) => new Date(2026, 10, day, hour, minute).getTime();
  const sessions = {};
  const batch = getBatch(sessions, 'deck', cards, card => card.due, () => 0, undefined, { now: at(24, 23) });
  rateBatch(batch, 'easy');
  assert.equal(batch.dayKey, '2026-11-24');
  const restored = sanitizeSessions(JSON.parse(JSON.stringify(sessions)));
  assert.equal(getBatch(restored, 'deck', cards, () => false, () => 0, undefined, { now: at(25, 4, 59) }).pending.length, 19);
  assert.equal(restored.deck.dayKey, '2026-11-24', 'resuming before cutoff must not move the day anchor');
  assert.equal(Retention.isBatchCurrent(restored.deck, at(25, 5)), false);
  const next = getBatch(restored, 'deck', cards, card => card.due, () => 0, undefined, { now: at(25, 5) });
  assert.equal(next.dayKey, '2026-11-25');
  assert.equal(next.pending.length, 20);
  assert.ok(next.ids.every(id => !batch.ids.includes(id)));
  while (next.pending.length) rateBatch(next, 'easy');
  assert.equal(getBatch(restored, 'deck', cards, () => true, () => 0, undefined, { now: at(25, 23) }).pending.length, 0);
  assert.equal(getBatch(restored, 'deck', cards, () => true, () => 0, undefined, { now: at(26, 5) }).pending.length, 20);
});

test('legacy batches use their last saved day and expired inactive selections refresh when revisited', () => {
  const old = new Date(2026, 10, 23, 12).getTime();
  const now = new Date(2026, 10, 24, 12).getTime();
  const sessions = sanitizeSessions({ deck: { ids: ['card-0'], pending: [], savedAt: old } });
  assert.equal(sessions.deck.dayKey, getUnspacedArchiveDayKey(old));
  const batch = getBatch(sessions, 'deck', cards, card => card.due, () => 0, undefined, { now });
  assert.equal(batch.pending.length, 20);
  assert.equal(batch.dayKey, getUnspacedArchiveDayKey(now));
});

test('foreground refresh and rating across cutoff rebuild without grading the stale card', () => {
  const { context: flow, runtime, calls } = loadRetentionFlow(true);
  const old = runtime.deck.map(card => card.id);
  runtime.retentionSessions[flow.getDeckStateKey()].dayKey = '2000-01-01';
  assert.equal(flow.retentionMark('easy'), true);
  assert.deepEqual(calls, []);
  assert.equal(runtime.deck.length, 20);
  assert.ok(runtime.deck.every(card => !old.includes(card.id)));
  assert.equal(flow.maybeRefreshRetentionDay(), false, 'fresh day does not replace the batch again');
});


test('completed unspaced retention is eligible again the next day even with the normal daily-reset toggle off', () => {
  const { context: flow, runtime } = loadRetentionFlow(false, cards.slice(0, 7));
  runtime.globalWordMarks = { g2e: runtime.marks, e2g: { reverse: 'known' }, morph: { grammar: 'known' } };
  runtime.unspacedAutoResetEnabled = false;
  Object.assign(flow, {
    getUnspacedArchiveDayKey,
    ensureDirectionalStores() {},
    getDirectionalMarksStore: () => runtime.globalWordMarks.g2e
  });
  const source = readFileSync(new URL('../js/app/main.js', import.meta.url), 'utf8');
  vm.runInContext(source.slice(source.indexOf('function noteUnspacedArchiveActivity('), source.indexOf('function getUnspacedCycleEntry(')), flow);
  while (runtime.deck.length) flow.retentionMark('easy');
  assert.equal(Object.keys(runtime.marks).length, 7);
  assert.equal(runtime.lastUnspacedArchiveDayKey, getUnspacedArchiveDayKey());
  runtime.lastUnspacedArchiveDayKey = '2000-01-01';
  runtime.retentionSessions[flow.getDeckStateKey()].dayKey = '2000-01-01';
  assert.equal(flow.maybeRefreshRetentionDay(), true);
  assert.equal(runtime.deck.length, 7, 'all archived words return to the next daily batch');
  assert.deepEqual(runtime.globalWordMarks.g2e, {});
  assert.deepEqual(runtime.globalWordMarks.e2g, {});
  assert.deepEqual(runtime.globalWordMarks.morph, { grammar: 'known' });
  runtime.retentionMode = false;
  runtime.lastUnspacedArchiveDayKey = '2000-01-01';
  runtime.marks.kept = 'known';
  assert.equal(flow.maybeAutoResetUnspacedArchives(), false, 'normal decks still honor their own toggle');
  assert.equal(runtime.marks.kept, 'known');
});


test('new-batch control is visible during retention and hides in other modes', () => {
  const { context: flow, runtime, elements } = loadRetentionFlow(true);
  flow.renderRetentionProgress();
  assert.equal(elements.get('pickNewRetentionBtn').style.display, '');
  runtime.studyMode = 'parsing';
  flow.renderRetentionProgress();
  assert.equal(elements.get('pickNewRetentionBtn').style.display, 'none');
});

test('Reshuffle delegates to picking a new retention batch', () => {
  const source = readFileSync(new URL('../js/ui/navigation.js', import.meta.url), 'utf8');
  const start = source.indexOf('export function reshuffleEligible()');
  const end = source.indexOf('function fastForwardScheduling(', start);
  let picked = 0;
  const context = vm.createContext({ host: {
    isRetentionActive: () => true,
    pickNewRetentionBatch: () => { picked++; }
  } });
  vm.runInContext(source.slice(start, end).replace('export function', 'function'), context);
  context.reshuffleEligible();
  assert.equal(picked, 1);
});


test('retention shuffles virtual faces initially and at each complete retry loop', () => {
  const family = ['a', 'a::2aor', 'a::mi::0', 'b', 'b::2aor', 'b::mi::0'].map(id => ({ id }));
  const batch = getBatch({}, 'shuffle', family, () => true, () => 0.5, c => progressCardId(c.id));
  assert.notDeepEqual(batch.pending, batch.ids, 'faces must not be dealt in family order');
  const before = [...batch.pending];
  const seen = [];
  for (let i = 0; i < before.length; i++) { seen.push(batch.pending[0]); rateBatch(batch, 'skip', () => 0.5); }
  assert.deepEqual(seen, before, 'every face gets its turn before the loop reshuffles');
  assert.notDeepEqual(batch.pending, before);
  assert.notEqual(batch.pending[0], seen.at(-1), 'avoid immediate repeat across the boundary');
  const saved = sanitizeSessions({ shuffle: batch });
  const resumed = getBatch(saved, 'shuffle', family, () => true, () => 0.5, c => progressCardId(c.id));
  assert.deepEqual(resumed.pending, batch.pending);
  assert.deepEqual(resumed.roundRemaining, batch.roundRemaining);
});


test('Shuffle cards retains the same batch, completion progress, and grades', () => {
  const { context: flow, runtime, calls } = loadRetentionFlow(true);
  flow.retentionMark('easy');
  const before = Array.from(runtime.deck, c => c.id);
  const graded = [...calls];
  flow.shuffleRetentionCards();
  assert.deepEqual(Array.from(runtime.deck, c => c.id), [...before].reverse());
  assert.deepEqual(calls, graded);
  assert.equal(flow.retentionCounts(flow.retentionBatch()).done, 1);
});
