// Card rendering for both vocab and grammar modes, plus flipCard().
//
// Reads runtime state for deck position / direction / answer state. Calls
// back into main.js for the deck/lifecycle hooks (startNextCycle, saveState,
// isMorphologyMode, etc.) and into progress.js for the progress/review
// re-renders that follow a flip or mark.

import { runtime } from '../state/runtime.js';
import { buildGrammarSupportHtml } from '../domain/grammar/explanations.js';
import { renderProgress, renderReview } from './progress.js';
import { buildMorphSteps, THIRD_PERSON_IMPERATIVE_CHAPTER, computeAccessibleDimensionPools, parseAnswerDimensions, aspectMistakeNote, isSecondPluralPresentMoodAmbiguity, computeParadigmPresentValues, accentLookalikesFor, confusableFormHints, isSyncreticMiddlePassiveVoice } from '../domain/grammar/morph_steps.js';
import { getAccessibleMorphCards, deriveSelectionLevels, buildMultiGenderLemmas, THIRD_DECLENSION_NOUN_LEMMAS, paradigmCategoryForLemma } from '../domain/grammar/paradigm_focus.js';
import { resolveLookupWalk } from '../domain/grammar/morph_lookup.js';

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
  noteParsingCardShown: () => {},
  maybeReturnKnownCardToActivePile: () => false,
  // window-global text formatters are wrapped so the module doesn't depend on
  // load order between this ES module and the legacy <script defer> data files.
  formatGreekHeadword: (g) => g || '—',
  transliterateGreek: (s) => s,
  detectPartOfSpeech: () => '',
  isMultiCasePreposition: () => false,
  getEnabledParsingDims: () => null,
  // Lookup / Build mode: the focused lemma to build, and its full form pool.
  getLookupFocusLemma: () => null,
  getLookupFormsForLemma: () => [],
  // Full focused-paradigm card pool (chapter-gated, but NOT pruned by the
  // exclude-known filter or per-value dim filters) — the structural truth of
  // what forms the paradigm owns. Used to detect value gaps like ἐγώ/σύ
  // having no third-person forms. Returns [] outside parsing mode.
  getFocusedParadigmAllCards: () => []
};

export function configureRender(deps) {
  host = { ...host, ...deps };
}

// Small superscript star printed before a headword as a terse "watch this form"
// marker — currently on multi-case prepositions (the meaning shifts with the
// object's case). The trailing space keeps it off the first letter.
const HEADWORD_STAR = '<sup class="card-headword-star" aria-hidden="true">★</sup> ';

// Spell out the derived-card form abbreviation (card.derivedShort) for the
// "(aorist)" / "(future)" caption under a generated "Variant forms as cards"
// headword — names the tense/voice, not the meaning, so it's safe pre-flip.
const FORM_TAG_FULL_LABELS = {
  'aor': 'aorist',
  'fut': 'future',
  'pf': 'perfect',
  'aor pass': 'aorist passive',
  'pres': 'present'
};

// Grammar MC options often carry a trailing parenthetical that names the very
// grammatical category the prompt asks for, or glosses the form — e.g.
// "ὁ ἀπόστολος (nominative)" against "(accusative)" siblings, or a parse
// string ending in "('he sees')" when only the correct option is glossed.
// Shown up front, that tail hands the answer over (it labels the right
// category, or singles out the one annotated option). This returns a
// display-only copy of the choices with each trailing "(…)" removed so the
// buttons read as a real recall test before the student commits; the full
// text — brackets and all — returns on the disabled buttons and in the reveal
// once they answer. Returns null (leave choices untouched) when there is
// nothing to hide, or when stripping would make any option empty or collide
// with another — that guards load-bearing parens like "genitive plural
// ('of us')" vs "('of you all')", where the tail is the only thing telling
// the options apart.
function hideGrammarChoiceAnnotations(choices) {
  if (!Array.isArray(choices) || choices.length < 2) return null;
  const stripped = choices.map(c => String(c).replace(/\s*\([^()]*\)\s*$/, '').trim());
  const changed = stripped.some((s, i) => s !== String(choices[i]).trim());
  if (!changed) return null;
  if (stripped.some(s => s.length === 0)) return null;
  if (new Set(stripped).size !== stripped.length) return null;
  return stripped;
}

// Focused-paradigm lemmas that are stem-recall prompts ("what is the aorist
// of λαμβάνω?") rather than canonical paradigm forms. Parsing mode can't
// dimension-walk them — they have no tense/voice/mood/case/etc. parse —
// so we surface a redirect card that, when clicked, hops the student into
// the matching stem-pair Vocab supplemental. Second-aorist gets the
// stem-FLIP set (W3_SECOND_AORIST_FLIP, with diff-highlighted changing
// letters). The liquid-future group does NOT redirect — parsing mode
// substitutes Mounce's parseable liquid-future paradigm
// ("κρίνω → κρινῶ"), which carries the distinctive liquid-future
// pattern in parseable form; that swap happens in syncParadigmFocusUi
// (main.js).
const PARSING_INCOMPATIBLE_LEMMAS = {
  'Second-aorist stems': 'W3_SECOND_AORIST_FLIP'
};

// The "nothing selected" placeholder — the same markup index.html ships in
// #cardArea. Shown on a fresh start, after deselecting everything, and when
// switching into a mode that has no chapters selected (e.g. split
// vocab/grammar selection with only one side populated). Only paints the card
// area; callers that also need the deck cleared do that themselves.
export function renderChooseSessionEmptyState() {
  const area = document.getElementById('cardArea');
  if (area) {
    area.innerHTML = '<div class="empty-state"><div class="big">αβγ</div>Tap to choose a session and start studying.</div>';
  }
}

