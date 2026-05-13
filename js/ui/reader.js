// Reader tab — translation drills + verses keyed to Mounce chapters.
// Self-contained: per-chapter drill index lives in a module-local Map; the
// only host hooks are `noteStudyInteraction` (idle/streak tracking) and
// `setStudyMode` (to switch into reader mode).

import { shuffleArray, escapeHtml } from '../utils/helpers.js';

const readerDrillState = new Map();
let noteStudyInteractionFn = () => {};
let setStudyModeFn = () => {};

export function configureReader({ noteStudyInteraction, setStudyMode } = {}) {
  if (typeof noteStudyInteraction === 'function') noteStudyInteractionFn = noteStudyInteraction;
  if (typeof setStudyMode === 'function') setStudyModeFn = setStudyMode;
}

function getReaderDrillIdx(chapterNum) {
  return readerDrillState.get(chapterNum) || 0;
}

function setReaderDrillIdx(chapterNum, idx) {
  readerDrillState.set(chapterNum, idx);
}

function sortReaderDrillsByLevel(drills) {
  if (!Array.isArray(drills)) return [];
  return drills.map((d, i) => ({ d, i })).sort((a, b) => {
    const la = Number.isFinite(a.d && a.d.level) ? a.d.level : 99;
    const lb = Number.isFinite(b.d && b.d.level) ? b.d.level : 99;
    if (la !== lb) return la - lb;
    return a.i - b.i;
  }).map(x => x.d);
}

export function renderReaderModule() {
  const area = document.getElementById('cardArea');
  if (!area) return;
  const chapters = Array.isArray(window.READER_CHAPTERS) ? window.READER_CHAPTERS : [];
  const drillSets = (window.READER_TRANSLATION_SETS && typeof window.READER_TRANSLATION_SETS === 'object')
    ? window.READER_TRANSLATION_SETS
    : {};

  const drillChapters = Object.keys(drillSets)
    .map(k => Number(k))
    .filter(n => Number.isFinite(n));
  const verseChapters = chapters.map(ch => ch.chapter);
  const allChapterNums = Array.from(new Set([...drillChapters, ...verseChapters])).sort((a, b) => a - b);

  if (!allChapterNums.length) {
    area.innerHTML = '<div class="empty-state"><div class="big">βίβλος</div>Reader data not available.</div>';
    return;
  }

  const verseByChapter = new Map(chapters.map(ch => [ch.chapter, ch.verses || []]));

  let html = '<div class="reader-wrap"><div class="reader-intro">Short author-written Greek phrases per Mounce chapter, increasing in difficulty. Drills use only vocabulary and grammar introduced through that chapter. The Mounce variant ships without NT-verse curation — the focus here is bridging from flashcards to syntax, one chapter at a time.</div>';

  for (const chapterNum of allChapterNums) {
    const drillsRaw = drillSets[chapterNum] && Array.isArray(drillSets[chapterNum].sentences)
      ? drillSets[chapterNum].sentences
      : [];
    const verses = verseByChapter.get(chapterNum) || [];

    if (!drillsRaw.length && !verses.length) continue;

    const drills = sortReaderDrillsByLevel(drillsRaw);
    const summaryBits = [];
    if (drills.length) summaryBits.push(`${drills.length} drill${drills.length === 1 ? '' : 's'}`);
    if (verses.length) summaryBits.push(`${verses.length} verse${verses.length === 1 ? '' : 's'}`);

    html += `<details class="reader-chapter"><summary class="reader-chapter-header"><span class="reader-ch-label">After Chapter ${chapterNum}</span><span class="reader-ch-count">${summaryBits.join(' · ')}</span><span class="reader-ch-arrow" aria-hidden="true">▶</span></summary>`;

    if (drills.length) {
      html += renderReaderDrillSectionHtml(chapterNum, drills);
    }

    if (verses.length) {
      const versesWithTranslations = verses.filter(v => v && v.literal).length;
      const verseLabel = versesWithTranslations
        ? `Verses (${verses.length}, ${versesWithTranslations} with translation)`
        : `Verses (${verses.length})`;
      html += `<details class="reader-verses-block" open><summary class="reader-verses-header">${verseLabel}</summary><div class="reader-verse-list">`;
      verses.forEach((verse, vIdx) => {
        html += renderReaderVerseHtml(chapterNum, vIdx, verse);
      });
      html += '</div></details>';
    }

    html += '</details>';
  }
  html += '</div>';
  area.innerHTML = html;
}

function readerDrillId(chapterNum, idx) {
  return `reader-drill-ch${chapterNum}-${idx}`;
}

function readerDrillSectionId(chapterNum) {
  return `reader-drill-section-ch${chapterNum}`;
}

function readerVerseRevealId(chapterNum, vIdx) {
  return `reader-verse-reveal-ch${chapterNum}-${vIdx}`;
}

function renderReaderDrillSectionHtml(chapterNum, drillsSorted) {
  const sectionId = readerDrillSectionId(chapterNum);
  const total = drillsSorted.length;
  if (!total) {
    return `<div class="reader-drill-section" id="${sectionId}"><div class="reader-section-label">Translation drills</div></div>`;
  }
  const idx = Math.max(0, Math.min(getReaderDrillIdx(chapterNum), total - 1));
  setReaderDrillIdx(chapterNum, idx);
  const drill = drillsSorted[idx];
  const drillHtml = renderReaderDrillHtml(chapterNum, idx, drill);
  const prevDisabled = idx === 0 ? 'disabled' : '';
  const nextDisabled = idx === total - 1 ? 'disabled' : '';
  return `<div class="reader-drill-section" id="${sectionId}">
    <div class="reader-drill-section-head">
      <div class="reader-section-label">Translation drills</div>
      <div class="reader-drill-progress">Drill ${idx + 1} of ${total}</div>
    </div>
    ${drillHtml}
    <div class="reader-drill-nav">
      <button class="reader-drill-nav-btn" type="button" ${prevDisabled} onclick="advanceReaderDrill(${chapterNum}, -1)">← Previous</button>
      <button class="reader-drill-nav-btn" type="button" ${nextDisabled} onclick="advanceReaderDrill(${chapterNum}, 1)">Next →</button>
    </div>
  </div>`;
}

