Mounce BBG Greek — Flashcards (PWA)
====================================

A static, offline-capable progressive web app for studying Koine Greek
alongside William D. Mounce, *Basics of Biblical Greek* (3rd ed.).
Hosted on GitHub Pages; works at a domain root or under a project
subpath.

This is the Mounce variant, forked from the original Duff/Wycliffe
build. Vocabulary comes verbatim from Paul Denisowski's BBG3 per-
chapter lists (bundled in this repo as bbg3_all.zip and unpacked at
build time into js/data/words.js). Grammar concepts and paradigm
sequence follow Mounce's published overheads (mounce.pdf in the repo
root).


FEATURE SET
-----------

Study modes (switched from the mode strip on the home screen)
- Vocab — Greek ↔ English flashcards with optional direction reversal.
- Grammar — multiple-choice parsing / morphology / concept questions
  aligned to Mounce's overheads (Noun Rules 1–8, Five Rules of
  Contraction, Three Uses of αὐτός, Master Verb Chart, Five Rules of
  μι Verbs, conditional-sentence classes, etc.) with inline notes
  and an optional self-check mode. Includes per-card gloss gating,
  tense-aware voice handling, and lemma overrides for irregulars.
- Parsing — step-by-step parsing drill against actual inflected
  forms drawn from the paradigm tables. Each card walks up to eight
  dimensions (aspect, tense, voice, mood, person, number, case,
  gender) one tap at a time; the walk is gated by chapter so values
  appear only after Mounce introduces them (e.g. aorist from Ch 22,
  perfect from Ch 25, subjunctive from Ch 31).
    * Per-step master toggles let you skip whole dimensions (e.g.
      turn off Aspect because it's derivable from tense, or turn off
      Gender for verbs).
    * Per-value sub-filters exclude specific values inside a step
      (e.g. drill present/imperfect only by excluding aorist and
      perfect tense). Each label carries the chapter where the value
      enters.
    * Continuous/undefined aspect collapses into one combined UI key
      so present/future composite forms are filtered together.
    * Voice is chapter-gated (only appears from Ch 15+, plus earlier
      for explicitly-deponent lemmas).
    * Gender step auto-skips for single-gender lemmas (form doesn't
      vary by gender) and the gender sub-filter is a no-op for them.
    * Per-card "Pass" button skips a single card without affecting
      stats. Stem-recall dead-ends redirect to the matching FLIP set
      (2nd aorist, aorist passive, perfect active, μι principal
      parts) so you train the stem change directly. Liquid-future
      stem substitutions are applied automatically.
    * Wrong-parse summary shows "Your parse" vs "Correct parse" with
      the Greek form, plus any other forms in the lemma that match
      your incorrect answer (so you learn what the syncretism looks
      like).
    * Optional paradigm extensions toggle exposes seven categories
      (imperatives, subjunctives, infinitives, participles, 3rd-
      person forms, future-tense forms, perfect-tense forms) which
      each have their own include/exclude switch. Full-paradigm
      extensions include the cumulative λύω deck with per-card
      chapter gate and the cumulative δίδωμι deck.
    * Off-the-record: parsing-step interactions do not bump the
      generic grammar study timer; they feed a dedicated paradigm-
      step ledger.
    * Current-chapter dropdown drives parsing-mode gating without
      mixing into vocab/morph selection.
- Translate — opens the precomputed graded NT reader. For each
  chapter N, the reader lists every NT verse whose every lemma is in
  the cumulative Mounce vocab through chapter N (joined on Strong's
  number). Verses come from the Robinson-Pierpont 2005 Byzantine
  Textform (public domain, textually close to the Textus Receptus).
  Every verse has a tap-to-reveal literal English gloss (working
  translations produced for study purposes, in
  `js/data/reader_verse_literals.js`). See "REGENERATING READER.JS"
  below.
- Memorization — separate page (`pages/memorization.html`) for
  guided paradigm memorization in Mounce's order, with full
  reference tables for the article, nouns, pronouns, adjectives, and
  verbs by tense. Toolbar can hide Greek, English, or notes for
  self-testing.