export function renderCard() {
  const area = document.getElementById('cardArea');
  host.saveState();
  host.syncLayoutVisibility();
  // The stem-recall redirect path below hides navRow with inline display:
  // none. Reset that here so the nav row reappears when the user switches
  // off the redirect (e.g. picks a normal paradigm); inner button state
  // is then re-synced by syncLayoutVisibility above.
  // The stem-recall redirect is about the single focused lemma; when the deck
  // mixes paradigms (shuffle-all or the custom set) morphFocusedParadigm may
  // still hold a stem-recall lemma the user last focused, but the deck has real
  // cards — so don't hijack it with the redirect.
  const mixingParadigms = runtime.parsingShuffleAll || runtime.parsingCustomReview;
  const navRow = document.getElementById('navRow');
  if (navRow && navRow.style.display === 'none' && !(host.isParsingMode() && !mixingParadigms && runtime.morphFocusedParadigm && Object.prototype.hasOwnProperty.call(PARSING_INCOMPATIBLE_LEMMAS, runtime.morphFocusedParadigm))) {
    navRow.style.display = '';
  }

  if (host.isParsingMode() && !mixingParadigms && runtime.morphFocusedParadigm && Object.prototype.hasOwnProperty.call(PARSING_INCOMPATIBLE_LEMMAS, runtime.morphFocusedParadigm)) {
    const lemma = runtime.morphFocusedParadigm;
    const drillKey = PARSING_INCOMPATIBLE_LEMMAS[lemma];
    area.innerHTML = `
      <button type="button" class="empty-state parsing-redirect-btn" onclick="goToStemDrillFromParsing('${drillKey}')">
        <div class="big">↗</div>
        <strong>${lemma}</strong> is a stem-recall drill, not a parseable
        paradigm — there are no tense / voice / mood / case dimensions to
        walk. <u>Tap to open the matching Vocabulary mode supplemental</u>.
      </button>`;
    // The redirect card is the only action surface here — Prev/Reset/Next
    // would just no-op against the empty deck, so hide the whole nav row
    // until the user taps through (or switches paradigms).
    const navRow = document.getElementById('navRow');
    if (navRow) navRow.style.display = 'none';
    return;
  }

  // Build / Lookup mode: a deck-independent paradigm reference. Sits ahead of
  // every deck-state branch (it reads the focused paradigm's full form pool
  // live, not runtime.deck), after the stem-recall redirect above.
  if (host.isParsingMode() && runtime.parsingLookup) {
    renderMorphLookupCard(area);
    return;
  }

  // No chapters selected for the current mode → show the canonical "choose a
  // session" placeholder. Sits ahead of every deck-dependent branch so a stale
  // deck carried over from the mode we just left can't render here. This is
  // the split vocab/grammar case: switching to the side with no selection used
  // to surface the other side's cards (e.g. grammar cards in an empty vocab
  // deck) because the deck was never cleared.
  if (!runtime.selectedKeys.length) {
    renderChooseSessionEmptyState();
    return;
  }

  if (!runtime.deck.length) {
    let emptyMessage;
    if (host.isParsingMode()) {
      // A paradigm IS focused but the deck came back empty. With "Exclude
      // known morphs" on, runtime.parsingAllMastered tells us the known-filter
      // drained a non-empty pool — every in-scope form is 2/2 known — so we
      // tell the student the paradigm is mastered rather than nudging them to
      // pick one they've already picked. A pool emptied by value/optional
      // filters leaves the flag false and falls through to the generic
      // prompt, so the mastery claim can't false-positive.
      if (runtime.parsingCustomReview) {
        // Custom paradigm set: the dropdown is hidden, so steer the student to
        // the checklist instead. Distinguish "nothing ticked yet" from "ticked
        // but the pool came back empty" (everything mastered / out of scope).
        const anySelected = !!(runtime.parsingCustomParadigms
          && Object.values(runtime.parsingCustomParadigms).some(Boolean));
        emptyMessage = !anySelected
          ? 'Custom paradigm set is on, but no paradigms are ticked yet. Tick one or more paradigms in the selector above to build your review deck.'
          : runtime.excludeKnownMorphs
            ? 'Every parseable form in your selected paradigms is mastered (both of the last two attempts correct under your current parsing toggles). Tick more paradigms above, clear a form’s tally with the ✕ in the progress panel below, or turn off “Exclude known morphs” to drill them again.'
            : 'No parseable forms are in scope for the selected paradigms at the current chapter. Tick different paradigms above or raise the parsing chapter.';
      } else {
        emptyMessage = (runtime.morphFocusedParadigm && runtime.excludeKnownMorphs && runtime.parsingAllMastered)
          ? 'Every form in this paradigm is mastered (both of the last two attempts correct under your current parsing toggles). Pick another paradigm above, clear a form’s tally with the ✕ in the progress panel below, or turn off “Exclude known morphs” to drill them again.'
          : 'Pick a focused paradigm from the dropdown above to start parsing.';
      }
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
    // Tally this display for orderParsingPool's fewest-shown-first ordering.
    // The id guard inside the hook means the walk's many re-renders count once.
    host.noteParsingCardShown(card.id);
    if (runtime.parsingReverse) {
      renderParsingReverseCard(area, card);
      return;
    }
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
      // Grammar cards hide answer-giving trailing parentheticals until the
      // student answers. Grading stays index-based against the untouched
      // card data; this is display-only. Morphology drill cards keep their
      // full labels (their parentheticals are part of the parse).
      const isGrammarCard = String(card.id || '').startsWith('grammar-');
      const choiceLabels = (!reversed && isGrammarCard && !runtime.morphAnswerState.answered)
        ? hideGrammarChoiceAnnotations(displayChoices)
        : null;
      const choiceButtons = displayChoices.map((choice, idx) => {
        const classes = ['choice-btn'];
        if (reversed) classes.push('choice-btn-greek');
        if (runtime.morphAnswerState.answered) {
          if (choice === correctAnswer) classes.push('correct');
          if (idx === runtime.morphAnswerState.selectedIndex && choice !== correctAnswer) classes.push('incorrect');
        }
        const label = choiceLabels ? choiceLabels[idx] : choice;
        return `<button class="${classes.join(' ')}" type="button" ${runtime.morphAnswerState.answered ? 'disabled' : ''} onclick="answerMorphologyChoice(${idx})">${label}</button>`;
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

    // Gloss + lemma-hint gating:
    // - lemma-hint shows only when the lemma token actually appears in the
    //   form. Family-level lemmas like "attributive vs predicate" describe
    //   the concept being tested, not a Greek word, so showing them as a
    //   hint next to ὁ ἀγαθὸς ἄνθρωπος would mislead.
    // - gloss is held back on translate prompts until the student answers
    //   (otherwise we hand them the translation), and held back whenever
    //   the gloss text matches exactly one of the visible MC options.
    const lemmaMatchesForm = familyLemmaAppearsInForm(card.lemma, card.form);
    const isTranslatePrompt = /translate/i.test(card.prompt || '') && !reversed;
    const glossText = String(card.gloss || card.lemmaGloss || '');
    const glossSinglesOutChoice = !reversed && glossPointsAtSingleChoice(glossText, displayChoices);
    const glossUnlocked = runtime.morphSelfCheck
      ? runtime.morphAnswerState.revealed
      : runtime.morphAnswerState.answered;
    const showGloss = glossText
      && lemmaMatchesForm
      && (!isTranslatePrompt || glossUnlocked)
      && (!glossSinglesOutChoice || glossUnlocked);
    const glossHtml = showGloss
      ? `<div class="morph-gloss">Gloss: “${glossText}”</div>`
      : '';
    const lemmaHintHtml = lemmaMatchesForm
      ? `<div class="morph-hint">${card.lemma}</div>`
      : '';
    area.innerHTML = `
      <div class="morph-card">
        <div class="morph-label">Grammar${reversed ? ' · English → Greek' : ''}</div>
        <div class="morph-prompt">${displayPrompt}</div>
        ${glossHtml}
        <div class="${formClass}">${displayForm}</div>
        ${contextHtml}
        ${lemmaHintHtml}
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
  // Identify by the dictionary lemma, not the paradigm set's principal-parts
  // label, and without a paradigm-category note (see renderMorphStepCard).
  const onCardSourceLabel = card.supplemental
    ? (card.lemma || cardFaceLabelFromSourceLabel(card.sourceLabel))
    : card.sourceLabel;
  const sourceLabelDisplay = `${onCardSourceLabel}${advancedCountSuffix}`;

  // Prepositions that govern more than one case get a star on both faces as a
  // reminder that the meaning depends on the case of the object.
  const prepStar = host.isMultiCasePreposition(card) ? HEADWORD_STAR : '';
  // Vocab mode has no explicit chapter dropdown, so the selection itself is
  // the gate: its max effective chapter (same deriveSelectionLevels scale
  // parsing uses) caps the later stem annotations below. The second-aorist /
  // liquid-future material is deliberately NOT gated — the aorist is the most
  // common form a verb wears in the NT, so early exposure is wanted — but the
  // aorist-passive (Ch. 24) and perfect (Ch. 25) parts, and the
  // third-declension annotations (Ch. 10), wait for their chapters.
  const levels = deriveSelectionLevels(runtime.selectedKeys || []);
  const maxCh = levels.maxEffectiveChapter;
  // The "Stem & declension notes" toggle (advanced settings, default on)
  // switches every annotation below off at once for students who want bare
  // cards.
  const notesOn = runtime.stemNotes !== false;
  // A card carries at most one inline stem: the verbal stem for second-aorist /
  // liquid-future verbs, or the third-declension noun stem (never both).
  const stemInline = notesOn ? (verbStemInlineHtml(card) || nounStemInlineHtml(card, maxCh)) : '';
  // Generated (derived) cards from the "Variant forms as cards" toggles flag the
  // form type under the headword on the question face: "(aorist)" / "(future)"…
  // It names the tense/voice, not the meaning, so it's safe before the flip.
  // Gated by "Show tense on irregular cards": when off, a superscript star (the
  // shared HEADWORD_STAR) stands in, flagging the non-standard form without
  // naming its tense. No-op on normal cards (no derivedShort).
  const formTagFull = card.derivedShort
    ? (FORM_TAG_FULL_LABELS[card.derivedShort] || card.derivedShort)
    : '';
  const irregularTenseOn = runtime.irregularTense !== false;
  const formTagLine = (formTagFull && irregularTenseOn)
    ? `<div class="card-form-tag">(${escapeHtml(formTagFull)})</div>`
    : '';
  const irregularStar = (formTagFull && !irregularTenseOn) ? HEADWORD_STAR : '';
  const greekDisplay = `${prepStar}${irregularStar}${host.formatGreekHeadword(card.g)}${stemInline}`;
  const englishDisplay = `${prepStar}${card.e || '—'}`;
  const requiredLabelHTML = `<span class="card-required-label card-required-label-${card.required ? 'req' : 'opt'}">(${card.required ? 'req.' : 'opt.'})</span>`;
  // Verbs with irregular principal parts get them in one small bracketed line
  // under the Greek headword (2 aor. / fut. / aor. pass. / pf.).
  const verbStemAltHTML = notesOn ? verbStemAltHtml(card, maxCh) : '';
  // On a standalone second-aorist card ("Second aorists as cards" toggle) that
  // line reads "2 aor. of [parent]" — and the parent present IS the answer
  // being drilled, so it must not appear on the question face before the flip.
  // The question (Greek front) face gets nothing; the answer faces keep the
  // full line as the reveal payoff.
  const verbStemAltQuestionHTML = card.derivedFrom ? '' : verbStemAltHTML;
  // Third-declension nouns carry a "declines like σάρξ" pointer in the hint
  // line of the Greek-bearing face, anchoring each noun to its model paradigm.
  const declModelTag = notesOn ? nounDeclensionModelSuffix(card, maxCh) : '';

  // Stem-flip cards (2nd-aorist / liquid-future / aorist-passive /
  // perfect-active / μι-verb supplements): both faces show Greek + English
  // gloss subtitle, with the differing characters highlighted so the stem
  // change between the two forms is visually obvious. Direction toggle is
  // ignored — the card is always present-on-front, target-on-back.
  let frontHTML, backHTML;
  if (card.stemFlip) {
    const diff = diffHighlightPair(card.g, card.aorist);
    // The "other form" face is the aorist for second-aorist flips and the
    // future for liquid-future flips; key off the back-face label override.
    const revealWord = /future/i.test(card.stemFlipAorist || '') ? 'future' : 'aorist';
    const flipHint = `<div class="flip-hint">click to reveal ${revealWord} →</div>`;
    const keyBadge = card.keyVerb
      ? '<div class="card-key-verb">★ key verb</div>'
      : '';
    const noteHtml = card.stemNote
      ? `<div class="card-stem-note">${escapeHtml(card.stemNote)}</div>`
      : '';
    // The verbal stem is printed after a comma on BOTH faces (same stem each
    // side), anchoring the present↔aorist/future pair to the stem that links
    // them. Appended outside the diff HTML so it doesn't perturb the
    // char-by-char form highlighting.
    const stemSuffix = card.stem
      ? `<span class="card-stem-inline">, ${escapeHtml(card.stem)}</span>`
      : '';
    frontHTML = `
        <div class="card-face card-front card-stem-flip">
          ${requiredLabelHTML}
          ${keyBadge}
          <span class="card-label">Present</span>
          <div class="card-greek card-stem-flip-form">${diff.aHtml}${stemSuffix}</div>
          <div class="card-stem-flip-gloss">${escapeHtml(card.e || '')}</div>
          <div class="card-hint">${sourceLabelDisplay}</div>
          ${flipHint}
        </div>`;
    backHTML = `
        <div class="card-face card-back card-stem-flip">
          ${requiredLabelHTML}
          ${keyBadge}
          <span class="card-label">${escapeHtml(card.stemFlipAorist || 'Aorist (1st sg.)')}</span>
          <div class="card-greek card-stem-flip-form">${diff.bHtml}${stemSuffix}</div>
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
          ${formTagLine}
          ${verbStemAltQuestionHTML}
          <div class="card-hint">${sourceLabelDisplay}${declModelTag}</div>
          <div class="flip-hint">click to reveal →</div>
        </div>`;
    backHTML = `
        <div class="card-face card-back">
          ${requiredLabelHTML}
          <span class="card-label">English</span>
          <div class="card-english">${englishDisplay}</div>
          <div class="card-greek-small">${host.formatGreekHeadword(card.g)}</div>
          ${verbStemAltHTML}
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
          ${verbStemAltHTML}
          <div class="card-hint">${host.transliterateGreek(host.formatGreekHeadword(card.g))}${advancedCountSuffix}${declModelTag}</div>
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
  const multiGenderLemmas = buildMultiGenderLemmas(accessibleCards);
  const levels = deriveSelectionLevels(runtime.selectedKeys || []);
  const steps = buildMorphSteps(card, accessiblePools, {
    includeAspect: runtime.aspectStep !== false,
    maxChapter: levels.maxEffectiveChapter,
    dimToggles: runtime.dimToggles,
    dimValueFilters: runtime.dimValueFilters,
    multiGenderLemmas,
    thirdDeclensionNouns: THIRD_DECLENSION_NOUN_LEMMAS
  });
  // Values the focused paradigm actually carries per dimension, from its full
  // (unfiltered) pool. Lets answerMorphologyStep cut the walk off when a pick
  // names a value the paradigm structurally lacks — e.g. "third person" for
  // ἐγώ/σύ, which has only 1st/2nd-person forms. Falls back to the current
  // card's own dims so a present-only-truth still includes the right answer
  // when the full pool is unavailable.
  const paradigmCards = host.getFocusedParadigmAllCards(card);
  const paradigmPresentValues = computeParadigmPresentValues(
    Array.isArray(paradigmCards) && paradigmCards.length ? paradigmCards : [card]
  );
  runtime.morphStepState = {
    cardId: card.id,
    steps,
    stepIdx: 0,
    answers: new Array(steps.length).fill(null),
    completed: steps.length === 0,
    // Per-dimension value sets for the focused paradigm (gap detection).
    paradigmPresentValues,
    // Kept on state so answerMorphologyStep can build ungraded follow-up
    // steps with the same chapter-gated MC choices the original steps
    // were drawn from (avoids re-computing on every answer).
    accessiblePools,
    // Dims that were skipped (chapter-gated or user-toggled off) along
    // with their canonical correct values, so the form lookup can fill
    // them in silently. Survives across renders via the cached state.
    autoFilledDims: steps.autoFilledDims || {},
    // Dims skipped as steps but still rendered in the parse summary
    // (single-gender gender skip: form doesn't change with gender, but
    // the canonical label still names it). Empty when nothing applies.
    impliedDims: steps.impliedDims || {},
    // Max selected chapter, so the summary can word the imperative-person
    // note correctly once 3rd-person imperatives are in scope.
    maxChapter: levels.maxEffectiveChapter,
    // Undo support (walking view only): a stack of pre-action snapshots
    // (pushed by the answer/skip/give-up handlers) and a per-dim undo count.
    // Both reset per card.
    history: [],
    forcedWrong: {}
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

// Normalizes a Greek headword to a stable lookup key so the chapter-vocab data
// and the flip-set data match even when they were typed with different Unicode
// conventions. Mounce's words.js uses oxia accents (U+1F71 …) and plain-η
// spellings (ἀποθνήσκω), while the flip files use the modern monotonic tonos
// (U+03AC …) and iota-subscript spellings (ἀποθνῄσκω). Without folding these
// the exact-string lookup below silently misses most verbs (e.g. every Ch 22
// second aorist). We NFC-normalize — which unifies oxia/tonos — and drop the
// combining iota-subscript (U+0345) so ἀποθνῄσκω and ἀποθνήσκω collapse to one
// key. Used for matching only; the displayed forms keep their original glyphs.
function stemAltLookupKey(g) {
  return String(g || '').normalize('NFD').replace(/ͅ/g, '').normalize('NFC');
}

// Lazily-built lookup of present-stem lemma → its second-aorist (1st sg.)
// form, derived from the W3_SECOND_AORIST_FLIP supplemental set so the data
// keeps a single source. The present and 2nd-aorist stems of these verbs
// often look nothing alike (e.g. λέγω → εἶπον, ἔρχομαι → ἦλθον), so the
// standard chapter-vocab card surfaces the aorist as a small second row to
// help associate the pair. Keyed by stemAltLookupKey so the lookup survives
// the oxia/tonos + iota-subscript spelling gap between data files.
let secondAoristByLemma = null;
function getSecondAoristByLemma() {
  if (secondAoristByLemma) return secondAoristByLemma;
  const map = {};
  const flip = window.SUPPLEMENTAL_VOCAB_SETS && window.SUPPLEMENTAL_VOCAB_SETS.W3_SECOND_AORIST_FLIP;
  if (flip && Array.isArray(flip.cards)) {
    for (const c of flip.cards) {
      if (c && c.stemFlip && c.g && c.aorist) map[stemAltLookupKey(c.g)] = c.aorist;
    }
  }
  // Only cache once populated, in case this runs before the data file loads.
  if (Object.keys(map).length) secondAoristByLemma = map;
  return map;
}

// Same idea for liquid futures (derived from W3_LIQUID_FUTURE_FLIP): present
// lemma → liquid-future (1st sg.) form. A verb can be both a second aorist and
// a liquid future (e.g. βάλλω → ἔβαλον / βαλῶ, ἀποθνῄσκω → ἀπέθανον /
// ἀποθανοῦμαι), so its chapter card can carry three rows.
let liquidFutureByLemma = null;
function getLiquidFutureByLemma() {
  if (liquidFutureByLemma) return liquidFutureByLemma;
  const map = {};
  const flip = window.SUPPLEMENTAL_VOCAB_SETS && window.SUPPLEMENTAL_VOCAB_SETS.W3_LIQUID_FUTURE_FLIP;
  if (flip && Array.isArray(flip.cards)) {
    for (const c of flip.cards) {
      if (c && c.stemFlip && c.g && c.aorist) map[stemAltLookupKey(c.g)] = c.aorist;
    }
  }
  if (Object.keys(map).length) liquidFutureByLemma = map;
  return map;
}

// Lazily-built lookup of present-stem lemma → its bare verbal stem (e.g.
// ἀποθνῄσκω → ἀποθαν-), merged from both flip sets. A verb that is both a
// second aorist and a liquid future carries the same stem in each set
// (ἀποθαν- in both), so the merge is order-independent. Keyed through
// stemAltLookupKey like the other flip lookups so oxia/tonos and
// iota-subscript spellings still match. Used to print the stem inline after
// the headword on standard chapter-vocab cards.
let verbStemByLemma = null;
function getVerbStemByLemma() {
  if (verbStemByLemma) return verbStemByLemma;
  const map = {};
  const sets = window.SUPPLEMENTAL_VOCAB_SETS;
  for (const key of ['W3_SECOND_AORIST_FLIP', 'W3_LIQUID_FUTURE_FLIP']) {
    const flip = sets && sets[key];
    if (flip && Array.isArray(flip.cards)) {
      for (const c of flip.cards) {
        if (c && c.stemFlip && c.g && c.stem) map[stemAltLookupKey(c.g)] = c.stem;
      }
    }
  }
  if (Object.keys(map).length) verbStemByLemma = map;
  return map;
}

// Same idea for the Part-3 passive set: present lemma → aorist passive
// (1st sg.), from W3_AORIST_PASSIVE_FLIP. Guard: a real aorist passive
// (1st sg.) always ends in -ην — both θη-stems (ἐλύθην) and the 2nd
// (η-stem) passives (ἐγράφην) — so a reference-only entry whose "aorist"
// field held some other form (duff's data carries a 2nd-aorist ACTIVE,
// ἔρχομαι → ἦλθον) would be skipped rather than mislabelled "aor. pass."
// on the vocab card. Every current Mounce entry passes.
let aoristPassiveByLemma = null;
function getAoristPassiveByLemma() {
  if (aoristPassiveByLemma) return aoristPassiveByLemma;
  const map = {};
  const flip = window.SUPPLEMENTAL_VOCAB_SETS && window.SUPPLEMENTAL_VOCAB_SETS.W3_AORIST_PASSIVE_FLIP;
  if (flip && Array.isArray(flip.cards)) {
    for (const c of flip.cards) {
      if (!c || !c.stemFlip || !c.g || !c.aorist) continue;
      const bare = String(c.aorist).normalize('NFD').replace(/\p{M}/gu, '');
      if (bare.endsWith('ην')) map[stemAltLookupKey(c.g)] = c.aorist;
    }
  }
  if (Object.keys(map).length) aoristPassiveByLemma = map;
  return map;
}

// Perfect actives (W3_PERFECT_ACTIVE_FLIP) skip the self-identical entry
// (οἶδα is listed as its own perfect — a perfect that functions as a
// present) — a "pf. [οἶδα]" row under the οἶδα headword says nothing.
let perfectActiveByLemma = null;
function getPerfectActiveByLemma() {
  if (perfectActiveByLemma) return perfectActiveByLemma;
  const map = {};
  const flip = window.SUPPLEMENTAL_VOCAB_SETS && window.SUPPLEMENTAL_VOCAB_SETS.W3_PERFECT_ACTIVE_FLIP;
  if (flip && Array.isArray(flip.cards)) {
    for (const c of flip.cards) {
      if (c && c.stemFlip && c.g && c.aorist && c.aorist !== c.g) map[stemAltLookupKey(c.g)] = c.aorist;
    }
  }
  if (Object.keys(map).length) perfectActiveByLemma = map;
  return map;
}

// Inline verbal-stem suffix (", ἀποθαν-") for a standard chapter-vocab verb,
// printed in smaller muted letters right after the headword — the same lexical
// treatment the stem-flip cards use, so the present is read together with the
// stem its 2nd-aorist / liquid-future forms are built on. Returns '' for
// supplemental/advanced/flip cards and lemmas without a recorded stem.
function verbStemInlineHtml(card) {
  if (!card || card.advanced || card.supplemental || card.stemFlip) return '';
  // Standalone derived cards ("Variant forms as cards") carry their stem
  // directly (the lookup is keyed by present-stem lemma, which their headword
  // isn't).
  const stem = card.derivedFrom ? (card.derivedStem || '') : getVerbStemByLemma()[stemAltLookupKey(card.g)];
  return stem ? `<span class="card-stem-inline">, ${escapeHtml(stem)}</span>` : '';
}

// One small bracketed line of irregular principal parts under a standard
// chapter-vocab verb's headword, so the present is learned together with the
// forms that look nothing like it: "2 aor. [ἔλαβον] · aor. pass. [ἐλήμφθην] ·
// pf. [εἴληφα]". The second-aorist / liquid-future parts always show (early
// exposure to the NT's most common verb forms is wanted); the aorist-passive
// and perfect parts wait for the chapter that teaches them (Mounce Ch. 24 /
// Ch. 25), so they never leak into an earlier deck. A null maxChapter (no
// chapter-graded selection) shows everything, matching the ungated legacy
// behavior. Returns '' for supplemental/advanced/flip cards and for lemmas
// with no recorded parts.
function verbStemAltHtml(card, maxChapter) {
  if (!card || card.advanced || card.supplemental || card.stemFlip) return '';
  // A standalone derived card (the "Variant forms as cards" toggles) points
  // back at its present-stem parent instead of listing parts, with the form
  // type from its config ("2 aor. of", "pf. of", "aor. pass. of", …).
  if (card.derivedFrom) {
    return `<div class="card-stem-alts"><span class="card-stem-alts-label">${escapeHtml(card.derivedLabel || 'of')}</span> [${escapeHtml(card.derivedFrom)}]</div>`;
  }
  const unlocked = (ch) => maxChapter == null || maxChapter >= ch;
  const parts = [];
  const push = (label, form) =>
    parts.push(`<span class="card-stem-alts-label">${label}</span> [${escapeHtml(form)}]`);
  const key = stemAltLookupKey(card.g);
  const aorist = getSecondAoristByLemma()[key];
  if (aorist) push('2 aor.', aorist);
  const future = getLiquidFutureByLemma()[key];
  if (future) push('fut.', future);
  const aoristPassive = getAoristPassiveByLemma()[key];
  if (aoristPassive && unlocked(24)) push('aor. pass.', aoristPassive);
  const perfect = getPerfectActiveByLemma()[key];
  if (perfect && unlocked(25)) push('pf.', perfect);
  return parts.length ? `<div class="card-stem-alts">${parts.join(' · ')}</div>` : '';
}

// The third declension enters at Mounce Ch. 10; its annotations (inline
// stem, "declines like" pointer) stay hidden below that. Unlike duff, the
// gate is not just belt-and-braces here: πνεῦμα and Σίμων are Ch. 4 vocab,
// so a pre-Ch.-10 deck would otherwise carry declension notes the student
// can't read yet. Null (no chapter-graded selection) shows them.
const THIRD_DECLENSION_CHAPTER = 10;

// Bare third-declension noun stem (e.g. σαρκ-) — Mounce's Ch. 10 rule: the
// stem is the genitive singular minus -ος. Derived from a headword that
// prints its genitive ("σάρξ, σαρκός, ἡ"), with one wrinkle duff's words.js
// doesn't have: Mounce's data often abbreviates the genitive to a hyphen
// tail ("ἐλπίς, -ίδος", "σῶμα, -ματος", "νύξ, -νυκτός"), so the full
// genitive is first reconstructed by splicing the tail onto the nominative.
// Contract types whose bare stem never surfaces uncontracted — the -εως
// ι/ευ-stems, the -ους neuters — and the 1st/2nd-declension tails all fail
// the final -ος test and yield ''. Pitch accents (acute/grave/circumflex)
// are stripped so the stem prints unaccented like the verbal stems;
// breathing marks are kept (ὕδατος → ὑδατ-, αἷμα → αἱματ-).
const NOMINAL_ARTICLES = new Set(['ὁ', 'ἡ', 'τό'].map((a) => stemAltLookupKey(a)));
function thirdDeclensionStemFromHeadword(greek) {
  // Mirrors pos_logic's primary "<nom>, <gen>, <article>" nominal pattern —
  // the only shape third-declension genitives are written in. The article is
  // compared through the stemAltLookupKey fold rather than a regex literal:
  // words.js types τό with the oxia accent, and an editor that saves this
  // file with the tonos form would otherwise silently drop every neuter.
  const m = String(greek || '').match(/^(.*?),\s*([^,]+),\s*(\S+)$/u);
  if (!m || !NOMINAL_ARTICLES.has(stemAltLookupKey(m[3]))) return '';
  const stripAccents = (s) =>
    String(s).normalize('NFD').replace(/[\u0300\u0301\u0342]/g, '').normalize('NFC');
  const gen = stripAccents(m[2].trim());
  let full = gen;
  if (gen.startsWith('-')) {
    const tail = gen.slice(1);
    const nomMatch = stripAccents(m[1]).match(/[Ͱ-Ͽἀ-῿]+/u);
    let nom = nomMatch ? nomMatch[0] : '';
    if (!nom) return '';
    // The tail overlaps the nominative's ending: drop a final ς/ξ/ψ (the
    // tail re-supplies the consonant it stands for), then splice at the
    // longest nominative suffix that prefixes the tail (σῶμα + -ματος →
    // σώματος; νύξ → νυ + νυκτός → νυκτός; πῦρ + -ός → πυρός).
    if (/[ςξψ]$/u.test(nom)) nom = nom.slice(0, -1);
    let k = 0;
    for (let i = Math.min(nom.length, tail.length); i > 0; i--) {
      if (tail.startsWith(nom.slice(nom.length - i))) { k = i; break; }
    }
    full = nom.slice(0, nom.length - k) + tail;
  }
  return full.endsWith('ος') ? `${full.slice(0, -2)}-` : '';
}

// Inline noun-stem suffix (", νυκτ-") for a standard chapter-vocab
// third-declension noun — the same smaller muted treatment the verb cards
// give their verbal stem, so νύξ is read together with the νυκτ- its other
// cases are built on. Returns '' for supplemental/advanced/flip cards and
// for headwords whose genitive doesn't (re)construct to one in -ος.
function nounStemInlineHtml(card, maxChapter) {
  if (!card || card.advanced || card.supplemental || card.stemFlip) return '';
  if (maxChapter != null && maxChapter < THIRD_DECLENSION_CHAPTER) return '';
  const stem = thirdDeclensionStemFromHeadword(card.g);
  return stem ? `<span class="card-stem-inline">, ${escapeHtml(stem)}</span>` : '';
}

// Third-declension model-noun anchors, keyed by the headword's first token.
// Mounce teaches the declension through model paradigms the app drills in
// morph mode (Ch. 10: σάρξ for the masc/fem consonant stems, πνεῦμα for the
// neuter dental stems); tagging each vocab noun "declines like σάρξ" turns
// the scary nouns into a handful of patterns. Where the app drills no model
// the anchor is the first vocab noun of the class the course meets: πίστις
// (Ch. 11) for the -εως ι-stems, βασιλεύς (Ch. 19) for the ευ-stems, ὄρος
// (Ch. 24) for the -ους neuters, πλείων (Ch. 17) for the comparative
// ν-stems. Curated, and deliberately conservative: nouns whose endings
// genuinely track the model are tagged; the syncopated kinship nouns
// (πατήρ, μήτηρ, ἀνήρ), irregular-accusative χάρις (acc. χάριν), neuter
// ρ-stem πῦρ, and the proper name Μωϋσῆς are left untagged rather than
// overclaim. The model nouns themselves carry no tag.
const DECLENSION_MODEL_BY_HEAD_RAW = {
  // masc/fem consonant stems (Ch. 10 pattern, incl. the regular ρ-stems)
  'γυνή': 'σάρξ', 'ἐλπίς': 'σάρξ', 'νύξ': 'σάρξ', 'πούς': 'σάρξ',
  'αἰών': 'σάρξ', 'Σίμων': 'σάρξ', 'χείρ': 'σάρξ', 'σωτήρ': 'σάρξ',
  // neuter dental stems
  'ὄνομα': 'πνεῦμα', 'σῶμα': 'πνεῦμα', 'θέλημα': 'πνεῦμα', 'φῶς': 'πνεῦμα',
  'ὕδωρ': 'πνεῦμα', 'ῥῆμα': 'πνεῦμα', 'στόμα': 'πνεῦμα', 'αἷμα': 'πνεῦμα',
  // ι-stems (gen. -εως)
  'πόλις': 'πίστις', 'δύναμις': 'πίστις', 'θλῖψις': 'πίστις',
  'ἀνάστασις': 'πίστις',
  // ευ-stems (gen. -έως)
  'ἀρχιερεύς': 'βασιλεύς', 'γραμματεύς': 'βασιλεύς',
  // -ους neuters
  'ἔθνος': 'ὄρος',
  // 3rd-decl. comparative adjectives (ν-stems)
  'μείζων': 'πλείων'
};

// Folded through stemAltLookupKey on both sides so the map keys match
// words.js regardless of oxia/tonos typing differences between the files.
let declensionModelByHead = null;
function getDeclensionModelByHead() {
  if (declensionModelByHead) return declensionModelByHead;
  declensionModelByHead = {};
  for (const [head, model] of Object.entries(DECLENSION_MODEL_BY_HEAD_RAW)) {
    declensionModelByHead[stemAltLookupKey(head)] = model;
  }
  return declensionModelByHead;
}

// " · declines like σάρξ" suffix for the hint line of the Greek-bearing card
// face. Plain text in the hint's own muted style — no extra row, so the card
// stays clean. Same guards and Ch. 10 gate as the noun stem.
function nounDeclensionModelSuffix(card, maxChapter) {
  if (!card || card.advanced || card.supplemental || card.stemFlip) return '';
  if (maxChapter != null && maxChapter < THIRD_DECLENSION_CHAPTER) return '';
  const head = String(card.g || '').split(',')[0].trim();
  const model = getDeclensionModelByHead()[stemAltLookupKey(head)];
  return model ? ` · declines like ${escapeHtml(model)}` : '';
}

// True iff the gloss text matches exactly one of the displayed multiple-choice
// options. When a hint resolves to a single option, showing it before the
// student answers is essentially giving them the answer — used on grammar
// cards (translate prompts) to gate the gloss until the choice is locked in.
function glossPointsAtSingleChoice(gloss, choices) {
  if (!gloss || !Array.isArray(choices) || choices.length < 2) return false;
  const strip = (s) => String(s).toLowerCase().replace(/[''""''""]/g, '').replace(/\s+/g, ' ').trim();
  const g = strip(gloss);
  if (g.length < 2) return false;
  let hits = 0;
  for (const c of choices) {
    if (strip(c).includes(g)) hits++;
    if (hits > 1) return false;
  }
  return hits === 1;
}

// True iff some token of the lemma string actually shows up (modulo
// accents/diacritics) as a stem in the form. Used to suppress on-card lemma
// hints when the family-level label ("attributive vs predicate") describes a
// concept rather than a word that appears in the prompt — otherwise we'd be
// showing the student "attributive vs predicate" next to a form like
// ὁ ἀγαθὸς ἄνθρωπος and gold-stamping the wrong relationship.
function familyLemmaAppearsInForm(lemma, form) {
  if (!lemma || !form) return true;
  const greek = /[Ͱ-Ͽἀ-῿]+/g;
  const lemmaTokens = String(lemma).match(greek) || [];
  const formTokens = String(form).match(greek) || [];
  if (!lemmaTokens.length || !formTokens.length) return true;
  const strip = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const formStems = formTokens.map(strip);
  return lemmaTokens.some((lt) => {
    const ls = strip(lt);
    if (ls.length < 2) return false;
    const stemLen = Math.max(3, ls.length - 2);
    const stem = ls.slice(0, Math.min(ls.length, stemLen));
    return formStems.some((fs) => fs.includes(stem) || stem.includes(fs));
  });
}

// Split a Greek string into "letter units" — a base character plus any
// combining diacritics that follow it. `full` keeps every mark for display
// (re-composed to NFC so it renders normally); `key` is what the diff compares
// against: the base letter plus its *meaningful* marks (breathing, diaeresis,
// iota subscript), with only the pitch accents (acute/grave/circumflex)
// stripped. Breathing is a real consonantal distinction (rough vs smooth —
// εὑρ- vs εὐ-) so it stays significant; pitch accents shift for reasons
// unrelated to the stem being taught (accent recession, contraction,
// enclitics), so they must not drive the highlight.
const STEM_DIFF_ACCENT_MARKS = /[̀́͂]/; // grave, acute, perispomeni (Greek circumflex)
function toLetterUnits(s) {
  const units = [];
  for (const ch of String(s || '').normalize('NFD')) {
    if (/[̀-ͯ]/.test(ch) && units.length) {
      // Combining mark — attach to the preceding base letter for display, and
      // to its comparison key unless it's a pitch accent.
      const u = units[units.length - 1];
      u.full += ch;
      if (!STEM_DIFF_ACCENT_MARKS.test(ch)) u.key += ch;
    } else {
      units.push({ key: ch, full: ch });
    }
  }
  // Display form keeps all marks but renders as a normal precomposed glyph.
  units.forEach((u) => { u.full = u.full.normalize('NFC'); });
  return units;
}

// LCS-based diff between two Greek forms (e.g. a present and its aorist or
// liquid future). Returns {aHtml, bHtml} where matching letters render plain
// and differing letters get wrapped in <span class="stem-diff">. Used by the
// stem-flip card renderer so the stem change is visually obvious.
//
// By default the diff compares letters with pitch accents stripped (see
// toLetterUnits), so an accent-only difference doesn't light up — the identical
// stem is the point — while genuine letter changes (λαμβάνω → ἔλαβον)
// still stand out. Accents are still shown on the letters; they just don't
// drive the highlight.
//
// The one exception: when the two forms are identical once pitch accents are
// stripped, the accent is the *only* thing telling them apart (e.g. the liquid
// present κρίνω vs. future κρινῶ, or μένω vs. μενῶ — same letters, the
// circumflex is the whole signal). There's no stem change to highlight, so we
// fall back to comparing the fully accented glyphs, letting the differentiating
// accent light up rather than the card showing no highlight at all.
function diffHighlightPair(a, b) {
  const A = toLetterUnits(a);
  const B = toLetterUnits(b);
  if (!A.length || !B.length) return { aHtml: escapeHtml(a || ''), bHtml: escapeHtml(b || '') };
  // If the bare (accent-stripped) letters match end to end, the accent is the
  // sole differentiator, so compare the full accented glyph; otherwise compare
  // the accent-stripped key so only real letter changes drive the highlight.
  const sameBareLetters = A.length === B.length && A.every((u, idx) => u.key === B[idx].key);
  const keyOf = sameBareLetters ? (u) => u.full : (u) => u.key;
  // Standard LCS DP table over the chosen comparison key.
  const m = A.length, n = B.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      dp[i + 1][j + 1] = keyOf(A[i]) === keyOf(B[j]) ? dp[i][j] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  // Walk back to mark which positions in A and B are part of the common
  // subsequence; anything else gets the diff highlight.
  const inLCS_A = new Array(m).fill(false);
  const inLCS_B = new Array(n).fill(false);
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (keyOf(A[i - 1]) === keyOf(B[j - 1])) {
      inLCS_A[i - 1] = true;
      inLCS_B[j - 1] = true;
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  const wrap = (units, mask) => units.map((u, idx) =>
    mask[idx] ? escapeHtml(u.full) : `<span class="stem-diff">${escapeHtml(u.full)}</span>`
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
    // A dimension undone but re-picked correctly counts as a miss yet isn't a
    // flat wrong answer — amber. A reattempt that's still wrong stays red.
    else if (answer && state.forcedWrong && state.forcedWrong[step.key] && answer.isCorrect === true) cls += ' reattempted';
    else if (answer && answer.isCorrect === true) cls += ' correct';
    else if (answer && answer.isCorrect === false) cls += ' incorrect';
    return `<span class="${cls}" title="${escapeHtml(step.label)}">${escapeHtml(step.label[0])}</span>`;
  }).join('');
  return `<div class="morph-step-breadcrumb">${dots}</div>`;
}

// Undo row — only shown once there's at least one guess to step back through.
// Undo re-opens the previous step so the student can pick a different value
// and keep practising; the dimension undone still counts as a miss.
function renderMorphUndoRow(state) {
  if (!state || !Array.isArray(state.history) || !state.history.length) return '';
  return `
    <div class="morph-step-undo-row">
      <button class="ctrl-btn morph-step-undo-btn" type="button" onclick="undoMorphologyStep()"
        title="Step back to your previous guess and re-pick. The guess you undo still counts as a miss — undo is for practising the right path, not erasing a mistake.">↶ Undo guess</button>
    </div>`;
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
        <button class="ctrl-btn morph-giveup-btn" type="button" onclick="giveUpMorphologyStep()">I give up</button>
      </div>
      ${renderMorphUndoRow(state)}
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
// `impliedDims` carries dimensions that weren't asked as a step but still
// belong to the canonical parse — currently single-gender gender (λόγος
// is always masculine, the step is skipped, but the label still reads
// "...singular masculine"). Injected after the 'number' position so the
// nominal order case → number → gender is preserved.
function assembleParseLine(steps, values, impliedDims) {
  const parts = [];
  let moodImperativePos = -1;
  let hasPersonStep = false;
  let postNumberPos = -1;
  steps.forEach((step, idx) => {
    if (step.key === 'person') hasPersonStep = true;
    const v = values[idx];
    if (!v) return;
    parts.push(step.key === 'person' ? `${v} person` : v);
    if (step.key === 'mood' && String(v).toLowerCase() === 'imperative') {
      moodImperativePos = parts.length;
    }
    if (step.key === 'number') postNumberPos = parts.length;
  });
  if (moodImperativePos >= 0 && !hasPersonStep) {
    parts.splice(moodImperativePos, 0, 'second person');
    if (postNumberPos >= moodImperativePos) postNumberPos += 1;
  }
  if (impliedDims && impliedDims.gender) {
    const insertAt = postNumberPos >= 0 ? postNumberPos : parts.length;
    parts.splice(insertAt, 0, impliedDims.gender);
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
    // Syncretic forms (e.g. λύω's ἔλυον = imperfect active 1sg AND 3pl)
    // appear in the supplemental paradigms as TWO cards with different
    // parses but the same Greek. Both readings must reach the lookup so a
    // student picking the second reading isn't told "no morph exists" —
    // collect every distinct answer per form into an array, deduping on
    // the canonical text so a card and its richer-label twin don't both
    // surface.
    const augmented = augmentAnswerWithLabel(ans, c.sourceLabel || '');
    if (!out[c.form]) out[c.form] = [];
    if (!out[c.form].includes(augmented)) out[c.form].push(augmented);
  }
  return out;
}

// Card's own paradigm pool augmented with voice/mood implied by the
// card's sourceLabel — same reason as buildLemmaFormToAnswerFromCards
// above. Without this the orphan-skip rule lets every untagged answer
// in the card's pool spuriously match whichever mood/voice the student
// picked. Same array-valued shape as buildLemmaFormToAnswerFromCards;
// most paradigm subsets don't have syncretic forms, but the matchPool
// consumer treats single answers and arrays uniformly.
function buildAugmentedCardPool(card) {
  if (!card || !card.formToAnswer || typeof card.formToAnswer !== 'object') return {};
  const out = {};
  for (const [form, answer] of Object.entries(card.formToAnswer)) {
    if (!form || !answer) continue;
    out[form] = [augmentAnswerWithLabel(answer, card.sourceLabel || '')];
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
function resolveFormForPickedDims(card, steps, pickedValues, autoFilledDims) {
  if (!card) return { kind: 'none' };
  const pickedDims = {};
  steps.forEach((step, idx) => {
    const v = pickedValues[idx];
    if (v && !FORM_LOOKUP_SKIP_DIMS.has(step.key)) pickedDims[step.key] = v;
  });
  // Dims whose step was silently skipped (chapter-gated voice on active
  // cards, or user-toggled-off dims) get auto-filled with the canonical
  // correct value so the form lookup behaves as if the student had
  // picked correctly. Without this, an off-toggle would orphan-skip
  // every wrong-form candidate through the matchPool's missing-dim
  // pass and the lookup would surface noise.
  //
  // Voice exception for suppletive verbs (εἰμί, ἔρχομαι): when the student
  // picked a tense that differs from the card's canonical tense, the
  // auto-filled voice belongs to the canonical tense's stem and won't apply
  // to the picked tense (εἰμί is active in the present/imperfect but middle
  // in the future). Skip the voice fill so the lookup can still resolve a
  // form in the picked tense rather than collapsing to "no morph exists".
  if (autoFilledDims && typeof autoFilledDims === 'object') {
    const cardDims = parseAnswerDimensions(card.parsedAnswer || card.answer || '');
    const normalizeTense = (t) => String(t || '').replace(/^(first|second)\s+/, '');
    Object.keys(autoFilledDims).forEach((k) => {
      if (FORM_LOOKUP_SKIP_DIMS.has(k)) return;
      if (pickedDims[k] || !autoFilledDims[k]) return;
      if (k === 'voice' && pickedDims.tense && cardDims.tense
          && normalizeTense(pickedDims.tense) !== normalizeTense(cardDims.tense)) {
        return;
      }
      pickedDims[k] = autoFilledDims[k];
    });
  }
  // Deponent / middle leniency, mirrored from grading. The voice step
  // accepts 'active' for a form whose voice is middle or middle/passive
  // (deponents are middle in form but active in meaning — see
  // morph_steps.js step.acceptable). There is no active-voice form to
  // find for such a lemma, so a student who picks 'active' must resolve
  // against the form's actual middle voice — otherwise the lookup rejects
  // the (only) middle form on the voice key and the parse dashes to "—"
  // even when 'active' was graded correct and the sole error was elsewhere
  // (e.g. ῥυόμεναι parsed as masculine instead of feminine should still
  // reconstruct the masculine ῥυόμενοι, not blank out).
  if (pickedDims.voice === 'active') {
    const cardVoice = parseAnswerDimensions(card.parsedAnswer || card.answer || '').voice;
    if (cardVoice === 'middle' || cardVoice === 'middle/passive') {
      pickedDims.voice = cardVoice;
    }
  }
  // Present / imperfect / perfect / pluperfect middle and passive are one and
  // the same form (λύομαι is equally "I loose for myself" and "I am loosed"),
  // and the parse drill accepts either reading on the Voice step. Mirror that
  // here so a (correctly) picked 'middle' still reconstructs the form even when
  // the card's stored canonical labelled it one-sidedly — e.g. a passive-
  // indicative set tags λύεται 'passive', so without this a student who picks
  // present middle indicative 3rd plural sees a blank form ("—") instead of
  // λύονται, because dimsCompatible('middle','passive') is false. Widening the
  // picked voice to the syncretic 'middle/passive' matches a candidate stored
  // as either 'middle' or 'passive'.
  if (isSyncreticMiddlePassiveVoice(pickedDims, card.lemma)) {
    pickedDims.voice = 'middle/passive';
  }
  // First/second aorist is a stem-formation distinction, not a separate
  // tense — the Tense step collapses both to plain 'aorist' (buildMorphSteps),
  // so the student always picks 'aorist'. Candidate answers, however, are
  // parsed straight from the data and may carry the qualifier ("first aorist
  // middle subjunctive" for ῥύσῃ, "second aorist" for γένωμαι …). Collapse
  // the picked tense to match, so the lookup doesn't reject the (only) form
  // for a correctly-picked aorist parse on the qualifier alone — the bug that
  // dashed a wrong-mood pick on ῥῦσαι to "—" instead of surfacing ῥύσῃ.
  if (pickedDims.tense) pickedDims.tense = pickedDims.tense.replace(/^(first|second)\s+/, '');
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
    for (const [form, answers] of Object.entries(pool || {})) {
      if (!form || !answers) continue;
      // Pool values are arrays of answer strings (one per distinct parse
      // of a syncretic form, e.g. ἔλυον = imperfect active 1sg AND 3pl).
      // The lemma_inventory.extraForms fallback still hands us plain
      // strings, so handle both shapes.
      const answerList = Array.isArray(answers) ? answers : [answers];
      for (const answer of answerList) {
        if (!answer) continue;
        const ansDims = parseAnswerDimensions(answer);
        // Mirror the picked-side collapse above: a candidate stored as
        // "first/second aorist" must compare equal to a plain 'aorist' pick.
        if (ansDims.tense) ansDims.tense = ansDims.tense.replace(/^(first|second)\s+/, '');
        const ok = keys.every((k) => !ansDims[k] || dimsCompatible(pickedDims[k], ansDims[k]));
        if (!ok) continue;
        if (!structurallyCompatibleMood(pickedDims.mood, ansDims)) continue;
        out.push({ form, ansDims });
      }
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

// ── Per-form gloss generation ─────────────────────────────────────────────
// English realisers for the verbs Mounce drills as parsing paradigms, keyed by
// dictionary head lemma. Voice is collapsed for glossing (deponents read
// active; middle/passive and passive read passive); the aspect distinction
// English can't carry is dropped rather than faked. Extra (non-Mounce-drilled)
// entries are harmless — they're only consulted when a card's head lemma
// matches, otherwise the dictionary gloss (card.gloss) is used.
const VERB_GLOSS = {
  'εἰμί':      { pres: 'be',     pres3: 'is',      past: 'was',      pastPart: 'been',     presPart: 'being' },
  'λύω':       { pres: 'loose',  pres3: 'looses',  past: 'loosed',   pastPart: 'loosed',   presPart: 'loosing' },
  'ἀγαπάω':    { pres: 'love',   pres3: 'loves',   past: 'loved',    pastPart: 'loved',    presPart: 'loving' },
  'ποιέω':     { pres: 'make',   pres3: 'makes',   past: 'made',     pastPart: 'made',     presPart: 'making' },
  'πληρόω':    { pres: 'fill',   pres3: 'fills',   past: 'filled',   pastPart: 'filled',   presPart: 'filling' },
  'φιλέω':     { pres: 'love',   pres3: 'loves',   past: 'loved',    pastPart: 'loved',    presPart: 'loving' },
  'βάλλω':     { pres: 'throw',  pres3: 'throws',  past: 'threw',    pastPart: 'thrown',   presPart: 'throwing' },
  'γράφω':     { pres: 'write',  pres3: 'writes',  past: 'wrote',    pastPart: 'written',  presPart: 'writing' },
  'λαμβάνω':   { pres: 'take',   pres3: 'takes',   past: 'took',     pastPart: 'taken',    presPart: 'taking' },
  'λείπω':     { pres: 'leave',  pres3: 'leaves',  past: 'left',     pastPart: 'left',     presPart: 'leaving' },
  'ἄγω':       { pres: 'lead',   pres3: 'leads',   past: 'led',      pastPart: 'led',      presPart: 'leading' },
  'ἔχω':       { pres: 'have',   pres3: 'has',     past: 'had',      pastPart: 'had',      presPart: 'having' },
  'γινώσκω':   { pres: 'know',   pres3: 'knows',   past: 'knew',     pastPart: 'known',    presPart: 'knowing' },
  'λέγω':      { pres: 'say',    pres3: 'says',    past: 'said',     pastPart: 'said',     presPart: 'saying' },
  'ὁράω':      { pres: 'see',    pres3: 'sees',    past: 'saw',      pastPart: 'seen',     presPart: 'seeing' },
  'μένω':      { pres: 'remain', pres3: 'remains', past: 'remained', pastPart: 'remained', presPart: 'remaining' },
  'κρίνω':     { pres: 'judge',  pres3: 'judges',  past: 'judged',   pastPart: 'judged',   presPart: 'judging' },
  'δίδωμι':    { pres: 'give',   pres3: 'gives',   past: 'gave',     pastPart: 'given',    presPart: 'giving' },
  'τίθημι':    { pres: 'put',    pres3: 'puts',    past: 'put',      pastPart: 'put',      presPart: 'putting' },
  'ἵστημι':    { pres: 'stand',  pres3: 'stands',  past: 'stood',    pastPart: 'stood',    presPart: 'standing' },
  'δείκνυμι':  { pres: 'show',   pres3: 'shows',   past: 'showed',   pastPart: 'shown',    presPart: 'showing' },
  'πορεύομαι': { pres: 'go',     pres3: 'goes',    past: 'went',     pastPart: 'gone',     presPart: 'going',     deponent: true },
  'ῥύομαι':    { pres: 'rescue', pres3: 'rescues', past: 'rescued',  pastPart: 'rescued',  presPart: 'rescuing',  deponent: true },
  'γίνομαι':   { pres: 'become', pres3: 'becomes', past: 'became',   pastPart: 'become',   presPart: 'becoming',  deponent: true },
  'ἔρχομαι':   { pres: 'come',   pres3: 'comes',   past: 'came',     pastPart: 'come',     presPart: 'coming',    deponent: true }
};

function glossSubject(person, number) {
  if (!person || !number) return '';
  const sg = number === 'singular';
  if (person === 'first') return sg ? 'I' : 'we';
  if (person === 'second') return sg ? 'you' : 'you (pl.)';
  if (person === 'third') return sg ? 'he/she/it' : 'they';
  return '';
}
function glossBePresent(person, number) {
  if (number === 'plural') return 'are';
  if (person === 'first') return 'am';
  if (person === 'second') return 'are';
  return 'is';
}
function glossBePast(person, number) {
  return (number === 'singular' && (person === 'first' || person === 'third')) ? 'was' : 'were';
}

// εἰμί is suppletive in English ("be" → am/is/are/was/were/been), so it gets its
// own realiser rather than going through the regular table.
function glossEimi(dims) {
  const { tense, mood, person, number } = dims;
  if (mood === 'infinitive') return 'to be';
  if (mood === 'participle') return 'being';
  const subj = glossSubject(person, number);
  if (!subj) return '';
  if (mood === 'subjunctive') return `${subj} may be`;
  if (mood === 'imperative') {
    return person === 'third' ? `let ${number === 'plural' ? 'them' : 'him/her/it'} be` : 'be!';
  }
  const is3sg = person === 'third' && number === 'singular';
  switch (tense) {
    case 'imperfect': return `${subj} ${glossBePast(person, number)}`;
    case 'future': return `${subj} will be`;
    case 'perfect': return `${subj} ${is3sg ? 'has' : 'have'} been`;
    case 'pluperfect': return `${subj} had been`;
    default: return `${subj} ${glossBePresent(person, number)}`;
  }
}

// Realise an English gloss for a verb form from its parsed dimensions. Voice is
// collapsed for glossing: deponents and bare middles read active, middle/passive
// and passive read passive. The aspect distinction English can't carry (aorist
// vs. present infinitive, say) is dropped rather than faked.
function conjugateVerbGloss(v, dims, lemma) {
  if (lemma === 'εἰμί') return glossEimi(dims);
  const { tense, voice, mood, person, number } = dims;
  const vv = v.deponent ? 'active' : (voice || 'active');
  const passive = vv === 'passive' || vv === 'middle/passive';
  const aorist = tense === 'aorist' || tense === 'first aorist' || tense === 'second aorist';

  if (mood === 'participle') {
    if (passive) return tense === 'present' ? `being ${v.pastPart}` : `having been ${v.pastPart}`;
    if (tense === 'present') return v.presPart;
    if (tense === 'future') return `about to ${v.pres}`;
    return `having ${v.pastPart}`; // aorist / perfect active
  }
  if (mood === 'infinitive') {
    if (passive) return tense === 'perfect' ? `to have been ${v.pastPart}` : `to be ${v.pastPart}`;
    return tense === 'perfect' ? `to have ${v.pastPart}` : `to ${v.pres}`;
  }
  const subj = glossSubject(person, number);
  const is3sg = person === 'third' && number === 'singular';
  if (mood === 'subjunctive') {
    if (!subj) return '';
    return passive ? `${subj} may be ${v.pastPart}` : `${subj} may ${v.pres}`;
  }
  if (mood === 'imperative') {
    if (person === 'third') {
      const who = number === 'plural' ? 'them' : 'him/her/it';
      return passive ? `let ${who} be ${v.pastPart}` : `let ${who} ${v.pres}`;
    }
    return passive ? `be ${v.pastPart}!` : `${v.pres}!`;
  }
  // indicative (and the default when mood is unspecified)
  if (!subj) return '';
  if (passive) {
    if (tense === 'present') return `${subj} ${glossBePresent(person, number)} ${v.pastPart}`;
    if (tense === 'imperfect') return `${subj} ${glossBePast(person, number)} being ${v.pastPart}`;
    if (tense === 'future') return `${subj} will be ${v.pastPart}`;
    if (aorist) return `${subj} ${glossBePast(person, number)} ${v.pastPart}`;
    if (tense === 'perfect') return `${subj} ${is3sg ? 'has' : 'have'} been ${v.pastPart}`;
    if (tense === 'pluperfect') return `${subj} had been ${v.pastPart}`;
    return '';
  }
  if (tense === 'present') return `${subj} ${is3sg ? v.pres3 : v.pres}`;
  if (tense === 'imperfect') return `${subj} ${glossBePast(person, number)} ${v.presPart}`;
  if (tense === 'future') return `${subj} will ${v.pres}`;
  if (aorist) return `${subj} ${v.past}`;
  if (tense === 'perfect') return `${subj} ${is3sg ? 'has' : 'have'} ${v.pastPart}`;
  if (tense === 'pluperfect') return `${subj} had ${v.pastPart}`;
  return '';
}

// The gloss shown for a parsing card. Mounce's card.gloss is the per-LEMMA
// dictionary meaning (shared by every form of an item), not a per-form gloss, so
// — unlike duff — we GENERATE first: a verb whose head lemma is in VERB_GLOSS
// gets a form-specific gloss ("they were loosing"); everything else (nominals,
// undrilled verbs) falls back to the dictionary meaning. The head lemma strips
// any "→ principal-part" suffix and trailing "(root …)" annotation so arrow-keyed
// and μi-verb lemmas still resolve.
function formGloss(card) {
  const dims = parseAnswerDimensions(card.parsedAnswer || card.answer || '');
  const headLemma = String(card.lemma || '').split(/\s*→\s*/)[0].replace(/\s*\(.*\)\s*$/, '').trim();
  if (VERB_GLOSS[headLemma]) {
    const generated = conjugateVerbGloss(VERB_GLOSS[headLemma], dims, headLemma);
    if (generated) return generated;
  }
  return card.gloss || card.lemmaGloss || '';
}

// A short, affirmative "why this form" morphology tell for the summary — the
// headline that names how the form announces its parse ("augment + σα = first
// aorist active indicative"; "the article agrees in case, number, and gender").
// Built conservatively from the parsed dimensions plus the paradigm category:
// where a simple rule would mislead (εἰμί, μι-verb aorists, …) it returns '' so
// the caller can fall back to the stem-change pair rather than print something
// inaccurate. The Greek endings are illustrative, not exhaustive.
function buildWhyThisFormNote(card, dims, category) {
  const cat = String(category || '');
  const tense = dims.tense || '';
  const voice = dims.voice || '';
  const mood = dims.mood || '';
  const isActive = voice === 'active' || voice === '';
  const midPass = voice === 'middle' || voice === 'passive' || voice === 'middle/passive';

  // ── Nominals: the tell is agreement / the ending, never tense ──
  if (cat === 'Article') {
    return 'The article agrees with its noun in case, number, and gender.';
  }
  if (cat === 'Adjectives') {
    return 'An adjective agrees with the noun it modifies in case, number, and gender.';
  }
  if (cat.startsWith('Pronouns')) {
    if (cat.includes('relative')) {
      return 'A relative pronoun takes gender and number from its antecedent, and its case from its job in the relative clause.';
    }
    if (cat.includes('demonstrative')) {
      return 'A demonstrative agrees with its noun in case, number, and gender.';
    }
    if (cat.includes('interrogative')) {
      return 'τίς / τί shows case and number; the masculine and feminine share one set of endings, the neuter another.';
    }
    return 'A personal / intensive pronoun shows case and number; αὐτός also marks gender to agree with its noun.';
  }
  if (cat.startsWith('Nouns') && mood !== 'participle') {
    const decl = cat.includes('1st') ? '1st-declension '
      : cat.includes('2nd') ? '2nd-declension '
      : cat.includes('3rd') ? '3rd-declension '
      : '';
    // Genitive plural: the ‑ων ending is shared by every noun, of every gender
    // (λόγων masc., δώρων neut., πόλεων fem.), so it can never signal gender — a
    // tempting "all genders" answer here is wrong. Call this out explicitly,
    // since the gen. pl. is where students most expect the form itself to carry
    // gender. (The 1st declension circumflexes it to ‑ῶν, but it's the same
    // ending and still gender-blind.)
    if (dims.case === 'genitive' && dims.number === 'plural') {
      return `A ${decl}noun: the genitive plural ending ‑ων is shared by every noun of every gender (λόγων masc., δώρων neut., πόλεων fem.), so it shows case and number only — the gender is fixed by the word, not the ending.`;
    }
    return `A ${decl}noun: the ending carries case and number, while its gender is fixed by the word, not the ending.`;
  }

  // ── Participles: a verbal adjective — the suffix names tense/voice, and it
  //    still agrees in case, number, and gender like any adjective ──
  if (mood === 'participle') {
    const agree = 'declines like an adjective, agreeing in case, number, and gender';
    if (voice === 'passive' && (tense === 'aorist' || tense === 'first aorist')) {
      return `Aorist passive participle (‑θείς / ‑θεῖσα / ‑θέν); ${agree}.`;
    }
    if (voice === 'passive' && tense === 'second aorist') {
      return `Second-aorist passive participle (‑είς / ‑εῖσα / ‑έν); ${agree}.`;
    }
    if (midPass) {
      return `The ‑μενος / ‑μένη / ‑μενον suffix marks a middle/passive participle; it ${agree}.`;
    }
    if (tense === 'present') return `Present active participle (‑ων / ‑ουσα / ‑ον); ${agree}.`;
    if (tense === 'first aorist' || tense === 'aorist') return `First-aorist active participle (‑σας / ‑σασα / ‑σαν); ${agree}.`;
    if (tense === 'second aorist') return `Second-aorist active participle (‑ών / ‑οῦσα / ‑όν on the aorist stem); ${agree}.`;
    if (tense === 'perfect') return `Perfect active participle (‑ώς / ‑υῖα / ‑ός); ${agree}.`;
    if (tense === 'future') return `Future active participle (‑σων / ‑σουσα / ‑σον); ${agree}.`;
    return `Active participle; ${agree}.`;
  }

  // ── εἰμί is irregular: there is no stem rule to teach, so say so plainly ──
  if (cat.includes('εἰμί')) {
    return 'εἰμί is irregular — its forms are learned individually, not built from a stem rule.';
  }

  // ── Infinitives: the ending is the whole tell ──
  if (mood === 'infinitive') {
    if (tense === 'present') return isActive ? 'Present active infinitive — ends in ‑ειν.' : 'Present middle/passive infinitive — ends in ‑εσθαι.';
    if (tense === 'future') return 'Future infinitive — ‑σειν (active) / ‑σεσθαι (middle).';
    if (tense === 'first aorist' || tense === 'aorist') {
      if (voice === 'passive') return 'Aorist passive infinitive — ends in ‑θῆναι.';
      if (midPass) return 'First-aorist middle infinitive — ends in ‑σασθαι.';
      return 'First-aorist active infinitive — ends in ‑σαι.';
    }
    if (tense === 'second aorist') {
      if (voice === 'passive') return 'Second-aorist passive infinitive — ends in ‑ῆναι.';
      if (midPass) return 'Second-aorist middle infinitive — ends in ‑έσθαι.';
      return 'Second-aorist active infinitive — ends in ‑εῖν.';
    }
    if (tense === 'perfect') return isActive ? 'Perfect active infinitive — ends in ‑κέναι.' : 'Perfect middle/passive infinitive — ends in ‑σθαι.';
    return '';
  }

  // ── Subjunctive / imperative: the mood is marked the same across tenses ──
  if (mood === 'subjunctive') {
    return 'The lengthened connecting vowel (η / ω) marks the subjunctive; the aorist subjunctive carries no augment.';
  }
  if (mood === 'imperative') {
    return 'Imperative endings (‑ε, ‑έτω, ‑ετε, ‑έτωσαν …) give the command; the aorist imperative takes no augment.';
  }

  // ── Finite indicative: the augment and stem markers do the work ──
  if (mood === 'indicative' || mood === '') {
    // Liquid-stem futures/aorists drop the σ — the plain "σ = future" rule is
    // actively wrong for them, so they get their own note.
    if (cat.includes('liquid')) {
      if (tense === 'future') return 'Liquid future — the σ drops and the stem contracts (μενῶ, κρινῶ); the circumflex is the tell.';
      if (tense === 'aorist' || tense === 'first aorist') return 'Liquid aorist — no σ; the stem vowel lengthens instead (ἔμεινα, ἔκρινα).';
    }
    // Contract verbs: the stem vowel contracts with the ending in the present
    // system; elsewhere it lengthens before σ (φιλήσω) and the notes below apply.
    if (cat.includes('contract') && (tense === 'present' || tense === 'imperfect')) {
      return tense === 'imperfect'
        ? 'Contract verb — augment + the contracting stem vowel with the secondary endings (ἐποίουν).'
        : 'Contract verb — the stem vowel contracts with the ending (ποιέ‑ω → ποιῶ).';
    }
    // μι-verbs: athematic, reduplicated present; their aorists are irregular
    // (κ-aorist / root aorist), so only the present gets a rule — the rest fall
    // through to '' and the stem-change pair.
    if (cat.includes('μι-verb')) {
      if (tense === 'present' || tense === 'imperfect') {
        return 'μι-verb — athematic endings on a reduplicated present stem (δί‑δω‑μι, τί‑θη‑μι).';
      }
      return '';
    }
    switch (tense) {
      case 'present':
        return midPass
          ? 'Present stem + primary middle/passive endings (‑ομαι, ‑ῃ, ‑εται …), no augment.'
          : 'Present stem + primary active endings, no augment.';
      case 'imperfect':
        return 'Augment + present stem + secondary endings = imperfect.';
      case 'future':
        return 'σ before the ending marks the future (λύ‑σ‑ω).';
      case 'first aorist':
      case 'aorist':
        if (voice === 'passive') return 'Augment + ‑θη‑ marks the aorist passive (ἐ‑λύ‑θη‑ν).';
        if (midPass) return 'Augment + ‑σα‑ + middle endings = first aorist middle (ἐ‑λυ‑σά‑μην).';
        return 'Augment + ‑σα‑ = first aorist active indicative (ἔ‑λυ‑σα).';
      case 'second aorist':
        if (voice === 'passive') return 'Augment + a bare ‑η‑ stem marks the second aorist passive (ἐ‑γράφ‑η‑ν).';
        return 'Augment + a changed (second-aorist) stem + secondary endings (ἔ‑βαλ‑ον).';
      case 'perfect':
        return isActive
          ? 'Reduplication + ‑κ‑ marks the perfect active (λέ‑λυ‑κα).'
          : 'Reduplication + primary middle/passive endings marks the perfect (λέ‑λυ‑μαι).';
      case 'pluperfect':
        return 'Augment + reduplication marks the pluperfect (ἐ‑λε‑λύ‑κειν).';
      default:
        return '';
    }
  }

  return '';
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
    if (!answer && (state.structuralImpossibility || state.paradigmGap)) {
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
    // A dimension the student undid still counts as a miss in the stats no
    // matter what they ultimately re-picked. But it shouldn't read as flatly
    // *wrong* in the summary — the re-picked value is often the right one — so
    // an undone step renders amber with an asterisk (not a red ✗) pointing to a
    // "<dim> reattempted" note. `pickCorrect` is the literal correctness of the
    // final pick (used to decide whether a correction arrow is useful);
    // `correct` is the graded verdict, which an undo forces to false.
    const forcedWrong = !!(state.forcedWrong && state.forcedWrong[step.key]);
    const pickCorrect = !!(answer && answer.isCorrect);
    const correct = !forcedWrong && pickCorrect;
    // Deponent voice soft-accept. For a deponent the form is middle (or
    // middle/passive) but Mounce parses it as active — so both grade correct
    // (morph_steps.js seeds step.acceptable = [middle, 'active']). 'active'
    // is the headline answer; when the student instead names the formal
    // 'middle' voice it still counts, but render it amber with an "active
    // (deponent)" note rather than a plain green ✓, so the convention is
    // reinforced instead of reading as fully, unremarkably right.
    const deponentPickedRaw = answer && answer.selectedIdx >= 0 ? step.choices[answer.selectedIdx] : null;
    const deponentVoiceStep = step.key === 'voice'
      && Array.isArray(step.acceptable) && step.acceptable.includes('active')
      && (step.correct === 'middle' || step.correct === 'middle/passive');
    const softDeponentMiddle = !!correct && deponentVoiceStep && !!deponentPickedRaw && deponentPickedRaw !== 'active';
    let markClass;
    let mark;
    if (forcedWrong && pickCorrect) {
      // Reattempted via undo and re-picked correctly — amber asterisk (not a
      // red ✗, which would falsely read as wrong) pointing to a shared
      // footnote. A reattempt that's STILL wrong falls through to the red ✗
      // branch below, so it reads like any other miss and needs no footnote.
      markClass = 'morph-step-reattempted';
      mark = '*';
    } else if (softDeponentMiddle) {
      markClass = 'morph-step-soft';
      mark = '✓';
    } else if (correct) {
      markClass = 'morph-step-correct';
      mark = '✓';
    } else {
      markClass = 'morph-step-incorrect';
      mark = '✗';
    }
    const deponentNoteHtml = softDeponentMiddle
      ? `<span class="morph-step-deponent-note">active (deponent) — middle in form, active in meaning</span>`
      : '';
    // Each step now carries a single correct value (the composite
    // 'continuous/undefined' counts as one). For aspect mistakes the
    // picked value can visually overlap the correct one (picking
    // "continuous" when the right answer is "continuous/undefined"), so
    // we append a one-line note that names the mistake — strikethrough +
    // arrow alone reads like a near-miss in that case.
    let acceptable = Array.isArray(step.acceptable) ? step.acceptable : [step.correct];
    // When the combined 'middle/passive' is accepted, don't also spell out its
    // bare 'middle' / 'passive' components in the correction — the slash form
    // already covers both, so "→ middle/passive" reads cleaner than
    // "→ middle/passive / middle / passive".
    if (step.key === 'voice' && acceptable.includes('middle/passive')) {
      acceptable = acceptable.filter((a) => a !== 'middle' && a !== 'passive');
    }
    const correctionInner = acceptable.map((a) => escapeHtml(applyDisplaySuffixIfPerson(step.key, a))).join(' / ');
    // Tie the correction arrow / aspect note to the *literal* pick, not the
    // graded verdict: an undone step re-picked correctly shouldn't sprout a
    // "→ <same value>" arrow (the bug the asterisk treatment fixes).
    let aspectNoteHtml = '';
    if (!pickCorrect && answer && answer.selectedIdx >= 0 && step.key === 'aspect' && step.context) {
      const pickedRaw = step.choices[answer.selectedIdx];
      const note = aspectMistakeNote(step.context.tense, pickedRaw, step.correct);
      if (note) aspectNoteHtml = `<span class="morph-step-aspect-note">${escapeHtml(note)}</span>`;
    }
    const showCorrection = !pickCorrect && answer
      ? `<span class="morph-step-correction">→ ${correctionInner}</span>${aspectNoteHtml}`
      : '';
    return `
      <div class="morph-step-summary-row ${markClass}">
        <span class="morph-step-summary-dim">${escapeHtml(step.label)}</span>
        <span class="morph-step-summary-pick">${escapeHtml(pickedLabel)} ${mark}</span>
        ${showCorrection}${deponentNoteHtml}
      </div>`;
  }).join('');

  // Single shared footnote for the amber asterisks — lists the reattempted
  // dimensions in display order ("number, gender reattempted") and explains
  // why they're amber: the undo still counts as a miss. Only reattempts that
  // were re-picked *correctly* get an asterisk (a still-wrong reattempt shows a
  // plain red ✗), so the footnote lists only those — and disappears entirely
  // when there are none.
  const reattemptedDims = state.steps
    .filter((step, idx) => step && !step.inferred
      && state.forcedWrong && state.forcedWrong[step.key]
      && state.answers[idx] && state.answers[idx].isCorrect)
    .map((step) => String(step.label || '').toLowerCase());
  const reattemptedNote = reattemptedDims.length
    ? `<div class="morph-step-undone-note">* ${escapeHtml(reattemptedDims.join(', '))} reattempted — counts as a miss</div>`
    : '';

  // X/N excludes inferred (ungraded) follow-up steps and steps that were
  // never asked because a structural impossibility ended the walk early. An
  // undone dimension counts as a miss even when re-answered correctly.
  const gradedCount = state.steps.filter((s, i) => !s.inferred && state.answers[i]).length;
  const totalCorrect = state.answers.filter((a, i) => {
    const step = state.steps[i];
    if (!a || !a.isCorrect || step.inferred) return false;
    if (state.forcedWrong && state.forcedWrong[step.key]) return false;
    return true;
  }).length;
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
  const correctValues = state.steps.map((step) => {
    // A deponent's voice is middle (or middle/passive) in form but parses as
    // active in meaning — the headline answer the soft-accept convention
    // expects (morph_steps.js seeds step.acceptable = [middle, 'active']). Show
    // 'active' here so the Correct-parse line matches the graded Voice step
    // instead of contradicting it with the formal 'middle'.
    if (step.key === 'voice'
        && Array.isArray(step.acceptable) && step.acceptable.includes('active')
        && (step.correct === 'middle' || step.correct === 'middle/passive')) {
      return 'active';
    }
    return step.correct;
  });
  // A structural impossibility (e.g. future imperative) trumps any lemma
  // lookup — show the specific reason instead of the generic "[no morph
  // exists]" we'd fall back to from the inventory check.
  const structReason = (state.structuralImpossibility && state.structuralImpossibility.reason)
    || (state.paradigmGap && state.paradigmGap.short);
  let yourFormHtml;
  if (structReason) {
    yourFormHtml = `<div class="morph-step-parse-match morph-step-parse-match-impossible">[${escapeHtml(structReason)}]</div>`;
  } else {
    const lookup = resolveFormForPickedDims(card, state.steps, pickedValues, state.autoFilledDims);
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
         ${escapeHtml(assembleParseLine(state.steps, pickedValues, state.impliedDims) || '—')}
         ${yourFormHtml}
       </div>
       <div class="morph-step-parse-line morph-step-parse-line-correct">
         <span class="morph-step-parse-label">Correct parse</span>
         ${escapeHtml(assembleParseLine(state.steps, correctValues, state.impliedDims))}
         ${correctFormHtml}
       </div>
     </div>`;

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

  // Differentiation note. A short, affirmative "why this form" morphology tell
  // sits always-visible; the deeper "how to tell it apart" disambiguation hints
  // (present vs future — the σ; etc.) tuck behind a collapsed disclosure so the
  // summary stays short. When neither is available we fall back to the
  // stem-change pair (itself only present for a tense whose stem differs from
  // the lemma) — and when even that is empty, nothing renders. The ambiguity /
  // gap notes above stay open: they explain why a mark was accepted.
  const category = card.lemma ? paradigmCategoryForLemma(card.lemma) : null;
  const whyThisForm = buildWhyThisFormNote(card, parsedDims, category);
  const tellApartItems = confusableFormHints(card.parsedAnswer || card.answer, parseAnswerDimensions(card.parsedAnswer || card.answer), card.form);
  const whyThisFormHtml = whyThisForm
    ? `<div class="morph-step-why-note"><span class="morph-step-why-label">Why this form</span> ${escapeHtml(whyThisForm)}</div>`
    : '';
  const tellApartHints = tellApartItems.length
    ? `<details class="morph-step-hint">
         <summary class="morph-step-hint-summary">How to tell it apart</summary>
         <div class="morph-step-hint-body">${tellApartItems.map((hint) => `<div class="morph-step-hint-note">${escapeHtml(hint)}</div>`).join('')}</div>
       </details>`
    : '';
  const differentiationHtml = (whyThisFormHtml || tellApartHints)
    ? `${whyThisFormHtml}${tellApartHints}`
    : stemChangeNote;

  // Paradigm-gap note: the student picked a value the focused paradigm has no
  // forms for (e.g. third person for ἐγώ/σύ), so the walk cut off early. Name
  // the gap so the dropped downstream steps don't read as a bug.
  const paradigmGapNote = state.paradigmGap
    ? `<div class="morph-step-gap-note"><span class="morph-step-gap-label">No such form</span> ${escapeHtml(state.paradigmGap.note)}</div>`
    : '';

  // Inferred-person note: a 2nd-person imperative card carries no graded Person
  // step (below ch 33 the person is structurally 2nd; the card just doesn't
  // specify one). When the student instead picks a finite mood, we inject an
  // ungraded Person step so their picks still resolve to a single form — but the
  // resulting row carries no ✓/✗, which reads like a bug without explanation.
  // Name why the row is ungraded.
  const gradedMoodStep = state.steps.find((s) => s.key === 'mood' && !s.inferred);
  const hasInferredPerson = state.steps.some((s) => s.key === 'person' && s.inferred);
  const impPersonReason = (state.maxChapter == null || state.maxChapter < THIRD_PERSON_IMPERATIVE_CHAPTER)
    ? 'the imperative is 2nd person by default'
    : 'this imperative form doesn’t specify a person';
  const personInferredNote = (hasInferredPerson && gradedMoodStep && gradedMoodStep.correct === 'imperative')
    ? `<div class="morph-step-person-note"><span class="morph-step-person-label">Person not graded</span> ${impPersonReason}, so ${escapeHtml(card.form || card.lemma)} is parsed without a person — picking a finite mood is what added the Person step, so it isn't scored.</div>`
    : '';

  return `
    <div class="morph-step-summary">
      <div class="morph-step-summary-title">Parse complete — ${escapeHtml(totalStr)}</div>
      <div class="morph-step-summary-body">${rows}</div>
      ${reattemptedNote}
      ${youParseLine}
      ${paradigmGapNote}
      ${ambigNote}
      ${personInferredNote}
      ${differentiationHtml}
    </div>`;
}

// ── English → Greek parsing (reverse direction) ───────────────────────
// Forward parsing walks a Greek form's parse one dimension at a time. The
// reverse drill flips it: show the requested parse (restricted to the dims
// the student has enabled) and offer a multiple-choice of Greek forms drawn
// from the same focused paradigm — they pick the form that matches.

const PARSE_DISPLAY_ORDER = ['tense', 'voice', 'mood', 'person', 'number', 'case', 'gender'];

// In-place Fisher–Yates; returns the same array for chaining.
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Readable parse from a card's canonical answer, limited to the enabled dims.
// "third" reads as "third person"; empty dims are skipped so a narrowed dim
// scope still reads cleanly.
function reverseParseLine(card, enabledDims) {
  const dims = parseAnswerDimensions(card.parsedAnswer || card.answer || '');
  const parts = [];
  PARSE_DISPLAY_ORDER.forEach((k) => {
    if (enabledDims && enabledDims[k] === false) return;
    const v = dims[k];
    if (!v) return;
    parts.push(k === 'person' ? `${v} person` : v);
  });
  return parts.join(' · ');
}

// Stable identity for a card's parse under the enabled dims — two cards with
// the same key are indistinguishable answers to the same requested parse, so
// one must never appear as a distractor for the other.
function reverseParseKey(card, enabledDims) {
  const dims = parseAnswerDimensions(card.parsedAnswer || card.answer || '');
  return PARSE_DISPLAY_ORDER
    .filter((k) => !(enabledDims && enabledDims[k] === false))
    .map((k) => dims[k] || '')
    .join('|');
}

// Build (and cache, per card) the MC option list for the reverse drill: the
// correct form plus up to three distractor forms from the focused-paradigm
// pool. Distractors must be a different Greek string AND a different parse
// (under the enabled dims) so exactly one option is right. Falls back to
// however many distinct forms exist for small paradigms.
function ensureReverseChoices(card) {
  const cached = runtime.parsingReverseState;
  if (cached && cached.cardId === card.id && Array.isArray(cached.options) && cached.options.length) {
    return cached;
  }
  const enabledDims = host.getEnabledParsingDims();
  const pool = Array.isArray(runtime.originalDeck) ? runtime.originalDeck : [];
  const correctForm = card.form;
  const targetKey = reverseParseKey(card, enabledDims);
  const seenForms = new Set([String(correctForm).trim()]);
  const distractors = [];
  let lookalikeNote = '';
  // Accent / breathing look-alike distractor (toggle-optional, off by default):
  // a curated twin that differs from the tested form only by accent/breathing
  // and is a different word. Added before the pool distractors so it survives
  // the 3-distractor cap, and never via the pool's same-parse filter (its whole
  // point is that it shares the dimensions but not the spelling).
  if (runtime.accentLookalikes) {
    for (const twin of accentLookalikesFor(correctForm)) {
      if (distractors.length >= 3) break;
      const tform = String(twin.form).trim();
      if (!tform || seenForms.has(tform)) continue;
      seenForms.add(tform);
      distractors.push(twin.form);
      if (!lookalikeNote) lookalikeNote = twin.note;
    }
  }
  shuffleInPlace([...pool]).forEach((c) => {
    if (distractors.length >= 3) return;
    if (!c || !c.form) return;
    const formKey = String(c.form).trim();
    if (seenForms.has(formKey)) return;
    if (reverseParseKey(c, enabledDims) === targetKey) return;
    seenForms.add(formKey);
    distractors.push(c.form);
  });
  const options = shuffleInPlace([correctForm, ...distractors]);
  const state = { cardId: card.id, options, correctForm, lookalikeNote };
  runtime.parsingReverseState = state;
  return state;
}

function renderParsingReverseCard(area, card) {
  const enabledDims = host.getEnabledParsingDims();
  const parseLine = reverseParseLine(card, enabledDims);
  const { options, correctForm, lookalikeNote } = ensureReverseChoices(card);
  const answered = runtime.morphAnswerState.answered;
  const selectedIdx = runtime.morphAnswerState.selectedIndex;

  // Identify by the dictionary lemma, not the paradigm set's principal-parts
  // label, and without a paradigm-category note (see renderMorphStepCard).
  const reverseSourceLine = card.supplemental
    ? (card.lemma || cardFaceLabelFromSourceLabel(card.sourceLabel || ''))
    : (card.sourceLabel || '');

  const choiceButtons = options.map((form, idx) => {
    const classes = ['choice-btn', 'choice-btn-greek'];
    if (answered) {
      if (form === correctForm) classes.push('correct');
      if (idx === selectedIdx && form !== correctForm) classes.push('incorrect');
    }
    return `<button class="${classes.join(' ')}" type="button" ${answered ? 'disabled' : ''} onclick="answerParsingReverseChoice(${idx})">${escapeHtml(form)}</button>`;
  }).join('');

  const dontKnowHtml = answered
    ? ''
    : `<div class="morph-dontknow-row">
         <button class="ctrl-btn morph-dontknow-btn" type="button" onclick="answerParsingReverseChoice(-1)">I don't know</button>
       </div>`;

  let resultHtml = '';
  if (answered) {
    const isCorrect = runtime.morphAnswerState.isCorrect;
    const glossText = formGloss(card);
    const glossLine = glossText
      ? `<div class="morph-gloss">Gloss: “${escapeHtml(glossText)}”</div>`
      : '';
    // When an accent/breathing look-alike was offered, name the distinction
    // after the answer (whether they hit or missed) so the spelling contrast
    // is reinforced.
    const lookalikeHtml = lookalikeNote
      ? `<div class="morph-step-ambig-note"><span class="morph-step-ambig-label">Accent / breathing</span> ${escapeHtml(lookalikeNote)}</div>`
      : '';
    resultHtml = `<div class="morph-result ${isCorrect ? 'correct' : 'incorrect'}">
        <div class="morph-result-title">${isCorrect ? 'Correct' : 'Not quite'}</div>
        <div class="morph-result-body">${escapeHtml(parseLine)} = ${escapeHtml(correctForm)}</div>
        <div class="morph-result-meta">${escapeHtml(card.lemma || '')}${card.family ? ` · ${escapeHtml(card.family)}` : ''}</div>
        ${glossLine}
        ${lookalikeHtml}
      </div>`;
  }

  area.innerHTML = `
    <div class="morph-card morph-step-card">
      <div class="morph-label">Grammar · English → Greek</div>
      <div class="morph-prompt">Pick the form that matches this parse.</div>
      <div class="morph-form">${escapeHtml(card.lemma || card.form)}</div>
      <div class="morph-step-label">${escapeHtml(parseLine)}</div>
      <div class="morph-source">${escapeHtml(reverseSourceLine)}</div>
      <div class="morph-choices">${choiceButtons}</div>
      ${dontKnowHtml}
      ${resultHtml}
    </div>`;
  runtime.isFlipped = false;
  renderProgress();
}

function escapeAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Lookup / "Build" mode: the reverse of the parsing drill. Instead of
// decomposing one Greek form's parse, the student builds a parse from the
// breadcrumbs and the tool resolves it to the matching form across the focused
// paradigm's full (all-chapters + optional + extra) form pool. Deck-independent
// — it reads the pool live, not runtime.deck. The header shows the paradigm
// category (Mounce has no lemma→gloss map; the per-form gloss on the result is
// generated by formGloss for verbs).
function renderMorphLookupCard(area) {
  if (!area) return;
  const lemma = host.getLookupFocusLemma();
  if (!lemma) {
    area.innerHTML = `
      <div class="morph-card morph-step-card morph-lookup-card">
        <div class="morph-label">Grammar · Build</div>
        <div class="empty-state morph-lookup-empty"><div class="big">αβγ</div>Pick a focused paradigm from the dropdown above, then build any of its forms one part at a time.</div>
      </div>`;
    runtime.isFlipped = false;
    renderProgress();
    return;
  }

  // Seed/refresh the cached pool + picks for this lemma, then read the picks
  // back (getLookupFormsForLemma resets picks when the lemma changes).
  const pool = host.getLookupFormsForLemma(lemma) || [];
  const st = runtime.morphLookupState || {};
  const picks = (st.lemma === lemma && st.picks && typeof st.picks === 'object') ? st.picks : {};
  const walk = resolveLookupWalk(pool, picks);

  const category = paradigmCategoryForLemma(lemma) || '';
  const headerMeta = category ? escapeHtml(category) : '';

  if (walk.empty) {
    area.innerHTML = `
      <div class="morph-card morph-step-card morph-lookup-card">
        <div class="morph-label">Grammar · Build</div>
        <div class="morph-form morph-lookup-lemma">${escapeHtml(lemma)}</div>
        ${headerMeta ? `<div class="morph-source">${headerMeta}</div>` : ''}
        <div class="empty-state morph-lookup-empty">This paradigm has no parseable forms to look up.</div>
      </div>`;
    runtime.isFlipped = false;
    renderProgress();
    return;
  }

  // Breadcrumb of decided dimensions. Explicit picks are editable buttons
  // (tap to re-pick from there); auto-locked dims (only one value possible)
  // are static chips.
  const trailHtml = walk.trail.map((t) => {
    const inner = `<span class="morph-lookup-chip-dim">${escapeHtml(t.label)}</span><span class="morph-lookup-chip-val">${escapeHtml(t.valueLabel)}</span>`;
    if (t.locked) {
      return `<span class="morph-lookup-chip locked" title="Only one ${escapeHtml(String(t.label).toLowerCase())} is possible here">${inner}</span>`;
    }
    return `<button type="button" class="morph-lookup-chip" onclick="editLookupDimension('${escapeAttr(t.dim)}')" title="Change ${escapeHtml(String(t.label).toLowerCase())}">${inner}<span class="morph-lookup-chip-edit" aria-hidden="true">✎</span></button>`;
  }).join('');
  const trailBlock = trailHtml ? `<div class="morph-lookup-trail">${trailHtml}</div>` : '';

  let bodyHtml;
  if (walk.next) {
    const buttons = walk.next.options.map((o) =>
      `<button type="button" class="choice-btn morph-lookup-option" onclick="pickLookupDimension('${escapeAttr(walk.next.dim)}','${escapeAttr(o.value)}')">${escapeHtml(o.label)}</button>`
    ).join('');
    const resetRow = walk.trail.length
      ? `<div class="morph-lookup-reset-row"><button type="button" class="ctrl-btn morph-lookup-reset" onclick="resetLookup()">↺ Start over</button></div>`
      : '';
    bodyHtml = `
      <div class="morph-step-current morph-lookup-current">
        <div class="morph-step-label">${escapeHtml(walk.next.label)}?</div>
        <div class="morph-choices morph-lookup-choices">${buttons}</div>
        ${resetRow}
      </div>`;
  } else {
    const forms = walk.matches || [];
    const formHtml = forms.length ? forms.map((m) => escapeHtml(m.form)).join('  ·  ') : '—';
    const parse = forms.length ? forms[0].parse : '';
    const glossText = forms.length
      ? formGloss({ lemma, form: forms[0].form, parsedAnswer: parse, answer: parse })
      : '';
    const glossLine = glossText ? `<div class="morph-gloss">Gloss: “${escapeHtml(glossText)}”</div>` : '';
    bodyHtml = `
      <div class="morph-lookup-result">
        <div class="morph-lookup-result-label">Form</div>
        <div class="morph-lookup-form">${formHtml}</div>
        <div class="morph-lookup-parse">${escapeHtml(parse)}</div>
        ${glossLine}
        <button type="button" class="ctrl-btn morph-lookup-reset" onclick="resetLookup()">↺ Look up another form</button>
      </div>`;
  }

  area.innerHTML = `
    <div class="morph-card morph-step-card morph-lookup-card">
      <div class="morph-label">Grammar · Build</div>
      <div class="morph-form morph-lookup-lemma">${escapeHtml(lemma)}</div>
      ${headerMeta ? `<div class="morph-source">${headerMeta}</div>` : ''}
      <div class="morph-lookup-hint">Build a form: choose each part to conjugate or decline this paradigm.</div>
      ${trailBlock}
      ${bodyHtml}
    </div>`;
  runtime.isFlipped = false;
  renderProgress();
}

function renderMorphStepCard(area, card) {
  const state = ensureStepStateForCard(card);
  // Hide the gloss while the parse is in progress — seeing "to loose" next
  // to ἔλυσας before picking tense/voice can leak the dimensions through
  // English inference. Surfaces once the parse completes so the student
  // still gets the lexical anchor on the summary screen.
  const glossText = formGloss(card);
  const lemmaGloss = state.completed && glossText
    ? `<div class="morph-gloss">Gloss: “${escapeHtml(glossText)}”</div>`
    : '';

  const body = state.completed
    ? renderMorphStepSummary(card, state)
    : renderMorphStepCurrent(state);

  // Italicized line under the form is the transliteration of the form
  // itself (not the lemma) so beginners can sound it out without leaking
  // the dictionary form — which would short-circuit a tense/aspect pick.
  const formTransliteration = host.transliterateGreek(card.form || '');
  const hintHtml = formTransliteration
    ? `<div class="morph-hint">${escapeHtml(formTransliteration)}</div>`
    : '';

  // Identify the word by its dictionary lemma (λύω), not the paradigm set's
  // display label. For the participle sets that label is the principal-parts
  // line ("λύσας, λύσασα, λῦσαν"), which hands the student the tense/mood they
  // are being asked to parse; the lemma alone never leaks the parse. No
  // paradigm-category note here either — for second-aorist / liquid-future
  // verbs the category names the very tense the walk is testing.
  const stepSourceLine = card.supplemental
    ? (card.lemma || cardFaceLabelFromSourceLabel(card.sourceLabel || ''))
    : (card.sourceLabel || '');
  // The aspect aside coaches the explicit Aspect step. With aspect off (the
  // default) the walk never asks for "continuous/undefined", so hide it.
  const aspectHint = runtime.aspectStep
    ? ' · Use "continuous/undefined" when the form licenses either reading'
    : '';
  // Source line: the lexical (dictionary) form. Once the parse is complete we
  // append the paradigm category — "λῦσον — Imperatives" — so the lemma and its
  // paradigm sit together at the top, and the old footer "Paradigm:" line is
  // dropped as redundant. The category stays OFF the in-progress header on
  // purpose: it names the very tense the walk is testing (e.g. "second aorist"),
  // so showing it mid-walk would hand over the answer.
  const completedCategory = state.completed && card.lemma
    ? (paradigmCategoryForLemma(card.lemma) || card.family || '')
    : '';
  const sourceLineHtml = state.completed && card.lemma
    ? `<div class="morph-source">${escapeHtml(card.lemma)}${completedCategory ? ' — ' + escapeHtml(completedCategory) : ''}</div>`
    : `<div class="morph-source">${escapeHtml(stepSourceLine)}${aspectHint}</div>`;

  // The prompt line ("Parse this form one dimension at a time") is intentionally
  // gone: the breadcrumb + per-step question already frame the task, and its
  // slot is now taken by the completed-only gloss above the form.
  area.innerHTML = `
    <div class="morph-card morph-step-card">
      <div class="morph-label">Grammar · Step-by-step</div>
      ${lemmaGloss}
      <div class="morph-form">${escapeHtml(card.form)}</div>
      ${hintHtml}
      ${sourceLineHtml}
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
