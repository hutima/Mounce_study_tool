// Card rendering for both vocab and grammar modes, plus flipCard().
//
// Reads runtime state for deck position / direction / answer state. Calls
// back into main.js for the deck/lifecycle hooks (startNextCycle, saveState,
// isMorphologyMode, etc.) and into progress.js for the progress/review
// re-renders that follow a flip or mark.

import { runtime } from '../state/runtime.js';
import { buildGrammarSupportHtml } from '../domain/grammar/explanations.js';
import { renderProgress, renderReview } from './progress.js';

let host = {
  saveState: () => {},
  syncLayoutVisibility: () => {},
  noteStudyInteraction: () => {},
  getNearDueCount: () => 0,
  isMorphologyMode: () => false,
  isReverseGrammarActive: () => false,
  isMorphCard: () => false,
  reverseDisplayActive: () => false,
  startNextCycle: () => {},
  resetMorphAnswerState: () => {},
  maybeReturnKnownCardToActivePile: () => false,
  // window-global text formatters are wrapped so the module doesn't depend on
  // load order between this ES module and the legacy <script defer> data files.
  formatGreekHeadword: (g) => g || '—',
  transliterateGreek: (s) => s,
  detectPartOfSpeech: () => '',
  isMultiCasePreposition: () => false
};

export function configureRender(deps) {
  host = { ...host, ...deps };
}

