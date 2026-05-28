# `index.html` structure notes

Navigation map for the root `index.html` (currently ~685 lines). Keep this in
sync when you change the file — see "Maintenance" at the bottom.

Line numbers are approximate (drift a few lines between edits). When in doubt,
grep for the `id` rather than jumping to a line.

---

## Top-level layout

```
1     <!DOCTYPE html> / <head>      ← analytics, meta/PWA, manifest, theme bootstrap
53    <body>
54    <div class="app">              ← main shell (in-flow UI)
56       header, notice, quick-start, settings, deck, modals trigger
203   </div>
205   overlays (modals)              ← siblings of .app, position:fixed
643   <script defer …>               ← data + entry point
684   </body>
```

The `<div class="app">` shell is everything that scrolls in the page. Every
`<div class="consent-overlay" …>` is a top-level sibling of `.app` and is
shown/hidden by JS — never nest a new overlay inside `.app`.

---

## `<head>` (1–52)

- 2–6     Pointer comment to this structure doc
- 10–16   Google Analytics tag
- 17–24   PWA / icon / manifest meta (`?v=N` cache-bust param appears here and on every script/stylesheet)
- 26      `<link rel="stylesheet" href="styles.css?v=N">` — `styles.css` carries the bundled `@font-face` blocks for Gentium Plus (serif, `fonts/gentium-plus/`) and Noto Sans (sans, `fonts/noto-sans/`). No Google Fonts `<link>`: every woff2 ships with the app and is precached by `sw.js`. The sans variant also sets `font-size-adjust: 0.454` so Noto Sans's larger x-height visually matches Gentium Plus when the user toggles font family.
- 27–49   **Pre-paint inline script.** Reads `localStorage` and sets
          `data-theme` / `data-font-family` / `data-text-size` on `<html>`
          before first paint to avoid flash-of-wrong-theme. Don't move this.

> Cache-bust: every asset URL ends in `?v=NNN`. Bump the number on release.
> Same number lives in `sw.js` (`CACHE_NAME = 'mounce-bbg-greek-pwa-vNN'`
> plus the asset list). Both must agree.

---

## `<div class="app">` (54–203)

In-document order (these all render in the main column):

