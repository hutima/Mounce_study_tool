// Card selection / filtering helpers
import { isChapterKey, sourceHint, getChapterForKey, getWeekForKey } from './ordering.js';
import { isMorphCard } from '../grammar/explanations.js';
import { getConfidencePct } from '../srs/confidence.js';

// "Hard review" scope: cards the learner has missed more than 10 times and
// whose recent accuracy is still under 40%. Cards with no progress entry are
// excluded — they can't have been missed yet.
export const HARD_VOCAB_MIN_FAILS = 10;
export const HARD_VOCAB_MAX_CONFIDENCE = 40;

// Derived second-aorist cards (the "Second aorists as cards" toggle) carry a
// `::2aor` deck-id suffix so deck mechanics — archive marks, cycle state,
// saved deck order — track them separately, but their *stats* live on the
// base card: every progress read/write strips the suffix, so reviewing
// εἶπον records onto λέγω's entry and analytics/confidence see one word.
export const SECOND_AORIST_ID_SUFFIX = '::2aor';
export function progressCardId(cardId) {
  const id = String(cardId == null ? '' : cardId);
  return id.endsWith(SECOND_AORIST_ID_SUFFIX) ? id.slice(0, -SECOND_AORIST_ID_SUFFIX.length) : id;
}

export function isHardVocabCard(card, progressStore) {
  const progress = (progressStore || {})[progressCardId(card?.id)];
  if (!progress) return false;
  if ((Number(progress.failCount) || 0) <= HARD_VOCAB_MIN_FAILS) return false;
  const pct = getConfidencePct(progress);
  return pct !== null && pct < HARD_VOCAB_MAX_CONFIDENCE;
}

export function filterHardVocabCards(cards, progressStore) {
  return (cards || []).filter(card => isHardVocabCard(card, progressStore));
}

function getSets() {
  return window.SETS && typeof window.SETS === 'object' ? window.SETS : {};
}

function stableKey(greek) {
  return typeof window.stableCardKey === 'function' ? window.stableCardKey(greek) : String(greek || '');
}

function formatHeadword(greek) {
  return typeof window.formatGreekHeadword === 'function' ? window.formatGreekHeadword(greek) : String(greek || '');
}

function detectPos(card) {
  return typeof window.detectPartOfSpeech === 'function' ? window.detectPartOfSpeech(card) : '';
}

function transliterate(text) {
  return typeof window.transliterateGreek === 'function' ? window.transliterateGreek(text) : String(text || '');
}

function parseSubKey(rawKey) {
  const match = rawKey.match(/^(.+)::sub::(.+)$/);
  return match ? { baseKey: match[1], sub: match[2] } : null;
}

// Multi-paradigm supplemental sets are selectable as individual grammar/morph
// sub-keys (base::grammar::N). Vocab can't be subdivided that way, so for vocab
// purposes a paradigm sub-key resolves to its base set.
function parseParadigmBaseKey(rawKey) {
  const match = rawKey.match(/^(.+)::(grammar|morph)::\d+$/);
  return match ? match[1] : null;
}

