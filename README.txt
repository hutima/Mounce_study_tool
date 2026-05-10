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
sequence follow Mounce's published overheads (mounce_overheads.pdf in
the repo root).


FEATURE SET
-----------

Study modes
- Vocab — Greek ↔ English flashcards with optional direction reversal.
- Grammar — multiple-choice parsing / morphology / concept questions
  aligned to Mounce's overheads (Noun Rules 1–8, Five Rules of
  Contraction, Three Uses of αὐτός, Master Verb Chart, Five Rules of
  μι Verbs, conditional-sentence classes, etc.) with inline notes
  and an optional self-check mode.
- Translate — short author-written Greek phrases per chapter, scoped
  to vocab and grammar introduced through that chapter. (No NT-verse
  curation in the Mounce variant.)
- Memorization — separate page (`pages/memorization.html`) for guided
  paradigm memorization in Mounce's order.

Session / set selectors
- Pre-built sessions — Mounce's four Parts (Introduction · Noun
  System · Indicative Verb · Nonindicative & μι), plus cumulative
  milestones through Ch 14, Ch 25, and all 36 chapters.
- Manual chapter selection — toggle individual chapters 1–36.
- Supplemental selector — chapter-keyed paradigm decks; multiple
  selections from any chapters can be active at once. A "Deselect
  all supplementals" control clears every supplemental selection
  while leaving chapter selections intact.

Deck controls
- Shuffle, Required-only, Direction (Gk → En / En → Gk),
  Spaced review (SRS), Self-check (grammar mode).
- Reshuffle eligible cards, reset the current deck, or reset all
  stats from the advanced-settings panel.

Spaced repetition
- Per-card SRS scheduler with ease-based intervals and a confidence
  signal. Due-only counts drive the visible deck length when spaced
  review is on. An undo affordance restores the last spaced action.

Progress tracking
- Marks per direction (known / uncertain / again) persist across
  sessions and survive deck reshuffles.
- Analytics overlay: hero summary, course completion, heatmap,
  achievements, time ledger (active study time, session history,
  foreground totals), per-chapter vocab / grammar breakdowns.
- Gamification: levels and usage stats fed by the analytics module.

Progress portability
- Export progress to a JSON file (download or copy from textarea).
- Import progress from text or a chosen JSON file. Schema-versioned
  with forward-compatible migrations in `js/state/migrations.js`.

App shell
- Theme switcher (System / Dark / Light) with first-paint inline
  theme bootstrap to avoid flashes.
- Keyboard shortcuts modal.
- Disclaimer / consent modal ("unofficial student-made AI study aid").
- Service-worker caching with a versioned `CACHE_NAME` and per-asset
  `?v=` query strings so deployments invalidate cleanly.


REPOSITORY LAYOUT
-----------------
- index.html, styles.css, manifest.json, sw.js, favicon.svg, icons/
- pages/memorization.html
- mounce_overheads.pdf      — Dr. Mounce's overheads (chapter-by-
                               chapter teaching aids; canonical
                               source for grammar concept order)
- bbg3_all.zip               — Paul Denisowski's BBG3 per-chapter
                               vocab lists (raw source for words.js)
- js/app/main.js              — entry point (ES module)
- js/data/                    — vocabulary, morphology, grammar,
                                 reader, memorization, parsing /
                                 concept / grammar examples, set
                                 metadata
- js/data/supplementals/      — per-chapter paradigm files
- js/logic/pos_logic.js       — parsing helpers
- js/utils/                   — helpers, time, storage, Greek sort
- js/domain/srs/              — SRS constants, scheduler, confidence
- js/domain/deck/             — ordering, filters
- js/domain/grammar/          — explanations
- js/domain/gamification/     — levels, usage stats
- js/state/                   — store, migrations


REGENERATING WORDS.JS
---------------------
The vocab is generated from bbg3_all.zip. To rebuild after editing
the underlying CSVs, unzip into a temporary directory and run a
script equivalent to /tmp/build_full_words.py used during the
initial Mounce port (see commit history for the working version).
Each entry follows the schema:
    { g: "headword (with parsing info)", e: "gloss(es)", required: true }


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
