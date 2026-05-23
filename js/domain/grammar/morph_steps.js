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
  tense:  ['present', 'future', 'imperfect', 'aorist', 'first aorist', 'second aorist', 'perfect', 'pluperfect'],
  voice:  ['active', 'middle', 'passive', 'middle/passive'],
  mood:   ['indicative', 'subjunctive', 'imperative', 'infinitive', 'participle'],
  person: ['first', 'second', 'third'],
  case:   ['nominative', 'accusative', 'genitive', 'dative', 'vocative'],
  number: ['singular', 'plural'],
  gender: ['masculine', 'feminine', 'neuter']
};

const DIM_LABEL = {
  tense:  'Tense',
  voice:  'Voice',
  mood:   'Mood',
  person: 'Person',
  case:   'Case',
  number: 'Number',
  gender: 'Gender'
};

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

  return { tense, voice, mood, person, case: grammaticalCase, number, gender };
}

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildChoices(dimensionKey, correct) {
  const pool = DIM_POOLS[dimensionKey] || [];
  const seen = new Set([correct]);
  // For syncretic case ("nominative/accusative") or aggregate gender ("all
  // genders"), distractors come from the single-value pool plus the correct
  // syncretic form so the right answer is still selectable.
  const distractors = [];
  for (const candidate of shuffle(pool)) {
    if (seen.has(candidate)) continue;
    distractors.push(candidate);
    seen.add(candidate);
    if (distractors.length >= 3) break;
  }
  return shuffle([correct, ...distractors]);
}

function applyDisplaySuffix(dimensionKey, value) {
  const suffix = DIM_DISPLAY_SUFFIX[dimensionKey];
  return suffix ? `${value}${suffix}` : value;
}

// Returns ordered dimension steps for this card. Each step:
//   { key, label, correct, choices, displayChoices, displayCorrect }
// `correct` and `choices` are the canonical (lowercase, no-suffix) tokens
// that the renderer compares against; `display*` are the user-facing strings
// (e.g. "first person" instead of "first").
export function buildMorphSteps(card) {
  if (!card || card.kind !== 'morph') return [];
  const dims = parseAnswerDimensions(card.answer);

  // Determine the dimension order. Verbs lead with tense; nominals with case.
  const isVerb = !!(dims.tense || dims.voice || dims.person);
  const order = isVerb
    ? ['tense', 'voice', 'mood', 'person', 'case', 'number', 'gender']
    : ['case', 'number', 'gender', 'tense', 'voice', 'mood', 'person'];

  const steps = [];
  for (const dimKey of order) {
    const correct = dims[dimKey];
    if (!correct) continue;
    const choices = buildChoices(dimKey, correct);
    const displayCorrect = applyDisplaySuffix(dimKey, correct);
    const displayChoices = choices.map((c) => applyDisplaySuffix(dimKey, c));
    steps.push({
      key: dimKey,
      label: DIM_LABEL[dimKey] || dimKey,
      correct,
      choices,
      displayCorrect,
      displayChoices
    });
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
