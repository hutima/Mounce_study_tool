// Card selection / filtering helpers
import { isChapterKey, isBookKey, sourceHint, getChapterForKey, getWeekForKey } from './ordering.js';
import { isMorphCard } from '../grammar/explanations.js';
import { getConfidencePct } from '../srs/confidence.js';

// "Hard review" scope: cards the learner has missed more than 10 times and
// whose recent accuracy is still under 40%. Cards with no progress entry are
// excluded — they can't have been missed yet.
export const HARD_VOCAB_MIN_FAILS = 10;
export const HARD_VOCAB_MAX_CONFIDENCE = 40;

// Irregular "split cards" toggles ("Variant forms as cards"). Each derives
// standalone cards for a verb's non-present principal part from the matching
// present-tense verb already in the deck — the generalization of the original
// "Second aorists as cards" behaviour to every stem-flip set Mounce ships. A
// config maps a flip set to a deck-id `tag`, a render label, a short form-tag,
// and the Mounce chapter where the concept is taught (the "default on when that
// chapter is selected" rule). `multi` flags sets that contribute several
// principal parts per present lemma (the μι-verbs), which need an index in the
// id so they don't collide.
export const IRREGULAR_CARD_CONFIGS = [
  { tag: '2aor',    flipKey: 'W3_SECOND_AORIST_FLIP',           label: '2 aor. of',     short: 'aor',      chapter: 22 },
  { tag: 'lfut',    flipKey: 'W3_LIQUID_FUTURE_FLIP',           label: 'fut. of',       short: 'fut',      chapter: 20 },
  { tag: 'aorpass', flipKey: 'W3_AORIST_PASSIVE_FLIP',          label: 'aor. pass. of', short: 'aor pass', chapter: 24 },
  { tag: 'perfact', flipKey: 'W3_PERFECT_ACTIVE_FLIP',          label: 'pf. of',        short: 'pf',       chapter: 25 },
  { tag: 'mi',      flipKey: 'W4_MI_VERB_PRINCIPAL_PARTS_FLIP', label: 'of',            chapter: 34, multi: true }
];

const IRREGULAR_TAGS = IRREGULAR_CARD_CONFIGS.map(c => c.tag);

// Matches a derived-card id suffix: `::<tag>` optionally followed by `::<n>`
// (the index disambiguates μι-verbs). Derived cards carry it so deck mechanics
// — archive marks, cycle state, saved deck order — track them separately, but
// their *stats* live on the base card: progressCardId strips the suffix, so
// reviewing εἶπον records onto λέγω's entry and analytics/confidence see one
// word. The legacy `::2aor` suffix is one of these, so old saved-deck ids still
// resolve unchanged.
const DERIVED_ID_SUFFIX_RE = new RegExp(`::(?:${IRREGULAR_TAGS.join('|')})(?:::\\d+)?$`);

// Back-compat alias for the original single-suffix constant.
export const SECOND_AORIST_ID_SUFFIX = '::2aor';

export function progressCardId(cardId) {
  const id = String(cardId == null ? '' : cardId);
  return id.replace(DERIVED_ID_SUFFIX_RE, '');
}

// Whether an irregular split-cards toggle is effectively ON. An explicit
// override (the user clicked the toggle) wins; otherwise it defaults ON when
// the concept's Mounce chapter is among the currently selected chapters.
export function isIrregularCardEnabled(tag, selectedKeys, overrides) {
  const v = overrides && typeof overrides === 'object' ? overrides[tag] : undefined;
  if (v === true) return true;
  if (v === false) return false;
  const config = IRREGULAR_CARD_CONFIGS.find(c => c.tag === tag);
  if (!config) return false;
  const chapters = new Set((selectedKeys || []).filter(isChapterKey).map(Number));
  return chapters.has(config.chapter);
}

