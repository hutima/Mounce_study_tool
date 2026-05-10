// ═══════════════════════════════════════════════════════════════════════
//  MOUNCE GRAMMAR DATA — Basics of Biblical Greek (BBG3, William D. Mounce)
// ═══════════════════════════════════════════════════════════════════════
//  Per-chapter multiple-choice drills for the 36-chapter Mounce sequence.
//  Concept and terminology choices follow Mounce's published overheads
//  (see mounce_overheads.pdf in this repo): Noun Rules 1–8, Five Rules
//  of Contraction, Three Uses of αὐτός, Master Case Ending Chart,
//  Master Verb Chart, Five Rules of μι Verbs, Case → Function → Meaning,
//  participle morphemes (ντ active, μενο/η mid/pas, οτ perfect active),
//  and the four classes of conditional sentences.
//
//  ⚠ AI-DRAFTED — verify against the current edition of the textbook.
//  Treat unfamiliar wording as "to be checked", not authoritative.
//
//  Card-shape contract (consumed by main.js / pos_logic.js):
//    {
//      id:        string   (regenerated each session)
//      kind:      'morph'  (multiple-choice prompt)
//      required:  true
//      sourceKey: string   ("1"–"36" or any registered supplemental key)
//      sourceLabel, chapter, family, lemma, gloss,
//      form, prompt, context, note, answer, choices[]
//    }
// ═══════════════════════════════════════════════════════════════════════

