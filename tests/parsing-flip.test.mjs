import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as Retention from '../js/domain/deck/retention.js';
import * as Paradigms from '../js/domain/grammar/paradigm_focus.js';
import { parseAnswerDimensions } from '../js/domain/grammar/morph_steps.js';

const main = readFileSync(new URL('../js/app/main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/ui/render.js', import.meta.url), 'utf8');
// Load the exact shipped data and registration order, without a browser.
const data = vm.createContext({ console, addEventListener() {}, document: { readyState: 'loading', addEventListener() {} } });
data.window = data;
for (const match of html.matchAll(/<script defer src="([^"?]+)\?[^\"]+"><\/script>/g)) {
  vm.runInContext(readFileSync(new URL(`../${match[1]}`, import.meta.url), 'utf8'), data);
}
globalThis.window = data;

function flow() {
  const elements = new Map();
  const runtime = {
    studyMode: 'parsing', parsingFlipMode: true, parsingChapter: 36,
    parsingLookup: false, parsingReverse: false, parsingShuffleAll: false,
    parsingCustomReview: false, morphFocusedParadigm: 'λύω', selectedKeys: ['36'],
    shuffled: false, includeOptionalForms: false, dimValueFilters: {},
    optionalFormFilters: {}, paradigmStepStats: { keep: 'existing attempts' },
    globalWordProgress: { keep: 'existing schedule' }, globalWordMarks: { keep: 'known' },
    appGamification: { xp: 123 }, deck: []
  };
  const ctx = vm.createContext({
    ...Paradigms, runtime, Retention,
    isParsingIncompatibleLemma: () => false,
    isParsingMode: () => runtime.studyMode === 'parsing',
    getAggregateSelectionKeys: () => [String(runtime.parsingChapter)],
    getSelectedCustomParadigmLemmas: () => [],
    ensureMorphFocusedParadigm() {}, applyExcludeKnownMorphsFilter: cards => cards,
    shuffleArray: cards => [...cards].reverse(),
    renderCard() {}, renderProgress() {}, renderReview() {}, saveState() {},
    resetMorphStepState() {}, resetMorphAnswerState() {}, saveCurrentDeckStateToBank() {}, syncToggleButtons() {},
    rebuildMorphDeckForStepMode() { runtime.originalDeck = ctx.buildFilteredFocusedParadigmCards(); runtime.deck = ctx.buildParsingFlipDeck(runtime.originalDeck); },
    recordStudyOutcome() { throw Error('recognition must never record a grade'); },
    applySpacedReview() { throw Error('recognition must never schedule'); },
    document: { getElementById(id) { if (!elements.has(id)) elements.set(id, { style: {}, innerHTML: '', textContent: '' }); return elements.get(id); } }
  });
  vm.runInContext(main.slice(main.indexOf('function isParsingFlipActive()'), main.indexOf('function isRetentionActive()')), ctx);
  vm.runInContext(main.slice(main.indexOf('function buildFilteredFocusedParadigmCards()'), main.indexOf('// Status-weighted ordering for the parsing deck.')), ctx);
  runtime.originalDeck = ctx.buildFilteredFocusedParadigmCards();
  runtime.deck = ctx.buildParsingFlipDeck(runtime.originalDeck);
  return { ctx, runtime, elements };
}

test('recognition uses one real root and all rating controls leave recorded stats unchanged', () => {
  const { ctx, runtime } = flow();
  assert.ok(runtime.deck.length > 10);
  assert.ok(runtime.deck.every(c => c.lemma === 'λύω'));
  const snapshot = JSON.stringify([runtime.paradigmStepStats, runtime.globalWordProgress, runtime.globalWordMarks, runtime.appGamification]);
  const total = runtime.deck.length;
  for (const outcome of ['again', 'pass', 'skip']) {
    const first = runtime.deck[0].id;
    ctx.parsingFlipMark(outcome);
    assert.equal(runtime.deck.length, total);
    assert.equal(runtime.deck.at(-1).id, first);
  }
  ctx.parsingFlipNavigate(1);
  ctx.parsingFlipMark('easy');
  assert.equal(runtime.deck.length, total - 1);
  while (runtime.deck.length) ctx.parsingFlipMark('easy');
  assert.equal(ctx.parsingFlipNavigate(1), true);
  assert.equal(runtime.deck.length, 0, 'completion waits for explicit restart');
  ctx.restartParsingFlip();
  assert.equal(runtime.deck.length, total);
  assert.equal(JSON.stringify([runtime.paradigmStepStats, runtime.globalWordProgress, runtime.globalWordMarks, runtime.appGamification]), snapshot);
  runtime.studyMode = 'vocab';
  assert.equal(ctx.parsingFlipMark('easy'), false);
  assert.equal(ctx.parsingFlipNavigate(1), false);
});

