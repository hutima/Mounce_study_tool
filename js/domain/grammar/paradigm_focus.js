// Catalog + chapter-gated lookups for the step-by-step morphology drill.
//
// Sources have one of two shapes: chapter-keyed sets ("2", "3", …) and
// W*_* paradigm/supplemental sets. We unify them into a single "effective
// chapter" scale via CHAPTER_TO_WEEK (its inverse picks the first chapter
// of each week). The dropdown list and the focused-paradigm card pool are
// then both cumulative: every paradigm whose effective chapter is ≤ the
// user's max selected effective chapter is in scope — so picking Ch N
// unlocks all paradigms introduced in Ch 1..N regardless of whether the
// underlying source is chapter-keyed or week-keyed.

import { CHAPTER_TO_WEEK } from '../../data/setMeta.js';

// Categorical grouping for the focused-paradigm dropdown. Each lemma string
// (matched verbatim against the lemma field in MORPHOLOGY_SETS items) maps
// to a category label; lemmas without a mapping fall into "Other
// constructions". Mounce-specific (BBG3 paradigm naming).
const PARADIGM_CATEGORIES = {
  // ─── Article ───
  'ὁ, ἡ, τό':                          'Article',

  // ─── Nouns ───
  'λόγος':                             'Nouns · 2nd-decl. masculine',
  'ἔργον':                             'Nouns · 2nd-decl. neuter',
  'γραφή':                             'Nouns · 1st-decl. feminine (η-pattern)',
  'ὥρα':                               'Nouns · 1st-decl. feminine (α-pattern)',
  'σάρξ, σαρκός':                      'Nouns · 3rd declension',
  'πνεῦμα, πνεύματος':                 'Nouns · 3rd declension',

  // ─── Adjectives ───
  'ἀγαθός, -ή, -όν':                   'Adjectives',

  // ─── Pronouns ───
  'ἐγώ':                               'Pronouns · personal',
  'σύ':                                'Pronouns · personal',
  'αὐτός':                             'Pronouns · personal / intensive',
  'οὗτος, αὕτη, τοῦτο':                'Pronouns · demonstrative',
  'ἐκεῖνος, -η, -ο':                   'Pronouns · demonstrative',
  'ὅς, ἥ, ὅ':                          'Pronouns · relative',

  // ─── Verbs · λύω family (standard ω-pattern) ───
  'λύω':                               'Verbs · standard ω-pattern (λύω)',
  'λύω → λύσω':                        'Verbs · standard ω-pattern (λύω)',
  'λύω → ἔλυσα':                       'Verbs · standard ω-pattern (λύω)',
  'λύω → ἔλυον':                       'Verbs · standard ω-pattern (λύω)',
  'λύω → λέλυκα':                      'Verbs · standard ω-pattern (λύω)',
  'λύω → λύομαι':                      'Verbs · standard ω-pattern (λύω)',
  'λύομαι → ἐλυόμην':                  'Verbs · standard ω-pattern (λύω)',
  'λύω → ἐλυσάμην':                    'Verbs · standard ω-pattern (λύω)',
  'λύω → ἐλύθην':                      'Verbs · standard ω-pattern (λύω)',
  'λύω → λυθήσομαι':                   'Verbs · standard ω-pattern (λύω)',
  'λύω → λέλυμαι':                     'Verbs · standard ω-pattern (λύω)',

  // ─── Verbs · contract ───
  'ἀγαπάω':                            'Verbs · contract (-άω)',
  'ποιέω':                             'Verbs · contract (-έω)',
  'πληρόω':                            'Verbs · contract (-όω)',

  // ─── Verbs · 2nd aorist ───
  'γίνομαι → ἐγενόμην':                'Verbs · second aorist',
  'λαμβάνω → ἔλαβον':                  'Verbs · second aorist',
  'λείπω → ἔλιπον':                    'Verbs · second aorist',
  'γράφω → ἐγράφην':                   'Verbs · second aorist (passive)',

  // ─── Verbs · liquid future ───
  'κρίνω → κρινῶ':                     'Verbs · liquid future',

  // ─── Verbs · deponent / middle ───
  'πορεύομαι → πορεύσομαι':            'Verbs · deponent / middle',

  // ─── Verbs · μι-verbs ───
  'δίδωμι':                            'Verbs · μι-verbs',
  'δίδωμι → ἔδωκα':                    'Verbs · μι-verbs',
  'ἵστημι (root *στα-)':               'Verbs · μι-verbs',
  'τίθημι (root *θε-)':                'Verbs · μι-verbs',
  'δείκνυμι (no reduplication)':       'Verbs · μι-verbs',

  // ─── Non-finite (case-marked) verbals ───
  'λύω infinitive forms':              'Infinitives',
  'λύω → λυθείς':                      'Participles',
  'λύω → λύσας':                       'Participles',
  'λύω → λῦσον':                       'Imperatives'
};

