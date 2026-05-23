// Decomposes a morphology card's canonical answer (e.g. "first aorist active
// indicative second person plural") into an ordered sequence of single-
// dimension multiple-choice steps for the step-by-step parsing drill.
//
// Dimension ordering, fixed:
//   verbs:    tense → voice → mood → person → number   (+ case/number/gender
//             tail for participles, no person)
//   nominals: case → number → gender
//
// Wrong picks reveal the correct dimension answer, then advance.

// Master pool of choices per dimension. The decomposer derives the correct
// answer from the card's parsed answer string and pulls distractors from the
// remaining pool entries for that dimension.
const DIM_POOLS = {
  aspect: ['continuous', 'undefined', 'continuous/undefined', 'completed'],
  tense:  ['present', 'future', 'imperfect', 'aorist', 'first aorist', 'second aorist', 'perfect', 'pluperfect'],
  voice:  ['active', 'middle', 'passive', 'middle/passive'],
  mood:   ['indicative', 'subjunctive', 'imperative', 'infinitive', 'participle'],
  person: ['first', 'second', 'third'],
  case:   ['nominative', 'accusative', 'genitive', 'dative', 'vocative'],
  number: ['singular', 'plural'],
  gender: ['masculine', 'feminine', 'neuter']
};

const DIM_LABEL = {
  aspect: 'Aspect',
  tense:  'Tense',
  voice:  'Voice',
  mood:   'Mood',
  person: 'Person',
  case:   'Case',
  number: 'Number',
  gender: 'Gender'
};

// Aspect is implicit in tense in Mounce's pedagogy. Present and future are
// genuinely ambiguous between continuous (imperfective) and undefined
// (aoristic) — the form alone doesn't pick one (progressive vs gnomic for
// the present; context decides for the future), so the right parse is the
// composite 'continuous/undefined'. Imperfect commits to continuous,
// aorist to undefined, perfect/pluperfect to completed. Exactly one
// correct aspect per tense; picking just one half of the composite for
// present/future overcommits and is marked wrong.
const TENSE_TO_ASPECT = {
  'present':       'continuous/undefined',
  'imperfect':     'continuous',
  'future':        'continuous/undefined',
  'aorist':        'undefined',
  'first aorist':  'undefined',
  'second aorist': 'undefined',
  'perfect':       'completed',
  'pluperfect':    'completed'
};

export function aspectForTense(tense) {
  return TENSE_TO_ASPECT[tense] || '';
}

// When the student gets the aspect step wrong, returns a short clarifying
// note explaining the mistake. Especially important when the picked value
// visually overlaps the correct one (e.g. picking "continuous" when the
// correct is "continuous/undefined") — the strikethrough alone reads like
// a close miss rather than a real error, so an explicit note disambiguates.
// Returns '' when no special note is warranted (e.g. picking "continuous"
// for an aorist; the standard "continuous → undefined" line is clear).
export function aspectMistakeNote(tense, picked, correct) {
  if (!tense || !picked || picked === correct) return '';
  if (correct === 'continuous/undefined') {
    return `${tense} is aspectually ambiguous — pick continuous/undefined, not just ${picked}`;
  }
  if (picked === 'continuous/undefined') {
    return `${tense} isn't ambiguous — it commits to ${correct}`;
  }
  return '';
}

const DIM_DISPLAY_SUFFIX = {
  person: ' person'
};

function findToken(text, regex) {
  if (!text) return '';
  const match = String(text).match(regex);
  return match ? match[0].toLowerCase() : '';
}

