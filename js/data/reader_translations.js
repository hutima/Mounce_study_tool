// ═══════════════════════════════════════════════════════════════════════
//  MOUNCE TRANSLATION DRILLS — synthetic phrases keyed by chapter
// ═══════════════════════════════════════════════════════════════════════
//
//  Each chapter's `sentences` array holds short Greek phrases built ONLY
//  from vocabulary and grammar introduced through that Mounce chapter.
//  No NT verses — these are author-written practice sentences so the
//  vocabulary scope can be controlled tightly per chapter.
//
//  Schema (per drill):
//      { g, en, choices: [...], level: 1|2|3, note?: string }
//
//      level 1 = English-friendly word order
//      level 2 = mild reordering / Greek emphasis
//      level 3 = Greek-style ordering (verb-fronted / object-fronted)
//
//  ⚠ AI-DRAFTED — verify glosses against the chapter vocab and against
//  Mounce's own translations. This is a starter set; expand as needed.
//  Chapters not yet drafted have an empty `sentences` array; the
//  Translate tab will simply show no drills for those chapters.
// ═══════════════════════════════════════════════════════════════════════

(function () {
  const SETS = {

    "4": { sentences: [
      { level: 1, g: "ὁ θεός.", en: "God.",
        choices: ["God.", "the God's.", "the gods.", "to God."] },
      { level: 1, g: "ὁ προφήτης καὶ ὁ ἀπόστολος.", en: "The prophet and the apostle.",
        choices: ["The prophet and the apostle.", "The prophet of the apostle.", "The apostle and the prophet.", "A prophet and an apostle."],
        note: "καί links nouns of the same case." },
      { level: 1, g: "ὁ ἄγγελος καὶ ἡ φωνή.", en: "The angel and the voice.",
        choices: ["The angel and the voice.", "The voice of the angel.", "An angel and a voice.", "The angels and the voices."] },
      { level: 2, g: "Παῦλος ἀπόστολος.", en: "Paul (is) an apostle.",
        choices: ["Paul (is) an apostle.", "Paul of the apostle.", "Paul and an apostle.", "An apostle (is) Paul."],
        note: "No article before either noun → predicate sense; an implied 'is' is normal." }
    ]},

    "6": { sentences: [
      { level: 1, g: "ὁ θεὸς ἀγάπη ἐστίν.", en: "God is love.",
        choices: ["God is love.", "Love is God.", "The God's love.", "God loves."],
        note: "Predicate nominative: ἀγάπη (no article) is the predicate of εἰμί." },
      { level: 1, g: "καιρὸς καὶ ὥρα.", en: "A time and an hour.",
        choices: ["A time and an hour.", "The time and the hour.", "Time of an hour.", "An hour and a time."] },
      { level: 1, g: "οὐκ ἔργον, ἀλλὰ ἀγάπη.", en: "Not a work, but love.",
        choices: ["Not a work, but love.", "Not love, but a work.", "Both a work and love.", "Neither a work nor love."] },
      { level: 2, g: "βασιλεία θεοῦ.", en: "A kingdom of God.",
        choices: ["A kingdom of God.", "God's kingdom.", "The kingdom of God.", "A kingdom for God."],
        note: "Without articles either gloss is acceptable; Mounce often translates 'a kingdom of God' / 'God's kingdom' interchangeably." }
    ]},

    "7": { sentences: [
      { level: 1, g: "ὁ λόγος τοῦ θεοῦ.", en: "The word of God.",
        choices: ["The word of God.", "The word to God.", "The Word God.", "God's words."],
        note: "Genitive: τοῦ θεοῦ — 'of God'." },
      { level: 1, g: "οἱ λόγοι τοῦ κυρίου.", en: "The words of the Lord.",
        choices: ["The words of the Lord.", "The word of the lords.", "The lords' word.", "The lords' words."] },
      { level: 1, g: "λέγει ὁ ἀπόστολος τῷ ἀνθρώπῳ.", en: "The apostle speaks to the man.",
        choices: ["The apostle speaks to the man.", "The man speaks to the apostle.", "The apostle and the man speak.", "The apostle says of the man."],
        note: "Dative τῷ ἀνθρώπῳ marks the indirect object." },
      { level: 2, g: "οὐρανὸς καὶ γῆ.", en: "Heaven and earth.",
        choices: ["Heaven and earth.", "The heaven and the earth.", "Of heaven and earth.", "By heaven and the earth."] },
      { level: 3, g: "τῷ θεῷ ὁ προφήτης λέγει.", en: "The prophet speaks to God.",
        choices: ["The prophet speaks to God.", "God speaks to the prophet.", "The prophet of God speaks.", "God and the prophet speak."],
        note: "Greek can front the indirect object for emphasis; the case ending still flags the role." }
    ]},

    "8": { sentences: [
      { level: 1, g: "ὁ θεὸς ἐν τῷ οὐρανῷ ἐστίν.", en: "God is in heaven.",
        choices: ["God is in heaven.", "Heaven is in God.", "God is from heaven.", "God enters heaven."] },
      { level: 1, g: "λέγει εἰς τὸν κόσμον.", en: "He speaks into the world.",
        choices: ["He speaks into the world.", "He speaks in the world.", "He speaks of the world.", "The world speaks."],
        note: "εἰς + accusative = motion 'into / to'." },
      { level: 2, g: "ἀπόστολος εἰμι Ἰησοῦ Χριστοῦ.", en: "I am an apostle of Jesus Christ.",
        choices: ["I am an apostle of Jesus Christ.", "Jesus Christ is the apostle.", "I am Jesus Christ's.", "I send Jesus Christ."],
        note: "ἀπόστολος (predicate nominative, no article) + εἰμί + genitive of source." },
      { level: 2, g: "ἐκ τῆς γῆς εἰς τὸν οὐρανόν.", en: "From the earth into the heavens.",
        choices: ["From the earth into the heavens.", "In the earth from the heavens.", "Of the earth and the heavens.", "By the earth in the heavens."] }
    ]},

    "9": { sentences: [
      { level: 1, g: "ἀγαθὸς ἄνθρωπος.", en: "A good man.",
        choices: ["A good man.", "The good man.", "The man is good.", "A man of good."] },
      { level: 1, g: "ὁ ἀγαθὸς ἄνθρωπος.", en: "The good man.",
        choices: ["The good man.", "A good man.", "The man is good.", "A man, good."],
        note: "Article + adjective + noun = attributive position." },
      { level: 1, g: "ὁ ἄνθρωπος ἀγαθός.", en: "The man is good.",
        choices: ["The man is good.", "The good man.", "A good man.", "The man, the good one."],
        note: "Article + noun + adjective (no article on adj.) = predicate position; supply 'is.'" },
      { level: 2, g: "οἱ ἀγαθοὶ τὸν λόγον λέγουσιν.", en: "The good (people) speak the word.",
        choices: ["The good (people) speak the word.", "The good word speaks.", "They speak good words.", "The good speaks of the word."],
        note: "Substantival adjective: article + adj. alone = 'the good ones / good people.'" }
    ]},

    "16": { sentences: [
      { level: 1, g: "λύομεν τὸν δοῦλον.", en: "We loose the slave.",
        choices: ["We loose the slave.", "The slave looses us.", "I loose the slave.", "You loose the slave."] },
      { level: 1, g: "βλέπει τὸν Χριστόν.", en: "He sees the Christ.",
        choices: ["He sees the Christ.", "Christ sees him.", "We see Christ.", "He sees a Christ."] },
      { level: 1, g: "γράφω τὸν λόγον.", en: "I write the word.",
        choices: ["I write the word.", "I read the word.", "The word writes.", "We write the word."] },
      { level: 2, g: "ἀκούει ὁ μαθητὴς τὴν φωνήν.", en: "The disciple hears the voice.",
        choices: ["The disciple hears the voice.", "The voice hears the disciple.", "The disciples hear the voice.", "The voice of the disciple."],
        note: "Subject-verb-object is normal Greek too; ὁ μαθητής is nominative singular." }
    ]},

    "17": { sentences: [
      { level: 1, g: "ἀγαπῶ τὸν θεόν.", en: "I love God.",
        choices: ["I love God.", "God loves me.", "We love God.", "I am loved by God."],
        note: "ἀγαπάω → ἀγαπῶ (rule 4: αω → ω)." },
      { level: 1, g: "ποιεῖ τὰ ἔργα τοῦ θεοῦ.", en: "He does the works of God.",
        choices: ["He does the works of God.", "God does his work.", "The works do God.", "He does God's work."],
        note: "ποιέω → ποιεῖ (rule 2: εε → ει)." },
      { level: 1, g: "πληροῦμεν τὸν νόμον.", en: "We fulfill the law.",
        choices: ["We fulfill the law.", "The law fulfills us.", "I fulfill the law.", "You fulfill the law."],
        note: "πληρόω → πληροῦμεν (rule 1: οο → ου)." }
    ]},

    "18": { sentences: [
      { level: 1, g: "ἔρχεται ὁ ἀπόστολος.", en: "The apostle is coming.",
        choices: ["The apostle is coming.", "The apostle goes away.", "The apostle was coming.", "The apostle comes back."],
        note: "ἔρχομαι is deponent — middle/passive in form, active in meaning." },
      { level: 1, g: "λυόμεθα ὑπὸ τοῦ θεοῦ.", en: "We are being loosed by God.",
        choices: ["We are being loosed by God.", "We loose God.", "God looses us.", "God is loosed by us."],
        note: "ὑπό + genitive marks the agent of a passive verb." },
      { level: 2, g: "πορεύομαι εἰς τὸν οἶκον.", en: "I am going into the house.",
        choices: ["I am going into the house.", "The house is going to me.", "He goes into the house.", "I go from the house."] }
    ]},

    "23": { sentences: [
      { level: 1, g: "ἐλύσαμεν τὸν δοῦλον.", en: "We loosed the slave.",
        choices: ["We loosed the slave.", "We are loosing the slave.", "We will loose the slave.", "The slave loosed us."],
        note: "Augment ε + stem λυ + tense formative σα + secondary endings = 1st aorist." },
      { level: 1, g: "ἐπίστευσεν ὁ ἄνθρωπος.", en: "The man believed.",
        choices: ["The man believed.", "The man believes.", "The man will believe.", "Believe, man!"] },
      { level: 2, g: "ἐδόξασεν τὸν θεόν.", en: "He glorified God.",
        choices: ["He glorified God.", "God glorified him.", "He glorifies God.", "God will glorify him."] }
    ]}

  };

  window.READER_TRANSLATION_SETS = SETS;
})();
