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
import { parseAnswerDimensions, dimValuePassesFilter } from './morph_steps.js';

const DIM_VALUE_FILTER_KEYS = ['aspect', 'tense', 'voice', 'mood', 'person', 'number', 'case', 'gender'];

// True iff every dim the card's parse populates passes the per-value
// filter for that dim. Dims the card's parse leaves blank are ignored
// (they don't constrain the filter). A null/empty filter map means
// "everything enabled" and trivially passes.
//
// `multiGenderLemmas` is the set of lemmas whose paradigm has cards in
// more than one gender (articles, adjectives, pronouns). Lemmas not in
// the set are single-gender (most nouns) and skip the gender filter —
// excluding e.g. masculine shouldn't wipe out all of λόγος.
// Gender-as-filter only meaningfully prunes within a multi-gender
// paradigm where the student is identifying gender from form.
function cardPassesDimValueFilters(card, dimValueFilters, multiGenderLemmas) {
  if (!dimValueFilters || typeof dimValueFilters !== 'object') return true;
  const dims = parseAnswerDimensions(card.parsedAnswer || card.answer || '');
  const lemmaIsMultiGender = !!(multiGenderLemmas && card.lemma && multiGenderLemmas.has(card.lemma));
  for (const dim of DIM_VALUE_FILTER_KEYS) {
    const value = dims[dim];
    if (!value) continue;
    if (dim === 'gender' && !lemmaIsMultiGender) continue;
    if (!dimValuePassesFilter(dim, value, dimValueFilters)) return false;
  }
  return true;
}

// Builds the set of lemmas that appear in more than one gender across
// `cards`. Composite genders (e.g. "masculine/feminine/neuter") split
// into their components so a tri-gender adjective registers as
// multi-gender even if every individual card carries the composite.
export function buildMultiGenderLemmas(cards) {
  const lemmaGenders = new Map();
  cards.forEach((card) => {
    if (!card || !card.lemma) return;
    const dims = parseAnswerDimensions(card.parsedAnswer || card.answer || '');
    if (!dims.gender) return;
    if (!lemmaGenders.has(card.lemma)) lemmaGenders.set(card.lemma, new Set());
    const genders = lemmaGenders.get(card.lemma);
    String(dims.gender).split('/').forEach((g) => { if (g) genders.add(g); });
  });
  const result = new Set();
  lemmaGenders.forEach((genders, lemma) => {
    if (genders.size > 1) result.add(lemma);
  });
  return result;
}

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
  // λύω's infinitives live in their own "Infinitives" optgroup (like the
  // participles and imperatives below), so the ω-pattern "↯ Shuffle all"
  // pick stays scoped to the finite indicative forms it names. The
  // cumulative "λύω — all forms" aggregate still pools the infinitives —
  // it resolves by family membership (LUO_VARIANTS), not by category.
  'λύω infinitive forms':              'Infinitives',

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
  // πορεύομαι (the only deponent paradigm) keeps ALL its forms together under
  // this group — including its participle and infinitives — rather than scattering
  // them into the generic Participles / Infinitives optgroups, so the deponent
  // verb reads as one self-contained paradigm. (λύω, the teaching model, does
  // populate the generic Participles group below for cross-paradigm shuffling.)
  'πορεύομαι':                         'Verbs · deponent / middle',
  'πορεύομαι → ἐπορευόμην':            'Verbs · deponent / middle',
  'πορεύομαι → πορεύσομαι':            'Verbs · deponent / middle',
  'πορεύομαι → ἐπορεύθην':             'Verbs · deponent / middle',
  'πορεύομαι → πορευθείς':             'Verbs · deponent / middle',
  'πορεύομαι infinitive forms':       'Verbs · deponent / middle',

  // ─── Verbs · μι-verbs ───
  'δίδωμι':                            'Verbs · μι-verbs',
  'δίδωμι → ἔδωκα':                    'Verbs · μι-verbs',
  'ἵστημι (root *στα-)':               'Verbs · μι-verbs',
  'τίθημι (root *θε-)':                'Verbs · μι-verbs',
  'δείκνυμι (no reduplication)':       'Verbs · μι-verbs',

  // ─── Non-finite (case-marked) verbals ───
  // λύω's present participles are linked copies (the same forms also live in the
  // λύω present paradigm) surfaced here so they shuffle with / drill alongside the
  // aorist participles.
  'λύω → λύων':                        'Participles',
  'λύω → λυόμενος':                    'Participles',
  'λύω → λυθείς':                      'Participles',
  'λύω → λύσας':                       'Participles',
  'λύω → λῦσον':                       'Imperatives'
};

