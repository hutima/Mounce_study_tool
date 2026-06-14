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
|  117–155   | └ `#controlsBar`                              | Toggles: `#shuffleToggle`, `#requiredToggle`, `#hardReviewToggle`, `#stemNotesToggle` ("Stem & declension notes", vocab-mode-only, default ON — handler `toggleStemNotes`, `runtime.stemNotes`; switches off all standard-card stem annotations at once: inline verbal/noun stems, the principal-parts line, the "declines like" hint tag), `#secondAoristCardsToggle` ("Second aorists as cards", vocab-mode-only, default OFF — handler `toggleSecondAoristCards`, `runtime.secondAoristCards`; when ON each second-aorist verb's aorist form joins the vocab deck as its own standalone card (e.g. εἶπον for λέγω, derived from the W3 flip set via `expandSecondAoristCards` in `js/domain/deck/filters.js`, deck-id suffix `::2aor`; placed deterministically about half a chapter-run away from its parent so the unshuffled order doesn't pair them back-to-back; the standalone card's "2 aor. of [parent]" parts line is suppressed on the question (Greek front) face — it names the answer — and only shows after the flip); stats are shared with the base card — every progress read/write strips the suffix (`progressCardId`), so reviewing εἶπον records onto λέγω's entry, and the spaced schedule grades the pair by its **weaker face**: the shared entry keeps each face's latest rating (`faceOutcomes.present` / `faceOutcomes.aorist`, see `resolveSharedFaceOutcome` in `js/app/main.js`) and applies the lower of the two, so a Hard aorist keeps the pair due even when the present is marked Easy (demotion only active while the toggle is on), while archive marks / cycle state / saved deck order stay per-card; changes deck contents, so flipping it rebuilds the deck), `#directionToggle`, `#spacedToggle`, `#unspacedDailyResetToggle`, `#splitSelectionToggle` (hidden in parsing mode — parsing owns its chapter via `#parsingChapterSelect` and never shares with vocab/morph), `#selfCheckToggle` (hidden by default). Then the eight parsing-step master toggles (`#aspectStepToggle`, `#tenseStepToggle`, `#voiceStepToggle`, `#moodStepToggle`, `#personStepToggle`, `#numberStepToggle`, `#caseStepToggle`, `#genderStepToggle`), each followed by its own nested `<details id="<dim>ValuesFiltersDetails">` ("Exclude <dim> values…") containing per-value sub-toggles with IDs `#dimValueFilter_<dim>_<value>_Toggle` (e.g. `#dimValueFilter_tense_aorist_Toggle`, `#dimValueFilter_case_dative_Toggle`). Handler: `toggleDimValueFilter('<dim>','<value>')`. ON in the UI means **excluded** (the data-model value is `false`); default is OFF for everything (nothing excluded). Aspect collapses `continuous` + `undefined` into one combined UI key `continuousUndefined` (`#dimValueFilter_aspect_continuousUndefined_Toggle`) that flips both underlying values at once. Each value label carries the Mounce chapter where it's introduced (e.g. "Aorist (Ch. 22)"). The gender subfilter is a no-op for single-gender lemmas (most nouns) — only multi-gender paradigms (articles, adjectives, pronouns) are pruned. The gender step itself follows the same rule: parsing mode auto-skips it for single-gender lemmas (the form doesn't vary by gender, so asking it tests lemma-memory rather than form-parsing), but still names the gender in the final parse summary. **Exception:** every 3rd-declension noun keeps the gender step — its gender isn't recoverable from the ending (`THIRD_DECLENSION_NOUN_LEMMAS` in `paradigm_focus.js`, derived from the `Nouns · 3rd declension` catalog entries: σάρξ fem., πνεῦμα neut.), so it passes into `buildMorphSteps` as the `thirdDeclensionNouns` set and only bypasses the auto-skip, not the gender value-filter (`cardPassesDimValueFilters` still treats it as single-gender, so a gender-exclude never wipes the paradigm). Under the optional-forms toggle (`#optionalFormsToggle` — label "Optional paradigm extensions") is a further nested `<details id="optionalFormsFiltersDetails">` ("Filter optional forms by category…") with seven category sub-toggles (`#optionalFilter_imperative_Toggle`, `…_subjunctive_…`, `…_infinitive_…`, `…_participle_…`, `…_thirdPerson_…`, `…_futureTense_…`, `…_perfectTense_…`). `#excludeKnownMorphsToggle` ("Exclude known morphs (2/2)") sits at the TOP of the controls bar next to `#shuffleToggle` (parsing-mode-only, hidden in other modes) — off by default; on drops any form whose last two parsing attempts were both fully correct under the user's current dim toggles. `#parsingShuffleAllToggle` ("Shuffle all paradigms (to chapter)") sits next to it (parsing-mode-only, handler `toggleParsingShuffleAll`, `runtime.parsingShuffleAll`, off by default) — on ignores the focused paradigm and pools every in-scope paradigm up to `runtime.parsingChapter`, shuffled together (`getAllParsingCards`); the `#paradigmFocusRowPrimary` dropdown is hidden while it's on. The dropdown itself also gains a per-category "↯ Shuffle all — &lt;type&gt;" entry (sentinel `__shuffleType__:<category>` via `makeCategoryShuffleValue`, pooled by `getCardsForParadigmCategory`) at the head of any optgroup with ≥2 concrete (non-aggregate) lemmas. `#parsingReverseToggle` ("English → Greek (pick the form)") sits next to it (also parsing-mode-only, hidden in other modes, off by default; handler `toggleParsingReverse`) — on flips parsing from the forward dimensional walk to a reverse MC: the card shows the requested parse (enabled dims only) and offers Greek forms from the focused paradigm to pick from (`renderParsingReverseCard` / `answerParsingReverseChoice` in `render.js`/`main.js`; state in `runtime.parsingReverse` + ephemeral `runtime.parsingReverseState`, persisted flag only). Picking is off the record like the rest of parsing — `answerParsingReverseChoice` records per-paradigm stats but omits `noteStudyInteraction()`. `#accentLookalikeToggle` ("Accent/breathing look-alike distractors", handler `toggleAccentLookalikes`, off by default, `runtime.accentLookalikes`) sits next to it but only shows while reverse is on — when enabled it adds a curated accent/breathing twin (relative ἥ vs article ἡ, demonstrative αὕτη vs intensive αὐτή, etc.) as a reverse-drill distractor; the twin table + `accentLookalikesFor` live in `morph_steps.js`, alongside `paradigmGapReason`/`lemmaInventoryGapReason` (forward-walk cutoffs when a pick names a value the paradigm lacks — third person for ἐγώ/σύ, vocative for the article/pronouns, aorist for εἰμί) and `confusableFormHints` (the "how to tell" summary tells). Reset action grid (`#resetDeckBtn`, `#resetRequiredBtn`, `#resetKnownBtn`, `#clearParsingStatsBtn`, Reshuffle, Reset stats) follows; parsing mode hides `#resetDeckBtn` + `#resetRequiredBtn` and shows both `#resetKnownBtn` (opens `#resetKnownOverlay` to clear a form's per-form `recent` tally back to 0/2 — scoped to either the focused paradigm or all of them; the per-paradigm rolling `attempts` window is kept) and `#clearParsingStatsBtn` ("Clear parsing stats" — parsing-mode-only; wipes `runtime.paradigmStepStats` *entirely* incl. per-paradigm %, the per-mood/tense breakdown, and per-form tallies, and nothing else — vocab/morph/reader stats are untouched, since the global "Reset stats" never wrote paradigm stats). Both are toggled in `main.js` alongside `#resetKnownBtn`. |
|  159       | `#readerView`                                 | Empty mount point. Reader mode JS injects content here. |
|  161–163   | `#parsingChapterRow`                          | Parsing-mode-only "Current chapter" dropdown (`#parsingChapterSelect`, chapters 1–36) — drives `runtime.parsingChapter` and the chapter cap for paradigm gating in parsing mode. Hidden outside parsing mode. |
|  164–166   | `#paradigmFocusRowPrimary`                    | Focused-paradigm dropdown (`#paradigmFocusSelectPrimary`) — hidden unless in a mode that uses it. Options come from `listAvailableParadigmsByCategory` (`js/domain/grammar/paradigm_focus.js`). Verbs Mounce splits across many principal-part lemma keys (λύω → 15, δίδωμι → 2) also get a summative **"<base> — all forms"** aggregate at the head of their category: a virtual lemma that pools every member's chapter-gated cards into one deck (and the full optional paradigm when the optional-extensions toggle is on). Membership is driven by `window.PARADIGM_VARIANT_FAMILIES` in `lemma_inventory.js`. Hidden while `#parsingShuffleAllToggle` is on; each category optgroup with ≥2 concrete lemmas also leads with a "↯ Shuffle all — <type>" pick (a `__shuffleType__:` sentinel that pools the whole category via `getCardsForParadigmCategory`). |
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
|  433–478   | `#studySelectorOverlay`       | "Choose session" — deselect buttons (incl. "Deselect book vocab" → `deselectAllBooks()`), `#sessionsGrid`, `#chaptersGrid`, `#supplementalGrid`, `#advancedGrid` (inside `#advancedSectionShell` `<details>`), then `#bookVocabSection` → `#bookVocabSectionShell` `<details>` → `#bookVocabGrid` (**NT Book Vocab**: per-book vocab grouped in 50s by in-book frequency; built by `buildBookVocabSelector()`; entries are `NTB::<BOOK>` / `NTB::<BOOK>::g::<N>` pseudo-keys that link to existing cards rather than carrying their own — resolved in `js/domain/deck/filters.js`). Mounce uses the four-Parts + three-milestones session set (not duff's weekly presets). |
|  480–545   | `#shortcutsOverlay`           | User guide. **No changelog yet** — Mounce is not released. The duff equivalent embeds a `<details class="user-guide-changelog">` here; once Mounce ships, add one. |
|  547–565   | `#consentOverlay`             | First-run "Before you begin" consent (`#consentTitle`) |
|  549–567   | `#resetKnownOverlay`          | Parsing-mode "Reset known" scope picker. Two actions: `confirmResetKnownFocused()` (clears the focused paradigm's per-form tally only) and `confirmResetKnownAll()` (clears every drilled paradigm's). On open, JS fills `#resetKnownFocusedLemma` + the `#resetKnownFocusedBtn` label with the focused lemma and hides the focused row/button (`#resetKnownFocusedRow`) when nothing is focused. Wired in `js/ui/navigation.js`; `resetKnownMorphs()` just opens this modal (falls back to a legacy all-paradigms `confirm` if the markup is missing). Reuses the `.reset-spaced-*` modal styles. |
|  567–589   | `#resetSpacedOverlay`         | Confirm reset of spaced review. Three actions: "Set all to now" (`confirmResetSpacedTimingOnly`), "Smooth schedule" (`confirmResetSpacedSmooth` — levels a due-date pile-up by pulling cards due >3 study-days out to earlier days so a similar number come due each day; never delays a card, never touches the 0–3-day window), and the danger-row "Reset progress" (`confirmResetSpacedProgress`) |
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
- **Mounce paradigm + flip supplements (648–653):** `mounce_paradigms.js` (single Mounce-wide paradigm table — duff splits into `week_N_paradigms.js`), `stem_change_drills.js`, then chapter-mapped flip sets: `second_aorist_flip.js` (`W3_SECOND_AORIST_FLIP`, Ch 22), `liquid_future_flip.js` (`W3_LIQUID_FUTURE_FLIP`, Ch 20), `w3_aorist_passive_flip.js` (`W3_AORIST_PASSIVE_FLIP`, Ch 24), `w3_perfect_active_flip.js` (`W3_PERFECT_ACTIVE_FLIP`, Ch 25), `w4_mi_verb_principal_parts_flip.js` (Ch 34). The `wN_` prefix is the Mounce Part number, not a week. Each flip card carries an optional `stem` (printed inline on both faces by `render.js`) and `keyVerb` (renders a "★ key verb" badge); `render.js`'s `verbStemAltHtml` derives the bracketed principal-parts line on standard chapter-vocab verb cards ("2 aor." / "fut." always; "aor. pass." / "pf." gated at the selection's Ch 24 / Ch 25) from the four verb flip sets, so they are the single source for those annotations. Third-declension chapter-vocab nouns likewise get an inline stem (genitive minus -ος, hyphen-tail genitives reconstructed) and a "declines like σάρξ" hint-line anchor (`DECLENSION_MODEL_BY_HEAD_RAW`), both gated at Ch 10; the `#stemNotesToggle` switches every one of these annotations off.
- **Advanced vocabulary buckets (654–678):** `advanced/advanced_NN.js` (currently 01–25)
- **NT Book Vocab (after the advanced buckets):** `nt_book_vocab.js` — **generated**; per-book lexeme lists (`window.NT_BOOK_VOCAB`) that link to existing cards (no new cards). Regenerate with `tools/gen_nt_book_vocab.js` (downloads SBLGNT/MorphGNT, resolves each NT lexeme to a Mounce card headword by accent-folded match) whenever the card inventory changes. **Mounce curation:** the generator strips standalone Greek spacing diacritics so Mounce's `᾽`+plain-capital spellings (e.g. `᾽Ιησοῦς`) fold to their MorphGNT lemmas, and aliases `ἄρχω → ἄρχωμαι`; ~95% of NT lexemes resolve, the rest (words Mounce doesn't teach) are omitted.
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
- **Shared localStorage origin.** Both apps are GitHub Pages project sites
  under the same `username.github.io` origin, so they see each other's
  localStorage. Never port duff's `greekFlashcardsState*` legacy-key
  handling (fallback reads or cleanup deletes) — Mounce reads/writes only
  its `mounceBbgFlashcards*` keys so the two apps can't adopt or destroy
  each other's saves.
- **Slash-alternate forms** — paradigm cells that list two spellings of one
  form (`ἐμέ / με`, `λύουσιν / λύουσι`) live hand-authored in
  `morphology.js`, where morph-drill mode shows both spellings on purpose.
  Duff strips the alternate at card *generation* (`paradigm_morphology.js`),
  so its drill cards lose the twin too. Mounce instead reduces to the primary
  spelling only inside the parsing pipeline (`primaryFormSpelling` in
  `js/domain/grammar/paradigm_focus.js`, applied before `isSingleFormShape`),
  so the parsing deck stops dropping these as phantom multi-word phrases while
  the morph drill keeps both. Port duff PRs touching that filter here, not in
  `morphology.js`.

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