| Lines      | Element                                       | Notes |
|-----------:|-----------------------------------------------|-------|
|   56–69    | `<header>`                                    | Theme switcher (System/Dark/Light), Greek + English title, `#appSubtitle`, "Koine Greek Study Tool" tag |
|   71–74    | `.notice-row`                                 | Disclaimer button + `#appNotice` |
|   76–88    | `.quick-start`                                | Choose session / Start studying / mode strip (`#modeShortcutVocabBtn`, `…MorphBtn`, `…ParsingBtn`, `…ReaderBtn`) / Progress / User guide / `#modeShortcutMemorizationBtn` link to `pages/memorization.html` |
|   90–94    | `<details>` Progress tools                    | Export/Import progress buttons (open the transfer modal) |
|   96       | `.ornament`                                   | Decorative `✦ · · · ✦` |
|   98–157   | `<details id="advancedSettingsDetails">`      | Wraps **both** font/text-size prefs **and** `#controlsBar` toggles. The controls bar is not a separate section — it lives inside this `<details>`. |
|  117–155   | └ `#controlsBar`                              | Toggles: `#shuffleToggle`, `#requiredToggle`, `#hardReviewToggle`, `#directionToggle`, `#spacedToggle`, `#unspacedDailyResetToggle`, `#splitSelectionToggle` (hidden in parsing mode — parsing owns its chapter via `#parsingChapterSelect` and never shares with vocab/morph), `#selfCheckToggle` (hidden by default). Then the eight parsing-step master toggles (`#aspectStepToggle`, `#tenseStepToggle`, `#voiceStepToggle`, `#moodStepToggle`, `#personStepToggle`, `#numberStepToggle`, `#caseStepToggle`, `#genderStepToggle`), each followed by its own nested `<details id="<dim>ValuesFiltersDetails">` ("Exclude <dim> values…") containing per-value sub-toggles with IDs `#dimValueFilter_<dim>_<value>_Toggle` (e.g. `#dimValueFilter_tense_aorist_Toggle`, `#dimValueFilter_case_dative_Toggle`). Handler: `toggleDimValueFilter('<dim>','<value>')`. ON in the UI means **excluded** (the data-model value is `false`); default is OFF for everything (nothing excluded). Aspect collapses `continuous` + `undefined` into one combined UI key `continuousUndefined` (`#dimValueFilter_aspect_continuousUndefined_Toggle`) that flips both underlying values at once. Each value label carries the Mounce chapter where it's introduced (e.g. "Aorist (Ch. 22)"). The gender subfilter is a no-op for single-gender lemmas (most nouns) — only multi-gender paradigms (articles, adjectives, pronouns) are pruned. The gender step itself follows the same rule: parsing mode auto-skips it for single-gender lemmas (the form doesn't vary by gender, so asking it tests lemma-memory rather than form-parsing), but still names the gender in the final parse summary. Under the optional-forms toggle (`#optionalFormsToggle` — label "Optional paradigm extensions") is a further nested `<details id="optionalFormsFiltersDetails">` ("Filter optional forms by category…") with seven category sub-toggles (`#optionalFilter_imperative_Toggle`, `…_subjunctive_…`, `…_infinitive_…`, `…_participle_…`, `…_thirdPerson_…`, `…_futureTense_…`, `…_perfectTense_…`). `#excludeKnownMorphsToggle` ("Exclude known morphs (2/2)") sits at the TOP of the controls bar next to `#shuffleToggle` (parsing-mode-only, hidden in other modes) — off by default; on drops any form whose last two parsing attempts were both fully correct under the user's current dim toggles. Reset action grid (`#resetDeckBtn`, `#resetRequiredBtn`, `#resetKnownBtn`, `#clearParsingStatsBtn`, Reshuffle, Reset stats) follows; parsing mode hides `#resetDeckBtn` + `#resetRequiredBtn` and shows both `#resetKnownBtn` (clears every form's per-form `recent` tally back to 0/2 — the per-paradigm rolling `attempts` window is kept) and `#clearParsingStatsBtn` ("Clear parsing stats" — parsing-mode-only; wipes `runtime.paradigmStepStats` *entirely* incl. per-paradigm %, the per-mood/tense breakdown, and per-form tallies, and nothing else — vocab/morph/reader stats are untouched, since the global "Reset stats" never wrote paradigm stats). Both are toggled in `main.js` alongside `#resetKnownBtn`. |
|  159       | `#readerView`                                 | Empty mount point. Reader mode JS injects content here. |
|  161–163   | `#parsingChapterRow`                          | Parsing-mode-only "Current chapter" dropdown (`#parsingChapterSelect`, chapters 1–36) — drives `runtime.parsingChapter` and the chapter cap for paradigm gating in parsing mode. Hidden outside parsing mode. |
|  164–166   | `#paradigmFocusRowPrimary`                    | Focused-paradigm dropdown (`#paradigmFocusSelectPrimary`) — hidden unless in a mode that uses it |
|  166–171   | `#cardArea`                                   | **Main flashcard mount.** Contains a placeholder `.empty-state`; JS replaces it. |
|  173–178   | `#navRow`                                     | Prev / `#spacedUndoBtn` / `#navResetBtn` / `#navNextBtn` |
|  180–184   | `#markRow`                                    | Mark buttons: Hard (again) / Uncertain (pass) / Easy |
|  186–189   | `#fastForwardRow`                             | Fast-forward 1 day / 1 week (debug-ish). **Mounce-specific name** — duff calls it `#ffRow`. |
|  191–202   | `<section class="review-shell">`              | Bottom progress panel: `#reviewPanel` → `#reviewDeckTag`, `#reviewStats`, `#reviewSortRow`, `#reviewList` |

---

## Overlays (205–641) — siblings of `.app`

All use `class="consent-overlay"` + an `aria-hidden` toggle. Most use
`class="consent-modal"` inside. Open/close handlers live in JS.