// Parse a canonical answer like "aorist active indicative first person plural"
// or "nominative singular masculine" into { tense, voice, mood, person, case,
// number, gender }, with missing dimensions left as ''.
export function parseAnswerDimensions(answer) {
  const a = String(answer || '').toLowerCase();
  // Normalize "X or Y" → "X/Y" for voice/case syncretism, then strip
  // grouping punctuation. Mounce writes "nominative or accusative singular
  // neuter" and "middle or passive" — the slash-form is what the regexes
  // and DIM_POOLS canonicalize to.
  const cleaned = a
    .replace(/(nominative|accusative|genitive|dative|vocative)\s+or\s+(nominative|accusative|genitive|dative|vocative)/g, '$1/$2')
    .replace(/(masculine|feminine|neuter)\s+or\s+(masculine|feminine|neuter)/g, '$1/$2')
    .replace(/middle\s+or\s+passive/g, 'middle/passive')
    .replace(/[(),;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const qualifierTense = findToken(cleaned, /\b(first aorist|second aorist|1st aorist|2nd aorist)\b/)
    .replace(/^1st\b/, 'first')
    .replace(/^2nd\b/, 'second');
  const tense = qualifierTense
    || findToken(cleaned, /\b(present|future|imperfect|aorist|perfect|pluperfect)\b/);
  const voice = findToken(cleaned, /\b(middle\/passive|mid\/pas|active|middle|passive)\b/)
    .replace(/^mid\/pas$/, 'middle/passive');
  const mood = findToken(cleaned, /\b(indicative|subjunctive|imperative|infinitive|participle)\b/);
  // Person: accept both "first person" (duff/long form) and "1st" (Mounce
  // shorthand, where person appears as "1st singular" / "2nd plural" with
  // no "person" token). Normalize the digit form to the long form so
  // DIM_POOLS distractors stay consistent.
  let person = findToken(cleaned, /\b(first|second|third)\s+person\b/).replace(/\s+person$/, '');
  if (!person) {
    const m = cleaned.match(/\b(1st|2nd|3rd)\s+(singular|plural)\b/);
    if (m) person = { '1st': 'first', '2nd': 'second', '3rd': 'third' }[m[1]];
  }
  const number = findToken(cleaned, /\b(singular|plural)\b/);

  // Case can be syncretic (e.g. "nominative/accusative"). Capture as-is.
  const caseMatch = cleaned.match(/\b((?:nominative|accusative|genitive|dative|vocative)(?:\/(?:nominative|accusative|genitive|dative|vocative))*)\b/);
  const grammaticalCase = caseMatch ? caseMatch[1] : '';

  // Gender can be combined ("all genders" / "masculine/feminine/neuter").
  const allGenders = /\ball genders?\b/.test(cleaned) || /\bmasculine\/feminine\/neuter\b/.test(cleaned);
  const gender = allGenders
    ? 'all genders'
    : (cleaned.match(/\b(masculine|feminine|neuter)(?:\/(?:masculine|feminine|neuter))*\b/) || [''])[0];

  // Aspect is derived from tense (Mounce's pedagogy: aspect is the primary
  // category, with tense as a secondary marker). Missing tense → no aspect.
  const aspect = tense ? aspectForTense(tense) : '';

  return { aspect, tense, voice, mood, person, case: grammaticalCase, number, gender };
}

// 2nd-person plural present (any voice) is genuinely syncretic in Koine
// Greek: the indicative and imperative are spelt the same — λύετε is both
// "you (pl.) are untying" and "untie!"; likewise λύεσθε for the middle/
// passive. The form alone doesn't pick one mood; only context (presence
// of a subject, surrounding clauses) decides. When a card's parse names
// this configuration we accept either mood at the Mood step, instead of
// marking the alternate reading wrong.
//
// Detected from the raw answer text so this works across canonical
// ("second person plural") and abbreviated ("2nd pl.") formats. Imperative
// cards may omit person entirely (structurally 2nd) — treated as 2nd-pl
// when the only number marker is plural and no 1st/3rd person tag appears.
export function isSecondPluralPresentMoodAmbiguity(answer, parsedDims) {
  if (!answer) return false;
  const dims = parsedDims || parseAnswerDimensions(answer);
  if (dims.tense !== 'present') return false;
  if (dims.mood !== 'indicative' && dims.mood !== 'imperative') return false;
  const a = String(answer).toLowerCase();
  const isPlural = dims.number === 'plural' || /\bplural\b/.test(a) || /\bpl\./.test(a);
  if (!isPlural) return false;
  if (dims.person === 'second') return true;
  if (/\b2nd\b/.test(a) || /\bsecond person\b/.test(a)) return true;
  // Imperative cards are structurally 2nd person and often omit person
  // markers entirely. Treat as 2nd plural when no other person is named.
  if (dims.mood === 'imperative' && !dims.person
      && !/\b(1st|3rd|first person|third person)\b/.test(a)) {
    return true;
  }
  return false;
}

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildChoices(dimensionKey, correct, accessiblePool) {
  // Prefer the chapter-gated accessible pool when provided (only values that
  // appear in morph cards the student has access to at their current point
  // in the course). Fall back to the full DIM_POOLS list if no pool was
  // passed — useful for unit tests and for callers that don't gate.
  //
  // The full accessible pool is shown — every distinct value the student has
  // learned for this dimension to date — rather than a 4-choice cap. As the
  // course progresses the choice list grows, mirroring expanding paradigm
  // recognition.
  const sourcePool = accessiblePool && accessiblePool.length
    ? accessiblePool
    : (DIM_POOLS[dimensionKey] || []);
  const seen = new Set([correct]);
  const distractors = [];
  for (const candidate of sourcePool) {
    if (seen.has(candidate)) continue;
    distractors.push(candidate);
    seen.add(candidate);
  }
  return shuffle([correct, ...distractors]);
}

// Walks a set of morph cards (e.g. every card whose source chapter is ≤ the
// student's max selected chapter) and returns the unique values that appear
// in each parsing dimension. Used to build chapter-gated MC distractor pools
// so the drill never asks about a tense/mood/case the textbook hasn't yet
// introduced.
export function computeAccessibleDimensionPools(cards) {
  const pools = {
    aspect: new Set(), tense: new Set(), voice: new Set(), mood: new Set(), person: new Set(),
    case: new Set(), number: new Set(), gender: new Set()
  };
  (cards || []).forEach((card) => {
    if (!card || !card.answer) return;
    const dims = parseAnswerDimensions(card.answer);
    Object.keys(pools).forEach((k) => {
      if (dims[k]) pools[k].add(dims[k]);
    });
    // Aspect pool: continuous, undefined, and the composite continuous/undefined
    // are foundational from the present onward, so always expose all three
    // as choices — the student needs to distinguish "either reading is valid"
    // from "this form commits to one reading" on every card. The composite is
    // never auto-correct from being present in the choices: it's only right
    // for present/future. 'completed' arrives via the per-card add above
    // when a perfect-stem form is in the accessible set.
    if (dims.tense) {
      pools.aspect.add('continuous');
      pools.aspect.add('undefined');
      pools.aspect.add('continuous/undefined');
    }
  });
  const out = {};
  Object.keys(pools).forEach((k) => { out[k] = [...pools[k]]; });
  return out;
}

// When the student picks a mood that requires more dimensions than the
// source card's parse class supplied, returns the dim keys to inject as
// ungraded follow-up steps. Example: card λῦε is a 2-singular imperative
// — its steps don't include person (the canonicalized answer drops "2nd"
// without "person"). If the student picks mood=indicative, they need to
// commit to a person before we can resolve their picks to a single Greek
// form; inject person (and number if the card also lacks one).
//
// Imperative is treated specially: it's structurally 2nd person (Koine has
// no 1st-person imperatives), so person is never injected — only number.
//
// Returns [] when no injection is needed. Voice is never injected here —
// it's introduced in chapter 15 and gated separately.
const FINITE_MOODS_NEEDING_PERSON_NUMBER = new Set(['indicative', 'subjunctive', 'optative']);
export function inferredFollowupDims(stepKey, picked, existingStepKeys) {
  if (stepKey !== 'mood' || !picked) return [];
  const have = existingStepKeys instanceof Set ? existingStepKeys : new Set(existingStepKeys || []);
  const out = [];
  if (FINITE_MOODS_NEEDING_PERSON_NUMBER.has(picked)) {
    if (!have.has('person')) out.push('person');
    if (!have.has('number')) out.push('number');
  } else if (picked === 'imperative') {
    // Structurally 2nd person — only number disambiguates the form.
    if (!have.has('number')) out.push('number');
  } else if (picked === 'participle') {
    if (!have.has('case'))   out.push('case');
    if (!have.has('number')) out.push('number');
    if (!have.has('gender')) out.push('gender');
  }
  // infinitive: no follow-ups needed (no person/number/case/gender).
  return out;
}

// Structural impossibilities in Koine Greek that don't depend on a specific
// lemma — these are paradigm-level gaps any verb shares. Separate from the
// per-lemma negative inventory in js/data/lemma_inventory.js (which handles
// lemma-specific gaps like aorist εἰμί). When the student's picks combine
// into one of these, the form lookup should explain *why* no morph exists
// instead of just rendering "[no morph exists]".
const STRUCTURAL_TENSE_MOOD_IMPOSSIBILITIES = [
  { tense: 'future',     mood: 'imperative',  why: 'no future imperative exists' },
  { tense: 'future',     mood: 'subjunctive', why: 'no future subjunctive exists' },
  { tense: 'imperfect',  mood: 'subjunctive', why: 'no imperfect subjunctive exists (imperfect is indicative-only)' },
  { tense: 'imperfect',  mood: 'imperative',  why: 'no imperfect imperative exists (imperfect is indicative-only)' },
  { tense: 'imperfect',  mood: 'infinitive',  why: 'no imperfect infinitive exists (imperfect is indicative-only)' },
  { tense: 'imperfect',  mood: 'participle',  why: 'no imperfect participle exists (imperfect is indicative-only)' },
  { tense: 'pluperfect', mood: 'subjunctive', why: 'no pluperfect subjunctive exists (pluperfect is indicative-only)' },
  { tense: 'pluperfect', mood: 'imperative',  why: 'no pluperfect imperative exists (pluperfect is indicative-only)' }
];

// Returns a short explanation when the picked (tense, mood) combo is
// structurally impossible in Koine, or null otherwise. Aorist qualifiers
// (first/second) are collapsed onto 'aorist' since they don't introduce
// new mood gaps.
export function structuralImpossibilityReason(pickedDims) {
  if (!pickedDims) return null;
  const tenseRaw = String(pickedDims.tense || '').toLowerCase();
  const mood = String(pickedDims.mood || '').toLowerCase();
  if (!tenseRaw || !mood) return null;
  const tense = tenseRaw.replace(/^(first |second )/, '');
  for (const entry of STRUCTURAL_TENSE_MOOD_IMPOSSIBILITIES) {
    if (entry.tense === tense && entry.mood === mood) return entry.why;
  }
  return null;
}

// Builds an ungraded follow-up step for the given dimension. Choices come
// from the chapter-gated accessible pool when available; falls back to
// the full DIM_POOLS. The returned step has `inferred: true` and no
// `correct` value — it's scored as informational, not graded against the
// source card.
export function buildInferredStep(dimKey, accessiblePools) {
  const pool = (accessiblePools && Array.isArray(accessiblePools[dimKey]) && accessiblePools[dimKey].length)
    ? accessiblePools[dimKey]
    : (DIM_POOLS[dimKey] || []);
  if (!pool.length) return null;
  const choices = shuffle([...pool]);
  const displayChoices = choices.map((c) => applyDisplaySuffix(dimKey, c));
  return {
    key: dimKey,
    label: DIM_LABEL[dimKey] || dimKey,
    correct: null,
    acceptable: [],
    choices,
    displayCorrect: '',
    displayChoices,
    inferred: true
  };
}

function applyDisplaySuffix(dimensionKey, value) {
  const suffix = DIM_DISPLAY_SUFFIX[dimensionKey];
  return suffix ? `${value}${suffix}` : value;
}

// Returns ordered dimension steps for this card. Each step:
//   { key, label, correct, choices, displayChoices, displayCorrect }
// `accessiblePools` is the optional chapter-gated distractor pool produced by
// computeAccessibleDimensionPools — pass it in to restrict MC choices to
// values the textbook has introduced so far.
export function buildMorphSteps(card, accessiblePools = null) {
  if (!card || card.kind !== 'morph') return [];
  const dims = parseAnswerDimensions(card.answer);

  // Determine the dimension order. Verbs lead with aspect → tense (Mounce's
  // aspect-first pedagogy), then voice → mood → person → number, with a
  // case/number/gender tail for participles. Nominals skip the verb steps.
  const isVerb = !!(dims.tense || dims.voice || dims.person);
  const order = isVerb
    ? ['aspect', 'tense', 'voice', 'mood', 'person', 'case', 'number', 'gender']
    : ['case', 'number', 'gender', 'aspect', 'tense', 'voice', 'mood', 'person'];

  const steps = [];
  for (const dimKey of order) {
    const correct = dims[dimKey];
    if (!correct) continue;
    // Imperative is structurally 2nd person in Koine — skip the person step
    // for imperative cards so the dimension count matches non-explicit
    // imperatives (e.g. "active imperative singular" with no "second person"
    // tag).
    if (dimKey === 'person' && dims.mood === 'imperative') continue;
    const pool = accessiblePools ? accessiblePools[dimKey] : null;
    const choices = buildChoices(dimKey, correct, pool);
    const displayCorrect = applyDisplaySuffix(dimKey, correct);
    const displayChoices = choices.map((c) => applyDisplaySuffix(dimKey, c));
    // Each dimension has exactly one correct value per card. For aspect on
    // present/future verbs the correct value is the composite
    // 'continuous/undefined' (since either reading is licensed by the form);
    // for imperfect/aorist/perfect/pluperfect it's a single specific aspect.
    // The aspect step carries a `context.tense` so the wrong-answer
    // comparator can spell out the mistake when picked and correct overlap
    // visually (e.g. picked "continuous" vs correct "continuous/undefined").
    const step = {
      key: dimKey,
      label: DIM_LABEL[dimKey] || dimKey,
      correct,
      acceptable: [correct],
      choices,
      displayCorrect,
      displayChoices
    };
    if (dimKey === 'aspect' && dims.tense) {
      step.context = { tense: dims.tense };
    }
    if (dimKey === 'mood' && isSecondPluralPresentMoodAmbiguity(card.answer, dims)) {
      step.acceptable = ['indicative', 'imperative'];
    }
    steps.push(step);
  }
  return steps;
}

// ─── Per-lemma rolling stats (sliding window of last N attempts) ─────────

const ATTEMPT_WINDOW = 20;

export function ensureParadigmStepStats(store) {
  if (!store || typeof store !== 'object') return {};
  if (typeof store.byLemma !== 'object' || store.byLemma === null) store.byLemma = {};
  return store;
}

// Record one attempt: a fully walked card with per-dimension correctness.
// stats: { byLemma: { lemma: { attempts: [...] } } }
export function recordParadigmAttempt(stats, lemma, dimResults) {
  if (!lemma || !dimResults) return;
  ensureParadigmStepStats(stats);
  if (!stats.byLemma[lemma]) stats.byLemma[lemma] = { attempts: [] };
  const entry = stats.byLemma[lemma];
  if (!Array.isArray(entry.attempts)) entry.attempts = [];
  entry.attempts.push({ at: Date.now(), dims: { ...dimResults } });
  while (entry.attempts.length > ATTEMPT_WINDOW) entry.attempts.shift();
}

// Aggregate accuracy for a single lemma's recent attempts.
// Returns { total, correct, perDim: { tense: {seen, correct}, ... } }
export function summarizeLemmaStats(stats, lemma) {
  const empty = { total: 0, correct: 0, perDim: {}, attempts: 0 };
  if (!stats || !stats.byLemma || !stats.byLemma[lemma]) return empty;
  const attempts = stats.byLemma[lemma].attempts || [];
  let total = 0, correct = 0;
  const perDim = {};
  for (const a of attempts) {
    if (!a || !a.dims) continue;
    for (const [dim, val] of Object.entries(a.dims)) {
      if (!perDim[dim]) perDim[dim] = { seen: 0, correct: 0 };
      perDim[dim].seen += 1;
      if (val) perDim[dim].correct += 1;
      total += 1;
      if (val) correct += 1;
    }
  }
  return { total, correct, perDim, attempts: attempts.length };
}

export function getAllLemmaStats(stats) {
  if (!stats || !stats.byLemma) return [];
  return Object.keys(stats.byLemma).map((lemma) => ({
    lemma,
    ...summarizeLemmaStats(stats, lemma)
  })).filter((s) => s.attempts > 0);
}

export function getParadigmStepDimensionLabel(dimKey) {
  return DIM_LABEL[dimKey] || dimKey;
}

export function getParadigmStepAttemptWindow() {
  return ATTEMPT_WINDOW;
}
