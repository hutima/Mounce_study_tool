import { getUnspacedArchiveDayKey } from '../../utils/time.js';

// A synthetic review deck. Eligibility is supplied by the existing scheduler;
// Sample base-word groups; their virtual faces ride along without using a slot.
export const BATCH_SIZE = 20;
const MAX_BATCH_FACES = 1000; // defensive persistence bound, not the word limit

export function sanitizeSessions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const entries = Object.entries(value).filter(([, batch]) => batch && Array.isArray(batch.ids) && Array.isArray(batch.pending));
  entries.sort((a, b) => (Number(b[1].savedAt) || 0) - (Number(a[1].savedAt) || 0));
  return Object.fromEntries(entries.slice(0, 16).map(([key, batch]) => {
    const ids = [...new Set(batch.ids.filter(id => typeof id === 'string'))].slice(0, MAX_BATCH_FACES);
    const allowed = new Set(ids);
    const pending = [...new Set(batch.pending.filter(id => allowed.has(id)))];
    const savedAt = Number(batch.savedAt) || 0;
    const dayKey = typeof batch.dayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(batch.dayKey)
      ? batch.dayKey : getUnspacedArchiveDayKey(savedAt || Date.now());
    return [key, { ids, pending, groupsVersion: batch.groupsVersion === 2 ? 2 : 1, savedAt, dayKey }];
  }));
}

export function isBatchCurrent(batch, now = Date.now()) {
  return !!batch && (batch.dayKey || getUnspacedArchiveDayKey(batch.savedAt || now)) === getUnspacedArchiveDayKey(now);
}

export function getBatch(sessions, key, cards, eligible, random = Math.random, groupKey = card => card.id, { replace = false, now = Date.now() } = {}) {
  const allowed = new Set(cards.map(card => card.id));
  const groups = new Map();
  const byId = new Map();
  for (const card of cards) {
    const group = groupKey(card);
    if (!groups.has(group)) groups.set(group, new Set());
    groups.get(group).add(card.id);
    byId.set(card.id, card);
  }
  let batch = sessions[key];
  const previousGroups = new Set((batch?.ids || []).filter(id => allowed.has(id)).map(id => groupKey(byId.get(id))));
  if (replace || !isBatchCurrent(batch, now)) batch = null;
  if (batch) {
    batch.ids = batch.ids.filter(id => allowed.has(id));
    batch.pending = batch.pending.filter(id => allowed.has(id));
  }
  // Repair old batches and include any newly enabled sibling faces in place,
  // even if the batch was previously complete. Keep existing grades and words.
  if (batch?.ids.length) {
    const selectedGroups = new Set(batch.ids.map(id => groupKey(byId.get(id))));
    const present = new Set(batch.ids);
    for (const group of selectedGroups) {
      for (const id of groups.get(group)) {
        if (present.has(id)) continue;
        batch.ids.push(id);
        if (eligible(byId.get(id))) batch.pending.push(id);
        present.add(id);
      }
    }
    batch.groupsVersion = 2;
  }
  if (!batch || !batch.ids.length) {
    const eligibleIds = new Set(cards.filter(eligible).map(card => card.id));
    const pool = [...groups.entries()].filter(([, ids]) => [...ids].some(id => eligibleIds.has(id)));
    // Sample new words first, then fill from the old batch if the eligible
    // pool is small. A word's virtual faces always travel together.
    const fresh = pool.filter(([group]) => !previousGroups.has(group));
    const previous = pool.filter(([group]) => previousGroups.has(group));
    const selected = [];
    for (const candidates of [fresh, previous]) {
      const size = Math.min(BATCH_SIZE - selected.length, candidates.length);
      for (let i = 0; i < size; i++) {
        const j = i + Math.floor(random() * (candidates.length - i));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      selected.push(...candidates.slice(0, size));
    }
    const ids = selected.flatMap(([, group]) => [...group]);
    batch = sessions[key] = { ids, pending: ids.filter(id => eligibleIds.has(id)), groupsVersion: 2, savedAt: now, dayKey: getUnspacedArchiveDayKey(now) };
  }
  batch.dayKey ||= getUnspacedArchiveDayKey(now);
  batch.savedAt = now;
  return batch;
}

export function rateBatch(batch, outcome) {
  const id = batch.pending.shift();
  if (id !== undefined && outcome !== 'easy') batch.pending.push(id);
}