// Third-declension noun lemmas, derived from the paradigm catalog above. Their
// gender is genuinely unpredictable from the form: σάρξ is feminine, πνεῦμα
// neuter — and nothing in the nominative or oblique endings reliably announces
// which (contrast λόγος, whose -ος all but declares 2nd-decl. masculine). So
// even though each lemma is single-gender, parsing keeps the gender step for
// them: recalling that σάρξ is feminine is exactly what third-declension
// drilling is for. buildMorphSteps reads this set to opt these lemmas out of
// the single-gender gender auto-skip. The gender *value* filter still treats
// them as single-gender (see cardPassesDimValueFilters), so excluding a gender
// distractor never prunes the paradigm. Sourcing it from PARADIGM_CATEGORIES
// keeps a single source of truth: a new 3rd-decl. noun paradigm added to the
// catalog becomes gender-testable automatically.
export const THIRD_DECLENSION_NOUN_LEMMAS = new Set(
  Object.keys(PARADIGM_CATEGORIES).filter(
    (lemma) => PARADIGM_CATEGORIES[lemma] === 'Nouns · 3rd declension'
  )
);

const PARADIGM_DISPLAY_OVERRIDES = {
  'σάρξ, σαρκός':       'σάρξ — 3rd-decl. feminine',
  'πνεῦμα, πνεύματος':  'πνεῦμα — 3rd-decl. neuter',
  'ἐγώ':                'ἐγώ — 1st-person pronoun',
  'σύ':                 'σύ — 2nd-person pronoun'
};

