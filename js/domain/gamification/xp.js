// XP, streak, and level computation — pure functions
import { XP_LEVELS, REVIEW_XP_SCHEDULE } from './levels.js';
import { getUsageDayKey } from '../../utils/time.js';

export function migrateLegacyXp(usage, globalWordProgress) {
  let legacyCardXp = 0;
  ['g2e', 'e2g', 'morph'].forEach(bucket => {
    const store = globalWordProgress[bucket];
    if (!store || typeof store !== 'object') return;
    const keys = Object.keys(store);
    for (let k = 0; k < keys.length; k++) {
      const entry = store[keys[k]];
      if (!entry || typeof entry !== 'object') continue;
      const seen = Math.max(0, entry.seenCount || 0);
      for (let i = 0; i < seen; i++) {
        legacyCardXp += i < REVIEW_XP_SCHEDULE.length ? REVIEW_XP_SCHEDULE[i] : 1;
      }
    }
  });
  usage.cardXpEarned = legacyCardXp;
}

export function computeTotalXp(usage, globalWordProgress) {
  if (usage.cardXpEarned < 0) migrateLegacyXp(usage, globalWordProgress);
  const cardXp = Math.max(0, usage.cardXpEarned || 0);
  const timeXp = Math.floor((usage.activeStudyMs || 0) / (60 * 1000)) * 2;
  return cardXp + timeXp;
}

