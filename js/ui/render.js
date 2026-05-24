// Card rendering for both vocab and grammar modes, plus flipCard().
//
// Reads runtime state for deck position / direction / answer state. Calls
// back into main.js for the deck/lifecycle hooks (startNextCycle, saveState,
// isMorphologyMode, etc.) and into progress.js for the progress/review
// re-renders that follow a flip or mark.

import { runtime } from '../state/runtime.js';
import { buildGrammarSupportHtml } from '../domain/grammar/explanations.js';
import { renderProgress, renderReview } from './progress.js';
import { buildMorphSteps, summarizeLemmaStats, getParadigmStepAttemptWindow, computeAccessibleDimensionPools, parseAnswerDimensions, aspectMistakeNote, isSecondPluralPresentMoodAmbiguity } from '../domain/grammar/morph_steps.js';
import { getAccessibleMorphCards } from '../domain/grammar/paradigm_focus.js';

let host = {
  saveState: () => {},
  syncLayoutVisibility: () => {},
  noteStudyInteraction: () => {},
  getNearDueCount: () => 0,
  isMorphologyMode: () => false,
  isParsingMode: () => false,
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
    if (host.isParsingMode()) {
      emptyMessage = 'Pick a focused paradigm from the dropdown above to start parsing.';
    } else if (host.isMorphologyMode()) {
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

  if (!runtime.spacedRepetition && (host.isMorphologyMode() || host.isParsingMode()) && runtime.currentIdx >= runtime.deck.length && runtime.unspacedPendingRecycle) {
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

  // Parsing mode always uses the step-by-step renderer for dimensional cards.
  // Stem-change recall cards ("what is the aorist of βάλλω?") have
  // card.dimensional === false; those fall through to the standard MC
  // renderer below regardless of mode.
  if (host.isMorphCard(card) && host.isParsingMode() && card.dimensional !== false) {
    renderMorphStepCard(area, card);
    return;
  }

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
  // Supplemental paradigm set labels read "<lemma> — <sub-paradigm>" (e.g.
  // "λύω — present active indicative"). Showing the sub-paradigm on the
  // card front gives away the parse class of the form — knowing λύῃς is
  // a subjunctive collapses the recall to a single form. Strip the tail
  // for the on-card hint and show just the lemma side; the full label
  // still appears in the session selector for browsing.
  const onCardSourceLabel = card.supplemental
    ? cardFaceLabelFromSourceLabel(card.sourceLabel)
    : card.sourceLabel;
  const sourceLabelDisplay = `${onCardSourceLabel}${advancedCountSuffix}`;

  // Prepositions that govern more than one case get a star on both faces as a
  // reminder that the meaning depends on the case of the object.
  const prepStar = host.isMultiCasePreposition(card) ? '★ ' : '';
  const greekDisplay = `${prepStar}${host.formatGreekHeadword(card.g)}`;
  const englishDisplay = `${prepStar}${card.e || '—'}`;
  const requiredLabelHTML = `<span class="card-required-label card-required-label-${card.required ? 'req' : 'opt'}">(${card.required ? 'req.' : 'opt.'})</span>`;

  // Stem-flip cards (2nd-aorist / aorist-passive / perfect-active / μι-verb
  // supplements): both faces show Greek + English gloss subtitle, with the
  // differing characters highlighted so the stem change between the two
  // forms is visually obvious. Direction toggle is ignored — the card is
  // always present-on-front, target-on-back.
  let frontHTML, backHTML;
  if (card.stemFlip) {
    const diff = diffHighlightPair(card.g, card.aorist);
    const flipHint = '<div class="flip-hint">click to reveal →</div>';
    const noteHtml = card.stemNote
      ? `<div class="card-stem-note">${escapeHtml(card.stemNote)}</div>`
      : '';
    frontHTML = `
        <div class="card-face card-front card-stem-flip">
          ${requiredLabelHTML}
          <span class="card-label">Present</span>
          <div class="card-greek card-stem-flip-form">${diff.aHtml}</div>
          <div class="card-stem-flip-gloss">${escapeHtml(card.e || '')}</div>
          <div class="card-hint">${sourceLabelDisplay}</div>
          ${flipHint}
        </div>`;
    backHTML = `
        <div class="card-face card-back card-stem-flip">
          ${requiredLabelHTML}
          <span class="card-label">${escapeHtml(card.stemFlipAorist || 'Aorist (1st sg.)')}</span>
          <div class="card-greek card-stem-flip-form">${diff.bHtml}</div>
          <div class="card-stem-flip-gloss">${escapeHtml(card.aoristGloss || '')}</div>
          ${noteHtml}
          <div class="card-hint">${escapeHtml(card.g)} → ${escapeHtml(card.aorist)}</div>
        </div>`;
  } else if (!runtime.directionToGreek) {
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

// ─── Step-by-step paradigm rendering ──────────────────────────────────────
// Walks one dimension MC per click. State is held in runtime.morphStepState
// and lazily initialized whenever the active card changes.
function ensureStepStateForCard(card) {
  const state = runtime.morphStepState;
  if (state && state.cardId === card.id) return state;
  // Build a chapter-gated distractor pool so MC choices never include
  // tenses/moods/cases the textbook hasn't introduced by the user's max
  // selected chapter (e.g. no "pluperfect" while Ch ≤ 24).
  const accessibleCards = getAccessibleMorphCards(runtime.selectedKeys);
  const accessiblePools = computeAccessibleDimensionPools(accessibleCards);
  const steps = buildMorphSteps(card, accessiblePools, { includeAspect: runtime.aspectStep !== false });
  runtime.morphStepState = {
    cardId: card.id,
    steps,
    stepIdx: 0,
    answers: new Array(steps.length).fill(null),
    completed: steps.length === 0,
    // Kept on state so answerMorphologyStep can build ungraded follow-up
    // steps with the same chapter-gated MC choices the original steps
    // were drawn from (avoids re-computing on every answer).
    accessiblePools
  };
  return runtime.morphStepState;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Diff-highlights two Greek strings via Longest Common Subsequence: shared
// characters render plain, the rest get wrapped in <span class="stem-diff">.
// Used by the stem-flip card renderer so the present↔aorist stem change is
// visually obvious without the student having to mentally subtract one form
// from the other.
function diffHighlightPair(a, b) {
  const A = [...String(a || '')];
  const B = [...String(b || '')];
  if (!A.length || !B.length) return { aHtml: escapeHtml(a || ''), bHtml: escapeHtml(b || '') };
  const m = A.length, n = B.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      dp[i + 1][j + 1] = A[i] === B[j] ? dp[i][j] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const inLCS_A = new Array(m).fill(false);
  const inLCS_B = new Array(n).fill(false);
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (A[i - 1] === B[j - 1]) {
      inLCS_A[i - 1] = true;
      inLCS_B[j - 1] = true;
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  const wrap = (chars, mask) => chars.map((ch, idx) =>
    mask[idx] ? escapeHtml(ch) : `<span class="stem-diff">${escapeHtml(ch)}</span>`
  ).join('');
  return { aHtml: wrap(A, inLCS_A), bHtml: wrap(B, inLCS_B) };
}

// Supplemental set labels follow "<lemma(s)> — <sub-paradigm>" (e.g.
// "λύω — present active indicative"). On a card face the sub-paradigm
// half leaks the parse class — drop it. Labels without an em-dash
// separator ("First and second personal pronouns") are returned as-is.
// Selectors/analytics keep the full label by going through card.sourceLabel
// directly instead of this helper.
function cardFaceLabelFromSourceLabel(label) {
  if (!label) return label;
  const idx = label.indexOf(' — ');
  return idx >= 0 ? label.slice(0, idx) : label;
}

function renderMorphStepBreadcrumb(state) {
  if (!state.steps.length) return '';
  // Reveal dots one step at a time. Showing the full breadcrumb upfront
  // leaks the parse class — e.g. an A T M C N G tail on a verb form tells
  // you it's a participle before you've answered the Mood step, because
  // only participles carry case/number/gender. Render only the answered
  // steps plus the current step until the walk completes.
  const visibleCount = state.completed
    ? state.steps.length
    : Math.min(state.steps.length, state.stepIdx + 1);
  const dots = state.steps.slice(0, visibleCount).map((step, idx) => {
    const answer = state.answers[idx];
    let cls = 'morph-step-dot';
    if (idx === state.stepIdx && !state.completed) cls += ' current';
    // Inferred steps (ungraded follow-ups) and steps whose correctness
    // is deferred pending a follow-up answer render as neutral — the
    // student shouldn't see "wrong" on mood before they've committed
    // to the dynamic person that completes their parse.
    else if (answer && (step.inferred || answer.deferred)) cls += ' neutral';
    else if (answer && answer.isCorrect === true) cls += ' correct';
    else if (answer && answer.isCorrect === false) cls += ' incorrect';
    return `<span class="${cls}" title="${escapeHtml(step.label)}">${escapeHtml(step.label[0])}</span>`;
  }).join('');
  return `<div class="morph-step-breadcrumb">${dots}</div>`;
}

function renderMorphStepCurrent(state) {
  const step = state.steps[state.stepIdx];
  if (!step) return '';
  const choiceButtons = step.displayChoices.map((label, idx) => {
    return `<button class="choice-btn" type="button" onclick="answerMorphologyStep(${idx})">${escapeHtml(label)}</button>`;
  }).join('');
  return `
    <div class="morph-step-current">
      <div class="morph-step-progress">Step ${state.stepIdx + 1}</div>
      <div class="morph-step-label">${escapeHtml(step.label)}?</div>
      <div class="morph-choices">${choiceButtons}</div>
      <div class="morph-dontknow-row">
        <button class="ctrl-btn morph-dontknow-btn" type="button" onclick="skipMorphologyStep()">I don't know</button>
      </div>
      <div class="morph-pass-card-row">
        <button class="ctrl-btn morph-pass-card-btn" type="button" onclick="passMorphologyCard()" title="Skip this whole card and move on. Nothing is recorded in your paradigm stats.">Skip card (no stats)</button>
      </div>
    </div>`;
}

// Mirrors the display-suffix logic in morph_steps.js so a person value
// like "first" reads as "first person" in correction lines too.
function applyDisplaySuffixIfPerson(dimKey, value) {
  return dimKey === 'person' ? `${value} person` : value;
}

// Builds a human-readable parse from a list of dimension values, e.g.
// ['continuous', 'present', 'indicative', 'second', 'plural'] →
// "continuous · present · indicative · second person · plural". Skips
// empty values so a partial walk still reads cleanly.
// Imperative cards have no Person step (it's structurally 2nd person), but
// the canonical parse still reads "...imperative · second person ·
// singular" — slot the implied 2nd-person token in after mood when no
// Person step is present.
function assembleParseLine(steps, values) {
  const parts = [];
  let moodImperativePos = -1;
  let hasPersonStep = false;
  steps.forEach((step, idx) => {
    if (step.key === 'person') hasPersonStep = true;
    const v = values[idx];
    if (!v) return;
    parts.push(step.key === 'person' ? `${v} person` : v);
    if (step.key === 'mood' && String(v).toLowerCase() === 'imperative') {
      moodImperativePos = parts.length;
    }
  });
  if (moodImperativePos >= 0 && !hasPersonStep) {
    parts.splice(moodImperativePos, 0, 'second person');
  }
  return parts.join(' · ');
}

// Two dimension values are compatible if they share any '/'-separated
// component. Picking 'nominative' matches an answer of 'nominative' or
// 'nominative/accusative'; picking 'nominative/accusative' matches an
// answer of 'nominative' or 'accusative' or 'nominative/accusative'.
function dimsCompatible(picked, answer) {
  if (!picked || !answer) return false;
  const pp = String(picked).split('/').filter(Boolean);
  const ap = String(answer).split('/').filter(Boolean);
  return pp.some((p) => ap.includes(p));
}

// Many paradigm-derived card answers omit voice and/or mood — the data
// extracts the parsing from the card's English-side note, so a card like
// `{ g: 'λύω', e: 'I untie / I am untying (1st person sg.)' }` produces
// the canonical "present first person singular" with no 'indicative' or
// 'active' tag, even though the set label says "λύω — present active
// indicative." For the form-lookup feedback we need those tags, otherwise
// the orphan-skip rule lets a student picking mood=imperative falsely
// match λύω. Reads what the label implies and prepends it to the answer
// string when not already present. Augmentation is local to the lookup —
// it doesn't change card.answer used by step generation or grading, so
// the student isn't suddenly asked about voice in chapters where the
// textbook hasn't introduced it.
function augmentAnswerWithLabel(answer, label) {
  if (!answer) return '';
  if (!label) return answer;
  const t = String(label).toLowerCase();
  const voiceMatch = t.match(/\b(middle\/passive|middle or passive|active|middle|passive)\b/);
  const moodMatch  = t.match(/\b(indicative|subjunctive|imperative|infinitive|participle)\b/);
  const lcAns = String(answer).toLowerCase();
  // Only augment when the answer doesn't already carry its OWN mood/voice
  // marker. Comparing against the label's first match (the previous logic)
  // misfires on labels that mention multiple moods — e.g. "εἰμί —
  // infinitive and participle" picks 'infinitive' and prepends it to every
  // participle card, so ans.mood parses as 'infinitive' and the form
  // lookup can no longer match the card on a participle pick.
  const ansHasVoice = /\b(active|middle|passive|middle\/passive)\b/.test(lcAns);
  const ansHasMood  = /\b(indicative|subjunctive|imperative|infinitive|participle)\b/.test(lcAns);
  let out = String(answer);
  if (voiceMatch && !ansHasVoice) {
    const v = voiceMatch[0].replace(/middle or passive/, 'middle/passive');
    out = `${v} ${out}`;
  }
  if (moodMatch && !ansHasMood) {
    out = `${moodMatch[0]} ${out}`;
  }
  return out;
}

// Builds a form→answer map for every morph card in `cards` whose lemma
// matches. Used as a fallback pool when the card's own paradigm subset
// doesn't cover the student's picks (e.g. λῦε lives in the active-
// imperative paradigm; 'aorist infinitive' picks point at λῦσαι in
// λύω's separate active-infinitive paradigm).
//
// Critically, `cards` should be the chapter-gated accessible deck (from
// getAccessibleMorphCards) — NOT every morph card ever defined. Voice
// isn't introduced until chapter 15 in Mounce's curriculum, so a chapter-3
// student parsing λῦε must not have λύομαι (middle/passive indicative
// 1sg, chapter 15+) surfaced as a candidate match. Restricting the
// pool to accessible cards keeps the feedback aligned with what the
// student has actually been taught.
function buildLemmaFormToAnswerFromCards(lemma, cards) {
  if (!lemma) return {};
  const out = {};
  for (const c of (cards || [])) {
    if (!c || c.lemma !== lemma || !c.form) continue;
    // Prefer the canonical parsed form when the card supplies one
    // (grammar.js can ship a `parsed:` next to a sparse human answer).
    const ans = c.parsedAnswer || c.answer;
    if (!ans) continue;
    // Stem-pair study notes like 'βάλλω → ἔβαλον' aren't single forms.
    if (/→/.test(c.form)) continue;
    if (out[c.form] === undefined) out[c.form] = augmentAnswerWithLabel(ans, c.sourceLabel || '');
  }
  return out;
}

// Card's own paradigm pool augmented with voice/mood implied by the
// card's sourceLabel — same reason as buildLemmaFormToAnswerFromCards
// above. Without this the orphan-skip rule lets every untagged answer
// in the card's pool spuriously match whichever mood/voice the student
// picked.
function buildAugmentedCardPool(card) {
  if (!card || !card.formToAnswer || typeof card.formToAnswer !== 'object') return {};
  const out = {};
  for (const [form, answer] of Object.entries(card.formToAnswer)) {
    if (!form || !answer) continue;
    out[form] = augmentAnswerWithLabel(answer, card.sourceLabel || '');
  }
  return out;
}

// Aspect is derivative of tense (present → continuous/undefined, aorist →
// undefined, etc.) so it adds no form-identification information beyond
// tense. Excluded from picked-dim matching to keep the lookup focused on
// the dimensions that actually disambiguate a Greek form.
const FORM_LOOKUP_SKIP_DIMS = new Set(['aspect']);

// Citation-form priority used to pick a single canonical match when the
// student's picks underdetermine the form (e.g. picking 'present
// indicative singular' on a verb without specifying voice or person —
// six forms qualify, we want one). Lower scores win.
const VOICE_ORDER  = { active: 0, 'middle/passive': 1, middle: 2, passive: 3 };
const PERSON_ORDER = { first: 0, third: 1, second: 2 };
const NUMBER_ORDER = { singular: 0, plural: 1 };
const CASE_ORDER   = { nominative: 0, accusative: 1, genitive: 2, dative: 3, vocative: 4 };
const GENDER_ORDER = { masculine: 0, feminine: 1, neuter: 2 };
function canonicalScore(ansDims) {
  const v = VOICE_ORDER[ansDims.voice]  ?? 9;
  const p = PERSON_ORDER[ansDims.person] ?? 9;
  const n = NUMBER_ORDER[ansDims.number] ?? 9;
  const c = CASE_ORDER[ansDims.case]     ?? 9;
  const g = GENDER_ORDER[ansDims.gender] ?? 9;
  return v * 1e6 + p * 1e4 + n * 1e2 + c * 1e1 + g;
}

// Checks the student's picked parse against the lemma's negative
// morphological inventory (from js/data/lemma_inventory.js). Returns
// false only when the picks include a tense/voice/mood that genuinely
// doesn't exist for this lemma in Greek (e.g. aorist εἰμί). Lemmas with
// no inventory entry default to "all combos possible," so this function
// never spuriously reports impossibility — that's how we distinguish
// "[no morph exists]" (confident) from "—" (data gap).
function isParseImpossibleForLemma(lemma, pickedDims) {
  const inv = (typeof window !== 'undefined' && window.LEMMA_INVENTORY) ? window.LEMMA_INVENTORY[lemma] : null;
  if (!inv) return false;
  const violates = (list, picked) => {
    if (!Array.isArray(list) || !picked) return false;
    // Picked may itself be syncretic ('middle/passive'); any component
    // landing in the impossible list disqualifies the combination.
    const parts = String(picked).split('/').filter(Boolean);
    return parts.some((p) => list.includes(p));
  };
  if (violates(inv.impossibleTenses, pickedDims.tense)) return true;
  if (violates(inv.impossibleVoices, pickedDims.voice)) return true;
  if (violates(inv.impossibleMoods,  pickedDims.mood))  return true;
  return false;
}

// Mood is a structural class, not just another label: finite forms carry
// a person; participles carry case + gender; infinitives carry none of
// these. A candidate whose answer string omits an explicit mood marker
// (Mounce's εἰμί cards say "Future: I will be (1sg.)" with no "indicative"
// tag) can still be disqualified by its structural shape — without this,
// picking mood=participle on εἰμί + future happily matches the finite
// ἔσομαι because per-dim matching only checks tense + number.
function structurallyCompatibleMood(pickedMood, ansDims) {
  if (!pickedMood) return true;
  const nonFinitePick = pickedMood === 'participle' || pickedMood === 'infinitive';
  if (nonFinitePick && ansDims.person) return false;
  if (!nonFinitePick && (ansDims.case || ansDims.gender) && !ansDims.person) return false;
  return true;
}

// Resolves the student's picked dimensions to one of three outcomes:
//   { kind: 'form', form }       — canonical Greek form matching the picks
//   { kind: 'impossible' }       — inventory says this combo doesn't exist
//                                  in Greek for this lemma (e.g. aorist εἰμί)
//   { kind: 'none' }             — combo is theoretically possible but no
//                                  form for it appears in our data
//
// Strategy: skip aspect (derivative of tense). Inventory check first,
// since a confident "impossible" verdict should win over a data-gap
// "—" even if the picks happen not to match anything in the pool.
// Then try the card's own paradigm subset (tightest context), broaden
// to the lemma-wide pool, and pick a single canonical form.
function resolveFormForPickedDims(card, steps, pickedValues) {
  if (!card) return { kind: 'none' };
  const pickedDims = {};
  steps.forEach((step, idx) => {
    const v = pickedValues[idx];
    if (v && !FORM_LOOKUP_SKIP_DIMS.has(step.key)) pickedDims[step.key] = v;
  });
  const keys = Object.keys(pickedDims);
  if (keys.length === 0) return { kind: 'none' };

  if (isParseImpossibleForLemma(card.lemma, pickedDims)) return { kind: 'impossible' };

  // A dimension the candidate answer doesn't carry (infinitives have no
  // number; finite verbs have no case) shouldn't disqualify the
  // candidate — the orphan dimension is a category error against this
  // candidate, not a disagreement. Structural mood compatibility is
  // checked separately so an unlabeled finite candidate can't satisfy a
  // participle/infinitive pick.
  const matchPool = (pool) => {
    const out = [];
    for (const [form, answer] of Object.entries(pool || {})) {
      if (!form || !answer) continue;
      const ansDims = parseAnswerDimensions(answer);
      const ok = keys.every((k) => !ansDims[k] || dimsCompatible(pickedDims[k], ansDims[k]));
      if (!ok) continue;
      if (!structurallyCompatibleMood(pickedDims.mood, ansDims)) continue;
      out.push({ form, ansDims });
    }
    return out;
  };

  let candidates = matchPool(buildAugmentedCardPool(card));
  if (!candidates.length) {
    // Chapter-gated broadening: pool only forms from cards the student
    // currently has access to. Stops voice-distinguished forms (m/p,
    // passive — chapter 15+) from leaking into a chapter-3 student's
    // feedback for λύω.
    const accessibleCards = getAccessibleMorphCards(runtime.selectedKeys);
    candidates = matchPool(buildLemmaFormToAnswerFromCards(card.lemma, accessibleCards));
  }
  if (!candidates.length) {
    // Final fallback: lemma_inventory's extraForms — morphologically real
    // paradigms (εἰμί's future middle participle, etc.) that no card
    // carries. Pure lookup augmentation; not part of any study deck.
    const inv = (typeof window !== 'undefined' && window.LEMMA_INVENTORY)
      ? window.LEMMA_INVENTORY[card.lemma]
      : null;
    if (inv && inv.extraForms) candidates = matchPool(inv.extraForms);
  }
  if (!candidates.length) return { kind: 'none' };

  candidates.sort((a, b) => canonicalScore(a.ansDims) - canonicalScore(b.ansDims));
  return { kind: 'form', form: candidates[0].form };
}

function renderMorphStepSummary(card, state) {
  const rows = state.steps.map((step, idx) => {
    const answer = state.answers[idx];
    const pickedLabel = answer && answer.selectedIdx >= 0
      ? step.displayChoices[answer.selectedIdx]
      : '—';
    // A null answer means the walk ended before this step (structural
    // impossibility short-circuit). Render neutral, no ✓/✗ — these were
    // never asked, so they're not graded.
    if (!answer && state.structuralImpossibility) {
      return `
        <div class="morph-step-summary-row morph-step-inferred">
          <span class="morph-step-summary-dim">${escapeHtml(step.label)}</span>
          <span class="morph-step-summary-pick">${escapeHtml(pickedLabel)}</span>
        </div>`;
    }
    // Inferred follow-up steps are ungraded: render the student's pick
    // without a ✓/✗ mark and without a correction arrow.
    if (step.inferred) {
      return `
        <div class="morph-step-summary-row morph-step-inferred">
          <span class="morph-step-summary-dim">${escapeHtml(step.label)}</span>
          <span class="morph-step-summary-pick">${escapeHtml(pickedLabel)}</span>
        </div>`;
    }
    const correct = answer && answer.isCorrect;
    const markClass = correct ? 'morph-step-correct' : 'morph-step-incorrect';
    const mark = correct ? '✓' : '✗';
    // Each step now carries a single correct value (the composite
    // 'continuous/undefined' counts as one). For aspect mistakes the
    // picked value can visually overlap the correct one (picking
    // "continuous" when the right answer is "continuous/undefined"), so
    // we append a one-line note that names the mistake — strikethrough +
    // arrow alone reads like a near-miss in that case.
    const acceptable = Array.isArray(step.acceptable) ? step.acceptable : [step.correct];
    const correctionInner = acceptable.map((a) => escapeHtml(applyDisplaySuffixIfPerson(step.key, a))).join(' / ');
    let aspectNoteHtml = '';
    if (!correct && answer && answer.selectedIdx >= 0 && step.key === 'aspect' && step.context) {
      const pickedRaw = step.choices[answer.selectedIdx];
      const note = aspectMistakeNote(step.context.tense, pickedRaw, step.correct);
      if (note) aspectNoteHtml = `<span class="morph-step-aspect-note">${escapeHtml(note)}</span>`;
    }
    const showCorrection = !correct && answer
      ? `<span class="morph-step-correction">→ ${correctionInner}</span>${aspectNoteHtml}`
      : '';
    return `
      <div class="morph-step-summary-row ${markClass}">
        <span class="morph-step-summary-dim">${escapeHtml(step.label)}</span>
        <span class="morph-step-summary-pick">${escapeHtml(pickedLabel)} ${mark}</span>
        ${showCorrection}
      </div>`;
  }).join('');

  // X/N excludes inferred (ungraded) follow-up steps and steps that were
  // never asked because a structural impossibility ended the walk early.
  const gradedCount = state.steps.filter((s, i) => !s.inferred && state.answers[i]).length;
  const totalCorrect = state.answers.filter((a, i) => a && a.isCorrect && !state.steps[i].inferred).length;
  const totalStr = `${totalCorrect}/${gradedCount} correct`;

  // Side-by-side "Your parse" vs "Correct parse" with the corresponding
  // Greek form under each. Shown on every walk (right or wrong) so the
  // parse → form mapping is reinforced consistently. Under "Your parse"
  // we resolve a single canonical paradigm form for the picks; if the
  // picks violate the lemma's morphological inventory (aorist εἰμί,
  // middle/passive εἰμί, …) we say so explicitly. Under "Correct parse"
  // we always show the card's own form.
  const pickedValues = state.steps.map((step, idx) => {
    const ans = state.answers[idx];
    return ans && ans.selectedIdx >= 0 ? step.choices[ans.selectedIdx] : '';
  });
  const correctValues = state.steps.map((step) => step.correct);
  // A structural impossibility (e.g. future imperative) trumps any lemma
  // lookup — show the specific reason instead of the generic "[no morph
  // exists]" we'd fall back to from the inventory check.
  const structReason = state.structuralImpossibility && state.structuralImpossibility.reason;
  let yourFormHtml;
  if (structReason) {
    yourFormHtml = `<div class="morph-step-parse-match morph-step-parse-match-impossible">[${escapeHtml(structReason)}]</div>`;
  } else {
    const lookup = resolveFormForPickedDims(card, state.steps, pickedValues);
    if (lookup.kind === 'form') {
      yourFormHtml = `<div class="morph-step-parse-match">${escapeHtml(lookup.form)}</div>`;
    } else if (lookup.kind === 'impossible') {
      yourFormHtml = `<div class="morph-step-parse-match morph-step-parse-match-impossible">[no morph exists]</div>`;
    } else {
      yourFormHtml = `<div class="morph-step-parse-match morph-step-parse-match-empty">—</div>`;
    }
  }
  const correctFormHtml = card.form
    ? `<div class="morph-step-parse-match">${escapeHtml(card.form)}</div>`
    : '';
  const youParseLine = `<div class="morph-step-parse-compare">
       <div class="morph-step-parse-line morph-step-parse-line-yours">
         <span class="morph-step-parse-label">Your parse</span>
         ${escapeHtml(assembleParseLine(state.steps, pickedValues) || '—')}
         ${yourFormHtml}
       </div>
       <div class="morph-step-parse-line morph-step-parse-line-correct">
         <span class="morph-step-parse-label">Correct parse</span>
         ${escapeHtml(assembleParseLine(state.steps, correctValues))}
         ${correctFormHtml}
       </div>
     </div>`;

  const lemmaSummary = summarizeLemmaStats(runtime.paradigmStepStats || {}, card.lemma);
  const recentLine = lemmaSummary.attempts > 0
    ? `<div class="morph-step-rollup-recent">Last ${lemmaSummary.attempts}/${getParadigmStepAttemptWindow()} attempts for ${escapeHtml(card.lemma)}: ${lemmaSummary.correct}/${lemmaSummary.total} dimensions correct (${Math.round(100 * lemmaSummary.correct / Math.max(1, lemmaSummary.total))}%)</div>`
    : '';

  // Stem-change footer: if the parsed form is in a tense whose stem differs
  // from the present lemma (aorist family, perfect, pluperfect), surface the
  // present → form pair so the student sees the stem association alongside
  // the completed parse. Mounce paradigm lemmas often already encode the
  // stem pair ("λύω → ἔλυσα"); split on " → " and take the head form so the
  // note reads "λύω → ἐλύσαμεν" rather than "λύω → ἔλυσα → ἐλύσαμεν".
  const STEM_CHANGE_TENSES = new Set(['aorist', 'first aorist', 'second aorist', 'perfect', 'pluperfect']);
  const parsedDims = parseAnswerDimensions(card.answer);
  const presentLemma = card.lemma ? String(card.lemma).split(/\s*→\s*/)[0].trim() : '';
  const stemChangeNote = (STEM_CHANGE_TENSES.has(parsedDims.tense) && presentLemma && card.form && presentLemma !== card.form)
    ? `<div class="morph-step-stem-note"><span class="morph-step-stem-label">Stem change</span> ${escapeHtml(presentLemma)} → ${escapeHtml(card.form)}</div>`
    : '';

  // Ambiguity footer: 2nd-plural present is spelt identically in the
  // indicative and imperative (λύετε, λύεσθε), so the form alone doesn't
  // pick a mood — flag it so the student sees why both readings score
  // correct on the Mood step.
  const ambigNote = isSecondPluralPresentMoodAmbiguity(card.answer, parsedDims)
    ? `<div class="morph-step-ambig-note"><span class="morph-step-ambig-label">Ambiguous form</span> 2nd-plural present is spelt the same in the indicative and the imperative — only context picks the mood. Either reading is accepted.</div>`
    : '';

  return `
    <div class="morph-step-summary">
      <div class="morph-step-summary-title">Parse complete — ${escapeHtml(totalStr)}</div>
      <div class="morph-step-summary-body">${rows}</div>
      ${youParseLine}
      ${ambigNote}
      ${stemChangeNote}
      ${recentLine}
      <div class="morph-step-summary-meta">${escapeHtml(card.lemma)}${card.family ? ' · ' + escapeHtml(card.family) : ''}</div>
    </div>`;
}

function renderMorphStepCard(area, card) {
  const state = ensureStepStateForCard(card);
  const lemmaGloss = card.lemmaGloss || card.gloss
    ? `<div class="morph-gloss">Gloss: “${escapeHtml(card.lemmaGloss || card.gloss)}”</div>`
    : '';

  const body = state.completed
    ? renderMorphStepSummary(card, state)
    : renderMorphStepCurrent(state);

  area.innerHTML = `
    <div class="morph-card morph-step-card">
      <div class="morph-label">Grammar · Step-by-step</div>
      <div class="morph-prompt">Parse this form one dimension at a time.</div>
      ${lemmaGloss}
      <div class="morph-form">${escapeHtml(card.form)}</div>
      <div class="morph-hint">${escapeHtml(card.lemma)}</div>
      <div class="morph-source">${escapeHtml(card.sourceLabel || '')} · Use "continuous/undefined" when the form licenses either reading</div>
      ${renderMorphStepBreadcrumb(state)}
      ${body}
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
