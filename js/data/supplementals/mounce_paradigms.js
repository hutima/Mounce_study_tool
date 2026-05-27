// ═══════════════════════════════════════════════════════════════════════
//  MOUNCE PARADIGM SUPPLEMENTALS — chapter-keyed paradigm decks
// ═══════════════════════════════════════════════════════════════════════
//
//  Replaces the Duff per-week paradigm files with chapter-keyed
//  vocab decks for hot-spot paradigms. Each set is registered with
//  registerSupplementalVocabSet so the supplemental selector picks
//  it up automatically.
//
//  set.week is reused as a numeric chapter; the supplemental UI
//  groups numerically and the Mounce build relabels the heading
//  "Chapter N" instead of "Week N" in main.js.
// ═══════════════════════════════════════════════════════════════════════

(function () {
  if (typeof window.registerSupplementalVocabSet !== 'function') return;

  // ── Article paradigm (Ch 7) ────────────────────────────────────────
  window.registerSupplementalVocabSet('S07_ARTICLE', {
    label: 'ὁ, ἡ, τό — full article paradigm',
    week: 7,
    cards: [
      { g: 'ὁ', e: 'nominative singular masculine', required: true },
      { g: 'τοῦ', e: 'genitive singular masculine/neuter', required: true },
      { g: 'τῷ', e: 'dative singular masculine/neuter', required: true },
      { g: 'τόν', e: 'accusative singular masculine', required: true },
      { g: 'οἱ', e: 'nominative plural masculine', required: true },
      { g: 'τῶν', e: 'genitive plural (all genders)', required: true },
      { g: 'τοῖς', e: 'dative plural masculine/neuter', required: true },
      { g: 'τούς', e: 'accusative plural masculine', required: true },
      { g: 'ἡ', e: 'nominative singular feminine', required: true },
      { g: 'τῆς', e: 'genitive singular feminine', required: true },
      { g: 'τῇ', e: 'dative singular feminine', required: true },
      { g: 'τήν', e: 'accusative singular feminine', required: true },
      { g: 'αἱ', e: 'nominative plural feminine', required: true },
      { g: 'ταῖς', e: 'dative plural feminine', required: true },
      { g: 'τάς', e: 'accusative plural feminine', required: true },
      { g: 'τό', e: 'nominative or accusative singular neuter', required: true },
      { g: 'τά', e: 'nominative or accusative plural neuter', required: true }
    ]
  });

  // ── λόγος, γραφή, ἔργον (Ch 6/7) ──────────────────────────────────
  window.registerSupplementalVocabSet('S07_LOGOS', {
    label: 'λόγος — 2nd decl. masculine (full)',
    week: 7,
    cards: [
      { g: 'λόγος', e: 'nominative singular masculine', required: true },
      { g: 'λόγου', e: 'genitive singular masculine', required: true },
      { g: 'λόγῳ', e: 'dative singular masculine', required: true },
      { g: 'λόγον', e: 'accusative singular masculine', required: true },
      { g: 'λόγοι', e: 'nominative plural masculine', required: true },
      { g: 'λόγων', e: 'genitive plural masculine', required: true },
      { g: 'λόγοις', e: 'dative plural masculine', required: true },
      { g: 'λόγους', e: 'accusative plural masculine', required: true }
    ]
  });

  window.registerSupplementalVocabSet('S07_GRAPHE', {
    label: 'γραφή — 1st decl. feminine (η-pattern)',
    week: 7,
    cards: [
      { g: 'γραφή', e: 'nominative singular feminine', required: true },
      { g: 'γραφῆς', e: 'genitive singular feminine', required: true },
      { g: 'γραφῇ', e: 'dative singular feminine', required: true },
      { g: 'γραφήν', e: 'accusative singular feminine', required: true },
      { g: 'γραφαί', e: 'nominative plural feminine', required: true },
      { g: 'γραφῶν', e: 'genitive plural feminine', required: true },
      { g: 'γραφαῖς', e: 'dative plural feminine', required: true },
      { g: 'γραφάς', e: 'accusative plural feminine', required: true }
    ]
  });

  window.registerSupplementalVocabSet('S07_ERGON', {
    label: 'ἔργον — 2nd decl. neuter',
    week: 7,
    cards: [
      { g: 'ἔργον', e: 'nominative or accusative singular neuter', required: true },
      { g: 'ἔργου', e: 'genitive singular neuter', required: true },
      { g: 'ἔργῳ', e: 'dative singular neuter', required: true },
      { g: 'ἔργα', e: 'nominative or accusative plural neuter', required: true },
      { g: 'ἔργων', e: 'genitive plural neuter', required: true },
      { g: 'ἔργοις', e: 'dative plural neuter', required: true }
    ]
  });

  // -ης masculine: nom-sg keeps the -ς, gen-sg borrows -ου from the 2nd decl.
  // ("mixed" 1st-decl. masc.), but the rest follows γραφή.
  window.registerSupplementalVocabSet('S07_MATHETES', {
    label: 'μαθητής — 1st decl. masculine (-ης pattern)',
    week: 7,
    cards: [
      { g: 'μαθητής', e: 'nominative singular masculine', required: true },
      { g: 'μαθητοῦ', e: 'genitive singular masculine', required: true },
      { g: 'μαθητῇ', e: 'dative singular masculine', required: true },
      { g: 'μαθητήν', e: 'accusative singular masculine', required: true },
      { g: 'μαθηταί', e: 'nominative plural masculine', required: true },
      { g: 'μαθητῶν', e: 'genitive plural masculine', required: true },
      { g: 'μαθηταῖς', e: 'dative plural masculine', required: true },
      { g: 'μαθητάς', e: 'accusative plural masculine', required: true }
    ]
  });

  // ── ἀγαθός 2-1-2 adjective (Ch 9) ─────────────────────────────────
  window.registerSupplementalVocabSet('S09_AGATHOS', {
    label: 'ἀγαθός — 2-1-2 adjective (full)',
    week: 9,
    cards: [
      { g: 'ἀγαθός', e: 'nom. sg. masc.', required: true },
      { g: 'ἀγαθή', e: 'nom. sg. fem.', required: true },
      { g: 'ἀγαθόν', e: 'nom./acc. sg. neut. (or acc. sg. masc.)', required: true },
      { g: 'ἀγαθοῦ', e: 'gen. sg. masc./neut.', required: true },
      { g: 'ἀγαθῆς', e: 'gen. sg. fem.', required: true },
      { g: 'ἀγαθῷ', e: 'dat. sg. masc./neut.', required: true },
      { g: 'ἀγαθῇ', e: 'dat. sg. fem.', required: true },
      { g: 'ἀγαθήν', e: 'acc. sg. fem.', required: true },
      { g: 'ἀγαθοί', e: 'nom. pl. masc.', required: true },
      { g: 'ἀγαθαί', e: 'nom. pl. fem.', required: true },
      { g: 'ἀγαθά', e: 'nom./acc. pl. neut.', required: true },
      { g: 'ἀγαθούς', e: 'acc. pl. masc.', required: true },
      { g: 'ἀγαθάς', e: 'acc. pl. fem.', required: true }
    ]
  });

  // ── σάρξ 3rd declension (Ch 10) ───────────────────────────────────
  window.registerSupplementalVocabSet('S10_SARX', {
    label: 'σάρξ — 3rd declension feminine',
    week: 10,
    cards: [
      { g: 'σάρξ', e: 'nom. sg. fem.', required: true },
      { g: 'σαρκός', e: 'gen. sg. fem.', required: true },
      { g: 'σαρκί', e: 'dat. sg. fem.', required: true },
      { g: 'σάρκα', e: 'acc. sg. fem.', required: true },
      { g: 'σάρκες', e: 'nom. pl. fem.', required: true },
      { g: 'σαρκῶν', e: 'gen. pl. fem.', required: true },
      { g: 'σαρξί(ν)', e: 'dat. pl. fem.', required: true },
      { g: 'σάρκας', e: 'acc. pl. fem.', required: true }
    ]
  });

  // ── αὐτός (Ch 12) ──────────────────────────────────────────────────
  window.registerSupplementalVocabSet('S12_AUTOS', {
    label: 'αὐτός — full pronoun paradigm',
    week: 12,
    cards: [
      { g: 'αὐτός', e: 'nom. sg. masc.', required: true },
      { g: 'αὐτή', e: 'nom. sg. fem.', required: true },
      { g: 'αὐτό', e: 'nom./acc. sg. neut.', required: true },
      { g: 'αὐτοῦ', e: 'gen. sg. masc./neut.', required: true },
      { g: 'αὐτῆς', e: 'gen. sg. fem.', required: true },
      { g: 'αὐτῷ', e: 'dat. sg. masc./neut.', required: true },
      { g: 'αὐτῇ', e: 'dat. sg. fem.', required: true },
      { g: 'αὐτόν', e: 'acc. sg. masc.', required: true },
      { g: 'αὐτήν', e: 'acc. sg. fem.', required: true },
      { g: 'αὐτοί', e: 'nom. pl. masc.', required: true },
      { g: 'αὐταί', e: 'nom. pl. fem.', required: true },
      { g: 'αὐτά', e: 'nom./acc. pl. neut.', required: true },
      { g: 'αὐτῶν', e: 'gen. pl. (all genders)', required: true },
      { g: 'αὐτοῖς', e: 'dat. pl. masc./neut.', required: true },
      { g: 'αὐταῖς', e: 'dat. pl. fem.', required: true },
      { g: 'αὐτούς', e: 'acc. pl. masc.', required: true },
      { g: 'αὐτάς', e: 'acc. pl. fem.', required: true }
    ]
  });

  // ── Demonstratives (Ch 13) ─────────────────────────────────────────
  window.registerSupplementalVocabSet('S13_HOUTOS', {
    label: 'οὗτος — demonstrative ("this")',
    week: 13,
    cards: [
      { g: 'οὗτος', e: 'nom. sg. masc.', required: true },
      { g: 'αὕτη', e: 'nom. sg. fem.', required: true },
      { g: 'τοῦτο', e: 'nom./acc. sg. neut.', required: true },
      { g: 'τούτου', e: 'gen. sg. masc./neut.', required: true },
      { g: 'ταύτης', e: 'gen. sg. fem.', required: true },
      { g: 'τούτῳ', e: 'dat. sg. masc./neut.', required: true },
      { g: 'τούτων', e: 'gen. pl. (all genders)', required: true },
      { g: 'ταῦτα', e: 'nom./acc. pl. neut.', required: true }
    ]
  });

  // ── Relative pronoun (Ch 14) ───────────────────────────────────────
  window.registerSupplementalVocabSet('S14_RELATIVE', {
    label: 'ὅς, ἥ, ὅ — relative pronoun (full)',
    week: 14,
    cards: [
      { g: 'ὅς', e: 'nom. sg. masc.', required: true },
      { g: 'ἥ', e: 'nom. sg. fem.', required: true },
      { g: 'ὅ', e: 'nom./acc. sg. neut.', required: true },
      { g: 'οὗ', e: 'gen. sg. masc./neut.', required: true },
      { g: 'ἧς', e: 'gen. sg. fem.', required: true },
      { g: 'ᾧ', e: 'dat. sg. masc./neut.', required: true },
      { g: 'ᾗ', e: 'dat. sg. fem.', required: true },
      { g: 'ὅν', e: 'acc. sg. masc.', required: true },
      { g: 'ἥν', e: 'acc. sg. fem.', required: true },
      { g: 'οἵ', e: 'nom. pl. masc.', required: true },
      { g: 'αἵ', e: 'nom. pl. fem.', required: true },
      { g: 'ἅ', e: 'nom./acc. pl. neut.', required: true }
    ]
  });

  // ── Present active λύω (Ch 16) ─────────────────────────────────────
  window.registerSupplementalVocabSet('S16_LUO_PRESENT_ACTIVE', {
    label: 'λύω — present active indicative',
    week: 16,
    cards: [
      { g: 'λύω', e: '1sg present active ("I am loosing")', required: true },
      { g: 'λύεις', e: '2sg present active', required: true },
      { g: 'λύει', e: '3sg present active', required: true },
      { g: 'λύομεν', e: '1pl present active', required: true },
      { g: 'λύετε', e: '2pl present active', required: true },
      { g: 'λύουσι(ν)', e: '3pl present active', required: true }
    ]
  });

  // ── Present mid/pas λύομαι (Ch 18) ─────────────────────────────────
  window.registerSupplementalVocabSet('S18_LUO_MIDPAS', {
    label: 'λύομαι — present mid/pas indicative',
    week: 18,
    cards: [
      { g: 'λύομαι', e: '1sg present mid/pas', required: true },
      { g: 'λύῃ', e: '2sg present mid/pas', required: true },
      { g: 'λύεται', e: '3sg present mid/pas', required: true },
      { g: 'λυόμεθα', e: '1pl present mid/pas', required: true },
      { g: 'λύεσθε', e: '2pl present mid/pas', required: true },
      { g: 'λύονται', e: '3pl present mid/pas', required: true }
    ]
  });

  // ── Imperfect (Ch 21) ───────────────────────────────────────────────
  window.registerSupplementalVocabSet('S21_IMPERFECT_ACTIVE', {
    label: 'ἔλυον — imperfect active',
    week: 21,
    cards: [
      { g: 'ἔλυον', e: '1sg imperfect active (or 3pl)', required: true },
      { g: 'ἔλυες', e: '2sg imperfect active', required: true },
      { g: 'ἔλυε(ν)', e: '3sg imperfect active', required: true },
      { g: 'ἐλύομεν', e: '1pl imperfect active', required: true },
      { g: 'ἐλύετε', e: '2pl imperfect active', required: true }
    ]
  });

  // ── First aorist active (Ch 23) ────────────────────────────────────
  window.registerSupplementalVocabSet('S23_AORIST_ACTIVE', {
    label: 'ἔλυσα — 1st aorist active',
    week: 23,
    cards: [
      { g: 'ἔλυσα', e: '1sg 1st aorist active', required: true },
      { g: 'ἔλυσας', e: '2sg 1st aorist active', required: true },
      { g: 'ἔλυσε(ν)', e: '3sg 1st aorist active', required: true },
      { g: 'ἐλύσαμεν', e: '1pl 1st aorist active', required: true },
      { g: 'ἐλύσατε', e: '2pl 1st aorist active', required: true },
      { g: 'ἔλυσαν', e: '3pl 1st aorist active', required: true }
    ]
  });

  // ── Aorist passive (Ch 24) ─────────────────────────────────────────
  window.registerSupplementalVocabSet('S24_AORIST_PASSIVE', {
    label: 'ἐλύθην — 1st aorist passive',
    week: 24,
    cards: [
      { g: 'ἐλύθην', e: '1sg 1st aorist passive', required: true },
      { g: 'ἐλύθης', e: '2sg 1st aorist passive', required: true },
      { g: 'ἐλύθη', e: '3sg 1st aorist passive', required: true },
      { g: 'ἐλύθημεν', e: '1pl 1st aorist passive', required: true },
      { g: 'ἐλύθητε', e: '2pl 1st aorist passive', required: true },
      { g: 'ἐλύθησαν', e: '3pl 1st aorist passive', required: true }
    ]
  });

  // ── Perfect (Ch 25) ─────────────────────────────────────────────────
  window.registerSupplementalVocabSet('S25_PERFECT_ACTIVE', {
    label: 'λέλυκα — perfect active',
    week: 25,
    cards: [
      { g: 'λέλυκα', e: '1sg perfect active', required: true },
      { g: 'λέλυκας', e: '2sg perfect active', required: true },
      { g: 'λέλυκε(ν)', e: '3sg perfect active', required: true },
      { g: 'λελύκαμεν', e: '1pl perfect active', required: true },
      { g: 'λελύκατε', e: '2pl perfect active', required: true },
      { g: 'λελύκασι(ν)', e: '3pl perfect active', required: true }
    ]
  });

  window.registerSupplementalVocabSet('S25_PERFECT_MIDPAS', {
    label: 'λέλυμαι — perfect mid/pas',
    week: 25,
    cards: [
      { g: 'λέλυμαι', e: '1sg perfect mid/pas', required: true },
      { g: 'λέλυσαι', e: '2sg perfect mid/pas', required: true },
      { g: 'λέλυται', e: '3sg perfect mid/pas', required: true },
      { g: 'λελύμεθα', e: '1pl perfect mid/pas', required: true },
      { g: 'λέλυσθε', e: '2pl perfect mid/pas', required: true },
      { g: 'λέλυνται', e: '3pl perfect mid/pas', required: true }
    ]
  });

  // ── Present participles (Ch 27) ────────────────────────────────────
  window.registerSupplementalVocabSet('S27_PRES_PTC_ACT', {
    label: 'λύων / λύουσα / λῦον — present active participle',
    week: 27,
    cards: [
      { g: 'λύων', e: 'pres act ptc, nom. sg. masc.', required: true },
      { g: 'λύοντος', e: 'pres act ptc, gen. sg. masc./neut.', required: true },
      { g: 'λύουσα', e: 'pres act ptc, nom. sg. fem.', required: true },
      { g: 'λυούσης', e: 'pres act ptc, gen. sg. fem.', required: true },
      { g: 'λῦον', e: 'pres act ptc, nom./acc. sg. neut.', required: true },
      { g: 'λύοντες', e: 'pres act ptc, nom. pl. masc.', required: true }
    ]
  });

  window.registerSupplementalVocabSet('S27_PRES_PTC_MIDPAS', {
    label: 'λυόμενος — present mid/pas participle',
    week: 27,
    cards: [
      { g: 'λυόμενος', e: 'pres mid/pas ptc, nom. sg. masc.', required: true },
      { g: 'λυομένη', e: 'pres mid/pas ptc, nom. sg. fem.', required: true },
      { g: 'λυόμενον', e: 'pres mid/pas ptc, acc. sg. masc. or nom./acc. sg. neut.', required: true }
    ]
  });

  // ── Aorist passive participle (Ch 28) ──────────────────────────────
  window.registerSupplementalVocabSet('S28_AOR_PAS_PTC', {
    label: 'λυθείς — 1st aorist passive participle',
    week: 28,
    cards: [
      { g: 'λυθείς', e: '1aor pas ptc, nom. sg. masc.', required: true },
      { g: 'λυθέντος', e: '1aor pas ptc, gen. sg. masc./neut.', required: true },
      { g: 'λυθεῖσα', e: '1aor pas ptc, nom. sg. fem.', required: true },
      { g: 'λυθέν', e: '1aor pas ptc, nom./acc. sg. neut.', required: true }
    ]
  });

  // ── Infinitive endings (Ch 32) ─────────────────────────────────────
  window.registerSupplementalVocabSet('S32_INFINITIVE', {
    label: 'Infinitive endings (act / mid / pas)',
    week: 32,
    cards: [
      { g: 'λύειν', e: 'present active infinitive', required: true },
      { g: 'λύεσθαι', e: 'present mid/pas infinitive', required: true },
      { g: 'λῦσαι', e: '1st aorist active infinitive', required: true },
      { g: 'λύσασθαι', e: '1st aorist middle infinitive', required: true },
      { g: 'λυθῆναι', e: '1st aorist passive infinitive', required: true },
      { g: 'λελυκέναι', e: 'perfect active infinitive', required: true },
      { g: 'λελύσθαι', e: 'perfect mid/pas infinitive', required: true }
    ]
  });

  // ── Imperative endings (Ch 33) ─────────────────────────────────────
  window.registerSupplementalVocabSet('S33_IMPERATIVE_ACTIVE', {
    label: 'Present active imperative — λῦε',
    week: 33,
    cards: [
      { g: 'λῦε', e: '2sg present active imperative', required: true },
      { g: 'λυέτω', e: '3sg present active imperative ("let him loose")', required: true },
      { g: 'λύετε', e: '2pl present active imperative', required: true },
      { g: 'λυέτωσαν', e: '3pl present active imperative', required: true }
    ]
  });

  // ── δίδωμι (Ch 34) ──────────────────────────────────────────────────
  window.registerSupplementalVocabSet('S34_DIDOMI_PRES', {
    label: 'δίδωμι — present active indicative',
    week: 34,
    cards: [
      { g: 'δίδωμι', e: '1sg present active', required: true },
      { g: 'δίδως', e: '2sg present active', required: true },
      { g: 'δίδωσι(ν)', e: '3sg present active', required: true },
      { g: 'δίδομεν', e: '1pl present active', required: true },
      { g: 'δίδοτε', e: '2pl present active', required: true },
      { g: 'διδόασι(ν)', e: '3pl present active', required: true }
    ]
  });

  window.registerSupplementalVocabSet('S34_DIDOMI_AORIST', {
    label: 'δίδωμι — aorist active (κα formative)',
    week: 34,
    cards: [
      { g: 'ἔδωκα', e: '1sg aorist active', required: true },
      { g: 'ἔδωκας', e: '2sg aorist active', required: true },
      { g: 'ἔδωκε(ν)', e: '3sg aorist active', required: true },
      { g: 'ἐδώκαμεν', e: '1pl aorist active', required: true },
      { g: 'ἐδώκατε', e: '2pl aorist active', required: true },
      { g: 'ἔδωκαν', e: '3pl aorist active', required: true }
    ]
  });

  // ── Other μι verbs (Ch 36) ─────────────────────────────────────────
  window.registerSupplementalVocabSet('S36_HISTEMI_PRES', {
    label: 'ἵστημι — present active',
    week: 36,
    cards: [
      { g: 'ἵστημι', e: '1sg present active', required: true },
      { g: 'ἵστης', e: '2sg present active', required: true },
      { g: 'ἵστησι(ν)', e: '3sg present active', required: true },
      { g: 'ἵσταμεν', e: '1pl present active', required: true },
      { g: 'ἵστατε', e: '2pl present active', required: true },
      { g: 'ἱστᾶσι(ν)', e: '3pl present active', required: true }
    ]
  });

  window.registerSupplementalVocabSet('S36_TITHEMI_PRES', {
    label: 'τίθημι — present active',
    week: 36,
    cards: [
      { g: 'τίθημι', e: '1sg present active', required: true },
      { g: 'τίθης', e: '2sg present active', required: true },
      { g: 'τίθησι(ν)', e: '3sg present active', required: true },
      { g: 'τίθεμεν', e: '1pl present active', required: true },
      { g: 'τίθετε', e: '2pl present active', required: true },
      { g: 'τιθέασι(ν)', e: '3pl present active', required: true }
    ]
  });

  // ── λύω cumulative deck ────────────────────────────────────────────
  // Pools every λύω-family form from the broken-out sets above into a
  // single deck, with each card carrying the chapter where its form is
  // introduced. The vocab card builder in domain/deck/filters.js gates
  // these per-card against the max numeric chapter the user has
  // selected — so paired with chapters 1..N the deck always exposes
  // exactly the λύω forms taught through Ch N. Selected alone (no
  // chapter keys), the deck shows every form.
  const LUO_FAMILY_SOURCES = [
    'S16_LUO_PRESENT_ACTIVE',
    'S18_LUO_MIDPAS',
    'S21_IMPERFECT_ACTIVE',
    'S23_AORIST_ACTIVE',
    'S24_AORIST_PASSIVE',
    'S25_PERFECT_ACTIVE',
    'S25_PERFECT_MIDPAS',
    'S27_PRES_PTC_ACT',
    'S27_PRES_PTC_MIDPAS',
    'S28_AOR_PAS_PTC',
    'S32_INFINITIVE',
    'S33_IMPERATIVE_ACTIVE'
  ];
  const registry = window.SUPPLEMENTAL_VOCAB_SETS || {};
  const luoFullCards = [];
  LUO_FAMILY_SOURCES.forEach((sourceKey) => {
    const src = registry[sourceKey];
    if (!src || !Array.isArray(src.cards)) return;
    const chapter = Number(src.week);
    if (!Number.isFinite(chapter)) return;
    src.cards.forEach((card) => {
      luoFullCards.push({ ...card, chapter });
    });
  });
  if (luoFullCards.length) {
    window.registerSupplementalVocabSet('S16_LUO_FULL', {
      label: 'λύω — full paradigm (cumulative, gated by chapter)',
      week: 16,
      cards: luoFullCards
    });
  }
})();
