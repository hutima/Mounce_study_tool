// Interactive paradigm lookup ("Lookup mode", surfaced as "Build mode") for
// parsing.
//
// Where the parsing drill DEcomposes one known Greek form into graded steps,
// lookup mode runs the walk in reverse and ungraded: the student picks each
// dimension freely (the "parts breadcrumbs") and the tool resolves the picks
// to the matching Greek form — a conjugation / declension reference over EVERY
// legitimate form of the focused paradigm, not just the chapter-required drill
// forms. The pool is therefore built at the widest scope (all chapters,
// optional + extra forms folded in) and is never pruned by the drill's
// exclude-known / per-value filters.
//
// The walk is a faceted drill-down over the form pool: at each level it offers
// only the dimension values some still-compatible form actually carries, so a
// path can never dead-end on a paradigm cell that doesn't exist (the article
// has no vocative, ἐγώ/σύ no third person, a noun one fixed gender — those
// values are simply never offered). A dimension every still-compatible form
// shares is auto-locked (no choice to make) and shown in the breadcrumb; the
// walk completes when no remaining dimension has two or more options.

import { parseAnswerDimensions, getParadigmStepDimensionLabel, isSyncreticMiddlePassiveVoice } from './morph_steps.js';

// Canonical master order. Verb-led paradigms walk the whole thing; nominal
// paradigms only ever populate case/number/gender, which sit here in the same
// relative order — so a single list drives both, and edit-from-here truncation
// works without knowing the paradigm type. Aspect is omitted: it's derivable
// from tense and adds no form-identifying information to a lookup.
export const LOOKUP_DIMENSION_ORDER = ['tense', 'voice', 'mood', 'person', 'case', 'number', 'gender'];

// Canonical within-dimension value order (mirrors the drill's pools) so the
// option buttons always read in a stable, paradigm-table order rather than
// whatever order the forms happened to be stored in.
const VALUE_ORDER = {
  tense:  ['present', 'future', 'imperfect', 'aorist', 'perfect', 'pluperfect'],
  voice:  ['active', 'middle', 'passive', 'middle/passive'],
  mood:   ['indicative', 'subjunctive', 'imperative', 'infinitive', 'participle'],
  person: ['first', 'second', 'third'],
  case:   ['nominative', 'accusative', 'genitive', 'dative', 'vocative'],
  number: ['singular', 'plural'],
  gender: ['masculine', 'feminine', 'neuter']
};

function valueRank(dim, v) {
  const order = VALUE_ORDER[dim] || [];
  const i = order.indexOf(v);
  return i === -1 ? order.length : i;
}

// "first" → "first person" for display; every other dim's value is shown raw.
function valueDisplayLabel(dim, v) {
  return dim === 'person' ? `${v} person` : v;
}

// Two dim values are compatible if they share any '/'-separated atom — picking
// 'nominative' matches a form tagged 'nominative/accusative', and picking the
// composite matches either atom. Mirrors dimsCompatible in render.js.
function compatible(picked, formValue) {
  if (!picked || !formValue) return false;
  const a = String(picked).split('/');
  const b = String(formValue).split('/');
  return a.some((x) => b.includes(x));
}

// First/second aorist collapse to 'aorist' for the walk — the reference
// tables (and the drill's value filters) treat them as one tense.
function normalizeTense(t) {
  return String(t || '').replace(/^(first|second)\s+/, '');
}

function dimValue(form, dim) {
  return dim === 'tense' ? normalizeTense(form.dims.tense) : form.dims[dim];
}

// A pool "form" string is acceptable when every comma/slash/"or" variant it
// lists is a single Greek word (so enclitic alternates like "ἐμέ, με" and
// optional-letter forms like "ἐστι(ν)" pass) but multi-word phrases /
// translation sentences are rejected. Stem-pair shorthands (β → ἔβ) too.
function isLookupForm(form) {
  const f = String(form || '').trim();
  if (!f) return false;
  if (/[=→]/.test(f)) return false;
  const pieces = f.split(/\s*(?:,|\/|\bor\b)\s*/u).filter(Boolean);
  if (!pieces.length) return false;
  return pieces.every((pc) => !/\s/.test(pc));
}

// Present / imperfect / perfect / pluperfect collapse middle and passive into a
// single form (λύομαι is both "I loose for myself" and "I am loosed"). A source
// set that labelled such a form one-sidedly ("λύω — passive indicative") parses
// it as voice 'passive', which would expose only a 'passive' branch in the
// faceted walk. Widen it to the combined 'middle/passive' so distinctValues
// splits out BOTH a 'middle' and a 'passive' option and the student can build
// either reading — exactly the voices the parsing drill already accepts. The
// walk drives off `dims`, so also rewrite the displayed parse string to match,
// or a form reached via the 'middle' branch would still read "… passive …" on
// resolution. Future/aorist (distinct voices) and deponents are left untouched
// by the shared isSyncreticMiddlePassiveVoice predicate.
function widenSyncreticVoice(dims, parse, lemma) {
  if (!isSyncreticMiddlePassiveVoice(dims, lemma)) return parse;
  const wasCombined = dims.voice === 'middle/passive';
  dims.voice = 'middle/passive';
  return wasCombined ? parse : parse.replace(/\b(?:middle|passive)\b/, 'middle/passive');
}