| Lines      | id                            | Purpose |
|-----------:|-------------------------------|---------|
|  205–221   | `#transferOverlay`            | Import/export progress (textarea + file picker) |
|  223–431   | `#analyticsOverlay`           | "Progress and study time". Large; contains many `<details class="analytics-collapse" data-collapse-key="…">` sections — achievements, totalVocab (+ChapterMap, +Progress sub-collapses), selectedVocab (+Bar, +Progress), totalGrammar (incl. `#analyticsParadigmStepStatsBody` — per-paradigm rows that expand to a per-value mood/tense/voice breakdown, chapter-gated, derived live from `forms`), selectedGrammar (+Bar, +Progress), studyActivity, titles. Each section has a `…SummaryStatus` element JS updates. |
|  433–478   | `#studySelectorOverlay`       | "Choose session" — deselect buttons, `#sessionsGrid`, `#chaptersGrid`, `#supplementalGrid`, `#advancedGrid` (inside `#advancedSectionShell` `<details>`). Mounce uses the four-Parts + three-milestones session set (not duff's weekly presets). |
|  480–545   | `#shortcutsOverlay`           | User guide. **No changelog yet** — Mounce is not released. The duff equivalent embeds a `<details class="user-guide-changelog">` here; once Mounce ships, add one. |
|  547–565   | `#consentOverlay`             | First-run "Before you begin" consent (`#consentTitle`) |
|  567–589   | `#resetSpacedOverlay`         | Confirm reset of spaced review |
|  591–605   | `#resetStatsOverlay`          | Confirm reset of stats |
|  607–625   | `#resetUnspacedOverlay`       | Confirm reset of current (unspaced) deck |
|  627–641   | `#whatsNewV1_1Overlay`        | **Mounce-variant intro modal** — NOT a release announcement. Storage key `mounceBbgFlashcardsMounceVariantSeen`. Different role from duff's `#whatsNewVX_YOverlay` (which is a per-release "What's new" popup). When Mounce eventually does releases, decide whether to keep the variant intro and add a separate release modal, or repurpose this one. |
|  ~849      | `#updateAvailableBanner`      | Non-modal floating banner (class `update-banner`, NOT `consent-overlay`) shown when a new service worker has finished installing and is in the `waiting` state. Two buttons: Refresh (`applyAppUpdate()` → posts `{type:'SKIP_WAITING'}` to the waiting SW) and dismiss (`dismissAppUpdate()`). Wired up by the SW-registration block at the bottom of `js/app/main.js`. Starts with the `hidden` attribute. |

---

## Scripts (643–683)

Load order matters — `main.js` is the only `type="module"` and runs last. All
data files are plain `defer` globals that publish onto `window`.

Groups, in order:

- **Core data (643–647):** `words.js`, `morphology.js`, `lemma_inventory.js`, `supplemental.js`, `grammar.js`
- **Mounce paradigm + flip supplements (648–653):** `mounce_paradigms.js` (single Mounce-wide paradigm table — duff splits into `week_N_paradigms.js`), `stem_change_drills.js`, then chapter-mapped flip sets: `second_aorist_flip.js` (Ch 11), `w3_aorist_passive_flip.js` (Ch 14), `w3_perfect_active_flip.js` (Ch 15), `w4_mi_verb_principal_parts_flip.js` (Ch 18). The `wN_` prefix is the Mounce Part number, not a week.
- **Advanced vocabulary buckets (654–678):** `advanced/advanced_NN.js` (currently 01–25)
- **Reader (679–681):** `reader.js`, `reader_verse_literals.js`, `reader_translations.js`
- **Logic (682):** `pos_logic.js` (intentionally loaded before main)
- **Entry point (683):** `js/app/main.js` — the only ES module

When adding a new flip set / advanced bucket / supplemental, add the
`<script>` tag in the matching group and keep the `?v=NNN` aligned.

---

## Related files (not in this doc)

- `styles.css` — single multi-thousand-line stylesheet, also `?v=NNN`-busted.
- `sw.js` — service worker. `CACHE_NAME` (`mounce-bbg-greek-pwa-vNN`) + precache list must agree with `?v=NNN`.
- `manifest.json` — PWA manifest.
- `pages/memorization.html` — Paradigms page (linked from `.quick-start`). Has its own structure; not covered here.
- `js/`
  - `app/` — entry (`main.js`) and bootstrap
  - `data/` — vocab, morphology, paradigm tables, reader text, plus `supplementals/` and `advanced/`
  - `domain/` — model objects (cards, decks, paradigms)
  - `logic/` — POS / parsing logic
  - `state/` — global state, persistence
  - `ui/` — DOM rendering, modals, overlays
  - `utils/` — shared helpers

---

## Mounce ↔ duff differences (quick reference for ports)

This repo is a Mounce-flavoured port of the duff_study_tool. When porting a
duff PR here, watch for:

- **No changelog / no release modal.** Mounce's `#whatsNewV1_1Overlay` is the
  variant-intro modal (storage key `mounceBbgFlashcardsMounceVariantSeen`).
  Skip duff PRs that touch `#whatsNewVX_YOverlay`, the
  `WHATS_NEW_VX_Y_STORAGE_KEY` constant, or the inline
  `user-guide-changelog`.
- **Paradigm files** — Mounce has `mounce_paradigms.js`; duff has
  `week_N_paradigms.js`.
- **Flip-set filenames** — Mounce uses `wN_` (Mounce Part); duff uses
  `wN_` (week). Names look similar but the chapter mapping differs.
- **Sessions** — Mounce uses Mounce's four Parts + three cumulative
  milestones; duff uses lecture-week presets.
- **`fastForwardRow` vs `ffRow`** — same UI, different id.
- **PWA cache name** — Mounce: `mounce-bbg-greek-pwa-vNN`. Duff:
  `greek-flashcards-pwa-vNN-github-pages`.
- **`v=NNN` numbering is independent.** Don't sync the number with duff.
- **Off-the-record parsing mode** — Mounce omits `noteStudyInteraction()` in
  the morph-step handlers; preserve that when porting.

---

## Maintenance

**If you edit `index.html` and any of the following change, update this doc in
the same commit:**

- A section in `.app` is added, removed, reordered, or renamed.
- An overlay (`consent-overlay`) is added or removed.
- An `id` that other code refers to is added, removed, or renamed.
- The script load order or grouping changes (new data file, new bucket, etc.).
- The cache-bust scheme (`?v=NNN`) changes.

Line numbers drift — don't chase them obsessively, just keep them in the right
neighborhood. The tables above are the source of truth for *what exists*; line
numbers are a convenience.
