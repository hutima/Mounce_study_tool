from pathlib import Path

path = Path('js/app/main.js')
text = path.read_text()
start_marker = 'function applyHardLapse(progress, cadence, now) {'
end_marker = 'function applyUncertainLapse(progress, now) {'
start = text.index(start_marker)
end = text.index(end_marker, start)
replacement = '''function applyHardLapse(progress, cadence, now) {
  const wasInRelearn = progress.inRelearn === true;
  const wasLeech = progress.leechDrill === true;
  const establishedDays = preLapseIntervalDays(progress);
  // A lapse is a NEW failure episode of previously established spacing.
  // Fresh-card retries and repeated Hard marks during the same relearn
  // episode stay in the middle deck without repeatedly penalising ease,
  // stage, or the lifetime lapse counter.
  const startsLapseEpisode = !wasInRelearn && !wasLeech && establishedDays > 0;

  progress.streak = 0;
  progress.easyStreak = 0;
  if (startsLapseEpisode) {
    progress.srsStage = Math.max(0, getSrsStage(progress) - 1);
    progress.ease = clamp(getSrsEase(progress) - 0.2, 1.3, 3.0);
    progress.lapseCount = (progress.lapseCount || 0) + 1;
    progress.preLapseIntervalDays = establishedDays;
  }

  // Leech is a property of repeated genuine lapses of an established card.
  // Even a leech still relearns IN SESSION: a failed daily drill goes through
  // middle/due-now until cleared; the 1-day cadence begins after a clean answer.
  const shouldLeech = cadence.leechEnabled && (
    wasLeech || (startsLapseEpisode && progress.lapseCount >= LEECH_LAPSE_THRESHOLD)
  );
  if (shouldLeech) {
    progress.leechDrill = true;
    progress.leechStreak = 0;
    progress.inRelearn = false;
    progress.relearnLeft = 0;
    setProgressDelay(progress, 0, now);
    return true;
  }

  if (!wasInRelearn) progress.preLapseIntervalDays = establishedDays;
  progress.inRelearn = true;
  progress.relearnLeft = SRS_HARD_RELEARN_STEPS;
  setProgressDelay(progress, 0, now); // due now — route through middle
  return true;
}
'''
path.write_text(text[:start] + replacement + text[end:])

targets = [Path('index.html'), Path('sw.js'), Path('styles.css'), *Path('pages').glob('*.html')]
for target in targets:
    if not target.exists():
        continue
    data = target.read_text().replace('?v=177', '?v=178')
    if target.name == 'sw.js':
        data = data.replace('mounce-bbg-greek-pwa-v177', 'mounce-bbg-greek-pwa-v178')
    target.write_text(data)
