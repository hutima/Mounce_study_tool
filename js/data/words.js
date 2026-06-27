// ═══════════════════════════════════════════════════════════════════════
//  MOUNCE VOCAB DATA — Basics of Biblical Greek (BBG3, William D. Mounce)
// ═══════════════════════════════════════════════════════════════════════
//
//  Per-chapter vocab compiled from Paul Denisowski's BBG3 chapter-vocab
//  files (bbg3_NN.txt), Version 1.0, distributed with the Mounce study
//  tool repo. Chapters 1-3, 5, 15, 26 contain no Mounce vocab list.
//  Chapters 4 and 6-36 inclusive are sourced verbatim from those files,
//  with one BBG4 adjustment: ἅγιος moved from Ch 10 to Ch 9 (matching
//  the 4th-edition reordering — vocab is otherwise unchanged in BBG4).
//
//  Each entry: { g: "headword (with parsing info)", e: "gloss(es)", required: true }
//
//  Sessions are Part-based (Mounce's four parts) plus cumulative
//  through-Ch milestones, replacing Duff's lecture-week sessions.
//
// ═══════════════════════════════════════════════════════════════════════

const SETS = {
  "0": {
    "label": "Chapter 0 — Letters (alphabet practice)",
    "type": "chapter",
    "cards": [
      { "g": "α / Α", "e": "alpha (a)", "required": true },
      { "g": "β / Β", "e": "beta (b)", "required": true },
      { "g": "γ / Γ", "e": "gamma (g)", "required": true },
      { "g": "δ / Δ", "e": "delta (d)", "required": true },
      { "g": "ε / Ε", "e": "epsilon (e — short)", "required": true },
      { "g": "ζ / Ζ", "e": "zeta (z)", "required": true },
      { "g": "η / Η", "e": "eta (ē — long e)", "required": true },
      { "g": "θ / Θ", "e": "theta (th)", "required": true },
      { "g": "ι / Ι", "e": "iota (i)", "required": true },
      { "g": "κ / Κ", "e": "kappa (k)", "required": true },
      { "g": "λ / Λ", "e": "lambda (l)", "required": true },
      { "g": "μ / Μ", "e": "mu (m)", "required": true },
      { "g": "ν / Ν", "e": "nu (n)", "required": true },
      { "g": "ξ / Ξ", "e": "xi (x)", "required": true },
      { "g": "ο / Ο", "e": "omicron (o — short)", "required": true },
      { "g": "π / Π", "e": "pi (p)", "required": true },
      { "g": "ρ / Ρ", "e": "rho (r)", "required": true },
      { "g": "σ, ς / Σ", "e": "sigma (s — ς is the final form)", "required": true },
      { "g": "τ / Τ", "e": "tau (t)", "required": true },
      { "g": "υ / Υ", "e": "upsilon (u / y)", "required": true },
      { "g": "φ / Φ", "e": "phi (ph)", "required": true },
      { "g": "χ / Χ", "e": "chi (ch)", "required": true },
      { "g": "ψ / Ψ", "e": "psi (ps)", "required": true },
      { "g": "ω / Ω", "e": "omega (ō — long o)", "required": true }
    ]
  },
  "1": {
    "label": "Chapter 1 — The Greek Language",
    "type": "chapter",
    "cards": []
  },
  "2": {
    "label": "Chapter 2 — Learning Greek",
    "type": "chapter",
    "cards": []
  },
  "3": {
    "label": "Chapter 3 — Alphabet & Pronunciation",
    "type": "chapter",
    "cards": []
  },
  "4": {
    "label": "Chapter 4 — Punctuation, Syllabification & Vocabulary",
    "type": "chapter",
    "cards": [
      {
        "g": "ἄγγελος, -ου, ὁ",
        "e": "angel, messenger",
        "required": true
      },
      {
        "g": "ἀμήν",
        "e": "verily, truly, amen, so let it be",
        "required": true
      },
      {
        "g": "ἄνθρωπος, -ου, ὁ",
        "e": "man, mankind, person, people, humankind, human being",
        "required": true
      },
      {
        "g": "ἀπόστολος, -ου, ὁ",
        "e": "apostle, envoy, messenger",
        "required": true
      },
      {
        "g": "Γαλιλαία, -ας, ἡ",
        "e": "Galilee",
        "required": true
      },
      {
        "g": "γραφή, -ῆς, ἡ",
        "e": "writing, scripture",
        "required": true
      },
      {
        "g": "δόξα, -ης, ἡ",
        "e": "glory, majesty, fame",
        "required": true
      },
      {
        "g": "ἐγώ",
        "e": "I",
        "required": true
      },
      {
        "g": "ἔσχατος, -η, -ον",
        "e": "last",
        "required": true
      },
      {
        "g": "ζωή, -ῆς, ἡ",
        "e": "life",
        "required": true
      },
      {
        "g": "θεός, -οῦ, ὁ",
        "e": "God, god",
        "required": true
      },
      {
        "g": "καί",
        "e": "and, even, also, namely",
        "required": true
      },
      {
        "g": "καρδία, -ας, ἡ",
        "e": "heart, inner self",
        "required": true
      },
      {
        "g": "κόσμος, -ου, ὁ",
        "e": "world, universe, humankind",
        "required": true
      },
      {
        "g": "λόγος, -ου, ὁ",
        "e": "word, Word, statement, message",
        "required": true
      },
      {
        "g": "πνεῦμα, -τος, τό",
        "e": "spirit, Spirit, wind, breath, inner life",
        "required": true
      },
      {
        "g": "προφήτης, -ου, ὁ",
        "e": "prophet",
        "required": true
      },
      {
        "g": "σάββατον, -ου, τό",
        "e": "Sabbath, week",
        "required": true
      },
      {
        "g": "φωνή, -ῆς, ἡ",
        "e": "sound, voice",
        "required": true
      },
      {
        "g": "Χριστός, -οῦ, ὁ",
        "e": "Christ, Messiah, Anointed One",
        "required": true
      },
      {
        "g": "᾽Αβραάμ, ὁ",
        "e": "Abraham",
        "required": true
      },
      {
        "g": "Δαυίδ, ὁ",
        "e": "David",
        "required": true
      },
      {
        "g": "Παῦλος, -ου, ὁ",
        "e": "Paul",
        "required": true
      },
      {
        "g": "Πέτρος, -ου, ὁ",
        "e": "Peter",
        "required": true
      },
      {
        "g": "Πιλᾶτος, -ου, ὁ",
        "e": "Pilate",
        "required": true
      },
      {
        "g": "Σίμων, -ωνος, ὁ",
        "e": "Simon",
        "required": true
      }
    ]
  },
  "5": {
    "label": "Chapter 5 — Introduction to English Nouns",
    "type": "chapter",
    "cards": []
  },
  "6": {
    "label": "Chapter 6 — Nominative & Accusative; Article",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀγάπη, -ης, ἡ",
        "e": "love",
        "required": true
      },
      {
        "g": "ἄλλος, -η, -ο",
        "e": "other, another",
        "required": true
      },
      {
        "g": "αὐτός, -ή, -ό",
        "e": "(sing.) he, she it, (pl.) they",
        "required": true
      },
      {
        "g": "βασιλεία, -ας, ἡ",
        "e": "kingdom",
        "required": true
      },
      {
        "g": "δέ",
        "e": "but, and",
        "required": true
      },
      {
        "g": "ἐν+dat.",
        "e": "in, on, among",
        "required": true
      },
      {
        "g": "ἔργον, -ου, τό",
        "e": "work, deed, action",
        "required": true
      },
      {
        "g": "καιρός, -οῦ, ὁ",
        "e": "(appointed) time, season",
        "required": true
      },
      {
        "g": "νῦν",
        "e": "(adv.) now, (noun) the present",
        "required": true
      },
      {
        "g": "ὁ, ἡ, τό",
        "e": "the",
        "required": true
      },
      {
        "g": "ὅτι",
        "e": "that, since, because",
        "required": true
      },
      {
        "g": "οὐ, οὐκ, οὐχ",
        "e": "not",
        "required": true
      },
      {
        "g": "ὥρα, -ας, ἡ",
        "e": "hour, occasion, moment",
        "required": true
      }
    ]
  },
  "7": {
    "label": "Chapter 7 — Genitive & Dative",
    "type": "chapter",
    "cards": [
      {
        "g": "ἁμαρτία, -ας, ἡ",
        "e": "sin",
        "required": true
      },
      {
        "g": "ἀρχή, -ῆς, ἡ",
        "e": "beginning, ruler",
        "required": true
      },
      {
        "g": "γάρ",
        "e": "for, then",
        "required": true
      },
      {
        "g": "εἶπεν",
        "e": "he, she, it said",
        "required": true
      },
      {
        "g": "εἰς+acc.",
        "e": "in, into, among",
        "required": true
      },
      {
        "g": "ἐξουσία, -ας, ἡ",
        "e": "authority, power",
        "required": true
      },
      {
        "g": "εὐαγγέλιον, -ου, -ν",
        "e": "good news, Gospel",
        "required": true
      },
      {
        "g": "᾽Ιησοῦς, -ου, -ὁ",
        "e": "Jesus, Joshua",
        "required": true
      },
      {
        "g": "κύριος, -ου, ὁ",
        "e": "Lord, lord, master, sir",
        "required": true
      },
      {
        "g": "μή",
        "e": "not, lest",
        "required": true
      },
      {
        "g": "οὐρανός, -οῦ, ὁ",
        "e": "heaven, sky",
        "required": true
      },
      {
        "g": "οὗτος",
        "e": "(sing.) this (one), (pl.) these",
        "required": true
      },
      {
        "g": "σύ",
        "e": "you (sing.)",
        "required": true
      },
      {
        "g": "υἱός, -οῦ, ὁ",
        "e": "son, descendant",
        "required": true
      },
      {
        "g": "ὥστε",
        "e": "therefore, so that",
        "required": true
      }
    ]
  },
  "8": {
    "label": "Chapter 8 — Prepositions & εἰμί",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀλλά",
        "e": "but, yet, except",
        "required": true
      },
      {
        "g": "ἀπό+gen.",
        "e": "(away) from",
        "required": true
      },
      {
        "g": "διά+gen.",
        "e": "through",
        "required": true
      },
      {
        "g": "διά+acc.",
        "e": "on account of",
        "required": true
      },
      {
        "g": "εἰμί",
        "e": "I am, exist, live, am present",
        "required": true
      },
      {
        "g": "ἐκ, ἐξ+gen.",
        "e": "from, out of",
        "required": true
      },
      {
        "g": "ἡμέρα, -ας, ἡ",
        "e": "day",
        "required": true
      },
      {
        "g": "ἦν",
        "e": "he, she, it was",
        "required": true
      },
      {
        "g": "θάλασσα, -ης, ἡ",
        "e": "sea, lake",
        "required": true
      },
      {
        "g": "θάνατος, -ου, ὁ",
        "e": "death",
        "required": true
      },
      {
        "g": "ἵνα",
        "e": "in order that, that",
        "required": true
      },
      {
        "g": "᾽Ιωάννης, -ου, ὁ",
        "e": "John",
        "required": true
      },
      {
        "g": "λέγω",
        "e": "I say, speak",
        "required": true
      },
      {
        "g": "μετά+gen.",
        "e": "with",
        "required": true
      },
      {
        "g": "μετά+acc.",
        "e": "after",
        "required": true
      },
      {
        "g": "οἰκία, -ας, ἡ",
        "e": "house, home",
        "required": true
      },
      {
        "g": "οἶκος, -ου, ὁ",
        "e": "house, home",
        "required": true
      },
      {
        "g": "ὄχλος, -ου, ὁ",
        "e": "crowd, multitude",
        "required": true
      },
      {
        "g": "παρά+gen.",
        "e": "from",
        "required": true
      },
      {
        "g": "παρά+dat.",
        "e": "beside, in the presence of",
        "required": true
      },
      {
        "g": "παρά+acc.",
        "e": "alongside of",
        "required": true
      },
      {
        "g": "παραβολή, -ῆς, ἡ",
        "e": "parable",
        "required": true
      },
      {
        "g": "πρός+acc.",
        "e": "to, towards, with",
        "required": true
      },
      {
        "g": "ὑπό+gen.",
        "e": "by",
        "required": true
      },
      {
        "g": "ὑπό+acc.",
        "e": "under",
        "required": true
      }
    ]
  },
  "9": {
    "label": "Chapter 9 — Adjectives",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀγαθός, -ή, -όν",
        "e": "good, useful",
        "required": true
      },
      {
        "g": "ἀγαπητός, -ή, -όν",
        "e": "beloved",
        "required": true
      },
      {
        "g": "ἅγιος, -ία, -ιον",
        "e": "(adj.) holy; (pl. noun) saints",
        "required": true
      },
      {
        "g": "αἰώνιος, -ον",
        "e": "eternal",
        "required": true
      },
      {
        "g": "ἀλλήλων",
        "e": "one another",
        "required": true
      },
      {
        "g": "ἀπεκρίθη",
        "e": "he, she, it answered",
        "required": true
      },
      {
        "g": "δοῦλος, -ου, ὁ",
        "e": "slave, servant",
        "required": true
      },
      {
        "g": "ἐάν",
        "e": "if, when",
        "required": true
      },
      {
        "g": "ἐμός, ἐμή, ἐμόν",
        "e": "mine",
        "required": true
      },
      {
        "g": "ἐντολή, -ῆς, ἡ",
        "e": "commandment",
        "required": true
      },
      {
        "g": "καθώς",
        "e": "as, even as",
        "required": true
      },
      {
        "g": "κακός, -ή, -όν",
        "e": "bad, evil",
        "required": true
      },
      {
        "g": "μου (ἐμοῦ)",
        "e": "my",
        "required": true
      },
      {
        "g": "νεκρός, -ά, -όν",
        "e": "(adj.) dead, (noun) dead body, corpse",
        "required": true
      },
      {
        "g": "πιστός, -ή, -όν",
        "e": "faithful, believing",
        "required": true
      },
      {
        "g": "πονηρός, -ά, -όν",
        "e": "evil, bad",
        "required": true
      },
      {
        "g": "πρῶτος, -η, -ον",
        "e": "first, earlier",
        "required": true
      },
      {
        "g": "τρίτος, -η, -ον",
        "e": "third",
        "required": true
      }
    ]
  },
  "10": {
    "label": "Chapter 10 — Third Declension",
    "type": "chapter",
    "cards": [
      {
        "g": "εἰ",
        "e": "if",
        "required": true
      },
      {
        "g": "εἰ μή",
        "e": "except, if not",
        "required": true
      },
      {
        "g": "εἷς, μία, ἕν",
        "e": "one",
        "required": true
      },
      {
        "g": "ἤδη",
        "e": "now, already",
        "required": true
      },
      {
        "g": "ὄνομα, ὀνόματος, τό",
        "e": "name, reputation",
        "required": true
      },
      {
        "g": "οὐδείς, οὐδεμία, οὐδέν",
        "e": "no one, none, nothing",
        "required": true
      },
      {
        "g": "πᾶς, πᾶσα, πᾶν",
        "e": "(sing.) each, every, (pl.) all",
        "required": true
      },
      {
        "g": "περί+gen.",
        "e": "concerning, about",
        "required": true
      },
      {
        "g": "περί+acc.",
        "e": "around",
        "required": true
      },
      {
        "g": "σάρξ, σαρκός, ἡ",
        "e": "flesh, body",
        "required": true
      },
      {
        "g": "σύν+dat.",
        "e": "with",
        "required": true
      },
      {
        "g": "σῶμα, -ματος, τό",
        "e": "body",
        "required": true
      },
      {
        "g": "τέκνον, -ου, τό",
        "e": "child, descendent",
        "required": true
      },
      {
        "g": "τίς, τί",
        "e": "who?, what?, which?, why?",
        "required": true
      },
      {
        "g": "τις, τι",
        "e": "someone/thing, certain one/thing, anyone/thing",
        "required": true
      }
    ]
  },
  "11": {
    "label": "Chapter 11 — First & Second Person Personal Pronouns",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀδελφός -οῦ, ὁ",
        "e": "brother",
        "required": true
      },
      {
        "g": "ἄν",
        "e": "(untranslatable, uninflected particle)",
        "required": true
      },
      {
        "g": "ἀνήρ, ἀνδρός, ὁ",
        "e": "man, male, husband",
        "required": true
      },
      {
        "g": "ἐκκλησία, -ας, ἡ",
        "e": "a church, (the) Church, assembly, congregation",
        "required": true
      },
      {
        "g": "ἐλπίς, -ίδος, ἡ",
        "e": "hope",
        "required": true
      },
      {
        "g": "ἔξω (adverb)",
        "e": "without",
        "required": true
      },
      {
        "g": "ἔξω+gen.",
        "e": "outside",
        "required": true
      },
      {
        "g": "ἐπί+gen.",
        "e": "on, over, when",
        "required": true
      },
      {
        "g": "ἐπί+dat.",
        "e": "on the basis of, at",
        "required": true
      },
      {
        "g": "ἐπί+acc.",
        "e": "on, to, against",
        "required": true
      },
      {
        "g": "ἡμεῖς",
        "e": "we",
        "required": true
      },
      {
        "g": "θέλημα, θελήματος, τό",
        "e": "will, desire",
        "required": true
      },
      {
        "g": "ἴδε",
        "e": "See!, Behold!",
        "required": true
      },
      {
        "g": "ἰδού",
        "e": "See!, Behold!",
        "required": true
      },
      {
        "g": "καλός, -ή, -όν",
        "e": "beautiful, good",
        "required": true
      },
      {
        "g": "μήτηρ, μητρός, ἡ",
        "e": "mother",
        "required": true
      },
      {
        "g": "οὐδέ",
        "e": "and not, not even, neither, nor",
        "required": true
      },
      {
        "g": "πατήρ, πατρός, ὁ",
        "e": "father",
        "required": true
      },
      {
        "g": "πίστις, πίστεως, ἡ",
        "e": "faith, belief",
        "required": true
      },
      {
        "g": "ὕδωρ, ὕδατος, τό",
        "e": "water",
        "required": true
      },
      {
        "g": "ὑμεῖς",
        "e": "you (plural)",
        "required": true
      },
      {
        "g": "φῶς, φωτός, τό",
        "e": "light",
        "required": true
      },
      {
        "g": "χάρις, χάριτος, ἡ",
        "e": "grace, favor, kindness",
        "required": true
      },
      {
        "g": "ὥδε",
        "e": "here",
        "required": true
      }
    ]
  },
  "12": {
    "label": "Chapter 12 — αὐτός",
    "type": "chapter",
    "cards": [
      {
        "g": "αἰών, -ῶνος, ὁ",
        "e": "age, eternity",
        "required": true
      },
      {
        "g": "διδάσκαλος, -ου, ὁ",
        "e": "teacher",
        "required": true
      },
      {
        "g": "εὐθύς",
        "e": "immediately",
        "required": true
      },
      {
        "g": "ἕως (conj.)",
        "e": "until",
        "required": true
      },
      {
        "g": "ἕως+gen.",
        "e": "as far as",
        "required": true
      },
      {
        "g": "μαθητής, -οῦ, ὁ",
        "e": "disciple",
        "required": true
      },
      {
        "g": "μέν",
        "e": "on the one hand, indeed",
        "required": true
      },
      {
        "g": "μηδείς, μηδεμία, μηδέν",
        "e": "no one/thing",
        "required": true
      },
      {
        "g": "μόνος, -η, -ον",
        "e": "alone, only",
        "required": true
      },
      {
        "g": "ὅπως",
        "e": "how, that, in order that",
        "required": true
      },
      {
        "g": "ὅσος, -η, -ον",
        "e": "as great as, as many as",
        "required": true
      },
      {
        "g": "οὖν",
        "e": "therefore, then, accordingly",
        "required": true
      },
      {
        "g": "ὀφθαλμός, -οῦ, ὁ",
        "e": "eye, sight",
        "required": true
      },
      {
        "g": "πάλιν",
        "e": "again",
        "required": true
      },
      {
        "g": "πούς, ποδός, ὁ",
        "e": "foot",
        "required": true
      },
      {
        "g": "ὑπέρ+gen.",
        "e": "in behalf of",
        "required": true
      },
      {
        "g": "ὑπέρ+acc.",
        "e": "above",
        "required": true
      }
    ]
  },
  "13": {
    "label": "Chapter 13 — Demonstrative Pronouns/Adjectives",
    "type": "chapter",
    "cards": [
      {
        "g": "γυνή, γυναικός, ἡ",
        "e": "woman, wife",
        "required": true
      },
      {
        "g": "δικαιοσύνη, -ης, ἡ",
        "e": "righteousness",
        "required": true
      },
      {
        "g": "δώδεκα",
        "e": "twelve",
        "required": true
      },
      {
        "g": "ἑαυτοῦ, -ῆς -οῦ",
        "e": "(sing.) himself/herself/itself; (pl.) themselves",
        "required": true
      },
      {
        "g": "ἐκεῖνος, -η, -ο",
        "e": "(sing.) that man/woman/thing; (pl.) those men, women, things",
        "required": true
      },
      {
        "g": "ἤ",
        "e": "or",
        "required": true
      },
      {
        "g": "κἀγώ",
        "e": "and I, but I",
        "required": true
      },
      {
        "g": "μακάριος, -α, -ον",
        "e": "blessed, happy",
        "required": true
      },
      {
        "g": "μέγας, μεγάλη, μέγα",
        "e": "large, great",
        "required": true
      },
      {
        "g": "πόλις, -εως, ἡ",
        "e": "city",
        "required": true
      },
      {
        "g": "πολύς, πολλή, πολύ",
        "e": "(sing.) much; (pl.) many; (adv.) often",
        "required": true
      },
      {
        "g": "πῶς",
        "e": "how?",
        "required": true
      },
      {
        "g": "σημεῖον, -ου, τό",
        "e": "sign, miracle",
        "required": true
      }
    ]
  },
  "14": {
    "label": "Chapter 14 — Relative Pronoun",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀλήθεια, -ας, ἡ",
        "e": "truth",
        "required": true
      },
      {
        "g": "εἰρήνη, -ης, ἡ",
        "e": "peace",
        "required": true
      },
      {
        "g": "ἐνώπιον+gen.",
        "e": "before",
        "required": true
      },
      {
        "g": "ἑπτά",
        "e": "seven",
        "required": true
      },
      {
        "g": "θρόνος, -ου, ὁ",
        "e": "throne",
        "required": true
      },
      {
        "g": "Ἰερουσαλήμ, ἡ",
        "e": "Jerusalem",
        "required": true
      },
      {
        "g": "κατά (κατ', καθ)+gen.",
        "e": "down from, against",
        "required": true
      },
      {
        "g": "κατά (κατ', καθ)+acc.",
        "e": "according to, throughout, during",
        "required": true
      },
      {
        "g": "κεφαλή, -ῆς, ἡ",
        "e": "head",
        "required": true
      },
      {
        "g": "ὁδός, -οῦ, ἡ",
        "e": "way, road, journey, conduct",
        "required": true
      },
      {
        "g": "ὅς, ἥ, ὅ",
        "e": "who (whom), which",
        "required": true
      },
      {
        "g": "ὅτε",
        "e": "when",
        "required": true
      },
      {
        "g": "οὕτως",
        "e": "thus, so, in this manner",
        "required": true
      },
      {
        "g": "πλοῖον, -ου, τό",
        "e": "boat",
        "required": true
      },
      {
        "g": "ῥῆμα, -ματος, τό",
        "e": "word, saying",
        "required": true
      },
      {
        "g": "τε",
        "e": "and (so), so",
        "required": true
      },
      {
        "g": "χείρ, χειρός, ἡ",
        "e": "hand, arm, finger",
        "required": true
      },
      {
        "g": "ψυχή, -ῆς, ἡ",
        "e": "soul, life, self",
        "required": true
      }
    ]
  },
  "15": {
    "label": "Chapter 15 — Introduction to Verbs",
    "type": "chapter",
    "cards": []
  },
  "16": {
    "label": "Chapter 16 — Present Active Indicative",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀκούω",
        "e": "I hear, learn, obey, understand",
        "required": true
      },
      {
        "g": "βλέπω",
        "e": "I see, look at",
        "required": true
      },
      {
        "g": "ἔχω",
        "e": "I have, hold",
        "required": true
      },
      {
        "g": "λέγω",
        "e": "I say, speak",
        "required": true
      },
      {
        "g": "λύω",
        "e": "I loose, untie, destroy",
        "required": true
      },
      {
        "g": "νόμος, -ου, ὁ",
        "e": "law, principle",
        "required": true
      },
      {
        "g": "ὅπου",
        "e": "where",
        "required": true
      },
      {
        "g": "πιστεύω",
        "e": "I believe, have faith (in), trust",
        "required": true
      },
      {
        "g": "πρόσωπον, -ου, τό",
        "e": "face, appearance",
        "required": true
      },
      {
        "g": "τότε",
        "e": "then, thereafter",
        "required": true
      },
      {
        "g": "τυφλός, -ή, -όν",
        "e": "blind",
        "required": true
      },
      {
        "g": "χαρά, -ᾶς, ἡ",
        "e": "joy, delight",
        "required": true
      }
    ]
  },
  "17": {
    "label": "Chapter 17 — Contract Verbs",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀγαπάω",
        "e": "I love, cherish",
        "required": true
      },
      {
        "g": "δαιμόνιον, -ου, τό",
        "e": "demon",
        "required": true
      },
      {
        "g": "ζητέω",
        "e": "I seek, desire, try to obtain",
        "required": true
      },
      {
        "g": "καλέω",
        "e": "I call, name, invite",
        "required": true
      },
      {
        "g": "λαλέω",
        "e": "I speak, say",
        "required": true
      },
      {
        "g": "οἶδα",
        "e": "I know, understand",
        "required": true
      },
      {
        "g": "ὅταν",
        "e": "whenever",
        "required": true
      },
      {
        "g": "πλείων, πλεῖον",
        "e": "larger, more",
        "required": true
      },
      {
        "g": "πληρόω",
        "e": "I fill, complete, fulfill",
        "required": true
      },
      {
        "g": "ποιέω",
        "e": "I do, make",
        "required": true
      },
      {
        "g": "τηρέω",
        "e": "I keep, guard, observe",
        "required": true
      }
    ]
  },
  "18": {
    "label": "Chapter 18 — Present Middle/Passive Indicative",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀποκρίνομαι",
        "e": "I answer",
        "required": true
      },
      {
        "g": "δεῖ",
        "e": "it is necessary",
        "required": true
      },
      {
        "g": "δύναμαι",
        "e": "I am able, am powerful",
        "required": true
      },
      {
        "g": "ἔρχομαι",
        "e": "I come, go",
        "required": true
      },
      {
        "g": "νύξ, -νυκτός, ἡ",
        "e": "night",
        "required": true
      },
      {
        "g": "ὅστις, ἥτις, ὅτι",
        "e": "whoever, whichever, whatever",
        "required": true
      },
      {
        "g": "πορεύομαι",
        "e": "I go, proceed, live",
        "required": true
      },
      {
        "g": "συνάγω",
        "e": "I gather together, invite",
        "required": true
      },
      {
        "g": "τόπος, -ου, ὁ",
        "e": "place, location",
        "required": true
      },
      {
        "g": "ὡς",
        "e": "as, like, when, that, how, about",
        "required": true
      }
    ]
  },
  "19": {
    "label": "Chapter 19 — Future Active/Middle Indicative",
    "type": "chapter",
    "cards": [
      {
        "g": "βασιλεύς, -έως, ὁ",
        "e": "king",
        "required": true
      },
      {
        "g": "γεννάω",
        "e": "I beget, give birth to, produce",
        "required": true
      },
      {
        "g": "ζάω",
        "e": "I live",
        "required": true
      },
      {
        "g": "Ἰουδαία, -ας, ἡ",
        "e": "Judea",
        "required": true
      },
      {
        "g": "Ἰουδαῖος, -αία, -αῖον",
        "e": "(adj.) Jewish; (noun) Jew",
        "required": true
      },
      {
        "g": "Ἰσραήλ, ὁ",
        "e": "Israel",
        "required": true
      },
      {
        "g": "καρπός, -οῦ, ὁ",
        "e": "fruit, crop, result",
        "required": true
      },
      {
        "g": "μείζων, -ον",
        "e": "greater",
        "required": true
      },
      {
        "g": "ὅλος, -η, -ον",
        "e": "(adj.) whole, complete; (adv.) entirely",
        "required": true
      },
      {
        "g": "προσκυνέω",
        "e": "I worship",
        "required": true
      }
    ]
  },
  "20": {
    "label": "Chapter 20 — Verbal Roots & Other Forms of the Future",
    "type": "chapter",
    "cards": [
      {
        "g": "αἴρω",
        "e": "I raise, take up, take away",
        "required": true
      },
      {
        "g": "ἀποκτείνω",
        "e": "I kill",
        "required": true
      },
      {
        "g": "ἀποστέλλω",
        "e": "I send (away)",
        "required": true
      },
      {
        "g": "βαπτίζω",
        "e": "I baptize, dip, immerse",
        "required": true
      },
      {
        "g": "γινώσκω",
        "e": "I know, come to know, realize, learn",
        "required": true
      },
      {
        "g": "γλῶσσα, -ης, ἡ",
        "e": "tongue, language",
        "required": true
      },
      {
        "g": "ἐγείρω",
        "e": "I raise up, wake",
        "required": true
      },
      {
        "g": "ἐκβάλλω",
        "e": "I cast out, send out",
        "required": true
      },
      {
        "g": "ἐκεῖ",
        "e": "there, in that place",
        "required": true
      },
      {
        "g": "κρίνω",
        "e": "I judge, decide, prefer",
        "required": true
      },
      {
        "g": "λαός, -οῦ, ὁ",
        "e": "people, crowd",
        "required": true
      },
      {
        "g": "μένω",
        "e": "I remain, live",
        "required": true
      },
      {
        "g": "ὁράω",
        "e": "I see, notice",
        "required": true
      },
      {
        "g": "σοφία, -ας, ἡ",
        "e": "wisdom",
        "required": true
      },
      {
        "g": "στόμα, -ατος, τό",
        "e": "mouth",
        "required": true
      },
      {
        "g": "σώζω",
        "e": "I save, deliver, rescue",
        "required": true
      }
    ]
  },
  "21": {
    "label": "Chapter 21 — Imperfect Indicative",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀκολουθέω",
        "e": "I follow, accompany",
        "required": true
      },
      {
        "g": "διδάσκω",
        "e": "I teach",
        "required": true
      },
      {
        "g": "ἐπερωτάω",
        "e": "I ask (for), question, demand (of)",
        "required": true
      },
      {
        "g": "ἐρωτάω",
        "e": "I ask, request, entreat",
        "required": true
      },
      {
        "g": "θέλω",
        "e": "I will, wish, desire, enjoy",
        "required": true
      },
      {
        "g": "περιπατέω",
        "e": "I walk (around), live",
        "required": true
      },
      {
        "g": "συναγωγή, -ῆς, ἡ",
        "e": "synagogue, meeting",
        "required": true
      },
      {
        "g": "Φαρισαῖος, -ου, ὁ",
        "e": "Pharisee",
        "required": true
      },
      {
        "g": "χρόνος, -ου, ὁ",
        "e": "time",
        "required": true
      }
    ]
  },
  "22": {
    "label": "Chapter 22 — Second Aorist Active/Middle Indicative",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀποθνήσκω",
        "e": "I die, am about to die, am freed from",
        "required": true
      },
      {
        "g": "ἄρτος, -ου, ὁ",
        "e": "bread, loaf, food",
        "required": true
      },
      {
        "g": "βάλλω",
        "e": "I throw",
        "required": true
      },
      {
        "g": "γῆ, γῆς, ἡ",
        "e": "earth, land, region, humanity",
        "required": true
      },
      {
        "g": "γίνομαι",
        "e": "I become, am, exist, am born, am created",
        "required": true
      },
      {
        "g": "εἰσέρχομαι",
        "e": "I come in(to), go in(to), enter",
        "required": true
      },
      {
        "g": "ἐξέρχομαι",
        "e": "I go out",
        "required": true
      },
      {
        "g": "ἔτι",
        "e": "still, yet, even",
        "required": true
      },
      {
        "g": "εὑρίσκω",
        "e": "I find",
        "required": true
      },
      {
        "g": "λαμβάνω",
        "e": "I take, receive",
        "required": true
      },
      {
        "g": "οὔτε",
        "e": "and not, neither, nor",
        "required": true
      },
      {
        "g": "προσέρχομαι",
        "e": "I come/go to",
        "required": true
      },
      {
        "g": "προσεύχομαι",
        "e": "I pray",
        "required": true
      },
      {
        "g": "πῦρ, -ός, τό",
        "e": "fire",
        "required": true
      }
    ]
  },
  "23": {
    "label": "Chapter 23 — First Aorist Active/Middle Indicative",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀπέρχομαι",
        "e": "I depart",
        "required": true
      },
      {
        "g": "ἄρχωμαι",
        "e": "I begin",
        "required": true
      },
      {
        "g": "γράφω",
        "e": "I write",
        "required": true
      },
      {
        "g": "διό",
        "e": "therefore, for this reason",
        "required": true
      },
      {
        "g": "δοξάζω",
        "e": "I praise, honor, glorify",
        "required": true
      },
      {
        "g": "δύναμις, -εως, ἡ",
        "e": "power, miracle",
        "required": true
      },
      {
        "g": "κηρύσσω",
        "e": "I proclaim, preach",
        "required": true
      },
      {
        "g": "πίνω",
        "e": "I drink",
        "required": true
      }
    ]
  },
  "24": {
    "label": "Chapter 24 — Aorist & Future Passive Indicative",
    "type": "chapter",
    "cards": [
      {
        "g": "ἄγω",
        "e": "I lead, bring, arrest",
        "required": true
      },
      {
        "g": "αἷμα, -ατος, τό",
        "e": "blood",
        "required": true
      },
      {
        "g": "ἕκαστος, -η, -ον",
        "e": "each, every",
        "required": true
      },
      {
        "g": "ἱμάτιον, -ου, τό",
        "e": "garment, cloak",
        "required": true
      },
      {
        "g": "ὄρος, ὄρους, τό",
        "e": "mountain, hill",
        "required": true
      },
      {
        "g": "ὑπάγω",
        "e": "I depart",
        "required": true
      },
      {
        "g": "φοβέομαι",
        "e": "I fear",
        "required": true
      },
      {
        "g": "χαίρω",
        "e": "I rejoice",
        "required": true
      }
    ]
  },
  "25": {
    "label": "Chapter 25 — Perfect Indicative",
    "type": "chapter",
    "cards": [
      {
        "g": "αἰτέω",
        "e": "I ask, demand",
        "required": true
      },
      {
        "g": "μᾶλλον",
        "e": "more, rather",
        "required": true
      },
      {
        "g": "μαρτυρέω",
        "e": "I bear witness, testify",
        "required": true
      }
    ]
  },
  "26": {
    "label": "Chapter 26 — Introduction to Participles",
    "type": "chapter",
    "cards": []
  },
  "27": {
    "label": "Chapter 27 — Present (Continuous) Adverbial Participles",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀναβαίνω",
        "e": "I go up, come up",
        "required": true
      },
      {
        "g": "ἀρχιερεύς, -έως, ὁ",
        "e": "chief priest, high priest",
        "required": true
      },
      {
        "g": "δεξιός, -ιά, -ιόν",
        "e": "right",
        "required": true
      },
      {
        "g": "δύο",
        "e": "two",
        "required": true
      },
      {
        "g": "ἕτερος, -α, -ον",
        "e": "other, another, different",
        "required": true
      },
      {
        "g": "εὐαγγελίζω",
        "e": "I bring good news, preach",
        "required": true
      },
      {
        "g": "θεωρέω",
        "e": "I look at, behold",
        "required": true
      },
      {
        "g": "Ἰεροσόλυμα, τά, ἡ",
        "e": "Jerusalem",
        "required": true
      },
      {
        "g": "κάθημαι",
        "e": "I sit (down), live",
        "required": true
      },
      {
        "g": "καταβαίνω",
        "e": "I go down, come down",
        "required": true
      },
      {
        "g": "οὗ",
        "e": "where",
        "required": true
      },
      {
        "g": "παρακαλέω",
        "e": "I call, urge, exhort, comfort",
        "required": true
      },
      {
        "g": "πείθω",
        "e": "I persuade",
        "required": true
      },
      {
        "g": "τρεῖς, τρία",
        "e": "three",
        "required": true
      }
    ]
  },
  "28": {
    "label": "Chapter 28 — Aorist (Undefined) Adverbial Participles",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀσπάζομαι",
        "e": "I greet, salute",
        "required": true
      },
      {
        "g": "γραμματεύς, -έως, ὁ",
        "e": "scribe",
        "required": true
      },
      {
        "g": "ἔφη",
        "e": "he/she/it was saying; he/she/it said",
        "required": true
      },
      {
        "g": "ἱερόν, -οῦ, τό",
        "e": "temple",
        "required": true
      },
      {
        "g": "κράζω",
        "e": "I cry out, call out",
        "required": true
      },
      {
        "g": "οὐχί",
        "e": "not",
        "required": true
      },
      {
        "g": "παιδίον, -ου, τό",
        "e": "child, infant",
        "required": true
      },
      {
        "g": "σπείρω",
        "e": "I sow",
        "required": true
      }
    ]
  },
  "29": {
    "label": "Chapter 29 — Adjectival Participles",
    "type": "chapter",
    "cards": [
      {
        "g": "δέχομαι",
        "e": "I take, receive",
        "required": true
      },
      {
        "g": "δοκέω",
        "e": "I think, seem",
        "required": true
      },
      {
        "g": "ἐσθίω",
        "e": "I eat",
        "required": true
      },
      {
        "g": "πέμπω",
        "e": "I send",
        "required": true
      },
      {
        "g": "φέρω",
        "e": "I carry, bear, produce",
        "required": true
      }
    ]
  },
  "30": {
    "label": "Chapter 30 — Perfect Participles & Genitive Absolutes",
    "type": "chapter",
    "cards": [
      {
        "g": "μηδέ",
        "e": "but not, nor, not even",
        "required": true
      },
      {
        "g": "πρεσβύτερος, -α, -ον",
        "e": "elder",
        "required": true
      }
    ]
  },
  "31": {
    "label": "Chapter 31 — Subjunctive",
    "type": "chapter",
    "cards": [
      {
        "g": "λίθος, -ου, ὁ",
        "e": "stone",
        "required": true
      },
      {
        "g": "τοιοῦτος, -αύτη, -οῦτον",
        "e": "such, of such a kind",
        "required": true
      }
    ]
  },
  "32": {
    "label": "Chapter 32 — Infinitive",
    "type": "chapter",
    "cards": [
      {
        "g": "δίκαιος, -αία, -αιον",
        "e": "right, just, righteous",
        "required": true
      },
      {
        "g": "μέλλω",
        "e": "I am about to",
        "required": true
      }
    ]
  },
  "33": {
    "label": "Chapter 33 — Imperative",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀπόλλυμι",
        "e": "(active) I destroy, kill; (middle) I perish, die",
        "required": true
      },
      {
        "g": "ἀπολύω",
        "e": "I release",
        "required": true
      },
      {
        "g": "εἴτε",
        "e": "if, whether",
        "required": true
      }
    ]
  },
  "34": {
    "label": "Chapter 34 — Indicative of δίδωμι",
    "type": "chapter",
    "cards": [
      {
        "g": "δίδωμι",
        "e": "I give (out), entrust, give back, put",
        "required": true
      },
      {
        "g": "ἔθνος, -ους, τό",
        "e": "nation; (plural) the Gentiles",
        "required": true
      },
      {
        "g": "λοιπός, -ή, -όν",
        "e": "(adj.) remaining; (noun) the rest; (adv.) for the rest, henceforth",
        "required": true
      },
      {
        "g": "Μωϋσῆς, -έως, ὁ",
        "e": "Moses",
        "required": true
      },
      {
        "g": "παραδίδωμι",
        "e": "I entrust, hand over, betray",
        "required": true
      },
      {
        "g": "πίπτω",
        "e": "I fall",
        "required": true
      },
      {
        "g": "ὑπάρχω",
        "e": "I am, exist",
        "required": true
      }
    ]
  },
  "35": {
    "label": "Chapter 35 — Nonindicative δίδωμι; Conditional Sentences",
    "type": "chapter",
    "cards": [
      {
        "g": "ἁγιάζω",
        "e": "I consecrate, sanctify",
        "required": true
      },
      {
        "g": "ἁμαρτάνω",
        "e": "I sin",
        "required": true
      },
      {
        "g": "ἁμαρτωλός, -όν",
        "e": "sinful; sinner",
        "required": true
      },
      {
        "g": "ἀνάστασις, -εως, ἡ",
        "e": "resurrection",
        "required": true
      },
      {
        "g": "ἀπαγγέλλω",
        "e": "I report, tell",
        "required": true
      },
      {
        "g": "διακονέω",
        "e": "I serve",
        "required": true
      },
      {
        "g": "διακονία, -ας, ἡ",
        "e": "service",
        "required": true
      },
      {
        "g": "δικαιόω",
        "e": "I justify, vindicate",
        "required": true
      },
      {
        "g": "θλῖψις, -εως, ἡ",
        "e": "affliction, tribulation",
        "required": true
      },
      {
        "g": "ἱλαστήριον, -ου, τό",
        "e": "propitation, expiation, place of propitation",
        "required": true
      },
      {
        "g": "σταυρόω",
        "e": "I crucify",
        "required": true
      },
      {
        "g": "σωτήρ, -ῆρος, ὁ",
        "e": "savior, deliverer",
        "required": true
      },
      {
        "g": "σωτηρία, -ας, ἡ",
        "e": "salvation, deliverance",
        "required": true
      },
      {
        "g": "φανερόω",
        "e": "I reveal, make known",
        "required": true
      },
      {
        "g": "φόβος, -ου, ὁ",
        "e": "fear, reverance",
        "required": true
      }
    ]
  },
  "36": {
    "label": "Chapter 36 — ἵστημι, τίθημι, δείκνυμι & Other -μι Verbs",
    "type": "chapter",
    "cards": [
      {
        "g": "ἀνίστημι",
        "e": "(intr.) I rise, get up; (tr.) I raise",
        "required": true
      },
      {
        "g": "ἀνοίγω",
        "e": "I open",
        "required": true
      },
      {
        "g": "ἀφίημι",
        "e": "I let go, leave, permit",
        "required": true
      },
      {
        "g": "δείκνυμι",
        "e": "I show, explain",
        "required": true
      },
      {
        "g": "ἴδιος, -α, -ον",
        "e": "one's own",
        "required": true
      },
      {
        "g": "ἵστημι",
        "e": "(intr.) I stand; (tr.) I cause to stand",
        "required": true
      },
      {
        "g": "μέσος, -η, -ον",
        "e": "middle, in the midst",
        "required": true
      },
      {
        "g": "τίθημι",
        "e": "I put, place",
        "required": true
      },
      {
        "g": "φημί",
        "e": "I say, affirm",
        "required": true
      }
    ]
  }
};