Session / set selectors
- Pre-built sessions — Mounce's four Parts (Introduction · Noun
  System · Indicative Verb · Nonindicative & μι), plus cumulative
  milestones through Ch 14, Ch 25, and all 36 chapters.
- Manual chapter selection — toggle individual chapters 1–36.
- Supplemental selector — chapter-keyed paradigm decks; multiple
  selections from any chapters can be active at once. A "Deselect
  all supplementals" control clears every supplemental selection
  while leaving chapter selections intact.

Deck controls (Advanced review settings panel)
- Shuffle, Required-only, Direction (Gk → En / En → Gk),
  Spaced review (SRS), Self-check (grammar mode).
- Hard review — drill only vocab you've missed more than 10 times
  and that's still under 40% confidence.
- Daily archive reset — auto-clear archived (Easy) cards once a day
  around 5 AM local time so unspaced decks start fresh.
- Split vocab/grammar selection — keep separate chapter selections
  for vocab and grammar modes. Hidden in parsing mode (parsing owns
  its own chapter via the parsing chapter dropdown).
- Eight per-step parsing master toggles (Aspect / Tense / Voice /
  Mood / Person / Number / Case / Gender) each with nested per-value
  "Exclude … values" sub-filters and chapter labels.
- Optional paradigm extensions master toggle with seven category
  filters for imperatives, subjunctives, infinitives, participles,
  3rd-person forms, future-tense forms, perfect-tense forms.
- Reset action grid: Reshuffle (re-order eligible cards without
  changing progress), Reset deck (clear the current selection),
  Reset required (clear only graded vocab in the current
  selection), Reset stats (wipe all global stats).

Spaced repetition
- Per-card SRS scheduler with ease-based intervals and a confidence
  signal. Due-only counts drive the visible deck length when spaced
  review is on. An undo affordance restores the last spaced action.
- Reset spaced modal offers two scopes: "Set all to now" (keep SRS
  progress but make every card due immediately) and "Reset progress"
  (clear all SRS scheduling for the deck). Either scope can be
  restricted to required cards only, useful before a quiz.
- Unspaced (flip-deck) behavior: Hard / Uncertain shuffle the card
  back to the middle pile (it'll reappear later in the same pass),
  Easy archives the card. The deck partitions cleanly so an Easy
  cap can't starve the active pile.

Progress tracking
- Marks per direction (known / uncertain / again) persist across
  sessions and survive deck reshuffles.
- Analytics overlay: hero summary, course completion, heatmap,
  achievements, time ledger (active study time, session history,
  foreground totals), per-chapter vocab / grammar breakdowns.
- Selected vs. Total split — separate analytics sections show
  progress for the sets you currently have chosen vs. course-wide.
  Each section has a confirmation summary box and per-chapter
  progress map.
- Paradigm parsing step-by-step section logs off-the-record
  parsing-drill stats per (paradigm × step), with a tappable bucket-
  of-20 performance chart per row that shows recent accuracy and an
  overall trend.
- Gamification: levels and usage stats fed by the analytics module.

Progress portability
- Export progress to a JSON file (download or copy from textarea).
- Import progress from text or a chosen JSON file. Schema-versioned
  with forward-compatible migrations in `js/state/migrations.js`.

App shell
- Theme switcher (System / Dark / Light) with first-paint inline
  theme bootstrap to avoid flashes. Light-mode parsing red/green
  are softened versions of the dark-mode palette.
- Font family preference (Serif / Sans). Gentium Plus is the
  bundled serif (body, display, and Greek); Noto Sans is the bundled
  sans, optical-height matched to Gentium Plus via
  `font-size-adjust` so the two families look the same size when
  toggled. Both fonts ship locally under `fonts/` and are precached
  by the service worker — no Google Fonts requests at runtime.
- Text size preference (Medium / Large / X-Large).
- Snappy hover transitions on buttons (0.08s).
- User-guide overlay with home-screen-tab walkthrough, advanced-
  settings walkthrough, spaced-repetition explainer, and keyboard
  shortcuts.
- Mounce-variant intro modal (one-time "Before you begin" for users
  arriving from the original duff build, storage key
  `mounceBbgFlashcardsMounceVariantSeen`).
- Disclaimer / consent modal ("unofficial student-made AI study aid").
- Service-worker caching with a versioned `CACHE_NAME` and per-asset
  `?v=` query strings so deployments invalidate cleanly.


REPOSITORY LAYOUT
-----------------
- index.html, styles.css, manifest.json, sw.js, favicon.svg, icons/
- fonts/                      — bundled Gentium Plus (serif) and
                                 Noto Sans (sans) WOFF2s
- pages/memorization.html
- mounce.pdf                  — Dr. Mounce's overheads (chapter-by-
                                 chapter teaching aids; canonical
                                 source for grammar concept order)
