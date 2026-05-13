// State migrations — applied in order during restoreState
import { isPlainObject } from '../utils/helpers.js';
import { SRS_DAY_MS, SRS_MAX_INTERVAL_DAYS } from '../domain/srs/constants.js';

// Legacy SRS cap, used to rescale intervals from older saves/exports.
const LEGACY_SRS_MAX_INTERVAL_DAYS = 30;

function stableKey(greek) {
  return typeof window.stableCardKey === 'function' ? window.stableCardKey(greek) : String(greek || '');
}

function getLegacyStableIdMap() {
  return typeof window.buildLegacyStableIdMap === 'function' ? window.buildLegacyStableIdMap() : new Map();
}

export function getCurrentGrammarAndMorphCardIdSet() {
  const ids = new Set();
  try {
    if (window.buildGrammarCardsForKeys && window.GRAMMAR_SETS && typeof window.GRAMMAR_SETS === 'object') {
      const grammarKeys = Object.keys(window.GRAMMAR_SETS);
      window.buildGrammarCardsForKeys(grammarKeys).forEach(card => {
        if (card?.id) ids.add(card.id);
      });
    }
  } catch (err) {
    console.warn('Could not enumerate current grammar card ids for migration safety.', err);
  }
  try {
    if (window.buildMorphologyCardsForKeys && window.MORPHOLOGY_SETS && typeof window.MORPHOLOGY_SETS === 'object') {
      const morphKeys = Object.keys(window.MORPHOLOGY_SETS);
      window.buildMorphologyCardsForKeys(morphKeys).forEach(card => {
        if (card?.id) ids.add(card.id);
      });
    }
  } catch (err) {
    console.warn('Could not enumerate current morphology card ids for migration safety.', err);
  }
  return ids;
}

export function isLegacyOrphanedMorphId(id, validIds = null) {
  if (!(String(id || '').startsWith('grammar-') || String(id || '').startsWith('morph-'))) return false;
  const liveIds = validIds || getCurrentGrammarAndMorphCardIdSet();
  if (!liveIds.size) return false;
  return !liveIds.has(String(id));
}

export function summarizePersistedState(state) {
  const safeState = isPlainObject(state) ? state : {};
  const marks = isPlainObject(safeState.globalWordMarks) ? safeState.globalWordMarks : {};
  const progress = isPlainObject(safeState.globalWordProgress) ? safeState.globalWordProgress : {};
  const countObjectKeys = bucket => (isPlainObject(bucket) ? Object.keys(bucket).length : 0);

  return {
    selectedSets: Array.isArray(safeState.selectedKeys) ? safeState.selectedKeys.length : 0,
    deckStates: countObjectKeys(safeState.deckStates),
    marks: {
      g2e: countObjectKeys(marks.g2e),
      e2g: countObjectKeys(marks.e2g),
      morph: countObjectKeys(marks.morph)
    },
    progress: {
      g2e: countObjectKeys(progress.g2e),
      e2g: countObjectKeys(progress.e2g),
      morph: countObjectKeys(progress.morph)
    }
  };
}

export function formatPersistedStateSummary(summary) {
  const safe = isPlainObject(summary) ? summary : {};
  const marks = isPlainObject(safe.marks) ? safe.marks : {};
  const progress = isPlainObject(safe.progress) ? safe.progress : {};
  return `Sets ${safe.selectedSets || 0} \u00B7 Marks G\u2192E ${marks.g2e || 0}, E\u2192G ${marks.e2g || 0}, Grammar ${marks.morph || 0} \u00B7 Progress G\u2192E ${progress.g2e || 0}, E\u2192G ${progress.e2g || 0}, Grammar ${progress.morph || 0}`;
}

