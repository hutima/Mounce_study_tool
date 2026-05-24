// Per-lemma morphological knowledge for the parse-feedback lookup.
//
// `impossibleTenses` / `impossibleVoices` / `impossibleMoods` are the
// "negative" inventory: combinations that CAN'T exist in real Greek for
// this lemma. When the student's picked parse violates one of these, the
// summary's YOUR PARSE line says "[no morph exists]" — a confident
// statement that the form doesn't exist in the language, not just that
// we lack data for it. Combinations that ARE possible but aren't in our
// data still render as "—" (data gap), so the negative lists should only
// enumerate genuine morphological gaps, never just-not-covered-yet ones.
//
// `extraForms` is positive form data, read as a last-resort pool by
// resolveFormForPickedDims when no card carries the form the student's
// picks resolve to. Each entry maps a Greek form to a canonical answer
// string (e.g. "future middle participle genitive singular masc./neut.")
// in the same shape `parseAnswerDimensions` consumes. Use it for
// morphologically real paradigms Mounce doesn't drill so the summary can
// still surface the canonical form — never for cards meant to be studied.
//
// Lemmas not listed default to "all standard combinations possible."
// Add entries here as new defective lemmas show up in the paradigm
// data — keep the bar high: only mark something impossible when it
// genuinely doesn't exist in Greek, not when Mounce hasn't introduced
// it yet.

(function () {
  // εἰμί's future middle participle (ἐσόμενος, -ομένη, -όμενον). Declines
  // like λυόμενος. Pedagogically rare — Mounce drills only the present
  // participle (ὤν / ὄντες) — but the future participle exists in Koine,
  // so a student picking "future participle ..." on εἰμί should see the
  // canonical form (e.g. ἐσομένου for gen. sg. masc./neut.) instead of
  // either "[no morph exists]" or a wrong-class match like ἔσομαι. Forms
  // syncretic across genders (ἐσόμενον serves masc. acc. sg. + neut. nom./
  // acc. sg.; ἐσόμενα serves neut. nom./acc. pl.) take the parse string
  // that covers the most picks; rarer alternates can be added if a user
  // reports them missing.
  const EIMI_FUTURE_MIDDLE_PARTICIPLE = {
    'ἐσόμενος':  'future middle participle nominative singular masculine',
    'ἐσομένου':  'future middle participle genitive singular masculine/neuter',
    'ἐσομένῳ':   'future middle participle dative singular masculine/neuter',
    'ἐσόμενον':  'future middle participle accusative singular masculine/neuter',
    'ἐσόμενε':   'future middle participle vocative singular masculine',
    'ἐσόμενοι':  'future middle participle nominative plural masculine',
    'ἐσομένους': 'future middle participle accusative plural masculine',
    'ἐσομένων':  'future middle participle genitive plural masculine/feminine/neuter',
    'ἐσομένοις': 'future middle participle dative plural masculine/neuter',
    'ἐσομένη':   'future middle participle nominative singular feminine',
    'ἐσομένης':  'future middle participle genitive singular feminine',
    'ἐσομένῃ':   'future middle participle dative singular feminine',
    'ἐσομένην':  'future middle participle accusative singular feminine',
    'ἐσόμεναι':  'future middle participle nominative plural feminine',
    'ἐσομέναις': 'future middle participle dative plural feminine',
    'ἐσομένας':  'future middle participle accusative plural feminine',
    'ἐσόμενα':   'future middle participle nominative/accusative plural neuter'
  };

  const LEMMA_INVENTORY = {
    'εἰμί': {
      // εἰμί is suppletive: it has no aorist or perfect family — Greek
      // uses other roots (γέγονα, ἐγενόμην) for those senses. Tenses
      // εἰμί does have: present, future, imperfect (and a rarely-
      // attested perfect that classical/Koine pedagogy treats as
      // absent). Voice: εἰμί is active in the present/imperfect but
      // deponent middle in the future (ἔσομαι, ἐσόμενος) — so we can't
      // blanket-block middle/passive at the lemma level; it'd wrongly
      // tag every future-middle pick as impossible. Until the inventory
      // shape supports tense-conditional voice gating, leave voice
      // open. Moods exist for some tenses (subjunctive ὦ, imperative
      // ἴσθι, infinitive εἶναι, participle ὤν) so don't blanket-mark
      // moods here either.
      impossibleTenses: ['aorist', 'first aorist', 'second aorist', 'perfect', 'pluperfect'],
      extraForms: EIMI_FUTURE_MIDDLE_PARTICIPLE
    }
    // Add more defective lemmas here (e.g. οἶδα — no present form, the
    // perfect serves as present; χρή — only third singular, etc.)
    // when the data grows to include them.
  };

  if (typeof window !== 'undefined') window.LEMMA_INVENTORY = LEMMA_INVENTORY;
})();