const PARADIGM_DISPLAY_OVERRIDES = {
  'σάρξ, σαρκός':       'σάρξ — 3rd-decl. feminine',
  'πνεῦμα, πνεύματος':  'πνεῦμα — 3rd-decl. neuter',
  'ἐγώ':                'ἐγώ — 1st-person pronoun',
  'σύ':                 'σύ — 2nd-person pronoun'
};

// Display order for the optgroup headings in the dropdown. Reflects Mounce's
// course progression (article → nouns → adjectives → pronouns → verbs →
// participles → other). Categories not in this list are appended at the end.
const CATEGORY_ORDER = [
  'Article',
  'Nouns · 2nd-decl. masculine',
  'Nouns · 2nd-decl. neuter',
  'Nouns · 1st-decl. feminine (η-pattern)',
  'Nouns · 1st-decl. feminine (α-pattern)',
  'Nouns · 3rd declension',
  'Adjectives',
  'Pronouns · personal',
  'Pronouns · personal / intensive',
  'Pronouns · demonstrative',
  'Pronouns · relative',
  'Verbs · standard ω-pattern (λύω)',
  'Verbs · contract (-άω)',
  'Verbs · contract (-έω)',
  'Verbs · contract (-όω)',
  'Verbs · liquid future',
  'Verbs · second aorist',
  'Verbs · second aorist (passive)',
  'Verbs · deponent / middle',
  'Verbs · μι-verbs',
  'Infinitives',
  'Participles',
  'Imperatives',
  'Other constructions'
];

function categoryForLemma(lemma) {
  return PARADIGM_CATEGORIES[lemma] || 'Other constructions';
}

function displayLabelForLemma(lemma, item) {
  const override = PARADIGM_DISPLAY_OVERRIDES[lemma];
  if (override) return override;
  return lemma + (item && item.gloss ? ` — ${item.gloss}` : '');
}

// Inverse of CHAPTER_TO_WEEK keyed by week → first chapter where that
// week's material starts in the textbook. Used to give W*_* sources an
// effective chapter so they sort/gate alongside chapter-keyed sets.
const WEEK_FIRST_CHAPTER = (() => {
  const map = {};
  Object.keys(CHAPTER_TO_WEEK).forEach((chapStr) => {
    const ch = Number(chapStr);
    const wk = CHAPTER_TO_WEEK[chapStr];
    if (!map[wk] || ch < map[wk]) map[wk] = ch;
  });
  return map;
})();

function safeMorphSets() {
  const sets = (typeof window !== 'undefined' && window.MORPHOLOGY_SETS) || {};
  return sets;
}

function sourceLevel(sourceKey) {
  const str = String(sourceKey || '');
  if (/^\d+$/.test(str)) {
    const ch = Number(str);
    return { kind: 'chapter', week: CHAPTER_TO_WEEK[ch] || null, effectiveChapter: ch };
  }
  const weekMatch = str.match(/^W(\d+)_/);
  if (weekMatch) {
    const wk = Number(weekMatch[1]);
    const firstCh = WEEK_FIRST_CHAPTER[wk];
    return { kind: 'week', week: wk, effectiveChapter: firstCh || (wk * 2 - 1) };
  }
  return { kind: 'other', week: null, effectiveChapter: 0 };
}

// Single number that drives gating: the max "effective chapter" across all
// selected keys. If the user picks Ch 8 and W5_PAS, max is 12 (W5's first
// chapter), which is then the cap for everything else.
export function deriveSelectionLevels(selectedKeys) {
  let maxEffectiveChapter = -Infinity;
  (selectedKeys || []).forEach((k) => {
    const lvl = sourceLevel(k);
    if (lvl.effectiveChapter > maxEffectiveChapter) maxEffectiveChapter = lvl.effectiveChapter;
  });
  return {
    maxEffectiveChapter: maxEffectiveChapter === -Infinity ? null : maxEffectiveChapter
  };
}

function sourcePassesLevel(sourceKey, levels) {
  if (levels.maxEffectiveChapter == null) return false;
  const lvl = sourceLevel(sourceKey);
  if (lvl.kind === 'other') return false;
  return lvl.effectiveChapter <= levels.maxEffectiveChapter;
}

