// Deck ordering and set key helpers.
// Mounce variant: chapter keys, supplemental keys (S<chapter>_*), and advanced
// frequency-bucket keys (ADV<n>). Week/odd-supplemental keys from the Duff
// build are no longer emitted, but legacy patterns still parse so old saved
// state can be migrated cleanly.
import { CHAPTER_TO_PART } from '../../data/setMeta.js';

function getSets() {
  return window.SETS && typeof window.SETS === 'object' ? window.SETS : {};
}

export function isChapterKey(key) {
  return /^\d+$/.test(String(key));
}

export function isAdvancedKey(key) {
  return /^ADV\d+$/i.test(String(key || ''));
}

export function sortSetKeys(keys) {
  function score(key) {
    const raw = String(key);
    if (/^\d+$/.test(raw)) return Number(raw);
    const supp = raw.match(/^S(\d+)_/i);
    if (supp) return 100 + Number(supp[1]);
    // Legacy Duff supplemental keys (sorted after but before advanced).
    const legacyOdd = raw.match(/^W(\d+)O$/);
    if (legacyOdd) return 500 + Number(legacyOdd[1]);
    const legacyWeek = raw.match(/^W(\d+)_/);
    if (legacyWeek) return 600 + Number(legacyWeek[1]);
    const adv = raw.match(/^ADV(\d+)$/i);
    if (adv) return 1000 + Number(adv[1]);
    return 999;
  }
  return [...keys].sort((a, b) => {
    const diff = score(a) - score(b);
    return diff || String(a).localeCompare(String(b));
  });
}

export function displaySetShortLabel(key) {
  const raw = String(key);
  if (/^\d+$/.test(raw)) return `Ch. ${raw}`;
  const sets = getSets();
  return sets[raw]?.label || raw;
}

export function sourceHint(key) {
  const raw = String(key);
  if (/^\d+$/.test(raw)) return `Ch. ${raw}`;
  const sets = getSets();
  return sets[raw]?.label || raw;
}

// Note: this returns the Mounce *part* number for chapter keys. Kept under
// the original name so the supplemental selector can still group numerically.
export function getWeekForKey(key) {
  const raw = String(key);
  if (isChapterKey(raw)) return CHAPTER_TO_PART[Number(raw)] || null;
  const sets = getSets();
  return sets[raw]?.week || null;
}

export function getChapterForKey(key) {
  const raw = String(key);
  return isChapterKey(raw) ? Number(raw) : null;
}

export function getOtherKeysForWeeks(weeks) {
  const partSet = new Set((weeks || []).map(Number).filter(Boolean));
  const sets = getSets();
  return Object.keys(sets).filter(key => {
    const set = sets[key];
    return set && (set.type === 'other' || set.type === 'supplemental' || set.supplemental) && partSet.has(Number(set.week));
  });
}

export function expandSessionSets(session) {
  const rawSets = (session?.sets || []).map(String);
  return sortSetKeys([...new Set(rawSets.filter(k => isChapterKey(k) || isAdvancedKey(k) || (window.SETS && window.SETS[k])))]);
}