// Build the lookup form pool from a set of morph cards plus the lemma's
// extraForms. Each entry: { form, dims, parse }. Deduped by form‖parse so a
// syncretic form contributing multiple parses (ἔλυον = imperfect active 1sg
// AND 3pl) keeps each parse path, while the same (form,parse) arriving from
// several overlapping sources collapses to one.
export function buildLookupPool(cards, lemma) {
  const seen = new Set();
  const pool = [];
  const add = (form, parse) => {
    if (!form || !parse) return;
    if (!isLookupForm(form)) return;
    const dims = parseAnswerDimensions(parse);
    // Require at least one parseable dimension; concept cards ("what kind of
    // verb is εἰμί?") collapse to none and would be un-walkable noise.
    if (!(dims.tense || dims.voice || dims.mood || dims.person
          || dims.case || dims.number || dims.gender)) return;
    const displayParse = widenSyncreticVoice(dims, String(parse), lemma);
    const f = String(form).trim();
    const key = `${f}‖${displayParse.toLowerCase().trim()}`;
    if (seen.has(key)) return;
    seen.add(key);
    pool.push({ form: f, dims, parse: displayParse });
  };
  (cards || []).forEach((card) => {
    if (!card) return;
    add(card.form, card.parsedAnswer || card.answer);
    // A card's formToAnswer carries its whole paradigm subset's form→parse
    // map — fold it in for maximum coverage of the focused paradigm.
    if (card.formToAnswer && typeof card.formToAnswer === 'object') {
      Object.entries(card.formToAnswer).forEach(([form, parse]) => add(form, parse));
    }
  });
  // extraForms: morphologically real forms no drill card carries (εἰμί's
  // future participle, etc.). Always folded in — lookup is "all legitimate
  // morphs", which is exactly what extraForms exists to supply.
  const inv = (lemma && typeof window !== 'undefined' && window.LEMMA_INVENTORY)
    ? window.LEMMA_INVENTORY[lemma]
    : null;
  if (inv && inv.extraForms && typeof inv.extraForms === 'object') {
    Object.entries(inv.extraForms).forEach(([form, parse]) => add(form, parse));
  }
  return pool;
}

function distinctValues(forms, dim) {
  const set = new Set();
  forms.forEach((f) => {
    const raw = dimValue(f, dim);
    if (!raw) return;
    String(raw).split('/').forEach((atom) => { if (atom) set.add(atom); });
  });
  return [...set].sort((a, b) => valueRank(dim, a) - valueRank(dim, b) || a.localeCompare(b));
}

function poolIsVerb(pool) {
  return (pool || []).some((f) => f.dims.tense || f.dims.voice || f.dims.person);
}

function dedupeForms(forms) {
  const seen = new Set();
  const out = [];
  (forms || []).forEach((f) => {
    if (seen.has(f.form)) return;
    seen.add(f.form);
    out.push({ form: f.form, parse: f.parse });
  });
  return out;
}

// Resolve the current state of a lookup walk for the given picks.
// Returns { trail, next, matches, isVerb, empty } where:
//   trail   — [{ dim, label, value, valueLabel, locked }] decided dimensions
//             in walk order. `locked` ones were auto-filled (only one value
//             possible); the rest are explicit, editable user picks.
//   next    — { dim, label, options:[{value,label}] } the next dimension to
//             pick, or null when the walk is complete.
//   matches — distinct resolved forms [{ form, parse }] still compatible with
//             the picks (one when fully determined; a few for true variants).
//   isVerb  — whether the pool is verb-led (cosmetic, for the header).
//   empty   — true when the pool has no walkable forms at all.
export function resolveLookupWalk(pool, picks) {
  const forms = Array.isArray(pool) ? pool : [];
  const p = (picks && typeof picks === 'object') ? picks : {};
  const isVerb = poolIsVerb(forms);
  if (!forms.length) return { trail: [], next: null, matches: [], isVerb, empty: true };

  let compat = forms.slice();
  const trail = [];
  let next = null;
  for (const dim of LOOKUP_DIMENSION_ORDER) {
    const values = distinctValues(compat, dim);
    if (!values.length) continue; // no compatible form carries this dim → skip
    const label = getParadigmStepDimensionLabel(dim);
    if (Object.prototype.hasOwnProperty.call(p, dim)) {
      const picked = p[dim];
      const narrowed = compat.filter((f) => compatible(picked, dimValue(f, dim)));
      if (!narrowed.length) {
        // Stale pick (pool changed under it): treat this dim as the next step
        // and let the user re-pick from the current options.
        next = { dim, label, options: values.map((v) => ({ value: v, label: valueDisplayLabel(dim, v) })) };
        break;
      }
      compat = narrowed;
      trail.push({ dim, label, value: picked, valueLabel: valueDisplayLabel(dim, picked), locked: false });
      continue;
    }
    if (values.length === 1) {
      compat = compat.filter((f) => compatible(values[0], dimValue(f, dim)));
      trail.push({ dim, label, value: values[0], valueLabel: valueDisplayLabel(dim, values[0]), locked: true });
      continue;
    }
    next = { dim, label, options: values.map((v) => ({ value: v, label: valueDisplayLabel(dim, v) })) };
    break;
  }
  return { trail, next, matches: dedupeForms(compat), isVerb, empty: false };
}

// Drop `dim` and every later dimension (in master order) from a picks map —
// used when the student taps a decided breadcrumb chip to re-pick from there.
// Returns a new object; the input isn't mutated.
export function truncatePicksFrom(picks, dim) {
  const start = LOOKUP_DIMENSION_ORDER.indexOf(dim);
  if (start < 0) return { ...(picks || {}) };
  const drop = new Set(LOOKUP_DIMENSION_ORDER.slice(start));
  const out = {};
  Object.keys(picks || {}).forEach((k) => { if (!drop.has(k)) out[k] = picks[k]; });
  return out;
}