test('chapter, optional forms, and parsing value filters control the actual recognition pool', () => {
  const { ctx, runtime } = flow();
  runtime.parsingChapter = 16;
  const early = ctx.buildFilteredFocusedParadigmCards();
  assert.ok(early.length > 0);
  assert.ok(early.every(c => !['future', 'aorist', 'perfect', 'pluperfect'].includes(parseAnswerDimensions(c.parsedAnswer || c.answer).tense)));
  runtime.parsingChapter = 36;
  runtime.morphFocusedParadigm = 'λύω — all forms';
  const baseline = ctx.buildFilteredFocusedParadigmCards();
  runtime.includeOptionalForms = true;
  const expanded = ctx.buildFilteredFocusedParadigmCards();
  assert.ok(expanded.length > baseline.length);
  runtime.dimValueFilters = { tense: { present: false } }; // excluded values are stored as false
  const filtered = ctx.buildFilteredFocusedParadigmCards();
  assert.ok(filtered.length > 0 && filtered.length < expanded.length);
  assert.ok(filtered.every(c => parseAnswerDimensions(c.parsedAnswer || c.answer).tense !== 'present'));
});

test('syncretic Greek forms share one card with all in-scope answers', () => {
  const { ctx } = flow();
  const cards = [
    { id: 'a', lemma: 'λύω', form: 'ἔλυον', parsedAnswer: 'imperfect active indicative first singular' },
    { id: 'b', lemma: 'λύω', form: 'ἔλυον', parsedAnswer: 'imperfect active indicative third plural' }
  ];
  const queue = ctx.buildParsingFlipDeck(cards);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].recognitionAnswers.length, 2);
});

test('enabling recognition clears incompatible modes and chooses a testable root', () => {
  const { ctx, runtime } = flow();
  runtime.parsingFlipMode = false;
  runtime.parsingLookup = runtime.parsingReverse = runtime.parsingShuffleAll = runtime.parsingCustomReview = true;
  runtime.morphFocusedParadigm = '__shuffleAllToChapter__';
  ctx.toggleParsingFlipMode();
  assert.equal(runtime.parsingFlipMode, true);
  assert.ok(!runtime.parsingLookup && !runtime.parsingReverse && !runtime.parsingShuffleAll && !runtime.parsingCustomReview);
  assert.ok(Paradigms.listAvailableParadigms(['36']).some(p => p.lemma === runtime.morphFocusedParadigm));
  assert.ok(runtime.morphFocusedParadigm !== 'Liquid-stem futures');
  ctx.toggleParsingFlipMode();
  assert.equal(runtime.parsingFlipMode, false);
});

test('flip renderer reveals answers without initializing a parsing walk and handles completion', () => {
  const { ctx, runtime, elements } = flow();
  ctx.parseAnswerDimensions = parseAnswerDimensions;
  ctx.host = { getEnabledParsingDims: () => ({ aspect: false, voice: false }) };
  ctx.escapeHtml = text => String(text).replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  vm.runInContext(render.slice(render.indexOf('const VERB_GLOSS ='), render.indexOf('// A short, affirmative')), ctx);
  vm.runInContext(render.slice(render.indexOf('function renderParsingFlipCard('), render.indexOf('// ─── Step-by-step paradigm rendering')), ctx);
  const area = { innerHTML: '' };
  ctx.renderParsingFlipCard(area);
  assert.match(area.innerHTML, /card-front/);
  assert.match(area.innerHTML, /card-back/);
  assert.match(area.innerHTML, /Parsing and meaning/);
  assert.doesNotMatch(area.innerHTML, /answerMorphologyStep|active ·|continuous/);
  assert.match(area.innerHTML, /untie|loose|destroy/);
  runtime.deck = [];
  ctx.renderParsingFlipCard(area);
  assert.match(area.innerHTML, /Recognition deck complete/);
  assert.match(area.innerHTML, /restartParsingFlip/);
  assert.equal(elements.get('markRow').style.display, 'none');
});

test('completed retention and recognition action buttons do not open the lesson selector', () => {
  let listener, opened = 0;
  class Element {
    constructor(button) { this.button = button; }
    closest(selector) {
      if (selector === '.empty-state') return {};
      return this.button ? {} : null;
    }
  }
  const ctx = vm.createContext({ Element, openStudySelector: () => { opened++; }, document: { getElementById: () => ({ addEventListener(type, callback) { listener = callback; } }) } });
  vm.runInContext(main.slice(main.indexOf("const cardArea = document.getElementById('cardArea');", main.indexOf('const GLOBAL_CLICK_HANDLERS')), main.indexOf('\nstartUsageTracking();')), ctx);
  listener({ target: new Element(true) });
  assert.equal(opened, 0, 'nested action button is handled only by its own click');
  listener({ target: new Element(false) });
  assert.equal(opened, 1, 'plain empty-state content still opens the selector');
});

test('top menu order and recognition default are explicit', () => {
  assert.ok(html.indexOf('id="modeShortcutParsingBtn"') < html.indexOf('id="modeShortcutMorphBtn"'));
  assert.match(html, /id="modeShortcutMorphBtn"[^>]+>Quiz<\/button>/);
  assert.match(readFileSync(new URL('../js/state/runtime.js', import.meta.url), 'utf8'), /parsingFlipMode: false/);
});


test('recognition reshuffle keeps Easy-cleared forms out until explicit restart', () => {
  const { ctx, runtime } = flow();
  const cleared = runtime.deck[0].id;
  const total = runtime.deck.length;
  ctx.parsingFlipMark('easy');
  ctx.shuffleParsingFlip(true);
  assert.equal(runtime.deck.length, total - 1);
  assert.ok(runtime.deck.every(c => c.id !== cleared));
  ctx.shuffleParsingFlip(false);
  assert.ok(runtime.deck.every(c => c.id !== cleared));
  ctx.restartParsingFlip();
  assert.equal(runtime.deck.length, total);
});
