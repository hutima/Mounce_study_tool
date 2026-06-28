// Keyboard shortcuts for the study UI.
//
// Reads modal/study state via the predicate functions passed in by main.js.
// Mutations (navigate, markCard, flipCard, answerMorphologyChoice) and the
// close* helpers come from the same host so this module stays a thin wire-up
// over the existing event semantics — no behavior change vs. the original
// inline listener.

export function installKeyboardShortcuts(deps) {
  const {
    isAnalyticsModalOpen,
    closeAnalyticsOverlay,
    isStudySelectorOpen,
    closeStudySelector,
    isShortcutsModalOpen,
    closeShortcutsModal,
    isWhatsNewV1_1ModalOpen,
    closeWhatsNewV1_1Modal,
    isToggleInfoModalOpen,
    closeToggleInfoModal,
    isContactAuthorModalOpen,
    closeContactAuthorModal,
    isInstallInstructionsOpen,
    closeInstallInstructions,
    isDisclaimerModalOpen,
    isTransferModalOpen,
    closeTransferModal,
    isReviewDeckMode,
    getSelectedKeys,
    isMorphologyMode,
    isMorphSelfCheck,
    navigate,
    answerMorphologyChoice,
    revealMorphologyAnswer,
    rateMorphologySelfCheck,
    passMorphologyChoice,
    flipCard,
    markCard,
    restoreSpacedUndo,
    getMorphAnswerState,
    getSpacedUndoSnapshot
  } = deps;

  document.addEventListener('keydown', e => {
    // Contact-author can stack on top of the user guide, so it's the topmost
    // modal — close it before any of the others it may be covering.
    if (e.key === 'Escape' && isContactAuthorModalOpen()) { closeContactAuthorModal(); return; }
    // Guarded: an old cached keyboard.js paired with a new main.js (or vice
    // versa) during a SW update may not have this dep wired — degrade quietly.
    if (e.key === 'Escape' && typeof isInstallInstructionsOpen === 'function' && isInstallInstructionsOpen()) { closeInstallInstructions(); return; }
    if (e.key === 'Escape' && isAnalyticsModalOpen()) { closeAnalyticsOverlay(); return; }
    if (e.key === 'Escape' && isStudySelectorOpen()) { closeStudySelector(); return; }
    if (e.key === 'Escape' && isShortcutsModalOpen()) { closeShortcutsModal(); return; }
    if (e.key === 'Escape' && isWhatsNewV1_1ModalOpen()) { closeWhatsNewV1_1Modal(); return; }
    if (e.key === 'Escape' && isToggleInfoModalOpen()) { closeToggleInfoModal(); return; }
    if (e.key === 'Escape' && isTransferModalOpen()) { closeTransferModal(); return; }
    if (isDisclaimerModalOpen() || isTransferModalOpen() || isAnalyticsModalOpen() || isStudySelectorOpen() || isShortcutsModalOpen() || isWhatsNewV1_1ModalOpen() || isToggleInfoModalOpen() || isContactAuthorModalOpen() || (typeof isInstallInstructionsOpen === 'function' && isInstallInstructionsOpen())) return;
    if (!isReviewDeckMode() || !getSelectedKeys().length) return;

    if (isMorphologyMode()) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp') {
        if (getMorphAnswerState().answered && getSpacedUndoSnapshot()) restoreSpacedUndo();
      }
      if (isMorphSelfCheck()) {
        // Self-check hides the multiple-choice options, so digits map to the
        // reveal/rate flow instead of answerMorphologyChoice (which would
        // grade the card against an invisible option).
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); revealMorphologyAnswer(); }
        if (e.key === '1') rateMorphologySelfCheck(true);
        if (e.key === '2') rateMorphologySelfCheck(false);
      } else if (/^[1-4]$/.test(e.key)) {
        answerMorphologyChoice(Number(e.key) - 1);
      }
      if (e.key === '0' || e.key === '5') passMorphologyChoice();
      return;
    }

    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigate(-1);
    if (e.key === '1') markCard('again');
    if (e.key === '2') markCard('pass');
    if (e.key === '3') markCard('easy');
    if (e.key === 'k' || e.key === 'K') markCard('easy');
    if (e.key === 'r' || e.key === 'R') markCard('again');
  });
}