export function renderCard() {
  const area = document.getElementById('cardArea');
  host.saveState();
  host.syncLayoutVisibility();

  if (!runtime.deck.length) {
    let emptyMessage;
    if (host.isMorphologyMode()) {
      emptyMessage = host.isReverseGrammarActive()
        ? 'No reversible grammar items in this selection. Toggle “English → Greek” off to see all questions.'
        : 'No grammar quiz material is available yet for this selection.';
    } else {
      emptyMessage = runtime.requiredOnly ? 'No required-vocabulary cards match this selection.' : 'No cards in this deck.';
    }
    area.innerHTML = `<div class="empty-state"><div class="big">—</div>${emptyMessage}</div>`;
    return;
  }

  if (!runtime.spacedRepetition && !host.isMorphologyMode() && runtime.currentIdx >= runtime.deck.length && runtime.unspacedPendingRecycle) {
    // Legacy auto-recycle pathway — only retained for morph; vocab unspaced
    // never sets unspacedPendingRecycle in the new flip-deck flow.
    runtime.unspacedPendingRecycle = false;
  }

  if (!runtime.spacedRepetition && host.isMorphologyMode() && runtime.currentIdx >= runtime.deck.length && runtime.unspacedPendingRecycle) {
    host.startNextCycle('remaining');
    host.resetMorphAnswerState();
    renderCard();
    renderReview();
    renderProgress();
    return;
  }

  if ((!runtime.spacedRepetition && runtime.currentIdx >= runtime.deck.length) || (runtime.spacedRepetition && runtime.currentIdx >= runtime.activeDeckCount)) {
    const unspacedVocab = !runtime.spacedRepetition && !host.isMorphologyMode();
    // Round complete = active is empty AND middle still has cards waiting to
    // reshuffle. If middle is empty too, everything is archived and the
    // "Session Confirmed" state takes over instead.
    const unspacedRoundComplete = unspacedVocab && runtime.unspacedMiddleCount > 0;

    const nearDueCount = runtime.spacedRepetition ? host.getNearDueCount() : 0;
    const spacedAdvanceTitle = nearDueCount > 0
      ? `No cards currently due ✦ <span style="color:var(--muted);font-weight:normal;font-size:0.82em;letter-spacing:1px">(${nearDueCount} near-due)</span>`
      : 'No cards currently due ✦';

    const doneTitle = runtime.spacedRepetition
      ? spacedAdvanceTitle
      : host.isMorphologyMode()
        ? 'Grammar pass complete ✦'
        : unspacedRoundComplete
          ? 'End of round ✦'
          : 'All cards confirmed ✨';

    const spacedAdvanceSub = nearDueCount > 0
      ? `Everything in this selection is scheduled ahead. Press <strong>Next →</strong> to advance the review clock by 1 hour and pull <strong>${nearDueCount}</strong> near-due card${nearDueCount === 1 ? '' : 's'} back in.`
      : 'Everything in this selection is scheduled ahead. Press <strong>Next →</strong> to advance the review clock by 1 hour and pull the next near-due cards back in.';

    const doneSub = runtime.spacedRepetition
      ? spacedAdvanceSub
      : host.isMorphologyMode()
        ? 'Everything in this grammar selection is currently marked correct. Press next to reshuffle the full selected set and run it again.'
        : unspacedRoundComplete
          ? 'Press <strong>Next →</strong> to reshuffle unconfirmed cards into another pass, or <strong>↻ Reset</strong> to start the whole deck over.'
          : 'Press <strong>↻ Reset</strong> to reshuffle the selected cards.<br><span style="color:var(--muted);font-size:13px">Archived cards stay archived until you reset or pick a new session.</span>';

    area.innerHTML = `
      <div class="done-card show">
        <div class="done-title">${doneTitle}</div>
        <div class="done-sub">${doneSub}</div>
      </div>`;
    document.getElementById('markRow').style.display = 'none';
    return;
  }

  document.getElementById('markRow').style.display = host.isMorphologyMode() ? 'none' : 'flex';
  const card = runtime.deck[runtime.currentIdx];

  if (host.isMorphCard(card)) {
    const reversed = host.reverseDisplayActive(card);
    const displayPrompt = reversed
      ? (card.reversePrompt || 'Choose the correct Greek form.')
      : (card.prompt || 'Parse this form.');
    const displayForm = reversed ? card.answer : card.form;
    const displayChoices = reversed ? (card.reverseChoices || []) : (card.choices || []);
    const correctAnswer = reversed ? card.form : card.answer;
    const formClass = reversed ? 'morph-form morph-form-english' : 'morph-form';

    const noteHtml = card.note ? `<div class="morph-note">${card.note}</div>` : '';
    const contextHtml = card.context
      ? `<div class="morph-context"><span class="morph-context-label">Context:</span> ${card.context}</div>`
      : '';

    const resultBody = reversed
      ? `${card.answer} = ${card.form}`
      : `${card.form} = ${card.answer}`;

    let interactionHtml = '';
    let resultHtml = '';

    if (runtime.morphSelfCheck) {
      if (!runtime.morphAnswerState.revealed) {
        const placeholder = reversed
          ? 'Recall the Greek form yourself first, then reveal the answer.'
          : 'Parse it yourself first, then reveal the answer.';
        interactionHtml = `<div class="morph-selfcheck-actions">
          <button class="ctrl-btn morph-reveal-btn" type="button" onclick="revealMorphologyAnswer()">Reveal answer</button>
          <button class="ctrl-btn morph-dontknow-btn" type="button" onclick="passMorphologyChoice()">I don't know</button>
        </div>`;
        resultHtml = `<div class="morph-result pending">${placeholder}</div>`;
      } else {
        const resultClass = runtime.morphAnswerState.answered
          ? (runtime.morphAnswerState.skipped ? 'skipped' : (runtime.morphAnswerState.isCorrect ? 'correct' : 'incorrect'))
          : 'pending';
        const resultTitle = runtime.morphAnswerState.answered
          ? (runtime.morphAnswerState.skipped ? 'Marked unsure' : (runtime.morphAnswerState.isCorrect ? 'You had it' : 'Needs more review'))
          : 'Answer';
        const ratingHtml = runtime.morphAnswerState.answered
          ? ''
          : `<div class="morph-selfcheck-actions">
               <button class="choice-btn selfcheck-good" type="button" onclick="rateMorphologySelfCheck(true)">I had it</button>
               <button class="choice-btn selfcheck-bad" type="button" onclick="rateMorphologySelfCheck(false)">Needs review</button>
             </div>`;

        resultHtml = `<div class="morph-result ${resultClass}">
            <div class="morph-result-title">${resultTitle}</div>
            <div class="morph-result-body">${resultBody}</div>
            <div class="morph-result-meta">${card.lemma}${card.gloss ? ` · “${card.gloss}”` : ''}${card.family ? ` · ${card.family}` : ''}</div>
            ${buildGrammarSupportHtml(card, null, { reversed })}
            ${noteHtml}
          </div>${ratingHtml}`;
      }
    } else {
      const choiceButtons = displayChoices.map((choice, idx) => {
        const classes = ['choice-btn'];
        if (reversed) classes.push('choice-btn-greek');
        if (runtime.morphAnswerState.answered) {
          if (choice === correctAnswer) classes.push('correct');
          if (idx === runtime.morphAnswerState.selectedIndex && choice !== correctAnswer) classes.push('incorrect');
        }
        return `<button class="${classes.join(' ')}" type="button" ${runtime.morphAnswerState.answered ? 'disabled' : ''} onclick="answerMorphologyChoice(${idx})">${choice}</button>`;
      }).join('');

      const dontKnowButton = `<button class="choice-btn choice-btn-dontknow" type="button" ${runtime.morphAnswerState.answered ? 'disabled' : ''} onclick="passMorphologyChoice()">I don't know</button>`;
      interactionHtml = `<div class="morph-choices">${choiceButtons}</div><div class="morph-pass-row">${dontKnowButton}</div>`;
      const wrongChoice = runtime.morphAnswerState.answered
        && !runtime.morphAnswerState.isCorrect
        && runtime.morphAnswerState.selectedIndex >= 0
        ? displayChoices[runtime.morphAnswerState.selectedIndex]
        : null;
      const pendingLabel = reversed
        ? 'Choose the correct Greek form.'
        : 'Choose the best parsing option.';
      const resultClass = runtime.morphAnswerState.skipped
        ? 'skipped'
        : (runtime.morphAnswerState.isCorrect ? 'correct' : 'incorrect');
      const resultTitle = runtime.morphAnswerState.skipped
        ? 'Marked unsure'
        : (runtime.morphAnswerState.isCorrect ? 'Correct' : 'Not quite');
      resultHtml = runtime.morphAnswerState.answered
        ? `<div class="morph-result ${resultClass}">
            <div class="morph-result-title">${resultTitle}</div>
            <div class="morph-result-body">${resultBody}</div>
            <div class="morph-result-meta">${card.lemma}${card.gloss ? ` · “${card.gloss}”` : ''}${card.family ? ` · ${card.family}` : ''}</div>
            ${buildGrammarSupportHtml(card, wrongChoice, { reversed })}
            ${noteHtml}
          </div>`
        : `<div class="morph-result pending">${pendingLabel}</div>`;
    }

    area.innerHTML = `
      <div class="morph-card">
        <div class="morph-label">Grammar${reversed ? ' · English → Greek' : ''}</div>
        <div class="morph-prompt">${displayPrompt}</div>
        ${card.lemmaGloss || card.gloss ? `<div class="morph-gloss">Gloss: “${card.lemmaGloss || card.gloss}”</div>` : ''}
        <div class="${formClass}">${displayForm}</div>
        ${contextHtml}
        <div class="morph-hint">${card.lemma}</div>
        <div class="morph-source">${card.sourceLabel}${card.family ? ` · ${card.family}` : ''}${runtime.morphSelfCheck ? ' · Self-check' : ''}</div>
        ${interactionHtml}
        ${resultHtml}
      </div>`;
    runtime.isFlipped = false;
    renderProgress();
    return;
  }

  const advancedCountSuffix = (card.advanced && Number.isFinite(Number(card.count)))
    ? ` [${Number(card.count)}× in NT]`
    : '';
  const sourceLabelDisplay = `${card.sourceLabel}${advancedCountSuffix}`;

  // Prepositions that govern more than one case get a star on both faces as a
  // reminder that the meaning depends on the case of the object.
  const prepStar = host.isMultiCasePreposition(card) ? '★ ' : '';
  const greekDisplay = `${prepStar}${host.formatGreekHeadword(card.g)}`;
  const englishDisplay = `${prepStar}${card.e || '—'}`;
  const requiredLabelHTML = `<span class="card-required-label card-required-label-${card.required ? 'req' : 'opt'}">(${card.required ? 'req.' : 'opt.'})</span>`;

  let frontHTML, backHTML;
  if (!runtime.directionToGreek) {
    frontHTML = `
        <div class="card-face card-front">
          ${requiredLabelHTML}
          <span class="card-label">Greek</span>
          <div class="card-greek">${greekDisplay}</div>
          <div class="card-hint">${sourceLabelDisplay}</div>
          <div class="flip-hint">click to reveal →</div>
        </div>`;
    backHTML = `
        <div class="card-face card-back">
          ${requiredLabelHTML}
          <span class="card-label">English</span>
          <div class="card-english">${englishDisplay}</div>
          <div class="card-greek-small">${host.formatGreekHeadword(card.g)}</div>
          <div class="card-hint">${host.transliterateGreek(host.formatGreekHeadword(card.g))}${advancedCountSuffix}</div>
          <div class="card-pos">${host.detectPartOfSpeech(card)}</div>
        </div>`;
  } else {
    frontHTML = `
        <div class="card-face card-front">
          ${requiredLabelHTML}
          <span class="card-label">English</span>
          <div class="card-english">${englishDisplay}</div>
          <div class="card-hint">${sourceLabelDisplay}</div>
          <div class="flip-hint">click to reveal →</div>
        </div>`;
    backHTML = `
        <div class="card-face card-back">
          ${requiredLabelHTML}
          <span class="card-label">Greek</span>
          <div class="card-greek">${greekDisplay}</div>
          <div class="card-hint">${host.transliterateGreek(host.formatGreekHeadword(card.g))}${advancedCountSuffix}</div>
          <div class="card-pos">${host.detectPartOfSpeech(card)}</div>
        </div>`;
  }

  area.innerHTML = `
    <div class="card-wrapper" id="cardWrapper" onclick="flipCard()">
      <div class="card-inner" id="cardInner">
        ${frontHTML}
        ${backHTML}
      </div>
    </div>`;

  runtime.isFlipped = false;
  renderProgress();
}

export function flipCard() {
  const wrapper = document.getElementById('cardWrapper');
  if (!wrapper) return;
  host.noteStudyInteraction();
  runtime.isFlipped = !runtime.isFlipped;
  wrapper.classList.toggle('flipped', runtime.isFlipped);

  if (runtime.isFlipped && host.maybeReturnKnownCardToActivePile()) {
    renderProgress();
    renderReview();
    host.saveState();
  }
}
