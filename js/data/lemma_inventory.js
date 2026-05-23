// Per-lemma morphological inventory: tags combinations that CAN'T exist
// in real Greek for each lemma (a "negative" inventory).
//
// Read by the parse-feedback line under YOUR PARSE on the step-by-step
// summary. When the student's picked parse violates this inventory the
// feedback says "[no morph exists]" — a confident statement that no
// such form exists in the language, not just that we lack the data for
// it. Combinations that ARE possible but aren't in our data still
// render as "—" (data gap), so this file should only enumerate
// genuine morphological gaps, never just-not-covered-yet ones.
//
// Lemmas not listed default to "all standard combinations possible."
// Add entries here as new defective lemmas show up in the paradigm
// data — keep the bar high: only mark something impossible when it
// genuinely doesn't exist in Greek, not when Mounce hasn't introduced
// it yet.

(function () {
  const LEMMA_INVENTORY = {
    'εἰμί': {
      // εἰμί is suppletive: it has no aorist or perfect family — Greek
      // uses other roots (γέγονα, ἐγενόμην) for those senses. It's also
      // intrinsically stative/intransitive, so middle/passive voice
      // isn't licensed. Tenses εἰμί does have: present, future,
      // imperfect (and a rarely-attested perfect that classical/Koine
      // pedagogy treats as absent). Moods exist for some tenses
      // (subjunctive ὦ, imperative ἴσθι, infinitive εἶναι, participle
      // ὤν) so don't blanket-mark moods here.
      impossibleTenses: ['aorist', 'first aorist', 'second aorist', 'perfect', 'pluperfect'],
      impossibleVoices: ['middle', 'passive', 'middle/passive']
    }
    // Add more defective lemmas here (e.g. οἶδα — no present form, the
    // perfect serves as present; χρή — only third singular, etc.)
    // when the data grows to include them.
  };

  if (typeof window !== 'undefined') window.LEMMA_INVENTORY = LEMMA_INVENTORY;
})();
