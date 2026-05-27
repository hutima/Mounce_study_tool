// Card selection / filtering helpers
import { isChapterKey, sourceHint, getChapterForKey, getWeekForKey } from './ordering.js';
import { isMorphCard } from '../grammar/explanations.js';
import { getConfidencePct } from '../srs/confidence.js';

// "Hard review" scope: cards the learner has missed more than 10 times and
// whose recent accuracy is still under 40%. Cards with no progress entry are
// excluded — they can't have been missed yet.
export const HARD_VOCAB_MIN_FAILS = 10;
export const HARD_VOCAB_MAX_CONFIDENCE = 40;

export function isHardVocabCard(card, progressStore) {
  const progress = (progressStore || {})[card?.id];
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