export function advanceReaderDrill(chapterNum, delta) {
  const drillSets = (window.READER_TRANSLATION_SETS && typeof window.READER_TRANSLATION_SETS === 'object')
    ? window.READER_TRANSLATION_SETS : {};
  const drillsRaw = drillSets[chapterNum] && Array.isArray(drillSets[chapterNum].sentences)
    ? drillSets[chapterNum].sentences : [];
  const drills = sortReaderDrillsByLevel(drillsRaw);
  if (!drills.length) return;

  const cur = getReaderDrillIdx(chapterNum);
  const next = Math.max(0, Math.min(drills.length - 1, cur + delta));
  if (next === cur) return;

  setReaderDrillIdx(chapterNum, next);
  const sectionEl = document.getElementById(readerDrillSectionId(chapterNum));
  if (!sectionEl) return;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderReaderDrillSectionHtml(chapterNum, drills);
  const replacement = wrapper.firstElementChild;
  if (replacement) sectionEl.replaceWith(replacement);
}

function renderReaderDrillHtml(chapterNum, idx, drill) {
  const id = readerDrillId(chapterNum, idx);
  const choices = Array.isArray(drill.choices) ? shuffleArray([...drill.choices]) : [];
  const level = Number.isFinite(drill.level) ? drill.level : null;
  const levelLabel = level === 1 ? 'Easy'
    : level === 2 ? 'Mixed order'
    : level === 3 ? 'Greek-style order'
    : '';
  const levelClass = level === 1 ? 'level-1'
    : level === 2 ? 'level-2'
    : level === 3 ? 'level-3'
    : '';
  const choiceButtons = choices.map((choice, cIdx) => {
    const safeChoice = escapeHtml(choice);
    return `<button class="reader-choice-btn" type="button" data-drill="${id}" data-idx="${cIdx}" onclick="selectReaderDrillChoice('${id}', ${cIdx})">${safeChoice}</button>`;
  }).join('');
  const noteHtml = drill.note ? `<div class="reader-drill-note" id="${id}-note" style="display:none">${escapeHtml(drill.note)}</div>` : '';
  return `
    <div class="reader-drill" id="${id}" data-answer="${escapeHtml(drill.en || '')}">
      <div class="reader-drill-head">
        ${levelLabel ? `<span class="reader-difficulty ${levelClass}">${levelLabel}</span>` : ''}
        <span class="reader-drill-prompt">Translate</span>
      </div>
      <div class="reader-drill-greek">${escapeHtml(drill.g)}</div>
      <div class="reader-choices">${choiceButtons}</div>
      <div class="reader-drill-result" id="${id}-result"></div>
      ${noteHtml}
    </div>`;
}

function renderReaderVerseHtml(chapterNum, vIdx, verse) {
  if (!verse) return '';
  const greek = escapeHtml(verse.g || '');
  const ref = escapeHtml(verse.r || '');
  const literal = verse.literal;
  const literalText = typeof literal === 'string'
    ? literal
    : (literal && typeof literal === 'object' ? (literal.en || '') : '');
  const noteText = (literal && typeof literal === 'object') ? (literal.note || '') : '';

  if (!literalText) {
    return `<div class="reader-verse"><span class="reader-verse-greek">${greek}</span><span class="reader-verse-ref">${ref}</span></div>`;
  }

  const id = readerVerseRevealId(chapterNum, vIdx);
  const noteHtml = noteText ? `<div class="reader-drill-note">${escapeHtml(noteText)}</div>` : '';
  return `
    <div class="reader-verse reader-verse-with-drill">
      <div class="reader-verse-row">
        <span class="reader-verse-greek">${greek}</span>
        <span class="reader-verse-ref">${ref}</span>
      </div>
      <details class="reader-verse-reveal" id="${id}">
        <summary class="reader-verse-reveal-summary">Tap to reveal translation</summary>
        <div class="reader-verse-literal-text">${escapeHtml(literalText)}</div>
        ${noteHtml}
      </details>
    </div>`;
}

export function selectReaderDrillChoice(drillId, choiceIdx) {
  const root = document.getElementById(drillId);
  if (!root) return;
  noteStudyInteractionFn();
  const buttons = Array.from(root.querySelectorAll('.reader-choice-btn'));
  if (!buttons.length) return;
  const expected = root.getAttribute('data-answer') || '';
  const chosen = buttons[choiceIdx];
  if (!chosen || chosen.disabled) return;
  const chosenText = chosen.textContent || '';
  const isCorrect = chosenText === expected;

  buttons.forEach((btn) => {
    btn.disabled = true;
    btn.classList.remove('correct', 'incorrect');
    if ((btn.textContent || '') === expected) btn.classList.add('correct');
  });
  if (!isCorrect) chosen.classList.add('incorrect');

  const resultEl = document.getElementById(`${drillId}-result`);
  if (resultEl) {
    resultEl.textContent = isCorrect
      ? 'Correct.'
      : `Not quite. Answer: ${expected}`;
    resultEl.className = `reader-drill-result ${isCorrect ? 'correct' : 'incorrect'}`;
  }

  const noteEl = document.getElementById(`${drillId}-note`);
  if (noteEl) noteEl.style.display = '';
}

export function openReaderTab() {
  setStudyModeFn('reader');
}
