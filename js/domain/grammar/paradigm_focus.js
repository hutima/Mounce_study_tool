// Catalog + chapter-gated lookups for the step-by-step morphology drill.
//
// When step-by-step mode is on, a single paradigm (lemma) is focused at a
// time. The eligible cards for that lemma include every morph set whose
// "level" is at or below the user's max selected level — chapter-keyed sets
// gate against the max selected numeric chapter, W*_* sets against the max
// selected week. That matches "include all forms a lemma has been expanded
// to across previously-covered chapters" while still honoring the user's
// chapter selection as the upper bound.

function safeMorphSets() {
  const sets = (typeof window !== 'undefined' && window.MORPHOLOGY_SETS) || {};
  return sets;
}

function sourceLevel(sourceKey) {
  const str = String(sourceKey || '');
  const numericChapter = Number(str);
  if (!Number.isNaN(numericChapter) && /^\d+$/.test(str)) {
    return { kind: 'chapter', value: numericChapter };
  }
  const weekMatch = str.match(/^W(\d+)_/);
  if (weekMatch) return { kind: 'week', value: Number(weekMatch[1]) };
  return { kind: 'other', value: 0 };
}

export function deriveSelectionLevels(selectedKeys) {
  let maxChapter = -Infinity;
  let maxWeek = -Infinity;
  (selectedKeys || []).forEach((k) => {
    const lvl = sourceLevel(k);
    if (lvl.kind === 'chapter') maxChapter = Math.max(maxChapter, lvl.value);
    if (lvl.kind === 'week') maxWeek = Math.max(maxWeek, lvl.value);
  });
  return {
    maxChapter: maxChapter === -Infinity ? null : maxChapter,
    maxWeek: maxWeek === -Infinity ? null : maxWeek
  };
}

function sourcePassesLevel(sourceKey, levels) {
  const lvl = sourceLevel(sourceKey);
  if (lvl.kind === 'chapter') return levels.maxChapter != null && lvl.value <= levels.maxChapter;
  if (lvl.kind === 'week') return levels.maxWeek != null && lvl.value <= levels.maxWeek;
  return false;
}

// Returns the list of paradigm lemmas that are present in the currently-
// selected morph sets. Each entry: { lemma, displayLabel, sources: [keys] }.
// Used to populate the focused-paradigm dropdown.
export function listAvailableParadigms(selectedKeys) {
  const sets = safeMorphSets();
  const seen = new Map();
  (selectedKeys || []).forEach((key) => {
    const set = sets[String(key)];
    if (!set || !Array.isArray(set.items)) return;
    set.items.forEach((item) => {
      if (!item || !item.lemma) return;
      const lemma = item.lemma;
      if (!seen.has(lemma)) {
        seen.set(lemma, {
          lemma,
          displayLabel: lemma + (item.gloss ? ` — ${item.gloss}` : ''),
          sources: new Set()
        });
      }
      seen.get(lemma).sources.add(String(key));
    });
  });
  return [...seen.values()].map((p) => ({ ...p, sources: [...p.sources] }));
}

// Given a focused lemma and the selection, return every morph card across
// all sources whose source level is ≤ the user's max selected level. Cards
// are built the same way buildMorphologyCardsForKeys does so they fit the
// existing renderer, but they're filtered to the focused lemma.
export function getCardsForFocusedParadigm(selectedKeys, focusedLemma) {
  if (!focusedLemma) return [];
  if (typeof window === 'undefined' || typeof window.buildMorphologyCardsForKeys !== 'function') return [];

  const sets = safeMorphSets();
  const levels = deriveSelectionLevels(selectedKeys);
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

// Pick a sensible default focused paradigm when the user hasn't chosen one.
// Strategy: first paradigm in the selection by source key order.
export function chooseDefaultFocusedParadigm(selectedKeys) {
  const available = listAvailableParadigms(selectedKeys);
  if (!available.length) return null;
  return available[0].lemma;
}
