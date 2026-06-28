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
// Mounce chapter intros referenced for gate selection (the gate for each
// group is max(tense-intro, voice-intro, mood-intro)):
//   - present active   : 16     | present mid/pas  : 18
//   - imperfect        : 21     | future act/mid   : 19
//   - future passive   : 24     | 2nd aorist act   : 22
//   - 1st aorist act   : 23     | aorist passive   : 24
//   - perfect          : 25     | subjunctive      : 31
//   - infinitive       : 32     | imperative       : 33
//   - present ptc      : 27     | aorist ptc       : 28
//   - perfect ptc      : 30     | δίδωμι intro     : 34 (ind) / 35 (non-ind)
//   - τίθημι/ἵστημι intro: 36
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

  const EIMI_FUTURE_MIDDLE_INFINITIVE = {
    'ἔσεσθαι': 'future middle infinitive'
  };

  // εἰμί's present active imperative. Mounce introduces the imperative
  // mood in Ch 33; until then the imperative paradigm of εἰμί is
  // off-scope. ἔστων is the older classical alternate for 3pl alongside
  // the standard Koine ἔστωσαν.
  const EIMI_PRESENT_ACTIVE_IMPERATIVE = {
    'ἴσθι':     'present active imperative second person singular',
    'ἔστω':     'present active imperative third person singular',
    'ἔστε':     'present active imperative second person plural',
    'ἔστωσαν':  'present active imperative third person plural',
    'ἔστων':    'present active imperative third person plural'
  };

  // εἰμί gate map: future infinitive/participle once future + non-finite
  // moods are in scope; imperative once Mounce introduces the mood.
  const EIMI_OPTIONAL_GROUPS = [
    { chapter: 27, family: 'εἰμί — future middle participle (optional)',
      forms: EIMI_FUTURE_MIDDLE_PARTICIPLE },
    { chapter: 32, alwaysInclude: true, family: 'εἰμί — future middle infinitive (required)',
      forms: EIMI_FUTURE_MIDDLE_INFINITIVE },
    { chapter: 33, family: 'εἰμί — present active imperative (optional)',
      forms: EIMI_PRESENT_ACTIVE_IMPERATIVE }
  ];

  // ─── λύω (model regular ω-verb) ────────────────────────────────────
  //
  // Mounce drills the indicative active/middle/passive across present,
  // imperfect, future, aorist, and perfect (Ch 16–25), the present + 1st
  // aorist active participles + the aorist passive participle (Ch 27–28),
  // the present infinitives + 1st aorist infinitives (Ch 32), and the
  // present active imperative (Ch 33). Gaps: subjunctive (introduced at
  // Ch 31, with only a few hand-written grammar.js examples), non-present
  // infinitives (future act/mid/pas, perfect act + m/p, aor middle), the
  // 3rd-person present m/p imperative, the aorist middle imperative
  // paradigm, the perfect active + perfect m/p participle declensions,
  // the 1st aorist active participle full declension (only the masc-nom
  // is drilled), and the future participles. These fill those gaps.
  //
  // Syncretic forms (λύῃ = 3sg pres act subj AND 2sg pres m/p subj/imp,
  // λύσῃ across aor act subj 3sg + aor mid subj 2sg + fut ind 2sg/3sg,
  // λῦσαι across aor act inf + aor mid imp 2sg) get assigned the most
  // pedagogically prominent reading; other readings fall to the data
  // gap or to drilled-card matches in other pools.

  const LUO_PRESENT_ACTIVE_SUBJUNCTIVE = {
    'λύω':      'present active subjunctive first person singular',
    'λύῃς':     'present active subjunctive second person singular',
    'λύῃ':      'present active subjunctive third person singular',
    'λύωμεν':   'present active subjunctive first person plural',
    'λύητε':    'present active subjunctive second person plural',
    'λύωσι':    'present active subjunctive third person plural',
    'λύωσιν':   'present active subjunctive third person plural'
  };

  const LUO_AORIST_ACTIVE_SUBJUNCTIVE = {
    'λύσω':     'aorist active subjunctive first person singular',
    'λύσῃς':    'aorist active subjunctive second person singular',
    'λύσῃ':     'aorist active subjunctive third person singular',
    'λύσωμεν':  'aorist active subjunctive first person plural',
    'λύσητε':   'aorist active subjunctive second person plural',
    'λύσωσι':   'aorist active subjunctive third person plural',
    'λύσωσιν':  'aorist active subjunctive third person plural'
  };

  const LUO_AORIST_MIDDLE_SUBJUNCTIVE = {
    'λύσωμαι':   'aorist middle subjunctive first person singular',
    // 'λύσῃ' 2sg collides with the aorist active subjunctive 3sg key
    // above; the active reading is more pedagogically prominent.
    'λύσηται':   'aorist middle subjunctive third person singular',
    'λυσώμεθα':  'aorist middle subjunctive first person plural',
    'λύσησθε':   'aorist middle subjunctive second person plural',
    'λύσωνται':  'aorist middle subjunctive third person plural'
  };

  const LUO_AORIST_PASSIVE_SUBJUNCTIVE = {
    'λυθῶ':     'aorist passive subjunctive first person singular',
    'λυθῇς':    'aorist passive subjunctive second person singular',
    'λυθῇ':     'aorist passive subjunctive third person singular',
    'λυθῶμεν':  'aorist passive subjunctive first person plural',
    'λυθῆτε':   'aorist passive subjunctive second person plural',
    'λυθῶσι':   'aorist passive subjunctive third person plural',
    'λυθῶσιν':  'aorist passive subjunctive third person plural'
  };

  const LUO_PRESENT_MIDDLE_PASSIVE_SUBJUNCTIVE = {
    'λύωμαι':   'present middle/passive subjunctive first person singular',
    'λύηται':   'present middle/passive subjunctive third person singular',
    'λυώμεθα':  'present middle/passive subjunctive first person plural',
    'λύησθε':   'present middle/passive subjunctive second person plural',
    'λύωνται':  'present middle/passive subjunctive third person plural'
  };

  // Non-present infinitives. λύειν (pres act) / λύεσθαι (pres m/p) /
  // λῦσαι (1aor act) / λυθῆναι (aor pas) are drilled in S32_INFINITIVE;
  // future + perfect + aor middle aren't.
  const LUO_NONPRESENT_INFINITIVES = {
    'λύσειν':       'future active infinitive',
    'λύσεσθαι':     'future middle infinitive',
    'λυθήσεσθαι':   'future passive infinitive',
    'λελυκέναι':    'perfect active infinitive',
    'λελύσθαι':     'perfect middle/passive infinitive',
    'λύσασθαι':     'aorist middle infinitive'
  };

  // Present middle/passive imperative 3rd person. The 2sg/2pl forms
  // aren't drilled for λύω in mounce either — adding the 3rd-person
  // here completes the present m/p imperative paradigm.
  const LUO_PRESENT_MP_IMPERATIVE = {
    'λύου':       'present middle/passive imperative second person singular',
    'λυέσθω':     'present middle/passive imperative third person singular',
    'λύεσθε':     'present middle/passive imperative second person plural',
    'λυέσθωσαν':  'present middle/passive imperative third person plural'
  };

  // Present active imperative 3rd-person & 3rd-plural completions —
  // S33_IMPERATIVE_ACTIVE has only 4 cards (λῦε / λυέτω / λύετε /
  // λυέτωσαν), which is actually the full paradigm. No gap here.

  // Aorist active imperative — not drilled at all for λύω in mounce.
  const LUO_AORIST_ACTIVE_IMPERATIVE = {
    'λῦσον':       'aorist active imperative second person singular',
    'λυσάτω':      'aorist active imperative third person singular',
    'λύσατε':      'aorist active imperative second person plural',
    'λυσάτωσαν':   'aorist active imperative third person plural'
  };

  // Aorist middle imperative — not drilled. 2sg λῦσαι overlaps with the
  // drilled aorist active infinitive λῦσαι; the drilled card wins for
  // the infinitive parse.
  const LUO_AORIST_MIDDLE_IMPERATIVE = {
    'λῦσαι':       'aorist middle imperative second person singular',
    'λυσάσθω':     'aorist middle imperative third person singular',
    'λύσασθε':     'aorist middle imperative second person plural',
    'λυσάσθωσαν':  'aorist middle imperative third person plural'
  };

  // Aorist passive imperative — not drilled. 2sg/3sg/2pl/3pl all real.
  const LUO_AORIST_PASSIVE_IMPERATIVE = {
    'λύθητι':      'aorist passive imperative second person singular',
    'λυθήτω':      'aorist passive imperative third person singular',
    'λύθητε':      'aorist passive imperative second person plural',
    'λυθήτωσαν':   'aorist passive imperative third person plural'
  };

  const LUO_OPTIONAL_GROUPS = [
    { chapter: 32, alwaysInclude: true, family: 'λύω — future active infinitive (required)',
      forms: { 'λύσειν': 'future active infinitive' } },
    { chapter: 32, alwaysInclude: true, family: 'λύω — future middle/passive + perfect + aor middle infinitives (required)',
      forms: {
        'λύσεσθαι':    'future middle infinitive',
        'λυθήσεσθαι':  'future passive infinitive',
        'λελυκέναι':   'perfect active infinitive',
        'λελύσθαι':    'perfect middle/passive infinitive',
        'λύσασθαι':    'aorist middle infinitive'
      } },
    { chapter: 33, family: 'λύω — present middle/passive imperative (optional)',
      forms: LUO_PRESENT_MP_IMPERATIVE },
    { chapter: 33, family: 'λύω — aorist active imperative λῦσον (optional)',
      forms: LUO_AORIST_ACTIVE_IMPERATIVE },
    { chapter: 33, family: 'λύω — aorist middle imperative (optional)',
      forms: LUO_AORIST_MIDDLE_IMPERATIVE },
    { chapter: 33, family: 'λύω — aorist passive imperative λύθητι (optional)',
      forms: LUO_AORIST_PASSIVE_IMPERATIVE },
    { chapter: 31, family: 'λύω — present active subjunctive (optional)',
      forms: LUO_PRESENT_ACTIVE_SUBJUNCTIVE },
    { chapter: 31, family: 'λύω — aorist active subjunctive (optional)',
      forms: LUO_AORIST_ACTIVE_SUBJUNCTIVE },
    { chapter: 31, family: 'λύω — aorist middle subjunctive (optional)',
      forms: LUO_AORIST_MIDDLE_SUBJUNCTIVE },
    { chapter: 31, family: 'λύω — aorist passive subjunctive (optional)',
      forms: LUO_AORIST_PASSIVE_SUBJUNCTIVE },
    { chapter: 31, family: 'λύω — present middle/passive subjunctive (optional)',
      forms: LUO_PRESENT_MIDDLE_PASSIVE_SUBJUNCTIVE }
  ];

  const LUO_EXTRA_FORMS = {
    ...LUO_AORIST_MIDDLE_SUBJUNCTIVE,
    ...LUO_PRESENT_MIDDLE_PASSIVE_SUBJUNCTIVE,
    ...LUO_AORIST_PASSIVE_SUBJUNCTIVE,
    ...LUO_NONPRESENT_INFINITIVES,
    ...LUO_PRESENT_MP_IMPERATIVE,
    ...LUO_AORIST_ACTIVE_IMPERATIVE,
    ...LUO_AORIST_MIDDLE_IMPERATIVE,
    ...LUO_AORIST_PASSIVE_IMPERATIVE,
    // Active subjunctive last so λύῃ resolves to "pres act subj 3sg"
    // (and λύσῃ to "aor act subj 3sg") — the most common single-form
    // readings for those Greek strings.
    ...LUO_PRESENT_ACTIVE_SUBJUNCTIVE,
    ...LUO_AORIST_ACTIVE_SUBJUNCTIVE
  };

  // ─── γίνομαι (second-aorist deponent — ubiquitous in NT) ──────────
  //
  // Mounce drills γίνομαι in the principal-parts focused-paradigm
  // (γίνομαι → ἐγενόμην for the 2nd aorist) but the full indicative
  // paradigm — present mid/pas, imperfect, future, aorist mid, aorist
  // pas, perfect — and the participles aren't fully fleshed out.
  // Filling these gaps is one of the highest-pedagogical-value
  // additions for the optional drill.

  const GINOMAI_PRESENT_MIDDLE_INDICATIVE = {
    'γίνομαι':   'present middle indicative first person singular',
    'γίνῃ':      'present middle indicative second person singular',
    'γίνεται':   'present middle indicative third person singular',
    'γινόμεθα':  'present middle indicative first person plural',
    'γίνεσθε':   'present middle indicative second person plural',
    'γίνονται':  'present middle indicative third person plural'
  };

  const GINOMAI_IMPERFECT_MIDDLE_INDICATIVE = {
    'ἐγινόμην':  'imperfect middle indicative first person singular',
    'ἐγίνου':    'imperfect middle indicative second person singular',
    'ἐγίνετο':   'imperfect middle indicative third person singular',
    'ἐγινόμεθα': 'imperfect middle indicative first person plural',
    'ἐγίνεσθε':  'imperfect middle indicative second person plural',
    'ἐγίνοντο':  'imperfect middle indicative third person plural'
  };

  const GINOMAI_FUTURE_MIDDLE_INDICATIVE = {
    'γενήσομαι':  'future middle indicative first person singular',
    'γενήσῃ':     'future middle indicative second person singular',
    'γενήσεται':  'future middle indicative third person singular',
    'γενησόμεθα': 'future middle indicative first person plural',
    'γενήσεσθε':  'future middle indicative second person plural',
    'γενήσονται': 'future middle indicative third person plural'
  };

  const GINOMAI_AORIST_MIDDLE_INDICATIVE = {
    'ἐγενόμην':   'aorist middle indicative first person singular',
    'ἐγένου':     'aorist middle indicative second person singular',
    'ἐγένετο':    'aorist middle indicative third person singular',
    'ἐγενόμεθα':  'aorist middle indicative first person plural',
    'ἐγένεσθε':   'aorist middle indicative second person plural',
    'ἐγένοντο':   'aorist middle indicative third person plural'
  };

  const GINOMAI_AORIST_PASSIVE_INDICATIVE = {
    'ἐγενήθην':   'aorist passive indicative first person singular',
    'ἐγενήθης':   'aorist passive indicative second person singular',
    'ἐγενήθη':    'aorist passive indicative third person singular',
    'ἐγενήθημεν': 'aorist passive indicative first person plural',
    'ἐγενήθητε':  'aorist passive indicative second person plural',
    'ἐγενήθησαν': 'aorist passive indicative third person plural'
  };

  const GINOMAI_PERFECT_ACTIVE_INDICATIVE = {
    'γέγονα':    'perfect active indicative first person singular',
    'γέγονας':   'perfect active indicative second person singular',
    'γέγονε':    'perfect active indicative third person singular',
    'γέγονεν':   'perfect active indicative third person singular',
    'γεγόναμεν': 'perfect active indicative first person plural',
    'γεγόνατε':  'perfect active indicative second person plural',
    'γεγόνασι':  'perfect active indicative third person plural',
    'γεγόνασιν': 'perfect active indicative third person plural'
  };

  const GINOMAI_AORIST_MIDDLE_INFINITIVE = {
    'γενέσθαι': 'aorist middle infinitive'
  };

  const GINOMAI_PRESENT_MIDDLE_INFINITIVE = {
    'γίνεσθαι': 'present middle infinitive'
  };

  const GINOMAI_AORIST_MIDDLE_IMPERATIVE = {
    'γενοῦ':       'aorist middle imperative second person singular',
    'γενέσθω':     'aorist middle imperative third person singular',
    'γένεσθε':     'aorist middle imperative second person plural',
    'γενέσθωσαν':  'aorist middle imperative third person plural'
  };

  // Present middle imperative (γίνομαι is deponent middle in the present).
  // The aorist middle imperative above shifts to the 2nd-aorist stem γεν-;
  // the present keeps γιν-, so a "present imperative" parse of an aorist
  // form reconstructs to γίνου rather than a blank "—". (2pl γίνεσθε is
  // syncretic with the present indicative; the indicative keeps the key.)
  const GINOMAI_PRESENT_MIDDLE_IMPERATIVE = {
    'γίνου':       'present middle imperative second person singular',
    'γινέσθω':     'present middle imperative third person singular',
    'γίνεσθε':     'present middle imperative second person plural',
    'γινέσθωσαν':  'present middle imperative third person plural'
  };

  const GINOMAI_OPTIONAL_GROUPS = [
    { chapter: 18, alwaysInclude: true, family: 'γίνομαι — present middle indicative (required)',
      forms: GINOMAI_PRESENT_MIDDLE_INDICATIVE },
    { chapter: 21, family: 'γίνομαι — imperfect middle indicative (optional)',
      forms: GINOMAI_IMPERFECT_MIDDLE_INDICATIVE },
    { chapter: 19, alwaysInclude: true, family: 'γίνομαι — future middle indicative (required)',
      forms: GINOMAI_FUTURE_MIDDLE_INDICATIVE },
    { chapter: 32, alwaysInclude: true, family: 'γίνομαι — present middle infinitive (required)',
      forms: GINOMAI_PRESENT_MIDDLE_INFINITIVE },
    { chapter: 22, alwaysInclude: true, family: 'γίνομαι — aorist middle indicative (2nd aorist, required)',
      forms: GINOMAI_AORIST_MIDDLE_INDICATIVE },
    { chapter: 32, alwaysInclude: true, family: 'γίνομαι — aorist middle infinitive γενέσθαι (required)',
      forms: GINOMAI_AORIST_MIDDLE_INFINITIVE },
    { chapter: 33, family: 'γίνομαι — present middle imperative (optional)',
      forms: GINOMAI_PRESENT_MIDDLE_IMPERATIVE },
    { chapter: 33, family: 'γίνομαι — aorist middle imperative (optional)',
      forms: GINOMAI_AORIST_MIDDLE_IMPERATIVE },
    { chapter: 24, alwaysInclude: true, family: 'γίνομαι — aorist passive indicative (required)',
      forms: GINOMAI_AORIST_PASSIVE_INDICATIVE },
    { chapter: 25, alwaysInclude: true, family: 'γίνομαι — perfect active indicative γέγονα (required)',
      forms: GINOMAI_PERFECT_ACTIVE_INDICATIVE }
  ];

  const GINOMAI_EXTRA_FORMS = {
    ...GINOMAI_PRESENT_MIDDLE_IMPERATIVE,
    ...GINOMAI_PRESENT_MIDDLE_INDICATIVE,
    ...GINOMAI_IMPERFECT_MIDDLE_INDICATIVE,
    ...GINOMAI_FUTURE_MIDDLE_INDICATIVE,
    ...GINOMAI_AORIST_MIDDLE_INDICATIVE,
    ...GINOMAI_AORIST_PASSIVE_INDICATIVE,
    ...GINOMAI_PERFECT_ACTIVE_INDICATIVE,
    ...GINOMAI_AORIST_MIDDLE_INFINITIVE,
    ...GINOMAI_PRESENT_MIDDLE_INFINITIVE,
    ...GINOMAI_AORIST_MIDDLE_IMPERATIVE
  };

  // ─── δίδωμι (μι-verb, "to give") ──────────────────────────────────
  //
  // Mounce drills present + aorist active indicative for δίδωμι in
  // Ch 34. The aorist active subjunctive/imperative/infinitive (δῶ /
  // δός / δοῦναι), aorist passive (ἐδόθην), and the participles are
  // either single-form stems or absent. These fill the non-indicative
  // gaps. δίδωμι's aorist is the κ-aorist ἔδωκα (athematic) — non-
  // indicative forms use the bare δο- stem (δῶ, δός, δοῦναι).

  const DIDOMI_AORIST_ACTIVE_SUBJUNCTIVE = {
    'δῶ':      'aorist active subjunctive first person singular',
    'δῷς':     'aorist active subjunctive second person singular',
    'δῷ':      'aorist active subjunctive third person singular',
    'δῶμεν':   'aorist active subjunctive first person plural',
    'δῶτε':    'aorist active subjunctive second person plural',
    'δῶσι':    'aorist active subjunctive third person plural',
    'δῶσιν':   'aorist active subjunctive third person plural'
  };

  const DIDOMI_AORIST_ACTIVE_IMPERATIVE = {
    'δός':       'aorist active imperative second person singular',
    'δότω':      'aorist active imperative third person singular',
    'δότε':      'aorist active imperative second person plural',
    'δότωσαν':   'aorist active imperative third person plural'
  };

  const DIDOMI_AORIST_ACTIVE_INFINITIVE = {
    'δοῦναι': 'aorist active infinitive'
  };

  const DIDOMI_AORIST_PASSIVE_INDICATIVE = {
    'ἐδόθην':    'aorist passive indicative first person singular',
    'ἐδόθης':    'aorist passive indicative second person singular',
    'ἐδόθη':     'aorist passive indicative third person singular',
    'ἐδόθημεν':  'aorist passive indicative first person plural',
    'ἐδόθητε':   'aorist passive indicative second person plural',
    'ἐδόθησαν':  'aorist passive indicative third person plural'
  };

  const DIDOMI_OPTIONAL_GROUPS = [
    { chapter: 35, alwaysInclude: true, family: 'δίδωμι — aorist active infinitive δοῦναι (required)',
      forms: DIDOMI_AORIST_ACTIVE_INFINITIVE },
    { chapter: 35, family: 'δίδωμι — aorist active imperative δός (optional)',
      forms: DIDOMI_AORIST_ACTIVE_IMPERATIVE },
    { chapter: 35, family: 'δίδωμι — aorist active subjunctive δῶ (optional)',
      forms: DIDOMI_AORIST_ACTIVE_SUBJUNCTIVE },
    { chapter: 34, alwaysInclude: true, family: 'δίδωμι — aorist passive indicative ἐδόθην (required)',
      forms: DIDOMI_AORIST_PASSIVE_INDICATIVE }
  ];

  const DIDOMI_EXTRA_FORMS = {
    ...DIDOMI_AORIST_ACTIVE_INFINITIVE,
    ...DIDOMI_AORIST_ACTIVE_IMPERATIVE,
    ...DIDOMI_AORIST_ACTIVE_SUBJUNCTIVE,
    ...DIDOMI_AORIST_PASSIVE_INDICATIVE
  };

  // ─── τίθημι (μι-verb, "to put/place") ─────────────────────────────
  //
  // Mounce drills only the present active system (Ch 36). Adds
  // imperfect/future/aorist active indicative, the aorist active
  // subjunctive/imperative/infinitive (θεῖναι, θές, θῶ), and the
  // aorist passive. τίθημι's aorist is ἔθηκα (κ-aorist) but the non-
  // indicative forms use the bare θε- stem (θῶ, θές, θεῖναι). Aorist
  // passive ἐτέθην uses θε- + the standard passive marker -θη-.

  const TITHEMI_IMPERFECT_ACTIVE_INDICATIVE = {
    'ἐτίθην':   'imperfect active indicative first person singular',
    'ἐτίθεις':  'imperfect active indicative second person singular',
    'ἐτίθει':   'imperfect active indicative third person singular',
    'ἐτίθεμεν': 'imperfect active indicative first person plural',
    'ἐτίθετε':  'imperfect active indicative second person plural',
    'ἐτίθεσαν': 'imperfect active indicative third person plural'
  };

  const TITHEMI_FUTURE_ACTIVE_INDICATIVE = {
    'θήσω':     'future active indicative first person singular',
    'θήσεις':   'future active indicative second person singular',
    'θήσει':    'future active indicative third person singular',
    'θήσομεν':  'future active indicative first person plural',
    'θήσετε':   'future active indicative second person plural',
    'θήσουσι':  'future active indicative third person plural',
    'θήσουσιν': 'future active indicative third person plural'
  };

  const TITHEMI_AORIST_ACTIVE_INDICATIVE = {
    'ἔθηκα':    'aorist active indicative first person singular',
    'ἔθηκας':   'aorist active indicative second person singular',
    'ἔθηκε':    'aorist active indicative third person singular',
    'ἔθηκεν':   'aorist active indicative third person singular',
    'ἐθήκαμεν': 'aorist active indicative first person plural',
    'ἐθήκατε':  'aorist active indicative second person plural',
    'ἔθηκαν':   'aorist active indicative third person plural'
  };

  const TITHEMI_AORIST_ACTIVE_SUBJUNCTIVE = {
    'θῶ':     'aorist active subjunctive first person singular',
    'θῇς':    'aorist active subjunctive second person singular',
    'θῇ':     'aorist active subjunctive third person singular',
    'θῶμεν':  'aorist active subjunctive first person plural',
    'θῆτε':   'aorist active subjunctive second person plural',
    'θῶσι':   'aorist active subjunctive third person plural',
    'θῶσιν':  'aorist active subjunctive third person plural'
  };

  const TITHEMI_AORIST_ACTIVE_IMPERATIVE = {
    'θές':       'aorist active imperative second person singular',
    'θέτω':      'aorist active imperative third person singular',
    'θέτε':      'aorist active imperative second person plural',
    'θέτωσαν':   'aorist active imperative third person plural'
  };

  const TITHEMI_AORIST_ACTIVE_INFINITIVE = {
    'θεῖναι': 'aorist active infinitive'
  };

  const TITHEMI_AORIST_PASSIVE_INDICATIVE = {
    'ἐτέθην':    'aorist passive indicative first person singular',
    'ἐτέθης':    'aorist passive indicative second person singular',
    'ἐτέθη':     'aorist passive indicative third person singular',
    'ἐτέθημεν':  'aorist passive indicative first person plural',
    'ἐτέθητε':   'aorist passive indicative second person plural',
    'ἐτέθησαν':  'aorist passive indicative third person plural'
  };

  const TITHEMI_OPTIONAL_GROUPS = [
    { chapter: 36, family: 'τίθημι — imperfect active indicative (optional)',
      forms: TITHEMI_IMPERFECT_ACTIVE_INDICATIVE },
    { chapter: 36, alwaysInclude: true, family: 'τίθημι — future active indicative (required)',
      forms: TITHEMI_FUTURE_ACTIVE_INDICATIVE },
    { chapter: 36, alwaysInclude: true, family: 'τίθημι — aorist active indicative ἔθηκα (required)',
      forms: TITHEMI_AORIST_ACTIVE_INDICATIVE },
    { chapter: 36, alwaysInclude: true, family: 'τίθημι — aorist active infinitive θεῖναι (required)',
      forms: TITHEMI_AORIST_ACTIVE_INFINITIVE },
    { chapter: 36, family: 'τίθημι — aorist active imperative θές (optional)',
      forms: TITHEMI_AORIST_ACTIVE_IMPERATIVE },
    { chapter: 36, family: 'τίθημι — aorist active subjunctive θῶ (optional)',
      forms: TITHEMI_AORIST_ACTIVE_SUBJUNCTIVE },
    { chapter: 36, alwaysInclude: true, family: 'τίθημι — aorist passive indicative ἐτέθην (required)',
      forms: TITHEMI_AORIST_PASSIVE_INDICATIVE }
  ];

  const TITHEMI_EXTRA_FORMS = {
    ...TITHEMI_IMPERFECT_ACTIVE_INDICATIVE,
    ...TITHEMI_FUTURE_ACTIVE_INDICATIVE,
    ...TITHEMI_AORIST_ACTIVE_INDICATIVE,
    ...TITHEMI_AORIST_ACTIVE_INFINITIVE,
    ...TITHEMI_AORIST_ACTIVE_IMPERATIVE,
    ...TITHEMI_AORIST_ACTIVE_SUBJUNCTIVE,
    ...TITHEMI_AORIST_PASSIVE_INDICATIVE
  };

  // ─── ἵστημι (μι-verb, "to stand/cause to stand") ──────────────────
  //
  // ἵστημι is the trickiest μι-verb because it has two distinct aorist
  // formations with different meanings:
  //   - 1st aorist ἔστησα (transitive: "I caused to stand / I set up")
  //   - 2nd aorist ἔστην (intransitive: "I stood")
  // Both are real Koine. Mounce drills only the present active system
  // (Ch 36); both aorist paradigms are absent. The intransitive 2nd
  // aorist is statistically more common in the NT.

  const HISTEMI_IMPERFECT_ACTIVE_INDICATIVE = {
    'ἵστην':   'imperfect active indicative first person singular',
    'ἵστης':   'imperfect active indicative second person singular',
    'ἵστη':    'imperfect active indicative third person singular',
    'ἵσταμεν': 'imperfect active indicative first person plural',
    'ἵστατε':  'imperfect active indicative second person plural',
    'ἵστασαν': 'imperfect active indicative third person plural'
  };

  const HISTEMI_FUTURE_ACTIVE_INDICATIVE = {
    'στήσω':     'future active indicative first person singular',
    'στήσεις':   'future active indicative second person singular',
    'στήσει':    'future active indicative third person singular',
    'στήσομεν':  'future active indicative first person plural',
    'στήσετε':   'future active indicative second person plural',
    'στήσουσι':  'future active indicative third person plural',
    'στήσουσιν': 'future active indicative third person plural'
  };

  const HISTEMI_FIRST_AORIST_ACTIVE_INDICATIVE = {
    'ἔστησα':    'aorist active indicative first person singular',
    'ἔστησας':   'aorist active indicative second person singular',
    'ἔστησε':    'aorist active indicative third person singular',
    'ἔστησεν':   'aorist active indicative third person singular',
    'ἐστήσαμεν': 'aorist active indicative first person plural',
    'ἐστήσατε':  'aorist active indicative second person plural',
    'ἔστησαν':   'aorist active indicative third person plural'
  };

  const HISTEMI_SECOND_AORIST_ACTIVE_INDICATIVE = {
    'ἔστην':    'aorist active indicative first person singular',
    'ἔστης':    'aorist active indicative second person singular',
    'ἔστη':     'aorist active indicative third person singular',
    'ἔστημεν':  'aorist active indicative first person plural',
    'ἔστητε':   'aorist active indicative second person plural'
    // 'ἔστησαν' 3pl collides with the 1st aorist 3pl above (1st & 2nd
    // syncretize at 3pl); the 1st aorist reading takes the key.
  };

  const HISTEMI_AORIST_INFINITIVES = {
    'στῆσαι': 'aorist active infinitive',  // 1st aorist (transitive)
    'στῆναι': 'aorist active infinitive'   // 2nd aorist (intransitive)
  };

  const HISTEMI_SECOND_AORIST_SUBJUNCTIVE = {
    'στῶ':    'aorist active subjunctive first person singular',
    'στῇς':   'aorist active subjunctive second person singular',
    'στῇ':    'aorist active subjunctive third person singular',
    'στῶμεν': 'aorist active subjunctive first person plural',
    'στῆτε':  'aorist active subjunctive second person plural',
    'στῶσι':  'aorist active subjunctive third person plural',
    'στῶσιν': 'aorist active subjunctive third person plural'
  };

  const HISTEMI_SECOND_AORIST_IMPERATIVE = {
    'στῆθι':     'aorist active imperative second person singular',
    'στήτω':     'aorist active imperative third person singular',
    'στῆτε':     'aorist active imperative second person plural',
    'στήτωσαν':  'aorist active imperative third person plural'
  };

  const HISTEMI_AORIST_PASSIVE_INDICATIVE = {
    'ἐστάθην':   'aorist passive indicative first person singular',
    'ἐστάθης':   'aorist passive indicative second person singular',
    'ἐστάθη':    'aorist passive indicative third person singular',
    'ἐστάθημεν': 'aorist passive indicative first person plural',
    'ἐστάθητε':  'aorist passive indicative second person plural',
    'ἐστάθησαν': 'aorist passive indicative third person plural'
  };

  // Perfect active (ἕστηκα, with present meaning "I am standing" — a
  // distinctive ἵστημι quirk).
  const HISTEMI_PERFECT_ACTIVE_INDICATIVE = {
    'ἕστηκα':    'perfect active indicative first person singular',
    'ἕστηκας':   'perfect active indicative second person singular',
    'ἕστηκε':    'perfect active indicative third person singular',
    'ἕστηκεν':   'perfect active indicative third person singular',
    'ἑστήκαμεν': 'perfect active indicative first person plural',
    'ἑστήκατε':  'perfect active indicative second person plural',
    'ἑστήκασι':  'perfect active indicative third person plural',
    'ἑστήκασιν': 'perfect active indicative third person plural'
  };

  const HISTEMI_OPTIONAL_GROUPS = [
    { chapter: 36, family: 'ἵστημι — imperfect active indicative (optional)',
      forms: HISTEMI_IMPERFECT_ACTIVE_INDICATIVE },
    { chapter: 36, alwaysInclude: true, family: 'ἵστημι — future active indicative στήσω (required)',
      forms: HISTEMI_FUTURE_ACTIVE_INDICATIVE },
    { chapter: 36, alwaysInclude: true, family: 'ἵστημι — 1st aorist active ἔστησα (transitive, required)',
      forms: HISTEMI_FIRST_AORIST_ACTIVE_INDICATIVE },
    { chapter: 36, alwaysInclude: true, family: 'ἵστημι — 2nd aorist active ἔστην (intransitive, required)',
      forms: HISTEMI_SECOND_AORIST_ACTIVE_INDICATIVE },
    { chapter: 36, alwaysInclude: true, family: 'ἵστημι — aorist active infinitives στῆσαι / στῆναι (required)',
      forms: HISTEMI_AORIST_INFINITIVES },
    { chapter: 36, family: 'ἵστημι — 2nd aorist active subjunctive στῶ (optional)',
      forms: HISTEMI_SECOND_AORIST_SUBJUNCTIVE },
    { chapter: 36, family: 'ἵστημι — 2nd aorist active imperative στῆθι (optional)',
      forms: HISTEMI_SECOND_AORIST_IMPERATIVE },
    { chapter: 36, alwaysInclude: true, family: 'ἵστημι — aorist passive indicative ἐστάθην (required)',
      forms: HISTEMI_AORIST_PASSIVE_INDICATIVE },
    { chapter: 36, alwaysInclude: true, family: 'ἵστημι — perfect active indicative ἕστηκα (required)',
      forms: HISTEMI_PERFECT_ACTIVE_INDICATIVE }
  ];

  const HISTEMI_EXTRA_FORMS = {
    ...HISTEMI_IMPERFECT_ACTIVE_INDICATIVE,
    ...HISTEMI_FUTURE_ACTIVE_INDICATIVE,
    ...HISTEMI_FIRST_AORIST_ACTIVE_INDICATIVE,
    ...HISTEMI_SECOND_AORIST_ACTIVE_INDICATIVE,
    ...HISTEMI_AORIST_INFINITIVES,
    ...HISTEMI_SECOND_AORIST_SUBJUNCTIVE,
    ...HISTEMI_SECOND_AORIST_IMPERATIVE,
    ...HISTEMI_AORIST_PASSIVE_INDICATIVE,
    ...HISTEMI_PERFECT_ACTIVE_INDICATIVE
  };

  // ─── Distinct vocative singulars for noun paradigm exemplars ──────
  //
  // Mounce intentionally skips vocatives across the noun paradigms.
  // For most nouns the vocative singular is syncretic with the
  // nominative singular (1st-decl fem, 2nd-decl neut, most 3rd-decl
  // stems), so a "vocative singular" pick on the drilled paradigm
  // resolves via the same Greek string under a different label. Worth
  // adding to extraForms only where the syncretism would confuse a
  // student looking for explicit confirmation.

  const LOGOS_VOCATIVE = {
    'λόγε': 'vocative singular masculine'
  };
  // 1st-decl masc. -ης nouns: vocative singular shortens to bare -α
  // (Mt 8:8-style κύριε ἐγὼ μαθητά … attested in NT). Not drilled in
  // the curriculum but appears in NT direct address — surface as an
  // extra form so a "vocative singular" pick resolves cleanly.
  const MATHETES_VOCATIVE = {
    'μαθητά': 'vocative singular masculine'
  };
  const MATHETES_VOC_PL_EXTRAS = {
    'μαθηταί': 'vocative plural masculine'
  };

  // ─── Participle full declensions ──────────────────────────────────
  //
  // Mounce drills full declensions for λύω's present + aorist active
  // participles, the present mid/pas participle (λυόμενος), and the
  // aorist passive participle λυθείς. Several gaps remain: 1st-aorist
  // active participle λύσας (only masc-nom drilled in S* sets), the
  // perfect active/middle-passive participles, future participles, and
  // the μι-verb participles (only single forms drilled). γίνομαι's
  // aorist middle γενόμενος is one of the most frequent participles in
  // the NT corpus.
  //
  // Form patterns: every participle paradigm declines on one of three
  // templates:
  //   - Regular -ος/-η/-ον (m/p participles, future middle): like
  //     λυόμενος — 2nd-decl masc/neut, 1st-decl fem.
  //   - 3rd-decl ντ-stem masc/neut + 1st-decl fem in -ουσα/-ασα/
  //     -εῖσα/-υῖα: active participles. Masc gen sg in -οντος, dat pl
  //     in -ουσι(ν) etc. (with stem-specific vowel).
  //   - 3rd-decl κ-stem masc/neut + 1st-decl fem in -υῖα: perfect
  //     active participles (λελυκώς-type).
  //
  // Each declension below names every unique form once; truly
  // syncretic slots (masc acc sg = neut nom/acc sg for ντ-stems;
  // gen sg masc = gen sg neut, etc.) get a single entry with the
  // composite parse string ("masculine/neuter").

  // λύω 1st aorist active participle λύσας — ντ-stem masc/neut + 1st-
  // decl -ασα fem. Mounce drills only the masc-nom forms (in the
  // λύω → λύσας paradigm card group); the full case/number declension
  // is real and common in the NT.
  const LUO_AORIST_ACTIVE_PARTICIPLE = {
    'λύσας':      'aorist active participle nominative singular masculine',
    'λύσαντος':   'aorist active participle genitive singular masculine/neuter',
    'λύσαντι':    'aorist active participle dative singular masculine/neuter',
    'λύσαντα':    'aorist active participle accusative singular masculine',
    'λύσαντες':   'aorist active participle nominative plural masculine',
    'λυσάντων':   'aorist active participle genitive plural masculine/feminine/neuter',
    'λύσασι':     'aorist active participle dative plural masculine/neuter',
    'λύσασιν':    'aorist active participle dative plural masculine/neuter',
    'λύσαντας':   'aorist active participle accusative plural masculine',
    'λύσασα':     'aorist active participle nominative singular feminine',
    'λυσάσης':    'aorist active participle genitive singular feminine',
    'λυσάσῃ':     'aorist active participle dative singular feminine',
    'λύσασαν':    'aorist active participle accusative singular feminine',
    'λύσασαι':    'aorist active participle nominative plural feminine',
    'λυσασῶν':    'aorist active participle genitive plural feminine',
    'λυσάσαις':   'aorist active participle dative plural feminine',
    'λυσάσας':    'aorist active participle accusative plural feminine',
    'λῦσαν':      'aorist active participle nominative/accusative singular neuter'
  };

  // λύω perfect active participle λελυκώς — 3rd-decl κ-stem masc/neut
  // + 1st-decl -υῖα fem.
  const LUO_PERFECT_ACTIVE_PARTICIPLE = {
    'λελυκώς':    'perfect active participle nominative singular masculine',
    'λελυκότος':  'perfect active participle genitive singular masculine/neuter',
    'λελυκότι':   'perfect active participle dative singular masculine/neuter',
    'λελυκότα':   'perfect active participle accusative singular masculine',
    'λελυκότες':  'perfect active participle nominative plural masculine',
    'λελυκότων':  'perfect active participle genitive plural masculine/feminine/neuter',
    'λελυκόσι':   'perfect active participle dative plural masculine/neuter',
    'λελυκόσιν':  'perfect active participle dative plural masculine/neuter',
    'λελυκότας':  'perfect active participle accusative plural masculine',
    'λελυκυῖα':   'perfect active participle nominative singular feminine',
    'λελυκυίας':  'perfect active participle genitive singular feminine',
    'λελυκυίᾳ':   'perfect active participle dative singular feminine',
    'λελυκυῖαν':  'perfect active participle accusative singular feminine',
    'λελυκυῖαι':  'perfect active participle nominative plural feminine',
    'λελυκυιῶν':  'perfect active participle genitive plural feminine',
    'λελυκυίαις': 'perfect active participle dative plural feminine',
    'λελυκός':    'perfect active participle nominative/accusative singular neuter'
  };

  // λύω perfect middle/passive participle λελυμένος — regular -ος/-η/
  // -ον adjectival, like λυόμενος.
  const LUO_PERFECT_MP_PARTICIPLE = {
    'λελυμένος':  'perfect middle/passive participle nominative singular masculine',
    'λελυμένου':  'perfect middle/passive participle genitive singular masculine/neuter',
    'λελυμένῳ':   'perfect middle/passive participle dative singular masculine/neuter',
    'λελυμένον':  'perfect middle/passive participle accusative singular masculine/neuter',
    'λελυμένε':   'perfect middle/passive participle vocative singular masculine',
    'λελυμένοι':  'perfect middle/passive participle nominative plural masculine',
    'λελυμένους': 'perfect middle/passive participle accusative plural masculine',
    'λελυμένων':  'perfect middle/passive participle genitive plural masculine/feminine/neuter',
    'λελυμένοις': 'perfect middle/passive participle dative plural masculine/neuter',
    'λελυμένη':   'perfect middle/passive participle nominative singular feminine',
    'λελυμένης':  'perfect middle/passive participle genitive singular feminine',
    'λελυμένῃ':   'perfect middle/passive participle dative singular feminine',
    'λελυμένην':  'perfect middle/passive participle accusative singular feminine',
    'λελυμέναι':  'perfect middle/passive participle nominative plural feminine',
    'λελυμέναις': 'perfect middle/passive participle dative plural feminine',
    'λελυμένας':  'perfect middle/passive participle accusative plural feminine',
    'λελυμένα':   'perfect middle/passive participle nominative/accusative plural neuter'
  };

  // γίνομαι aorist middle participle γενόμενος — declines like
  // λυόμενος (regular -ος/-η/-ον adjectival). Extremely common in NT.
  const GINOMAI_AORIST_MIDDLE_PARTICIPLE = {
    'γενόμενος':  'aorist middle participle nominative singular masculine',
    'γενομένου':  'aorist middle participle genitive singular masculine/neuter',
    'γενομένῳ':   'aorist middle participle dative singular masculine/neuter',
    'γενόμενον':  'aorist middle participle accusative singular masculine/neuter',
    'γενόμενε':   'aorist middle participle vocative singular masculine',
    'γενόμενοι':  'aorist middle participle nominative plural masculine',
    'γενομένους': 'aorist middle participle accusative plural masculine',
    'γενομένων':  'aorist middle participle genitive plural masculine/feminine/neuter',
    'γενομένοις': 'aorist middle participle dative plural masculine/neuter',
    'γενομένη':   'aorist middle participle nominative singular feminine',
    'γενομένης':  'aorist middle participle genitive singular feminine',
    'γενομένῃ':   'aorist middle participle dative singular feminine',
    'γενομένην':  'aorist middle participle accusative singular feminine',
    'γενόμεναι':  'aorist middle participle nominative plural feminine',
    'γενομέναις': 'aorist middle participle dative plural feminine',
    'γενομένας':  'aorist middle participle accusative plural feminine',
    'γενόμενα':   'aorist middle participle nominative/accusative plural neuter'
  };

  // γίνομαι perfect active participle γεγονώς — declines like λελυκώς
  // (3rd-decl κ-stem masc/neut, 1st-decl fem in -υῖα).
  const GINOMAI_PERFECT_ACTIVE_PARTICIPLE = {
    'γεγονώς':    'perfect active participle nominative singular masculine',
    'γεγονότος':  'perfect active participle genitive singular masculine/neuter',
    'γεγονότι':   'perfect active participle dative singular masculine/neuter',
    'γεγονότα':   'perfect active participle accusative singular masculine',
    'γεγονότες':  'perfect active participle nominative plural masculine',
    'γεγονότων':  'perfect active participle genitive plural masculine/feminine/neuter',
    'γεγονόσι':   'perfect active participle dative plural masculine/neuter',
    'γεγονόσιν':  'perfect active participle dative plural masculine/neuter',
    'γεγονότας':  'perfect active participle accusative plural masculine',
    'γεγονυῖα':   'perfect active participle nominative singular feminine',
    'γεγονυίας':  'perfect active participle genitive singular feminine',
    'γεγονυίᾳ':   'perfect active participle dative singular feminine',
    'γεγονυῖαν':  'perfect active participle accusative singular feminine',
    'γεγονυῖαι':  'perfect active participle nominative plural feminine',
    'γεγονυιῶν':  'perfect active participle genitive plural feminine',
    'γεγονυίαις': 'perfect active participle dative plural feminine',
    'γεγονός':    'perfect active participle nominative/accusative singular neuter'
  };

  // ─── μι-verb participle full declensions ──────────────────────────
  //
  // Mounce drills only the bare stem form (masc nom sg, sometimes
  // gender alternates) for each μι-verb participle. Full case/number
  // declensions exist and are common in the NT. All follow the same
  // ντ-stem pattern as λύων but with stem-specific vowel: ο/ου for
  // δίδωμι, ε/ει for τίθημι, α for ἵστημι.

  const DIDOMI_PRESENT_ACTIVE_PARTICIPLE = {
    'διδούς':     'present active participle nominative singular masculine',
    'διδόντος':   'present active participle genitive singular masculine/neuter',
    'διδόντι':    'present active participle dative singular masculine/neuter',
    'διδόντα':    'present active participle accusative singular masculine',
    'διδόντες':   'present active participle nominative plural masculine',
    'διδόντων':   'present active participle genitive plural masculine/feminine/neuter',
    'διδοῦσι':    'present active participle dative plural masculine/neuter',
    'διδοῦσιν':   'present active participle dative plural masculine/neuter',
    'διδόντας':   'present active participle accusative plural masculine',
    'διδοῦσα':    'present active participle nominative singular feminine',
    'διδούσης':   'present active participle genitive singular feminine',
    'διδούσῃ':    'present active participle dative singular feminine',
    'διδοῦσαν':   'present active participle accusative singular feminine',
    'διδοῦσαι':   'present active participle nominative plural feminine',
    'διδουσῶν':   'present active participle genitive plural feminine',
    'διδούσαις':  'present active participle dative plural feminine',
    'διδούσας':   'present active participle accusative plural feminine',
    'διδόν':      'present active participle nominative/accusative singular neuter'
  };

  const DIDOMI_AORIST_ACTIVE_PARTICIPLE = {
    'δούς':     'aorist active participle nominative singular masculine',
    'δόντος':   'aorist active participle genitive singular masculine/neuter',
    'δόντι':    'aorist active participle dative singular masculine/neuter',
    'δόντα':    'aorist active participle accusative singular masculine',
    'δόντες':   'aorist active participle nominative plural masculine',
    'δόντων':   'aorist active participle genitive plural masculine/feminine/neuter',
    'δοῦσι':    'aorist active participle dative plural masculine/neuter',
    'δοῦσιν':   'aorist active participle dative plural masculine/neuter',
    'δόντας':   'aorist active participle accusative plural masculine',
    'δοῦσα':    'aorist active participle nominative singular feminine',
    'δούσης':   'aorist active participle genitive singular feminine',
    'δούσῃ':    'aorist active participle dative singular feminine',
    'δοῦσαν':   'aorist active participle accusative singular feminine',
    'δοῦσαι':   'aorist active participle nominative plural feminine',
    'δουσῶν':   'aorist active participle genitive plural feminine',
    'δούσαις':  'aorist active participle dative plural feminine',
    'δούσας':   'aorist active participle accusative plural feminine',
    'δόν':      'aorist active participle nominative/accusative singular neuter'
  };

  const TITHEMI_PRESENT_ACTIVE_PARTICIPLE = {
    'τιθείς':     'present active participle nominative singular masculine',
    'τιθέντος':   'present active participle genitive singular masculine/neuter',
    'τιθέντι':    'present active participle dative singular masculine/neuter',
    'τιθέντα':    'present active participle accusative singular masculine',
    'τιθέντες':   'present active participle nominative plural masculine',
    'τιθέντων':   'present active participle genitive plural masculine/feminine/neuter',
    'τιθεῖσι':    'present active participle dative plural masculine/neuter',
    'τιθεῖσιν':   'present active participle dative plural masculine/neuter',
    'τιθέντας':   'present active participle accusative plural masculine',
    'τιθεῖσα':    'present active participle nominative singular feminine',
    'τιθείσης':   'present active participle genitive singular feminine',
    'τιθείσῃ':    'present active participle dative singular feminine',
    'τιθεῖσαν':   'present active participle accusative singular feminine',
    'τιθεῖσαι':   'present active participle nominative plural feminine',
    'τιθεισῶν':   'present active participle genitive plural feminine',
    'τιθείσαις':  'present active participle dative plural feminine',
    'τιθείσας':   'present active participle accusative plural feminine',
    'τιθέν':      'present active participle nominative/accusative singular neuter'
  };

  const TITHEMI_AORIST_ACTIVE_PARTICIPLE = {
    'θείς':     'aorist active participle nominative singular masculine',
    'θέντος':   'aorist active participle genitive singular masculine/neuter',
    'θέντι':    'aorist active participle dative singular masculine/neuter',
    'θέντα':    'aorist active participle accusative singular masculine',
    'θέντες':   'aorist active participle nominative plural masculine',
    'θέντων':   'aorist active participle genitive plural masculine/feminine/neuter',
    'θεῖσι':    'aorist active participle dative plural masculine/neuter',
    'θεῖσιν':   'aorist active participle dative plural masculine/neuter',
    'θέντας':   'aorist active participle accusative plural masculine',
    'θεῖσα':    'aorist active participle nominative singular feminine',
    'θείσης':   'aorist active participle genitive singular feminine',
    'θείσῃ':    'aorist active participle dative singular feminine',
    'θεῖσαν':   'aorist active participle accusative singular feminine',
    'θεῖσαι':   'aorist active participle nominative plural feminine',
    'θεισῶν':   'aorist active participle genitive plural feminine',
    'θείσαις':  'aorist active participle dative plural feminine',
    'θείσας':   'aorist active participle accusative plural feminine',
    'θέν':      'aorist active participle nominative/accusative singular neuter'
  };

  const HISTEMI_PRESENT_ACTIVE_PARTICIPLE = {
    'ἱστάς':     'present active participle nominative singular masculine',
    'ἱστάντος':  'present active participle genitive singular masculine/neuter',
    'ἱστάντι':   'present active participle dative singular masculine/neuter',
    'ἱστάντα':   'present active participle accusative singular masculine',
    'ἱστάντες':  'present active participle nominative plural masculine',
    'ἱστάντων':  'present active participle genitive plural masculine/feminine/neuter',
    'ἱστᾶσι':    'present active participle dative plural masculine/neuter',
    'ἱστᾶσιν':   'present active participle dative plural masculine/neuter',
    'ἱστάντας':  'present active participle accusative plural masculine',
    'ἱστᾶσα':    'present active participle nominative singular feminine',
    'ἱστάσης':   'present active participle genitive singular feminine',
    'ἱστάσῃ':    'present active participle dative singular feminine',
    'ἱστᾶσαν':   'present active participle accusative singular feminine',
    'ἱστᾶσαι':   'present active participle nominative plural feminine',
    'ἱστασῶν':   'present active participle genitive plural feminine',
    'ἱστάσαις':  'present active participle dative plural feminine',
    'ἱστάσας':   'present active participle accusative plural feminine',
    'ἱστάν':     'present active participle nominative/accusative singular neuter'
  };

  // ἵστημι 2nd aorist active participle στάς (intransitive — having
  // stood). Statistically more common in the NT than the 1st-aorist
  // στήσας (transitive — having set up).
  const HISTEMI_SECOND_AORIST_ACTIVE_PARTICIPLE = {
    'στάς':     'aorist active participle nominative singular masculine',
    'στάντος':  'aorist active participle genitive singular masculine/neuter',
    'στάντι':   'aorist active participle dative singular masculine/neuter',
    'στάντα':   'aorist active participle accusative singular masculine',
    'στάντες':  'aorist active participle nominative plural masculine',
    'στάντων':  'aorist active participle genitive plural masculine/feminine/neuter',
    'στᾶσι':    'aorist active participle dative plural masculine/neuter',
    'στᾶσιν':   'aorist active participle dative plural masculine/neuter',
    'στάντας':  'aorist active participle accusative plural masculine',
    'στᾶσα':    'aorist active participle nominative singular feminine',
    'στάσης':   'aorist active participle genitive singular feminine',
    'στάσῃ':    'aorist active participle dative singular feminine',
    'στᾶσαν':   'aorist active participle accusative singular feminine',
    'στᾶσαι':   'aorist active participle nominative plural feminine',
    'στασῶν':   'aorist active participle genitive plural feminine',
    'στάσαις':  'aorist active participle dative plural feminine',
    'στάσας':   'aorist active participle accusative plural feminine',
    'στάν':     'aorist active participle nominative/accusative singular neuter'
  };

  // ἵστημι perfect active participle ἑστηκώς (standing — with present
  // meaning, matching ἕστηκα).
  const HISTEMI_PERFECT_ACTIVE_PARTICIPLE = {
    'ἑστηκώς':    'perfect active participle nominative singular masculine',
    'ἑστηκότος':  'perfect active participle genitive singular masculine/neuter',
    'ἑστηκότι':   'perfect active participle dative singular masculine/neuter',
    'ἑστηκότα':   'perfect active participle accusative singular masculine',
    'ἑστηκότες':  'perfect active participle nominative plural masculine',
    'ἑστηκότων':  'perfect active participle genitive plural masculine/feminine/neuter',
    'ἑστηκόσι':   'perfect active participle dative plural masculine/neuter',
    'ἑστηκόσιν':  'perfect active participle dative plural masculine/neuter',
    'ἑστηκότας':  'perfect active participle accusative plural masculine',
    'ἑστηκυῖα':   'perfect active participle nominative singular feminine',
    'ἑστηκυίας':  'perfect active participle genitive singular feminine',
    'ἑστηκυίᾳ':   'perfect active participle dative singular feminine',
    'ἑστηκυῖαν':  'perfect active participle accusative singular feminine',
    'ἑστηκυῖαι':  'perfect active participle nominative plural feminine',
    'ἑστηκυιῶν':  'perfect active participle genitive plural feminine',
    'ἑστηκυίαις': 'perfect active participle dative plural feminine',
    'ἑστηκός':    'perfect active participle nominative/accusative singular neuter'
  };

  // ─── λύω future participles (rare in NT but morphologically real) ─

  const LUO_FUTURE_ACTIVE_PARTICIPLE = {
    'λύσων':      'future active participle nominative singular masculine',
    'λύσοντος':   'future active participle genitive singular masculine/neuter',
    'λύσοντι':    'future active participle dative singular masculine/neuter',
    'λύσοντα':    'future active participle accusative singular masculine',
    'λύσοντες':   'future active participle nominative plural masculine',
    'λυσόντων':   'future active participle genitive plural masculine/feminine/neuter',
    'λύσουσι':    'future active participle dative plural masculine/neuter',
    'λύσουσιν':   'future active participle dative plural masculine/neuter',
    'λύσοντας':   'future active participle accusative plural masculine',
    'λύσουσα':    'future active participle nominative singular feminine',
    'λυσούσης':   'future active participle genitive singular feminine',
    'λυσούσῃ':    'future active participle dative singular feminine',
    'λύσουσαν':   'future active participle accusative singular feminine',
    'λύσουσαι':   'future active participle nominative plural feminine',
    'λυσουσῶν':   'future active participle genitive plural feminine',
    'λυσούσαις':  'future active participle dative plural feminine',
    'λυσούσας':   'future active participle accusative plural feminine',
    'λῦσον':      'future active participle nominative/accusative singular neuter'
  };

  const LUO_FUTURE_MIDDLE_PARTICIPLE = {
    'λυσόμενος':  'future middle participle nominative singular masculine',
    'λυσομένου':  'future middle participle genitive singular masculine/neuter',
    'λυσομένῳ':   'future middle participle dative singular masculine/neuter',
    'λυσόμενον':  'future middle participle accusative singular masculine/neuter',
    'λυσόμενοι':  'future middle participle nominative plural masculine',
    'λυσομένους': 'future middle participle accusative plural masculine',
    'λυσομένων':  'future middle participle genitive plural masculine/feminine/neuter',
    'λυσομένοις': 'future middle participle dative plural masculine/neuter',
    'λυσομένη':   'future middle participle nominative singular feminine',
    'λυσομένης':  'future middle participle genitive singular feminine',
    'λυσομένῃ':   'future middle participle dative singular feminine',
    'λυσομένην':  'future middle participle accusative singular feminine',
    'λυσόμεναι':  'future middle participle nominative plural feminine',
    'λυσομέναις': 'future middle participle dative plural feminine',
    'λυσομένας':  'future middle participle accusative plural feminine',
    'λυσόμενα':   'future middle participle nominative/accusative plural neuter'
  };

  const LUO_FUTURE_PASSIVE_PARTICIPLE = {
    'λυθησόμενος':  'future passive participle nominative singular masculine',
    'λυθησομένου':  'future passive participle genitive singular masculine/neuter',
    'λυθησομένῳ':   'future passive participle dative singular masculine/neuter',
    'λυθησόμενον':  'future passive participle accusative singular masculine/neuter',
    'λυθησόμενοι':  'future passive participle nominative plural masculine',
    'λυθησομένους': 'future passive participle accusative plural masculine',
    'λυθησομένων':  'future passive participle genitive plural masculine/feminine/neuter',
    'λυθησομένοις': 'future passive participle dative plural masculine/neuter',
    'λυθησομένη':   'future passive participle nominative singular feminine',
    'λυθησομένης':  'future passive participle genitive singular feminine',
    'λυθησομένῃ':   'future passive participle dative singular feminine',
    'λυθησομένην':  'future passive participle accusative singular feminine',
    'λυθησόμεναι':  'future passive participle nominative plural feminine',
    'λυθησομέναις': 'future passive participle dative plural feminine',
    'λυθησομένας':  'future passive participle accusative plural feminine',
    'λυθησόμενα':   'future passive participle nominative/accusative plural neuter'
  };

  // λύω present middle/passive participle λυόμενος and aorist middle participle
  // λυσάμενος — the -μενος (2-1-2 adjectival) declensions, recessive accent
  // (menosParticipleParadigm applies, unlike the persistent-penult perfect m/p
  // λελυμένος above which is spelled out by hand). λύω drills only a 5-form
  // recognition SUBSET of λυόμενος (nom/gen/acc sg masc + nom/gen sg fem, the
  // S27_PRES_PTC_MIDPAS card) and no aorist middle participle at all (λυσάμενος
  // ships only as a grammar example). Both full declensions are added here as
  // optional groups + extraForms (so the wrong-parse "Your parse" lookup can
  // reconstruct any picked slot), mirroring the contract verbs ἀγαπάω/ποιέω/
  // πληρόω whose present m/p participles got the same treatment — λύω, the
  // model verb, was the odd one out. The drilled S27 recognition forms are
  // superseded by per-form dedup, so only the remaining slots surface as cards.
  // Gated like the matching concrete forms: present m/p participle at Ch 27
  // (= the S27 card / the contract verbs), aorist middle participle at Ch 28
  // (= γίνομαι's γενόμενος and λύω's aorist active λύσας).
  const LUO_PRESENT_MP_PARTICIPLE =
    menosParticipleParadigm('λυό', 'λυο', 'present middle/passive participle');
  const LUO_AORIST_MIDDLE_PARTICIPLE =
    menosParticipleParadigm('λυσά', 'λυσα', 'aorist middle participle');
  // Present active λύων (3-1-3 ντ-stem, recessive) and 1st-aorist passive λυθείς
  // (θ-type) full declensions — the model verb's two remaining participle grids,
  // promoted to REQUIRED below (Mounce drills the full participle paradigm of λύω).
  const LUO_PRESENT_ACTIVE_PARTICIPLE =
    presentActiveNtParticiple('λύ', 'λυ', 'λῦον');
  const LUO_AORIST_PASSIVE_PARTICIPLE =
    aoristPassiveParticipleParadigm('λυ');

  // Participle groups, gated by max(tense-intro, ptc-intro). The seven λύω
  // participle declensions Mounce teaches as paradigm tables are marked
  // `alwaysInclude: true` — they're REQUIRED (drilled by default, not behind the
  // optional-extensions toggle). The rare future participles stay toggle-gated.
  const LUO_PARTICIPLE_OPTIONAL = [
    { chapter: 27, alwaysInclude: true, family: 'λύω — present active participle λύων full declension',
      forms: LUO_PRESENT_ACTIVE_PARTICIPLE },
    { chapter: 27, alwaysInclude: true, family: 'λύω — present middle/passive participle λυόμενος full declension',
      forms: LUO_PRESENT_MP_PARTICIPLE },
    { chapter: 28, alwaysInclude: true, family: 'λύω — 1st aorist active participle λύσας full declension',
      forms: LUO_AORIST_ACTIVE_PARTICIPLE },
    { chapter: 28, alwaysInclude: true, family: 'λύω — aorist middle participle λυσάμενος full declension',
      forms: LUO_AORIST_MIDDLE_PARTICIPLE },
    { chapter: 28, alwaysInclude: true, family: 'λύω — 1st aorist passive participle λυθείς full declension',
      forms: LUO_AORIST_PASSIVE_PARTICIPLE },
    { chapter: 30, alwaysInclude: true, family: 'λύω — perfect active participle λελυκώς full declension',
      forms: LUO_PERFECT_ACTIVE_PARTICIPLE },
    { chapter: 30, alwaysInclude: true, family: 'λύω — perfect middle/passive participle λελυμένος full declension',
      forms: LUO_PERFECT_MP_PARTICIPLE },
    { chapter: 27, family: 'λύω — future active participle λύσων (optional, rare)',
      forms: LUO_FUTURE_ACTIVE_PARTICIPLE },
    { chapter: 27, family: 'λύω — future middle participle λυσόμενος (optional, rare)',
      forms: LUO_FUTURE_MIDDLE_PARTICIPLE },
    { chapter: 28, family: 'λύω — future passive participle λυθησόμενος (optional, rare)',
      forms: LUO_FUTURE_PASSIVE_PARTICIPLE }
  ];

  const GINOMAI_PARTICIPLE_OPTIONAL = [
    { chapter: 28, family: 'γίνομαι — aorist middle participle γενόμενος (optional)',
      forms: GINOMAI_AORIST_MIDDLE_PARTICIPLE },
    { chapter: 30, family: 'γίνομαι — perfect active participle γεγονώς (optional)',
      forms: GINOMAI_PERFECT_ACTIVE_PARTICIPLE }
  ];

  const DIDOMI_PARTICIPLE_OPTIONAL = [
    { chapter: 35, family: 'δίδωμι — present active participle διδούς full declension (optional)',
      forms: DIDOMI_PRESENT_ACTIVE_PARTICIPLE },
    { chapter: 35, family: 'δίδωμι — aorist active participle δούς full declension (optional)',
      forms: DIDOMI_AORIST_ACTIVE_PARTICIPLE }
  ];

  const TITHEMI_PARTICIPLE_OPTIONAL = [
    { chapter: 36, family: 'τίθημι — present active participle τιθείς full declension (optional)',
      forms: TITHEMI_PRESENT_ACTIVE_PARTICIPLE },
    { chapter: 36, family: 'τίθημι — aorist active participle θείς full declension (optional)',
      forms: TITHEMI_AORIST_ACTIVE_PARTICIPLE }
  ];

  const HISTEMI_PARTICIPLE_OPTIONAL = [
    { chapter: 36, family: 'ἵστημι — present active participle ἱστάς full declension (optional)',
      forms: HISTEMI_PRESENT_ACTIVE_PARTICIPLE },
    { chapter: 36, family: 'ἵστημι — 2nd aorist active participle στάς full declension (optional)',
      forms: HISTEMI_SECOND_AORIST_ACTIVE_PARTICIPLE },
    { chapter: 36, family: 'ἵστημι — perfect active participle ἑστηκώς full declension (optional)',
      forms: HISTEMI_PERFECT_ACTIVE_PARTICIPLE }
  ];

  // ─── Aorist passive participles ───────────────────────────────────
  //
  // Each major verb has an aorist passive participle following the
  // λυθείς paradigm (3rd-decl ντ-stem masc/neut with -θεις/-θεντος;
  // 1st-decl -θεῖσα fem). Stems shift per the verb's principal-part
  // formation: γενη-θ-, δο-θ-, τε-θ-, στα-θ-. All are real Koine and
  // common in the NT (γενηθεὶς "having become", δοθείς "having been
  // given", σταθείς "having been placed/stood"). Gated at the chapter
  // the lemma's aor passive is introduced (γίνομαι: 24, δίδωμι: 34,
  // τίθημι/ἵστημι: 36).

  function aoristPassiveParticipleParadigm(stem) {
    const s = stem;
    return {
      [`${s}θείς`]:     'aorist passive participle nominative singular masculine',
      [`${s}θέντος`]:   'aorist passive participle genitive singular masculine/neuter',
      [`${s}θέντι`]:    'aorist passive participle dative singular masculine/neuter',
      [`${s}θέντα`]:    'aorist passive participle accusative singular masculine',
      [`${s}θέντες`]:   'aorist passive participle nominative plural masculine',
      [`${s}θέντων`]:   'aorist passive participle genitive plural masculine/feminine/neuter',
      [`${s}θεῖσι`]:    'aorist passive participle dative plural masculine/neuter',
      [`${s}θεῖσιν`]:   'aorist passive participle dative plural masculine/neuter',
      [`${s}θέντας`]:   'aorist passive participle accusative plural masculine',
      [`${s}θεῖσα`]:    'aorist passive participle nominative singular feminine',
      [`${s}θείσης`]:   'aorist passive participle genitive singular feminine',
      [`${s}θείσῃ`]:    'aorist passive participle dative singular feminine',
      [`${s}θεῖσαν`]:   'aorist passive participle accusative singular feminine',
      [`${s}θεῖσαι`]:   'aorist passive participle nominative plural feminine',
      [`${s}θεισῶν`]:   'aorist passive participle genitive plural feminine',
      [`${s}θείσαις`]:  'aorist passive participle dative plural feminine',
      [`${s}θείσας`]:   'aorist passive participle accusative plural feminine',
      [`${s}θέν`]:      'aorist passive participle nominative/accusative singular neuter'
    };
  }

  const GINOMAI_AORIST_PASSIVE_PARTICIPLE = aoristPassiveParticipleParadigm('γενη');
  const DIDOMI_AORIST_PASSIVE_PARTICIPLE  = aoristPassiveParticipleParadigm('δο');
  const TITHEMI_AORIST_PASSIVE_PARTICIPLE = aoristPassiveParticipleParadigm('τε');
  const HISTEMI_AORIST_PASSIVE_PARTICIPLE = aoristPassiveParticipleParadigm('στα');

  // ─── Thematic active participles (-ων / -ας types) ─────────────────
  //
  // The 2nd-aorist active participle (λαβών, λιπών) declines like the
  // present active participle in endings but is oxytone (accent on the
  // ending): -ών/-όντος masc/neut, -οῦσα/-ούσης fem, -όν neut. Built from
  // the bare aorist stem (λαβ-, λιπ-). Distinct from the 1st-aorist -σας/
  // -σαντος type (λύσας) and the μι-verb στάς type.
  function aoristActiveParticipleParadigm(stem) {
    const s = stem;
    return {
      [`${s}ών`]:      'aorist active participle nominative singular masculine',
      [`${s}όντος`]:   'aorist active participle genitive singular masculine/neuter',
      [`${s}όντι`]:    'aorist active participle dative singular masculine/neuter',
      [`${s}όντα`]:    'aorist active participle accusative singular masculine',
      [`${s}όντες`]:   'aorist active participle nominative plural masculine',
      [`${s}όντων`]:   'aorist active participle genitive plural masculine/feminine/neuter',
      [`${s}οῦσι`]:    'aorist active participle dative plural masculine/neuter',
      [`${s}οῦσιν`]:   'aorist active participle dative plural masculine/neuter',
      [`${s}όντας`]:   'aorist active participle accusative plural masculine',
      [`${s}οῦσα`]:    'aorist active participle nominative singular feminine',
      [`${s}ούσης`]:   'aorist active participle genitive singular feminine',
      [`${s}ούσῃ`]:    'aorist active participle dative singular feminine',
      [`${s}οῦσαν`]:   'aorist active participle accusative singular feminine',
      [`${s}οῦσαι`]:   'aorist active participle nominative plural feminine',
      [`${s}ουσῶν`]:   'aorist active participle genitive plural feminine',
      [`${s}ούσαις`]:  'aorist active participle dative plural feminine',
      [`${s}ούσας`]:   'aorist active participle accusative plural feminine',
      [`${s}όν`]:      'aorist active participle nominative/accusative singular neuter'
    };
  }

  // Present active participle (-ων type, recessive accent). accStem carries
  // the verb's normal accent (λαμβάν-), bareStem is unaccented for the cells
  // whose accent shifts onto the ending (gen pl, fem oblique), and neuter is
  // the nom/acc sg neuter literal (λαμβάνον).
  function presentActiveNtParticiple(accStem, bareStem, neuter) {
    const a = accStem, b = bareStem;
    return {
      [`${a}ων`]:     'present active participle nominative singular masculine',
      [`${a}οντος`]:  'present active participle genitive singular masculine/neuter',
      [`${a}οντι`]:   'present active participle dative singular masculine/neuter',
      [`${a}οντα`]:   'present active participle accusative singular masculine',
      [`${a}οντες`]:  'present active participle nominative plural masculine',
      [`${b}όντων`]:  'present active participle genitive plural masculine/feminine/neuter',
      [`${a}ουσι`]:   'present active participle dative plural masculine/neuter',
      [`${a}ουσιν`]:  'present active participle dative plural masculine/neuter',
      [`${a}οντας`]:  'present active participle accusative plural masculine',
      [`${a}ουσα`]:   'present active participle nominative singular feminine',
      [`${b}ούσης`]:  'present active participle genitive singular feminine',
      [`${b}ούσῃ`]:   'present active participle dative singular feminine',
      [`${a}ουσαν`]:  'present active participle accusative singular feminine',
      [`${a}ουσαι`]:  'present active participle nominative plural feminine',
      [`${b}ουσῶν`]:  'present active participle genitive plural feminine',
      [`${b}ούσαις`]: 'present active participle dative plural feminine',
      [`${b}ούσας`]:  'present active participle accusative plural feminine',
      [neuter]:       'present active participle nominative/accusative singular neuter'
    };
  }

  // -μενος middle/passive participle (regular 2-1-2 adjective, λυόμενος
  // pattern). accStem carries the accent on the connecting vowel for the
  // short-ultima cells (nom/acc, -οι/-αι/-α, voc), bareStem is unaccented for
  // the long-ultima cells where the accent shifts onto -μέν-. Works for plain
  // stems (accStem 'λυό' / bareStem 'λυο' → λυόμενος…) and for contract verbs
  // whose connecting vowel has already contracted (accStem 'ἀγαπώ' / bareStem
  // 'ἀγαπω' → ἀγαπώμενος, ἀγαπωμένου, …).
  function menosParticipleParadigm(accStem, bareStem, label) {
    const a = accStem, b = bareStem, L = label;
    return {
      [`${a}μενος`]:  `${L} nominative singular masculine`,
      [`${b}μένου`]:  `${L} genitive singular masculine/neuter`,
      [`${b}μένῳ`]:   `${L} dative singular masculine/neuter`,
      [`${a}μενον`]:  `${L} accusative singular masculine/neuter`,
      [`${a}μενε`]:   `${L} vocative singular masculine`,
      [`${a}μενοι`]:  `${L} nominative plural masculine`,
      [`${b}μένους`]: `${L} accusative plural masculine`,
      [`${b}μένων`]:  `${L} genitive plural masculine/feminine/neuter`,
      [`${b}μένοις`]: `${L} dative plural masculine/neuter`,
      [`${b}μένη`]:   `${L} nominative singular feminine`,
      [`${b}μένης`]:  `${L} genitive singular feminine`,
      [`${b}μένῃ`]:   `${L} dative singular feminine`,
      [`${b}μένην`]:  `${L} accusative singular feminine`,
      [`${a}μεναι`]:  `${L} nominative plural feminine`,
      [`${b}μέναις`]: `${L} dative plural feminine`,
      [`${b}μένας`]:  `${L} accusative plural feminine`,
      [`${a}μενα`]:   `${L} nominative/accusative plural neuter`
    };
  }

  // 2nd-aorist passive participle (-είς, θ-less: γραφείς). Same endings as the
  // θ-type aoristPassiveParticipleParadigm but on the bare 2nd-aorist stem, so
  // Mounce parses it as a plain "aorist passive participle".
  function eisParticipleParadigm(stem) {
    const s = stem;
    return {
      [`${s}είς`]:    'aorist passive participle nominative singular masculine',
      [`${s}έντος`]:  'aorist passive participle genitive singular masculine/neuter',
      [`${s}έντι`]:   'aorist passive participle dative singular masculine/neuter',
      [`${s}έντα`]:   'aorist passive participle accusative singular masculine',
      [`${s}έντες`]:  'aorist passive participle nominative plural masculine',
      [`${s}έντων`]:  'aorist passive participle genitive plural masculine/feminine/neuter',
      [`${s}εῖσι`]:   'aorist passive participle dative plural masculine/neuter',
      [`${s}εῖσιν`]:  'aorist passive participle dative plural masculine/neuter',
      [`${s}έντας`]:  'aorist passive participle accusative plural masculine',
      [`${s}εῖσα`]:   'aorist passive participle nominative singular feminine',
      [`${s}είσης`]:  'aorist passive participle genitive singular feminine',
      [`${s}είσῃ`]:   'aorist passive participle dative singular feminine',
      [`${s}εῖσαν`]:  'aorist passive participle accusative singular feminine',
      [`${s}εῖσαι`]:  'aorist passive participle nominative plural feminine',
      [`${s}εισῶν`]:  'aorist passive participle genitive plural feminine',
      [`${s}είσαις`]: 'aorist passive participle dative plural feminine',
      [`${s}είσας`]:  'aorist passive participle accusative plural feminine',
      [`${s}έν`]:     'aorist passive participle nominative/accusative singular neuter'
    };
  }

  // ─── Lemma → entry composition ────────────────────────────────────
  //
  // Mounce splits some verbs across multiple principal-part lemma keys
  // (e.g. 'λύω' for the present system, 'λύω → ἔλυσα' for 1st aorist,
  // 'λύω → λέλυκα' for perfect …). The focused-paradigm dropdown lets
  // the student pick ANY of those variants. `buildOptionalMorphCardsForLemma`
  // looks up the inventory by exact lemma key — so for the full
  // paradigm to surface no matter which variant the student focuses
  // on, we have to register the same extras + optional groups under
  // every variant key in the family. The chapter gate on each group
  // still scopes what's actually drilled (e.g. perfect-participle
  // forms stay hidden until Ch 30 even if the focused variant is the
  // present-tense 'λύω' at Ch 16).
  //
  // Variant lists match the lemma strings emitted by morphology.js.
  const LUO_VARIANTS = [
    'λύω',
    'λύω → λύσω',
    'λύω → ἔλυσα',
    'λύω → ἔλυον',
    'λύω → λέλυκα',
    'λύω → λύομαι',
    'λύομαι → ἐλυόμην',
    'λύω → ἐλυσάμην',
    'λύω → ἐλύθην',
    'λύω → λυθήσομαι',
    'λύω → λέλυμαι',
    'λύω → λύων',
    'λύω → λυόμενος',
    'λύω → λυθείς',
    'λύω → λύσας',
    'λύω → λῦσον',
    'λύω infinitive forms'
  ];
  const DIDOMI_VARIANTS = ['δίδωμι', 'δίδωμι → ἔδωκα'];
  const GINOMAI_VARIANTS = ['γίνομαι → ἐγενόμην'];
  const TITHEMI_VARIANTS = ['τίθημι (root *θε-)'];
  const HISTEMI_VARIANTS = ['ἵστημι (root *στα-)'];

  const LUO_FULL_EXTRA_FORMS = {
    ...LUO_EXTRA_FORMS,
    ...LUO_PRESENT_ACTIVE_PARTICIPLE,
    ...LUO_AORIST_PASSIVE_PARTICIPLE,
    ...LUO_PRESENT_MP_PARTICIPLE,
    ...LUO_AORIST_ACTIVE_PARTICIPLE,
    ...LUO_AORIST_MIDDLE_PARTICIPLE,
    ...LUO_PERFECT_ACTIVE_PARTICIPLE,
    ...LUO_PERFECT_MP_PARTICIPLE,
    ...LUO_FUTURE_ACTIVE_PARTICIPLE,
    ...LUO_FUTURE_MIDDLE_PARTICIPLE,
    ...LUO_FUTURE_PASSIVE_PARTICIPLE
  };
  const LUO_FULL_OPTIONAL_GROUPS = [
    ...LUO_OPTIONAL_GROUPS,
    ...LUO_PARTICIPLE_OPTIONAL
  ];

  const GINOMAI_FULL_EXTRA_FORMS = {
    ...GINOMAI_EXTRA_FORMS,
    ...GINOMAI_AORIST_MIDDLE_PARTICIPLE,
    ...GINOMAI_PERFECT_ACTIVE_PARTICIPLE,
    ...GINOMAI_AORIST_PASSIVE_PARTICIPLE
  };
  const GINOMAI_FULL_OPTIONAL_GROUPS = [
    ...GINOMAI_OPTIONAL_GROUPS,
    ...GINOMAI_PARTICIPLE_OPTIONAL,
    { chapter: 28, family: 'γίνομαι — aorist passive participle γενηθείς (optional)',
      forms: GINOMAI_AORIST_PASSIVE_PARTICIPLE }
  ];

  const DIDOMI_FULL_EXTRA_FORMS = {
    ...DIDOMI_EXTRA_FORMS,
    ...DIDOMI_PRESENT_ACTIVE_PARTICIPLE,
    ...DIDOMI_AORIST_ACTIVE_PARTICIPLE,
    ...DIDOMI_AORIST_PASSIVE_PARTICIPLE
  };
  const DIDOMI_FULL_OPTIONAL_GROUPS = [
    ...DIDOMI_OPTIONAL_GROUPS,
    ...DIDOMI_PARTICIPLE_OPTIONAL,
    { chapter: 34, family: 'δίδωμι — aorist passive participle δοθείς (optional)',
      forms: DIDOMI_AORIST_PASSIVE_PARTICIPLE }
  ];

  const TITHEMI_FULL_EXTRA_FORMS = {
    ...TITHEMI_EXTRA_FORMS,
    ...TITHEMI_PRESENT_ACTIVE_PARTICIPLE,
    ...TITHEMI_AORIST_ACTIVE_PARTICIPLE,
    ...TITHEMI_AORIST_PASSIVE_PARTICIPLE
  };
  const TITHEMI_FULL_OPTIONAL_GROUPS = [
    ...TITHEMI_OPTIONAL_GROUPS,
    ...TITHEMI_PARTICIPLE_OPTIONAL,
    { chapter: 36, family: 'τίθημι — aorist passive participle τεθείς (optional)',
      forms: TITHEMI_AORIST_PASSIVE_PARTICIPLE }
  ];

  const HISTEMI_FULL_EXTRA_FORMS = {
    ...HISTEMI_EXTRA_FORMS,
    ...HISTEMI_PRESENT_ACTIVE_PARTICIPLE,
    ...HISTEMI_SECOND_AORIST_ACTIVE_PARTICIPLE,
    ...HISTEMI_PERFECT_ACTIVE_PARTICIPLE,
    ...HISTEMI_AORIST_PASSIVE_PARTICIPLE
  };
  const HISTEMI_FULL_OPTIONAL_GROUPS = [
    ...HISTEMI_OPTIONAL_GROUPS,
    ...HISTEMI_PARTICIPLE_OPTIONAL,
    { chapter: 36, family: 'ἵστημι — aorist passive participle σταθείς (optional)',
      forms: HISTEMI_AORIST_PASSIVE_PARTICIPLE }
  ];

  // ─── λαμβάνω (2nd aorist active, "to take/receive") ───────────────
  //
  // Mounce drills only the 2nd-aorist active indicative ἔλαβον (Ch 22).
  // These optional groups fill the rest of the paradigm — present/imperfect/
  // future indicative, the non-indicative moods of the 2nd aorist (subj
  // λάβω / impv λάβε / inf λαβεῖν), aorist passive, perfect, and the
  // participles — bringing λαμβάνω to the same coverage as γίνομαι. Forms
  // ported verbatim from duff (Koine spellings λήμψομαι / ἐλήμφθην /
  // λημφθείς with the inserted μ); chapters remapped to Mounce. Active
  // counterpart of the deponent γίνομαι, so the labels mirror it.
  const LAMBANO_PRESENT_ACTIVE_INDICATIVE = {
    'λαμβάνω':     'present active indicative first person singular',
    'λαμβάνεις':   'present active indicative second person singular',
    'λαμβάνει':    'present active indicative third person singular',
    'λαμβάνομεν':  'present active indicative first person plural',
    'λαμβάνετε':   'present active indicative second person plural',
    'λαμβάνουσι':  'present active indicative third person plural',
    'λαμβάνουσιν': 'present active indicative third person plural'
  };
  const LAMBANO_IMPERFECT_ACTIVE_INDICATIVE = {
    'ἐλάμβανον':   'imperfect active indicative first person singular',
    'ἐλάμβανες':   'imperfect active indicative second person singular',
    'ἐλάμβανε':    'imperfect active indicative third person singular',
    'ἐλάμβανεν':   'imperfect active indicative third person singular',
    'ἐλαμβάνομεν': 'imperfect active indicative first person plural',
    'ἐλαμβάνετε':  'imperfect active indicative second person plural'
  };
  const LAMBANO_FUTURE_MIDDLE_INDICATIVE = {
    'λήμψομαι':   'future middle indicative first person singular',
    'λήμψῃ':      'future middle indicative second person singular',
    'λήμψεται':   'future middle indicative third person singular',
    'λημψόμεθα':  'future middle indicative first person plural',
    'λήμψεσθε':   'future middle indicative second person plural',
    'λήμψονται':  'future middle indicative third person plural'
  };
  const LAMBANO_AORIST_ACTIVE_INDICATIVE = {
    'ἔλαβον':    'aorist active indicative first person singular',
    'ἔλαβες':    'aorist active indicative second person singular',
    'ἔλαβε':     'aorist active indicative third person singular',
    'ἔλαβεν':    'aorist active indicative third person singular',
    'ἐλάβομεν':  'aorist active indicative first person plural',
    'ἐλάβετε':   'aorist active indicative second person plural'
  };
  const LAMBANO_AORIST_ACTIVE_IMPERATIVE = {
    'λάβε':       'aorist active imperative second person singular',
    'λάβετε':     'aorist active imperative second person plural',
    'λαβέτω':     'aorist active imperative third person singular',
    'λαβέτωσαν':  'aorist active imperative third person plural'
  };
  const LAMBANO_AORIST_ACTIVE_INFINITIVE = {
    'λαβεῖν': 'aorist active infinitive'
  };
  const LAMBANO_PRESENT_ACTIVE_IMPERATIVE = {
    'λάμβανε':       'present active imperative second person singular',
    'λαμβανέτω':     'present active imperative third person singular',
    'λαμβάνετε':     'present active imperative second person plural',
    'λαμβανέτωσαν':  'present active imperative third person plural'
  };
  const LAMBANO_PRESENT_ACTIVE_INFINITIVE = {
    'λαμβάνειν': 'present active infinitive'
  };
  const LAMBANO_AORIST_ACTIVE_SUBJUNCTIVE = {
    'λάβω':    'aorist active subjunctive first person singular',
    'λάβῃς':   'aorist active subjunctive second person singular',
    'λάβῃ':    'aorist active subjunctive third person singular',
    'λάβωμεν': 'aorist active subjunctive first person plural',
    'λάβητε':  'aorist active subjunctive second person plural',
    'λάβωσι':  'aorist active subjunctive third person plural',
    'λάβωσιν': 'aorist active subjunctive third person plural'
  };
  const LAMBANO_AORIST_PASSIVE_INDICATIVE = {
    'ἐλήμφθην':   'aorist passive indicative first person singular',
    'ἐλήμφθης':   'aorist passive indicative second person singular',
    'ἐλήμφθη':    'aorist passive indicative third person singular',
    'ἐλήμφθημεν': 'aorist passive indicative first person plural',
    'ἐλήμφθητε':  'aorist passive indicative second person plural',
    'ἐλήμφθησαν': 'aorist passive indicative third person plural'
  };
  const LAMBANO_PERFECT_ACTIVE_INDICATIVE = {
    'εἴληφα':    'perfect active indicative first person singular',
    'εἴληφας':   'perfect active indicative second person singular',
    'εἴληφε':    'perfect active indicative third person singular',
    'εἴληφεν':   'perfect active indicative third person singular',
    'εἰλήφαμεν': 'perfect active indicative first person plural',
    'εἰλήφατε':  'perfect active indicative second person plural',
    'εἰλήφασι':  'perfect active indicative third person plural',
    'εἰλήφασιν': 'perfect active indicative third person plural'
  };
  const LAMBANO_PRESENT_ACTIVE_PARTICIPLE = presentActiveNtParticiple('λαμβάν', 'λαμβαν', 'λαμβάνον');
  const LAMBANO_AORIST_ACTIVE_PARTICIPLE  = aoristActiveParticipleParadigm('λαβ');
  const LAMBANO_AORIST_PASSIVE_PARTICIPLE = aoristPassiveParticipleParadigm('λημφ');

  const LAMBANO_OPTIONAL_GROUPS = [
    { chapter: 16, alwaysInclude: true, family: 'λαμβάνω — present active indicative (required)',
      forms: LAMBANO_PRESENT_ACTIVE_INDICATIVE },
    { chapter: 21, family: 'λαμβάνω — imperfect active indicative (optional)',
      forms: LAMBANO_IMPERFECT_ACTIVE_INDICATIVE },
    { chapter: 19, alwaysInclude: true, family: 'λαμβάνω — future middle indicative λήμψομαι (required, deponent)',
      forms: LAMBANO_FUTURE_MIDDLE_INDICATIVE },
    { chapter: 22, alwaysInclude: true, family: 'λαμβάνω — aorist active indicative ἔλαβον (2nd aorist, required)',
      forms: LAMBANO_AORIST_ACTIVE_INDICATIVE },
    { chapter: 32, alwaysInclude: true, family: 'λαμβάνω — present active infinitive λαμβάνειν (required)',
      forms: LAMBANO_PRESENT_ACTIVE_INFINITIVE },
    { chapter: 32, alwaysInclude: true, family: 'λαμβάνω — aorist active infinitive λαβεῖν (required)',
      forms: LAMBANO_AORIST_ACTIVE_INFINITIVE },
    { chapter: 33, family: 'λαμβάνω — present active imperative (optional)',
      forms: LAMBANO_PRESENT_ACTIVE_IMPERATIVE },
    { chapter: 33, family: 'λαμβάνω — aorist active imperative (optional)',
      forms: LAMBANO_AORIST_ACTIVE_IMPERATIVE },
    { chapter: 31, family: 'λαμβάνω — aorist active subjunctive λάβω (optional)',
      forms: LAMBANO_AORIST_ACTIVE_SUBJUNCTIVE },
    { chapter: 24, alwaysInclude: true, family: 'λαμβάνω — aorist passive indicative ἐλήμφθην (required)',
      forms: LAMBANO_AORIST_PASSIVE_INDICATIVE },
    { chapter: 25, alwaysInclude: true, family: 'λαμβάνω — perfect active indicative εἴληφα (required)',
      forms: LAMBANO_PERFECT_ACTIVE_INDICATIVE }
  ];
  const LAMBANO_PARTICIPLE_OPTIONAL = [
    { chapter: 27, family: 'λαμβάνω — present active participle λαμβάνων full declension (optional)',
      forms: LAMBANO_PRESENT_ACTIVE_PARTICIPLE },
    { chapter: 28, family: 'λαμβάνω — 2nd aorist active participle λαβών full declension (optional)',
      forms: LAMBANO_AORIST_ACTIVE_PARTICIPLE },
    { chapter: 28, family: 'λαμβάνω — aorist passive participle λημφθείς (optional)',
      forms: LAMBANO_AORIST_PASSIVE_PARTICIPLE }
  ];
  const LAMBANO_EXTRA_FORMS = {
    ...LAMBANO_PRESENT_ACTIVE_INDICATIVE,
    ...LAMBANO_IMPERFECT_ACTIVE_INDICATIVE,
    ...LAMBANO_FUTURE_MIDDLE_INDICATIVE,
    ...LAMBANO_AORIST_ACTIVE_INDICATIVE,
    ...LAMBANO_PRESENT_ACTIVE_INFINITIVE,
    ...LAMBANO_AORIST_ACTIVE_INFINITIVE,
    ...LAMBANO_PRESENT_ACTIVE_IMPERATIVE,
    ...LAMBANO_AORIST_ACTIVE_IMPERATIVE,
    ...LAMBANO_AORIST_ACTIVE_SUBJUNCTIVE,
    ...LAMBANO_AORIST_PASSIVE_INDICATIVE,
    ...LAMBANO_PERFECT_ACTIVE_INDICATIVE,
    ...LAMBANO_PRESENT_ACTIVE_PARTICIPLE,
    ...LAMBANO_AORIST_ACTIVE_PARTICIPLE,
    ...LAMBANO_AORIST_PASSIVE_PARTICIPLE
  };
  const LAMBANO_FULL_OPTIONAL_GROUPS = [
    ...LAMBANO_OPTIONAL_GROUPS,
    ...LAMBANO_PARTICIPLE_OPTIONAL
  ];
  const LAMBANO_VARIANTS = ['λαμβάνω → ἔλαβον'];

  // ─── λείπω (2nd aorist active, "to leave") ────────────────────────
  //
  // Same shape as λαμβάνω: Mounce drills the 2nd-aorist active indicative
  // ἔλιπον (Ch 22); these fill the rest. λείπω has an active future λείψω
  // (not deponent). Ported verbatim from duff; chapters remapped to Mounce.
  const LEIPO_PRESENT_ACTIVE_INDICATIVE = {
    'λείπω':     'present active indicative first person singular',
    'λείπεις':   'present active indicative second person singular',
    'λείπει':    'present active indicative third person singular',
    'λείπομεν':  'present active indicative first person plural',
    'λείπετε':   'present active indicative second person plural',
    'λείπουσι':  'present active indicative third person plural',
    'λείπουσιν': 'present active indicative third person plural'
  };
  const LEIPO_IMPERFECT_ACTIVE_INDICATIVE = {
    'ἔλειπον':   'imperfect active indicative first person singular',
    'ἔλειπες':   'imperfect active indicative second person singular',
    'ἔλειπε':    'imperfect active indicative third person singular',
    'ἔλειπεν':   'imperfect active indicative third person singular',
    'ἐλείπομεν': 'imperfect active indicative first person plural',
    'ἐλείπετε':  'imperfect active indicative second person plural'
  };
  const LEIPO_FUTURE_ACTIVE_INDICATIVE = {
    'λείψω':     'future active indicative first person singular',
    'λείψεις':   'future active indicative second person singular',
    'λείψει':    'future active indicative third person singular',
    'λείψομεν':  'future active indicative first person plural',
    'λείψετε':   'future active indicative second person plural',
    'λείψουσι':  'future active indicative third person plural',
    'λείψουσιν': 'future active indicative third person plural'
  };
  const LEIPO_AORIST_ACTIVE_INDICATIVE = {
    'ἔλιπον':    'aorist active indicative first person singular',
    'ἔλιπες':    'aorist active indicative second person singular',
    'ἔλιπε':     'aorist active indicative third person singular',
    'ἔλιπεν':    'aorist active indicative third person singular',
    'ἐλίπομεν':  'aorist active indicative first person plural',
    'ἐλίπετε':   'aorist active indicative second person plural'
  };
  const LEIPO_AORIST_ACTIVE_IMPERATIVE = {
    'λίπε':       'aorist active imperative second person singular',
    'λίπετε':     'aorist active imperative second person plural',
    'λιπέτω':     'aorist active imperative third person singular',
    'λιπέτωσαν':  'aorist active imperative third person plural'
  };
  const LEIPO_AORIST_ACTIVE_INFINITIVE = {
    'λιπεῖν': 'aorist active infinitive'
  };
  const LEIPO_PRESENT_ACTIVE_IMPERATIVE = {
    'λεῖπε':       'present active imperative second person singular',
    'λειπέτω':     'present active imperative third person singular',
    'λείπετε':     'present active imperative second person plural',
    'λειπέτωσαν':  'present active imperative third person plural'
  };
  const LEIPO_PRESENT_ACTIVE_INFINITIVE = {
    'λείπειν': 'present active infinitive'
  };
  const LEIPO_AORIST_ACTIVE_SUBJUNCTIVE = {
    'λίπω':    'aorist active subjunctive first person singular',
    'λίπῃς':   'aorist active subjunctive second person singular',
    'λίπῃ':    'aorist active subjunctive third person singular',
    'λίπωμεν': 'aorist active subjunctive first person plural',
    'λίπητε':  'aorist active subjunctive second person plural',
    'λίπωσι':  'aorist active subjunctive third person plural',
    'λίπωσιν': 'aorist active subjunctive third person plural'
  };
  const LEIPO_AORIST_PASSIVE_INDICATIVE = {
    'ἐλείφθην':   'aorist passive indicative first person singular',
    'ἐλείφθης':   'aorist passive indicative second person singular',
    'ἐλείφθη':    'aorist passive indicative third person singular',
    'ἐλείφθημεν': 'aorist passive indicative first person plural',
    'ἐλείφθητε':  'aorist passive indicative second person plural',
    'ἐλείφθησαν': 'aorist passive indicative third person plural'
  };
  const LEIPO_PERFECT_ACTIVE_INDICATIVE = {
    'λέλοιπα':    'perfect active indicative first person singular',
    'λέλοιπας':   'perfect active indicative second person singular',
    'λέλοιπε':    'perfect active indicative third person singular',
    'λέλοιπεν':   'perfect active indicative third person singular',
    'λελοίπαμεν': 'perfect active indicative first person plural',
    'λελοίπατε':  'perfect active indicative second person plural',
    'λελοίπασι':  'perfect active indicative third person plural',
    'λελοίπασιν': 'perfect active indicative third person plural'
  };
  const LEIPO_PRESENT_ACTIVE_PARTICIPLE = presentActiveNtParticiple('λείπ', 'λειπ', 'λεῖπον');
  const LEIPO_AORIST_ACTIVE_PARTICIPLE  = aoristActiveParticipleParadigm('λιπ');
  const LEIPO_AORIST_MIDDLE_PARTICIPLE  = menosParticipleParadigm('λιπό', 'λιπο', 'aorist middle participle');
  const LEIPO_AORIST_PASSIVE_PARTICIPLE = aoristPassiveParticipleParadigm('λειφ');

  const LEIPO_OPTIONAL_GROUPS = [
    { chapter: 16, alwaysInclude: true, family: 'λείπω — present active indicative (required)',
      forms: LEIPO_PRESENT_ACTIVE_INDICATIVE },
    { chapter: 21, family: 'λείπω — imperfect active indicative (optional)',
      forms: LEIPO_IMPERFECT_ACTIVE_INDICATIVE },
    { chapter: 19, alwaysInclude: true, family: 'λείπω — future active indicative λείψω (required)',
      forms: LEIPO_FUTURE_ACTIVE_INDICATIVE },
    { chapter: 22, alwaysInclude: true, family: 'λείπω — aorist active indicative ἔλιπον (2nd aorist, required)',
      forms: LEIPO_AORIST_ACTIVE_INDICATIVE },
    { chapter: 32, alwaysInclude: true, family: 'λείπω — present active infinitive λείπειν (required)',
      forms: LEIPO_PRESENT_ACTIVE_INFINITIVE },
    { chapter: 32, alwaysInclude: true, family: 'λείπω — aorist active infinitive λιπεῖν (required)',
      forms: LEIPO_AORIST_ACTIVE_INFINITIVE },
    { chapter: 33, family: 'λείπω — present active imperative (optional)',
      forms: LEIPO_PRESENT_ACTIVE_IMPERATIVE },
    { chapter: 33, family: 'λείπω — aorist active imperative (optional)',
      forms: LEIPO_AORIST_ACTIVE_IMPERATIVE },
    { chapter: 31, family: 'λείπω — aorist active subjunctive λίπω (optional)',
      forms: LEIPO_AORIST_ACTIVE_SUBJUNCTIVE },
    { chapter: 24, alwaysInclude: true, family: 'λείπω — aorist passive indicative ἐλείφθην (required)',
      forms: LEIPO_AORIST_PASSIVE_INDICATIVE },
    { chapter: 25, alwaysInclude: true, family: 'λείπω — perfect active indicative λέλοιπα (required)',
      forms: LEIPO_PERFECT_ACTIVE_INDICATIVE }
  ];
  const LEIPO_PARTICIPLE_OPTIONAL = [
    { chapter: 27, family: 'λείπω — present active participle λείπων full declension (optional)',
      forms: LEIPO_PRESENT_ACTIVE_PARTICIPLE },
    { chapter: 28, alwaysInclude: true, family: 'λείπω — 2nd aorist active participle λιπών full declension',
      forms: LEIPO_AORIST_ACTIVE_PARTICIPLE },
    { chapter: 28, alwaysInclude: true, family: 'λείπω — 2nd aorist middle participle λιπόμενος full declension',
      forms: LEIPO_AORIST_MIDDLE_PARTICIPLE },
    { chapter: 28, family: 'λείπω — aorist passive participle λειφθείς (optional)',
      forms: LEIPO_AORIST_PASSIVE_PARTICIPLE }
  ];
  const LEIPO_EXTRA_FORMS = {
    ...LEIPO_PRESENT_ACTIVE_INDICATIVE,
    ...LEIPO_IMPERFECT_ACTIVE_INDICATIVE,
    ...LEIPO_FUTURE_ACTIVE_INDICATIVE,
    ...LEIPO_AORIST_ACTIVE_INDICATIVE,
    ...LEIPO_PRESENT_ACTIVE_INFINITIVE,
    ...LEIPO_AORIST_ACTIVE_INFINITIVE,
    ...LEIPO_PRESENT_ACTIVE_IMPERATIVE,
    ...LEIPO_AORIST_ACTIVE_IMPERATIVE,
    ...LEIPO_AORIST_ACTIVE_SUBJUNCTIVE,
    ...LEIPO_AORIST_PASSIVE_INDICATIVE,
    ...LEIPO_PERFECT_ACTIVE_INDICATIVE,
    ...LEIPO_PRESENT_ACTIVE_PARTICIPLE,
    ...LEIPO_AORIST_ACTIVE_PARTICIPLE,
    ...LEIPO_AORIST_MIDDLE_PARTICIPLE,
    ...LEIPO_AORIST_PASSIVE_PARTICIPLE
  };
  const LEIPO_FULL_OPTIONAL_GROUPS = [
    ...LEIPO_OPTIONAL_GROUPS,
    ...LEIPO_PARTICIPLE_OPTIONAL
  ];
  const LEIPO_VARIANTS = ['λείπω → ἔλιπον'];

  // ─── κρίνω (liquid future, "to judge") — lookup-only participles ───
  //
  // Mounce drills the liquid future κρινῶ (Ch 20). κρίνω's participles are
  // registered as extraForms ONLY (no optionalFormGroups, mirroring duff):
  // they back the wrong-parse form-lookup feedback without adding drill
  // cards. κρίνω forms a liquid 1st aorist ἔκρινα, so its aorist active
  // participle is the -ας/-αντος type (κρίνας), NOT the 2nd-aorist -ών type.
  const KRINO_AORIST_ACTIVE_PARTICIPLE = {
    'κρίνας':     'aorist active participle nominative singular masculine',
    'κρίναντος':  'aorist active participle genitive singular masculine/neuter',
    'κρίναντι':   'aorist active participle dative singular masculine/neuter',
    'κρίναντα':   'aorist active participle accusative singular masculine',
    'κρίναντες':  'aorist active participle nominative plural masculine',
    'κρινάντων':  'aorist active participle genitive plural masculine/feminine/neuter',
    'κρίνασι':    'aorist active participle dative plural masculine/neuter',
    'κρίνασιν':   'aorist active participle dative plural masculine/neuter',
    'κρίναντας':  'aorist active participle accusative plural masculine',
    'κρίνασα':    'aorist active participle nominative singular feminine',
    'κρινάσης':   'aorist active participle genitive singular feminine',
    'κρινάσῃ':    'aorist active participle dative singular feminine',
    'κρίνασαν':   'aorist active participle accusative singular feminine',
    'κρίνασαι':   'aorist active participle nominative plural feminine',
    'κρινασῶν':   'aorist active participle genitive plural feminine',
    'κρινάσαις':  'aorist active participle dative plural feminine',
    'κρινάσας':   'aorist active participle accusative plural feminine',
    'κρῖναν':     'aorist active participle nominative/accusative singular neuter'
  };
  const KRINO_PRESENT_ACTIVE_PARTICIPLE = presentActiveNtParticiple('κρίν', 'κριν', 'κρῖνον');
  const KRINO_AORIST_PASSIVE_PARTICIPLE = aoristPassiveParticipleParadigm('κρι');
  const KRINO_EXTRA_FORMS = {
    ...KRINO_PRESENT_ACTIVE_PARTICIPLE,
    ...KRINO_AORIST_ACTIVE_PARTICIPLE,
    ...KRINO_AORIST_PASSIVE_PARTICIPLE
  };
  const KRINO_VARIANTS = ['κρίνω → κρινῶ'];

  // ─── Contract verbs ἀγαπάω / ποιέω / πληρόω (present system) ───────
  //
  // Mounce drills only the present active indicative (Ch 17). These optional
  // groups fill the rest of the contraction-bearing present system: present
  // mid/pas indicative, imperfect active + mid/pas indicative, and the present
  // infinitives + participles. (Future/aorist/perfect are built on the
  // lengthened uncontracted stem — ἀγαπήσω, ἐποίησα — so they're regular and
  // not where contract drilling pays off.) Hand-authored (no duff source for
  // α-/ο-contracts). The present mid/pas participle uses the λυόμενος pattern;
  // the present active participle gives the recognition nominatives (its full
  // contracted -ῶν/-οῦντος declension is accent-dense and deferred).

  // α-contract — ἀγαπάω
  const AGAPAO_PRESENT_ACTIVE_INDICATIVE = {
    'ἀγαπῶ':     'present active indicative first person singular',
    'ἀγαπᾷς':    'present active indicative second person singular',
    'ἀγαπᾷ':     'present active indicative third person singular',
    'ἀγαπῶμεν':  'present active indicative first person plural',
    'ἀγαπᾶτε':   'present active indicative second person plural',
    'ἀγαπῶσι':   'present active indicative third person plural',
    'ἀγαπῶσιν':  'present active indicative third person plural'
  };
  const AGAPAO_PRESENT_MP_INDICATIVE = {
    'ἀγαπῶμαι':   'present middle/passive indicative first person singular',
    'ἀγαπᾶται':   'present middle/passive indicative third person singular',
    'ἀγαπώμεθα':  'present middle/passive indicative first person plural',
    'ἀγαπᾶσθε':   'present middle/passive indicative second person plural',
    'ἀγαπῶνται':  'present middle/passive indicative third person plural'
  };
  const AGAPAO_IMPERFECT_ACTIVE_INDICATIVE = {
    'ἠγάπων':    'imperfect active indicative first person singular',
    'ἠγάπας':    'imperfect active indicative second person singular',
    'ἠγάπα':     'imperfect active indicative third person singular',
    'ἠγαπῶμεν':  'imperfect active indicative first person plural',
    'ἠγαπᾶτε':   'imperfect active indicative second person plural'
  };
  const AGAPAO_IMPERFECT_MP_INDICATIVE = {
    'ἠγαπώμην':   'imperfect middle/passive indicative first person singular',
    'ἠγαπῶ':      'imperfect middle/passive indicative second person singular',
    'ἠγαπᾶτο':    'imperfect middle/passive indicative third person singular',
    'ἠγαπώμεθα':  'imperfect middle/passive indicative first person plural',
    'ἠγαπᾶσθε':   'imperfect middle/passive indicative second person plural',
    'ἠγαπῶντο':   'imperfect middle/passive indicative third person plural'
  };
  const AGAPAO_PRESENT_ACTIVE_INFINITIVE = { 'ἀγαπᾶν': 'present active infinitive' };
  const AGAPAO_PRESENT_MP_INFINITIVE = { 'ἀγαπᾶσθαι': 'present middle/passive infinitive' };
  const AGAPAO_PRESENT_MP_PARTICIPLE = menosParticipleParadigm('ἀγαπώ', 'ἀγαπω', 'present middle/passive participle');
  const AGAPAO_PRESENT_ACTIVE_PARTICIPLE_NOM = {
    'ἀγαπῶν':  'present active participle nominative singular masculine',
    'ἀγαπῶσα': 'present active participle nominative singular feminine'
  };
  const AGAPAO_EXTRA_FORMS = {
    ...AGAPAO_PRESENT_ACTIVE_INDICATIVE,
    ...AGAPAO_PRESENT_MP_INDICATIVE,
    ...AGAPAO_IMPERFECT_ACTIVE_INDICATIVE,
    ...AGAPAO_IMPERFECT_MP_INDICATIVE,
    ...AGAPAO_PRESENT_ACTIVE_INFINITIVE,
    ...AGAPAO_PRESENT_MP_INFINITIVE,
    ...AGAPAO_PRESENT_MP_PARTICIPLE,
    ...AGAPAO_PRESENT_ACTIVE_PARTICIPLE_NOM
  };
  const AGAPAO_OPTIONAL_GROUPS = [
    { chapter: 18, alwaysInclude: true, family: 'ἀγαπάω — present middle/passive indicative (required)',
      forms: AGAPAO_PRESENT_MP_INDICATIVE },
    { chapter: 21, family: 'ἀγαπάω — imperfect active indicative (optional)',
      forms: AGAPAO_IMPERFECT_ACTIVE_INDICATIVE },
    { chapter: 21, family: 'ἀγαπάω — imperfect middle/passive indicative (optional)',
      forms: AGAPAO_IMPERFECT_MP_INDICATIVE },
    { chapter: 32, alwaysInclude: true, family: 'ἀγαπάω — present active infinitive ἀγαπᾶν (required)',
      forms: AGAPAO_PRESENT_ACTIVE_INFINITIVE },
    { chapter: 32, alwaysInclude: true, family: 'ἀγαπάω — present middle/passive infinitive ἀγαπᾶσθαι (required)',
      forms: AGAPAO_PRESENT_MP_INFINITIVE },
    { chapter: 27, family: 'ἀγαπάω — present active participle ἀγαπῶν (optional, nom.)',
      forms: AGAPAO_PRESENT_ACTIVE_PARTICIPLE_NOM },
    { chapter: 27, family: 'ἀγαπάω — present middle/passive participle ἀγαπώμενος (optional)',
      forms: AGAPAO_PRESENT_MP_PARTICIPLE }
  ];
  const AGAPAO_VARIANTS = ['ἀγαπάω'];

  // ε-contract — ποιέω
  const POIEO_PRESENT_ACTIVE_INDICATIVE = {
    'ποιῶ':     'present active indicative first person singular',
    'ποιεῖς':   'present active indicative second person singular',
    'ποιεῖ':    'present active indicative third person singular',
    'ποιοῦμεν': 'present active indicative first person plural',
    'ποιεῖτε':  'present active indicative second person plural',
    'ποιοῦσι':  'present active indicative third person plural',
    'ποιοῦσιν': 'present active indicative third person plural'
  };
  const POIEO_PRESENT_MP_INDICATIVE = {
    'ποιοῦμαι':   'present middle/passive indicative first person singular',
    'ποιῇ':       'present middle/passive indicative second person singular',
    'ποιεῖται':   'present middle/passive indicative third person singular',
    'ποιούμεθα':  'present middle/passive indicative first person plural',
    'ποιεῖσθε':   'present middle/passive indicative second person plural',
    'ποιοῦνται':  'present middle/passive indicative third person plural'
  };
  const POIEO_IMPERFECT_ACTIVE_INDICATIVE = {
    'ἐποίουν':   'imperfect active indicative first person singular',
    'ἐποίεις':   'imperfect active indicative second person singular',
    'ἐποίει':    'imperfect active indicative third person singular',
    'ἐποιοῦμεν': 'imperfect active indicative first person plural',
    'ἐποιεῖτε':  'imperfect active indicative second person plural'
  };
  const POIEO_IMPERFECT_MP_INDICATIVE = {
    'ἐποιούμην':   'imperfect middle/passive indicative first person singular',
    'ἐποιοῦ':      'imperfect middle/passive indicative second person singular',
    'ἐποιεῖτο':    'imperfect middle/passive indicative third person singular',
    'ἐποιούμεθα':  'imperfect middle/passive indicative first person plural',
    'ἐποιεῖσθε':   'imperfect middle/passive indicative second person plural',
    'ἐποιοῦντο':   'imperfect middle/passive indicative third person plural'
  };
  const POIEO_PRESENT_ACTIVE_INFINITIVE = { 'ποιεῖν': 'present active infinitive' };
  const POIEO_PRESENT_MP_INFINITIVE = { 'ποιεῖσθαι': 'present middle/passive infinitive' };
  const POIEO_PRESENT_MP_PARTICIPLE = menosParticipleParadigm('ποιού', 'ποιου', 'present middle/passive participle');
  const POIEO_PRESENT_ACTIVE_PARTICIPLE_NOM = {
    'ποιῶν':   'present active participle nominative singular masculine',
    'ποιοῦσα': 'present active participle nominative singular feminine',
    'ποιοῦν':  'present active participle nominative/accusative singular neuter'
  };
  const POIEO_EXTRA_FORMS = {
    ...POIEO_PRESENT_ACTIVE_INDICATIVE,
    ...POIEO_PRESENT_MP_INDICATIVE,
    ...POIEO_IMPERFECT_ACTIVE_INDICATIVE,
    ...POIEO_IMPERFECT_MP_INDICATIVE,
    ...POIEO_PRESENT_ACTIVE_INFINITIVE,
    ...POIEO_PRESENT_MP_INFINITIVE,
    ...POIEO_PRESENT_MP_PARTICIPLE,
    ...POIEO_PRESENT_ACTIVE_PARTICIPLE_NOM
  };
  const POIEO_OPTIONAL_GROUPS = [
    { chapter: 18, alwaysInclude: true, family: 'ποιέω — present middle/passive indicative (required)',
      forms: POIEO_PRESENT_MP_INDICATIVE },
    { chapter: 21, family: 'ποιέω — imperfect active indicative (optional)',
      forms: POIEO_IMPERFECT_ACTIVE_INDICATIVE },
    { chapter: 21, family: 'ποιέω — imperfect middle/passive indicative (optional)',
      forms: POIEO_IMPERFECT_MP_INDICATIVE },
    { chapter: 32, alwaysInclude: true, family: 'ποιέω — present active infinitive ποιεῖν (required)',
      forms: POIEO_PRESENT_ACTIVE_INFINITIVE },
    { chapter: 32, alwaysInclude: true, family: 'ποιέω — present middle/passive infinitive ποιεῖσθαι (required)',
      forms: POIEO_PRESENT_MP_INFINITIVE },
    { chapter: 27, family: 'ποιέω — present active participle ποιῶν (optional, nom.)',
      forms: POIEO_PRESENT_ACTIVE_PARTICIPLE_NOM },
    { chapter: 27, family: 'ποιέω — present middle/passive participle ποιούμενος (optional)',
      forms: POIEO_PRESENT_MP_PARTICIPLE }
  ];
  const POIEO_VARIANTS = ['ποιέω'];

  // ο-contract — πληρόω
  const PLEROO_PRESENT_ACTIVE_INDICATIVE = {
    'πληρῶ':     'present active indicative first person singular',
    'πληροῖς':   'present active indicative second person singular',
    'πληροῖ':    'present active indicative third person singular',
    'πληροῦμεν': 'present active indicative first person plural',
    'πληροῦτε':  'present active indicative second person plural',
    'πληροῦσι':  'present active indicative third person plural',
    'πληροῦσιν': 'present active indicative third person plural'
  };
  const PLEROO_PRESENT_MP_INDICATIVE = {
    'πληροῦμαι':   'present middle/passive indicative first person singular',
    'πληροῦται':   'present middle/passive indicative third person singular',
    'πληρούμεθα':  'present middle/passive indicative first person plural',
    'πληροῦσθε':   'present middle/passive indicative second person plural',
    'πληροῦνται':  'present middle/passive indicative third person plural'
  };
  const PLEROO_IMPERFECT_ACTIVE_INDICATIVE = {
    'ἐπλήρουν':   'imperfect active indicative first person singular',
    'ἐπλήρους':   'imperfect active indicative second person singular',
    'ἐπλήρου':    'imperfect active indicative third person singular',
    'ἐπληροῦμεν': 'imperfect active indicative first person plural',
    'ἐπληροῦτε':  'imperfect active indicative second person plural'
  };
  const PLEROO_IMPERFECT_MP_INDICATIVE = {
    'ἐπληρούμην':   'imperfect middle/passive indicative first person singular',
    'ἐπληροῦ':      'imperfect middle/passive indicative second person singular',
    'ἐπληροῦτο':    'imperfect middle/passive indicative third person singular',
    'ἐπληρούμεθα':  'imperfect middle/passive indicative first person plural',
    'ἐπληροῦσθε':   'imperfect middle/passive indicative second person plural',
    'ἐπληροῦντο':   'imperfect middle/passive indicative third person plural'
  };
  const PLEROO_PRESENT_ACTIVE_INFINITIVE = { 'πληροῦν': 'present active infinitive' };
  const PLEROO_PRESENT_MP_INFINITIVE = { 'πληροῦσθαι': 'present middle/passive infinitive' };
  const PLEROO_PRESENT_MP_PARTICIPLE = menosParticipleParadigm('πληρού', 'πληρου', 'present middle/passive participle');
  const PLEROO_PRESENT_ACTIVE_PARTICIPLE_NOM = {
    'πληρῶν':   'present active participle nominative singular masculine',
    'πληροῦσα': 'present active participle nominative singular feminine',
    'πληροῦν':  'present active participle nominative/accusative singular neuter'
  };
  const PLEROO_EXTRA_FORMS = {
    ...PLEROO_PRESENT_ACTIVE_INDICATIVE,
    ...PLEROO_PRESENT_MP_INDICATIVE,
    ...PLEROO_IMPERFECT_ACTIVE_INDICATIVE,
    ...PLEROO_IMPERFECT_MP_INDICATIVE,
    ...PLEROO_PRESENT_ACTIVE_INFINITIVE,
    ...PLEROO_PRESENT_MP_INFINITIVE,
    ...PLEROO_PRESENT_MP_PARTICIPLE,
    ...PLEROO_PRESENT_ACTIVE_PARTICIPLE_NOM
  };
  const PLEROO_OPTIONAL_GROUPS = [
    { chapter: 18, alwaysInclude: true, family: 'πληρόω — present middle/passive indicative (required)',
      forms: PLEROO_PRESENT_MP_INDICATIVE },
    { chapter: 21, family: 'πληρόω — imperfect active indicative (optional)',
      forms: PLEROO_IMPERFECT_ACTIVE_INDICATIVE },
    { chapter: 21, family: 'πληρόω — imperfect middle/passive indicative (optional)',
      forms: PLEROO_IMPERFECT_MP_INDICATIVE },
    { chapter: 32, alwaysInclude: true, family: 'πληρόω — present active infinitive πληροῦν (required)',
      forms: PLEROO_PRESENT_ACTIVE_INFINITIVE },
    { chapter: 32, alwaysInclude: true, family: 'πληρόω — present middle/passive infinitive πληροῦσθαι (required)',
      forms: PLEROO_PRESENT_MP_INFINITIVE },
    { chapter: 27, family: 'πληρόω — present active participle πληρῶν (optional, nom.)',
      forms: PLEROO_PRESENT_ACTIVE_PARTICIPLE_NOM },
    { chapter: 27, family: 'πληρόω — present middle/passive participle πληρούμενος (optional)',
      forms: PLEROO_PRESENT_MP_PARTICIPLE }
  ];
  const PLEROO_VARIANTS = ['πληρόω'];

  // ─── γράφω (2nd aorist passive ἐγράφην, "to write") ───────────────
  //
  // Mounce drills the 2nd-aorist passive indicative ἐγράφην (Ch 24). These
  // fill the non-indicative 2nd-aorist passive (subj γραφῶ / impv γράφηθι /
  // inf γραφῆναι / ptc γραφείς — θ-less -είς type) plus the present active
  // indicative. Hand-authored (no duff source). Mounce parses 2nd-aorist
  // passive non-indicatives as plain "aorist passive".
  const GRAPHO_PRESENT_ACTIVE_INDICATIVE = {
    'γράφω':     'present active indicative first person singular',
    'γράφεις':   'present active indicative second person singular',
    'γράφει':    'present active indicative third person singular',
    'γράφομεν':  'present active indicative first person plural',
    'γράφετε':   'present active indicative second person plural',
    'γράφουσι':  'present active indicative third person plural',
    'γράφουσιν': 'present active indicative third person plural'
  };
  const GRAPHO_AORIST_PASSIVE_INDICATIVE = {
    'ἐγράφην':   'aorist passive indicative first person singular',
    'ἐγράφης':   'aorist passive indicative second person singular',
    'ἐγράφη':    'aorist passive indicative third person singular',
    'ἐγράφημεν': 'aorist passive indicative first person plural',
    'ἐγράφητε':  'aorist passive indicative second person plural',
    'ἐγράφησαν': 'aorist passive indicative third person plural'
  };
  const GRAPHO_AORIST_PASSIVE_SUBJUNCTIVE = {
    'γραφῶ':    'aorist passive subjunctive first person singular',
    'γραφῇς':   'aorist passive subjunctive second person singular',
    'γραφῇ':    'aorist passive subjunctive third person singular',
    'γραφῶμεν': 'aorist passive subjunctive first person plural',
    'γραφῆτε':  'aorist passive subjunctive second person plural',
    'γραφῶσι':  'aorist passive subjunctive third person plural',
    'γραφῶσιν': 'aorist passive subjunctive third person plural'
  };
  const GRAPHO_AORIST_PASSIVE_IMPERATIVE = {
    'γράφηθι':     'aorist passive imperative second person singular',
    'γραφήτω':     'aorist passive imperative third person singular',
    'γράφητε':     'aorist passive imperative second person plural',
    'γραφήτωσαν':  'aorist passive imperative third person plural'
  };
  const GRAPHO_AORIST_PASSIVE_INFINITIVE = { 'γραφῆναι': 'aorist passive infinitive' };
  const GRAPHO_AORIST_PASSIVE_PARTICIPLE = eisParticipleParadigm('γραφ');
  const GRAPHO_EXTRA_FORMS = {
    ...GRAPHO_PRESENT_ACTIVE_INDICATIVE,
    ...GRAPHO_AORIST_PASSIVE_INDICATIVE,
    ...GRAPHO_AORIST_PASSIVE_SUBJUNCTIVE,
    ...GRAPHO_AORIST_PASSIVE_IMPERATIVE,
    ...GRAPHO_AORIST_PASSIVE_INFINITIVE,
    ...GRAPHO_AORIST_PASSIVE_PARTICIPLE
  };
  const GRAPHO_OPTIONAL_GROUPS = [
    { chapter: 16, alwaysInclude: true, family: 'γράφω — present active indicative (required)',
      forms: GRAPHO_PRESENT_ACTIVE_INDICATIVE },
    { chapter: 31, family: 'γράφω — aorist passive subjunctive γραφῶ (optional)',
      forms: GRAPHO_AORIST_PASSIVE_SUBJUNCTIVE },
    { chapter: 33, family: 'γράφω — aorist passive imperative γράφηθι (optional)',
      forms: GRAPHO_AORIST_PASSIVE_IMPERATIVE },
    { chapter: 32, alwaysInclude: true, family: 'γράφω — aorist passive infinitive γραφῆναι (required)',
      forms: GRAPHO_AORIST_PASSIVE_INFINITIVE },
    { chapter: 28, alwaysInclude: true, family: 'γράφω — 2nd aorist passive participle γραφείς full declension',
      forms: GRAPHO_AORIST_PASSIVE_PARTICIPLE }
  ];
  const GRAPHO_VARIANTS = ['γράφω → ἐγράφην'];

  // ─── πορεύομαι (middle deponent, "to go") ─────────────────────────
  //
  // Mounce drills the future middle πορεύσομαι (Ch 19). These fill the
  // present + imperfect middle indicative, the (passive-form) aorist deponent
  // ἐπορεύθην, the present/aorist infinitives + imperatives, and the present
  // middle + aorist passive participles. Hand-authored (no duff source).
  const POREUOMAI_PRESENT_MP_INDICATIVE = {
    'πορεύομαι':   'present middle indicative first person singular',
    'πορεύῃ':      'present middle indicative second person singular',
    'πορεύεται':   'present middle indicative third person singular',
    'πορευόμεθα':  'present middle indicative first person plural',
    'πορεύεσθε':   'present middle indicative second person plural',
    'πορεύονται':  'present middle indicative third person plural'
  };
  const POREUOMAI_IMPERFECT_MP_INDICATIVE = {
    'ἐπορευόμην':  'imperfect middle indicative first person singular',
    'ἐπορεύου':    'imperfect middle indicative second person singular',
    'ἐπορεύετο':   'imperfect middle indicative third person singular',
    'ἐπορευόμεθα': 'imperfect middle indicative first person plural',
    'ἐπορεύεσθε':  'imperfect middle indicative second person plural',
    'ἐπορεύοντο':  'imperfect middle indicative third person plural'
  };
  const POREUOMAI_AORIST_PASSIVE_INDICATIVE = {
    'ἐπορεύθην':   'aorist passive indicative first person singular',
    'ἐπορεύθης':   'aorist passive indicative second person singular',
    'ἐπορεύθη':    'aorist passive indicative third person singular',
    'ἐπορεύθημεν': 'aorist passive indicative first person plural',
    'ἐπορεύθητε':  'aorist passive indicative second person plural',
    'ἐπορεύθησαν': 'aorist passive indicative third person plural'
  };
  const POREUOMAI_PRESENT_MP_INFINITIVE = { 'πορεύεσθαι': 'present middle infinitive' };
  const POREUOMAI_AORIST_PASSIVE_INFINITIVE = { 'πορευθῆναι': 'aorist passive infinitive' };
  const POREUOMAI_PRESENT_MP_IMPERATIVE = {
    'πορεύου':       'present middle imperative second person singular',
    'πορευέσθω':     'present middle imperative third person singular',
    'πορεύεσθε':     'present middle imperative second person plural',
    'πορευέσθωσαν':  'present middle imperative third person plural'
  };
  const POREUOMAI_AORIST_PASSIVE_IMPERATIVE = {
    'πορεύθητι':     'aorist passive imperative second person singular',
    'πορευθήτω':     'aorist passive imperative third person singular',
    'πορεύθητε':     'aorist passive imperative second person plural',
    'πορευθήτωσαν':  'aorist passive imperative third person plural'
  };
  const POREUOMAI_PRESENT_MP_PARTICIPLE = menosParticipleParadigm('πορευό', 'πορευο', 'present middle participle');
  const POREUOMAI_AORIST_PASSIVE_PARTICIPLE = aoristPassiveParticipleParadigm('πορευ');
  const POREUOMAI_EXTRA_FORMS = {
    ...POREUOMAI_PRESENT_MP_INDICATIVE,
    ...POREUOMAI_IMPERFECT_MP_INDICATIVE,
    ...POREUOMAI_AORIST_PASSIVE_INDICATIVE,
    ...POREUOMAI_PRESENT_MP_INFINITIVE,
    ...POREUOMAI_AORIST_PASSIVE_INFINITIVE,
    ...POREUOMAI_PRESENT_MP_IMPERATIVE,
    ...POREUOMAI_AORIST_PASSIVE_IMPERATIVE,
    ...POREUOMAI_PRESENT_MP_PARTICIPLE,
    ...POREUOMAI_AORIST_PASSIVE_PARTICIPLE
  };
  // πορεύομαι's full paradigm is now drilled as CORE morphology paradigms (its
  // own dropdown entries — present/imperfect/future/aorist + participle/
  // infinitive, mirroring how λύω is split across principal-part lemma keys), so
  // there are no "optional extension" forms left to add: the optional-groups list
  // is empty, just like λύω only lists genuinely-non-core forms (subjunctives,
  // extra imperatives) there. The full participle declensions stay in
  // POREUOMAI_EXTRA_FORMS for wrong-parse lookup (same as λύω, whose drilled
  // participle paradigms are recognition-nominative subsets).
  const POREUOMAI_OPTIONAL_GROUPS = [];
  const POREUOMAI_VARIANTS = [
    'πορεύομαι',
    'πορεύομαι → ἐπορευόμην',
    'πορεύομαι → πορεύσομαι',
    'πορεύομαι → ἐπορεύθην',
    'πορεύομαι → πορευθείς',
    'πορεύομαι infinitive forms'
  ];

  // ─── δείκνυμι (μι-verb, no reduplication, "to show") ──────────────
  //
  // Mounce drills the present active (Ch 36, the last chapter). These fill out
  // the present active indicative + infinitive, the 1st-aorist active ἔδειξα +
  // infinitive, and the recognition nominatives of the present (δεικνύς) and
  // aorist (δείξας) active participles. Hand-authored (no duff source); full
  // μι-/-ας participle declensions deferred (accent-dense). Everything gates at
  // Ch 36, so it's all in scope whenever δείκνυμι is.
  const DEIKNYMI_PRESENT_ACTIVE_INDICATIVE = {
    'δείκνυμι':   'present active indicative first person singular',
    'δείκνυς':    'present active indicative second person singular',
    'δείκνυσι':   'present active indicative third person singular',
    'δείκνυσιν':  'present active indicative third person singular',
    'δείκνυμεν':  'present active indicative first person plural',
    'δείκνυτε':   'present active indicative second person plural',
    'δεικνύασι':  'present active indicative third person plural',
    'δεικνύασιν': 'present active indicative third person plural'
  };
  const DEIKNYMI_PRESENT_ACTIVE_INFINITIVE = { 'δεικνύναι': 'present active infinitive' };
  const DEIKNYMI_AORIST_ACTIVE_INDICATIVE = {
    'ἔδειξα':    'aorist active indicative first person singular',
    'ἔδειξας':   'aorist active indicative second person singular',
    'ἔδειξε':    'aorist active indicative third person singular',
    'ἔδειξεν':   'aorist active indicative third person singular',
    'ἐδείξαμεν': 'aorist active indicative first person plural',
    'ἐδείξατε':  'aorist active indicative second person plural',
    'ἔδειξαν':   'aorist active indicative third person plural'
  };
  const DEIKNYMI_AORIST_ACTIVE_INFINITIVE = { 'δεῖξαι': 'aorist active infinitive' };
  const DEIKNYMI_PRESENT_ACTIVE_PARTICIPLE_NOM = {
    'δεικνύς':  'present active participle nominative singular masculine',
    'δεικνῦσα': 'present active participle nominative singular feminine',
    'δεικνύν':  'present active participle nominative/accusative singular neuter'
  };
  const DEIKNYMI_AORIST_ACTIVE_PARTICIPLE_NOM = {
    'δείξας':  'aorist active participle nominative singular masculine',
    'δείξασα': 'aorist active participle nominative singular feminine',
    'δεῖξαν':  'aorist active participle nominative/accusative singular neuter'
  };
  const DEIKNYMI_EXTRA_FORMS = {
    ...DEIKNYMI_PRESENT_ACTIVE_INDICATIVE,
    ...DEIKNYMI_PRESENT_ACTIVE_INFINITIVE,
    ...DEIKNYMI_AORIST_ACTIVE_INDICATIVE,
    ...DEIKNYMI_AORIST_ACTIVE_INFINITIVE,
    ...DEIKNYMI_PRESENT_ACTIVE_PARTICIPLE_NOM,
    ...DEIKNYMI_AORIST_ACTIVE_PARTICIPLE_NOM
  };
  const DEIKNYMI_OPTIONAL_GROUPS = [
    { chapter: 36, alwaysInclude: true, family: 'δείκνυμι — present active infinitive δεικνύναι (required)',
      forms: DEIKNYMI_PRESENT_ACTIVE_INFINITIVE },
    { chapter: 36, alwaysInclude: true, family: 'δείκνυμι — aorist active indicative ἔδειξα (required)',
      forms: DEIKNYMI_AORIST_ACTIVE_INDICATIVE },
    { chapter: 36, alwaysInclude: true, family: 'δείκνυμι — aorist active infinitive δεῖξαι (required)',
      forms: DEIKNYMI_AORIST_ACTIVE_INFINITIVE },
    { chapter: 36, family: 'δείκνυμι — present active participle δεικνύς (optional, nom.)',
      forms: DEIKNYMI_PRESENT_ACTIVE_PARTICIPLE_NOM },
    { chapter: 36, family: 'δείκνυμι — aorist active participle δείξας (optional, nom.)',
      forms: DEIKNYMI_AORIST_ACTIVE_PARTICIPLE_NOM }
  ];
  const DEIKNYMI_VARIANTS = ['δείκνυμι (no reduplication)'];

  // ─── Optative mood (Mounce Ch 31 — the rare sibling of the subjunctive) ──
  //
  // Mounce introduces the subjunctive at Ch 31; the optative belongs to the
  // same non-indicative tier and is taught alongside it. It is vanishingly
  // rare in the NT (~68 of 28,000+ verbs) — only εἴη (εἰμί, always 3sg),
  // γένοιτο (γίνομαι, Paul's μὴ γένοιτο), and δῴη (δίδωμι, "may the Lord
  // grant") occur with any frequency. Those occurring parses, plus λύω /
  // πορεύομαι model forms, are drilled as REQUIRED cards (MORPHOLOGY_SETS
  // "31" in morphology.js); the FULL paradigms below are parked in the
  // OPTIONAL pool (non-core groups), so "Include optatives" surfaces the
  // complete optative without forcing it on anyone — exactly how the
  // subjunctive is handled in this file.
  //
  // No augment (like the subjunctive); the iota mood-sign is the tell —
  // ‑οι‑ (present/future), ‑αι‑ (1st aorist), ‑ει‑/‑ιη‑ (aorist passive /
  // athematic). Forms ported from the duff study tool's optative tables, with
  // duff's model middle ῥύομαι swapped for Mounce's model deponent πορεύομαι
  // (whose passive-form aorist ἐπορεύθην yields an aorist-PASSIVE optative,
  // not a middle one). Aorist qualifiers are stored plain ("aorist", never
  // "second aorist") to match every other Mounce parse string — the
  // 2nd-aorist fact lives in the family label only. No future/perfect
  // non-indicative *gap* applies: the optative keeps a future (λύσοιμι); only
  // imperfect/pluperfect are barred (STRUCTURAL_TENSE_MOOD_IMPOSSIBILITIES).

  // λύω — model regular ω-verb, all voices.
  const LUO_PRESENT_ACTIVE_OPTATIVE = {
    'λύοιμι':   'present active optative first person singular',
    'λύοις':    'present active optative second person singular',
    'λύοι':     'present active optative third person singular',
    'λύοιμεν':  'present active optative first person plural',
    'λύοιτε':   'present active optative second person plural',
    'λύοιεν':   'present active optative third person plural'
  };
  const LUO_FUTURE_ACTIVE_OPTATIVE = {
    'λύσοιμι':   'future active optative first person singular',
    'λύσοις':    'future active optative second person singular',
    'λύσοι':     'future active optative third person singular',
    'λύσοιμεν':  'future active optative first person plural',
    'λύσοιτε':   'future active optative second person plural',
    'λύσοιεν':   'future active optative third person plural'
  };
  const LUO_AORIST_ACTIVE_OPTATIVE = {
    'λύσαιμι':   'aorist active optative first person singular',
    'λύσαις':    'aorist active optative second person singular',
    // λύσαι (acute) = aorist active optative 3sg; distinct in accent from the
    // drilled infinitive λῦσαι (circumflex) and the middle imperative λῦσαι.
    'λύσαι':     'aorist active optative third person singular',
    'λύσαιμεν':  'aorist active optative first person plural',
    'λύσαιτε':   'aorist active optative second person plural',
    'λύσαιεν':   'aorist active optative third person plural'
  };
  const LUO_PRESENT_MP_OPTATIVE = {
    'λυοίμην':   'present middle/passive optative first person singular',
    'λύοιο':     'present middle/passive optative second person singular',
    'λύοιτο':    'present middle/passive optative third person singular',
    'λυοίμεθα':  'present middle/passive optative first person plural',
    'λύοισθε':   'present middle/passive optative second person plural',
    'λύοιντο':   'present middle/passive optative third person plural'
  };
  const LUO_FUTURE_MIDDLE_OPTATIVE = {
    'λυσοίμην':   'future middle optative first person singular',
    'λύσοιο':     'future middle optative second person singular',
    'λύσοιτο':    'future middle optative third person singular',
    'λυσοίμεθα':  'future middle optative first person plural',
    'λύσοισθε':   'future middle optative second person plural',
    'λύσοιντο':   'future middle optative third person plural'
  };
  const LUO_AORIST_MIDDLE_OPTATIVE = {
    'λυσαίμην':   'aorist middle optative first person singular',
    'λύσαιο':     'aorist middle optative second person singular',
    'λύσαιτο':    'aorist middle optative third person singular',
    'λυσαίμεθα':  'aorist middle optative first person plural',
    'λύσαισθε':   'aorist middle optative second person plural',
    'λύσαιντο':   'aorist middle optative third person plural'
  };
  const LUO_FUTURE_PASSIVE_OPTATIVE = {
    'λυθησοίμην':   'future passive optative first person singular',
    'λυθήσοιο':     'future passive optative second person singular',
    'λυθήσοιτο':    'future passive optative third person singular',
    'λυθησοίμεθα':  'future passive optative first person plural',
    'λυθήσοισθε':   'future passive optative second person plural',
    'λυθήσοιντο':   'future passive optative third person plural'
  };
  const LUO_AORIST_PASSIVE_OPTATIVE = {
    'λυθείην':   'aorist passive optative first person singular',
    'λυθείης':   'aorist passive optative second person singular',
    'λυθείη':    'aorist passive optative third person singular',
    'λυθεῖμεν':  'aorist passive optative first person plural',
    'λυθεῖτε':   'aorist passive optative second person plural',
    'λυθεῖεν':   'aorist passive optative third person plural'
  };
  const LUO_PERFECT_ACTIVE_OPTATIVE = {
    'λελύκοιμι':   'perfect active optative first person singular',
    'λελύκοις':    'perfect active optative second person singular',
    'λελύκοι':     'perfect active optative third person singular',
    'λελύκοιμεν':  'perfect active optative first person plural',
    'λελύκοιτε':   'perfect active optative second person plural',
    'λελύκοιεν':   'perfect active optative third person plural'
  };
  // Aeolic/athematic doublets (lookup-only): the ‑ειας/‑ειε/‑ειαν 1st-aorist
  // active alternates and the longer ‑ίημεν/‑ίητε/‑ίησαν aorist passive forms.
  const LUO_OPTATIVE_EXTRA = {
    'λύσειας':     'aorist active optative second person singular',
    'λύσειε':      'aorist active optative third person singular',
    'λύσειεν':     'aorist active optative third person singular',
    'λύσειαν':     'aorist active optative third person plural',
    'λυθείημεν':   'aorist passive optative first person plural',
    'λυθείητε':    'aorist passive optative second person plural',
    'λυθείησαν':   'aorist passive optative third person plural'
  };
  const LUO_OPTATIVE_GROUPS = [
    { chapter: 31, family: 'λύω — present active optative (optional)',  forms: LUO_PRESENT_ACTIVE_OPTATIVE },
    { chapter: 31, family: 'λύω — future active optative (optional)',   forms: LUO_FUTURE_ACTIVE_OPTATIVE },
    { chapter: 31, family: 'λύω — aorist active optative (optional)',   forms: LUO_AORIST_ACTIVE_OPTATIVE },
    { chapter: 31, family: 'λύω — present middle/passive optative (optional)', forms: LUO_PRESENT_MP_OPTATIVE },
    { chapter: 31, family: 'λύω — future middle optative (optional)',   forms: LUO_FUTURE_MIDDLE_OPTATIVE },
    { chapter: 31, family: 'λύω — aorist middle optative (optional)',   forms: LUO_AORIST_MIDDLE_OPTATIVE },
    { chapter: 31, family: 'λύω — future passive optative (optional)',  forms: LUO_FUTURE_PASSIVE_OPTATIVE },
    { chapter: 31, family: 'λύω — aorist passive optative (optional)',  forms: LUO_AORIST_PASSIVE_OPTATIVE },
    { chapter: 31, family: 'λύω — perfect active optative (optional)',  forms: LUO_PERFECT_ACTIVE_OPTATIVE }
  ];

  // εἰμί — present active optative (εἴην series; the NT only ever shows the
  // 3sg εἴη) and the deponent future middle optative (ἐσοίμην series).
  const EIMI_PRESENT_ACTIVE_OPTATIVE = {
    'εἴην':   'present active optative first person singular',
    'εἴης':   'present active optative second person singular',
    'εἴη':    'present active optative third person singular',
    'εἶμεν':  'present active optative first person plural',
    'εἶτε':   'present active optative second person plural',
    'εἶεν':   'present active optative third person plural'
  };
  const EIMI_FUTURE_MIDDLE_OPTATIVE = {
    'ἐσοίμην':   'future middle optative first person singular',
    'ἔσοιο':     'future middle optative second person singular',
    'ἔσοιτο':    'future middle optative third person singular',
    'ἐσοίμεθα':  'future middle optative first person plural',
    'ἔσοισθε':   'future middle optative second person plural',
    'ἔσοιντο':   'future middle optative third person plural'
  };
  const EIMI_OPTATIVE_EXTRA = {
    'εἴημεν':  'present active optative first person plural',
    'εἴητε':   'present active optative second person plural',
    'εἴησαν':  'present active optative third person plural'
  };
  const EIMI_OPTATIVE_GROUPS = [
    { chapter: 31, family: 'εἰμί — present optative (optional)',        forms: EIMI_PRESENT_ACTIVE_OPTATIVE },
    { chapter: 31, family: 'εἰμί — future middle optative (optional)',  forms: EIMI_FUTURE_MIDDLE_OPTATIVE }
  ];

  // δίδωμι — athematic present (διδοίην) + root-aorist (δοίην) optative. NT
  // attests the aorist 3sg δῴη ("may he grant"); the regular δοίη is included.
  const DIDOMI_PRESENT_ACTIVE_OPTATIVE = {
    'διδοίην':   'present active optative first person singular',
    'διδοίης':   'present active optative second person singular',
    'διδοίη':    'present active optative third person singular',
    'διδοῖμεν':  'present active optative first person plural',
    'διδοῖτε':   'present active optative second person plural',
    'διδοῖεν':   'present active optative third person plural'
  };
  const DIDOMI_AORIST_ACTIVE_OPTATIVE = {
    'δοίην':   'aorist active optative first person singular',
    'δοίης':   'aorist active optative second person singular',
    'δοίη':    'aorist active optative third person singular',
    'δοῖμεν':  'aorist active optative first person plural',
    'δοῖτε':   'aorist active optative second person plural',
    'δοῖεν':   'aorist active optative third person plural'
  };
  // δῴη — the form that actually occurs in the GNT (2 Tim 1:16); a contracted
  // by-form of the regular δοίη above. ‑ῳ‑ with iota subscript.
  const DIDOMI_OPTATIVE_EXTRA = {
    'διδοῖ':  'present active optative third person singular',
    'δῴη':    'aorist active optative third person singular'
  };
  const DIDOMI_OPTATIVE_GROUPS = [
    { chapter: 34, family: 'δίδωμι — present active optative (optional)', forms: DIDOMI_PRESENT_ACTIVE_OPTATIVE },
    { chapter: 35, family: 'δίδωμι — aorist active optative (optional)',  forms: DIDOMI_AORIST_ACTIVE_OPTATIVE }
  ];

  // γίνομαι — 2nd-aorist middle optative; the 3sg γένοιτο is the NT's most
  // common optative (μὴ γένοιτο). Stored plain "aorist middle" (Mounce parses
  // γίνομαι's aorist plain everywhere; the 2nd-aorist fact is in the label).
  const GINOMAI_AORIST_MIDDLE_OPTATIVE = {
    'γενοίμην':   'aorist middle optative first person singular',
    'γένοιο':     'aorist middle optative second person singular',
    'γένοιτο':    'aorist middle optative third person singular',
    'γενοίμεθα':  'aorist middle optative first person plural',
    'γένοισθε':   'aorist middle optative second person plural',
    'γένοιντο':   'aorist middle optative third person plural'
  };
  const GINOMAI_OPTATIVE_GROUPS = [
    { chapter: 31, family: 'γίνομαι — aorist middle optative (2nd aorist, optional)', forms: GINOMAI_AORIST_MIDDLE_OPTATIVE }
  ];

  // ποιέω — contract (ε) model: present active/middle + future active optative.
  const POIEO_PRESENT_ACTIVE_OPTATIVE = {
    'ποιοίην':   'present active optative first person singular',
    'ποιοίης':   'present active optative second person singular',
    'ποιοίη':    'present active optative third person singular',
    'ποιοῖμεν':  'present active optative first person plural',
    'ποιοῖτε':   'present active optative second person plural',
    'ποιοῖεν':   'present active optative third person plural'
  };
  const POIEO_PRESENT_MP_OPTATIVE = {
    'ποιοίμην':   'present middle/passive optative first person singular',
    'ποιοῖο':     'present middle/passive optative second person singular',
    'ποιοῖτο':    'present middle/passive optative third person singular',
    'ποιοίμεθα':  'present middle/passive optative first person plural',
    'ποιοῖσθε':   'present middle/passive optative second person plural',
    'ποιοῖντο':   'present middle/passive optative third person plural'
  };
  const POIEO_FUTURE_ACTIVE_OPTATIVE = {
    'ποιήσοιμι':   'future active optative first person singular',
    'ποιήσοις':    'future active optative second person singular',
    'ποιήσοι':     'future active optative third person singular',
    'ποιήσοιμεν':  'future active optative first person plural',
    'ποιήσοιτε':   'future active optative second person plural',
    'ποιήσοιεν':   'future active optative third person plural'
  };
  const POIEO_OPTATIVE_EXTRA = {
    'ποιοῖ':  'present active optative third person singular'
  };
  const POIEO_OPTATIVE_GROUPS = [
    { chapter: 31, family: 'ποιέω — present active optative (optional)',        forms: POIEO_PRESENT_ACTIVE_OPTATIVE },
    { chapter: 31, family: 'ποιέω — present middle/passive optative (optional)', forms: POIEO_PRESENT_MP_OPTATIVE },
    { chapter: 31, family: 'ποιέω — future active optative (optional)',         forms: POIEO_FUTURE_ACTIVE_OPTATIVE }
  ];

  // λαμβάνω — 2nd-aorist active optative (λάβοιμι, from ἔλαβον). Stored plain
  // "aorist active" (Mounce parses ἔλαβον plain "aorist active" everywhere).
  const LAMBANO_AORIST_ACTIVE_OPTATIVE = {
    'λάβοιμι':   'aorist active optative first person singular',
    'λάβοις':    'aorist active optative second person singular',
    'λάβοι':     'aorist active optative third person singular',
    'λάβοιμεν':  'aorist active optative first person plural',
    'λάβοιτε':   'aorist active optative second person plural',
    'λάβοιεν':   'aorist active optative third person plural'
  };
  const LAMBANO_OPTATIVE_GROUPS = [
    { chapter: 31, family: 'λαμβάνω — aorist active optative (2nd aorist, optional)', forms: LAMBANO_AORIST_ACTIVE_OPTATIVE }
  ];

  // πορεύομαι — Mounce's model deponent (stands in for duff's ῥύομαι). Present
  // MIDDLE optative + aorist PASSIVE optative (its aorist is the passive-form
  // ἐπορεύθην, so the aorist optative is πορευθείην, on the λυθείην pattern).
  const POREUOMAI_PRESENT_MIDDLE_OPTATIVE = {
    'πορευοίμην':   'present middle optative first person singular',
    'πορεύοιο':     'present middle optative second person singular',
    'πορεύοιτο':    'present middle optative third person singular',
    'πορευοίμεθα':  'present middle optative first person plural',
    'πορεύοισθε':   'present middle optative second person plural',
    'πορεύοιντο':   'present middle optative third person plural'
  };
  const POREUOMAI_AORIST_PASSIVE_OPTATIVE = {
    'πορευθείην':   'aorist passive optative first person singular',
    'πορευθείης':   'aorist passive optative second person singular',
    'πορευθείη':    'aorist passive optative third person singular',
    'πορευθεῖμεν':  'aorist passive optative first person plural',
    'πορευθεῖτε':   'aorist passive optative second person plural',
    'πορευθεῖεν':   'aorist passive optative third person plural'
  };
  const POREUOMAI_OPTATIVE_EXTRA = {
    'πορευθείημεν':  'aorist passive optative first person plural',
    'πορευθείητε':   'aorist passive optative second person plural',
    'πορευθείησαν':  'aorist passive optative third person plural'
  };
  const POREUOMAI_OPTATIVE_GROUPS = [
    { chapter: 31, family: 'πορεύομαι — present middle optative (optional)', forms: POREUOMAI_PRESENT_MIDDLE_OPTATIVE },
    { chapter: 31, family: 'πορεύομαι — aorist passive optative (optional)', forms: POREUOMAI_AORIST_PASSIVE_OPTATIVE }
  ];

  // Flat optative maps spread into each lemma's extraForms so the fallback
  // form-lookup resolves an optative pick even when "Include optatives" is off
  // (mirrors how the subjunctive sits in both the groups and extraForms). All
  // keys are distinct Greek strings — the iota mood-sign keeps them clear of
  // the subjunctive (η/ω) and indicative forms.
  const LUO_OPTATIVE_ALL = {
    ...LUO_PRESENT_ACTIVE_OPTATIVE, ...LUO_FUTURE_ACTIVE_OPTATIVE, ...LUO_AORIST_ACTIVE_OPTATIVE,
    ...LUO_PRESENT_MP_OPTATIVE, ...LUO_FUTURE_MIDDLE_OPTATIVE, ...LUO_AORIST_MIDDLE_OPTATIVE,
    ...LUO_FUTURE_PASSIVE_OPTATIVE, ...LUO_AORIST_PASSIVE_OPTATIVE, ...LUO_PERFECT_ACTIVE_OPTATIVE,
    ...LUO_OPTATIVE_EXTRA
  };
  const EIMI_OPTATIVE_ALL = { ...EIMI_PRESENT_ACTIVE_OPTATIVE, ...EIMI_FUTURE_MIDDLE_OPTATIVE, ...EIMI_OPTATIVE_EXTRA };
  const DIDOMI_OPTATIVE_ALL = { ...DIDOMI_PRESENT_ACTIVE_OPTATIVE, ...DIDOMI_AORIST_ACTIVE_OPTATIVE, ...DIDOMI_OPTATIVE_EXTRA };
  const GINOMAI_OPTATIVE_ALL = { ...GINOMAI_AORIST_MIDDLE_OPTATIVE };
  const POIEO_OPTATIVE_ALL = { ...POIEO_PRESENT_ACTIVE_OPTATIVE, ...POIEO_PRESENT_MP_OPTATIVE, ...POIEO_FUTURE_ACTIVE_OPTATIVE, ...POIEO_OPTATIVE_EXTRA };
  const LAMBANO_OPTATIVE_ALL = { ...LAMBANO_AORIST_ACTIVE_OPTATIVE };
  const POREUOMAI_OPTATIVE_ALL = { ...POREUOMAI_PRESENT_MIDDLE_OPTATIVE, ...POREUOMAI_AORIST_PASSIVE_OPTATIVE, ...POREUOMAI_OPTATIVE_EXTRA };

  const LEMMA_INVENTORY = {
    // εἰμί has no morphology.js cards yet in mounce — kept here so the
    // optional-extension drill (future participle, future infinitive,
    // present imperative) and the fallback form-lookup are ready the
    // moment εἰμί gets paradigm data. Suppletive: no aorist/perfect.
    'εἰμί': {
      impossibleTenses: ['aorist', 'first aorist', 'second aorist', 'perfect', 'pluperfect'],
      extraForms: {
        ...EIMI_FUTURE_MIDDLE_PARTICIPLE,
        ...EIMI_FUTURE_MIDDLE_INFINITIVE,
        ...EIMI_PRESENT_ACTIVE_IMPERATIVE,
        ...EIMI_OPTATIVE_ALL
      },
      optionalFormGroups: [...EIMI_OPTIONAL_GROUPS, ...EIMI_OPTATIVE_GROUPS]
    },
    'λόγος': {
      extraForms: LOGOS_VOCATIVE
    },
    'μαθητής': {
      extraForms: { ...MATHETES_VOCATIVE, ...MATHETES_VOC_PL_EXTRAS }
    }
  };

  // Register the shared verb entries under every principal-part variant
  // key so the optional extension surfaces no matter which lemma the
  // student focuses on.
  function registerVariants(keys, entry) {
    keys.forEach((key) => { LEMMA_INVENTORY[key] = entry; });
  }
  registerVariants(LUO_VARIANTS, {
    extraForms: { ...LUO_FULL_EXTRA_FORMS, ...LUO_OPTATIVE_ALL },
    optionalFormGroups: [...LUO_FULL_OPTIONAL_GROUPS, ...LUO_OPTATIVE_GROUPS]
  });
  registerVariants(GINOMAI_VARIANTS, {
    extraForms: { ...GINOMAI_FULL_EXTRA_FORMS, ...GINOMAI_OPTATIVE_ALL },
    optionalFormGroups: [...GINOMAI_FULL_OPTIONAL_GROUPS, ...GINOMAI_OPTATIVE_GROUPS]
  });
  registerVariants(DIDOMI_VARIANTS, {
    extraForms: { ...DIDOMI_FULL_EXTRA_FORMS, ...DIDOMI_OPTATIVE_ALL },
    optionalFormGroups: [...DIDOMI_FULL_OPTIONAL_GROUPS, ...DIDOMI_OPTATIVE_GROUPS]
  });
  registerVariants(TITHEMI_VARIANTS, {
    extraForms: TITHEMI_FULL_EXTRA_FORMS,
    optionalFormGroups: TITHEMI_FULL_OPTIONAL_GROUPS
  });
  registerVariants(HISTEMI_VARIANTS, {
    extraForms: HISTEMI_FULL_EXTRA_FORMS,
    optionalFormGroups: HISTEMI_FULL_OPTIONAL_GROUPS
  });
  registerVariants(LAMBANO_VARIANTS, {
    extraForms: { ...LAMBANO_EXTRA_FORMS, ...LAMBANO_OPTATIVE_ALL },
    optionalFormGroups: [...LAMBANO_FULL_OPTIONAL_GROUPS, ...LAMBANO_OPTATIVE_GROUPS]
  });
  registerVariants(LEIPO_VARIANTS, {
    extraForms: LEIPO_EXTRA_FORMS,
    optionalFormGroups: LEIPO_FULL_OPTIONAL_GROUPS
  });
  // κρίνω: extraForms only (lookup feedback), no drillable optional groups.
  registerVariants(KRINO_VARIANTS, {
    extraForms: KRINO_EXTRA_FORMS
  });
  // Hand-authored (no duff source) — contract verbs, γράφω, πορεύομαι, δείκνυμι.
  registerVariants(AGAPAO_VARIANTS, {
    extraForms: AGAPAO_EXTRA_FORMS,
    optionalFormGroups: AGAPAO_OPTIONAL_GROUPS
  });
  registerVariants(POIEO_VARIANTS, {
    extraForms: { ...POIEO_EXTRA_FORMS, ...POIEO_OPTATIVE_ALL },
    optionalFormGroups: [...POIEO_OPTIONAL_GROUPS, ...POIEO_OPTATIVE_GROUPS]
  });
  registerVariants(PLEROO_VARIANTS, {
    extraForms: PLEROO_EXTRA_FORMS,
    optionalFormGroups: PLEROO_OPTIONAL_GROUPS
  });
  registerVariants(GRAPHO_VARIANTS, {
    extraForms: GRAPHO_EXTRA_FORMS,
    optionalFormGroups: GRAPHO_OPTIONAL_GROUPS
  });
  registerVariants(POREUOMAI_VARIANTS, {
    extraForms: { ...POREUOMAI_EXTRA_FORMS, ...POREUOMAI_OPTATIVE_ALL },
    optionalFormGroups: [...POREUOMAI_OPTIONAL_GROUPS, ...POREUOMAI_OPTATIVE_GROUPS]
  });
  registerVariants(DEIKNYMI_VARIANTS, {
    extraForms: DEIKNYMI_EXTRA_FORMS,
    optionalFormGroups: DEIKNYMI_OPTIONAL_GROUPS
  });

  // Optional-extension coverage is now complete for every verb Mounce drills:
  // λύω / γίνομαι / δίδωμι / τίθημι / ἵστημι (earlier), λαμβάνω / λείπω / κρίνω
  // (ported from duff), and ἀγαπάω / ποιέω / πληρόω / γράφω / πορεύομαι /
  // δείκνυμι (hand-authored above). Remaining deliberate gaps, low priority:
  //   - contract verbs' present active participle and δείκνυμι's μι-/-ας
  //     participles ship recognition nominatives only (full accent-dense
  //     declensions deferred); their indicatives/infinitives are complete.
  //   - αὐτός / οὗτος / ὅς / ἐκεῖνος / ἐγώ / σύ : pronouns are
  //     already drilled in full; no obvious gaps.
  //   - λόγος / γραφή / ὥρα / ἔργον / σάρξ / πνεῦμα / ἀγαθός :
  //     nouns + adjective; the only standard gap is the vocative
  //     singular (already handled for λόγος).

  if (typeof window !== 'undefined') {
    window.LEMMA_INVENTORY = LEMMA_INVENTORY;
    // Principal-part variant families, keyed by base lemma. Mounce splits a
    // single verb across several lemma keys in morphology.js (λύω alone spans
    // 15 — present, future, imperfect, aorist act/mid/pas, perfect, the
    // participles, the infinitive set, the imperatives). This is the same
    // union the optional-extension registration above walks; exposing it lets
    // the parsing-mode focused-paradigm dropdown offer a summative
    // "λύω — all forms" pick that pools every member into one chapter-gated
    // deck (see domain/grammar/paradigm_focus.js). Only families with ≥2 core
    // variants are worth a summative entry. Keep this list in lockstep with
    // the *_VARIANTS arrays — adding a variant in one place feeds both the
    // optional drill and the aggregate.
    window.PARADIGM_VARIANT_FAMILIES = {
      'λύω': LUO_VARIANTS,
      'δίδωμι': DIDOMI_VARIANTS,
      'πορεύομαι': POREUOMAI_VARIANTS,
      // One-form verbs: a single focusable "→" split lemma that carries the
      // verb's optional/required principal parts. Registering a family gives each
      // a master "— all forms" cumulative (drilling all 6 principal parts) while
      // the "→" deck stays limited to its one tested part (see aggregateDescriptors
      // / the optional-emission scoping in paradigm_focus.js).
      'λαμβάνω': LAMBANO_VARIANTS,
      'λείπω': LEIPO_VARIANTS,
      'γίνομαι': GINOMAI_VARIANTS,
      'γράφω': GRAPHO_VARIANTS,
      'τίθημι': TITHEMI_VARIANTS,
      'ἵστημι': HISTEMI_VARIANTS,
      'δείκνυμι': DEIKNYMI_VARIANTS
    };
  }
})();
