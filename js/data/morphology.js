// ═══════════════════════════════════════════════════════════════════════
//  MOUNCE MORPHOLOGY DATA — paradigms in BBG3 chapter order
// ═══════════════════════════════════════════════════════════════════════
//
//  Paradigms are keyed by the chapter in which Mounce introduces them
//  (per the overheads in mounce_overheads.pdf). Multiple-choice parsing
//  questions are auto-generated from the chapter's full paradigm so
//  every cell of every paradigm contributes a card.
//
//  Schema (per chapter):
//      "<n>": {
//        label, notes,
//        items: [
//          { family, lemma, gloss, questions: [
//              { form, answer, [context], [note] }
//          ]}
//        ]
//      }
// ═══════════════════════════════════════════════════════════════════════

(function () {
  const MORPHOLOGY_SETS = {

    "6": {
      label: "Chapter 6 Morphology",
      notes: "Nominative & accusative endings + 1st/2nd decl preview",
      items: [
        {
          family: "2nd declension masculine — λόγος (nom/acc only)",
          lemma: "λόγος",
          gloss: "word",
          questions: [
            { form: "λόγος", answer: "nominative singular masculine" },
            { form: "λόγον", answer: "accusative singular masculine" },
            { form: "λόγοι", answer: "nominative plural masculine" },
            { form: "λόγους", answer: "accusative plural masculine" }
          ]
        },
        {
          family: "1st declension feminine (η) — γραφή",
          lemma: "γραφή",
          gloss: "writing, scripture",
          questions: [
            { form: "γραφή", answer: "nominative singular feminine" },
            { form: "γραφήν", answer: "accusative singular feminine" },
            { form: "γραφαί", answer: "nominative plural feminine" },
            { form: "γραφάς", answer: "accusative plural feminine" }
          ]
        },
        {
          family: "1st declension feminine (α) — ὥρα",
          lemma: "ὥρα",
          gloss: "hour",
          questions: [
            { form: "ὥρα", answer: "nominative singular feminine" },
            { form: "ὥραν", answer: "accusative singular feminine" },
            { form: "ὧραι", answer: "nominative plural feminine" },
            { form: "ὥρας", answer: "accusative plural feminine or genitive singular feminine",
              note: "α-pattern syncretism: -ας is gen sg AND acc pl." }
          ]
        },
        {
          family: "2nd declension neuter — ἔργον (Rules 2 & 3)",
          lemma: "ἔργον",
          gloss: "work, deed",
          questions: [
            { form: "ἔργον", answer: "nominative or accusative singular neuter",
              note: "Rule 2: neuter nom = neuter acc." },
            { form: "ἔργα", answer: "nominative or accusative plural neuter",
              note: "Rule 3: neuter nom/acc plural = α." }
          ]
        },
        {
          // Ch 6's title is "Nominative & Accusative; Article" — the article's
          // nom/acc is introduced here alongside the nouns (its gen/dat comes in
          // Ch 7 with the full paradigm below). Same lemma as the Ch-7 article,
          // so the per-form dedup collapses the overlap once both are in scope.
          family: "Definite article ὁ, ἡ, τό (nom/acc only)",
          lemma: "ὁ, ἡ, τό",
          gloss: "the",
          questions: [
            { form: "ὁ", answer: "nominative singular masculine" },
            { form: "τόν", answer: "accusative singular masculine" },
            { form: "οἱ", answer: "nominative plural masculine" },
            { form: "τούς", answer: "accusative plural masculine" },
            { form: "ἡ", answer: "nominative singular feminine" },
            { form: "τήν", answer: "accusative singular feminine" },
            { form: "αἱ", answer: "nominative plural feminine" },
            { form: "τάς", answer: "accusative plural feminine" },
            { form: "τό", answer: "nominative or accusative singular neuter" },
            { form: "τά", answer: "nominative or accusative plural neuter" }
          ]
        }
      ]
    },

    "7": {
      label: "Chapter 7 Morphology",
      notes: "Definite article (full paradigm) + 1st/2nd declension full",
      items: [
        {
          family: "Definite article ὁ, ἡ, τό",
          lemma: "ὁ, ἡ, τό",
          gloss: "the",
          questions: [
            { form: "ὁ", answer: "nominative singular masculine" },
            { form: "τοῦ", answer: "genitive singular masculine/neuter" },
            { form: "τῷ", answer: "dative singular masculine/neuter" },
            { form: "τόν", answer: "accusative singular masculine" },
            { form: "οἱ", answer: "nominative plural masculine" },
            { form: "τῶν", answer: "genitive plural (all genders)" },
            { form: "τοῖς", answer: "dative plural masculine/neuter" },
            { form: "τούς", answer: "accusative plural masculine" },
            { form: "ἡ", answer: "nominative singular feminine" },
            { form: "τῆς", answer: "genitive singular feminine" },
            { form: "τῇ", answer: "dative singular feminine" },
            { form: "τήν", answer: "accusative singular feminine" },
            { form: "αἱ", answer: "nominative plural feminine" },
            { form: "ταῖς", answer: "dative plural feminine" },
            { form: "τάς", answer: "accusative plural feminine" },
            { form: "τό", answer: "nominative or accusative singular neuter" },
            { form: "τά", answer: "nominative or accusative plural neuter" }
          ]
        },
        {
          family: "λόγος — full 2nd declension masculine",
          lemma: "λόγος",
          gloss: "word",
          questions: [
            { form: "λόγος", answer: "nominative singular masculine" },
            { form: "λόγου", answer: "genitive singular masculine" },
            { form: "λόγῳ", answer: "dative singular masculine" },
            { form: "λόγον", answer: "accusative singular masculine" },
            { form: "λόγοι", answer: "nominative plural masculine" },
            { form: "λόγων", answer: "genitive plural masculine" },
            { form: "λόγοις", answer: "dative plural masculine" },
            { form: "λόγους", answer: "accusative plural masculine" },
            { form: "λόγε", answer: "vocative singular masculine",
              note: "2nd-decl masc. vocative sg ends in ‑ε — the one case distinct from the nominative (voc. pl. = nom. pl. λόγοι)." }
          ]
        },
        {
          family: "γραφή — full 1st declension feminine (η-pattern)",
          lemma: "γραφή",
          gloss: "writing, scripture",
          questions: [
            { form: "γραφή", answer: "nominative singular feminine" },
            { form: "γραφῆς", answer: "genitive singular feminine" },
            { form: "γραφῇ", answer: "dative singular feminine" },
            { form: "γραφήν", answer: "accusative singular feminine" },
            { form: "γραφαί", answer: "nominative plural feminine" },
            { form: "γραφῶν", answer: "genitive plural feminine" },
            { form: "γραφαῖς", answer: "dative plural feminine" },
            { form: "γραφάς", answer: "accusative plural feminine" }
          ]
        },
        {
          family: "ἔργον — full 2nd declension neuter",
          lemma: "ἔργον",
          gloss: "work, deed",
          questions: [
            { form: "ἔργον", answer: "nominative or accusative singular neuter" },
            { form: "ἔργου", answer: "genitive singular neuter" },
            { form: "ἔργῳ", answer: "dative singular neuter" },
            { form: "ἔργα", answer: "nominative or accusative plural neuter" },
            { form: "ἔργων", answer: "genitive plural neuter" },
            { form: "ἔργοις", answer: "dative plural neuter" }
          ]
        }
      ]
    },

    "8": {
      label: "Chapter 8 Morphology",
      notes: "εἰμί — present indicative (the verb 'to be')",
      items: [
        {
          // εἰμί's present indicative is introduced in Ch 8 — the most common
          // verb in the NT. Drilled as a core paradigm so it's discoverable +
          // parseable from Ch 8 on (its other moods — subjunctive/optative/
          // imperative — and its future ἔσομαι come later, in their chapters).
          family: "Present indicative — εἰμί (\"I am\")",
          lemma: "εἰμί",
          gloss: "I am",
          questions: [
            { form: "εἰμί", answer: "1st singular present active",
              note: "Enclitic except the 2sg εἶ; parsed 'active' though εἰμί has no voice contrast." },
            { form: "εἶ", answer: "2nd singular present active" },
            { form: "ἐστί(ν)", answer: "3rd singular present active",
              note: "Takes the movable ν: ἐστίν before a vowel or at a pause." },
            { form: "ἐσμέν", answer: "1st plural present active" },
            { form: "ἐστέ", answer: "2nd plural present active" },
            { form: "εἰσί(ν)", answer: "3rd plural present active" }
          ]
        }
      ]
    },

    "9": {
      label: "Chapter 9 Morphology",
      notes: "2-1-2 adjective paradigm (ἀγαθός)",
      items: [
        {
          family: "ἀγαθός — 2-1-2 adjective",
          lemma: "ἀγαθός, -ή, -όν",
          gloss: "good",
          questions: [
            { form: "ἀγαθός", answer: "nominative singular masculine" },
            { form: "ἀγαθοῦ", answer: "genitive singular masculine/neuter" },
            { form: "ἀγαθῷ", answer: "dative singular masculine/neuter" },
            { form: "ἀγαθόν", answer: "accusative singular masculine or nom/acc singular neuter" },
            { form: "ἀγαθοί", answer: "nominative plural masculine" },
            { form: "ἀγαθῶν", answer: "genitive plural (all genders)" },
            { form: "ἀγαθοῖς", answer: "dative plural masculine/neuter" },
            { form: "ἀγαθούς", answer: "accusative plural masculine" },
            { form: "ἀγαθή", answer: "nominative singular feminine" },
            { form: "ἀγαθῆς", answer: "genitive singular feminine" },
            { form: "ἀγαθῇ", answer: "dative singular feminine" },
            { form: "ἀγαθήν", answer: "accusative singular feminine" },
            { form: "ἀγαθαί", answer: "nominative plural feminine" },
            { form: "ἀγαθαῖς", answer: "dative plural feminine" },
            { form: "ἀγαθάς", answer: "accusative plural feminine" },
            { form: "ἀγαθά", answer: "nominative or accusative plural neuter" },
            { form: "ἀγαθέ", answer: "vocative singular masculine",
              note: "2-1-2 adjectives take a distinct masc. vocative sg in ‑ε (ἀγαθέ), like 2nd-decl masc. nouns (λόγε)." }
          ]
        }
      ]
    },

    "10": {
      label: "Chapter 10 Morphology",
      notes: "3rd declension — σάρξ paradigm",
      items: [
        {
          family: "σάρξ — 3rd declension feminine (velar stem σαρκ-)",
          lemma: "σάρξ, σαρκός",
          gloss: "flesh, body",
          questions: [
            { form: "σάρξ", answer: "nominative singular feminine",
              note: "Square of Stops (Rule 7): σαρκ + ς → σαρξ." },
            { form: "σαρκός", answer: "genitive singular feminine" },
            { form: "σαρκί", answer: "dative singular feminine" },
            { form: "σάρκα", answer: "accusative singular feminine" },
            { form: "σάρκες", answer: "nominative plural feminine" },
            { form: "σαρκῶν", answer: "genitive plural feminine" },
            { form: "σαρξί(ν)", answer: "dative plural feminine",
              note: "Square of Stops again: σαρκ + σι → σαρξι." },
            { form: "σάρκας", answer: "accusative plural feminine" }
          ]
        },
        {
          family: "πνεῦμα — 3rd declension neuter (dental stem πνευματ-)",
          lemma: "πνεῦμα, πνεύματος",
          gloss: "spirit",
          questions: [
            { form: "πνεῦμα", answer: "nominative or accusative singular neuter",
              note: "Rule 8: τ drops at end of word; Rule 2: neuter nom = acc." },
            { form: "πνεύματος", answer: "genitive singular neuter" },
            { form: "πνεύματι", answer: "dative singular neuter" },
            { form: "πνεύματα", answer: "nominative or accusative plural neuter" },
            { form: "πνευμάτων", answer: "genitive plural neuter" },
            { form: "πνεύμασι(ν)", answer: "dative plural neuter",
              note: "Square of Stops: τ + σι → σι (dental drops)." }
          ]
        }
      ]
    },

    "11": {
      label: "Chapter 11 Morphology",
      notes: "1st & 2nd person personal pronouns",
      items: [
        {
          family: "ἐγώ — first-person pronoun",
          lemma: "ἐγώ",
          gloss: "I / we",
          questions: [
            { form: "ἐγώ", answer: "nominative singular ('I')" },
            { form: "ἐμοῦ / μου", answer: "genitive singular ('my')" },
            { form: "ἐμοί / μοι", answer: "dative singular ('to me')" },
            { form: "ἐμέ / με", answer: "accusative singular ('me')" },
            { form: "ἡμεῖς", answer: "nominative plural ('we')" },
            { form: "ἡμῶν", answer: "genitive plural ('our')" },
            { form: "ἡμῖν", answer: "dative plural ('to us')" },
            { form: "ἡμᾶς", answer: "accusative plural ('us')" }
          ]
        },
        {
          family: "σύ — second-person pronoun",
          lemma: "σύ",
          gloss: "you (sg./pl.)",
          questions: [
            { form: "σύ", answer: "nominative singular ('you')" },
            { form: "σοῦ / σου", answer: "genitive singular ('your')" },
            { form: "σοί / σοι", answer: "dative singular ('to you')" },
            { form: "σέ / σε", answer: "accusative singular ('you')" },
            { form: "ὑμεῖς", answer: "nominative plural ('you all')" },
            { form: "ὑμῶν", answer: "genitive plural ('your', pl.)" },
            { form: "ὑμῖν", answer: "dative plural ('to you all')" },
            { form: "ὑμᾶς", answer: "accusative plural ('you all')" }
          ]
        }
      ]
    },

    "12": {
      label: "Chapter 12 Morphology",
      notes: "αὐτός as 3rd-person pronoun (full paradigm)",
      items: [
        {
          family: "αὐτός, -ή, -ό",
          lemma: "αὐτός",
          gloss: "he/she/it; -self; same",
          questions: [
            { form: "αὐτός", answer: "nominative singular masculine" },
            { form: "αὐτοῦ", answer: "genitive singular masculine/neuter" },
            { form: "αὐτῷ", answer: "dative singular masculine/neuter" },
            { form: "αὐτόν", answer: "accusative singular masculine" },
            { form: "αὐτοί", answer: "nominative plural masculine" },
            { form: "αὐτῶν", answer: "genitive plural (all genders)" },
            { form: "αὐτοῖς", answer: "dative plural masculine/neuter" },
            { form: "αὐτούς", answer: "accusative plural masculine" },
            { form: "αὐτή", answer: "nominative singular feminine" },
            { form: "αὐτῆς", answer: "genitive singular feminine" },
            { form: "αὐτῇ", answer: "dative singular feminine" },
            { form: "αὐτήν", answer: "accusative singular feminine" },
            { form: "αὐταί", answer: "nominative plural feminine" },
            { form: "αὐταῖς", answer: "dative plural feminine" },
            { form: "αὐτάς", answer: "accusative plural feminine" },
            { form: "αὐτό", answer: "nominative or accusative singular neuter" },
            { form: "αὐτά", answer: "nominative or accusative plural neuter" }
          ]
        }
      ]
    },

    "13": {
      label: "Chapter 13 Morphology",
      notes: "Demonstratives οὗτος and ἐκεῖνος",
      items: [
        {
          family: "οὗτος — 'this'",
          lemma: "οὗτος, αὕτη, τοῦτο",
          gloss: "this; he/she/it",
          questions: [
            { form: "οὗτος", answer: "nominative singular masculine" },
            { form: "τούτου", answer: "genitive singular masculine/neuter" },
            { form: "τούτῳ", answer: "dative singular masculine/neuter" },
            { form: "τοῦτον", answer: "accusative singular masculine" },
            { form: "οὗτοι", answer: "nominative plural masculine" },
            { form: "τούτων", answer: "genitive plural (all genders)" },
            { form: "τούτοις", answer: "dative plural masculine/neuter" },
            { form: "τούτους", answer: "accusative plural masculine" },
            { form: "αὕτη", answer: "nominative singular feminine" },
            { form: "ταύτης", answer: "genitive singular feminine" },
            { form: "ταύτην", answer: "accusative singular feminine" },
            { form: "αὗται", answer: "nominative plural feminine" },
            { form: "τοῦτο", answer: "nominative or accusative singular neuter" },
            { form: "ταῦτα", answer: "nominative or accusative plural neuter" }
          ]
        },
        {
          family: "ἐκεῖνος — 'that'",
          lemma: "ἐκεῖνος, -η, -ο",
          gloss: "that; he/she/it (far)",
          questions: [
            { form: "ἐκεῖνος", answer: "nominative singular masculine" },
            { form: "ἐκείνου", answer: "genitive singular masculine/neuter" },
            { form: "ἐκείνῳ", answer: "dative singular masculine/neuter" },
            { form: "ἐκεῖνον", answer: "accusative singular masculine" },
            { form: "ἐκεῖνοι", answer: "nominative plural masculine" },
            { form: "ἐκείνων", answer: "genitive plural (all genders)" },
            { form: "ἐκείνοις", answer: "dative plural masculine/neuter" },
            { form: "ἐκείνους", answer: "accusative plural masculine" },
            { form: "ἐκείνη", answer: "nominative singular feminine" },
            { form: "ἐκείνης", answer: "genitive singular feminine" },
            { form: "ἐκείνην", answer: "accusative singular feminine" },
            { form: "ἐκεῖναι", answer: "nominative plural feminine" },
            { form: "ἐκείνας", answer: "accusative plural feminine" },
            { form: "ἐκεῖνο", answer: "nominative or accusative singular neuter" },
            { form: "ἐκεῖνα", answer: "nominative or accusative plural neuter" }
          ]
        }
      ]
    },

    "14": {
      label: "Chapter 14 Morphology",
      notes: "Relative pronoun ὅς, ἥ, ὅ",
      items: [
        {
          family: "Relative pronoun ὅς",
          lemma: "ὅς, ἥ, ὅ",
          gloss: "who / which / that",
          questions: [
            { form: "ὅς", answer: "nominative singular masculine" },
            { form: "οὗ", answer: "genitive singular masculine/neuter" },
            { form: "ᾧ", answer: "dative singular masculine/neuter" },
            { form: "ὅν", answer: "accusative singular masculine" },
            { form: "οἵ", answer: "nominative plural masculine" },
            { form: "ὧν", answer: "genitive plural (all genders)" },
            { form: "οἷς", answer: "dative plural masculine/neuter" },
            { form: "οὕς", answer: "accusative plural masculine" },
            { form: "ἥ", answer: "nominative singular feminine" },
            { form: "ἧς", answer: "genitive singular feminine" },
            { form: "ἥν", answer: "accusative singular feminine" },
            { form: "αἵ", answer: "nominative plural feminine" },
            { form: "ὅ", answer: "nominative or accusative singular neuter" },
            { form: "ἅ", answer: "nominative or accusative plural neuter" }
          ]
        }
      ]
    },

    "16": {
      label: "Chapter 16 Morphology",
      notes: "Present active indicative — λύω",
      items: [
        {
          family: "Present active indicative — λύω",
          lemma: "λύω",
          gloss: "I am loosing",
          questions: [
            { form: "λύω", answer: "1st singular ('I am loosing')" },
            { form: "λύεις", answer: "2nd singular ('you are loosing')" },
            { form: "λύει", answer: "3rd singular ('he/she/it is loosing')" },
            { form: "λύομεν", answer: "1st plural ('we are loosing')" },
            { form: "λύετε", answer: "2nd plural ('you all are loosing')" },
            { form: "λύουσι(ν)", answer: "3rd plural ('they are loosing')" }
          ]
        }
      ]
    },

    "17": {
      label: "Chapter 17 Morphology",
      notes: "Contract verb resolutions (ε / α / ο)",
      items: [
        {
          family: "Present active — ποιέω (ε-contract)",
          lemma: "ποιέω",
          gloss: "I do, make",
          questions: [
            { form: "ποιῶ", answer: "1st singular present active",
              note: "ε + ω → ω (Rule 3)." },
            { form: "ποιεῖς", answer: "2nd singular present active",
              note: "ε + εις → εις (Rule 2 area: εε → ει)." },
            { form: "ποιεῖ", answer: "3rd singular present active" },
            { form: "ποιοῦμεν", answer: "1st plural present active",
              note: "ε + ομεν → ουμεν (Rule 1: εο → ου)." },
            { form: "ποιεῖτε", answer: "2nd plural present active" },
            { form: "ποιοῦσι(ν)", answer: "3rd plural present active" }
          ]
        },
        {
          family: "Present active — ἀγαπάω (α-contract)",
          lemma: "ἀγαπάω",
          gloss: "I love",
          questions: [
            { form: "ἀγαπῶ", answer: "1st singular present active",
              note: "α + ω → ω (Rule 3)." },
            { form: "ἀγαπᾷς", answer: "2nd singular present active" },
            { form: "ἀγαπᾷ", answer: "3rd singular present active" },
            { form: "ἀγαπῶμεν", answer: "1st plural present active" },
            { form: "ἀγαπᾶτε", answer: "2nd plural present active",
              note: "α + ε → α (Rule 4)." },
            { form: "ἀγαπῶσι(ν)", answer: "3rd plural present active" }
          ]
        },
        {
          family: "Present active — πληρόω (ο-contract)",
          lemma: "πληρόω",
          gloss: "I fill, fulfill",
          questions: [
            { form: "πληρῶ", answer: "1st singular present active" },
            { form: "πληροῖς", answer: "2nd singular present active" },
            { form: "πληροῖ", answer: "3rd singular present active" },
            { form: "πληροῦμεν", answer: "1st plural present active",
              note: "ο + ομεν → ουμεν (Rule 1: οο → ου)." },
            { form: "πληροῦτε", answer: "2nd plural present active" },
            { form: "πληροῦσι(ν)", answer: "3rd plural present active" }
          ]
        },
        {
          // ὁράω is a SUPPLETIVE verb: its present is a regular α-contract
          // (ὁρῶ), but its other principal parts come from unrelated roots
          // (fut. ὄψομαι, 2aor. εἶδον, pf. ἑώρακα, aor.pas. ὤφθην). The
          // present is the core citation form here; the suppletive parts are
          // authored as required optional groups in lemma_inventory.js, so
          // "ὁράω — all forms" drills the whole famous set.
          family: "Present active — ὁράω (α-contract, suppletive verb)",
          lemma: "ὁράω",
          gloss: "I see",
          questions: [
            { form: "ὁρῶ", answer: "1st singular present active",
              note: "α + ω → ω (Rule 3). The present is a regular α-contract; the other principal parts are suppletive." },
            { form: "ὁρᾷς", answer: "2nd singular present active" },
            { form: "ὁρᾷ", answer: "3rd singular present active" },
            { form: "ὁρῶμεν", answer: "1st plural present active" },
            { form: "ὁρᾶτε", answer: "2nd plural present active",
              note: "α + ε → α (Rule 4)." },
            { form: "ὁρῶσι(ν)", answer: "3rd plural present active" }
          ]
        }
      ]
    },

    "18": {
      label: "Chapter 18 Morphology",
      notes: "Present middle/passive indicative — λύομαι",
      items: [
        {
          family: "Present mid/pas indicative — λύομαι",
          lemma: "λύω → λύομαι",
          gloss: "I am being loosed / loose for myself",
          questions: [
            { form: "λύομαι", answer: "1st singular present mid/pas" },
            { form: "λύῃ", answer: "2nd singular present mid/pas",
              note: "From λύεσαι: σ drops, ε+αι contract to ῃ." },
            { form: "λύεται", answer: "3rd singular present mid/pas" },
            { form: "λυόμεθα", answer: "1st plural present mid/pas" },
            { form: "λύεσθε", answer: "2nd plural present mid/pas" },
            { form: "λύονται", answer: "3rd plural present mid/pas" }
          ]
        },
        {
          family: "Present middle (deponent) — πορεύομαι",
          lemma: "πορεύομαι",
          gloss: "I go (deponent)",
          questions: [
            { form: "πορεύομαι", answer: "1st singular present middle" },
            { form: "πορεύῃ", answer: "2nd singular present middle" },
            { form: "πορεύεται", answer: "3rd singular present middle" },
            { form: "πορευόμεθα", answer: "1st plural present middle" },
            { form: "πορεύεσθε", answer: "2nd plural present middle" },
            { form: "πορεύονται", answer: "3rd plural present middle" }
          ]
        }
      ]
    },

    "19": {
      label: "Chapter 19 Morphology",
      notes: "Future active/middle — λύσω, πορεύσομαι",
      items: [
        {
          family: "Future active — λύσω",
          lemma: "λύω → λύσω",
          gloss: "I will loose",
          questions: [
            { form: "λύσω", answer: "1st singular future active" },
            { form: "λύσεις", answer: "2nd singular future active" },
            { form: "λύσει", answer: "3rd singular future active" },
            { form: "λύσομεν", answer: "1st plural future active" },
            { form: "λύσετε", answer: "2nd plural future active" },
            { form: "λύσουσι(ν)", answer: "3rd plural future active" }
          ]
        },
        {
          family: "Future middle — πορεύσομαι",
          lemma: "πορεύομαι → πορεύσομαι",
          gloss: "I will go (deponent)",
          questions: [
            { form: "πορεύσομαι", answer: "1st singular future middle" },
            { form: "πορεύσῃ", answer: "2nd singular future middle" },
            { form: "πορεύσεται", answer: "3rd singular future middle" },
            { form: "πορευσόμεθα", answer: "1st plural future middle" },
            { form: "πορεύσεσθε", answer: "2nd plural future middle" },
            { form: "πορεύσονται", answer: "3rd plural future middle" }
          ]
        }
      ]
    },

    "20": {
      label: "Chapter 20 Morphology",
      notes: "Liquid future (κρινῶ pattern: εσ formative)",
      items: [
        {
          family: "Liquid future active — κρινῶ",
          lemma: "κρίνω → κρινῶ",
          gloss: "I will judge",
          questions: [
            { form: "κρινῶ", answer: "1st singular future active (liquid)",
              note: "Liquid stems use εσ; the σ drops and ε contracts (Rules of Contraction)." },
            { form: "κρινεῖς", answer: "2nd singular future active (liquid)" },
            { form: "κρινεῖ", answer: "3rd singular future active (liquid)" },
            { form: "κρινοῦμεν", answer: "1st plural future active (liquid)" },
            { form: "κρινεῖτε", answer: "2nd plural future active (liquid)" },
            { form: "κρινοῦσι(ν)", answer: "3rd plural future active (liquid)" }
          ]
        }
      ]
    },

    "21": {
      label: "Chapter 21 Morphology",
      notes: "Imperfect active and mid/pas — ἔλυον, ἐλυόμην",
      items: [
        {
          family: "Imperfect active — ἔλυον",
          lemma: "λύω → ἔλυον",
          gloss: "I was loosing",
          questions: [
            { form: "ἔλυον", answer: "1st singular imperfect active (or 3rd plural)",
              note: "Famous ambiguity — only context distinguishes 1sg from 3pl." },
            { form: "ἔλυες", answer: "2nd singular imperfect active" },
            { form: "ἔλυε(ν)", answer: "3rd singular imperfect active" },
            { form: "ἐλύομεν", answer: "1st plural imperfect active" },
            { form: "ἐλύετε", answer: "2nd plural imperfect active" }
          ]
        },
        {
          family: "Imperfect mid/pas — ἐλυόμην",
          lemma: "λύομαι → ἐλυόμην",
          gloss: "I was being loosed",
          questions: [
            { form: "ἐλυόμην", answer: "1st singular imperfect mid/pas" },
            { form: "ἐλύου", answer: "2nd singular imperfect mid/pas" },
            { form: "ἐλύετο", answer: "3rd singular imperfect mid/pas" },
            { form: "ἐλυόμεθα", answer: "1st plural imperfect mid/pas" },
            { form: "ἐλύεσθε", answer: "2nd plural imperfect mid/pas" },
            { form: "ἐλύοντο", answer: "3rd plural imperfect mid/pas" }
          ]
        },
        {
          family: "Imperfect middle (deponent) — ἐπορευόμην",
          lemma: "πορεύομαι → ἐπορευόμην",
          gloss: "I was going (deponent)",
          questions: [
            { form: "ἐπορευόμην", answer: "1st singular imperfect middle" },
            { form: "ἐπορεύου", answer: "2nd singular imperfect middle" },
            { form: "ἐπορεύετο", answer: "3rd singular imperfect middle" },
            { form: "ἐπορευόμεθα", answer: "1st plural imperfect middle" },
            { form: "ἐπορεύεσθε", answer: "2nd plural imperfect middle" },
            { form: "ἐπορεύοντο", answer: "3rd plural imperfect middle" }
          ]
        }
      ]
    },

    "22": {
      label: "Chapter 22 Morphology",
      notes: "Second aorist active and middle — ἔλαβον, ἐγενόμην",
      items: [
        {
          family: "Second aorist active — ἔλαβον",
          lemma: "λαμβάνω → ἔλαβον",
          gloss: "I took",
          questions: [
            { form: "ἔλαβον", answer: "1st singular 2nd aorist active (or 3rd plural)" },
            { form: "ἔλαβες", answer: "2nd singular 2nd aorist active" },
            { form: "ἔλαβε(ν)", answer: "3rd singular 2nd aorist active" },
            { form: "ἐλάβομεν", answer: "1st plural 2nd aorist active" },
            { form: "ἐλάβετε", answer: "2nd plural 2nd aorist active" }
          ]
        },
        {
          family: "Second aorist middle — ἐγενόμην",
          lemma: "γίνομαι → ἐγενόμην",
          gloss: "I became",
          questions: [
            { form: "ἐγενόμην", answer: "1st singular 2nd aorist middle" },
            { form: "ἐγένου", answer: "2nd singular 2nd aorist middle" },
            { form: "ἐγένετο", answer: "3rd singular 2nd aorist middle" },
            { form: "ἐγενόμεθα", answer: "1st plural 2nd aorist middle" },
            { form: "ἐγένεσθε", answer: "2nd plural 2nd aorist middle" },
            { form: "ἐγένοντο", answer: "3rd plural 2nd aorist middle" }
          ]
        }
      ]
    },

    "23": {
      label: "Chapter 23 Morphology",
      notes: "First aorist active and middle — ἔλυσα, ἐλυσάμην",
      items: [
        {
          family: "First aorist active — ἔλυσα",
          lemma: "λύω → ἔλυσα",
          gloss: "I loosed",
          questions: [
            { form: "ἔλυσα", answer: "1st singular 1st aorist active" },
            { form: "ἔλυσας", answer: "2nd singular 1st aorist active" },
            { form: "ἔλυσε(ν)", answer: "3rd singular 1st aorist active" },
            { form: "ἐλύσαμεν", answer: "1st plural 1st aorist active" },
            { form: "ἐλύσατε", answer: "2nd plural 1st aorist active" },
            { form: "ἔλυσαν", answer: "3rd plural 1st aorist active" }
          ]
        },
        {
          family: "First aorist middle — ἐλυσάμην",
          lemma: "λύω → ἐλυσάμην",
          gloss: "I loosed (mid.)",
          questions: [
            { form: "ἐλυσάμην", answer: "1st singular 1st aorist middle" },
            { form: "ἐλύσω", answer: "2nd singular 1st aorist middle" },
            { form: "ἐλύσατο", answer: "3rd singular 1st aorist middle" },
            { form: "ἐλυσάμεθα", answer: "1st plural 1st aorist middle" },
            { form: "ἐλύσασθε", answer: "2nd plural 1st aorist middle" },
            { form: "ἐλύσαντο", answer: "3rd plural 1st aorist middle" }
          ]
        }
      ]
    },

    "24": {
      label: "Chapter 24 Morphology",
      notes: "Aorist passive (1st & 2nd) and future passive",
      items: [
        {
          family: "First aorist passive — ἐλύθην",
          lemma: "λύω → ἐλύθην",
          gloss: "I was loosed",
          questions: [
            { form: "ἐλύθην", answer: "1st singular 1st aorist passive",
              note: "θη + secondary ACTIVE endings (counter-intuitive but correct)." },
            { form: "ἐλύθης", answer: "2nd singular 1st aorist passive" },
            { form: "ἐλύθη", answer: "3rd singular 1st aorist passive" },
            { form: "ἐλύθημεν", answer: "1st plural 1st aorist passive" },
            { form: "ἐλύθητε", answer: "2nd plural 1st aorist passive" },
            { form: "ἐλύθησαν", answer: "3rd plural 1st aorist passive" }
          ]
        },
        {
          family: "Second aorist passive — ἐγράφην",
          lemma: "γράφω → ἐγράφην",
          gloss: "I was written",
          questions: [
            { form: "ἐγράφην", answer: "1st singular 2nd aorist passive",
              note: "η (no θ) + secondary active endings." },
            { form: "ἐγράφης", answer: "2nd singular 2nd aorist passive" },
            { form: "ἐγράφη", answer: "3rd singular 2nd aorist passive" },
            { form: "ἐγράφημεν", answer: "1st plural 2nd aorist passive" },
            { form: "ἐγράφησαν", answer: "3rd plural 2nd aorist passive" }
          ]
        },
        {
          family: "Aorist (passive form, deponent) — ἐπορεύθην",
          lemma: "πορεύομαι → ἐπορεύθην",
          gloss: "I went (deponent)",
          questions: [
            { form: "ἐπορεύθην", answer: "1st singular 1st aorist passive",
              note: "πορεύομαι forms its aorist on the passive (θη) stem but means 'I went' (active)." },
            { form: "ἐπορεύθης", answer: "2nd singular 1st aorist passive" },
            { form: "ἐπορεύθη", answer: "3rd singular 1st aorist passive" },
            { form: "ἐπορεύθημεν", answer: "1st plural 1st aorist passive" },
            { form: "ἐπορεύθητε", answer: "2nd plural 1st aorist passive" },
            { form: "ἐπορεύθησαν", answer: "3rd plural 1st aorist passive" }
          ]
        },
        {
          family: "First future passive — λυθήσομαι",
          lemma: "λύω → λυθήσομαι",
          gloss: "I will be loosed",
          questions: [
            { form: "λυθήσομαι", answer: "1st singular 1st future passive",
              note: "θησ + primary mid/pas endings; no augment." },
            { form: "λυθήσῃ", answer: "2nd singular 1st future passive" },
            { form: "λυθήσεται", answer: "3rd singular 1st future passive" },
            { form: "λυθησόμεθα", answer: "1st plural 1st future passive" }
          ]
        }
      ]
    },

    "25": {
      label: "Chapter 25 Morphology",
      notes: "Perfect & pluperfect, active and mid/pas — λέλυκα, λέλυμαι, ἐλελύκειν",
      items: [
        {
          family: "Perfect active — λέλυκα",
          lemma: "λύω → λέλυκα",
          gloss: "I have loosed",
          questions: [
            { form: "λέλυκα", answer: "1st singular perfect active" },
            { form: "λέλυκας", answer: "2nd singular perfect active" },
            { form: "λέλυκε(ν)", answer: "3rd singular perfect active" },
            { form: "λελύκαμεν", answer: "1st plural perfect active" },
            { form: "λελύκατε", answer: "2nd plural perfect active" },
            { form: "λελύκασι(ν)", answer: "3rd plural perfect active" }
          ]
        },
        {
          family: "Perfect mid/pas — λέλυμαι",
          lemma: "λύω → λέλυμαι",
          gloss: "I have been loosed",
          questions: [
            { form: "λέλυμαι", answer: "1st singular perfect mid/pas" },
            { form: "λέλυσαι", answer: "2nd singular perfect mid/pas" },
            { form: "λέλυται", answer: "3rd singular perfect mid/pas" },
            { form: "λελύμεθα", answer: "1st plural perfect mid/pas" },
            { form: "λέλυσθε", answer: "2nd plural perfect mid/pas" },
            { form: "λέλυνται", answer: "3rd plural perfect mid/pas" }
          ]
        },
        {
          family: "Pluperfect active — ἐλελύκειν (past of the perfect)",
          lemma: "λύω → λέλυκα",
          gloss: "I had loosed",
          questions: [
            { form: "ἐλελύκειν", answer: "1st singular pluperfect active",
              note: "Pluperfect = the past of the perfect; built on the perfect stem (λελυκ‑) with ‑ει‑ endings. The augment is frequently dropped in Koine." },
            { form: "ἐλελύκεις", answer: "2nd singular pluperfect active" },
            { form: "ἐλελύκει", answer: "3rd singular pluperfect active" },
            { form: "ἐλελύκειμεν", answer: "1st plural pluperfect active" },
            { form: "ἐλελύκειτε", answer: "2nd plural pluperfect active" },
            { form: "ἐλελύκεισαν", answer: "3rd plural pluperfect active" }
          ]
        },
        {
          family: "Pluperfect mid/pas — ἐλελύμην",
          lemma: "λύω → λέλυμαι",
          gloss: "I had been loosed",
          questions: [
            { form: "ἐλελύμην", answer: "1st singular pluperfect mid/pas" },
            { form: "ἐλέλυσο", answer: "2nd singular pluperfect mid/pas" },
            { form: "ἐλέλυτο", answer: "3rd singular pluperfect mid/pas" },
            { form: "ἐλελύμεθα", answer: "1st plural pluperfect mid/pas" },
            { form: "ἐλέλυσθε", answer: "2nd plural pluperfect mid/pas" },
            { form: "ἐλέλυντο", answer: "3rd plural pluperfect mid/pas" }
          ]
        },
        {
          // οἶδα is a second perfect that functions as a PRESENT ("I know"). It
          // has no present tense, so the perfect does that work; parsed
          // morphologically it is perfect active indicative. The "perfect as
          // present" example for parsing — gated at Ch 25 (where the perfect is
          // taught), though οἶδα appears as vocab back in Ch 17. The result card
          // adds a "Form vs meaning" note (keyed off lemma "οἶδα") explaining the
          // mismatch (see FORM_VS_MEANING_NOTES in render.js).
          family: "οἶδα — perfect active, present in meaning (“I know”)",
          lemma: "οἶδα",
          gloss: "I know",
          questions: [
            { form: "οἶδα", answer: "1st singular perfect active",
              note: "οἶδα is perfect in form but present in meaning — “I know”, not “I have known”. It has no present tense." },
            { form: "οἶδας", answer: "2nd singular perfect active" },
            { form: "οἶδε(ν)", answer: "3rd singular perfect active" },
            { form: "οἴδαμεν", answer: "1st plural perfect active" },
            { form: "οἴδατε", answer: "2nd plural perfect active" },
            { form: "οἴδασι(ν)", answer: "3rd plural perfect active" }
          ]
        },
        {
          // οἶδα's pluperfect (ᾔδειν…) serves as a simple PAST ("I knew"),
          // mirroring the perfect-as-present pattern.
          family: "οἶδα — pluperfect active, past in meaning (“I knew”)",
          lemma: "οἶδα",
          gloss: "I knew",
          questions: [
            { form: "ᾔδειν", answer: "1st singular pluperfect active",
              note: "ᾔδειν is pluperfect in form but past in meaning — “I knew”; the pluperfect supplies οἶδα's past." },
            { form: "ᾔδεις", answer: "2nd singular pluperfect active" },
            { form: "ᾔδει", answer: "3rd singular pluperfect active" },
            { form: "ᾔδειμεν", answer: "1st plural pluperfect active" },
            { form: "ᾔδειτε", answer: "2nd plural pluperfect active" },
            { form: "ᾔδεισαν", answer: "3rd plural pluperfect active" }
          ]
        }
      ]
    },

    "27": {
      label: "Chapter 27 Morphology",
      notes: "Present (continuous) participle paradigms — λύων, λυόμενος",
      items: [
        {
          family: "Present active participle — λύων (3-1-3, ντ-stem)",
          lemma: "λύω",
          gloss: "loosing",
          questions: [
            { form: "λύων", answer: "present active participle, nom. sg. masc." },
            { form: "λύοντος", answer: "present active participle, gen. sg. masc./neut." },
            { form: "λύοντι", answer: "present active participle, dat. sg. masc./neut." },
            { form: "λύοντα", answer: "present active participle, acc. sg. masc. or nom./acc. pl. neut." },
            { form: "λύουσα", answer: "present active participle, nom. sg. fem." },
            { form: "λυούσης", answer: "present active participle, gen. sg. fem." },
            { form: "λῦον", answer: "present active participle, nom./acc. sg. neut." },
            { form: "λύοντες", answer: "present active participle, nom. pl. masc." },
            { form: "λυόντων", answer: "present active participle, gen. pl. (all genders)" }
          ]
        },
        {
          family: "Present mid/pas participle — λυόμενος (2-1-2)",
          lemma: "λύω",
          gloss: "being loosed / loosing for oneself",
          questions: [
            { form: "λυόμενος", answer: "present mid/pas participle, nom. sg. masc." },
            { form: "λυομένου", answer: "present mid/pas participle, gen. sg. masc./neut." },
            { form: "λυόμενον", answer: "present mid/pas participle, acc. sg. masc. or nom./acc. sg. neut." },
            { form: "λυομένη", answer: "present mid/pas participle, nom. sg. fem." },
            { form: "λυομένης", answer: "present mid/pas participle, gen. sg. fem." }
          ]
        },
        {
          family: "Present middle participle (deponent) — πορευόμενος",
          lemma: "πορεύομαι",
          gloss: "going (deponent)",
          questions: [
            { form: "πορευόμενος", answer: "present middle participle, nom. sg. masc." },
            { form: "πορευομένου", answer: "present middle participle, gen. sg. masc./neut." },
            { form: "πορευόμενον", answer: "present middle participle, acc. sg. masc. or nom./acc. sg. neut." },
            { form: "πορευομένη", answer: "present middle participle, nom. sg. fem." },
            { form: "πορευομένης", answer: "present middle participle, gen. sg. fem." }
          ]
        },
        // Linked copies of λύω's present participles under their own lemma keys so
        // they ALSO appear as standalone "Participles" dropdown entries — they can
        // be drilled alone or shuffled with the other participles. The forms stay
        // under the base "λύω" present item above too (so the present paradigm is
        // unchanged); the per-form dedup collapses the overlap in the cumulative.
        {
          family: "Present active participle — λύων (linked copy)",
          lemma: "λύω → λύων",
          gloss: "loosing",
          questions: [
            { form: "λύων", answer: "present active participle, nom. sg. masc." },
            { form: "λύοντος", answer: "present active participle, gen. sg. masc./neut." },
            { form: "λύοντι", answer: "present active participle, dat. sg. masc./neut." },
            { form: "λύοντα", answer: "present active participle, acc. sg. masc. or nom./acc. pl. neut." },
            { form: "λύουσα", answer: "present active participle, nom. sg. fem." },
            { form: "λυούσης", answer: "present active participle, gen. sg. fem." },
            { form: "λῦον", answer: "present active participle, nom./acc. sg. neut." },
            { form: "λύοντες", answer: "present active participle, nom. pl. masc." },
            { form: "λυόντων", answer: "present active participle, gen. pl. (all genders)" }
          ]
        },
        {
          family: "Present mid/pas participle — λυόμενος (linked copy)",
          lemma: "λύω → λυόμενος",
          gloss: "being loosed / loosing for oneself",
          questions: [
            { form: "λυόμενος", answer: "present mid/pas participle, nom. sg. masc." },
            { form: "λυομένου", answer: "present mid/pas participle, gen. sg. masc./neut." },
            { form: "λυόμενον", answer: "present mid/pas participle, acc. sg. masc. or nom./acc. sg. neut." },
            { form: "λυομένη", answer: "present mid/pas participle, nom. sg. fem." },
            { form: "λυομένης", answer: "present mid/pas participle, gen. sg. fem." },
            { form: "λυόμενε", answer: "present mid/pas participle, voc. sg. masc.",
              note: "2-1-2 participles take a distinct vocative sg masc in ‑ε (λυόμενε); the 3-1-3 active participle λύων has voc = nom." }
          ]
        }
      ]
    },

    "28": {
      label: "Chapter 28 Morphology",
      notes: "Aorist (undefined) participle paradigms",
      items: [
        {
          family: "First aorist active participle — λύσας",
          lemma: "λύω → λύσας",
          gloss: "having loosed",
          questions: [
            { form: "λύσας", answer: "1st aorist active participle, nom. sg. masc." },
            { form: "λύσαντος", answer: "1st aorist active participle, gen. sg. masc./neut." },
            { form: "λύσασα", answer: "1st aorist active participle, nom. sg. fem." },
            { form: "λῦσαν", answer: "1st aorist active participle, nom./acc. sg. neut." }
          ]
        },
        {
          family: "First aorist passive participle — λυθείς",
          lemma: "λύω → λυθείς",
          gloss: "having been loosed",
          questions: [
            { form: "λυθείς", answer: "1st aorist passive participle, nom. sg. masc." },
            { form: "λυθέντος", answer: "1st aorist passive participle, gen. sg. masc./neut." },
            { form: "λυθεῖσα", answer: "1st aorist passive participle, nom. sg. fem." },
            { form: "λυθέν", answer: "1st aorist passive participle, nom./acc. sg. neut." }
          ]
        },
        {
          family: "Aorist passive participle (deponent) — πορευθείς",
          lemma: "πορεύομαι → πορευθείς",
          gloss: "having gone (deponent)",
          questions: [
            { form: "πορευθείς", answer: "1st aorist passive participle, nom. sg. masc." },
            { form: "πορευθέντος", answer: "1st aorist passive participle, gen. sg. masc./neut." },
            { form: "πορευθεῖσα", answer: "1st aorist passive participle, nom. sg. fem." },
            { form: "πορευθέν", answer: "1st aorist passive participle, nom./acc. sg. neut." }
          ]
        },
        {
          family: "Second aorist active participle — λιπών",
          lemma: "λείπω → ἔλιπον",
          gloss: "having left",
          questions: [
            { form: "λιπών", answer: "2nd aorist active participle, nom. sg. masc." },
            { form: "λιπόντος", answer: "2nd aorist active participle, gen. sg. masc./neut." },
            { form: "λιποῦσα", answer: "2nd aorist active participle, nom. sg. fem." },
            { form: "λιπόν", answer: "2nd aorist active participle, nom./acc. sg. neut." }
          ]
        }
      ]
    },

    "30": {
      label: "Chapter 30 Morphology",
      notes: "Perfect participles — λελυκώς, λελυμένος",
      items: [
        {
          family: "Perfect active participle — λελυκώς (οτ-stem)",
          lemma: "λύω → λέλυκα",
          gloss: "having loosed",
          questions: [
            { form: "λελυκώς", answer: "perfect active participle, nom. sg. masc." },
            { form: "λελυκότος", answer: "perfect active participle, gen. sg. masc./neut." },
            { form: "λελυκυῖα", answer: "perfect active participle, nom. sg. fem." },
            { form: "λελυκός", answer: "perfect active participle, nom./acc. sg. neut." }
          ]
        },
        {
          family: "Perfect mid/pas participle — λελυμένος",
          lemma: "λύω → λέλυμαι",
          gloss: "having been loosed",
          questions: [
            { form: "λελυμένος", answer: "perfect mid/pas participle, nom. sg. masc." },
            { form: "λελυμένου", answer: "perfect mid/pas participle, gen. sg. masc./neut." },
            { form: "λελυμένη", answer: "perfect mid/pas participle, nom. sg. fem." },
            { form: "λελυμένον", answer: "perfect mid/pas participle, acc. sg. masc. or nom./acc. sg. neut." }
          ]
        }
      ]
    },

    "31": {
      label: "Chapter 31 Morphology",
      notes: "Subjunctive — λύω (present & aorist, all voices) + εἰμί; plus the rare optative (the NT forms εἴη / δῴη / γένοιτο, mirrored onto λύω & πορεύομαι). No augment; the subjunctive lengthens the connecting vowel (η/ω), the optative shows the iota mood-sign (‑οι‑ / ‑αι‑ / ‑ει‑).",
      items: [
        {
          family: "Present active subjunctive — λύω",
          lemma: "λύω",
          gloss: "(that) I loose",
          questions: [
            { form: "λύω", answer: "1st singular present active subjunctive",
              note: "Identical in spelling to the present active indicative 1sg λύω; context/mood disambiguates." },
            { form: "λύῃς", answer: "2nd singular present active subjunctive" },
            { form: "λύῃ", answer: "3rd singular present active subjunctive" },
            { form: "λύωμεν", answer: "1st plural present active subjunctive" },
            { form: "λύητε", answer: "2nd plural present active subjunctive" },
            { form: "λύωσι(ν)", answer: "3rd plural present active subjunctive" }
          ]
        },
        {
          family: "Aorist active subjunctive — λύσω",
          lemma: "λύω",
          gloss: "(that) I loose (aor.)",
          questions: [
            { form: "λύσω", answer: "1st singular aorist active subjunctive",
              note: "Aorist subjunctive: aorist stem (λυσ‑) + lengthened endings, NO augment (the augment is indicative-only)." },
            { form: "λύσῃς", answer: "2nd singular aorist active subjunctive" },
            { form: "λύσῃ", answer: "3rd singular aorist active subjunctive" },
            { form: "λύσωμεν", answer: "1st plural aorist active subjunctive" },
            { form: "λύσητε", answer: "2nd plural aorist active subjunctive" },
            { form: "λύσωσι(ν)", answer: "3rd plural aorist active subjunctive" }
          ]
        },
        {
          family: "Present middle/passive subjunctive — λύωμαι",
          lemma: "λύω",
          gloss: "(that) I am loosed",
          questions: [
            { form: "λύωμαι", answer: "1st singular present mid/pas subjunctive" },
            { form: "λύηται", answer: "3rd singular present mid/pas subjunctive" },
            { form: "λυώμεθα", answer: "1st plural present mid/pas subjunctive" },
            { form: "λύησθε", answer: "2nd plural present mid/pas subjunctive" },
            { form: "λύωνται", answer: "3rd plural present mid/pas subjunctive" }
          ]
        },
        {
          family: "Aorist middle subjunctive — λύσωμαι",
          lemma: "λύω",
          gloss: "(that) I loose for myself",
          questions: [
            { form: "λύσωμαι", answer: "1st singular aorist middle subjunctive" },
            { form: "λύσηται", answer: "3rd singular aorist middle subjunctive" },
            { form: "λυσώμεθα", answer: "1st plural aorist middle subjunctive" },
            { form: "λύσησθε", answer: "2nd plural aorist middle subjunctive" },
            { form: "λύσωνται", answer: "3rd plural aorist middle subjunctive" }
          ]
        },
        {
          family: "Aorist passive subjunctive — λυθῶ",
          lemma: "λύω",
          gloss: "(that) I am loosed (aor.)",
          questions: [
            { form: "λυθῶ", answer: "1st singular aorist passive subjunctive",
              note: "Aorist passive subjunctive: passive stem (λυθ‑) + contracted ‑ῶ endings, no augment." },
            { form: "λυθῇς", answer: "2nd singular aorist passive subjunctive" },
            { form: "λυθῇ", answer: "3rd singular aorist passive subjunctive" },
            { form: "λυθῶμεν", answer: "1st plural aorist passive subjunctive" },
            { form: "λυθῆτε", answer: "2nd plural aorist passive subjunctive" },
            { form: "λυθῶσι(ν)", answer: "3rd plural aorist passive subjunctive" }
          ]
        },
        {
          family: "Present subjunctive of εἰμί — ὦ",
          lemma: "εἰμί",
          gloss: "(that) I am",
          questions: [
            { form: "ὦ", answer: "1st singular present active subjunctive",
              note: "εἰμί has only a present subjunctive (ὦ, ᾖς, ᾖ, ὦμεν, ἦτε, ὦσι(ν)); extremely common after ἵνα." },
            { form: "ᾖς", answer: "2nd singular present active subjunctive" },
            { form: "ᾖ", answer: "3rd singular present active subjunctive" },
            { form: "ὦμεν", answer: "1st plural present active subjunctive" },
            { form: "ἦτε", answer: "2nd plural present active subjunctive" },
            { form: "ὦσι(ν)", answer: "3rd plural present active subjunctive" }
          ]
        },
        {
          family: "Optative (rare) — NT forms + λύω / πορεύομαι models",
          lemma: "λύω",
          gloss: "might / would …",
          questions: [
            // The three optatives that actually occur in the GNT (all 3sg).
            { form: "εἴη", lemma: "εἰμί", answer: "3rd singular present active optative",
              note: "The only optative of εἰμί in the GNT (always 3sg) — e.g. Lk 1:29, Acts 8:20. The iota ‑ει‑ marks the optative." },
            { form: "δῴη", lemma: "δίδωμι", answer: "3rd singular aorist active optative",
              note: "“may the Lord grant”, 2 Tim 1:16. A contracted by-form of the regular δοίη." },
            { form: "γένοιτο", lemma: "γίνομαι", answer: "3rd singular aorist middle optative",
              note: "Paul’s μὴ γένοιτο, “may it never be!” (Rom 6:2 etc.). 2nd-aorist middle of γίνομαι." },
            // The same three parses mirrored onto the model verbs the student knows.
            { form: "λύοι", answer: "3rd singular present active optative", context: "λύω in the slot of εἴη" },
            { form: "λύσαι", answer: "3rd singular aorist active optative",
              context: "λύω in the slot of δῴη", note: "λύσαι (acute) = aorist active optative 3sg; the infinitive λῦσαι has a circumflex." },
            { form: "λύσαιτο", answer: "3rd singular aorist middle optative", context: "λύω in the slot of γένοιτο" },
            { form: "πορεύοιτο", lemma: "πορεύομαι", answer: "3rd singular present middle optative",
              context: "πορεύομαι (deponent) in the slot of εἴη" },
            { form: "πορευθείη", lemma: "πορεύομαι", answer: "3rd singular aorist passive optative",
              context: "πορεύομαι (deponent) in the slot of δῴη / γένοιτο — its aorist is passive-form" }
          ]
        }
      ]
    },

    "32": {
      label: "Chapter 32 Morphology",
      notes: "Infinitive endings (active / middle / passive)",
      items: [
        {
          family: "Infinitive endings",
          lemma: "λύω infinitive forms",
          gloss: "to ___",
          questions: [
            { form: "λύειν", answer: "present active infinitive" },
            { form: "λύεσθαι", answer: "present mid/pas infinitive" },
            { form: "λῦσαι", answer: "1st aorist active infinitive" },
            { form: "λύσασθαι", answer: "1st aorist middle infinitive" },
            { form: "λυθῆναι", answer: "1st aorist passive infinitive" },
            { form: "λελυκέναι", answer: "perfect active infinitive" },
            { form: "λελύσθαι", answer: "perfect mid/pas infinitive" },
            { form: "λιπεῖν", answer: "2nd aorist active infinitive" }
          ]
        },
        {
          family: "Infinitives (deponent) — πορεύομαι",
          lemma: "πορεύομαι infinitive forms",
          gloss: "to go (deponent)",
          questions: [
            { form: "πορεύεσθαι", answer: "present mid/pas infinitive" },
            { form: "πορευθῆναι", answer: "1st aorist passive infinitive" }
          ]
        }
      ]
    },

    "33": {
      label: "Chapter 33 Morphology",
      notes: "Imperative endings (active / mid-pas)",
      items: [
        {
          family: "Present active imperative — λύε",
          lemma: "λύω",
          gloss: "loose!",
          questions: [
            { form: "λῦε", answer: "2nd singular present active imperative" },
            { form: "λυέτω", answer: "3rd singular present active imperative ('let him loose')" },
            { form: "λύετε", answer: "2nd plural present active imperative" },
            { form: "λυέτωσαν", answer: "3rd plural present active imperative" }
          ]
        },
        {
          family: "First aorist active imperative — λῦσον",
          lemma: "λύω → λῦσον",
          gloss: "loose! (aor.)",
          questions: [
            { form: "λῦσον", answer: "2nd singular 1st aorist active imperative" },
            { form: "λυσάτω", answer: "3rd singular 1st aorist active imperative" },
            { form: "λύσατε", answer: "2nd plural 1st aorist active imperative" },
            { form: "λυσάτωσαν", answer: "3rd plural 1st aorist active imperative" }
          ]
        },
        {
          family: "Aorist passive imperative — λύθητι",
          lemma: "λύω → ἐλύθην",
          gloss: "be loosed!",
          questions: [
            { form: "λύθητι", answer: "2nd singular 1st aorist passive imperative" },
            { form: "λυθήτω", answer: "3rd singular 1st aorist passive imperative" },
            { form: "λύθητε", answer: "2nd plural 1st aorist passive imperative" },
            { form: "λυθήτωσαν", answer: "3rd plural 1st aorist passive imperative" }
          ]
        },
        {
          family: "Present middle imperative (deponent) — πορεύου",
          lemma: "πορεύομαι",
          gloss: "go! (deponent)",
          questions: [
            { form: "πορεύου", answer: "2nd singular present middle imperative" },
            { form: "πορευέσθω", answer: "3rd singular present middle imperative" },
            { form: "πορεύεσθε", answer: "2nd plural present middle imperative" },
            { form: "πορευέσθωσαν", answer: "3rd plural present middle imperative" }
          ]
        },
        {
          family: "Aorist passive imperative (deponent) — πορεύθητι",
          lemma: "πορεύομαι → ἐπορεύθην",
          gloss: "go! (aor., deponent)",
          questions: [
            { form: "πορεύθητι", answer: "2nd singular 1st aorist passive imperative" },
            { form: "πορευθήτω", answer: "3rd singular 1st aorist passive imperative" },
            { form: "πορεύθητε", answer: "2nd plural 1st aorist passive imperative" },
            { form: "πορευθήτωσαν", answer: "3rd plural 1st aorist passive imperative" }
          ]
        },
        {
          family: "Present middle/passive imperative — λύου, λυέσθω",
          lemma: "λύω",
          gloss: "be loosed! / loose for yourself!",
          questions: [
            { form: "λύου", answer: "2nd singular present middle/passive imperative" },
            { form: "λυέσθω", answer: "3rd singular present middle/passive imperative ('let him be loosed')" },
            { form: "λύεσθε", answer: "2nd plural present middle/passive imperative" },
            { form: "λυέσθωσαν", answer: "3rd plural present middle/passive imperative" }
          ]
        },
        {
          family: "Imperative of εἰμί — ἴσθι, ἔστω",
          lemma: "εἰμί",
          gloss: "be!",
          questions: [
            { form: "ἴσθι", answer: "2nd singular present active imperative" },
            { form: "ἔστω", answer: "3rd singular present active imperative ('let him/her/it be')",
              note: "ἔστω (3sg) and ἔστωσαν (3pl) are the common NT imperatives of εἰμί." },
            { form: "ἔστε", answer: "2nd plural present active imperative" },
            { form: "ἔστωσαν", answer: "3rd plural present active imperative" }
          ]
        }
      ]
    },

    "34": {
      label: "Chapter 34 Morphology",
      notes: "δίδωμι in the indicative",
      items: [
        {
          family: "δίδωμι present active",
          lemma: "δίδωμι",
          gloss: "I give",
          questions: [
            { form: "δίδωμι", answer: "1st singular present active" },
            { form: "δίδως", answer: "2nd singular present active" },
            { form: "δίδωσι(ν)", answer: "3rd singular present active" },
            { form: "δίδομεν", answer: "1st plural present active",
              note: "Vowel shortens (Rule 4 of μι Verbs: ablaut)." },
            { form: "δίδοτε", answer: "2nd plural present active" },
            { form: "διδόασι(ν)", answer: "3rd plural present active",
              note: "Note the unusual -ασι(ν) ending in μι verbs." }
          ]
        },
        {
          family: "δίδωμι aorist active — ἔδωκα",
          lemma: "δίδωμι → ἔδωκα",
          gloss: "I gave",
          questions: [
            { form: "ἔδωκα", answer: "1st singular aorist active",
              note: "μι verbs typically use κα (not σα) as aorist tense formative — Rule 5." },
            { form: "ἔδωκας", answer: "2nd singular aorist active" },
            { form: "ἔδωκε(ν)", answer: "3rd singular aorist active" },
            { form: "ἐδώκαμεν", answer: "1st plural aorist active" },
            { form: "ἔδωκαν", answer: "3rd plural aorist active" }
          ]
        }
      ]
    },

    "36": {
      label: "Chapter 36 Morphology",
      notes: "Other μι verbs — ἵστημι, τίθημι, δείκνυμι",
      items: [
        {
          family: "ἵστημι present active",
          lemma: "ἵστημι (root *στα-)",
          gloss: "I cause to stand / I stand",
          questions: [
            { form: "ἵστημι", answer: "1st singular present active" },
            { form: "ἵστης", answer: "2nd singular present active" },
            { form: "ἵστησι(ν)", answer: "3rd singular present active" },
            { form: "ἵσταμεν", answer: "1st plural present active" },
            { form: "ἱστᾶσι(ν)", answer: "3rd plural present active" }
          ]
        },
        {
          family: "τίθημι present active",
          lemma: "τίθημι (root *θε-)",
          gloss: "I put, place",
          questions: [
            { form: "τίθημι", answer: "1st singular present active" },
            { form: "τίθης", answer: "2nd singular present active" },
            { form: "τίθησι(ν)", answer: "3rd singular present active" },
            { form: "τίθεμεν", answer: "1st plural present active" },
            { form: "τιθέασι(ν)", answer: "3rd plural present active" }
          ]
        },
        {
          family: "δείκνυμι present active",
          lemma: "δείκνυμι (no reduplication)",
          gloss: "I show",
          questions: [
            { form: "δείκνυμι", answer: "1st singular present active" },
            { form: "δείκνυσι(ν)", answer: "3rd singular present active",
              note: "δείκνυμι doesn't reduplicate; the -νυ- is part of the present stem." },
            { form: "δείκνυμεν", answer: "1st plural present active" }
          ]
        }
      ]
    }

  };

  function localShuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function stableMorphKey(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .toLowerCase()
      .replace(/^-+|-+$/g, '');
  }

  function pickDistractors(correctAnswer, preferredPool, fallbackPool) {
    const distractors = [];
    const seen = new Set([correctAnswer]);

    const pushFrom = (pool) => {
      for (const item of localShuffle(pool)) {
        if (seen.has(item)) continue;
        seen.add(item);
        distractors.push(item);
        if (distractors.length >= 3) break;
      }
    };

    pushFrom(preferredPool);
    if (distractors.length < 3) pushFrom(fallbackPool);

    return distractors.slice(0, 3);
  }

  function parseParadigmKey(key) {
    const match = String(key).match(/^(.+)::(grammar|morph)::(\d+)$/);
    if (!match) return { baseKey: String(key), type: null, itemIdx: null };
    return { baseKey: match[1], type: match[2], itemIdx: Number(match[3]) };
  }

  function resolveMorphologySelection(key) {
    const selection = parseParadigmKey(key);
    if (selection.type && selection.type !== 'morph') return null;
    const set = MORPHOLOGY_SETS[selection.baseKey];
    if (!set) return null;
    const items = Number.isInteger(selection.itemIdx) ? [set.items[selection.itemIdx]] : set.items;
    return { ...selection, set, items: items.filter(Boolean) };
  }

  function buildMorphologyCardsForKeys(keys) {
    const selected = (keys || []).map(String);
    const selections = selected.map(resolveMorphologySelection).filter(Boolean);
    const allAnswers = [];
    const allForms = [];
    selections.forEach((selection) => {
      selection.items.forEach((item) => {
        item.questions.forEach((q) => {
          allAnswers.push(q.answer);
          allForms.push(q.form);
        });
      });
    });

    const cards = [];
    selections.forEach((selection) => {
      selection.items.forEach((item, relativeItemIdx) => {
        const itemIdx = Number.isInteger(selection.itemIdx) ? selection.itemIdx : relativeItemIdx;
        const itemAnswers = item.questions.map((q) => q.answer);
        const itemForms = item.questions.map((q) => q.form);
        // formToAnswer is consumed by the parsing-feedback form lookup
        // (resolveFormForPickedDims). It needs the canonical parse string
        // (q.parsed when supplied), not the human-friendly q.answer that
        // grammar.js cards use for MC display. Falls back to q.answer when
        // no separate canonical is given — that's already the canonical
        // form for paradigm_morphology auto-generated cards.
        const formToAnswer = {};
        item.questions.forEach((q) => { if (q && q.form) formToAnswer[q.form] = q.parsed || q.answer; });
        item.questions.forEach((q, qIdx) => {
          const distractors = pickDistractors(q.answer, itemAnswers, allAnswers);
          const choices = localShuffle([q.answer, ...distractors]);
          const reverseDistractors = pickDistractors(q.form, itemForms, allForms);
          const reverseChoices = localShuffle([q.form, ...reverseDistractors]);
          cards.push({
            id: `morph-${selection.baseKey}-${itemIdx}-${qIdx}-${stableMorphKey(item.lemma)}-${stableMorphKey(q.form)}-${stableMorphKey(q.answer)}`,
            kind: 'morph',
            required: true,
            sourceKey: String(selection.baseKey),
            sourceLabel: selection.set.label,
            supplemental: !!selection.set.supplemental,
            chapter: Number(selection.baseKey),
            family: item.family,
            lemma: q.lemma || item.lemma,
            gloss: item.gloss,
            form: q.form,
            prompt: q.prompt || 'Parse this form.',
            // dimensional=false marks cards that aren't parsing drills (e.g.
            // stem-change recall: "what is the aorist of βάλλω?"). The
            // step-by-step renderer detects this and falls back to a simple
            // MC layout instead of trying to decompose a Greek form into
            // parsing dimensions.
            dimensional: q.dimensional !== false,
            context: q.context || '',
            note: q.note || '',
            answer: q.answer,
            // Canonical parse string used by parseAnswerDimensions for the
            // step builder + form lookup. When a grammar.js question's
            // human-friendly answer omits dimensions (e.g.
            // "1st singular ('I am')" with no tense/voice/mood), supply a
            // canonical `parsed:` next to it. Defaults to answer.
            parsedAnswer: q.parsed || q.answer,
            choices,
            reversible: q.reversible !== false,
            reversePrompt: q.reversePrompt || 'Choose the correct Greek form.',
            reverseChoices,
            formToAnswer
          });
        });
      });
    });

    return cards;
  }

  function getMorphologyCountForKey(key) {
    const set = MORPHOLOGY_SETS[String(key)];
    if (!set) return 0;
    return set.items.reduce((sum, item) => sum + item.questions.length, 0);
  }

  window.MORPHOLOGY_SETS = MORPHOLOGY_SETS;
  window.buildMorphologyCardsForKeys = buildMorphologyCardsForKeys;
  window.getMorphologyCountForKey = getMorphologyCountForKey;
})();