(function () {

  // ───────────────────────────────────────────────────────────────────
  //  CHAPTER GRAMMAR — Mounce chapters 1 through 36
  // ───────────────────────────────────────────────────────────────────
  const CHAPTER_GRAMMAR = {

    "1": {
      label: "Chapter 1 — The Greek Language",
      notes: "Why study NT Greek; English-from-Greek perspective",
      items: [
        {
          family: "Greek language facts",
          lemma: "Koine Greek",
          gloss: "background context",
          questions: [
            { form: "Koine Greek", prompt: "What does \"Koine\" (κοινή) mean?",
              answer: "common (everyday)",
              choices: ["common (everyday)", "classical / literary", "old / archaic", "sacred / liturgical"],
              note: "Mounce: Koine = the common Greek of the Hellenistic world, the language of the New Testament." },
            { form: "NT Greek dialect",
              prompt: "Which broad period of Greek does the NT use?",
              answer: "Koine (Hellenistic) Greek",
              choices: ["Koine (Hellenistic) Greek", "Classical Attic", "Mycenaean", "Modern Demotic"] },
            { form: "Why study Greek?",
              prompt: "Mounce's main rationale for learning NT Greek?",
              answer: "to read the NT in its original language and ground translation/exegesis",
              choices: [
                "to read the NT in its original language and ground translation/exegesis",
                "to write modern Greek emails",
                "to read the Septuagint only",
                "to recite liturgy aloud"
              ] }
          ]
        }
      ]
    },

    "2": {
      label: "Chapter 2 — Learning Greek",
      notes: "Strategy: aspect of memorization, regular review, paradigms",
      items: [
        {
          family: "Study strategy",
          lemma: "Mounce's approach",
          gloss: "method",
          questions: [
            { form: "Memorize what?",
              prompt: "What two categories does Mounce ask you to memorize most rigorously?",
              answer: "vocabulary and paradigms",
              choices: [
                "vocabulary and paradigms",
                "verses and footnotes",
                "alphabet and dates",
                "vocabulary alone"
              ] },
            { form: "Daily review",
              prompt: "Mounce's recommended review frequency for vocabulary?",
              answer: "daily, in small doses",
              choices: ["daily, in small doses", "weekly, in long sessions", "only before quizzes", "only on review days"] },
            { form: "Vocabulary scope",
              prompt: "Mounce's vocabulary corpus is built around words that occur how often in the NT?",
              answer: "50 times or more",
              choices: ["50 times or more", "10 times or more", "100 times or more", "every NT word"],
              note: "Words that occur 50+ times account for ~80% of total NT word occurrences." }
          ]
        }
      ]
    },

    "3": {
      label: "Chapter 3 — Alphabet & Pronunciation",
      notes: "24 letters, vowel pyramid, breathings, diphthongs",
      items: [
        {
          family: "Alphabet recognition",
          lemma: "Greek alphabet",
          gloss: "letter names",
          questions: [
            { form: "α", prompt: "Which letter is this?", answer: "alpha",
              choices: ["alpha", "lambda", "delta", "eta"] },
            { form: "β", prompt: "Which letter is this?", answer: "beta",
              choices: ["beta", "theta", "delta", "rho"] },
            { form: "γ", prompt: "Which letter is this?", answer: "gamma",
              choices: ["gamma", "tau", "rho", "upsilon"] },
            { form: "δ", prompt: "Which letter is this?", answer: "delta",
              choices: ["delta", "alpha", "lambda", "omega"] },
            { form: "ε", prompt: "Which letter is this?", answer: "epsilon",
              choices: ["epsilon", "eta", "iota", "omicron"] },
            { form: "η", prompt: "Which letter is this?", answer: "eta",
              choices: ["eta", "epsilon", "nu", "iota"] },
            { form: "θ", prompt: "Which letter is this?", answer: "theta",
              choices: ["theta", "omicron", "phi", "beta"] },
            { form: "ξ", prompt: "Which letter is this?", answer: "xi",
              choices: ["xi", "zeta", "psi", "chi"] },
            { form: "ω", prompt: "Which letter is this?", answer: "omega",
              choices: ["omega", "omicron", "upsilon", "eta"] },
            { form: "ς", prompt: "Which letter-form is this?", answer: "final sigma",
              choices: ["final sigma", "sigma", "xi", "psi"],
              note: "Mounce: σ in the middle of a word, ς at the end." }
          ]
        },
        {
          family: "Vowels",
          lemma: "seven Greek vowels",
          gloss: "vowel pyramid",
          questions: [
            { form: "Greek vowels",
              prompt: "How many vowel letters does Greek have?",
              answer: "seven (α ε η ι ο υ ω)",
              choices: ["seven (α ε η ι ο υ ω)", "five (α ε ι ο υ)", "six (α ε η ι ο υ)", "eight"] },
            { form: "ε vs η",
              prompt: "Compared to ε, the vowel η is …",
              answer: "the long counterpart of ε",
              choices: ["the long counterpart of ε", "a separate consonant sound", "always followed by ι", "the same length as ε"] },
            { form: "ο vs ω",
              prompt: "Compared to ο, the vowel ω is …",
              answer: "the long counterpart of ο",
              choices: ["the long counterpart of ο", "a diphthong", "always silent", "the same length as ο"] }
          ]
        },
        {
          family: "Breathings",
          lemma: "rough vs smooth",
          gloss: "every vowel-initial word takes one",
          questions: [
            { form: "ὁ", prompt: "What does the rough breathing over a vowel indicate?",
              answer: "an initial 'h' sound",
              choices: ["an initial 'h' sound", "no extra sound", "a long vowel", "an accent"],
              note: "Every word starting with a vowel takes either a rough breathing (with an 'h' sound, as in ὁ) or a smooth breathing (no 'h', as in ἀ)." },
            { form: "ἀ", prompt: "What does the smooth breathing over a vowel indicate?",
              answer: "no additional sound",
              choices: ["no additional sound", "an 'h' sound", "an accent", "a long vowel"] },
            { form: "ῥ", prompt: "Which breathing does an initial rho always take?",
              answer: "rough",
              choices: ["rough", "smooth", "either", "neither — rho is a consonant"],
              note: "An initial ρ in Greek always takes the rough breathing." }
          ]
        },
        {
          family: "Diphthongs",
          lemma: "diphthongs",
          gloss: "two vowels in one syllable",
          questions: [
            { form: "αι", prompt: "How is the diphthong αι usually pronounced (academic)?",
              answer: "approximately like 'ai' in 'aisle'",
              choices: ["approximately like 'ai' in 'aisle'", "like 'ay' in 'day'", "like 'ee' in 'see'", "like 'oy' in 'boy'"] },
            { form: "ει", prompt: "How is the diphthong ει usually pronounced (academic)?",
              answer: "approximately like 'ei' in 'eight'",
              choices: ["approximately like 'ei' in 'eight'", "approximately like 'ai' in 'aisle'", "like 'oy' in 'boy'", "like 'oo' in 'food'"] },
            { form: "ου", prompt: "How is the diphthong ου pronounced (academic)?",
              answer: "like 'oo' in 'food'",
              choices: ["like 'oo' in 'food'", "like 'ow' in 'cow'", "like 'oy' in 'boy'", "like 'ee' in 'see'"] },
            { form: "ᾳ ῃ ῳ", prompt: "What is the small ι written under these vowels called?",
              answer: "iota subscript",
              choices: ["iota subscript", "iota adscript", "smooth breathing", "circumflex"],
              note: "Silent in pronunciation; flags dative singular of long-vowel stems (Noun Rule 4)." }
          ]
        }
      ]
    },

    "4": {
      label: "Chapter 4 — Punctuation, Syllabification, Accents",
      notes: "Accents acute/grave/circumflex; Greek punctuation; vocabulary intro",
      items: [
        {
          family: "Accents",
          lemma: "three Greek accents",
          gloss: "accent recognition",
          questions: [
            { form: "ὑπέρ", prompt: "Which accent appears on the ε?", answer: "acute",
              choices: ["acute", "grave", "circumflex", "no accent"],
              note: "Acute (´) is the most common Greek accent." },
            { form: "ὑπὲρ", prompt: "Which accent appears on the ε?", answer: "grave",
              choices: ["grave", "acute", "circumflex", "rough breathing"],
              note: "An acute on the last syllable usually becomes a grave when another accented word follows." },
            { form: "πνεῦμα", prompt: "Which accent appears on the diphthong ευ?", answer: "circumflex",
              choices: ["circumflex", "acute", "grave", "iota subscript"] },
            { form: "Accent rules",
              prompt: "For exegesis at this stage, accents in Greek primarily mark …",
              answer: "syllable stress (and a few homograph distinctions)",
              choices: [
                "syllable stress (and a few homograph distinctions)",
                "vowel length",
                "always the verb root",
                "tone like in modern Mandarin"
              ] }
          ]
        },
        {
          family: "Punctuation",
          lemma: "Greek punctuation",
          gloss: "punctuation marks",
          questions: [
            { form: "·", prompt: "This raised dot in Greek corresponds to what English mark?",
              answer: "semicolon or colon",
              choices: ["semicolon or colon", "period", "question mark", "comma"] },
            { form: ";", prompt: "In Greek, this character functions as …",
              answer: "the question mark",
              choices: ["the question mark", "a semicolon (English sense)", "a period", "a comma"],
              note: "Trap for English readers — the Greek '?' looks like an English ';'." }
          ]
        },
        {
          family: "Vocabulary scope",
          lemma: "BBG vocabulary",
          gloss: "high-frequency NT vocabulary",
          questions: [
            { form: "5,437 vs 138,162",
              prompt: "Mounce reports 5,437 different NT words and 138,162 total occurrences. Words occurring 50+ times account for what share of total occurrences?",
              answer: "about 80%",
              choices: ["about 80%", "about 25%", "about 50%", "about 99%"],
              note: "From overhead Ch.4: 110,425 of 138,162 occurrences ≈ 79.92%." }
          ]
        }
      ]
    },

    "5": {
      label: "Chapter 5 — Introduction to English Nouns",
      notes: "Case, number, gender — terminology before Greek paradigms",
      items: [
        {
          family: "Case terminology",
          lemma: "noun cases",
          gloss: "case = function flag",
          questions: [
            { form: "nominative",
              prompt: "Primary function of the nominative case?",
              answer: "subject of the sentence",
              choices: ["subject of the sentence", "direct object", "indirect object", "possession"] },
            { form: "accusative",
              prompt: "Primary function of the accusative case?",
              answer: "direct object",
              choices: ["direct object", "subject", "indirect object", "possession"] },
            { form: "genitive",
              prompt: "Primary function of the genitive case (English-style)?",
              answer: "possession / 'of'",
              choices: ["possession / 'of'", "direct object", "subject", "predicate adjective"] },
            { form: "dative",
              prompt: "Primary function of the dative case (English-style)?",
              answer: "indirect object / 'to' or 'for'",
              choices: ["indirect object / 'to' or 'for'", "subject", "direct object", "possession"] }
          ]
        },
        {
          family: "Number & gender",
          lemma: "noun morphology",
          gloss: "agreement features",
          questions: [
            { form: "number",
              prompt: "Greek nouns have how many numbers?",
              answer: "two — singular and plural",
              choices: ["two — singular and plural", "three — sg/dual/pl", "one (no number)", "four"],
              note: "The dual existed in Classical Greek but is essentially gone in NT Koine." },
            { form: "gender",
              prompt: "Greek has which set of grammatical genders?",
              answer: "masculine, feminine, neuter",
              choices: ["masculine, feminine, neuter", "masculine and feminine only", "common and neuter", "male, female, animate, inanimate"] }
          ]
        }
      ]
    },

    "6": {
      label: "Chapter 6 — Nominative & Accusative; Article",
      notes: "Case→Function→Meaning; Parsing Made Simple; Noun Rules 1–3",
      items: [
        {
          family: "Case → Function → Meaning",
          lemma: "Mounce's parsing approach",
          gloss: "method (§6.5)",
          questions: [
            { form: "Where to start?",
              prompt: "When parsing a Greek noun, what should you check first?",
              answer: "the case ending",
              choices: ["the case ending", "word order in the sentence", "the gloss in the lexicon", "the verse number"],
              note: "Mounce: case → function → meaning. Do NOT determine function from word order." },
            { form: "ὁ ἀπόστολος πέμπει τὸν ἀπόστολον.",
              prompt: "Which word is the subject?",
              answer: "ὁ ἀπόστολος (nominative)",
              choices: [
                "ὁ ἀπόστολος (nominative)",
                "πέμπει (the verb)",
                "τὸν ἀπόστολον (the accusative one)",
                "either, depending on word order"
              ],
              note: "ς ending → nominative → subject. The ν ending → accusative → direct object. Word order is irrelevant." }
          ]
        },
        {
          family: "Noun Rules 1–3",
          lemma: "rules of nouns",
          gloss: "first three of eight",
          questions: [
            { form: "Rule 1",
              prompt: "Mounce's Noun Rule #1?",
              answer: "stems ending in α or η are first declension",
              choices: [
                "stems ending in α or η are first declension",
                "neuter nominative equals accusative",
                "neuter plural ends in α",
                "tau drops off at end of word"
              ] },
            { form: "Rule 2",
              prompt: "Mounce's Noun Rule #2?",
              answer: "for neuter nouns, nominative form = accusative form",
              choices: [
                "for neuter nouns, nominative form = accusative form",
                "stems ending in α or η are first declension",
                "neuter plural nom/acc ends in α",
                "dative singular has an iota subscript"
              ] },
            { form: "Rule 3",
              prompt: "Mounce's Noun Rule #3?",
              answer: "neuter nominative/accusative plural ends in α",
              choices: [
                "neuter nominative/accusative plural ends in α",
                "neuter nom = neuter acc (Rule 2)",
                "tau cannot stand at the end of a word",
                "labial + σ → ψ (Square of Stops)"
              ] }
          ]
        },
        {
          family: "First/Second declension nominative–accusative",
          lemma: "case endings preview",
          gloss: "ς -ν / ν ν ν / ι ι α / υς ς α",
          questions: [
            { form: "λόγος",
              prompt: "Parse this form (2nd declension masculine).",
              answer: "nominative singular",
              choices: ["nominative singular", "accusative singular", "nominative plural", "genitive singular"] },
            { form: "λόγον",
              prompt: "Parse this form.",
              answer: "accusative singular",
              choices: ["accusative singular", "nominative singular", "accusative plural", "genitive singular"] },
            { form: "ἔργα",
              prompt: "Parse this form (neuter).",
              answer: "nominative or accusative plural",
              choices: [
                "nominative or accusative plural",
                "nominative singular feminine",
                "genitive plural neuter",
                "dative singular neuter"
              ],
              note: "Rule 3: neuter nom/acc plural = α. Rule 2: nom = acc for neuters." },
            { form: "γραφαί",
              prompt: "Parse this form (1st declension feminine).",
              answer: "nominative plural feminine",
              choices: ["nominative plural feminine", "nominative singular feminine", "accusative plural feminine", "genitive singular feminine"] }
          ]
        }
      ]
    },

    "7": {
      label: "Chapter 7 — Genitive & Dative",
      notes: "Indirect vs direct object; full article; Noun Rules 4–6",
      items: [
        {
          family: "Article paradigm",
          lemma: "ὁ, ἡ, τό",
          gloss: "the (full)",
          questions: [
            { form: "ὁ", answer: "nominative singular masculine", prompt: "Parse this article.",
              choices: ["nominative singular masculine", "accusative singular masculine", "nominative singular feminine", "accusative singular neuter"] },
            { form: "τοῦ", answer: "genitive singular masculine/neuter", prompt: "Parse this article.",
              choices: ["genitive singular masculine/neuter", "dative singular masculine/neuter", "accusative plural masculine", "genitive plural"] },
            { form: "τῷ", answer: "dative singular masculine/neuter", prompt: "Parse this article.",
              choices: ["dative singular masculine/neuter", "genitive singular masculine/neuter", "nominative singular masculine", "accusative singular masculine"] },
            { form: "τήν", answer: "accusative singular feminine", prompt: "Parse this article.",
              choices: ["accusative singular feminine", "nominative singular feminine", "accusative singular masculine", "genitive singular feminine"] },
            { form: "τῶν", answer: "genitive plural (all genders)", prompt: "Parse this article.",
              choices: ["genitive plural (all genders)", "dative plural masculine", "accusative plural feminine", "nominative plural neuter"] },
            { form: "τοῖς", answer: "dative plural masculine/neuter", prompt: "Parse this article.",
              choices: ["dative plural masculine/neuter", "genitive plural", "dative plural feminine", "accusative plural masculine"] }
          ]
        },
        {
          family: "Noun Rules 4–6",
          lemma: "rules of nouns",
          gloss: "next three of eight",
          questions: [
            { form: "Rule 4",
              prompt: "Mounce's Noun Rule #4?",
              answer: "the dative singular has an iota subscript whenever possible",
              choices: [
                "the dative singular has an iota subscript whenever possible",
                "stems ending in α or η are first declension",
                "tau drops off at end of word",
                "neuter nominative = accusative"
              ],
              note: "Iota subscript appears under η, ω, α — silent but a parsing flag." },
            { form: "Rule 5",
              prompt: "Mounce's Noun Rule #5 (ablaut)?",
              answer: "vowels can shift, lengthen, or drop out",
              choices: [
                "vowels can shift, lengthen, or drop out",
                "tau drops off at end of word",
                "the dative singular takes an iota subscript",
                "labial + σ → ψ"
              ] },
            { form: "Rule 6",
              prompt: "Mounce's Noun Rule #6?",
              answer: "in 1st/2nd declension genitive & dative, masculine endings = neuter endings",
              choices: [
                "in 1st/2nd declension genitive & dative, masculine endings = neuter endings",
                "neuter nom = neuter acc",
                "stems in α/η are first declension",
                "neuter plural is α"
              ],
              note: "Visual mnemonic from the overhead: dat-gen 'twins' wearing the same shirts." }
          ]
        },
        {
          family: "Indirect vs direct object",
          lemma: "case syntax",
          gloss: "dat. = IO; acc. = DO",
          questions: [
            { form: "Karin threw Brad a ball.",
              prompt: "In Greek terms, what case would 'Brad' (the indirect object) take?",
              answer: "dative",
              choices: ["dative", "accusative", "nominative", "genitive"] },
            { form: "Karin threw Brad.",
              prompt: "In Greek terms, what case would 'Brad' (now direct object) take?",
              answer: "accusative",
              choices: ["accusative", "dative", "nominative", "genitive"],
              note: "Same English noun, different functions → different Greek cases." }
          ]
        }
      ]
    },

    "8": {
      label: "Chapter 8 — Prepositions & εἰμί",
      notes: "Preposition + object; movable nu; dependent clauses; εἰμί",
      items: [
        {
          family: "Prepositions and case",
          lemma: "prepositions govern case",
          gloss: "object case → meaning",
          questions: [
            { form: "ἐν",
              prompt: "What case does ἐν take, and what does it normally mean?",
              answer: "dative — 'in / on / by / with'",
              choices: ["dative — 'in / on / by / with'", "accusative — 'into'", "genitive — 'out of'", "nominative — 'is'"] },
            { form: "εἰς",
              prompt: "What case does εἰς take?",
              answer: "accusative — 'into / to'",
              choices: ["accusative — 'into / to'", "dative — 'in'", "genitive — 'out of'", "either dative or accusative"] },
            { form: "ἐκ / ἐξ",
              prompt: "What case does ἐκ take?",
              answer: "genitive — 'out of / from'",
              choices: ["genitive — 'out of / from'", "dative — 'in'", "accusative — 'into'", "nominative"] },
            { form: "ἀπό",
              prompt: "What case does ἀπό take?",
              answer: "genitive — 'from / away from'",
              choices: ["genitive — 'from / away from'", "accusative — 'to'", "dative — 'with'", "nominative"] },
            { form: "διά",
              prompt: "διά with the genitive vs. διά with the accusative — what's the typical contrast?",
              answer: "gen. = 'through'; acc. = 'because of / on account of'",
              choices: [
                "gen. = 'through'; acc. = 'because of / on account of'",
                "gen. = 'into'; acc. = 'in'",
                "always 'through' regardless of case",
                "gen. = 'with'; acc. = 'against'"
              ] },
            { form: "πρός",
              prompt: "Most common NT meaning of πρός + accusative?",
              answer: "to / toward",
              choices: ["to / toward", "out of", "in", "from"] }
          ]
        },
        {
          family: "Movable nu",
          lemma: "movable ν",
          gloss: "the wagon-pulled nu",
          questions: [
            { form: "λύουσιν",
              prompt: "Why is the final ν present?",
              answer: "movable ν, added before vowels or pause",
              choices: [
                "movable ν, added before vowels or pause",
                "it marks the accusative",
                "it forms a diphthong",
                "it is part of the verbal stem"
              ],
              note: "The final ν of forms like λύουσι(ν), εἰσί(ν), ἔλυσε(ν) is optional and added for euphony." }
          ]
        },
        {
          family: "εἰμί and dependent clauses",
          lemma: "εἰμί and conjunctions",
          gloss: "to-be plus subordinators",
          questions: [
            { form: "εἰμί",
              prompt: "Identify the form.",
              answer: "1st singular ('I am')",
              choices: ["1st singular ('I am')", "3rd singular ('he/she/it is')", "1st plural ('we are')", "infinitive ('to be')"] },
            { form: "ἐστίν",
              prompt: "Identify the form.",
              answer: "3rd singular ('he/she/it is')",
              choices: ["3rd singular ('he/she/it is')", "2nd singular ('you are')", "3rd plural ('they are')", "1st singular"] },
            { form: "Predicate of εἰμί",
              prompt: "After εἰμί, what case does the predicate noun take?",
              answer: "nominative (predicate nominative)",
              choices: ["nominative (predicate nominative)", "accusative", "dative", "genitive"] },
            { form: "Dependent clause",
              prompt: "Mounce's marker for a dependent (subordinate) clause?",
              answer: "no subject + main verb of its own (it depends on another clause)",
              choices: [
                "no subject + main verb of its own (it depends on another clause)",
                "always begins with εἰμί",
                "always introduced by καί",
                "always uses the subjunctive"
              ] }
          ]
        }
      ]
    },

    "9": {
      label: "Chapter 9 — Adjectives",
      notes: "Functions (adjectivally vs substantivally); positions (attributive vs predicate)",
      items: [
        {
          family: "Functions of an adjective",
          lemma: "adjective use",
          gloss: "two main jobs",
          questions: [
            { form: "ὁ ἀγαθὸς ἄνθρωπος",
              prompt: "How is the adjective functioning here?",
              answer: "adjectivally — modifying a noun",
              choices: [
                "adjectivally — modifying a noun",
                "substantivally — as a noun",
                "as a verb",
                "as an adverb"
              ] },
            { form: "οἱ ἀγαθοί",
              prompt: "How is the adjective functioning here?",
              answer: "substantivally — 'the good ones / the good people'",
              choices: [
                "substantivally — 'the good ones / the good people'",
                "adjectivally — modifying an unwritten noun",
                "predicatively — 'they are good'",
                "as the verb"
              ],
              note: "An article + adjective alone often acts as a noun: 'the good [people],' 'the dead,' etc." }
          ]
        },
        {
          family: "Adjective positions",
          lemma: "attributive vs predicate",
          gloss: "the article test",
          questions: [
            { form: "ὁ ἀγαθὸς ἄνθρωπος",
              prompt: "Identify the adjective's position.",
              answer: "attributive — 'the good man'",
              choices: ["attributive — 'the good man'", "predicate — 'the man is good'", "substantival — 'the good [one]'", "ambiguous"],
              note: "Attributive = the article immediately precedes the adjective." },
            { form: "ὁ ἀγαθὸς ὁ ἄνθρωπος",
              prompt: "Identify the position.",
              answer: "attributive (second attributive position) — 'the good man'",
              choices: [
                "attributive (second attributive position) — 'the good man'",
                "predicate — 'the man is good'",
                "substantival",
                "wrong — Greek does not write it this way"
              ] },
            { form: "ὁ ἄνθρωπος ἀγαθός",
              prompt: "Identify the position.",
              answer: "predicate — 'the man is good'",
              choices: ["predicate — 'the man is good'", "attributive — 'the good man'", "substantival", "ambiguous"],
              note: "Predicate position = NO article immediately before the adjective. εἰμί is implied." },
            { form: "ἀγαθὸς ὁ ἄνθρωπος",
              prompt: "Identify the position.",
              answer: "predicate — 'the man is good'",
              choices: ["predicate — 'the man is good'", "attributive — 'the good man'", "substantival", "ungrammatical"],
              note: "Predicate even though the adjective is fronted — there is no article before ἀγαθός." },
            { form: "ἀγαθὸς ἄνθρωπος",
              prompt: "With NO article anywhere, the adjective could be …",
              answer: "either attributive ('a good man') or predicate ('a man is good') — context decides",
              choices: [
                "either attributive ('a good man') or predicate ('a man is good') — context decides",
                "always attributive",
                "always predicate",
                "ungrammatical"
              ] }
          ]
        }
      ]
    },

    "10": {
      label: "Chapter 10 — Third Declension",
      notes: "Master Case Ending Chart; Square of Stops (Rule 7); tau drop (Rule 8)",
      items: [
        {
          family: "Third-declension endings",
          lemma: "σάρξ paradigm",
          gloss: "stem σαρκ-",
          questions: [
            { form: "σάρξ",
              prompt: "Parse (3rd decl. fem., stem σαρκ-).",
              answer: "nominative singular feminine",
              choices: ["nominative singular feminine", "accusative singular feminine", "nominative plural feminine", "dative singular feminine"],
              note: "Square of Stops (Rule 7): velar κ + σ → ξ." },
            { form: "σαρκός",
              prompt: "Parse.",
              answer: "genitive singular feminine",
              choices: ["genitive singular feminine", "accusative plural feminine", "dative singular feminine", "nominative plural feminine"] },
            { form: "σαρκί",
              prompt: "Parse.",
              answer: "dative singular feminine",
              choices: ["dative singular feminine", "genitive singular feminine", "nominative plural feminine", "accusative singular feminine"] },
            { form: "σάρκα",
              prompt: "Parse.",
              answer: "accusative singular feminine",
              choices: ["accusative singular feminine", "nominative plural neuter", "genitive singular feminine", "nominative singular feminine"] },
            { form: "σαρξί(ν)",
              prompt: "Parse.",
              answer: "dative plural feminine",
              choices: ["dative plural feminine", "accusative plural feminine", "nominative plural feminine", "genitive plural feminine"],
              note: "Square of Stops at work again: κ + σι → ξι." }
          ]
        },
        {
          family: "Rule 7 — Square of Stops",
          lemma: "stop + σ rules",
          gloss: "labial/velar/dental + σ",
          questions: [
            { form: "Labial + σ",
              prompt: "How does any labial (π β φ) combine with following σ?",
              answer: "→ ψ",
              choices: ["→ ψ", "→ ξ", "→ σ", "drops out"] },
            { form: "Velar + σ",
              prompt: "How does any velar (κ γ χ) combine with following σ?",
              answer: "→ ξ",
              choices: ["→ ξ", "→ ψ", "→ σ", "drops out"] },
            { form: "Dental + σ",
              prompt: "How does any dental (τ δ θ) combine with following σ?",
              answer: "→ σ (the dental drops out)",
              choices: ["→ σ (the dental drops out)", "→ ξ", "→ ψ", "stays unchanged"] }
          ]
        },
        {
          family: "Rule 8 — tau drops at word end",
          lemma: "ὄνομα family",
          gloss: "stem-final τ silenced",
          questions: [
            { form: "ὄνομα",
              prompt: "Why isn't there a final τ on this nom/acc singular even though the stem is ὀνοματ-?",
              answer: "a τ cannot stand at the end of a word; it drops off (Rule 8)",
              choices: [
                "a τ cannot stand at the end of a word; it drops off (Rule 8)",
                "neuter plural takes α",
                "first declension ends in α",
                "movable nu replaces it"
              ] }
          ]
        }
      ]
    },

    "11": {
      label: "Chapter 11 — First & Second Person Personal Pronouns",
      notes: "ἐγώ / σύ paradigms; emphatic vs. enclitic",
      items: [
        {
          family: "First-person pronoun",
          lemma: "ἐγώ",
          gloss: "I / we",
          questions: [
            { form: "ἐγώ", answer: "nominative singular ('I')", prompt: "Parse.",
              choices: ["nominative singular ('I')", "genitive singular ('my')", "dative singular ('to me')", "accusative singular ('me')"] },
            { form: "μου", answer: "genitive singular ('my')", prompt: "Parse.",
              choices: ["genitive singular ('my')", "dative singular ('to me')", "accusative singular ('me')", "nominative singular ('I')"] },
            { form: "ἡμᾶς", answer: "accusative plural ('us')", prompt: "Parse.",
              choices: ["accusative plural ('us')", "dative plural ('to us')", "genitive plural ('our')", "nominative plural ('we')"] }
          ]
        },
        {
          family: "Second-person pronoun",
          lemma: "σύ",
          gloss: "you (sg./pl.)",
          questions: [
            { form: "σύ", answer: "nominative singular ('you')", prompt: "Parse.",
              choices: ["nominative singular ('you')", "genitive singular ('your')", "accusative singular ('you')", "nominative plural ('you all')"] },
            { form: "ὑμῖν", answer: "dative plural ('to you all')", prompt: "Parse.",
              choices: ["dative plural ('to you all')", "genitive plural ('of you all')", "dative singular ('to you')", "accusative plural"] },
            { form: "Why μου / σου (no accent)?",
              prompt: "When 1st/2nd person pronouns are unstressed (enclitic) the accent is …",
              answer: "thrown back onto the previous word",
              choices: ["thrown back onto the previous word", "always grave", "always circumflex", "dropped entirely from both words"] }
          ]
        }
      ]
    },

    "12": {
      label: "Chapter 12 — αὐτός",
      notes: "Three Uses of αὐτός: pronoun, intensive, identical",
      items: [
        {
          family: "Three uses of αὐτός",
          lemma: "αὐτός",
          gloss: "he/she/it; -self; same",
          questions: [
            { form: "αὐτὸς λέγει …",
              prompt: "Identify the use of αὐτός.",
              answer: "intensive — 'he himself'",
              choices: [
                "intensive — 'he himself'",
                "personal pronoun — 'he'",
                "identical — 'the same one'",
                "demonstrative — 'this'"
              ],
              note: "αὐτός in the nominative is usually intensive: 'he himself.' (Predicate position.)" },
            { form: "βλέπω αὐτόν",
              prompt: "Identify the use of αὐτός.",
              answer: "personal pronoun — 'I see him'",
              choices: [
                "personal pronoun — 'I see him'",
                "intensive — 'I see him himself'",
                "identical — 'I see the same one'",
                "reflexive — 'I see myself'"
              ],
              note: "Outside the nominative, αὐτός is normally just the 3rd-person pronoun." },
            { form: "ὁ αὐτὸς Ἰησοῦς",
              prompt: "Identify the use of αὐτός.",
              answer: "identical — 'the same Jesus'",
              choices: [
                "identical — 'the same Jesus'",
                "intensive — 'Jesus himself'",
                "personal pronoun — 'he, Jesus'",
                "demonstrative — 'this Jesus'"
              ],
              note: "In the attributive position (ὁ αὐτὸς + noun) αὐτός means 'same.'" },
            { form: "Position summary",
              prompt: "How does Mounce summarize αὐτός's three uses?",
              answer: "(1) pronoun 'he/she/it' (2) intensive 'himself' in predicate position (3) identical 'same' in attributive position",
              choices: [
                "(1) pronoun 'he/she/it' (2) intensive 'himself' in predicate position (3) identical 'same' in attributive position",
                "always intensive in the NT",
                "always means 'same'",
                "only used as a reflexive pronoun"
              ] }
          ]
        }
      ]
    },

    "13": {
      label: "Chapter 13 — Demonstratives",
      notes: "οὗτος (near, 'this'); ἐκεῖνος (far, 'that')",
      items: [
        {
          family: "οὗτος / ἐκεῖνος",
          lemma: "demonstratives",
          gloss: "this vs. that",
          questions: [
            { form: "οὗτος", answer: "nominative singular masculine ('this')", prompt: "Parse this demonstrative.",
              choices: ["nominative singular masculine ('this')", "accusative singular masculine ('this one')", "genitive singular masculine ('of this')", "nominative singular feminine ('this woman')"] },
            { form: "αὕτη", answer: "nominative singular feminine ('this')", prompt: "Parse.",
              choices: ["nominative singular feminine ('this')", "nominative singular masculine ('this')", "nominative plural neuter ('these things')", "nominative plural feminine ('these women')"] },
            { form: "ταῦτα", answer: "nominative/accusative plural neuter ('these things')", prompt: "Parse.",
              choices: ["nominative/accusative plural neuter ('these things')", "nominative plural feminine ('these')", "nominative singular feminine ('this')", "genitive plural ('of these')"] },
            { form: "ἐκεῖνος", answer: "nominative singular masculine ('that')", prompt: "Parse.",
              choices: ["nominative singular masculine ('that')", "nominative singular masculine ('this')", "accusative singular masculine", "nominative singular neuter"] },
            { form: "Position",
              prompt: "Where do demonstrative pronouns sit relative to the article?",
              answer: "predicate position when used adjectivally with a noun (e.g. οὗτος ὁ ἄνθρωπος)",
              choices: [
                "predicate position when used adjectivally with a noun (e.g. οὗτος ὁ ἄνθρωπος)",
                "attributive position (e.g. ὁ οὗτος ἄνθρωπος)",
                "always before καί",
                "always at the end of the sentence"
              ],
              note: "οὗτος ὁ ἄνθρωπος / ὁ ἄνθρωπος οὗτος = 'this man.' But never *ὁ οὗτος ἄνθρωπος." }
          ]
        }
      ]
    },

    "14": {
      label: "Chapter 14 — Relative Pronoun",
      notes: "ὅς, ἥ, ὅ; agreement rules",
      items: [
        {
          family: "Relative pronoun ὅς",
          lemma: "ὅς, ἥ, ὅ",
          gloss: "who / which / that",
          questions: [
            { form: "ὅς", answer: "nominative singular masculine ('who/which')", prompt: "Parse.",
              choices: ["nominative singular masculine ('who/which')", "genitive singular masculine", "accusative singular masculine", "nominative singular neuter"] },
            { form: "ἥν", answer: "accusative singular feminine ('whom/which')", prompt: "Parse.",
              choices: ["accusative singular feminine ('whom/which')", "nominative singular feminine ('who')", "accusative plural feminine", "genitive singular feminine"] },
            { form: "οἷς", answer: "dative plural masculine/neuter ('to whom/which')", prompt: "Parse.",
              choices: ["dative plural masculine/neuter ('to whom/which')", "dative plural feminine", "genitive plural", "accusative plural masculine"] },
            { form: "Agreement rule",
              prompt: "How does the relative pronoun agree with its antecedent?",
              answer: "in gender and number, but its case comes from its own clause",
              choices: [
                "in gender and number, but its case comes from its own clause",
                "in case, gender, and number — all three from the antecedent",
                "in case only",
                "it never agrees with its antecedent"
              ] }
          ]
        }
      ]
    },

    "15": {
      label: "Chapter 15 — Introduction to Verbs",
      notes: "Agreement, person, number, aspect, tense, time, voice, mood; parts of the verb",
      items: [
        {
          family: "Verb terminology",
          lemma: "verb categories",
          gloss: "agreement / aspect / voice / mood",
          questions: [
            { form: "Agreement",
              prompt: "Subject and verb must agree in …",
              answer: "person and number",
              choices: ["person and number", "case and gender", "tense and mood", "person, number, and gender"] },
            { form: "Aspect",
              prompt: "Mounce's three aspect categories?",
              answer: "Continuous, Undefined, Perfect",
              choices: [
                "Continuous, Undefined, Perfect",
                "Past, Present, Future",
                "Active, Middle, Passive",
                "Indicative, Subjunctive, Imperative"
              ],
              note: "Aspect ≠ tense. Continuous = process; Undefined = whole event; Perfect = completed action with abiding effect." },
            { form: "Voice",
              prompt: "Greek voices?",
              answer: "Active, Middle, Passive",
              choices: ["Active, Middle, Passive", "Active and Passive", "Indicative and Subjunctive", "1st, 2nd, 3rd person"] },
            { form: "Indicative mood",
              prompt: "What does the indicative mood express?",
              answer: "factual statement / question",
              choices: ["factual statement / question", "command", "wish or potential", "purpose"] }
          ]
        },
        {
          family: "Parts of the verb",
          lemma: "λύομεν",
          gloss: "stem + connecting vowel + ending",
          questions: [
            { form: "λύομεν",
              prompt: "Identify the parts.",
              answer: "stem (λύ) + connecting vowel (ο) + personal ending (μεν)",
              choices: [
                "stem (λύ) + connecting vowel (ο) + personal ending (μεν)",
                "stem (λύο) + ending (μεν)",
                "augment (λ) + stem (ύομεν)",
                "reduplication (λυ) + stem (ομεν)"
              ] },
            { form: "Connecting vowel",
              prompt: "What is the standard connecting vowel pattern in the present?",
              answer: "ο before μ/ν, ε elsewhere",
              choices: [
                "ο before μ/ν, ε elsewhere",
                "always ο",
                "always ε",
                "α everywhere"
              ] }
          ]
        }
      ]
    },

    "16": {
      label: "Chapter 16 — Present Active Indicative",
      notes: "λύω paradigm; first of four endings; primary active",
      items: [
        {
          family: "Present active formula",
          lemma: "λύω",
          gloss: "I am loosing",
          questions: [
            { form: "λύομεν",
              prompt: "Build the form: 'we are loosing'.",
              answer: "stem λυ + connecting vowel ο + ending μεν",
              choices: [
                "stem λυ + connecting vowel ο + ending μεν",
                "augment ε + stem λυ + ending μεν",
                "stem λύσ + connecting vowel α + ending μεν",
                "reduplication λε + stem λυ + ending κα"
              ] },
            { form: "λύεις", answer: "present active indicative, 2nd singular", prompt: "Parse.",
              choices: ["present active indicative, 2nd singular", "present active indicative, 3rd singular", "imperfect 2nd singular", "future 2nd singular"] },
            { form: "λύει", answer: "present active indicative, 3rd singular", prompt: "Parse.",
              choices: ["present active indicative, 3rd singular", "present active indicative, 2nd singular", "imperfect 3rd singular", "present middle 2nd singular"] },
            { form: "λύουσι(ν)", answer: "present active indicative, 3rd plural", prompt: "Parse.",
              choices: ["present active indicative, 3rd plural", "present active indicative, 3rd singular", "future active 3rd plural", "imperfect 3rd plural"] }
          ]
        },
        {
          family: "Primary active endings",
          lemma: "first of four endings",
          gloss: "−, ς, ι, μεν, τε, νσι",
          questions: [
            { form: "Which endings?",
              prompt: "What set of endings does the present active indicative use?",
              answer: "primary active",
              choices: ["primary active", "secondary active", "primary middle/passive", "perfect active"],
              note: "Mounce's four sets: primary active, primary mid/pas, secondary active, secondary mid/pas." }
          ]
        }
      ]
    },

    "17": {
      label: "Chapter 17 — Contract Verbs",
      notes: "Five Rules of Contraction (§17.4)",
      items: [
        {
          family: "Five Rules of Contraction",
          lemma: "vowel contraction",
          gloss: "ε / α / ο contracts",
          questions: [
            { form: "εο, οε, οο",
              prompt: "What do these combinations contract to?",
              answer: "ου",
              choices: ["ου", "ει", "ω", "η"],
              note: "Rule 1: ου is formed by εο, οε, and οο." },
            { form: "εε",
              prompt: "What does εε contract to?",
              answer: "ει",
              choices: ["ει", "ου", "η", "α"],
              note: "Rule 2: ει is formed by εε." },
            { form: "ο/ω with anything else",
              prompt: "Almost any combination of o-class with another vowel contracts to …",
              answer: "ω",
              choices: ["ω", "ου", "ει", "α"],
              note: "Rule 3 — except for the ου exceptions in Rule 1." },
            { form: "αε",
              prompt: "What does αε contract to?",
              answer: "α",
              choices: ["α", "η", "ει", "ω"],
              note: "Rule 4: α is formed from αε." },
            { form: "εα",
              prompt: "What does εα contract to?",
              answer: "η",
              choices: ["η", "α", "ει", "ε"],
              note: "Rule 5: η is formed from εα." }
          ]
        },
        {
          family: "Contract verbs in practice",
          lemma: "ποιέω, ἀγαπάω, πληρόω",
          gloss: "ε / α / ο contracts",
          questions: [
            { form: "ποιέω → 1sg present",
              prompt: "Lexical ποιέω becomes which form in the 1sg pres. indicative?",
              answer: "ποιῶ",
              choices: ["ποιῶ", "ποιέω", "ποιοῦ", "ποιεῖ"],
              note: "ε + ω → ω with circumflex." },
            { form: "ἀγαπάω → 3sg present",
              prompt: "ἀγαπάω becomes which form in the 3sg pres. indicative?",
              answer: "ἀγαπᾷ",
              choices: ["ἀγαπᾷ", "ἀγαπᾶ", "ἀγαπάει", "ἀγαπεῖ"] },
            { form: "πληρόω → 1pl present",
              prompt: "πληρόω becomes which form in the 1pl pres. indicative?",
              answer: "πληροῦμεν",
              choices: ["πληροῦμεν", "πληρώομεν", "πληροῖμεν", "πληρόομεν"] }
          ]
        }
      ]
    },

    "18": {
      label: "Chapter 18 — Present Middle/Passive Indicative",
      notes: "λύομαι; second of four endings; deponents",
      items: [
        {
          family: "Present middle/passive endings",
          lemma: "λύομαι",
          gloss: "I am being loosed / loose for myself",
          questions: [
            { form: "λύομαι", answer: "present mid/pas indicative, 1st singular", prompt: "Parse.",
              choices: ["present mid/pas indicative, 1st singular", "present active 1st singular", "imperfect mid/pas 1st singular", "future mid 1st singular"] },
            { form: "λύῃ", answer: "present mid/pas indicative, 2nd singular", prompt: "Parse (note the morphology, ignore homophony).",
              choices: ["present mid/pas indicative, 2nd singular", "present active 3rd singular", "subjunctive 3rd singular", "imperfect 2nd singular"],
              note: "λύῃ comes from λύεσαι; the σ drops and ε+αι → ῃ." },
            { form: "λυόμεθα", answer: "present mid/pas indicative, 1st plural", prompt: "Parse.",
              choices: ["present mid/pas indicative, 1st plural", "present mid/pas indicative, 2nd plural", "imperfect mid/pas 1st plural", "perfect mid/pas 1st plural"] },
            { form: "λύονται", answer: "present mid/pas indicative, 3rd plural", prompt: "Parse.",
              choices: ["present mid/pas indicative, 3rd plural", "present active 3rd plural", "imperfect mid/pas 3rd plural", "subjunctive 3rd plural"] }
          ]
        },
        {
          family: "Deponent verbs",
          lemma: "ἔρχομαι",
          gloss: "I come / go",
          questions: [
            { form: "ἔρχομαι",
              prompt: "What is a 'deponent' verb?",
              answer: "middle/passive in form, active in meaning",
              choices: [
                "middle/passive in form, active in meaning",
                "always passive in meaning",
                "found only in the imperfect tense",
                "without any personal endings"
              ],
              note: "Mounce introduces deponents alongside the present middle/passive." }
          ]
        }
      ]
    },

    "19": {
      label: "Chapter 19 — Future Active/Middle Indicative",
      notes: "Tense formative σ; primary endings",
      items: [
        {
          family: "Future formula",
          lemma: "λύσω",
          gloss: "I will loose",
          questions: [
            { form: "λύσω",
              prompt: "Build: 'I will loose' from λύω.",
              answer: "stem λυ + tense formative σ + connecting vowel ο/ε + primary active endings",
              choices: [
                "stem λυ + tense formative σ + connecting vowel ο/ε + primary active endings",
                "augment ε + stem λυσ + secondary active endings",
                "reduplication λε + stem λυκ + primary active endings",
                "stem λυ + tense formative σα + secondary active endings"
              ] },
            { form: "λύσομεν", answer: "future active indicative, 1st plural", prompt: "Parse.",
              choices: ["future active indicative, 1st plural", "aorist active 1st plural", "present active 1st plural", "imperfect 1st plural"] },
            { form: "πορεύσομαι", answer: "future middle indicative, 1st singular", prompt: "Parse.",
              choices: ["future middle indicative, 1st singular", "present middle 1st singular", "aorist middle 1st singular", "future active 1st singular"] }
          ]
        }
      ]
    },

    "20": {
      label: "Chapter 20 — Verbal Roots & Other Future Forms",
      notes: "Verbal root vs tense stem; liquid future",
      items: [
        {
          family: "Verbal root vs tense stem",
          lemma: "*lu vs. λύω",
          gloss: "abstract root produces 6 stems",
          questions: [
            { form: "Verbal root",
              prompt: "How many tense stems can be derived from a verbal root in Mounce's chart?",
              answer: "five (present, future, imperfect, aorist, perfect)",
              choices: [
                "five (present, future, imperfect, aorist, perfect)",
                "two (present and aorist)",
                "three (present, imperfect, aorist)",
                "the root and the tense stem are always identical"
              ] }
          ]
        },
        {
          family: "Liquid future",
          lemma: "κρινῶ",
          gloss: "stem-ending λ μ ν ρ",
          questions: [
            { form: "κρινῶ",
              prompt: "Why doesn't the future of κρίνω look like *κρινσω?",
              answer: "liquid stems use εσ (not σ) as tense formative; the σ drops and ε contracts",
              choices: [
                "liquid stems use εσ (not σ) as tense formative; the σ drops and ε contracts",
                "liquid futures simply don't exist",
                "liquid stems take a κα tense formative",
                "the σ shifts to a ξ"
              ],
              note: "Liquid stems end in λ, μ, ν, or ρ. The εσ formative drops its σ and ε contracts with following vowels (Rules of Contraction)." },
            { form: "κρινοῦμεν", answer: "future active indicative, 1st plural (liquid)", prompt: "Parse.",
              choices: ["future active indicative, 1st plural (liquid)", "present active 1st plural", "aorist active 1st plural", "imperfect 1st plural"] }
          ]
        }
      ]
    },

    "21": {
      label: "Chapter 21 — Imperfect Indicative",
      notes: "Augment + present stem + secondary endings; final four endings",
      items: [
        {
          family: "Imperfect formula",
          lemma: "ἔλυον",
          gloss: "I was loosing",
          questions: [
            { form: "ἔλυον",
              prompt: "Build: 'I was loosing'.",
              answer: "augment ε + present stem λυ + connecting vowel ο + secondary active endings",
              choices: [
                "augment ε + present stem λυ + connecting vowel ο + secondary active endings",
                "reduplication λε + stem λυ + κα + primary active",
                "tense formative σ + stem λυ + primary active",
                "stem λυ + connecting vowel ο + primary active"
              ] },
            { form: "Augment",
              prompt: "How does the augment work for verbs starting with a vowel?",
              answer: "the initial vowel lengthens (e.g., ἀ→η, ε→η, ο→ω, αἰ→ῃ)",
              choices: [
                "the initial vowel lengthens (e.g., ἀ→η, ε→η, ο→ω, αἰ→ῃ)",
                "ε is added before the verb regardless",
                "the verb takes a κ before the stem",
                "no augment is needed"
              ] },
            { form: "ἐλύομεν", answer: "imperfect active indicative, 1st plural", prompt: "Parse.",
              choices: ["imperfect active indicative, 1st plural", "present active 1st plural", "aorist active 1st plural", "imperfect mid/pas 1st plural"] },
            { form: "ἐλυόμην", answer: "imperfect mid/pas indicative, 1st singular", prompt: "Parse.",
              choices: ["imperfect mid/pas indicative, 1st singular", "imperfect active 1st singular", "aorist mid 1st singular", "present mid 1st singular"] }
          ]
        }
      ]
    },

    "22": {
      label: "Chapter 22 — Second Aorist Active/Middle",
      notes: "Augment + 2nd aorist stem (changed from present) + secondary endings",
      items: [
        {
          family: "Second aorist",
          lemma: "ἔλαβον",
          gloss: "I took",
          questions: [
            { form: "ἔλαβον",
              prompt: "Why is this 2nd aorist (vs. 1st aorist)?",
              answer: "the aorist stem differs from the present stem; no σα tense formative",
              choices: [
                "the aorist stem differs from the present stem; no σα tense formative",
                "1st aorist always uses ν, 2nd uses τα",
                "2nd aorist has reduplication, 1st does not",
                "there is no difference; only label"
              ],
              note: "λαμβάνω → ἔλαβον. Augment + altered stem + connecting vowel + secondary active." },
            { form: "Endings used",
              prompt: "Which endings does the 2nd aorist active take?",
              answer: "secondary active (same as imperfect)",
              choices: [
                "secondary active (same as imperfect)",
                "primary active (same as present)",
                "perfect active endings",
                "secondary mid/pas"
              ] },
            { form: "ἐγενόμην", answer: "2nd aorist middle indicative, 1st singular", prompt: "Parse.",
              choices: ["2nd aorist middle indicative, 1st singular", "imperfect mid/pas 1st singular", "present middle 1st singular", "perfect mid 1st singular"] },
            { form: "Recognition tip",
              prompt: "How do you know it's a 2nd aorist and not an imperfect?",
              answer: "the stem differs from the present (ἔλαβον vs. λαμβάνω)",
              choices: [
                "the stem differs from the present (ἔλαβον vs. λαμβάνω)",
                "imperfects always have circumflex accent",
                "imperfects use σα tense formative",
                "imperfects never have augment"
              ] }
          ]
        }
      ]
    },

    "23": {
      label: "Chapter 23 — First Aorist Active/Middle",
      notes: "Tense formative σα; liquid aorist (just α)",
      items: [
        {
          family: "First aorist formula",
          lemma: "ἔλυσα",
          gloss: "I loosed",
          questions: [
            { form: "ἔλυσα",
              prompt: "Build: 'I loosed' from λύω.",
              answer: "augment ε + stem λυ + tense formative σα + secondary active endings",
              choices: [
                "augment ε + stem λυ + tense formative σα + secondary active endings",
                "augment ε + stem λυ + connecting vowel ο/ε + secondary active",
                "reduplication λε + stem λυ + κα + primary active",
                "stem λυ + tense formative σ + primary active"
              ] },
            { form: "ἐλύσαμεν", answer: "1st aorist active indicative, 1st plural", prompt: "Parse.",
              choices: ["1st aorist active indicative, 1st plural", "future active 1st plural", "imperfect 1st plural", "perfect active 1st plural"] },
            { form: "ἔμεινα",
              prompt: "Why doesn't the aorist of μένω have σα?",
              answer: "liquid aorist drops σ from σα, leaving just α (after stem change)",
              choices: [
                "liquid aorist drops σ from σα, leaving just α (after stem change)",
                "liquid stems form 2nd aorists with no formative",
                "the verb is irregular; no rule applies",
                "the σ is hidden in the accent"
              ] },
            { form: "ἐλυσάμην", answer: "1st aorist middle indicative, 1st singular", prompt: "Parse.",
              choices: ["1st aorist middle indicative, 1st singular", "imperfect mid/pas 1st singular", "future middle 1st singular", "perfect middle 1st singular"] }
          ]
        }
      ]
    },

    "24": {
      label: "Chapter 24 — Aorist & Future Passive Indicative",
      notes: "θη / η tense formatives; future passive uses θησ / ησ + primary mid/pas",
      items: [
        {
          family: "Aorist passive",
          lemma: "ἐλύθην / ἐγράφην",
          gloss: "1st aor pas (θη) vs 2nd aor pas (η)",
          questions: [
            { form: "ἐλύθην",
              prompt: "Build: 'I was loosed'.",
              answer: "augment ε + stem λυ + tense formative θη + secondary active endings",
              choices: [
                "augment ε + stem λυ + tense formative θη + secondary active endings",
                "augment ε + stem λυ + tense formative σα + secondary active",
                "augment ε + stem λυ + tense formative κα + primary active",
                "augment ε + stem λυ + connecting vowel ο/ε + primary mid/pas"
              ],
              note: "Counterintuitive but correct: 1st aor passive uses θη + secondary ACTIVE endings (not mid/pas)." },
            { form: "ἐγράφην",
              prompt: "Why does this lack the θ of θη?",
              answer: "2nd aorist passive uses η as tense formative (no θ)",
              choices: [
                "2nd aorist passive uses η as tense formative (no θ)",
                "γράφω never forms a passive",
                "the θ is hidden in the augment",
                "this is not an aorist passive form"
              ] },
            { form: "ἐλύθησαν", answer: "1st aorist passive indicative, 3rd plural", prompt: "Parse.",
              choices: ["1st aorist passive indicative, 3rd plural", "1st aorist active 3rd plural", "perfect passive 3rd plural", "imperfect passive 3rd plural"] }
          ]
        },
        {
          family: "Future passive",
          lemma: "λυθήσομαι",
          gloss: "θησ + primary mid/pas",
          questions: [
            { form: "λυθήσομαι",
              prompt: "Build: 'I will be loosed'.",
              answer: "stem λυ + tense formative θησ + connecting vowel ο/ε + primary mid/pas endings (no augment)",
              choices: [
                "stem λυ + tense formative θησ + connecting vowel ο/ε + primary mid/pas endings (no augment)",
                "augment + stem + θη + primary active",
                "stem + tense formative σ + primary mid/pas",
                "reduplication + stem + κα + primary mid/pas"
              ] },
            { form: "ἀποσταλήσομαι",
              prompt: "Why no θ in the tense formative here?",
              answer: "this is a 2nd future passive (just ησ)",
              choices: [
                "this is a 2nd future passive (just ησ)",
                "the θ is silent",
                "this isn't actually a future passive",
                "the verb is deponent so it skips θ"
              ] }
          ]
        }
      ]
    },

    "25": {
      label: "Chapter 25 — Perfect Indicative",
      notes: "Reduplication + κα/α + primary endings",
      items: [
        {
          family: "Perfect active",
          lemma: "λέλυκα",
          gloss: "I have loosed",
          questions: [
            { form: "λέλυκα",
              prompt: "Build: 'I have loosed'.",
              answer: "reduplication λε + stem λυ + tense formative κα + primary active endings",
              choices: [
                "reduplication λε + stem λυ + tense formative κα + primary active endings",
                "augment ε + stem λυ + tense formative κα + secondary active",
                "stem λυ + tense formative σα + primary active",
                "stem λυ + tense formative κα + secondary active"
              ] },
            { form: "Aspect",
              prompt: "What aspect does the perfect convey?",
              answer: "completed action with abiding/continuing effects",
              choices: [
                "completed action with abiding/continuing effects",
                "ongoing action in present time only",
                "simple past time",
                "future expectation"
              ] }
          ]
        },
        {
          family: "Reduplication of stops",
          lemma: "Mounce overhead §25.6",
          gloss: "voiced/aspirated stops deaspirate",
          questions: [
            { form: "Aspirated stops",
              prompt: "Words starting with φ, χ, θ reduplicate to …",
              answer: "πε, κε, τε respectively",
              choices: [
                "πε, κε, τε respectively",
                "φε, χε, θε respectively",
                "the augment ε only",
                "ε followed by σ"
              ],
              note: "Greek prefers unaspirated reduplication: πεφίληκα (not *φεφίληκα)." },
            { form: "λέλυμαι",
              prompt: "Parse.",
              answer: "perfect mid/pas indicative, 1st singular",
              choices: ["perfect mid/pas indicative, 1st singular", "present mid/pas 1st singular", "perfect active 1st singular", "aorist mid/pas 1st singular"] }
          ]
        }
      ]
    },

    "26": {
      label: "Chapter 26 — Introduction to Participles",
      notes: "Verbal adjectives: tense + voice + case/number/gender",
      items: [
        {
          family: "Participles as verbal adjectives",
          lemma: "participle = verb + adjective",
          gloss: "tense/voice + case/number/gender",
          questions: [
            { form: "Participle",
              prompt: "Greek participles inherit categories from both …",
              answer: "verbs (tense, voice) and adjectives (case, number, gender)",
              choices: [
                "verbs (tense, voice) and adjectives (case, number, gender)",
                "nouns and pronouns",
                "adverbs and adjectives",
                "verbs and adverbs only"
              ] },
            { form: "Tense in participles",
              prompt: "What does tense communicate in a participle?",
              answer: "primarily aspect; secondarily relative time to the main verb",
              choices: [
                "primarily aspect; secondarily relative time to the main verb",
                "absolute time only",
                "person and number",
                "case and gender"
              ],
              note: "Present ptc. = continuous aspect; aorist ptc. = undefined; perfect ptc. = perfect aspect." }
          ]
        }
      ]
    },

    "27": {
      label: "Chapter 27 — Present (Continuous) Adverbial Participles",
      notes: "Active morpheme ντ; mid/pas morpheme μενο/η",
      items: [
        {
          family: "Present adverbial participles",
          lemma: "λύων / λυόμενος",
          gloss: "while loosing / being loosed",
          questions: [
            { form: "λύων", answer: "present active participle, nom. sg. masc.", prompt: "Parse.",
              choices: ["present active participle, nom. sg. masc.", "present active indicative, 3rd plural", "present mid/pas participle, nom. sg. masc.", "aorist active participle, nom. sg. masc."] },
            { form: "λύουσα", answer: "present active participle, nom. sg. fem.", prompt: "Parse.",
              choices: ["present active participle, nom. sg. fem.", "present active indicative, 3rd plural", "present mid/pas participle, nom. sg. fem.", "aorist active participle, nom. sg. fem."] },
            { form: "λυόμενος", answer: "present mid/pas participle, nom. sg. masc.", prompt: "Parse.",
              choices: ["present mid/pas participle, nom. sg. masc.", "present active participle, nom. sg. masc.", "aorist mid participle, nom. sg. masc.", "perfect mid/pas participle, nom. sg. masc."] },
            { form: "Active morpheme",
              prompt: "Mounce's morpheme for active participles?",
              answer: "ντ",
              choices: ["ντ", "μενο/η", "οτ", "θεντ"] },
            { form: "Mid/pas morpheme",
              prompt: "Mounce's morpheme for mid/pas participles?",
              answer: "μενο/η",
              choices: ["μενο/η", "ντ", "οτ", "θεντ"] }
          ]
        }
      ]
    },

    "28": {
      label: "Chapter 28 — Aorist (Undefined) Adverbial Participles",
      notes: "1st aor: σαντ / σαμενο / θεντ; 2nd aor: ντ / ομενο / εντ",
      items: [
        {
          family: "Aorist participles",
          lemma: "λύσας / λυσάμενος / λυθείς",
          gloss: "having loosed / having loosed (mid) / having been loosed",
          questions: [
            { form: "λύσας", answer: "1st aorist active participle, nom. sg. masc.", prompt: "Parse.",
              choices: ["1st aorist active participle, nom. sg. masc.", "1st aorist active indicative, 2nd singular", "present active participle, nom. sg. masc.", "perfect active participle, nom. sg. masc."] },
            { form: "λυσάμενος", answer: "1st aorist middle participle, nom. sg. masc.", prompt: "Parse.",
              choices: ["1st aorist middle participle, nom. sg. masc.", "1st aorist passive participle, nom. sg. masc.", "present middle participle, nom. sg. masc.", "perfect middle participle, nom. sg. masc."] },
            { form: "λυθείς", answer: "1st aorist passive participle, nom. sg. masc.", prompt: "Parse.",
              choices: ["1st aorist passive participle, nom. sg. masc.", "1st aorist active participle, nom. sg. masc.", "present passive participle, nom. sg. masc.", "perfect passive participle, nom. sg. masc."] },
            { form: "λιπών", answer: "2nd aorist active participle, nom. sg. masc.", prompt: "Parse.",
              choices: ["2nd aorist active participle, nom. sg. masc.", "present active participle, nom. sg. masc.", "1st aorist active participle, nom. sg. masc.", "future active participle, nom. sg. masc."] },
            { form: "γραφείς", answer: "2nd aorist passive participle, nom. sg. masc.", prompt: "Parse.",
              choices: ["2nd aorist passive participle, nom. sg. masc.", "1st aorist passive participle, nom. sg. masc.", "present passive participle, nom. sg. masc.", "perfect passive participle, nom. sg. masc."] }
          ]
        }
      ]
    },

    "29": {
      label: "Chapter 29 — Adjectival Participles",
      notes: "Articular participle: 'the one who …'",
      items: [
        {
          family: "Adjectival vs adverbial",
          lemma: "ὁ + participle",
          gloss: "substantival or attributive",
          questions: [
            { form: "ὁ πιστεύων",
              prompt: "Translate (substantival).",
              answer: "the one who believes / the believer",
              choices: [
                "the one who believes / the believer",
                "while believing",
                "having believed",
                "in order to believe"
              ] },
            { form: "ὁ ἄνθρωπος ὁ πιστεύων",
              prompt: "Translate (attributive).",
              answer: "the man who believes",
              choices: ["the man who believes", "while the man believes", "the man, after believing", "let the man believe"] },
            { form: "ἄνθρωπος πιστεύων",
              prompt: "Translate (no article — likely adverbial).",
              answer: "a man, while believing, …",
              choices: ["a man, while believing, …", "the man who believes", "after the man believes", "in order that a man may believe"] }
          ]
        }
      ]
    },

    "30": {
      label: "Chapter 30 — Perfect Participles & Genitive Absolute",
      notes: "Active morpheme οτ; mid/pas μενο/η; reduplication retained",
      items: [
        {
          family: "Perfect participles",
          lemma: "λελυκώς / λελυμένος",
          gloss: "having loosed / having been loosed",
          questions: [
            { form: "λελυκώς", answer: "perfect active participle, nom. sg. masc.", prompt: "Parse.",
              choices: ["perfect active participle, nom. sg. masc.", "perfect active indicative, 3rd singular", "1st aorist active participle, nom. sg. masc.", "present active participle, nom. sg. masc."] },
            { form: "λελυμένος", answer: "perfect mid/pas participle, nom. sg. masc.", prompt: "Parse.",
              choices: ["perfect mid/pas participle, nom. sg. masc.", "perfect active participle, nom. sg. masc.", "1st aorist mid/pas participle, nom. sg. masc.", "present mid/pas participle, nom. sg. masc."] },
            { form: "Perfect-active morpheme",
              prompt: "Mounce's perfect-active participle morpheme?",
              answer: "οτ",
              choices: ["οτ", "ντ", "μενο/η", "κα"] }
          ]
        },
        {
          family: "Genitive absolute",
          lemma: "genitive absolute construction",
          gloss: "circumstantial genitive participle",
          questions: [
            { form: "Genitive absolute",
              prompt: "What signals a genitive absolute?",
              answer: "a noun (subject of the participle) and the participle, both in the genitive, syntactically separate from the main clause",
              choices: [
                "a noun (subject of the participle) and the participle, both in the genitive, syntactically separate from the main clause",
                "any participle in the genitive case",
                "two genitives in agreement with the same noun",
                "the article ὁ in the genitive"
              ],
              note: "E.g., εἰσελθόντος αὐτοῦ — 'when he had entered…' — subject of ptc. ≠ subject of main verb." }
          ]
        }
      ]
    },

    "31": {
      label: "Chapter 31 — Subjunctive",
      notes: "Long-vowel thematic (ω/η); contingency, purpose, prohibitions",
      items: [
        {
          family: "Subjunctive forms",
          lemma: "λύω (subj.)",
          gloss: "ω / ῃς / ῃ / ωμεν / ητε / ωσι",
          questions: [
            { form: "λύῃ",
              prompt: "Identify all possible parsings.",
              answer: "(1) present active subjunctive 3sg, (2) present mid/pas indicative 2sg, or present mid/pas subjunctive 2sg",
              choices: [
                "(1) present active subjunctive 3sg, (2) present mid/pas indicative 2sg, or present mid/pas subjunctive 2sg",
                "only present active subjunctive 3sg",
                "only present mid/pas indicative 2sg",
                "only future active 3sg"
              ],
              note: "λύῃ is famously ambiguous; context disambiguates." },
            { form: "λύσωμεν", answer: "1st aorist active subjunctive, 1st plural", prompt: "Parse.",
              choices: ["1st aorist active subjunctive, 1st plural", "1st aorist active indicative, 1st plural", "future active 1st plural", "present active 1st plural"] },
            { form: "Subjunctive recognition",
              prompt: "Quickest formal clue that a verb is subjunctive?",
              answer: "lengthened thematic vowel (ω or η) where you'd expect ο/ε",
              choices: [
                "lengthened thematic vowel (ω or η) where you'd expect ο/ε",
                "an iota subscript in the verb",
                "the prefix εἰ-",
                "reduplication"
              ] },
            { form: "ἵνα",
              prompt: "What construction does ἵνα typically introduce?",
              answer: "a purpose clause with the subjunctive",
              choices: [
                "a purpose clause with the subjunctive",
                "an indicative result clause",
                "a relative clause",
                "a participial phrase"
              ] }
          ]
        }
      ]
    },

    "32": {
      label: "Chapter 32 — Infinitive",
      notes: "Endings table; five uses (substantive, complementary, articular w/ prep, purpose, result)",
      items: [
        {
          family: "Infinitive endings",
          lemma: "λύειν / λῦσαι / λυθῆναι",
          gloss: "active / aor act / aor pas / perfect",
          questions: [
            { form: "λύειν", answer: "present active infinitive", prompt: "Parse.",
              choices: ["present active infinitive", "present mid/pas infinitive", "1st aorist active infinitive", "perfect active infinitive"] },
            { form: "λῦσαι", answer: "1st aorist active infinitive", prompt: "Parse.",
              choices: ["1st aorist active infinitive", "1st aorist middle infinitive", "present active infinitive", "perfect active infinitive"] },
            { form: "λυθῆναι", answer: "1st aorist passive infinitive", prompt: "Parse.",
              choices: ["1st aorist passive infinitive", "1st aorist active infinitive", "present passive infinitive", "perfect passive infinitive"] },
            { form: "λελυκέναι", answer: "perfect active infinitive", prompt: "Parse.",
              choices: ["perfect active infinitive", "1st aorist active infinitive", "present active infinitive", "perfect mid/pas infinitive"] }
          ]
        },
        {
          family: "Five uses of the infinitive",
          lemma: "Mounce §32.9–13",
          gloss: "substantive, complementary, articular w/ prep, purpose, result",
          questions: [
            { form: "διὰ τὸ + inf.",
              prompt: "Articular infinitive with διά means …",
              answer: "because",
              choices: ["because", "in order that", "while / when", "after"] },
            { form: "εἰς τὸ + inf.",
              prompt: "Articular infinitive with εἰς means …",
              answer: "in order that / so as to (purpose or result)",
              choices: ["in order that / so as to (purpose or result)", "because", "while / when", "after"] },
            { form: "ἐν τῷ + inf.",
              prompt: "Articular infinitive with ἐν means …",
              answer: "while / when",
              choices: ["while / when", "in order that", "because", "before"] },
            { form: "μετὰ τό + inf.",
              prompt: "Articular infinitive with μετά means …",
              answer: "after",
              choices: ["after", "before", "while", "because"] },
            { form: "πρὸ τοῦ + inf.",
              prompt: "Articular infinitive with πρό means …",
              answer: "before",
              choices: ["before", "after", "while", "because"] },
            { form: "Complementary inf.",
              prompt: "What is a 'complementary' infinitive?",
              answer: "an infinitive completing the meaning of a finite verb (e.g., θέλω + inf., 'I want to …')",
              choices: [
                "an infinitive completing the meaning of a finite verb (e.g., θέλω + inf., 'I want to …')",
                "an infinitive standing alone as the subject of a sentence",
                "an articular infinitive expressing purpose",
                "an infinitive translating an English participle"
              ] }
          ]
        }
      ]
    },

    "33": {
      label: "Chapter 33 — Imperative",
      notes: "Active/aor pas: -, τω, τε, τωσαν; mid/pas: ν, σθω, σθε, σθωσαν",
      items: [
        {
          family: "Imperative endings",
          lemma: "λῦε / λυσάτω / λύσατε / λύου",
          gloss: "command forms",
          questions: [
            { form: "λῦε", answer: "present active imperative, 2nd singular", prompt: "Parse.",
              choices: ["present active imperative, 2nd singular", "present active indicative, 3rd singular", "present active subjunctive, 2nd singular", "1st aorist active imperative, 2nd singular"] },
            { form: "λύσον", answer: "1st aorist active imperative, 2nd singular", prompt: "Parse.",
              choices: ["1st aorist active imperative, 2nd singular", "future active indicative, 2nd singular", "1st aorist active indicative, 1st singular", "present active imperative, 2nd singular"] },
            { form: "λυέτω", answer: "present active imperative, 3rd singular ('let him loose')", prompt: "Parse.",
              choices: ["present active imperative, 3rd singular ('let him loose')", "present active indicative, 3rd singular", "present active subjunctive, 3rd singular", "1st aorist active imperative, 3rd singular"] },
            { form: "λύεσθε", answer: "present mid/pas imperative or indicative, 2nd plural", prompt: "Parse.",
              choices: ["present mid/pas imperative or indicative, 2nd plural", "present active imperative, 2nd plural", "present mid/pas indicative, 1st plural", "imperfect mid/pas, 2nd plural"],
              note: "Without context, this form is ambiguous between imperative and indicative." },
            { form: "Aspect choice",
              prompt: "Aspect difference between present and aorist imperatives?",
              answer: "present = ongoing or repeated action; aorist = single, undefined action",
              choices: [
                "present = ongoing or repeated action; aorist = single, undefined action",
                "present = polite, aorist = strong",
                "present = future time, aorist = past time",
                "no difference, just style"
              ] }
          ]
        }
      ]
    },

    "34": {
      label: "Chapter 34 — Indicative of δίδωμι",
      notes: "Five Rules of mi Verbs (§34.6–10)",
      items: [
        {
          family: "Five Rules of μι Verbs",
          lemma: "δίδωμι",
          gloss: "Mounce overheads §34.6–10",
          questions: [
            { form: "Rule 1",
              prompt: "First rule of μι verbs?",
              answer: "they reduplicate the initial stem letter, separated by an iota",
              choices: [
                "they reduplicate the initial stem letter, separated by an iota",
                "they take the augment ε in the present",
                "they always use κα as tense formative",
                "they have no personal endings"
              ],
              note: "*δο → δι + δο → δίδω-." },
            { form: "Rule 2",
              prompt: "Second rule of μι verbs?",
              answer: "they do not ordinarily use a connecting (thematic) vowel in the indicative",
              choices: [
                "they do not ordinarily use a connecting (thematic) vowel in the indicative",
                "they always use ω as connecting vowel",
                "they always use the σα tense formative",
                "they always use the κα tense formative"
              ] },
            { form: "Rule 3",
              prompt: "Third rule of μι verbs (in the present active)?",
              answer: "they use a different set of personal endings: μι, ς, σι(ν); μεν, τε, ασι(ν)",
              choices: [
                "they use a different set of personal endings: μι, ς, σι(ν); μεν, τε, ασι(ν)",
                "they use the perfect κα endings",
                "they use the imperfect secondary endings",
                "they use the same primary active as λύω"
              ] },
            { form: "Rule 4",
              prompt: "Fourth rule of μι verbs?",
              answer: "the stem vowel can lengthen, shorten, or drop out (ablaut)",
              choices: [
                "the stem vowel can lengthen, shorten, or drop out (ablaut)",
                "they always have a long vowel",
                "they always have a short vowel",
                "they never undergo any vowel change"
              ],
              note: "δίδωμι → δίδομεν: ω shortens to ο in the plural." },
            { form: "Rule 5",
              prompt: "Fifth rule of μι verbs?",
              answer: "most use κα as the tense formative in the aorist active",
              choices: [
                "most use κα as the tense formative in the aorist active",
                "they all have 2nd aorists",
                "they have no aorist forms",
                "the aorist uses θη"
              ],
              note: "ἔδωκα, not *ἔδωσα." }
          ]
        },
        {
          family: "δίδωμι forms",
          lemma: "δίδωμι",
          gloss: "I give",
          questions: [
            { form: "δίδωμι", answer: "present active indicative, 1st singular", prompt: "Parse.",
              choices: ["present active indicative, 1st singular", "present active subjunctive, 1st singular", "1st aorist active 1st singular", "perfect active 1st singular"] },
            { form: "ἔδωκα", answer: "1st aorist active indicative, 1st singular", prompt: "Parse.",
              choices: ["1st aorist active indicative, 1st singular", "perfect active 1st singular", "imperfect active 1st singular", "1st aorist passive 1st singular"] },
            { form: "δίδομεν", answer: "present active indicative, 1st plural", prompt: "Parse (note vowel shift).",
              choices: ["present active indicative, 1st plural", "1st aorist active 1st plural", "imperfect active 1st plural", "perfect active 1st plural"] }
          ]
        }
      ]
    },

    "35": {
      label: "Chapter 35 — Nonindicative δίδωμι; Conditional Sentences",
      notes: "Four classes of conditional sentences",
      items: [
        {
          family: "Conditional sentences",
          lemma: "εἰ / ἐάν",
          gloss: "four classes",
          questions: [
            { form: "1st class",
              prompt: "First-class condition (Mounce)?",
              answer: "εἰ + indicative — assumed true for the sake of argument",
              choices: [
                "εἰ + indicative — assumed true for the sake of argument",
                "ἐάν + subjunctive — uncertain but possible",
                "εἰ + impf./aor. (apod. ἄν) — contrary to fact",
                "εἰ + optative — most uncertain"
              ] },
            { form: "2nd class",
              prompt: "Second-class condition?",
              answer: "εἰ + impf./aor. indicative; apodosis with ἄν — contrary to fact",
              choices: [
                "εἰ + impf./aor. indicative; apodosis with ἄν — contrary to fact",
                "εἰ + indicative — assumed true",
                "ἐάν + subjunctive — possible future",
                "εἰ + optative — most uncertain"
              ] },
            { form: "3rd class",
              prompt: "Third-class condition?",
              answer: "ἐάν + subjunctive — uncertain but probable / future",
              choices: [
                "ἐάν + subjunctive — uncertain but probable / future",
                "εἰ + indicative",
                "εἰ + impf./aor. indicative",
                "εἰ + optative"
              ] },
            { form: "4th class",
              prompt: "Fourth-class condition?",
              answer: "εἰ + optative; apodosis often ἄν + optative — most remote / wish-like",
              choices: [
                "εἰ + optative; apodosis often ἄν + optative — most remote / wish-like",
                "εἰ + future indicative",
                "ἐάν + indicative",
                "εἰ + perfect"
              ],
              note: "Rare in the NT; full 4th-class conditions are essentially absent." }
          ]
        },
        {
          family: "Nonindicative δίδωμι",
          lemma: "δίδωμι nonind.",
          gloss: "subj/imp/inf/ptc",
          questions: [
            { form: "δός", answer: "2nd aorist active imperative, 2nd singular ('give!')", prompt: "Parse.",
              choices: ["2nd aorist active imperative, 2nd singular ('give!')", "1st aorist active imperative, 2nd singular", "present active imperative, 2nd singular", "1st aorist active indicative, 1st singular"] },
            { form: "δοῦναι", answer: "2nd aorist active infinitive ('to give')", prompt: "Parse.",
              choices: ["2nd aorist active infinitive ('to give')", "present active infinitive", "perfect active infinitive", "1st aorist active infinitive"] }
          ]
        }
      ]
    },

    "36": {
      label: "Chapter 36 — ἵστημι, τίθημι, δείκνυμι & Other μι Verbs",
      notes: "Patterns across the four major μι stems",
      items: [
        {
          family: "Other μι verbs",
          lemma: "ἵστημι / τίθημι / δείκνυμι",
          gloss: "stand / put / show",
          questions: [
            { form: "ἵστημι",
              prompt: "Lexical form 'I cause to stand' / (intrans.) 'I stand' — root and reduplication?",
              answer: "root *στα-; reduplicates with rough breathing (ἱ-) since *σι- becomes ἱ-",
              choices: [
                "root *στα-; reduplicates with rough breathing (ἱ-) since *σι- becomes ἱ-",
                "root *ἱστ-; no reduplication",
                "root *στη-; augment is ἐ",
                "root *στα-; reduplication with smooth breathing"
              ] },
            { form: "τίθημι",
              prompt: "τίθημι is from which root?",
              answer: "*θε-",
              choices: ["*θε-", "*τι-", "*θη-", "*ἱστ-"] },
            { form: "δείκνυμι",
              prompt: "δείκνυμι ('I show') uses which conjugational hallmark different from δίδωμι/τίθημι/ἵστημι?",
              answer: "it does not reduplicate — instead the stem ends in -νυ-",
              choices: [
                "it does not reduplicate — instead the stem ends in -νυ-",
                "it adds reduplication of κ",
                "it uses θη as its present formative",
                "it always has the augment ε"
              ] },
            { form: "ἀφίημι",
              prompt: "ἀφίημι ('I let go / forgive') is built from which root?",
              answer: "ἀπό + ἵημι (root *ε/ἑ-)",
              choices: [
                "ἀπό + ἵημι (root *ε/ἑ-)",
                "ἀπό + ἵστημι",
                "ἀπό + τίθημι",
                "ἀπό + δίδωμι"
              ] }
          ]
        }
      ]
    }

  };

  // ───────────────────────────────────────────────────────────────────
  //  WEEK_GRAMMAR — empty in the Mounce variant. Kept for compatibility
  //  with the merge step; supplemental sets register through the
  //  registerSupplementalGrammarSets bridge below.
  // ───────────────────────────────────────────────────────────────────
  const WEEK_GRAMMAR = {};

  // ───────────────────────────────────────────────────────────────────
  //  MERGE → single GRAMMAR_SETS keyed by chapter or W-key
  // ───────────────────────────────────────────────────────────────────
  const GRAMMAR_SETS = {};
  Object.entries(CHAPTER_GRAMMAR).forEach(([key, set]) => { GRAMMAR_SETS[key] = set; });
  Object.entries(WEEK_GRAMMAR).forEach(([key, set]) => { GRAMMAR_SETS[key] = set; });

  function notifyGrammarDataChanged() {
    if (typeof window.dispatchEvent !== 'function' || typeof window.CustomEvent !== 'function') return;
    window.dispatchEvent(new window.CustomEvent('greekSupplementalDataChanged', {
      detail: { kind: 'grammar' }
    }));
  }

  function registerSupplementalGrammarSets(sets, options = {}) {
    if (!sets || typeof sets !== 'object') return;

    Object.entries(sets).forEach(([key, set]) => {
      if (!key || !set) return;
      const rawKey = String(key);
      GRAMMAR_SETS[rawKey] = set;

      if (window.SETS && typeof window.SETS === 'object') {
        window.SETS[rawKey] = {
          ...(window.SETS[rawKey] || {}),
          label: set.label || window.SETS[rawKey]?.label || rawKey,
          type: window.SETS[rawKey]?.type || 'other',
          week: window.SETS[rawKey]?.week ?? null,
          cards: Array.isArray(window.SETS[rawKey]?.cards) ? window.SETS[rawKey].cards : []
        };
      }
    });

    if (!options.silent) notifyGrammarDataChanged();
  }

  if (window.SUPPLEMENTAL_GRAMMAR_SETS && typeof window.SUPPLEMENTAL_GRAMMAR_SETS === 'object') {
    registerSupplementalGrammarSets(window.SUPPLEMENTAL_GRAMMAR_SETS, { silent: true });
  }

  // ───────────────────────────────────────────────────────────────────
  //  HELPERS
  // ───────────────────────────────────────────────────────────────────
  function localShuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function stableGrammarKey(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .toLowerCase()
      .replace(/^-+|-+$/g, '');
  }

  // ───────────────────────────────────────────────────────────────────
  //  PUBLIC BUILDERS
  // ───────────────────────────────────────────────────────────────────
  function parseParadigmKey(key) {
    const match = String(key).match(/^(.+)::(grammar|morph)::(\d+)$/);
    if (!match) return { baseKey: String(key), type: null, itemIdx: null };
    return { baseKey: match[1], type: match[2], itemIdx: Number(match[3]) };
  }

  // Reversibility heuristics — a question can be flipped into "pick the
  // Greek form for this English description" when the displayed form is
  // a Greek string, every choice is non-Greek (parse-style English), and
  // the prompt is a recognition / parsing question.
  const GREEK_RANGE = /[Ͱ-Ͽἀ-῿]/;
  const RECOGNITION_PROMPT = /^\s*(parse|identify|which letter|which letter-form|what tense|what mood|what case|what voice|what (kind of )?form|what is this form|name (this|the))/i;
  function containsGreek(text) {
    return GREEK_RANGE.test(String(text || ''));
  }
  function isReversibleQuestion(q) {
    if (!q || !q.form || !q.answer) return false;
    if (!containsGreek(q.form)) return false;
    if (containsGreek(q.answer)) return false;
    const choices = Array.isArray(q.choices) ? q.choices : [];
    if (choices.some(containsGreek)) return false;
    return RECOGNITION_PROMPT.test(String(q.prompt || ''));
  }

  function buildGrammarCardsForKeys(keys) {
    const selected = (keys || []).map(String);
    const cards = [];

    const allReversibleForms = [];
    selected.forEach((key) => {
      const selection = parseParadigmKey(key);
      if (selection.type && selection.type !== 'grammar') return;
      const set = GRAMMAR_SETS[selection.baseKey];
      if (!set) return;
      const items = Number.isInteger(selection.itemIdx) ? [set.items[selection.itemIdx]] : set.items;
      items.forEach((item) => {
        if (!item || !Array.isArray(item.questions)) return;
        item.questions.forEach((q) => {
          if (isReversibleQuestion(q)) allReversibleForms.push(q.form);
        });
      });
    });

    selected.forEach((key) => {
      const selection = parseParadigmKey(key);
      if (selection.type && selection.type !== 'grammar') return;
      const set = GRAMMAR_SETS[selection.baseKey];
      if (!set) return;

      const chapterNum = /^\d+$/.test(selection.baseKey) ? Number(selection.baseKey) : 0;
      const items = Number.isInteger(selection.itemIdx) ? [set.items[selection.itemIdx]] : set.items;

      items.forEach((item, relativeItemIdx) => {
        if (!item) return;
        const itemIdx = Number.isInteger(selection.itemIdx) ? selection.itemIdx : relativeItemIdx;
        const itemReversibleForms = item.questions
          .filter(isReversibleQuestion)
          .map((q) => q.form);
        const formToAnswer = {};
        item.questions.forEach((q) => {
          if (q && q.form && q.answer) formToAnswer[q.form] = q.answer;
        });
        item.questions.forEach((q, qIdx) => {
          const rawChoices = Array.isArray(q.choices) ? q.choices : [];
          const choices = localShuffle(Array.from(new Set([q.answer, ...rawChoices])));

          const reversible = isReversibleQuestion(q);
          let reverseChoices = null;
          if (reversible) {
            const distractors = pickReverseDistractors(q.form, itemReversibleForms, allReversibleForms);
            reverseChoices = localShuffle([q.form, ...distractors]);
          }

          cards.push({
            id: `grammar-${selection.baseKey}-${itemIdx}-${qIdx}-${stableGrammarKey(item.lemma)}-${stableGrammarKey(q.form)}-${stableGrammarKey(q.prompt || 'parse')}-${stableGrammarKey(q.answer)}`,
            kind: 'morph',
            required: true,
            sourceKey: String(selection.baseKey),
            sourceLabel: set.label,
            supplemental: !!set.supplemental,
            chapter: chapterNum,
            family: item.family,
            lemma: item.lemma,
            gloss: item.gloss,
            form: q.form,
            prompt: q.prompt || 'Choose the best answer.',
            context: q.context || '',
            note: q.note || '',
            rationale: q.rationale || '',
            explanations: q.explanations || null,
            answer: q.answer,
            choices,
            reversible,
            reversePrompt: reversible ? 'Choose the correct Greek form.' : '',
            reverseChoices,
            formToAnswer
          });
        });
      });
    });

    return cards;
  }

  function pickReverseDistractors(correctForm, preferredPool, fallbackPool) {
    const distractors = [];
    const seen = new Set([correctForm]);
    const pushFrom = (pool) => {
      for (const item of localShuffle(pool)) {
        if (!item || seen.has(item)) continue;
        seen.add(item);
        distractors.push(item);
        if (distractors.length >= 3) break;
      }
    };
    pushFrom(preferredPool);
    if (distractors.length < 3) pushFrom(fallbackPool);
    return distractors.slice(0, 3);
  }

  function getGrammarCountForKey(key) {
    const set = GRAMMAR_SETS[String(key)];
    if (!set) return 0;
    return set.items.reduce((sum, item) => sum + item.questions.length, 0);
  }

  // ───────────────────────────────────────────────────────────────────
  //  EXPORTS
  // ───────────────────────────────────────────────────────────────────
  window.GRAMMAR_SETS = GRAMMAR_SETS;
  window.registerSupplementalGrammarSets = registerSupplementalGrammarSets;
  window.buildGrammarCardsForKeys = buildGrammarCardsForKeys;
  window.getGrammarCountForKey = getGrammarCountForKey;

})();