export function getSelectedVocabCards(keys, requiredFlag = false) {
  const cards = [];
  // A supplemental set's vocab pool is shared by its flat key and every one
  // of its grammar/morph paradigm sub-keys, so any combination of them must
  // only contribute that set's vocab once. (UI toggles enforce mutual
  // exclusion; this dedup is the safety net for imported state or future
  // call paths that don't.)
  const seenVocabBases = new Set();
  // Cumulative supplemental decks (e.g. "λύω — full paradigm") tag each
  // card with its own chapter so a single deck can carry forms introduced
  // across many chapters. When the selection contains numeric chapter keys
  // we cap those tagged cards at the max selected chapter, so the
  // cumulative deck only exposes forms the student has reached. Cards
  // without a card-level chapter are unaffected. With no numeric chapter
  // selected the cap is null and tagged cards all pass through.
  let maxSelectedChapter = 0;
  (keys || []).forEach(key => {
    const raw = String(key);
    if (isChapterKey(raw)) {
      const n = Number(raw);
      if (n > maxSelectedChapter) maxSelectedChapter = n;
    }
  });
  const chapterCap = maxSelectedChapter || null;
  (keys || []).forEach(key => {
    const rawKey = String(key);
    const sub = parseSubKey(rawKey);
    const paradigmBase = sub ? null : parseParadigmBaseKey(rawKey);
    const lookupKey = sub ? sub.baseKey : (paradigmBase || rawKey);
    // ::sub:: keys deliberately filter cards by sub-bucket below, so each
    // sub-key contributes a different slice of the same set's cards and must
    // not dedup against each other.
    if (!sub) {
      if (seenVocabBases.has(lookupKey)) return;
      seenVocabBases.add(lookupKey);
    }
    const set = getSets()[lookupKey];
    const setCards = Array.isArray(set?.cards) ? set.cards : [];
    if (!setCards.length) return;
    const setIsAdvanced = !!(set.advanced || set.type === 'advanced');
    setCards.forEach((card, idx) => {
      if (requiredFlag && !card.required) return;
      if (sub && String(card?.sub || '') !== sub.sub) return;
      const cardChapterRaw = Number(card?.chapter);
      const cardChapter = Number.isFinite(cardChapterRaw) ? cardChapterRaw : null;
      if (cardChapter && chapterCap && cardChapter > chapterCap) return;
      cards.push({
        ...card,
        kind: 'vocab',
        sourceKey: lookupKey,
        sourceLabel: sourceHint(lookupKey),
        chapter: cardChapter || getChapterForKey(lookupKey),
        week: getWeekForKey(lookupKey),
        supplemental: !!(set.supplemental || set.type === 'supplemental'),
        advanced: setIsAdvanced || !!card.advanced,
        id: `${lookupKey}-${idx}-${stableKey(card.g)}`
      });
    });
  });
  return cards;
}

// Folds oxia/tonos and iota-subscript spelling differences exactly like
// render.js's stemAltLookupKey: words.js types oxia accents and plain-η
// spellings (ἀποθνήσκω) where the flip set types monotonic tonos and
// iota-subscript (ἀποθνῄσκω); without the fold the lemma lookup below would
// silently miss most second aorists.
function flipLookupKey(g) {
  return String(g || '').normalize('NFD').replace(/ͅ/g, '').normalize('NFC');
}

// Second-aorist expansion (the "Second aorists as cards" advanced toggle):
// for every standard chapter-vocab verb with a recorded second aorist in the
// W3 flip set, add a standalone card for the aorist form (e.g. εἶπον "I said"
// for λέγω). The derived card keeps the parent's set metadata and required
// flag so required-only and hard-review scoping treat the pair alike, and
// gets a stable `::2aor` id suffix for deck mechanics — while its stats land
// on the parent's progress entry via progressCardId above. Supplemental,
// advanced, and flip cards are left alone — same rule as the render-side
// stem annotations.
//
// Placement: each aorist is woven into its own chapter's run of cards about
// half the run away from its present-stem parent (circularly), not appended
// right after it — back-to-back the present gives the aorist away in an
// unshuffled deck. The offset is deterministic, so the unshuffled order is
// stable across rebuilds; shuffled decks randomize it anyway.
export function expandSecondAoristCards(cards) {
  if (!Array.isArray(cards) || !cards.length) return cards || [];
  const flip = window.SUPPLEMENTAL_VOCAB_SETS && window.SUPPLEMENTAL_VOCAB_SETS.W3_SECOND_AORIST_FLIP;
  const flipCards = flip && Array.isArray(flip.cards) ? flip.cards : [];
  if (!flipCards.length) return cards;
  const byLemma = {};
  for (const c of flipCards) {
    if (c && c.stemFlip && c.g && c.aorist) byLemma[flipLookupKey(c.g)] = c;
  }
  const out = [];
  // Current contiguous same-sourceKey run, plus the aorists derived from it
  // (with each parent's index within the run) awaiting placement.
  let run = [];
  let runKey;
  let pending = [];
  const flushRun = () => {
    pending.forEach(({ card, parentIdx }) => {
      const target = (parentIdx + Math.ceil(run.length / 2)) % (run.length + 1);
      run.splice(target, 0, card);
    });
    out.push(...run);
    run = [];
    pending = [];
  };
  cards.forEach(card => {
    const key = card ? card.sourceKey : undefined;
    if (run.length && key !== runKey) flushRun();
    runKey = key;
    const parentIdx = run.length;
    run.push(card);
    if (!card || card.advanced || card.supplemental || card.stemFlip || card.secondAoristOf) return;
    const entry = byLemma[flipLookupKey(card.g)];
    if (!entry) return;
    pending.push({
      parentIdx,
      card: {
        ...card,
        g: entry.aorist,
        e: entry.aoristGloss || card.e,
        secondAoristOf: card.g,
        secondAoristStem: entry.stem || '',
        id: `${card.id}${SECOND_AORIST_ID_SUFFIX}`
      }
    });
  });
  flushRun();
  return out;
}

