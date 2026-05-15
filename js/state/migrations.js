// State migrations — applied in order during restoreState
import { isPlainObject } from '../utils/helpers.js';
import { SRS_DAY_MS, SRS_MAX_INTERVAL_DAYS } from '../domain/srs/constants.js';
import { MAX_DECK_STATE_ENTRIES } from './store.js';

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

// ── Save compaction ──────────────────────────────────────────────────────
// localStorage on iOS is small (~5MB) and a bloated save throws
// QuotaExceededError mid-render — saveState() runs at the top of renderCard(),
// so a throw there aborts the re-render and freezes the current card.
// compactPersistedState keeps every persisted payload (localStorage saves and
// JSON exports alike) as small as possible without losing real progress:
//
//  - globalWordProgress accumulates a fresh all-zero entry for every card the
//    app merely *looks at* — getWordProgress lazily seeds defaults during
//    rendering and deck building. Those entries carry no information (an
//    identical default is regenerated on demand), so they are dropped.
//  - Only the three reachable direction buckets (g2e / e2g / morph) are ever
//    read; a stray empty bucket from an older build (e.g. "morph_e2g") is
//    dropped.
//  - The deck-state bank grows one entry per distinct selection combo and is
//    only a resume convenience, so it is capped to the most recently saved
//    selections; reader-mode entries (reader never resumes a card deck) go.

const KNOWN_DIRECTION_BUCKETS = ['g2e', 'e2g', 'morph'];
const PROGRESS_DEFAULT_EASE = 2.3;
const PROGRESS_MEANINGFUL_NUMERIC_FIELDS = [
  'seenCount', 'passCount', 'failCount', 'streak', 'easyStreak', 'srsStage',
  'intervalDays', 'lastEasyIntervalDays', 'dueAt', 'lastReviewedAt',
  'firstSeenAt', 'firstConfirmedAt', 'confidence'
];

// True when a progress entry is indistinguishable from a freshly-seeded
// default — it records no actual study history and getWordProgress will
// regenerate an identical entry on demand, so it can be safely dropped.
function isEmptyProgressEntry(entry) {
  if (!isPlainObject(entry)) return true;
  if (PROGRESS_MEANINGFUL_NUMERIC_FIELDS.some(field => Number(entry[field]) > 0)) return false;
  if (Array.isArray(entry.confidenceHistory) && entry.confidenceHistory.length) return false;
  if (entry.lastSpacedOutcome) return false;
  if (Number.isFinite(entry.ease) && entry.ease !== PROGRESS_DEFAULT_EASE) return false;
  return true;
}

function compactDirectionalStore(store, keepValue) {
  if (!isPlainObject(store)) return store;
  // A store with none of the real direction keys is the pre-split legacy flat
  // shape ({ cardId: value, ... }); leave it untouched so ensureDirectionalStores
  // can migrate it to the nested shape first.
  const hasDirectionBuckets = KNOWN_DIRECTION_BUCKETS.some(dir => dir in store);
  if (!hasDirectionBuckets) return store;

  const next = {};
  Object.keys(store).forEach(bucketKey => {
    const bucket = store[bucketKey];
    const isKnown = KNOWN_DIRECTION_BUCKETS.includes(bucketKey);
    if (!isPlainObject(bucket)) {
      if (isKnown) next[bucketKey] = {};
      return;
    }
    // Non-standard buckets are unreachable by the app; drop them once empty,
    // but never silently discard a bucket that still holds entries.
    if (!isKnown && !Object.keys(bucket).length) return;
    const trimmed = {};
    Object.keys(bucket).forEach(id => {
      if (keepValue(bucket[id])) trimmed[id] = bucket[id];
    });
    next[bucketKey] = trimmed;
  });
  return next;
}

function compactDeckStates(deckStates) {
  if (!isPlainObject(deckStates)) return {};
  const entries = Object.keys(deckStates)
    .map(key => ({ key, value: deckStates[key] }))
    .filter(entry => isPlainObject(entry.value) && Array.isArray(entry.value.deckIds))
    .filter(entry => !/"mode"\s*:\s*"reader"/.test(entry.key));
  // Newest selections first; legacy entries with no savedAt stamp sort last.
  entries.sort((a, b) => (Number(b.value.savedAt) || 0) - (Number(a.value.savedAt) || 0));
  const kept = {};
  entries.slice(0, MAX_DECK_STATE_ENTRIES).forEach(entry => { kept[entry.key] = entry.value; });
  return kept;
}

export function compactPersistedState(state) {
  if (!isPlainObject(state)) return state;
  const next = { ...state };
  if ('globalWordProgress' in next) {
    next.globalWordProgress = compactDirectionalStore(next.globalWordProgress, entry => !isEmptyProgressEntry(entry));
  }
  if ('globalWordMarks' in next) {
    next.globalWordMarks = compactDirectionalStore(next.globalWordMarks, mark => mark === 'known' || mark === 'unsure');
  }
  if ('deckStates' in next) {
    next.deckStates = compactDeckStates(next.deckStates);
  }
  return next;
}

// In-place variant for the live runtime stores. compactPersistedState only
// trims the save payload, but getWordProgress re-seeds a default entry into
// the runtime store for every card the app renders, so without this the
// in-memory state regrows across a session even though each save stays small.
// Mutates the bucket objects rather than reassigning them so existing
// references (e.g. runtime.marks, which aliases a marks bucket) stay valid.
// These runtime stores are always in the nested g2e/e2g/morph shape by the
// time this runs (ensureDirectionalStores has migrated any legacy flat data).
function trimRuntimeDirectionalStore(store, keepValue) {
  if (!isPlainObject(store)) return;
  Object.keys(store).forEach(bucketKey => {
    const bucket = store[bucketKey];
    if (!isPlainObject(bucket)) return;
    if (!KNOWN_DIRECTION_BUCKETS.includes(bucketKey)) {
      // Stray unreachable bucket (e.g. legacy "morph_e2g") — drop once empty.
      if (!Object.keys(bucket).length) delete store[bucketKey];
      return;
    }
    Object.keys(bucket).forEach(id => {
      if (!keepValue(bucket[id])) delete bucket[id];
    });
  });
}

export function compactRuntimeStores({ globalWordProgress, globalWordMarks, deckStates } = {}) {
  trimRuntimeDirectionalStore(globalWordProgress, entry => !isEmptyProgressEntry(entry));
  trimRuntimeDirectionalStore(globalWordMarks, mark => mark === 'known' || mark === 'unsure');
  if (isPlainObject(deckStates)) {
    const survivors = compactDeckStates(deckStates);
    Object.keys(deckStates).forEach(key => {
      if (!(key in survivors)) delete deckStates[key];
    });
  }
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