- bbg3_all.zip                — Paul Denisowski's BBG3 per-chapter
                                 vocab lists (raw source for
                                 words.js)
- docs/index-structure.md     — navigation map for index.html
                                 (sections, overlays, ids, scripts);
                                 keep in sync per CLAUDE.md
- scripts/                    — build scripts (e.g. build_reader.py)
- js/app/main.js              — entry point (ES module)
- js/data/                    — vocabulary, morphology, grammar,
                                 reader (+ verse literals +
                                 translations), parsing / concept /
                                 grammar examples, lemma inventory,
                                 set metadata
- js/data/supplementals/      — paradigm files: mounce_paradigms.js
                                 (single Mounce-wide table),
                                 stem_change_drills.js, plus
                                 chapter-mapped FLIP sets
                                 (second_aorist, w3_aorist_passive,
                                 w3_perfect_active,
                                 w4_mi_verb_principal_parts)
- js/data/advanced/           — advanced vocabulary buckets
                                 (advanced_01.js … advanced_25.js)
- js/logic/pos_logic.js       — parsing helpers
- js/utils/                   — helpers, time, storage, Greek sort
- js/domain/srs/              — SRS constants, scheduler, confidence
- js/domain/deck/             — ordering, filters
- js/domain/grammar/          — explanations
- js/domain/gamification/     — levels, usage stats
- js/state/                   — store, migrations
- js/ui/                      — DOM rendering: analytics, charts,
                                 keyboard, modals, navigation,
                                 progress, reader, render, selectors,
                                 toast, touchTapBridge


REGENERATING WORDS.JS
---------------------
The vocab is generated from bbg3_all.zip. To rebuild after editing
the underlying CSVs, unzip into a temporary directory and run a
script equivalent to /tmp/build_full_words.py used during the
initial Mounce port (see commit history for the working version).
Each entry follows the schema:
    { g: "headword (with parsing info)", e: "gloss(es)", required: true }


REGENERATING READER.JS
----------------------
The reader's NT verses are a derived dataset: for each chapter N,
include every NT verse whose every lemma is in the cumulative Mounce
vocab through chapter N (joined on Strong's number). Re-run when
words.js changes:

1. Clone the public-domain sources (one-time):
     git clone https://github.com/biblicalhumanities/Byzantine-Textform-Robinson-Pierpont-2005.git /tmp/rp
     git clone https://github.com/openscriptures/strongs.git /tmp/strongs
2. Run scripts/build_reader.py from the repo root.
3. The script writes js/data/reader.js, bump `?v=N` in index.html /
   sw.js if shipping a refreshed bundle.

The script lives at scripts/build_reader.py. Output shape:
    window.READER_CHAPTERS = [
      { chapter: N, verses: [ { g: "Greek …", r: "Mk 1:1" }, … ] },
      …
    ];


DEPLOYMENT
----------
1. Push to the branch configured for GitHub Pages.
2. Wait for the Pages deploy to finish.
3. Open the published URL once online so the service worker caches
   the new app shell.

When any cached file changes, bump:
- `CACHE_NAME` in `sw.js`,
- the matching `?v=N` for that file in `sw.js` and `index.html`.

Without those bumps the service worker will keep serving the old
cached assets after redeploy.


KNOWN BEHAVIOR
--------------
- Vocabulary progress is keyed by stable card IDs and survives most
  upgrades.
- Grammar / morphology IDs depend on item ordering within a chapter;
  large content reorderings are handled by versioned migrations
  (`STATE_MIGRATIONS`) that drop orphaned entries cleanly.
- This is an unofficial student-built study aid. Verify against
  Mounce's textbook, your instructor, and official course materials
  before relying on anything it says.