export function computeStudyStreaks(activeDailyMs) {
  const map = activeDailyMs || {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let current = 0;
  let cursor = new Date(today);
  if (!map[getUsageDayKey(cursor.getTime())]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (map[getUsageDayKey(cursor.getTime())] > 0) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const keys = Object.keys(map).filter(k => map[k] > 0).sort();
  let longest = 0; let run = 0; let prev = null;
  for (const key of keys) {
    const d = new Date(key + 'T00:00:00');
    if (prev) {
      const diff = Math.round((d - prev) / (24 * 60 * 60 * 1000));
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }
  return { current, longest };
}

export function computeXpAndLevel(usage, globalWordProgress) {
  const totalXp = computeTotalXp(usage, globalWordProgress);
  let currentLevel = XP_LEVELS[0];
  let nextLevel = XP_LEVELS[1] || null;
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= XP_LEVELS[i].threshold) {
      currentLevel = XP_LEVELS[i];
      nextLevel = XP_LEVELS[i + 1] || null;
      break;
    }
  }
  const levelProgress = nextLevel
    ? (totalXp - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)
    : 1;
  return { totalXp, currentLevel, nextLevel, levelProgress: Math.min(1, Math.max(0, levelProgress)) };
}

export function computeTodayStats(activeDailyMs, cards, marksStore, progressStore) {
  const todayKey = getUsageDayKey();
  const todayMs = (activeDailyMs || {})[todayKey] || 0;
  let reviewedToday = 0;
  let newToday = 0;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime();

  const seenIds = new Set();
  const sourceEntries = progressStore && typeof progressStore === 'object'
    ? Object.entries(progressStore)
    : [];

  if (sourceEntries.length) {
    sourceEntries.forEach(([cardId, p]) => {
      if (!p) return;
      if (p.lastReviewedAt && p.lastReviewedAt >= todayTs) {
        reviewedToday++;
        seenIds.add(cardId);
      }
      if (p.firstConfirmedAt && p.firstConfirmedAt >= todayTs) {
        newToday++;
        seenIds.add(cardId);
      }
    });
  } else {
    (cards || []).forEach(card => {
      const p = progressStore?.[card.id];
      if (!p) return;
      if (p.lastReviewedAt && p.lastReviewedAt >= todayTs) reviewedToday++;
      if (p.firstConfirmedAt && p.firstConfirmedAt >= todayTs) newToday++;
    });
  }

  const firstCardTodayEarned = reviewedToday > 0 || newToday > 0 || todayMs > 0 || seenIds.size > 0;
  return { todayMs, reviewedToday, newToday, firstCardTodayEarned };
}

export function computeAchievements(usage, courseData, streaks, sessionCount, todayStats = null) {
  const earned = [];
  const check = (id, icon, name, desc, condition, group) => {
    earned.push({ id, icon, name, desc, earned: !!condition, group: group || 'milestone' });
  };

  const totalConfirmed = courseData.allVocabConfirmed + courseData.allGrammarConfirmed;
  const reviewedToday = Number(todayStats?.reviewedToday) || 0;
  const newToday = Number(todayStats?.newToday) || 0;
  const firstCardTodayEarned = !!todayStats?.firstCardTodayEarned;

  check('daily_first_card', '\u2605', 'First Card Today', 'Review your first card today', firstCardTodayEarned || reviewedToday > 0 || newToday > 0, 'daily');
  check('first_card',    '\u2726', 'First Light',     'Confirm your first card',            totalConfirmed >= 1);
  check('ten_cards',     '\u2605', 'Kindled',         'Confirm 10 cards',                   totalConfirmed >= 10);
  check('fifty_cards',   '\u2662', 'Diligent',        'Confirm 50 cards',                   totalConfirmed >= 50);
  check('hundred_cards', '\u2736', 'Centurion',       'Confirm 100 cards',                  totalConfirmed >= 100);
  check('twofifty',      '\u2741', 'Quarter-master',  'Confirm 250 cards',                  totalConfirmed >= 250);
  check('five_hundred',  '\u2743', 'Half a Thousand', 'Confirm 500 cards',                  totalConfirmed >= 500);
  check('streak_3',      '\u2668', 'Three-fold Cord', '3-day study streak',                 streaks.current >= 3 || streaks.longest >= 3);
  check('streak_7',      '\u2604', 'Weekly Flame',    '7-day study streak',                 streaks.current >= 7 || streaks.longest >= 7);
  check('streak_14',     '\u269D', 'Fortnight',       '14-day study streak',                streaks.current >= 14 || streaks.longest >= 14);
  check('streak_30',     '\u2600', 'Monthly Devotion','30-day study streak',                streaks.current >= 30 || streaks.longest >= 30);
  check('hour_one',      '\u231B', 'First Hour',      'Reach 1 hour of active study',       (usage.activeStudyMs || 0) >= 60 * 60 * 1000);
  check('hour_five',     '\u23F3', 'Five Hours',      'Reach 5 hours of active study',      (usage.activeStudyMs || 0) >= 5 * 60 * 60 * 1000);
  check('hour_ten',      '\u2316', 'Ten Hours',       'Reach 10 hours of active study',     (usage.activeStudyMs || 0) >= 10 * 60 * 60 * 1000);
  check('sessions_10',   '\u2692', 'Seasoned',        'Log 10 study sessions',              sessionCount >= 10);
  check('sessions_50',   '\u2694', 'Veteran',         'Log 50 study sessions',              sessionCount >= 50);
  check('req_vocab',     '\u2655', 'Required Lexicon','Confirm all required vocabulary',     courseData.reqVocabConfirmed >= courseData.reqVocabTotal && courseData.reqVocabTotal > 0);
  check('all_vocab',     '\u265B', 'Full Lexicon',    'Confirm every vocabulary card',       courseData.allVocabConfirmed >= courseData.allVocabTotal && courseData.allVocabTotal > 0);
  check('all_grammar',   '\u2654', 'Grammar Master',  'Confirm all grammar cards',           courseData.allGrammarConfirmed >= courseData.allGrammarTotal && courseData.allGrammarTotal > 0);

  // Per-chapter awards
  (courseData.chapterAwards || []).forEach(ch => {
    check(
      `ch_${ch.num}`,
      '\u2720',
      `Ch. ${ch.num}`,
      `Confirm all Ch. ${ch.num} vocabulary (${ch.total} cards)`,
      ch.confirmed >= ch.total,
      'chapter'
    );
  });

  return earned;
}