// Cumulative list of paradigm lemmas available to the user given their
// selection. Walks every morph set in MORPHOLOGY_SETS and includes any whose
// effective chapter is ≤ the user's max selected effective chapter — so a
// user on Ch 8 sees every paradigm introduced from Ch 1 through Ch 8, not
// just the ones in their currently-checked sources.
export function listAvailableParadigms(selectedKeys) {
  const sets = safeMorphSets();
  const levels = deriveSelectionLevels(selectedKeys);
  if (levels.maxEffectiveChapter == null) return [];
  const seen = new Map();
  Object.keys(sets).forEach((key) => {
    if (!sourcePassesLevel(key, levels)) return;
    const set = sets[key];
    if (!set || !Array.isArray(set.items)) return;
    set.items.forEach((item) => {
      if (!item || !item.lemma) return;
      const lemma = item.lemma;
      if (!seen.has(lemma)) {
        const lvl = sourceLevel(key);
        seen.set(lemma, {
          lemma,
          displayLabel: displayLabelForLemma(lemma, item),
          category: categoryForLemma(lemma),
          sources: new Set(),
          firstChapter: lvl.effectiveChapter
        });
      } else {
        const lvl = sourceLevel(key);
        const entry = seen.get(lemma);
        if (lvl.effectiveChapter < entry.firstChapter) entry.firstChapter = lvl.effectiveChapter;
      }
      seen.get(lemma).sources.add(String(key));
    });
  });
  // Sort by first-introduced chapter (ascending), then alphabetically, so the
  // dropdown reads as a natural progression through the course.
  return [...seen.values()]
    .map((p) => ({ ...p, sources: [...p.sources] }))
    .sort((a, b) => (a.firstChapter - b.firstChapter) || a.lemma.localeCompare(b.lemma));
}

// Given a focused lemma and the selection, return every morph card across
// all sources whose effective chapter is ≤ the user's max — filtered to the
// focused lemma so cross-chapter expansions of the same paradigm collapse
// into one deck.
export function getCardsForFocusedParadigm(selectedKeys, focusedLemma) {
  if (!focusedLemma) return [];
  if (typeof window === 'undefined' || typeof window.buildMorphologyCardsForKeys !== 'function') return [];

  const sets = safeMorphSets();
  const levels = deriveSelectionLevels(selectedKeys);
  if (levels.maxEffectiveChapter == null) return [];
  const eligibleSourceKeys = Object.keys(sets).filter((key) => {
    if (!sourcePassesLevel(key, levels)) return false;
    const set = sets[key];
    if (!set || !Array.isArray(set.items)) return false;
    return set.items.some((item) => item && item.lemma === focusedLemma);
  });

  if (!eligibleSourceKeys.length) return [];
  const cards = window.buildMorphologyCardsForKeys(eligibleSourceKeys);
  return cards.filter((card) => card && card.lemma === focusedLemma);
}

export function chooseDefaultFocusedParadigm(selectedKeys) {
  const available = listAvailableParadigms(selectedKeys);
  if (!available.length) return null;
  return available[0].lemma;
}

// Groups listAvailableParadigms output by category for optgroup rendering.
// Returns [{ category, lemmas: [...] }, ...] in CATEGORY_ORDER (with any
// unknown categories appended at the end alphabetically). Categories that
// have no available paradigms at the current selection are omitted.
export function listAvailableParadigmsByCategory(selectedKeys) {
  const flat = listAvailableParadigms(selectedKeys);
  const grouped = new Map();
  flat.forEach((p) => {
    if (!grouped.has(p.category)) grouped.set(p.category, []);
    grouped.get(p.category).push(p);
  });
  const orderedCats = [
    ...CATEGORY_ORDER.filter((c) => grouped.has(c)),
    ...[...grouped.keys()].filter((c) => !CATEGORY_ORDER.includes(c)).sort()
  ];
  return orderedCats.map((category) => ({
    category,
    lemmas: grouped.get(category)
  }));
}

// Every morph card whose source is in scope at the student's current max
// chapter — used to derive the chapter-gated distractor pool so the drill
// never asks about tenses/moods the textbook hasn't introduced yet.
export function getAccessibleMorphCards(selectedKeys) {
  if (typeof window === 'undefined' || typeof window.buildMorphologyCardsForKeys !== 'function') return [];
  const sets = safeMorphSets();
  const levels = deriveSelectionLevels(selectedKeys);
  if (levels.maxEffectiveChapter == null) return [];
  const eligibleSourceKeys = Object.keys(sets).filter((key) => sourcePassesLevel(key, levels));
  if (!eligibleSourceKeys.length) return [];
  return window.buildMorphologyCardsForKeys(eligibleSourceKeys);
}
