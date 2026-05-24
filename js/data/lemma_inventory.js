// Per-lemma morphological knowledge for the parse-feedback lookup and the
// optional-forms drill extension.
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
// in the same shape `parseAnswerDimensions` consumes. The lookup is
// ALWAYS consulted regardless of any user toggle — wrong picks deserve a
// canonical-form hint even when the form isn't part of the student's
// drill rotation.
//
// `optionalFormGroups` is the drillable counterpart: each group is a
// `{ chapter, family, forms }` bundle that becomes a set of synthetic
// parsing-drill cards when the "Optional paradigm extensions" toggle is
// ON in the settings panel. `chapter` is the gate (only injected when
// the student's max selected effective chapter ≥ this value), `family`
// labels the group in the parsing UI, and `forms` is the same flat
// `{ form: parsedAnswer }` shape as extraForms. The toggle defaults OFF
// so the standard Mounce-aligned card set is the baseline; opting in
// expands a paradigm with morphologically real forms the textbook
// skips.
//
// Convention: build a `forms` map once at top of file, then reference it
// from BOTH `extraForms` (so fallback always works) AND
// `optionalFormGroups` (so the drill toggle picks it up too). This
// keeps the two consumers in sync — adding a form means it appears in
// fallback AND becomes drillable on opt-in.
//
// Lemmas not listed default to "all standard combinations possible."
// Add entries here as new defective lemmas show up in the paradigm
// data, and add `optionalFormGroups` entries for any paradigm exemplar
// (λύω, λόγος, ἀγαθός, …) whose paradigm has slots Mounce doesn't drill.
// Keep the bar high on `impossible*` lists: only mark something
// impossible when it genuinely doesn't exist in Greek, not when Mounce
// hasn't introduced it yet.

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

  // εἰμί's future middle infinitive. Mounce drills only the present
  // infinitive (εἶναι), but ἔσεσθαι is real Koine, so a student picking
  // "future infinitive" on εἰμί should see it instead of falling through
  // to "—". Voice is middle for the same reason as the future participle:
  // εἰμί's future is deponent.
  const EIMI_FUTURE_MIDDLE_INFINITIVE = {
    'ἔσεσθαι': 'future middle infinitive'
  };

  // εἰμί's present active imperative. Mounce introduces the imperative
  // mood mid-curriculum but doesn't drill εἰμί's imperative paradigm —
  // students who pick "imperative" for εἰμί otherwise see blank (no form
  // lookup matched). ἔστων is the older classical alternate for 3pl
  // alongside the standard Koine ἔστωσαν; both are real and should
  // resolve cleanly.
  const EIMI_PRESENT_ACTIVE_IMPERATIVE = {
    'ἴσθι':     'present active imperative second person singular',
    'ἔστω':     'present active imperative third person singular',
    'ἔστε':     'present active imperative second person plural',
    'ἔστωσαν':  'present active imperative third person plural',
    'ἔστων':    'present active imperative third person plural'
  };

  // εἰμί's optional-drill groups. Chapter gates use Mounce chapter
  // numbers (which match duff at this scope):
  //   - Ch 7: imperative mood is introduced in this chapter, so εἰμί's
  //     present imperative becomes drillable here.
  //   - Ch 8: future tense paradigms; future middle infinitive and
  //     future middle participle become drillable.
  const EIMI_OPTIONAL_GROUPS = [
    { chapter: 7, family: 'εἰμί — present active imperative (optional)',
      forms: EIMI_PRESENT_ACTIVE_IMPERATIVE },
    { chapter: 8, family: 'εἰμί — future middle infinitive (optional)',
      forms: EIMI_FUTURE_MIDDLE_INFINITIVE },
    { chapter: 8, family: 'εἰμί — future middle participle (optional)',
      forms: EIMI_FUTURE_MIDDLE_PARTICIPLE }
  ];

  // ─── Distinct vocative singulars for noun paradigm exemplars ──────
  //
  // Audit finding: Mounce intentionally skips vocatives across the noun
  // paradigms. For most nouns the vocative singular is syncretic with
  // the nominative singular (1st-decl fem, 2nd-decl neut, most 3rd-decl
  // stems), so a "vocative singular" pick on the drilled paradigm
  // resolves via the same Greek string under a different label — worth
  // adding to extraForms only where the syncretism would confuse a
  // student looking for explicit confirmation.
  //
  // λόγος has a DISTINCT vocative singular that appears in the NT as
  // direct address. Added to extraForms only — no optionalFormGroups —
  // because synthesizing a single-form drill card for a vocative would
  // clutter the deck. Picks of "vocative singular" hit the fallback
  // and resolve cleanly.
  const LOGOS_VOCATIVE = {
    'λόγε': 'vocative singular masculine'
  };

  const LEMMA_INVENTORY = {
    'εἰμί': {
      // εἰμί is suppletive: it has no aorist or perfect family — Greek
      // uses other roots (γέγονα, ἐγενόμην) for those senses. Tenses
      // εἰμί does have: present, future, imperfect (and a rarely-
      // attested perfect that classical/Koine pedagogy treats as
      // absent). Voice: εἰμί is active in the present/imperfect but
      // deponent middle in the future (ἔσομαι, ἐσόμενος, ἔσεσθαι) — so
      // we can't blanket-block middle/passive at the lemma level; it'd
      // wrongly tag every future-middle pick as impossible. Until the
      // inventory shape supports tense-conditional voice gating, leave
      // voice open. Moods exist for some tenses (subjunctive ὦ,
      // imperative ἴσθι, infinitive εἶναι/ἔσεσθαι, participle ὤν/
      // ἐσόμενος) so don't blanket-mark moods here either.
      impossibleTenses: ['aorist', 'first aorist', 'second aorist', 'perfect', 'pluperfect'],
      extraForms: {
        ...EIMI_FUTURE_MIDDLE_PARTICIPLE,
        ...EIMI_FUTURE_MIDDLE_INFINITIVE,
        ...EIMI_PRESENT_ACTIVE_IMPERATIVE
      },
      optionalFormGroups: EIMI_OPTIONAL_GROUPS
    },
    'λόγος': {
      extraForms: LOGOS_VOCATIVE
    }
    // Add more defective lemmas here (e.g. οἶδα — no present form, the
    // perfect serves as present; χρή — only third singular, etc.) when
    // the data grows to include them. For paradigm exemplars (λύω,
    // λόγος, ἀγαθός, …) whose paradigms have undrilled corners, add
    // both `extraForms` (always-on fallback) and `optionalFormGroups`
    // (toggle-gated drill cards) — reference a shared `forms` map so
    // the two stay in sync.
  };

  if (typeof window !== 'undefined') window.LEMMA_INVENTORY = LEMMA_INVENTORY;
})();
