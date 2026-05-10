// ═══════════════════════════════════════════════════════════════════════
//  MOUNCE MEMORIZATION TABLES — paradigm phone tables in BBG3 Part order
// ═══════════════════════════════════════════════════════════════════════
//
//  Phone-table format used by pages/memorization.html for guided
//  paradigm review. The original Duff app organized these by lecture
//  week; the Mounce variant groups them by Mounce's four Parts:
//
//     Part I   — Introduction (Ch 1–4): alphabet, vowels, breathings
//     Part II  — Noun System (Ch 5–14): article, decl, adj., pronouns
//     Part III — Indicative Verb (Ch 15–25): present → perfect
//     Part IV  — Nonindicative & μι (Ch 26–36): participles, subj.,
//                inf., imv., conditionals, μι verbs
//
//  The `week` field in each row is now repurposed to display the BBG
//  Part name; the existing memorization page UI just renders whatever
//  string is there.
//
// ═══════════════════════════════════════════════════════════════════════

const KOINE_GREEK_MEMORIZATION_PHONE_TABLES = [
  {
    week: 'Part I — Introduction',
    focus: 'Alphabet, vowels, breathings, diphthongs, accents (Ch 3–4)',
    rows: [
      { item: 'Alphabet', forms: 'α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ/ς τ υ φ χ ψ ω', cue: 'Name, sound, and write each lower-case letter.' },
      { item: 'Vowels (Mounce pyramid)', forms: 'ω · υ · ι ο · α ε η', cue: 'Long: η ω; short: ε ο; either: α ι υ.' },
      { item: 'Breathings', forms: '◌᾿ (smooth = no h) · ◌῾ (rough = h)', cue: 'Every initial vowel takes one. Initial ρ always rough.' },
      { item: 'Common diphthongs', forms: 'αι ει οι · αυ ευ ου · ηυ υι · ᾳ ῃ ῳ', cue: 'ᾳ ῃ ῳ are the iota-subscript long-vowel diphthongs (silent ι).' },
      { item: 'Accents', forms: 'acute (´) · grave (`) · circumflex (῀)', cue: 'Mostly mark stress; a handful of homograph-distinguishers.' }
    ]
  },
  {
    week: 'Part II — Noun System',
    focus: 'Article, 1st/2nd/3rd declension, adjectives, pronouns (Ch 5–14)',
    rows: [
      { item: 'Article ὁ ἡ τό', forms: 'ὁ · τοῦ · τῷ · τόν / οἱ · τῶν · τοῖς · τούς', cue: 'Mounce treats the article as the master pattern for case endings. Memorize all 24 cells.' },
      { item: 'Master case endings (1st/2nd decl.)', forms: 'ς – ν / υ ς υ / ι ι ι / ν ν ν // ι ι α / ων ων ων / ις ις ις / υς ς α', cue: 'Top block: nom-gen-dat-acc sg (m/f/n). Bottom block: nom-gen-dat-acc pl.' },
      { item: 'Master case endings (3rd decl.)', forms: 'ς – / ος ος / ι ι / α/ν – // ες α / ων ων / σι(ν) σι(ν) / ας α', cue: 'Stems often hidden by Square of Stops (Rule 7) and tau-drop (Rule 8).' },
      { item: 'Eight Noun Rules', forms: '1) α/η→1st decl 2) neut nom=acc 3) neut pl=α 4) dat sg = ι (subscript when possible) 5) ablaut 6) gen+dat masc=neut 7) Square of Stops 8) τ drops at word end', cue: 'Mounce returns to these constantly. Have them on instant recall.' },
      { item: 'Adjective ἀγαθός 2-1-2', forms: 'ἀγαθός ἀγαθή ἀγαθόν / ἀγαθοῦ ἀγαθῆς ἀγαθοῦ …', cue: 'Same endings as λόγος / γραφή / ἔργον.' },
      { item: 'Adjective positions', forms: 'attributive: ὁ ἀγαθὸς ἄνθρωπος / ὁ ἀγαθὸς ὁ ἄνθρωπος · predicate: ὁ ἄνθρωπος ἀγαθός / ἀγαθὸς ὁ ἄνθρωπος', cue: 'Article-precedes-adjective ⇒ attributive; otherwise predicate (supply εἰμί).' },
      { item: 'Personal pronouns 1st/2nd', forms: 'ἐγώ μου μοι με / ἡμεῖς ἡμῶν ἡμῖν ἡμᾶς // σύ σου σοι σε / ὑμεῖς ὑμῶν ὑμῖν ὑμᾶς', cue: 'Enclitic singular forms (μου, μοι, με, σου, σοι, σε) lose their accent in context.' },
      { item: 'αὐτός — three uses', forms: '(1) pronoun "he/she/it" · (2) intensive "himself" (predicate position) · (3) identical "same" (attributive position)', cue: 'Position relative to the article tells you which use.' },
      { item: 'Demonstratives', forms: 'οὗτος αὕτη τοῦτο (this) · ἐκεῖνος ἐκείνη ἐκεῖνο (that)', cue: 'Adjectival use: predicate-style position (οὗτος ὁ ἄνθρωπος, never ὁ οὗτος ἄνθρωπος).' },
      { item: 'Relative pronoun', forms: 'ὅς ἥ ὅ / οὗ ἧς οὗ / ᾧ ᾗ ᾧ / ὅν ἥν ὅ', cue: 'Agrees with antecedent in gender/number; case from its own clause.' }
    ]
  },
  {
    week: 'Part III — Indicative Verb System',
    focus: 'Present → perfect, all six tense stems, four-corner endings (Ch 15–25)',
    rows: [
      { item: 'Present active — λύω', forms: 'λύω · λύεις · λύει · λύομεν · λύετε · λύουσι(ν)', cue: 'Stem + connecting vowel ο/ε + primary active endings.' },
      { item: 'Present mid/pas — λύομαι', forms: 'λύομαι · λύῃ · λύεται · λυόμεθα · λύεσθε · λύονται', cue: 'Same stem + primary mid/pas endings (μαι σαι ται μεθα σθε νται).' },
      { item: 'Five Rules of Contraction', forms: 'ου ← εο/οε/οο · ει ← εε · ω ← (ο/ω + anything else) · α ← αε · η ← εα', cue: 'For ε / α / ο contract verbs (ποιέω, ἀγαπάω, πληρόω).' },
      { item: 'Imperfect — ἔλυον / ἐλυόμην', forms: 'ἔλυον · ἔλυες · ἔλυε(ν) · ἐλύομεν · ἐλύετε · ἔλυον // ἐλυόμην · ἐλύου · ἐλύετο · ἐλυόμεθα · ἐλύεσθε · ἐλύοντο', cue: 'Augment ε + present stem + secondary endings.' },
      { item: 'Future active — λύσω', forms: 'λύσω · λύσεις · λύσει · λύσομεν · λύσετε · λύσουσι(ν)', cue: 'Stem + tense formative σ + connecting vowel + primary active.' },
      { item: 'Liquid future — κρινῶ', forms: 'κρινῶ · κρινεῖς · κρινεῖ · κρινοῦμεν · κρινεῖτε · κρινοῦσι(ν)', cue: 'εσ formative; σ drops, ε contracts.' },
      { item: 'Second aorist — ἔλαβον / ἐγενόμην', forms: 'ἔλαβον … // ἐγενόμην …', cue: 'Augment + ALTERED stem + connecting vowel + secondary endings.' },
      { item: 'First aorist — ἔλυσα / ἐλυσάμην', forms: 'ἔλυσα · ἔλυσας · ἔλυσε(ν) · ἐλύσαμεν · ἐλύσατε · ἔλυσαν // ἐλυσάμην …', cue: 'Augment + present stem + tense formative σα + secondary endings.' },
      { item: 'Aorist passive — ἐλύθην / ἐγράφην', forms: 'ἐλύθην · ἐλύθης · ἐλύθη · ἐλύθημεν · ἐλύθητε · ἐλύθησαν // ἐγράφην · ἐγράφης · ἐγράφη …', cue: '1st aor pas: θη + secondary ACTIVE endings. 2nd aor pas: η + secondary active.' },
      { item: 'Future passive — λυθήσομαι', forms: 'λυθήσομαι · λυθήσῃ · λυθήσεται …', cue: 'Aor pas stem + θησ + connecting vowel + primary mid/pas. NO augment.' },
      { item: 'Perfect — λέλυκα / λέλυμαι', forms: 'λέλυκα · λέλυκας · λέλυκε(ν) · λελύκαμεν · λελύκατε · λελύκασι(ν) // λέλυμαι · λέλυσαι · λέλυται …', cue: 'Reduplication + (perfect stem) + κα/(none) + primary endings.' },
      { item: 'Reduplication of stops', forms: 'π β φ → πε · κ γ χ → κε · τ δ θ → τε', cue: 'Aspirated stops deaspirate when reduplicated (φ → πε, χ → κε, θ → τε).' },
      { item: 'Master Verb Chart skeleton', forms: 'Tense | Aug/Redup | Tense stem | Tense form. | Conn. vowel | Personal endings', cue: 'Mounce builds this column-by-column from Ch 16 to Ch 25. You should be able to fill it from memory by Ch 25.' }
    ]
  },
  {
    week: 'Part IV — Nonindicative & μι',
    focus: 'Participles, subjunctive, infinitive, imperative, conditionals, μι verbs (Ch 26–36)',
    rows: [
      { item: 'Participle morphemes', forms: 'ντ (active) · μενο/η (mid/pas) · οτ (perfect active)', cue: 'Three morphemes power every participle. Add to the appropriate tense stem.' },
      { item: 'Present active participle', forms: 'λύων λύουσα λῦον · λύοντος λυούσης λύοντος', cue: 'Present stem + ο + ντ (with case endings 3-1-3).' },
      { item: 'Present mid/pas participle', forms: 'λυόμενος λυομένη λυόμενον', cue: 'Present stem + ο + μενο/η (2-1-2 like an adjective).' },
      { item: 'Aorist active participle (1st)', forms: 'λύσας λύσασα λῦσαν · λύσαντος λυσάσης λύσαντος', cue: 'Aor stem + σα + ντ. NO augment in participles.' },
      { item: 'Aorist passive participle', forms: 'λυθείς λυθεῖσα λυθέν · λυθέντος λυθείσης λυθέντος', cue: 'Aor pas stem + θε + ντ. (2nd aor pas: just ε + ντ.)' },
      { item: 'Perfect active participle', forms: 'λελυκώς λελυκυῖα λελυκός · λελυκότος λελυκυίας λελυκότος', cue: 'Reduplication + stem + κ + οτ.' },
      { item: 'Perfect mid/pas participle', forms: 'λελυμένος λελυμένη λελυμένον', cue: 'Reduplication + stem + μενο/η. No tense formative.' },
      { item: 'Subjunctive markers', forms: 'long thematic vowel ω/η: λύω · λύῃς · λύῃ · λύωμεν · λύητε · λύωσι(ν)', cue: 'Subjunctive recognition: ω/η where you expected ο/ε. Used after ἵνα, ἐάν, etc.' },
      { item: 'Infinitive endings', forms: 'pres act ειν · pres mid/pas εσθαι · 1aor act σαι · 1aor mid σασθαι · 1aor pas θηναι · perf act ναι · perf m/p σθαι · 2aor act ειν · 2aor pas ηναι', cue: 'Articular preps: διά (because), εἰς/πρός (purpose), ἐν (while), μετά (after), πρό (before).' },
      { item: 'Imperative endings', forms: 'act/aor pas: – · τω · τε · τωσαν // mid/pas: ν (or σο→ου after vowel) · σθω · σθε · σθωσαν', cue: '2sg pres act = stem + ε (λῦε); 2sg aor act = stem + σον (λῦσον).' },
      { item: 'Five Rules of μι Verbs', forms: '1) reduplicate w/ ι 2) no thematic vowel in ind 3) endings μι/-/σι · μεν/τε/ασι 4) ablaut 5) κα as aor formative', cue: 'δίδωμι, τίθημι, ἵστημι, δείκνυμι. δείκνυμι skips reduplication (Rule 1 exception).' },
      { item: 'δίδωμι present + aorist', forms: 'δίδωμι · δίδως · δίδωσι(ν) · δίδομεν · δίδοτε · διδόασι(ν) // ἔδωκα · ἔδωκας · ἔδωκε(ν) · ἐδώκαμεν · ἐδώκατε · ἔδωκαν', cue: 'Aorist uses κα; participle δούς/δοῦσα/δόν; infinitive δοῦναι.' },
      { item: 'Conditional sentences', forms: '1st: εἰ + ind (assumed true) · 2nd: εἰ + impf/aor; apod. ἄν (contrary-to-fact) · 3rd: ἐάν + subj (probable future) · 4th: εἰ + opt; apod. ἄν + opt (most uncertain)', cue: '1st and 3rd are common in the NT; 2nd is rare; full 4th is essentially absent.' }
    ]
  }
];

window.KOINE_GREEK_MEMORIZATION_PHONE_TABLES = KOINE_GREEK_MEMORIZATION_PHONE_TABLES;