export function irregularEnabledTags(selectedKeys, overrides) {
  return IRREGULAR_CARD_CONFIGS
    .filter(c => isIrregularCardEnabled(c.tag, selectedKeys, overrides))
    .map(c => c.tag);
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

// ── NT Book Vocab resolution ────────────────────────────────────────────
// Book pseudo-keys don't carry their own cards: each book lists the exact
// headwords (`g`) of existing cards, and we resolve those back to the live
// card objects so progress is shared with the card's home chapter/bucket.
const NTB_GROUP_SIZE_DEFAULT = 50;
function ntbGroupSize() {
  const n = window.NT_BOOK_VOCAB && Number(window.NT_BOOK_VOCAB.groupSize);
  return n > 0 ? n : NTB_GROUP_SIZE_DEFAULT;
}

// Index of every real vocab card by its exact headword `g`, deduped by the
// same chapter > advanced > supplemental priority the generator used (so a
// lemma present in two sets resolves to its canonical card). Memoized; the
// signature invalidates the cache if the loaded card data changes.
let ntbCardIndex = null;
let ntbCardIndexSig = '';
function cardPriorityRank(card) {
  if (card && card.chapter != null) return 0;
  if (card && card.advanced) return 1;
  return 2;
}
function getRealCardIndexByHeadword() {
  const sets = getSets();
  const keys = Object.keys(sets).filter(k => !isBookKey(k) && Array.isArray(sets[k]?.cards) && sets[k].cards.length);
  const sig = keys.length + ':' + keys.reduce((n, k) => n + sets[k].cards.length, 0);
  if (ntbCardIndex && ntbCardIndexSig === sig) return ntbCardIndex;
  const idx = new Map();
  // requiredFlag false: index the full inventory; required-only filtering is
  // applied per-card when the book deck is emitted.
  getSelectedVocabCards(keys, false).forEach(card => {
    const cur = idx.get(card.g);
    if (!cur || cardPriorityRank(card) < cardPriorityRank(cur)) idx.set(card.g, card);
  });
  ntbCardIndex = idx;
  ntbCardIndexSig = sig;
  return idx;
}
function parseBookKey(rawKey) {
  const m = String(rawKey).match(/^NTB::([^:]+)(?:::g::(\d+))?$/);
  return m ? { book: m[1], group: m[2] ? Number(m[2]) : null } : null;
}
export function resolveBookVocabCards(rawKey, requiredFlag = false) {
  const parsed = parseBookKey(rawKey);
  if (!parsed) return [];
  const books = (window.NT_BOOK_VOCAB && Array.isArray(window.NT_BOOK_VOCAB.books)) ? window.NT_BOOK_VOCAB.books : [];
  const book = books.find(b => b.key === parsed.book);
  if (!book || !Array.isArray(book.refs)) return [];
  let refs = book.refs;
  if (parsed.group) {
    const size = ntbGroupSize();
    const start = (parsed.group - 1) * size;
    refs = refs.slice(start, start + size);
  }
  const index = getRealCardIndexByHeadword();
  const out = [];
  const seen = new Set();
  refs.forEach(g => {
    const card = index.get(g);
    if (!card) return;                          // headword no longer a live card
    if (requiredFlag && !card.required) return;
    if (seen.has(card.id)) return;              // a book lists each lexeme once
    seen.add(card.id);
    out.push({ ...card });
  });
  return out;
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
  const hasBookKeys = (keys || []).some(isBookKey);
  (keys || []).forEach(key => {
    const rawKey = String(key);
    if (isBookKey(rawKey)) {
      resolveBookVocabCards(rawKey, requiredFlag).forEach(card => cards.push(card));
      return;
    }
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
  // Book vocab links to cards that may also be reachable via their home
  // chapter/bucket (or via another selected book), so collapse duplicate ids
  // when any book key is in play. The non-book path can't produce dupes, so it
  // skips this to preserve the original card order exactly.
  if (hasBookKeys) {
    const seen = new Set();
    return cards.filter(card => {
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      return true;
    });
  }
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

// Short form-type abbreviation shown as a "(aor)" / "(fut)" tag before/under a
// derived headword. Fixed per config for the binary sets; for the μι-verbs
// (several principal parts per lemma) it's derived from each part's own label.
function shortFormFor(label) {
  const s = String(label || '').toLowerCase();
  if (s.includes('aorist passive')) return 'aor pass';
  if (s.includes('future')) return 'fut';
  if (s.includes('perfect')) return 'pf';
  if (s.includes('aorist')) return 'aor';
  if (s.includes('present')) return 'pres';
  return '';
}

// present-lemma → [derived entries] for one flip set. Keyed through
// flipLookupKey so the oxia/tonos + iota-subscript spelling gap between
// words.js and the flip sets doesn't drop matches (the same fold render.js
// uses). Each entry carries its target form, gloss, stem, render label, and
// short form-tag.
function buildIrregularLookup(config) {
  const set = window.SUPPLEMENTAL_VOCAB_SETS && window.SUPPLEMENTAL_VOCAB_SETS[config.flipKey];
  const flipCards = set && Array.isArray(set.cards) ? set.cards : [];
  const map = {};
  flipCards.forEach(c => {
    if (!c || !c.stemFlip || !c.g || !c.aorist) return;
    const key = flipLookupKey(c.g);
    (map[key] = map[key] || []).push({
      form: c.aorist,
      gloss: c.aoristGloss,
      stem: c.stem || '',
      // μι-verbs name each principal part on the card itself (stemFlipAorist);
      // reuse it so the derived label reads e.g. "aorist active (1st sg.) of …".
      label: config.multi && c.stemFlipAorist ? c.stemFlipAorist : config.label,
      short: config.short || shortFormFor(c.stemFlipAorist)
    });
  });
  return map;
}

// Irregular-card expansion (the "Variant forms as cards" toggles): for every
// standard chapter-vocab verb with a recorded non-present principal part in an
// enabled flip set, add a standalone card for that form (e.g. εἶπον "I said"
// for λέγω, λέλυκα for λύω, ἔδωκα for δίδωμι). The derived card keeps the
// parent's set metadata and required flag so required-only / hard-review
// scoping treat the pair alike, and gets a stable `::<tag>` (or `::<tag>::<n>`
// for μι-verbs) id suffix for deck mechanics — while its stats land on the
// parent's progress entry via progressCardId. Supplemental, advanced, and flip
// cards are left alone — same rule as the render-side stem annotations.
//
// Placement: each derived form is woven into its own chapter's run of cards
// about half the run away from its present-stem parent (circularly), not
// appended right after it — back-to-back the present gives the answer away in
// an unshuffled deck. The offset is deterministic, so the unshuffled order is
// stable across rebuilds; shuffled decks randomize it anyway.
export function expandIrregularCards(cards, enabledTags) {
  if (!Array.isArray(cards) || !cards.length) return cards || [];
  const tags = (enabledTags || []).filter(t => IRREGULAR_TAGS.includes(t));
  if (!tags.length) return cards;
  const lookups = IRREGULAR_CARD_CONFIGS
    .filter(c => tags.includes(c.tag))
    .map(c => ({ config: c, byLemma: buildIrregularLookup(c) }))
    .filter(l => Object.keys(l.byLemma).length);
  if (!lookups.length) return cards;

  const out = [];
  // Current contiguous same-sourceKey run, plus the cards derived from it
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
    if (!card || card.advanced || card.supplemental || card.stemFlip || card.derivedFrom) return;
    const lemmaKey = flipLookupKey(card.g);
    lookups.forEach(({ config, byLemma }) => {
      const entries = byLemma[lemmaKey];
      if (!entries) return;
      entries.forEach((entry, i) => {
        const suffix = config.multi ? `::${config.tag}::${i}` : `::${config.tag}`;
        pending.push({
          parentIdx,
          card: {
            ...card,
            g: entry.form,
            e: entry.gloss || card.e,
            derivedFrom: card.g,
            derivedLabel: entry.label,
            derivedShort: entry.short,
            derivedStem: entry.stem,
            derivedTag: config.tag,
            id: `${card.id}${suffix}`
          }
        });
      });
    });
  });
  flushRun();
  return out;
}

// Back-compat shim: the original single-flip-set entry point, now just the
// 2nd-aorist slice of the generalized expansion.
export function expandSecondAoristCards(cards) {
  return expandIrregularCards(cards, ['2aor']);
}

// Which face of a shared base/derived progress entry a card is: the derived
// suffix (e.g. '2aor', 'mi::0') for a derived card, 'base' for a present-tense
// chapter-vocab verb that has at least one derived face in any flip set, null
// for every other card — those have no sibling face and no shared-entry
// concern. The spaced scheduler gates the shared entry on ALL its forms: it
// only advances once every active face is passed in one cycle (Model B — see
// getVariantCycleInfo / applySpacedReview in js/app/main.js).
export function derivedCardFaceKey(card) {
  if (!card) return null;
  const m = String(card.id || '').match(DERIVED_ID_SUFFIX_RE);
  if (m) return m[0].slice(2); // drop the leading "::" → '2aor' | 'mi::0' …
  if (card.advanced || card.supplemental || card.stemFlip) return null;
  const key = flipLookupKey(card.g);
  for (const config of IRREGULAR_CARD_CONFIGS) {
    const set = window.SUPPLEMENTAL_VOCAB_SETS && window.SUPPLEMENTAL_VOCAB_SETS[config.flipKey];
    const flipCards = set && Array.isArray(set.cards) ? set.cards : [];
    if (flipCards.some(c => c && c.stemFlip && c.aorist && flipLookupKey(c.g) === key)) return 'base';
  }
  return null;
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