export function getSelectedGrammarCards(keys) {
  const morphCards = window.buildMorphologyCardsForKeys ? window.buildMorphologyCardsForKeys(keys || []) : [];
  const grammarCards = window.buildGrammarCardsForKeys ? window.buildGrammarCardsForKeys(keys || []) : [];
  return [...morphCards, ...grammarCards];
}

function isAdvancedSet(set) {
  return !!(set && (set.advanced || set.type === 'advanced'));
}

function isSupplementalSet(set) {
  return !!(set && (set.supplemental || set.type === 'supplemental'));
}

export function getAllVocabKeys() {
  // Course-wide keys exclude Advanced bonus vocab and supplemental sets so
  // they never inflate course completion analytics. Selecting those buckets
  // still loads their cards via getSelectedVocabCards.
  const sets = getSets();
  return Object.keys(sets).filter(key => !isAdvancedSet(sets[key]) && !isSupplementalSet(sets[key]));
}

export function getAllChapterKeys() {
  return Object.keys(getSets()).filter(isChapterKey).sort((a, b) => Number(a) - Number(b));
}

export function getAllVocabCards(requiredFlag = false) {
  return getSelectedVocabCards(getAllVocabKeys(), requiredFlag);
}

export function getAllGrammarCards() {
  const allKeys = getAllVocabKeys();
  const morphCards = window.buildMorphologyCardsForKeys ? window.buildMorphologyCardsForKeys(allKeys) : [];
  const grammarCards = window.buildGrammarCardsForKeys ? window.buildGrammarCardsForKeys(allKeys) : [];
  return [...morphCards, ...grammarCards];
}

export function getChapterVocabCards(chapterKey, requiredFlag = false) {
  return getSelectedVocabCards([String(chapterKey)], requiredFlag);
}

export function getChapterGrammarCards(chapterKey) {
  return getSelectedGrammarCards([String(chapterKey)]);
}

export function getCardReviewLeft(card) {
  if (isMorphCard(card)) return card.form || '\u2014';
  return formatHeadword(card.g);
}

export function getCardReviewRight(card) {
  if (isMorphCard(card)) return card.answer || '\u2014';
  return card.e || '\u2014';
}

export function getCardMetaLine(card) {
  if (isMorphCard(card)) {
    const bits = [card.lemma, card.gloss ? `"${card.gloss}"` : '', card.family].filter(Boolean);
    return bits.join(' \u00B7 ');
  }
  return detectPos(card);
}

export function getCardAuxLine(card) {
  if (isMorphCard(card)) {
    return `${card.sourceLabel}${card.family ? ` \u00B7 ${card.family}` : ''}`;
  }
  return transliterate(formatHeadword(card.g));
}