export const STATE_MIGRATIONS = [
  {
    name: 'card-ids-legacy-raw-to-indexed-stable',
    match(saved) {
      const buckets = [
        saved.globalWordMarks?.g2e, saved.globalWordMarks?.e2g,
        saved.globalWordProgress?.g2e, saved.globalWordProgress?.e2g,
      ];
      const oldFormat = /^([^-]+)-(\d+)-(.+)$/u;
      return buckets.some(bucket => bucket && Object.keys(bucket).some(id => {
        const m = id.match(oldFormat);
        return !!(m && m[3] !== stableKey(m[3]));
      }));
    },
    migrate(saved) {
      const oldFormat = /^([^-]+)-(\d+)-(.+)$/u;
      const rewriteBucket = (bucket) => {
        if (!bucket) return bucket;
        const next = {};
        Object.keys(bucket).forEach(id => {
          const m = id.match(oldFormat);
          if (m && m[3] !== stableKey(m[3])) {
            const newId = `${m[1]}-${m[2]}-${stableKey(m[3])}`;
            next[newId] = bucket[id];
          } else {
            next[id] = bucket[id];
          }
        });
        return next;
      };
      ['g2e', 'e2g'].forEach(dir => {
        if (saved.globalWordMarks?.[dir]) saved.globalWordMarks[dir] = rewriteBucket(saved.globalWordMarks[dir]);
        if (saved.globalWordProgress?.[dir]) saved.globalWordProgress[dir] = rewriteBucket(saved.globalWordProgress[dir]);
      });
      saved.deckStates = {};
      return saved;
    }
  },

  {
    name: 'card-ids-stable-to-indexed-stable',
    match(saved) {
      const buckets = [
        saved.globalWordMarks?.g2e, saved.globalWordMarks?.e2g,
        saved.globalWordProgress?.g2e, saved.globalWordProgress?.e2g,
      ];
      const legacyIdMap = getLegacyStableIdMap();
      return buckets.some(bucket => bucket && Object.keys(bucket).some(id => legacyIdMap.has(id)));
    },
    migrate(saved) {
      const legacyIdMap = getLegacyStableIdMap();
      const rewriteBucket = (bucket) => {
        if (!bucket) return bucket;
        const next = {};
        Object.keys(bucket).forEach(id => {
          const targets = legacyIdMap.get(id);
          if (targets && targets.length) {
            targets.forEach(targetId => { next[targetId] = bucket[id]; });
          } else {
            next[id] = bucket[id];
          }
        });
        return next;
      };
      ['g2e', 'e2g'].forEach(dir => {
        if (saved.globalWordMarks?.[dir]) saved.globalWordMarks[dir] = rewriteBucket(saved.globalWordMarks[dir]);
        if (saved.globalWordProgress?.[dir]) saved.globalWordProgress[dir] = rewriteBucket(saved.globalWordProgress[dir]);
      });
      saved.deckStates = {};
      return saved;
    }
  },

  {
    name: 'grammar-consolidation-clear-orphans',
    match(saved) {
      const liveIds = getCurrentGrammarAndMorphCardIdSet();
      const buckets = [
        saved.globalWordMarks?.morph,
        saved.globalWordProgress?.morph,
      ];
      return buckets.some(bucket => bucket && Object.keys(bucket).some(id =>
        isLegacyOrphanedMorphId(id, liveIds)
      ));
    },
    migrate(saved) {
      const liveIds = getCurrentGrammarAndMorphCardIdSet();
      const dropOrphans = (bucket) => {
        if (!bucket) return bucket;
        const next = {};
        Object.keys(bucket).forEach(id => {
          if (!isLegacyOrphanedMorphId(id, liveIds)) next[id] = bucket[id];
        });
        return next;
      };
      if (saved.globalWordMarks?.morph) saved.globalWordMarks.morph = dropOrphans(saved.globalWordMarks.morph);
      if (saved.globalWordProgress?.morph) saved.globalWordProgress.morph = dropOrphans(saved.globalWordProgress.morph);
      saved.deckStates = {};
      return saved;
    }
  },

  {
    name: 'required-only-default-on',
    match(saved) {
      return !saved.requiredOnlyDefaultedV1;
    },
    migrate(saved) {
      saved.requiredOnly = true;
      saved.requiredOnlyDefaultedV1 = true;
      return saved;
    }
  },

  {
    // Pre-V18 saves (and JSON exports made before May 2026) sized intervals
    // against a 30-day cap. The active cap is now 14 days, so any unaligned
    // save needs its per-card intervals — and the remaining wait until
    // `dueAt` — scaled by 14/30 and clamped to the new cap. The marker
    // `srsIntervalCapAlignedV1` is stamped on new saves so this only runs
    // on legacy data.
    name: 'srs-interval-cap-30-to-14-alignment',
    match(saved) {
      return !saved.srsIntervalCapAlignedV1;
    },
    migrate(saved) {
      const factor = SRS_MAX_INTERVAL_DAYS / LEGACY_SRS_MAX_INTERVAL_DAYS;
      const capDays = SRS_MAX_INTERVAL_DAYS;
      const capMs = capDays * SRS_DAY_MS;

      const scaleDays = value => {
        const days = Number(value);
        if (!Number.isFinite(days) || days <= 0) return value;
        return Math.min(capDays, days * factor);
      };

      const scaleEntry = entry => {
        if (!isPlainObject(entry)) return entry;
        const next = { ...entry };
        if ('intervalDays' in next) next.intervalDays = scaleDays(next.intervalDays);
        if ('lastEasyIntervalDays' in next) next.lastEasyIntervalDays = scaleDays(next.lastEasyIntervalDays);

        const lastReviewedAt = Number(next.lastReviewedAt) || 0;
        const dueAt = Number(next.dueAt) || 0;
        if (dueAt > 0) {
          if (lastReviewedAt > 0 && dueAt > lastReviewedAt) {
            const gap = dueAt - lastReviewedAt;
            const scaledGap = Math.min(capMs, gap * factor);
            next.dueAt = lastReviewedAt + scaledGap;
          } else {
            // No anchor to scale against — clamp the absolute remaining wait
            // so cards can't sit beyond the new cap.
            const now = Date.now();
            if (dueAt > now + capMs) next.dueAt = now + capMs;
          }
        }
        return next;
      };

      const scaleBucket = bucket => {
        if (!isPlainObject(bucket)) return bucket;
        const next = {};
        Object.keys(bucket).forEach(id => { next[id] = scaleEntry(bucket[id]); });
        return next;
      };

      if (isPlainObject(saved.globalWordProgress)) {
        ['g2e', 'e2g', 'morph', 'morph_e2g'].forEach(dir => {
          if (isPlainObject(saved.globalWordProgress[dir])) {
            saved.globalWordProgress[dir] = scaleBucket(saved.globalWordProgress[dir]);
          }
        });
      }

      saved.srsIntervalCapAlignedV1 = true;
      return saved;
    }
  }
];
