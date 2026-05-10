// ═══════════════════════════════════════════════════════════════════════
//  MOUNCE TRANSLATION DRILLS — synthetic phrases keyed by chapter
// ═══════════════════════════════════════════════════════════════════════
//
//  Each chapter's `sentences` array holds short Greek phrases built
//  (broadly) from vocabulary and grammar introduced through that Mounce
//  chapter. No NT verses — these are author-written practice sentences
//  so vocabulary scope can be controlled per chapter. Where a chapter
//  doesn't yet have a usable verb stock (Ch 4–14), the drills lean on
//  εἰμί/λέγω and nominal predications, mirroring Mounce's own examples.
//
//  Chapters 1–3, 5, 15, 26 introduce no new vocab in Mounce/BBG3 and
//  are intentionally left empty — the Translate tab simply renders no
//  drills for those chapters.
//
//  Schema (per drill):
//      { g, en, choices: [...], level: 1|2|3, note?: string }
//
//      level 1 = English-friendly word order
//      level 2 = mild reordering / Greek emphasis
//      level 3 = Greek-style ordering (verb-fronted / object-fronted)
//
//  ⚠ AI-DRAFTED — verify glosses against the chapter vocab and against
//  Mounce's own translations. Some forms peek slightly ahead of the
//  chapter (e.g. a finite verb where only εἰμί has been "officially"
//  taught); that follows Mounce's own informal early examples.
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
        note: "No article before either noun → predicate sense; an implied 'is' is normal." },
      { level: 1, g: "ζωὴ καὶ δόξα.", en: "Life and glory.",
        choices: ["Life and glory.", "The life and the glory.", "Of life and glory.", "Glory of life."],
        note: "Two nominatives joined by καί; no article = indefinite." }
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
        note: "Without articles either gloss is acceptable; Mounce often translates 'a kingdom of God' / 'God's kingdom' interchangeably." },
      { level: 1, g: "ὁ ἄλλος ἀπόστολος.", en: "The other apostle.",
        choices: ["The other apostle.", "Another apostle.", "The apostle is other.", "The other apostles."],
        note: "Attributive position: article + adj + noun." }
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
        choices: ["From the earth into the heavens.", "In the earth from the heavens.", "Of the earth and the heavens.", "By the earth in the heavens."] },
      { level: 1, g: "λέγω τὴν παραβολὴν τῷ ὄχλῳ.", en: "I speak the parable to the crowd.",
        choices: ["I speak the parable to the crowd.", "The crowd speaks the parable.", "I speak the crowd to the parable.", "We speak the parable to the crowd."],
        note: "Accusative object (τὴν παραβολήν) + dative indirect object (τῷ ὄχλῳ)." }
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
        note: "Substantival adjective: article + adj. alone = 'the good ones / good people.'" },
      { level: 1, g: "ὁ πιστὸς δοῦλος ἀγαπητός ἐστιν.", en: "The faithful slave is beloved.",
        choices: ["The faithful slave is beloved.", "The beloved slave is faithful.", "A faithful slave is beloved.", "The faithful slaves are beloved."],
        note: "Attributive πιστός (article-adj-noun) + predicate ἀγαπητός (no article, after εἰμί)." }
    ]},

    "10": { sentences: [
      { level: 1, g: "τὸ ὄνομα τοῦ θεοῦ.", en: "The name of God.",
        choices: ["The name of God.", "God's names.", "The God of the name.", "The name to God."],
        note: "ὄνομα is 3rd-decl. neuter (-ματος, τό); gen. sg. τοῦ θεοῦ modifies it." },
      { level: 1, g: "πᾶς ἄνθρωπος.", en: "Every person.",
        choices: ["Every person.", "All persons.", "The whole person.", "Each thing."],
        note: "πᾶς + anarthrous noun = 'every/each'; πᾶς ὁ ἄνθρωπος would be 'the whole person/all the person.'" },
      { level: 1, g: "τὸ σῶμα καὶ ἡ σάρξ.", en: "The body and the flesh.",
        choices: ["The body and the flesh.", "The flesh of the body.", "A body and flesh.", "Bodies and fleshes."] },
      { level: 2, g: "οὐδεὶς ἅγιος εἰ μὴ ὁ θεός.", en: "No one is holy except God.",
        choices: ["No one is holy except God.", "No one is God except the holy.", "Not even God is holy.", "Holy is no one but God's."],
        note: "οὐδείς + predicate adj. ἅγιος (no article) + εἰ μή 'except.'" },
      { level: 1, g: "ἓν τέκνον ἐν τῇ οἰκίᾳ.", en: "One child in the house.",
        choices: ["One child in the house.", "The child is one house.", "A house in one child.", "One of the children's houses."],
        note: "εἷς, μία, ἕν is the cardinal 'one'; ἕν is neuter to agree with τέκνον." }
    ]},

    "11": { sentences: [
      { level: 1, g: "ὁ πατήρ μου ἐν τοῖς οὐρανοῖς.", en: "My father (is) in the heavens.",
        choices: ["My father (is) in the heavens.", "I am the heavenly father.", "The father of my heavens.", "Our fathers in heaven."],
        note: "μου (enclitic gen. of ἐγώ) = 'my'; supply 'is.'" },
      { level: 1, g: "ἡμεῖς ἀδελφοί ἐσμεν.", en: "We are brothers.",
        choices: ["We are brothers.", "They are our brothers.", "You are brothers.", "We have brothers."],
        note: "ἡμεῖς is emphatic — the verb ἐσμεν alone already says 'we are.'" },
      { level: 1, g: "ὑμεῖς τέκνα τοῦ θεοῦ.", en: "You (pl.) are children of God.",
        choices: ["You (pl.) are children of God.", "We are children of God.", "The children of God are yours.", "You are God's child."],
        note: "Predicate nominative with implied εἰμί; ὑμεῖς is emphatic 'you' (plural)." },
      { level: 2, g: "ἡ χάρις καὶ ἡ ἐλπὶς ὑμῶν.", en: "Your grace and hope.",
        choices: ["Your grace and hope.", "Grace and our hope.", "The hope of your grace.", "You are grace and hope."],
        note: "Possessive genitive ὑμῶν trails both nouns it modifies." },
      { level: 3, g: "ἰδοὺ ὁ ἀνὴρ καὶ ἡ μήτηρ.", en: "Behold, the man and the mother.",
        choices: ["Behold, the man and the mother.", "Behold a man's mother.", "See the men and mothers.", "The man sees the mother."],
        note: "ἰδού is a fixed presentational particle, not a real imperative; ἀνήρ, μήτηρ are 3rd-decl." }
    ]},

    "12": { sentences: [
      { level: 1, g: "αὐτὸς ὁ διδάσκαλος λέγει.", en: "The teacher himself speaks.",
        choices: ["The teacher himself speaks.", "The same teacher speaks.", "His teacher speaks.", "The teacher speaks to him."],
        note: "αὐτός in predicate position with the article = intensive ('himself')." },
      { level: 1, g: "ὁ αὐτὸς διδάσκαλος.", en: "The same teacher.",
        choices: ["The same teacher.", "The teacher himself.", "His teacher.", "A different teacher."],
        note: "αὐτός in attributive position with the article = identical ('the same')." },
      { level: 1, g: "οἱ ὀφθαλμοὶ αὐτοῦ.", en: "His eyes.",
        choices: ["His eyes.", "The eyes themselves.", "He sees with eyes.", "His eye."],
        note: "αὐτοῦ (gen.) trailing a noun = possessive 'his.'" },
      { level: 2, g: "μόνος ὁ θεὸς ἅγιος.", en: "Only God (is) holy.",
        choices: ["Only God (is) holy.", "God alone holds.", "Holy God only.", "The holy one (is) God's."],
        note: "μόνος is a predicate-position adj. here ('only/alone'); supply 'is.'" },
      { level: 3, g: "πάλιν λέγει αὐτοῖς ὁ Ἰησοῦς.", en: "Again Jesus speaks to them.",
        choices: ["Again Jesus speaks to them.", "Again they speak to Jesus.", "Jesus speaks of them again.", "Once more they all speak."],
        note: "Verb-fronted clause; αὐτοῖς (dat. pl.) is the indirect object." }
    ]},

    "13": { sentences: [
      { level: 1, g: "οὗτος ὁ ἄνθρωπος.", en: "This man.",
        choices: ["This man.", "The man is this.", "That man.", "These men."],
        note: "οὗτος in predicate position (no article between it and ἄνθρωπος, but the noun has its own article) = attributive 'this.'" },
      { level: 1, g: "ἐκείνη ἡ γυνή.", en: "That woman.",
        choices: ["That woman.", "This woman.", "The woman is that one.", "Those women."],
        note: "ἐκεῖνος = 'that' (over there); follows the same predicate-with-articled-noun = 'that X' pattern as οὗτος." },
      { level: 1, g: "μακάριοι οἱ ἅγιοι.", en: "Blessed (are) the holy ones.",
        choices: ["Blessed (are) the holy ones.", "The holy ones are happy.", "The blessed are holy.", "Holy is the blessed."],
        note: "Substantival ἅγιοι ('the holy ones / saints') with predicate adj. μακάριοι first for emphasis." },
      { level: 2, g: "πολλοὶ μαθηταί ἀκολουθοῦσιν τῷ Ἰησοῦ.", en: "Many disciples are following Jesus.",
        choices: ["Many disciples are following Jesus.", "Jesus follows many disciples.", "There are many disciples of Jesus.", "Many disciples will follow Jesus."],
        note: "ἀκολουθέω takes a dative object (τῷ Ἰησοῦ)." },
      { level: 3, g: "ἡ δικαιοσύνη τοῦ θεοῦ μεγάλη ἐστίν.", en: "The righteousness of God is great.",
        choices: ["The righteousness of God is great.", "God is great righteousness.", "God's great righteousness.", "Righteousness is from a great God."],
        note: "μεγάλη is predicate (no article); 'is' is supplied/spelled out by ἐστίν." }
    ]},

    "14": { sentences: [
      { level: 1, g: "ὁ λόγος ὃν λέγει ὁ Ἰησοῦς.", en: "The word that Jesus speaks.",
        choices: ["The word that Jesus speaks.", "Jesus speaks of the word.", "The word is Jesus.", "Who is the word of Jesus?"],
        note: "Relative pronoun ὅς, ἥ, ὅ; ὅν is masc. acc. sg., agreeing with λόγος (its antecedent) but taking its case from its role inside the relative clause (object of λέγει)." },
      { level: 1, g: "ἡ ὁδὸς τῆς ἀληθείας.", en: "The way of truth.",
        choices: ["The way of truth.", "The true way.", "A way to truth.", "The truth of the way."],
        note: "Possessive/descriptive genitive — 'truth' modifies 'way.'" },
      { level: 1, g: "εἰρήνη ὑμῖν.", en: "Peace (be) to you.",
        choices: ["Peace (be) to you.", "You are peace.", "We have peace.", "Peace is yours."],
        note: "Verbless wish/greeting; dative ὑμῖν = 'to you.'" },
      { level: 2, g: "αἱ ψυχαὶ τῶν ἁγίων ἐν τῇ χειρὶ τοῦ θεοῦ.", en: "The souls of the holy ones (are) in the hand of God.",
        choices: ["The souls of the holy ones (are) in the hand of God.", "God's hand holds holy souls.", "The hand of God is in souls.", "Holy God is in the hand of souls."],
        note: "χειρί is dat. sg. of χείρ (3rd decl.); supply 'are.'" },
      { level: 3, g: "οὕτως ἠγάπησεν ὁ θεὸς τὸν κόσμον.", en: "Thus God loved the world.",
        choices: ["Thus God loved the world.", "God did not love the world.", "Thus the world loved God.", "Just so the world is God's."],
        note: "οὕτως = 'in this way / thus'; one of Mounce's most-quoted previews (Jn 3:16)." }
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
        note: "Subject-verb-object is normal Greek too; ὁ μαθητής is nominative singular." },
      { level: 1, g: "πιστεύομεν εἰς τὸν θεόν.", en: "We believe in God.",
        choices: ["We believe in God.", "God believes in us.", "I believe in God.", "We believe God."],
        note: "πιστεύω + εἰς + acc. = 'believe into / in' (idiomatic for trust)." }
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
        note: "πληρόω → πληροῦμεν (rule 1: οο → ου)." },
      { level: 2, g: "λαλεῖ ὁ προφήτης τῷ ὄχλῳ.", en: "The prophet speaks to the crowd.",
        choices: ["The prophet speaks to the crowd.", "The crowd speaks to the prophet.", "The prophet calls the crowd.", "The prophets speak."],
        note: "λαλέω → λαλεῖ (rule 2: εε → ει); dative ὄχλῳ = indirect object." },
      { level: 1, g: "ζητοῦμεν τὸν κύριον.", en: "We seek the Lord.",
        choices: ["We seek the Lord.", "The Lord seeks us.", "I seek the Lord.", "We find the Lord."],
        note: "ζητέω → ζητοῦμεν (rule 3: εο → ου)." }
    ]},

    "18": { sentences: [
      { level: 1, g: "ἔρχεται ὁ ἀπόστολος.", en: "The apostle is coming.",
        choices: ["The apostle is coming.", "The apostle goes away.", "The apostle was coming.", "The apostle comes back."],
        note: "ἔρχομαι is deponent — middle/passive in form, active in meaning." },
      { level: 1, g: "λυόμεθα ὑπὸ τοῦ θεοῦ.", en: "We are being loosed by God.",
        choices: ["We are being loosed by God.", "We loose God.", "God looses us.", "God is loosed by us."],
        note: "ὑπό + genitive marks the agent of a passive verb." },
      { level: 2, g: "πορεύομαι εἰς τὸν οἶκον.", en: "I am going into the house.",
        choices: ["I am going into the house.", "The house is going to me.", "He goes into the house.", "I go from the house."] },
      { level: 1, g: "ἀποκρίνεται ὁ μαθητὴς τῷ διδασκάλῳ.", en: "The disciple answers the teacher.",
        choices: ["The disciple answers the teacher.", "The teacher answers the disciple.", "The disciples answer the teacher.", "The disciple asks the teacher."],
        note: "ἀποκρίνομαι is deponent and takes a dative complement." },
      { level: 2, g: "δεῖ τὸν ἄνθρωπον πιστεύειν.", en: "It is necessary for the man to believe.",
        choices: ["It is necessary for the man to believe.", "The man must not believe.", "The man believes necessarily.", "We need the believing man."],
        note: "Impersonal δεῖ takes an accusative subject + infinitive (πιστεύειν previewed)." }
    ]},

    "19": { sentences: [
      { level: 1, g: "λύσομεν τοὺς δούλους.", en: "We will loose the slaves.",
        choices: ["We will loose the slaves.", "We were loosing the slaves.", "We loose the slaves.", "The slaves will loose us."],
        note: "Future-tense formative σ + primary endings: λυ + σ + ομεν." },
      { level: 1, g: "ἀκούσει ὁ ὄχλος τὸν λόγον.", en: "The crowd will hear the word.",
        choices: ["The crowd will hear the word.", "The crowd is hearing the word.", "The word hears the crowd.", "The crowd will speak the word."],
        note: "ἀκούω → ἀκούσω, ἀκούσει (3rd sg. future)." },
      { level: 1, g: "πιστεύσομεν τῷ κυρίῳ.", en: "We will believe the Lord.",
        choices: ["We will believe the Lord.", "We believe the Lord.", "The Lord will believe us.", "We trusted the Lord."],
        note: "πιστεύω takes a dative direct object." },
      { level: 2, g: "προσκυνήσει αὐτῷ πᾶς ὁ λαός.", en: "All the people will worship him.",
        choices: ["All the people will worship him.", "He worships all the people.", "All the people worship him.", "He will worship all the people."],
        note: "προσκυνέω takes a dative; subject πᾶς ὁ λαός = 'all the people / the whole people.'" },
      { level: 1, g: "ζήσει ὁ πιστεύων.", en: "The one who believes will live.",
        choices: ["The one who believes will live.", "The believer is alive.", "The one believing lived.", "The believer lives."],
        note: "ζάω → ζήσει (η-contract future of α-contract verb); ὁ πιστεύων previews substantival participle." }
    ]},

    "20": { sentences: [
      { level: 1, g: "ὁ θεὸς σώσει τὸν λαόν.", en: "God will save the people.",
        choices: ["God will save the people.", "The people save God.", "God is saving the people.", "God saved the people."],
        note: "σώζω future = σώσω (the inner ζ comes from a guttural root *σωδ-)." },
      { level: 1, g: "ἀποστελεῖ τοὺς ἀποστόλους εἰς τὸν κόσμον.", en: "He will send the apostles into the world.",
        choices: ["He will send the apostles into the world.", "The apostles send him into the world.", "He sends apostles in the world.", "He sent the apostles into the world."],
        note: "Liquid-stem future: ἀποστέλλω → ἀποστελῶ (no σ, accent shifts; circumflex)." },
      { level: 1, g: "γνώσεται τὴν ἀλήθειαν.", en: "He will know the truth.",
        choices: ["He will know the truth.", "He knows the truth.", "The truth will be known.", "He knew the truth."],
        note: "γινώσκω has a deponent future: γνώσομαι, γνώσῃ, γνώσεται." },
      { level: 2, g: "ἐγερεῖ ὁ θεὸς τὸν Ἰησοῦν ἐκ νεκρῶν.", en: "God will raise Jesus from the dead.",
        choices: ["God will raise Jesus from the dead.", "Jesus raises God from the dead.", "God is raising Jesus from death.", "God will rise from the dead with Jesus."],
        note: "Liquid future of ἐγείρω: ἐγερῶ → ἐγερεῖ (3rd sg.)." },
      { level: 3, g: "μενοῦμεν ἐν τῷ οἴκῳ τοῦ κυρίου.", en: "We will remain in the house of the Lord.",
        choices: ["We will remain in the house of the Lord.", "We remain in the Lord's house.", "We will leave the Lord's house.", "The Lord remains in our house."],
        note: "Liquid future of μένω: μενῶ, μενεῖς, μενεῖ, μενοῦμεν." }
    ]},

    "21": { sentences: [
      { level: 1, g: "ἐλύομεν τὸν δοῦλον.", en: "We were loosing the slave.",
        choices: ["We were loosing the slave.", "We loose the slave.", "We loosed the slave.", "We will loose the slave."],
        note: "Augment ε- + present stem + secondary endings = imperfect (continuous past)." },
      { level: 1, g: "ἤκουον οἱ μαθηταί.", en: "The disciples were listening.",
        choices: ["The disciples were listening.", "The disciples are listening.", "The disciples listened (one time).", "The disciple heard."],
        note: "Verbs starting with α/ο/ε get a temporal augment (lengthening); ἀκούω → ἤκουον." },
      { level: 1, g: "ἐδίδασκεν ὁ Ἰησοῦς τὸν ὄχλον.", en: "Jesus was teaching the crowd.",
        choices: ["Jesus was teaching the crowd.", "Jesus taught the crowd (one time).", "The crowd was teaching Jesus.", "Jesus is teaching the crowd."],
        note: "Imperfect stresses ongoing past action: 'kept on teaching.'" },
      { level: 2, g: "ἠκολούθουν αὐτῷ πολλοί.", en: "Many were following him.",
        choices: ["Many were following him.", "He followed many.", "Many follow him.", "He was following many."],
        note: "ἀκολουθέω takes a dative; subject πολλοί 'many (people).'" },
      { level: 3, g: "ἐν τῇ συναγωγῇ ἐδίδασκεν ὁ Ἰησοῦς.", en: "In the synagogue Jesus was teaching.",
        choices: ["In the synagogue Jesus was teaching.", "The synagogue was teaching Jesus.", "Jesus teaches the synagogue.", "Jesus taught against the synagogue."],
        note: "Prepositional phrase fronted; the imperfect ἐδίδασκεν still anchors the clause." }
    ]},

    "22": { sentences: [
      { level: 1, g: "εἶδον τὸν Ἰησοῦν.", en: "They saw Jesus.",
        choices: ["They saw Jesus.", "I saw Jesus.", "Jesus saw them.", "They see Jesus."],
        note: "εἶδον is 2nd aor. of ὁράω — same form for 1st sg. ('I saw') and 3rd pl. ('they saw'); context decides." },
      { level: 1, g: "ἦλθεν ὁ Ἰησοῦς εἰς τὸν οἶκον.", en: "Jesus came into the house.",
        choices: ["Jesus came into the house.", "Jesus comes into the house.", "Jesus was coming into the house.", "The house came to Jesus."],
        note: "ἦλθον is 2nd aor. of ἔρχομαι (deponent in present but active forms in aorist)." },
      { level: 1, g: "ἔλαβεν τὸν ἄρτον.", en: "He took the bread.",
        choices: ["He took the bread.", "He takes the bread.", "The bread took him.", "He gave the bread."],
        note: "λαμβάνω has 2nd aor. stem λαβ-; augment ε- + λαβ + ε(ν)." },
      { level: 2, g: "ἀπέθανεν ὁ προφήτης ἐν τῇ πόλει.", en: "The prophet died in the city.",
        choices: ["The prophet died in the city.", "The city killed the prophet.", "The prophet is dying in the city.", "The prophet dies for the city."],
        note: "ἀποθνῄσκω → 2nd aor. ἀπέθανον; ν-movable on 3rd sg." },
      { level: 3, g: "εἰσῆλθον εἰς τὸν οἶκον καὶ εὗρον τὸν ἄρτον.", en: "They entered the house and found the bread.",
        choices: ["They entered the house and found the bread.", "He entered the house and saw the bread.", "They will enter and find the bread.", "They enter the house and lose the bread."],
        note: "Two coordinated 2nd aorists: εἰσῆλθον (εἰσέρχομαι), εὗρον (εὑρίσκω)." }
    ]},

    "23": { sentences: [
      { level: 1, g: "ἐλύσαμεν τὸν δοῦλον.", en: "We loosed the slave.",
        choices: ["We loosed the slave.", "We are loosing the slave.", "We will loose the slave.", "The slave loosed us."],
        note: "Augment ε + stem λυ + tense formative σα + secondary endings = 1st aorist." },
      { level: 1, g: "ἐπίστευσεν ὁ ἄνθρωπος.", en: "The man believed.",
        choices: ["The man believed.", "The man believes.", "The man will believe.", "Believe, man!"] },
      { level: 2, g: "ἐδόξασεν τὸν θεόν.", en: "He glorified God.",
        choices: ["He glorified God.", "God glorified him.", "He glorifies God.", "God will glorify him."] },
      { level: 1, g: "ἐκήρυξεν τὸ εὐαγγέλιον τοῖς ὄχλοις.", en: "He preached the gospel to the crowds.",
        choices: ["He preached the gospel to the crowds.", "He preaches the gospel to the crowds.", "The crowds preached the gospel.", "He proclaimed crowds to the gospel."],
        note: "κηρύσσω + σ: σσ + σ → ξ → ἐκήρυξα; dative ὄχλοις = indirect object." },
      { level: 2, g: "ἔγραψα τὸν λόγον τοῦ θεοῦ.", en: "I wrote the word of God.",
        choices: ["I wrote the word of God.", "I write the word of God.", "God wrote his word.", "I will write God's word."],
        note: "γράφω + σα → ἔγραψα (φ + σ → ψ)." }
    ]},

    "24": { sentences: [
      { level: 1, g: "ἐλύθη ὁ δοῦλος.", en: "The slave was loosed.",
        choices: ["The slave was loosed.", "The slave looses.", "The slave will be loosed.", "He loosed the slave."],
        note: "Aorist passive: augment + stem + θη + secondary endings (no σα)." },
      { level: 1, g: "ἤχθη ὁ Ἰησοῦς εἰς τὸ ἱερόν.", en: "Jesus was led into the temple.",
        choices: ["Jesus was led into the temple.", "Jesus led them into the temple.", "Jesus leads in the temple.", "They will lead Jesus to the temple."],
        note: "ἄγω → aor. pass. ἤχθην (root *ἀγ- + θη → χθη, with χ from voicing assimilation)." },
      { level: 2, g: "ἐγερθήσεται ὁ Χριστὸς τῇ τρίτῃ ἡμέρᾳ.", en: "Christ will be raised on the third day.",
        choices: ["Christ will be raised on the third day.", "Christ raises on the third day.", "Christ was raised on the third day.", "On the third day Christ raises us."],
        note: "Future passive: stem + θη + σ + primary endings: ἐγερ-θη-σ-εται." },
      { level: 1, g: "ἐφοβήθη ὁ ὄχλος.", en: "The crowd was afraid.",
        choices: ["The crowd was afraid.", "The crowd fears.", "The crowd is afraid.", "He feared the crowd."],
        note: "φοβέομαι is deponent (middle/passive in form, active in meaning); aorist takes -θη-." },
      { level: 3, g: "ἐχάρησαν οἱ μαθηταὶ ἰδόντες τὸν κύριον.", en: "The disciples rejoiced when they saw the Lord.",
        choices: ["The disciples rejoiced when they saw the Lord.", "The disciples will rejoice and see the Lord.", "When the Lord saw the disciples, they rejoiced.", "The Lord rejoiced over the disciples."],
        note: "χαίρω uses 2nd aor. pass. ἐχάρην (no -θη-); ἰδόντες is aor. ptcp. previewed (Ch 28)." }
    ]},

    "25": { sentences: [
      { level: 1, g: "πεπίστευκα τῷ κυρίῳ.", en: "I have believed the Lord.",
        choices: ["I have believed the Lord.", "I believe the Lord.", "I believed the Lord.", "The Lord has believed me."],
        note: "Perfect = reduplication + stem + κα/α + primary endings; here πε-πίστευ-κα." },
      { level: 1, g: "λελύκαμεν τοὺς δούλους.", en: "We have loosed the slaves.",
        choices: ["We have loosed the slaves.", "We loosed the slaves.", "We loose the slaves.", "The slaves have loosed us."],
        note: "Reduplication λε- + stem λυ + κ + α-endings: λε-λύ-κ-αμεν." },
      { level: 1, g: "γέγραπται ἐν τῷ νόμῳ.", en: "It is written in the law.",
        choices: ["It is written in the law.", "He writes in the law.", "He wrote it in the law.", "He has written the law."],
        note: "Perfect mid./pass. of γράφω; reduplication γε- + stem γραφ + ται (3rd sg.); 'it stands written.'" },
      { level: 2, g: "ἀκήκοα τὸν λόγον τοῦ Χριστοῦ.", en: "I have heard the word of Christ.",
        choices: ["I have heard the word of Christ.", "I heard the word of Christ.", "Christ has heard my word.", "I will hear the word of Christ."],
        note: "ἀκούω has the Attic-reduplicated perfect ἀκήκοα (vowel doubling + lengthening)." },
      { level: 3, g: "μεμαρτύρηκεν περὶ τοῦ φωτὸς ὁ Ἰωάννης.", en: "John has testified concerning the light.",
        choices: ["John has testified concerning the light.", "John testifies about the light.", "The light has testified about John.", "John was testifying about the light."],
        note: "Perfect of μαρτυρέω: με-μαρτύρη-κε(ν); περί + gen. = 'concerning.'" }
    ]},

    "27": { sentences: [
      { level: 1, g: "λέγων ταῦτα ἦλθεν εἰς τὸν οἶκον.", en: "Saying these things, he came into the house.",
        choices: ["Saying these things, he came into the house.", "He said and came into the house.", "These things he says in the house.", "He spoke into the house."],
        note: "Present ptcp. λέγων = ongoing action contemporaneous with the main verb (ἦλθεν)." },
      { level: 1, g: "ὁ ἄνθρωπος ἀκούων τὸν λόγον πιστεύει.", en: "The man, while hearing the word, believes.",
        choices: ["The man, while hearing the word, believes.", "The man believed and heard the word.", "Whoever the word hears, believes.", "The hearing word believes the man."],
        note: "Adverbial ptcp. ἀκούων modifies the subject ἄνθρωπος; supply 'while.'" },
      { level: 2, g: "ἀναβαίνοντες εἰς Ἰεροσόλυμα ἐδίδασκεν αὐτούς.", en: "While going up to Jerusalem, he was teaching them.",
        choices: ["While going up to Jerusalem, he was teaching them.", "Going up to Jerusalem he taught them once.", "He went up to Jerusalem to teach them.", "They taught him as he went up to Jerusalem."],
        note: "Plural ptcp. ἀναβαίνοντες implies multiple people going up; main verb 3rd sg. — the ptcp. can refer to a wider group than the subject (or to subject + companions)." },
      { level: 1, g: "βλέπων τὸν Ἰησοῦν ἐχάρη.", en: "Seeing Jesus, he rejoiced.",
        choices: ["Seeing Jesus, he rejoiced.", "He saw Jesus and rejoices.", "Rejoicing, he sees Jesus.", "Jesus saw him and rejoiced."],
        note: "Present ptcp. of contemporaneous action with aorist main verb (ἐχάρη)." },
      { level: 3, g: "καθήμενος ἐν τῷ οἴκῳ ἐλάλει τοῖς μαθηταῖς.", en: "Sitting in the house, he was speaking to the disciples.",
        choices: ["Sitting in the house, he was speaking to the disciples.", "He sits in the house with his disciples.", "The disciples were sitting in the house, speaking.", "He spoke to the disciples about the house."],
        note: "κάθημαι is deponent; ptcp. καθήμενος (middle form) = 'sitting.'" }
    ]},

    "28": { sentences: [
      { level: 1, g: "ἀκούσας τὸν λόγον ἐπίστευσεν.", en: "Having heard the word, he believed.",
        choices: ["Having heard the word, he believed.", "Hearing the word, he believes.", "He heard the word and is believing.", "The word having heard, he hears."],
        note: "Aorist ptcp. ἀκούσας = action prior to main verb ἐπίστευσεν." },
      { level: 1, g: "εἰσελθὼν εἰς τὸν οἶκον ἐλάλησεν αὐτοῖς.", en: "Having entered the house, he spoke to them.",
        choices: ["Having entered the house, he spoke to them.", "Entering the house he speaks to them.", "He spoke in the house and entered.", "They spoke as he entered the house."],
        note: "2nd aor. ptcp. of εἰσέρχομαι: εἰσελθών, -οῦσα, -όν." },
      { level: 1, g: "ἰδὼν τὸν Ἰησοῦν ἐχάρη.", en: "Having seen Jesus, he rejoiced.",
        choices: ["Having seen Jesus, he rejoiced.", "Seeing Jesus, he is rejoicing.", "Jesus saw him and rejoiced.", "He saw Jesus rejoicing."],
        note: "ἰδών is 2nd aor. ptcp. of ὁράω; antecedent action to ἐχάρη." },
      { level: 2, g: "ἀσπασάμενοι τοὺς ἀδελφοὺς ἀπῆλθον.", en: "After greeting the brothers, they departed.",
        choices: ["After greeting the brothers, they departed.", "They greet the brothers and depart.", "The brothers greeted them as they left.", "The brothers were greeting them when they departed."],
        note: "Aor. mid. ptcp. ἀσπασάμενοι (ἀσπάζομαι is deponent); main verb ἀπῆλθον (2nd aor. of ἀπέρχομαι)." },
      { level: 3, g: "κράξας μεγάλῃ φωνῇ ἐξῆλθεν τὸ πνεῦμα.", en: "Crying out with a great voice, the spirit went out.",
        choices: ["Crying out with a great voice, the spirit went out.", "He cried out a great voice and left.", "With a great cry the voice went out.", "The voice spoke loudly and departed."],
        note: "κράζω → aor. ptcp. κράξας; dative of means μεγάλῃ φωνῇ; preview-style sentence in Mounce." }
    ]},

    "29": { sentences: [
      { level: 1, g: "ὁ πιστεύων εἰς τὸν Ἰησοῦν ἔχει ζωὴν αἰώνιον.", en: "The one who believes in Jesus has eternal life.",
        choices: ["The one who believes in Jesus has eternal life.", "Whoever has eternal life believes in Jesus.", "Jesus believes in the one having life.", "The one who lives forever believes Jesus."],
        note: "Substantival adjectival ptcp.: article + present ptcp. = 'the one who __.' Echoes Jn 3:16/36." },
      { level: 1, g: "οἱ ἀκούοντες τὸν λόγον σῴζονται.", en: "Those who hear the word are saved.",
        choices: ["Those who hear the word are saved.", "Those saved hear the word.", "Whoever saves them hears the word.", "The word saves the listeners."],
        note: "Substantival ptcp. as the subject; main verb σῴζονται is pres. mid./pass." },
      { level: 1, g: "ὁ πέμπων τοὺς ἀποστόλους ὁ θεός ἐστιν.", en: "The one who sends the apostles is God.",
        choices: ["The one who sends the apostles is God.", "God sends the apostles to him.", "The apostles' God sends them.", "Whoever sends apostles is god."],
        note: "Subject is the substantival ptcp. ὁ πέμπων; predicate nominative ὁ θεός after εἰμί." },
      { level: 2, g: "οἱ φέροντες τὰ τέκνα πρὸς τὸν Ἰησοῦν.", en: "Those bringing the children to Jesus.",
        choices: ["Those bringing the children to Jesus.", "The children bring others to Jesus.", "Those who Jesus brings children.", "Jesus brings the children to them."],
        note: "Substantival ptcp. as a stand-alone NP fragment; common in Gospel narration." },
      { level: 3, g: "ὁ ἐσθίων τὸν ἄρτον ζήσει εἰς τὸν αἰῶνα.", en: "The one who eats the bread will live forever.",
        choices: ["The one who eats the bread will live forever.", "The bread eats the one who lives forever.", "Whoever lives eats the bread of the age.", "The bread of life lives forever."],
        note: "Echoes Jn 6:58; εἰς τὸν αἰῶνα = idiomatic 'forever.'" }
    ]},

    "30": { sentences: [
      { level: 1, g: "πεπιστευκὼς εἰς τὸν Ἰησοῦν σώζεται.", en: "Having believed in Jesus, he is saved.",
        choices: ["Having believed in Jesus, he is saved.", "He believes in Jesus and is saved.", "The savior believes in Jesus.", "He is saved who will believe in Jesus."],
        note: "Perfect active ptcp. πεπιστευκώς — stative result of past believing." },
      { level: 1, g: "γεγραμμένον ἐστὶν ἐν τῷ νόμῳ.", en: "It is written (stands written) in the law.",
        choices: ["It is written (stands written) in the law.", "He writes in the law.", "He will write in the law.", "The writing is law."],
        note: "Periphrastic perfect: ptcp. γεγραμμένον (perf. mid./pass. of γράφω) + εἰμί." },
      { level: 2, g: "λέγοντος αὐτοῦ ταῦτα, ἦλθεν ὁ ὄχλος.", en: "While he was saying these things, the crowd came.",
        choices: ["While he was saying these things, the crowd came.", "He spoke and the crowd left.", "The crowd was saying these things as he came.", "These things the crowd said while he came."],
        note: "Genitive absolute: ptcp. + noun/pronoun both in the genitive, grammatically independent of the main clause." },
      { level: 2, g: "ἐλθόντος τοῦ Ἰησοῦ, ἐχάρησαν οἱ μαθηταί.", en: "When Jesus had come, the disciples rejoiced.",
        choices: ["When Jesus had come, the disciples rejoiced.", "Jesus came and rejoiced with the disciples.", "The disciples came rejoicing to Jesus.", "After the disciples came, Jesus rejoiced."],
        note: "Aorist genitive absolute = antecedent time ('when X had ___')." },
      { level: 3, g: "ὁ ἀπεσταλμένος ὑπὸ τοῦ θεοῦ λαλεῖ τὰ ῥήματα τοῦ θεοῦ.", en: "The one having been sent by God speaks the words of God.",
        choices: ["The one having been sent by God speaks the words of God.", "God sends words to those who speak.", "The sent one of God hears God's words.", "Whoever speaks for God is sent."],
        note: "Substantival perf. pass. ptcp. ὁ ἀπεσταλμένος (ἀποστέλλω); echoes Jn 3:34." }
    ]},

    "31": { sentences: [
      { level: 1, g: "ἵνα πιστεύσωμεν εἰς τὸν Ἰησοῦν.", en: "So that we might believe in Jesus.",
        choices: ["So that we might believe in Jesus.", "Because we believed in Jesus.", "We will believe in Jesus.", "If we believe in Jesus."],
        note: "ἵνα + subjunctive marks a purpose clause." },
      { level: 1, g: "ἐὰν ἀκούσῃς τὸν λόγον, ζήσῃ.", en: "If you hear the word, you will live.",
        choices: ["If you hear the word, you will live.", "If you live, you will hear the word.", "If we hear, we will live.", "Whoever hears lives."],
        note: "3rd class condition: ἐάν + subjunctive in protasis, future in apodosis." },
      { level: 2, g: "προσευχώμεθα τῷ θεῷ.", en: "Let us pray to God.",
        choices: ["Let us pray to God.", "We are praying to God.", "We were praying to God.", "Pray to God!"],
        note: "Hortatory subjunctive (1st pl.): 'let us ___.'" },
      { level: 1, g: "μὴ φοβώμεθα.", en: "Let us not be afraid.",
        choices: ["Let us not be afraid.", "We do not fear.", "Do not fear!", "We were not afraid."],
        note: "Negative hortatory: μή (not οὐ) is the negator with non-indicative moods." },
      { level: 3, g: "ὅπου ἂν ἔρχηται, ἀκολουθοῦμεν αὐτῷ.", en: "Wherever he goes, we follow him.",
        choices: ["Wherever he goes, we follow him.", "Whenever we follow, he comes.", "He follows us wherever we go.", "We come where he follows."],
        note: "ὅπου + ἄν + subjunctive = indefinite relative clause ('wherever ___')." }
    ]},

    "32": { sentences: [
      { level: 1, g: "θέλω ἀκούειν τὸν λόγον.", en: "I want to hear the word.",
        choices: ["I want to hear the word.", "I am hearing the word.", "I will hear the word.", "He wants to speak the word."],
        note: "Complementary infinitive after θέλω." },
      { level: 1, g: "δεῖ ἡμᾶς πιστεύειν τῷ θεῷ.", en: "It is necessary for us to believe in God.",
        choices: ["It is necessary for us to believe in God.", "We do not need to believe God.", "God needs us to believe.", "We believe God necessarily."],
        note: "Impersonal δεῖ + accusative of reference (ἡμᾶς) + infinitive." },
      { level: 1, g: "ἤρξαντο λέγειν πρὸς αὐτόν.", en: "They began to speak to him.",
        choices: ["They began to speak to him.", "They are speaking to him.", "He began to speak to them.", "They spoke to him."],
        note: "ἄρχομαι (mid.) takes a complementary infinitive." },
      { level: 2, g: "μέλλει ἔρχεσθαι ὁ Χριστός.", en: "Christ is about to come.",
        choices: ["Christ is about to come.", "Christ comes from afar.", "Christ has come.", "Christ should not come."],
        note: "μέλλω + infinitive = 'be about to ___ / be going to ___.'" },
      { level: 3, g: "ἐν τῷ λέγειν αὐτὸν ταῦτα, ἤκουσαν οἱ μαθηταί.", en: "While he was saying these things, the disciples heard.",
        choices: ["While he was saying these things, the disciples heard.", "The disciples spoke while hearing him.", "These things he said to the disciples after hearing.", "He heard the disciples saying these things."],
        note: "Articular infinitive ἐν τῷ + inf. + acc. subject = temporal 'while/when.'" }
    ]},

    "33": { sentences: [
      { level: 1, g: "πίστευε εἰς τὸν Ἰησοῦν.", en: "Believe in Jesus!",
        choices: ["Believe in Jesus!", "You believe in Jesus.", "Let him believe in Jesus.", "Do not believe in Jesus."],
        note: "Present active imperative 2nd sg.: πίστευ-ε." },
      { level: 1, g: "ἀκούετε τὸν λόγον τοῦ θεοῦ.", en: "Listen (pl.) to the word of God!",
        choices: ["Listen (pl.) to the word of God!", "You (pl.) listen to the word of God.", "We listen to the word of God.", "Do not hear the word of God."],
        note: "Present imperative 2nd pl. is identical in form to the indicative 2nd pl.; context decides." },
      { level: 1, g: "μὴ φοβοῦ.", en: "Do not be afraid.",
        choices: ["Do not be afraid.", "He is not afraid.", "Be afraid!", "Do not fear me."],
        note: "μή + present imperative 2nd sg. mid./pass. (φοβέομαι is deponent); often 'stop being / don't keep on being.'" },
      { level: 1, g: "ἀγαπᾶτε ἀλλήλους.", en: "Love one another!",
        choices: ["Love one another!", "You love one another.", "We love one another.", "They will love each other."],
        note: "Present imperative 2nd pl. of ἀγαπάω (contract: αε → α with circumflex)." },
      { level: 3, g: "ἐλθὲ καὶ ἴδε.", en: "Come and see!",
        choices: ["Come and see!", "He comes and sees.", "You came and saw.", "Coming, he sees."],
        note: "Two 2nd aor. imperatives 2nd sg.: ἐλθέ (ἔρχομαι), ἴδε (ὁράω). Compare Jn 1:46." }
    ]},

    "34": { sentences: [
      { level: 1, g: "δίδωσιν ὁ θεὸς τὸ πνεῦμα.", en: "God gives the Spirit.",
        choices: ["God gives the Spirit.", "The Spirit gives to God.", "God will give the Spirit.", "God gave the Spirit."],
        note: "δίδωμι is a μι-verb; 3rd sg. δίδωσι(ν) (reduplicated ι-prefix + stem δω/δο)." },
      { level: 1, g: "ἔδωκα ὑμῖν τὸν λόγον.", en: "I gave you the word.",
        choices: ["I gave you the word.", "You gave me the word.", "I give you the word.", "I will give you the word."],
        note: "1st aor. of δίδωμι uses κ instead of σ: ἔδωκα, ἔδωκας, ἔδωκε(ν)." },
      { level: 2, g: "παραδίδοται ὁ υἱὸς τοῦ ἀνθρώπου εἰς χεῖρας ἀνθρώπων.", en: "The Son of Man is being delivered into (the) hands of men.",
        choices: ["The Son of Man is being delivered into (the) hands of men.", "Men deliver the Son into their hand.", "The Son hands men over to himself.", "The hand of man hands over the Son."],
        note: "παραδίδοται = pres. mid./pass. 3rd sg.; echoes Mt 17:22." },
      { level: 1, g: "ἔπεσεν ὁ ἄνθρωπος ἐπὶ τὴν γῆν.", en: "The man fell upon the earth.",
        choices: ["The man fell upon the earth.", "The man is falling on the earth.", "The earth fell upon the man.", "The man will fall on the earth."],
        note: "πίπτω → 2nd aor. ἔπεσον (3rd sg. ἔπεσε(ν))." },
      { level: 3, g: "δοθήσεται ὑμῖν χάρις παρὰ τοῦ θεοῦ.", en: "Grace will be given to you from God.",
        choices: ["Grace will be given to you from God.", "You will give grace to God.", "God will give grace from you.", "Grace gives to you from God."],
        note: "Future passive of δίδωμι: δοθήσομαι, δοθήσῃ, δοθήσεται; παρά + gen. = 'from (the side of).'" }
    ]},

    "35": { sentences: [
      { level: 1, g: "εἰ πιστεύεις, σῴζῃ.", en: "If you believe, you are being saved.",
        choices: ["If you believe, you are being saved.", "If you save, you will believe.", "Believing, you are saved.", "Unless you believe, you are not saved."],
        note: "1st class condition: εἰ + indicative in the protasis, indicative in the apodosis. Assumes the premise for the sake of argument." },
      { level: 2, g: "ἐὰν ἁμαρτήσωμεν, ὁ θεὸς δικαιοῖ ἡμᾶς διὰ τοῦ Χριστοῦ.", en: "If we sin, God justifies us through Christ.",
        choices: ["If we sin, God justifies us through Christ.", "If God sins, Christ justifies us.", "We sin through Christ's justice.", "God will not justify those who sin."],
        note: "3rd class condition: ἐάν + subjunctive in protasis; present indicative in apodosis describes a general rule." },
      { level: 1, g: "ἐσταυρώθη ὁ Χριστὸς ὑπὲρ ἡμῶν.", en: "Christ was crucified on behalf of us.",
        choices: ["Christ was crucified on behalf of us.", "We crucified Christ.", "Christ crucifies for us.", "We were crucified with Christ."],
        note: "Aorist passive of σταυρόω; ὑπέρ + gen. = 'on behalf of / for.'" },
      { level: 2, g: "ἐφανερώθη ἡ σωτηρία τοῦ θεοῦ τοῖς ἁμαρτωλοῖς.", en: "The salvation of God was revealed to sinners.",
        choices: ["The salvation of God was revealed to sinners.", "Sinners revealed the salvation of God.", "God revealed sinners to salvation.", "Salvation reveals God's sinners."],
        note: "Aorist passive of φανερόω; dative ἁμαρτωλοῖς = indirect object of the passive verb." },
      { level: 3, g: "εἰ ἦν προφήτης, ἐγίνωσκεν ἂν τὴν ἁμαρτωλόν.", en: "If he were a prophet, he would know the sinful woman.",
        choices: ["If he were a prophet, he would know the sinful woman.", "Although he is a prophet, he knows the sinner.", "The prophet knows the sinful woman.", "If the prophet knows her, she is a sinner."],
        note: "2nd class (contrary-to-fact) condition: εἰ + impf. in protasis; ἄν + impf. in apodosis. Cf. Lk 7:39." }
    ]},

    "36": { sentences: [
      { level: 1, g: "ἔστησεν αὐτὸν ἐν μέσῳ.", en: "He stood him in the midst.",
        choices: ["He stood him in the midst.", "He stood in the middle of them.", "He was standing among them.", "They stood in the middle of him."],
        note: "1st aor. (transitive) of ἵστημι: ἔστησα, ἔστησας, ἔστησε(ν) = 'I/you/he set / made stand.'" },
      { level: 1, g: "ἀνέστη ὁ Ἰησοῦς ἐκ τῶν νεκρῶν.", en: "Jesus rose from the dead.",
        choices: ["Jesus rose from the dead.", "Jesus is raising the dead.", "Jesus will raise the dead.", "The dead rose with Jesus."],
        note: "2nd aor. (intransitive) of ἀνίστημι: ἀνέστην, ἀνέστης, ἀνέστη = 'I/you/he stood up.'" },
      { level: 1, g: "ἀφίημι ὑμῖν τὰς ἁμαρτίας.", en: "I forgive you (your) sins.",
        choices: ["I forgive you (your) sins.", "You forgive me my sins.", "I forgave you the sins.", "I will forgive your sins."],
        note: "ἀφίημι (ἀπό + ἵημι) = 'send away / forgive / let go'; takes dative of person + accusative of thing." },
      { level: 2, g: "τίθησιν τὰς χεῖρας ἐπὶ τὰ τέκνα.", en: "He places (his) hands on the children.",
        choices: ["He places (his) hands on the children.", "The children's hands are on him.", "He puts the children in his hands.", "He raised hands to the children."],
        note: "τίθημι is a μι-verb (root θε-/θη-): 3rd sg. τίθησι(ν); ἐπί + acc. = 'on/upon.'" },
      { level: 3, g: "ἀνοίγει ὁ Ἰησοῦς τοὺς ὀφθαλμοὺς τῶν τυφλῶν.", en: "Jesus opens the eyes of the blind.",
        choices: ["Jesus opens the eyes of the blind.", "The blind open the eyes of Jesus.", "Jesus' eyes are opened to the blind.", "The eyes of Jesus open the blind."],
        note: "ἀνοίγω uses double augment in aorist (ἀνέῳξα / ἤνοιξα); here it's a simple present indicative." }
    ]}

  };

  window.READER_TRANSLATION_SETS = SETS;
})();