// Verb principal-part lemma keys read as the dictionary form plus an arrow to
// the relevant principal part (e.g. 'λύω → λύσω'); their default label tacks on
// the English gloss ("I will loose"), which isn't very useful for picking a form
// to drill. This maps each verb-family lemma to a "<base> — <form name>" label
// so the dropdown reads as a paradigm chooser ("λύω — future active",
// "λύω — present middle/passive", …). Lemmas absent here fall back to the
// gloss-style label. Keep in sync with the *_VARIANTS families in
// lemma_inventory.js and PARADIGM_CATEGORIES above.
const PARADIGM_FORM_DISPLAY_NAMES = {
  // λύω family
  'λύω':                  'λύω — present active',
  'λύω → λύομαι':         'λύω — present middle/passive',
  'λύω → λύσω':           'λύω — future active',
  'λύω → λυθήσομαι':      'λύω — future passive',
  'λύω → ἔλυον':          'λύω — imperfect active',
  'λύομαι → ἐλυόμην':     'λύω — imperfect middle/passive',
  'λύω → ἔλυσα':          'λύω — aorist active',
  'λύω → ἐλυσάμην':       'λύω — aorist middle',
  'λύω → ἐλύθην':         'λύω — aorist passive',
  'λύω → λέλυκα':         'λύω — perfect active',
  'λύω → λέλυμαι':        'λύω — perfect middle/passive',
  'λύω → λύων':           'λύω — present active participle',
  'λύω → λυόμενος':       'λύω — present middle/passive participle',
  'λύω → λύσας':          'λύω — aorist active participle',
  'λύω → λυθείς':         'λύω — aorist passive participle',
  'λύω → λῦσον':          'λύω — aorist active imperative',
  'λύω infinitive forms': 'λύω — infinitives',
  // πορεύομαι (model middle deponent)
  'πορεύομαι':                  'πορεύομαι — present middle',
  'πορεύομαι → ἐπορευόμην':     'πορεύομαι — imperfect middle',
  'πορεύομαι → πορεύσομαι':     'πορεύομαι — future middle',
  'πορεύομαι → ἐπορεύθην':      'πορεύομαι — aorist (passive form)',
  'πορεύομαι → πορευθείς':      'πορεύομαι — aorist passive participle',
  'πορεύομαι infinitive forms': 'πορεύομαι — infinitives',
  // δίδωμι family
  'δίδωμι':          'δίδωμι — present active',
  'δίδωμι → ἔδωκα':  'δίδωμι — aorist active'
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
  'Cumulative (full paradigms)',
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

// Public variant for the parse summary / completed source line: the lemma's
// paradigm category, or null for the un-catalogued "Other constructions"
// catch-all (so callers fall back to card.family rather than printing the
// generic bucket name). Shown only AFTER a parse completes — it names the
// paradigm type, which mid-walk would leak the very tense being tested.
export function paradigmCategoryForLemma(lemma) {
  const category = categoryForLemma(lemma);
  return category === 'Other constructions' ? null : category;
}

function displayLabelForLemma(lemma, item) {
  const formName = PARADIGM_FORM_DISPLAY_NAMES[lemma];
  if (formName) return formName;
  const override = PARADIGM_DISPLAY_OVERRIDES[lemma];
  if (override) return override;
  return lemma + (item && item.gloss ? ` — ${item.gloss}` : '');
}

// ─── Summative "all forms" aggregates ────────────────────────────────────
//
// Mounce splits one verb across many principal-part lemma keys (λύω alone
// has 15 — present, future, imperfect, aorist act/mid/pas, perfect, the
// participle sets, the infinitive set, the imperatives). The focused-
// paradigm dropdown lists each split as its own pick, so there's no single
// option that drills the whole verb. An *aggregate* is a virtual lemma
// ("λύω — all forms") that pools every member's chapter-gated cards into one
// deck — the parsing-mode counterpart of the cumulative vocab deck in
// mounce_paradigms.js.
//
// Membership comes from window.PARADIGM_VARIANT_FAMILIES (defined alongside
// the *_VARIANTS arrays in lemma_inventory.js) so the union list, the
// optional-extension registration, and this aggregate all stay in lockstep.
// Each family is keyed by its base lemma; that base supplies the aggregate's
// optional-forms source (every variant shares the same optionalFormGroups via
// registerVariants, so building optionals from the base yields the full
// optional paradigm exactly once, with no per-member duplication). The
// aggregate's dropdown category, however, is the dedicated AGGREGATE_CATEGORY
// (not the base's category) so the cumulative deck reads as its own section,
// distinct from the per-category "↯ Shuffle all" pick.
const AGGREGATE_SUFFIX = ' — all forms';

// The "— all forms" aggregates get their own dropdown category rather than
// inheriting their base lemma's category. This keeps the comprehensive
// cumulative deck (every tense/voice/mood + participles + imperatives +
// infinitives of the verb) visually distinct from the per-category
// "↯ Shuffle all — <type>" pick, which only pools the concrete lemmas tagged
// with that one category (so the ω-pattern shuffle is finite indicatives only,
// while the cumulative is the whole verb).
const AGGREGATE_CATEGORY = 'Cumulative (full paradigms)';

function variantFamilies() {
  return (typeof window !== 'undefined' && window.PARADIGM_VARIANT_FAMILIES) || {};
}

// Map of aggregate-key → descriptor, rebuilt on demand (cheap: a couple of
// entries). Families with fewer than two members can't be "summed" into
// anything richer than the single member, so they're skipped.
function aggregateDescriptors() {
  const families = variantFamilies();
  const out = {};
  Object.keys(families).forEach((base) => {
    const members = Array.isArray(families[base]) ? families[base] : [];
    if (members.length < 2) return;
    const key = base + AGGREGATE_SUFFIX;
    out[key] = {
      key,
      base,
      members,
      displayLabel: `${base}${AGGREGATE_SUFFIX} (cumulative)`,
      category: AGGREGATE_CATEGORY
    };
  });
  return out;
}

export function isAggregateParadigm(lemma) {
  return Object.prototype.hasOwnProperty.call(aggregateDescriptors(), lemma);
}

// Base lemma behind an aggregate key (e.g. 'λύω — all forms' → 'λύω'), or
// null for a plain lemma. The base is where the shared optionalFormGroups
// live, so the deck builder reads optionals from it.
function aggregateBaseLemma(lemma) {
  const agg = aggregateDescriptors()[lemma];
  return agg ? agg.base : null;
}

// Real member lemmas a focused-paradigm key resolves to: an aggregate
// expands to its whole family; a plain lemma is just itself. Exported so
// reset-known-focused (navigation.js) can clear every member's tally when an
// aggregate is the focus, mirroring how the deck pools them.
export function resolveFocusedLemmas(focusedLemma) {
  const agg = aggregateDescriptors()[focusedLemma];
  if (agg) return agg.members.slice();
  return focusedLemma ? [focusedLemma] : [];
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
  // OPT_<chapter>[_<suffix>] — synthetic source key for optional paradigm
  // forms injected from LEMMA_INVENTORY.optionalFormGroups when the user
  // toggles "Optional paradigm extensions" on. The chapter component is
  // the group's own `chapter` field, so the standard sourcePassesLevel
  // gate naturally caps optional cards at the student's current scope.
  const optMatch = str.match(/^OPT_(\d+)/);
  if (optMatch) {
    const ch = Number(optMatch[1]);
    return { kind: 'optional', week: CHAPTER_TO_WEEK[ch] || null, effectiveChapter: ch };
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

// Synthesizes morph-shaped cards from LEMMA_INVENTORY[lemma].optionalFormGroups
// for every group whose chapter gate is in scope at the student's current
// max effective chapter. Returns [] when the lemma has no optional groups,
// when no group is in scope, or when LEMMA_INVENTORY isn't loaded.
//
// Each synthesized card mirrors the shape buildMorphologyCardsForKeys
// produces (kind: 'morph', sourceKey, parsedAnswer, formToAnswer, …) so
// downstream consumers — the step builder, the form-lookup fallback, the
// per-form dedup in getCardsForFocusedParadigm, the stats tracker — treat
// them uniformly with Mounce-curriculum cards. supplemental: true tags
// them as off-textbook (matters for any filter that splits curriculum vs
// extension content). choices/reverseChoices are left as the single-item
// arrays the form-lookup feedback uses; the parsing walk doesn't read
// these.
function buildOptionalMorphCardsForLemma(lemma, levels, filters) {
  if (!lemma || !levels || levels.maxEffectiveChapter == null) return [];
  const inv = (typeof window !== 'undefined' && window.LEMMA_INVENTORY)
    ? window.LEMMA_INVENTORY[lemma]
    : null;
  if (!inv || !Array.isArray(inv.optionalFormGroups)) return [];

  // Per-category filter: a card is dropped if any of its canonical-parse
  // tokens corresponds to a filter that's been turned off. Filters
  // default to "include" — only explicit `false` excludes. Empty/missing
  // filters object means no filtering.
  const filterCard = (parsedAnswer) => {
    if (!filters || typeof filters !== 'object') return true;
    const parse = String(parsedAnswer || '').toLowerCase();
    if (filters.imperative === false   && /\bimperative\b/.test(parse))    return false;
    if (filters.subjunctive === false  && /\bsubjunctive\b/.test(parse))   return false;
    if (filters.infinitive === false   && /\binfinitive\b/.test(parse))    return false;
    if (filters.participle === false   && /\bparticiple\b/.test(parse))    return false;
    if (filters.thirdPerson === false  && /\bthird person\b/.test(parse))  return false;
    if (filters.futureTense === false  && /\bfuture\b/.test(parse))        return false;
    if (filters.perfectTense === false && /\bperfect\b/.test(parse))       return false;
    return true;
  };

  const out = [];
  inv.optionalFormGroups.forEach((group, groupIdx) => {
    if (!group || !group.forms || typeof group.chapter !== 'number') return;
    if (group.chapter > levels.maxEffectiveChapter) return;
    const sourceKey = `OPT_${group.chapter}`;
    const sourceLabel = group.family || `${lemma} — optional (ch ${group.chapter})`;
    const entries = Object.entries(group.forms);
    entries.forEach(([form, parsedAnswer], formIdx) => {
      if (!form || !parsedAnswer) return;
      if (!filterCard(parsedAnswer)) return;
      out.push({
        id: `morph-OPT-${stableOptMorphKey(lemma)}-${group.chapter}-${groupIdx}-${formIdx}-${stableOptMorphKey(form)}`,
        kind: 'morph',
        required: true,
        sourceKey,
        sourceLabel,
        supplemental: true,
        chapter: group.chapter,
        family: group.family || `${lemma} — optional`,
        lemma,
        gloss: '',
        lemmaGloss: '',
        form,
        prompt: 'Parse this form.',
        dimensional: true,
        context: '',
        note: '',
        answer: parsedAnswer,
        parsedAnswer,
        choices: [parsedAnswer],
        reversible: false,
        reversePrompt: 'Choose the correct Greek form.',
        reverseChoices: [form],
        formToAnswer: { [form]: parsedAnswer }
      });
    });
  });
  return out;
}

// Loose slugifier reused by the synthetic card id. Mirrors the
// stableMorphKey defined inside morphology.js's IIFE so Greek and ASCII
// keys both produce stable, collision-free strings. Kept in sync by
// convention — if morphology.js's version evolves, update here too.
function stableOptMorphKey(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
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
  const realList = [...seen.values()]
    .map((p) => ({ ...p, sources: [...p.sources] }))
    .sort((a, b) => (a.firstChapter - b.firstChapter) || a.lemma.localeCompare(b.lemma));

  // Inject a summative aggregate for any variant family with ≥2 members in
  // scope. With fewer than two unlocked it would just duplicate the single
  // member (e.g. λύω at Ch 16 is present-only), so it stays hidden until
  // there's something to pool. firstChapter is the earliest in-scope member's
  // so the aggregate sorts into the course progression next to its base
  // lemma; the category grouper then floats it to the head of its group.
  const realByLemma = new Map(realList.map((p) => [p.lemma, p]));
  const aggregates = [];
  Object.values(aggregateDescriptors()).forEach((agg) => {
    const inScope = agg.members.filter((m) => realByLemma.has(m));
    if (inScope.length < 2) return;
    const sources = new Set();
    let firstChapter = Infinity;
    inScope.forEach((m) => {
      const entry = realByLemma.get(m);
      entry.sources.forEach((s) => sources.add(s));
      if (entry.firstChapter < firstChapter) firstChapter = entry.firstChapter;
    });
    aggregates.push({
      lemma: agg.key,
      displayLabel: agg.displayLabel,
      category: agg.category,
      sources: [...sources],
      firstChapter,
      isAggregate: true,
      members: inScope.slice()
    });
  });
  if (!aggregates.length) return realList;
  return [...realList, ...aggregates]
    .sort((a, b) => (a.firstChapter - b.firstChapter) || a.lemma.localeCompare(b.lemma));
}

// Normalizes a Greek form for dedup comparison: strips parenthesized
// optional letters ("ἐστι(ν)" → "ἐστιν"), keeps only the first variant
// before " / " or " or " ("εἰσίν / εἰσί" → "εἰσίν"), trims whitespace.
// Used so the same form appearing under multiple chapter-overlapping
// sources collapses to one card.
function normalizeFormForDedup(form) {
  if (!form) return '';
  let s = String(form);
  s = s.replace(/\(([^)]*)\)/g, '$1');
  s = s.split(/\s+(?:\/|or)\s+/u)[0];
  return s.trim();
}

// Greek paradigm cells sometimes list two spellings of one form separated by
// " / " — an accented form and its enclitic twin ("ἐμέ / με") or a movable-ν
// pair ("λύουσιν / λύουσι"). For the parsing deck we key on the primary (first)
// spelling and drop the alternate so the form survives the single-token filter
// below (isSingleFormShape) instead of being mistaken for a multi-word phrase
// and silently dropped — which left wrong-pick feedback and the reverse drill
// with no resolvable form ("—"). Mirrors normalizeFormForDedup's slash split,
// but preserves parenthesised optional letters ("ἐστι(ν)") rather than
// expanding them, since this value is shown to the student. The morph-drill
// (non-parsing) deck is unaffected — it never goes through this pipeline, so it
// keeps displaying both spellings.
function primaryFormSpelling(form) {
  const s = String(form || '');
  if (!s.includes('/')) return s;
  return s.split('/')[0].trim();
}

// Given a focused lemma and the selection, return every morph card across
// all sources whose effective chapter is ≤ the user's max — filtered to the
// focused lemma so cross-chapter expansions of the same paradigm collapse
// into one deck.
//
// Deduplication: when overlapping sources cover the same form (e.g. λύω's
// present indicatives might appear in both an introductory ch-16 set and
// the fuller ch-19 set), we drop the EARLIER source if every form it
// contains is present in the later one. Reasoning: a later set that covers
// the same forms is the more authoritative / pedagogically complete one —
// the earlier set was an introductory preview that gets superseded once
// the fuller paradigm chapter rolls around.
//
// Doing this at the source level (rather than per-form) preserves
// legitimate within-source duplicates — e.g. λύω's imperfect ἔλυον is the
// same Greek string for both 1sg and 3pl, and both cards must survive.
export function getCardsForFocusedParadigm(selectedKeys, focusedLemma, options = {}) {
  if (!focusedLemma) return [];
  if (typeof window === 'undefined' || typeof window.buildMorphologyCardsForKeys !== 'function') return [];

  const sets = safeMorphSets();
  const levels = deriveSelectionLevels(selectedKeys);
  if (levels.maxEffectiveChapter == null) return [];
  // A plain focus resolves to itself; a summative aggregate resolves to its
  // whole variant family, so the pooled deck spans every split of the verb.
  const targetLemmas = new Set(resolveFocusedLemmas(focusedLemma));
  const eligibleSourceKeys = Object.keys(sets).filter((key) => {
    if (!sourcePassesLevel(key, levels)) return false;
    const set = sets[key];
    if (!set || !Array.isArray(set.items)) return false;
    return set.items.some((item) => item && targetLemmas.has(item.lemma));
  });

  // Optional paradigm extensions: when the user has toggled them on in
  // settings, append synthetic cards for any LEMMA_INVENTORY group whose
  // chapter gate is in scope. Doing this BEFORE the per-form dedup means
  // an extension form that happens to collide with a Mounce-curriculum
  // form (rare — extensions exist precisely because the curriculum
  // doesn't drill them) collapses to the richer-parse winner like any
  // other duplicate. When the toggle is off, no extension cards are
  // added — but the fallback form-lookup in render.js still consults
  // LEMMA_INVENTORY.extraForms, so wrong-pick feedback stays canonical.
  //
  // For an aggregate, optionals come from the base lemma: registerVariants
  // attaches the same optionalFormGroups to every family member, so the base
  // already carries the complete optional paradigm. Building from it once
  // (rather than per member) yields every optional form without 15× the
  // duplication, and keys the synthetic cards' stats under the base lemma —
  // matching what focusing the base lemma alone with the toggle on produces.
  const optionalSourceLemma = aggregateBaseLemma(focusedLemma) || focusedLemma;
  const optionalCards = options.includeOptional
    ? buildOptionalMorphCardsForLemma(optionalSourceLemma, levels, options.optionalFilters)
    : [];

  if (!eligibleSourceKeys.length && !optionalCards.length) return [];
  const drilledCards = eligibleSourceKeys.length
    ? window.buildMorphologyCardsForKeys(eligibleSourceKeys)
        .filter((card) => card && targetLemmas.has(card.lemma))
    : [];
  const cards = drilledCards.concat(optionalCards);

  const cardsBySource = new Map();
  cards.forEach((card) => {
    if (!cardsBySource.has(card.sourceKey)) cardsBySource.set(card.sourceKey, []);
    cardsBySource.get(card.sourceKey).push(card);
  });
  const formsBySource = new Map();
  cardsBySource.forEach((srcCards, srcKey) => {
    const formSet = new Set();
    srcCards.forEach((c) => {
      const key = normalizeFormForDedup(c.form);
      if (key) formSet.add(key);
    });
    formsBySource.set(srcKey, formSet);
  });
  const superseded = new Set();
  formsBySource.forEach((formsA, srcA) => {
    if (superseded.has(srcA)) return;
    const chapA = sourceLevel(srcA).effectiveChapter;
    formsBySource.forEach((formsB, srcB) => {
      if (srcA === srcB || superseded.has(srcA)) return;
      const chapB = sourceLevel(srcB).effectiveChapter;
      if (chapA >= chapB) return;
      let allInB = formsA.size > 0;
      formsA.forEach((f) => { if (!formsB.has(f)) allInB = false; });
      if (allInB) superseded.add(srcA);
    });
  });

  // Drop cards whose canonical parse has no extractable dimensions — those
  // are concept questions (e.g. "what kind of verb is εἰμί syntactically?")
  // that happen to live in a paradigm item; in parsing mode they collapse
  // to a 0-step empty walk. Also drop sentence-shaped "forms" (translation
  // exercises like "ὁ Ἰησοῦς ἐστιν ὁ Χριστός.") which leak through with
  // multi-word "forms".
  function hasParseableDims(card) {
    const text = card.parsedAnswer || card.answer || '';
    const dims = parseAnswerDimensions(text);
    return !!(dims.tense || dims.voice || dims.mood || dims.person
              || dims.case || dims.number || dims.gender);
  }
  function isSingleFormShape(form) {
    if (!form) return false;
    if (/\s/.test(String(form).trim())) return false; // multi-word ⇒ sentence/phrase
    if (/[=→]/.test(form)) return false;              // marker / stem-pair shorthand
    return true;
  }
  const dimValueFilters = options.dimValueFilters || null;
  // Compute the multi-gender lemma set from the pre-gender-filter pool —
  // including a lemma's full gender repertoire even if some of its cards
  // would later be excluded by other dim filters. The gender filter is
  // then a no-op for any single-gender (noun) lemma.
  const preGenderFiltered = cards
    .filter((c) => !superseded.has(c.sourceKey))
    // Reduce slash-alternate spellings ("ἐμέ / με") to the primary form before
    // the single-token filter, so personal-pronoun obliques and movable-ν pairs
    // aren't dropped as phantom multi-word phrases.
    .map((c) => {
      const primary = primaryFormSpelling(c.form);
      return primary === c.form ? c : { ...c, form: primary };
    })
    .filter((c) => isSingleFormShape(c.form) && hasParseableDims(c));
  const multiGenderLemmas = buildMultiGenderLemmas(preGenderFiltered);
  const filtered = preGenderFiltered
    .filter((c) => cardPassesDimValueFilters(c, dimValueFilters, multiGenderLemmas));

  // Lookup mode wants every distinct (form, parse) pair, not one card per form:
  // a syncretic form like ἔλυον (imperfect 1sg AND 3pl) must keep both parse
  // paths so the faceted walk can reach each. Return the filtered list whole,
  // before the per-form dedup that the drill deck relies on.
  if (options.includeSyncretic) return filtered;

  // Per-form dedup. Multiple sources can carry the same form (e.g.
  // grammar.js ch 5's εἰμί 1-sg question + a paradigm set's εἰμί entry).
  // In parsing mode they all render the same step-by-step walk — keeping
  // them all just makes the same Greek word repeat in the deck. Pick the
  // single card with the richest canonical parse per form so the walk
  // asks every dim the form carries.
  function dimCount(card) {
    const dims = parseAnswerDimensions(card.parsedAnswer || card.answer || '');
    return ['tense', 'voice', 'mood', 'person', 'case', 'number', 'gender']
      .filter(k => dims[k]).length;
  }
  const deduped = new Map();
  filtered.forEach((card) => {
    const key = normalizeFormForDedup(card.form);
    if (!key) return;
    const existing = deduped.get(key);
    if (!existing || dimCount(card) > dimCount(existing)) deduped.set(key, card);
  });
  return [...deduped.values()];
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
  return orderedCats.map((category) => {
    const lemmas = grouped.get(category);
    // Float the summative "— all forms" pick to the head of its category so
    // it reads as the section's lead-in ("λύω — all forms", then the
    // individual splits). Order within each partition is preserved (the flat
    // list is already chapter-then-alpha sorted).
    return {
      category,
      lemmas: [
        ...lemmas.filter((p) => p.isAggregate),
        ...lemmas.filter((p) => !p.isAggregate)
      ]
    };
  });
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

// ─── "Shuffle all" parsing pools ────────────────────────────────────────
//
// The focused-paradigm dropdown normally holds a single lemma. It can also
// hold a category sentinel — "shuffle every paradigm of this type" (e.g. all
// 3rd-declension nouns) — encoded as CATEGORY_SHUFFLE_PREFIX + the category
// label. The prefix can't collide with a real lemma (no lemma starts with it)
// and survives save/restore untouched (morphFocusedParadigm persists as a
// plain string). buildFilteredFocusedParadigmCards decodes it and pools every
// in-scope lemma in that category instead of one. The separate global "shuffle
// all paradigms" toggle pools every category at once.
export const CATEGORY_SHUFFLE_PREFIX = '__shuffleType__:';
export function makeCategoryShuffleValue(category) {
  return CATEGORY_SHUFFLE_PREFIX + String(category || '');
}
export function parseCategoryShuffleValue(value) {
  if (typeof value !== 'string' || !value.startsWith(CATEGORY_SHUFFLE_PREFIX)) return null;
  return value.slice(CATEGORY_SHUFFLE_PREFIX.length);
}

// Pool every in-scope card across a list of lemmas, reusing the per-lemma
// focused-paradigm builder (so optional-form expansion, source dedup, dim
// filters and per-form dedup all apply per lemma) and concatenating. Core
// curriculum cards de-dup by card id only, so two different lemmas that happen
// to share a surface form both survive — they're different words. Non-parseable
// lemmas (stem-recall drills, redirect-only paradigms) contribute nothing, since
// the per-lemma builder already filters those out.
//
// Optional-extension cards (sourceKey "OPT_*") get an EXTRA collapse by
// (form, parse): a verb's principal-part variants (e.g. every λύω split —
// λύω, λύω → ἔλυσα, …) all share one optionalFormGroups set via registerVariants,
// so each member re-emits the same optional forms under its own lemma/id. The
// id-dedup can't catch those (the id embeds the lemma), so without this the
// cumulative λύω optionals stack up once per variant when shuffle-all / a
// category shuffle / the custom set pools the family. Collapsing by (form, parse)
// leaves a genuinely ambiguous optional form (same spelling, different parse)
// intact while dropping the variant-driven repeats — matching the single copy
// the focused "λύω — all forms" aggregate already produces (it builds optionals
// once from the base lemma).
function collectCardsForLemmas(selectedKeys, lemmas, options) {
  const out = [];
  const seenIds = new Set();
  const seenOptionalForms = new Set();
  (lemmas || []).forEach((lemma) => {
    getCardsForFocusedParadigm(selectedKeys, lemma, options).forEach((card) => {
      if (!card || seenIds.has(card.id)) return;
      const isOptional = typeof card.sourceKey === 'string' && card.sourceKey.startsWith('OPT_');
      if (isOptional) {
        const formKey = normalizeFormForDedup(card.form) + ' ' + (card.parsedAnswer || card.answer || '');
        if (seenOptionalForms.has(formKey)) return;
        seenOptionalForms.add(formKey);
      }
      seenIds.add(card.id);
      out.push(card);
    });
  });
  return out;
}

// Concrete (non-aggregate) lemmas in scope. The summative "— all forms"
// aggregates are skipped: their member variants are listed individually and
// already cover every form, so pooling the aggregate too would just re-walk
// the same cards (id-dedup collapses them anyway).
function inScopeConcreteLemmas(selectedKeys, categoryFilter) {
  return listAvailableParadigms(selectedKeys)
    .filter((p) => !p.isAggregate && (!categoryFilter || p.category === categoryFilter))
    .map((p) => p.lemma);
}

// Every parseable card across ALL in-scope paradigms — the global "shuffle all
// paradigms" parsing toggle. Chapter-gated by selectedKeys.
export function getAllParsingCards(selectedKeys, options = {}) {
  return collectCardsForLemmas(selectedKeys, inScopeConcreteLemmas(selectedKeys, null), options);
}

// Every parseable card across the in-scope paradigms of one category — the
// dropdown's "shuffle all <type>" selections (e.g. all 3rd-decl. nouns).
export function getCardsForParadigmCategory(selectedKeys, category, options = {}) {
  if (!category) return [];
  return collectCardsForLemmas(selectedKeys, inScopeConcreteLemmas(selectedKeys, category), options);
}

// Every parseable card across an explicit, user-chosen list of paradigm lemmas
// — the "custom paradigm set" parsing toggle, where the student ticks exactly
// which paradigms to pool. Chapter-gated by selectedKeys: a ticked lemma above
// the current chapter gate (or otherwise out of scope) contributes nothing
// rather than erroring. Iterates in listAvailableParadigms order (course
// progression) so the unshuffled pool matches the checkbox list, then de-dups
// exactly like the other pooled builders.
export function getCardsForParadigmLemmas(selectedKeys, lemmas, options = {}) {
  const wanted = new Set((lemmas || []).filter(Boolean));
  if (!wanted.size) return [];
  const ordered = listAvailableParadigms(selectedKeys)
    .map((p) => p.lemma)
    .filter((lemma) => wanted.has(lemma));
  return collectCardsForLemmas(selectedKeys, ordered, options);
}