const SESSIONS = [
  {
    "id": "letters",
    "tag": "Letters",
    "label": "Alphabet (Ch 0)",
    "sets": [
      "0"
    ],
    "special": false,
    "summary": "Greek letters — names, forms & sounds (its own deck; not in the cumulative)"
  },
  {
    "id": "part1",
    "tag": "Part I",
    "label": "Introduction (Ch 1–4)",
    "sets": [
      "1",
      "2",
      "3",
      "4"
    ],
    "special": false,
    "summary": "Greek language · alphabet · accents · early vocab"
  },
  {
    "id": "part2",
    "tag": "Part II",
    "label": "Noun System (Ch 5–14)",
    "sets": [
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14"
    ],
    "special": false,
    "summary": "Cases · prepositions · adjectives · pronouns · 3rd decl"
  },
  {
    "id": "part3",
    "tag": "Part III",
    "label": "Indicative Verb (Ch 15–25)",
    "sets": [
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25"
    ],
    "special": false,
    "summary": "Present · contracts · imperfect · aorist · perfect"
  },
  {
    "id": "part4",
    "tag": "Part IV",
    "label": "Nonindicative & μι (Ch 26–36)",
    "sets": [
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
      "32",
      "33",
      "34",
      "35",
      "36"
    ],
    "special": false,
    "summary": "Participles · subjunctive · infinitive · imperative · μι verbs"
  },
  {
    "id": "thru14",
    "tag": "Cumulative",
    "label": "Through Ch 14",
    "sets": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14"
    ],
    "special": true,
    "summary": "All vocab through the noun system"
  },
  {
    "id": "thru25",
    "tag": "Cumulative",
    "label": "Through Ch 25",
    "sets": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25"
    ],
    "special": true,
    "summary": "All vocab through the indicative verb system"
  },
  {
    "id": "all",
    "tag": "Cumulative",
    "label": "All Chapters (1–36)",
    "sets": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
      "32",
      "33",
      "34",
      "35",
      "36"
    ],
    "special": true,
    "summary": "Full Mounce BBG3 vocabulary corpus"
  }
];


if (!SETS.EXTRA) {
  SETS.EXTRA = {
    label: 'Extra Review',
    type: 'other',
    week: null,
    cards: []
  };
}

window.SETS = SETS;
window.SESSIONS = SESSIONS;
