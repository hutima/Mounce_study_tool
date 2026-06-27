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
|   98–157   | `<details id="advancedSettingsDetails">`      | Wraps **both** font/text-size prefs **and** `#controlsBar` toggles. The controls bar is not a separate section — it lives inside this `<details>`. The display-prefs block (font/text-size) also holds `#parsingLookupRow` — the parsing-only **"Build mode (look up any form)"** toggle (`#parsingLookupToggle` / switch `#parsingLookupBtn`, handler `toggleParsingLookup`, `runtime.parsingLookup`), promoted out of the controls bar to sit under Text size; shown only in parsing mode (`syncLayoutVisibility`). It gets the same injected (i) help button as the controls-bar toggles (`installToggleInfoButtons` now runs `installToggleInfoForContainer` over both `#controlsBar` and `#parsingLookupRow`). |
|  117–155   | └ `#controlsBar`                              | Toggles: `#shuffleToggle`, `#hardReviewToggle`, `#stemNotesToggle` ("Stem & declension notes", vocab-mode-only, default ON — handler `toggleStemNotes`, `runtime.stemNotes`; switches off all standard-card stem annotations at once: inline verbal/noun stems, the principal-parts line, the "declines like" hint tag), `#variantFormsDetails` ("Variant forms as cards", a vocab-mode-only `<details>` collapsible, summary count `#variantFormsCount`) — the generalization of the old single "Second aorists as cards" toggle. Holds `#irregularTenseToggle` ("Show tense on irregular cards", handler `toggleIrregularTense`, `runtime.irregularTense`, default ON — render-only; when OFF the derived card's "(aorist)" caption is replaced by a superscript star before the headword) plus five per-concept toggles `#irregularCards_<tag>_Toggle`/switch `…_Btn` for tags `2aor`/`lfut`/`aorpass`/`perfact`/`mi` (handler `toggleIrregularCards('<tag>')`). Config-driven by `IRREGULAR_CARD_CONFIGS` in `js/domain/deck/filters.js` (tag → flip set key + chapter + label + short form-tag): each enabled concept derives a standalone card for a verb's non-present principal part from the matching present-tense verb in the deck (εἶπον for λέγω, λέλυκα for λύω, ἔδωκα for δίδωμι …) via `expandIrregularCards`, deck-id suffix `::<tag>` (μι-verbs `::mi::<n>`). State is the per-tag override map `runtime.irregularCards` ({} = all auto): a toggle defaults **ON when its Mounce chapter is in the selection** (`isIrregularCardEnabled`: liquid futures Ch 20, second aorists Ch 22, aorist passives Ch 24, perfect actives Ch 25, μι-verbs Ch 34), an explicit click pins it on/off. The derived card's "<label> of [parent]" parts line is suppressed on the question (Greek front) face and a "(tense)" caption (`card-form-tag`, gated by `#irregularTenseToggle`) names its form there instead; placed about half a chapter-run from its parent. Stats are shared with the base card — `progressCardId` strips the suffix, so reviews record onto the parent, and the spaced schedule **gates advancement on all forms** as a per-set **round** (`applyVariantRoundReview` in `js/app/main.js`; `derivedCardFaceKey` + `getVariantCycleInfo`, keyed off how many deck cards share the progress id). A round is one attempt at the whole set, bounded by a 2h window from when its first face is seen (`cycleStartedAt`). Each face is marked until it reaches a **final** disposition: Easy (`cycleFacesPassed`) or Uncertain (`cycleFacesUncertain`); a Hard just **requeues** the face (no lapse, no round end), so it keeps coming back until Easy/Uncertain. A final face parks **out of "Due now"** (deferred) while a pending face stays due (`isCardDue`). The shared entry only grows once **every face is cleared Easy** in one round; any Uncertain in the mix — or the 2h window elapsing with faces still pending — **resets the whole set** to due-now for a fresh round. Each round close records one confidence sample (mean across faces, an unreached form 0%). Legacy saves' `secondAoristCards:true` migrates to `irregularCards['2aor']=true` (`sanitizeIrregularCards` in `persistence.js`); old `::2aor` saved-deck ids still resolve. Changes deck contents, so flipping a toggle rebuilds the deck), `#directionToggle`, `#spacedToggle`, `#cadenceToggle` ("2-month pace" — SRS spacing-cadence switch, **inverted**; vocab/grammar-only and shown only while spaced review is on; handler `toggleSpacingCadence`, `runtime.spacingCadence` is `'relaxed'`/`'intensive'`; **ON = the 2-month intensive preset**, OFF = the relaxed 8-month preset. New users pick their pace on the first-launch consent gate (`#consentPacingRow`), **defaulting to relaxed 8-month**; old/returning users keep `'intensive'` via their persisted value or the `DEFAULT_SRS_CADENCE = 'intensive'` fallback. The relaxed preset is the gentler one — near-linear easy growth (14 → 28 → 42 → 56 → 60) to a ~60-day (~2-month) cap, per-card difficulty, plus a leech drill for cards that keep lapsing — via `getActiveCadence()` + `SRS_CADENCE_PRESETS` in `js/domain/srs/constants.js`; only affects how future flips schedule), `#unspacedDailyResetToggle`, `#splitSelectionToggle` (**default ON** — separate chapter selections for vocab vs grammar; hidden in parsing mode, which owns its chapter via `#parsingChapterSelect` and never shares with vocab/morph), `#selfCheckToggle` (hidden by default). The eight parsing-step master toggles + the optional-forms section below are wrapped in **`#parsingStepOptions`**, hidden as a unit outside parsing mode (they only configure the parse walk, so they don't leak into vocab/grammar — `syncLayoutVisibility`). They are the eight parsing-step master toggles (`#aspectStepToggle`, `#tenseStepToggle`, `#voiceStepToggle`, `#moodStepToggle`, `#personStepToggle`, `#numberStepToggle`, `#caseStepToggle`, `#genderStepToggle`) — the Aspect step (`runtime.aspectStep`) defaults **OFF** (it's derivable from tense; turn it on to drill the composite-vs-single distinction), the other seven default on — each followed by its own nested `<details id="<dim>ValuesFiltersDetails">` ("Exclude <dim> values…") containing per-value sub-toggles with IDs `#dimValueFilter_<dim>_<value>_Toggle` (e.g. `#dimValueFilter_tense_aorist_Toggle`, `#dimValueFilter_case_dative_Toggle`). Handler: `toggleDimValueFilter('<dim>','<value>')`. ON in the UI means **excluded** (the data-model value is `false`); default is OFF for everything (nothing excluded). Aspect collapses `continuous` + `undefined` into one combined UI key `continuousUndefined` (`#dimValueFilter_aspect_continuousUndefined_Toggle`) that flips both underlying values at once. Each value label carries the Mounce chapter where it's introduced (e.g. "Aorist (Ch. 22)"). The gender subfilter is a no-op for single-gender lemmas (most nouns) — only multi-gender paradigms (articles, adjectives, pronouns) are pruned. The gender step itself follows the same rule: parsing mode auto-skips it for single-gender lemmas (the form doesn't vary by gender, so asking it tests lemma-memory rather than form-parsing), but still names the gender in the final parse summary. **Exception:** every 3rd-declension noun keeps the gender step — its gender isn't recoverable from the ending (`THIRD_DECLENSION_NOUN_LEMMAS` in `paradigm_focus.js`, derived from the `Nouns · 3rd declension` catalog entries: σάρξ fem., πνεῦμα neut.), so it passes into `buildMorphSteps` as the `thirdDeclensionNouns` set and only bypasses the auto-skip, not the gender value-filter (`cardPassesDimValueFilters` still treats it as single-gender, so a gender-exclude never wipes the paradigm). Under the optional-forms toggle (`#optionalFormsToggle` — label "Optional paradigm extensions") is a further nested `<details id="optionalFormsFiltersDetails">` ("Filter optional forms by category…") with eight category sub-toggles (`#optionalFilter_imperative_Toggle`, `…_subjunctive_…`, `…_optative_…`, `…_infinitive_…`, `…_participle_…`, `…_thirdPerson_…`, `…_futureTense_…`, `…_perfectTense_…`). `#excludeKnownMorphsToggle` ("Exclude known morphs (2/2)") sits at the TOP of the controls bar next to `#shuffleToggle` (parsing-mode-only, hidden in other modes) — off by default; on drops any form whose last two parsing attempts were both fully correct under the user's current dim toggles. `#parsingShuffleAllToggle` ("Shuffle all paradigms (to chapter)") sits next to it (parsing-mode-only, handler `toggleParsingShuffleAll`, `runtime.parsingShuffleAll`, off by default) — on ignores the focused paradigm and pools every in-scope paradigm up to `runtime.parsingChapter`, shuffled together (`getAllParsingCards`); the `#paradigmFocusRowPrimary` dropdown is hidden while it's on. The dropdown itself also gains a per-category "↯ Shuffle all — &lt;type&gt;" entry (sentinel `__shuffleType__:<category>` via `makeCategoryShuffleValue`, pooled by `getCardsForParadigmCategory`) at the head of any optgroup with ≥2 concrete (non-aggregate) lemmas. `#parsingCustomReviewToggle` ("Custom paradigm set", parsing-mode-only, handler `toggleParsingCustomReview`, `runtime.parsingCustomReview`, off by default, mutually exclusive with shuffle-all) sits next to it — on hides `#paradigmFocusRowPrimary` and shows the collapsible `#parsingCustomParadigmsRow` (`<details>`) checklist (`#parsingCustomParadigmsList`, count `#parsingCustomParadigmsCount`), pooling only the lemmas the user ticks (`runtime.parsingCustomParadigms`, a lemma→true map; deck via `getCardsForParadigmLemmas`; per-checkbox `toggleParsingCustomParadigm`, Select-all/Clear via `setAllParsingCustomParadigms`, list (re)rendered scroll-preserving by `syncParsingCustomParadigmsUi`). `#parsingReverseToggle` ("English → Greek (pick the form)") sits next to it (also parsing-mode-only, hidden in other modes, off by default; handler `toggleParsingReverse`) — on flips parsing from the forward dimensional walk to a reverse MC: the card shows the requested parse (enabled dims only) and offers Greek forms from the focused paradigm to pick from (`renderParsingReverseCard` / `answerParsingReverseChoice` in `render.js`/`main.js`; state in `runtime.parsingReverse` + ephemeral `runtime.parsingReverseState`, persisted flag only). Picking is off the record like the rest of parsing — `answerParsingReverseChoice` records per-paradigm stats but omits `noteStudyInteraction()`. `#accentLookalikeToggle` ("Accent/breathing look-alike distractors", handler `toggleAccentLookalikes`, off by default, `runtime.accentLookalikes`) sits next to it but only shows while reverse is on — when enabled it adds a curated accent/breathing twin (relative ἥ vs article ἡ, demonstrative αὕτη vs intensive αὐτή, etc.) as a reverse-drill distractor; the twin table + `accentLookalikesFor` live in `morph_steps.js`, alongside `paradigmGapReason`/`lemmaInventoryGapReason` (forward-walk cutoffs when a pick names a value the paradigm lacks — third person for ἐγώ/σύ, vocative for the article/pronouns, aorist for εἰμί) and `confusableFormHints` (the "how to tell" summary tells). Reset action grid (`#resetDeckBtn`, `#resetKnownBtn`, `#clearParsingStatsBtn`, Reshuffle, Reset stats) follows; parsing mode hides `#resetDeckBtn` and shows both `#resetKnownBtn` (opens `#resetKnownOverlay` to clear a form's per-form `recent` tally back to 0/2 — scoped to either the focused paradigm or all of them; the per-paradigm rolling `attempts` window is kept) and `#clearParsingStatsBtn` ("Clear parsing stats" — parsing-mode-only; wipes `runtime.paradigmStepStats` *entirely* incl. per-paradigm %, the per-mood/tense breakdown, and per-form tallies, and nothing else — vocab/morph/reader stats are untouched, since the global "Reset stats" never wrote paradigm stats). Both are toggled in `main.js` alongside `#resetKnownBtn`. Finally, every master toggle that carries a `title` gets an injected (i) `.toggle-info` button (`installToggleInfoButtons` in `main.js`, run once at startup) that opens `#toggleInfoOverlay` showing the toggle's `title` as touch-friendly help; per-value `dimValueFilter_*`/`optionalFilter_*` sub-toggles are skipped. |
|  159       | `#readerView`                                 | Empty mount point. Reader mode JS injects content here. |
|  161–163   | `#parsingChapterRow`                          | Parsing-mode-only "Current chapter" dropdown (`#parsingChapterSelect`, chapters 1–36) — drives `runtime.parsingChapter` and the chapter cap for paradigm gating in parsing mode. Hidden outside parsing mode. The dropdown also leads with a **"Build mode"** sentinel option (value `build`, const `PARSING_BUILD_MODE_VALUE`) that mirrors the `#parsingLookupToggle` — selecting it turns Lookup mode on, picking a real chapter turns it off; the two stay in sync. |
|  164–166   | `#paradigmFocusRowPrimary`                    | Focused-paradigm dropdown (`#paradigmFocusSelectPrimary`) — hidden unless in a mode that uses it. Options come from `listAvailableParadigmsByCategory` (`js/domain/grammar/paradigm_focus.js`). Verbs Mounce splits across many principal-part lemma keys (λύω → 15, δίδωμι → 2) also get a summative **"<base> — all forms"** aggregate at the head of their category: a virtual lemma that pools every member's chapter-gated cards into one deck (and the full optional paradigm when the optional-extensions toggle is on). Membership is driven by `window.PARADIGM_VARIANT_FAMILIES` in `lemma_inventory.js`. Hidden while `#parsingShuffleAllToggle` or `#parsingCustomReviewToggle` is on; each category optgroup with ≥2 concrete lemmas also leads with a "↯ Shuffle all — <type>" pick (a `__shuffleType__:` sentinel that pools the whole category via `getCardsForParadigmCategory`). |
|  166–171   | `#cardArea`                                   | **Main flashcard mount.** Contains a placeholder `.empty-state`; JS replaces it. In parsing **Build mode** (`runtime.parsingLookup`) it hosts the deck-independent lookup card (`renderMorphLookupCard` in `render.js`, driven by `js/domain/grammar/morph_lookup.js`) instead of the deck. |
|  173–178   | `#navRow`                                     | Prev / `#spacedUndoBtn` / `#navResetBtn` / `#navNextBtn` |
|  180–184   | `#markRow`                                    | Mark buttons: Hard (again) / Uncertain (pass) / Easy |
|  186–189   | `#fastForwardRow`                             | Fast-forward 1 day / 1 week (debug-ish). **Mounce-specific name** — duff calls it `#ffRow`. |
|  191–202   | `<section class="review-shell">`              | Bottom progress panel: `#reviewPanel` → `#reviewDeckTag`, `#reviewStats`, `#reviewSortRow`, `#reviewList`, plus a collapsible **"Due by day"** histogram (`buildDueHistogramHtml` in `progress.js`; a `.due-histogram` `<details>` whose open-state persists in `runtime.analyticsCollapsed['dueByDayPanel']` via inline `onDueHistogramToggle`). The same builder renders an analytics-overlay copy (`#analyticsDueHistogram`, `{collapseKey:'dueByDay'}`). In spaced mode the histogram's "now" column is the active+middle session set — the same as the `#reviewStats` "Due now" count (so the stat, the "Due later" remainder, and the chart agree) — with separate "today"/per-day columns. Deferred cards bucket by **calendar** day (local time): "today" runs until tonight's midnight, then one column per calendar day out to a "14d+" overflow. (SRS *scheduling* still uses the 24N−2h day model — `msFromDays`/`daysFromMs`; only the histogram's deferred buckets are calendar days. Parsing's deck is ordered by `orderParsingPool` — a status-weighted shuffle with a per-session repeat budget.) |

---

## Overlays (205–641) — siblings of `.app`

All use `class="consent-overlay"` + an `aria-hidden` toggle. Most use
`class="consent-modal"` inside. Open/close handlers live in JS.

| Lines      | id                            | Purpose |
|-----------:|-------------------------------|---------|
|  205–221   | `#transferOverlay`            | Import/export progress (textarea + file picker) |
|  223–431   | `#analyticsOverlay`           | "Progress and study time". Large; contains many `<details class="analytics-collapse" data-collapse-key="…">` sections — achievements, totalVocab (+ChapterMap, +Progress sub-collapses), selectedVocab (+Bar, +Progress), totalGrammar (incl. `#analyticsParadigmStepStatsBody` — per-paradigm rows that expand to a per-value mood/tense/voice breakdown, chapter-gated, derived live from `forms`), selectedGrammar (+Bar, +Progress), studyActivity, titles. Each section has a `…SummaryStatus` element JS updates. |
|  433–478   | `#studySelectorOverlay`       | "Choose session" — deselect buttons (incl. "Deselect book vocab" → `deselectAllBooks()`), `#sessionsGrid`, `#chaptersGrid`, `#irregularGrid` (inside `#irregularSectionShell` `<details>`, meta `#irregularSectionMeta`; the stem-flip **"Irregular practice"** sets — second-aorist / liquid-future / aorist-passive / perfect-active / μι-verb flashcards, changed letters diff-highlighted — pulled out of the per-week Supplemental groups into their own section since they span the course; built by `buildIrregularPracticeSelector()`, cleared by `deselectAllIrregular()`; `isFlipSet` detects them via the `stemFlip` card flag), `#supplementalGrid` (inside `#supplementalSectionShell` `<details>`, meta `#supplementalSectionMeta`; `buildSupplementalSelector()` skips flip sets and calls `buildIrregularPracticeSelector()` at its end so both stay in sync), `#advancedGrid` (inside `#advancedSectionShell` `<details>`), then `#bookVocabSection` → `#bookVocabSectionShell` `<details>` → `#bookVocabGrid` (**NT Book Vocab**: per-book vocab grouped in 50s by in-book frequency; built by `buildBookVocabSelector()`; entries are `NTB::<BOOK>` / `NTB::<BOOK>::g::<N>` pseudo-keys that link to existing cards rather than carrying their own — resolved in `js/domain/deck/filters.js`). Mounce uses the four-Parts + three-milestones session set (not duff's weekly presets). |
|  480–545   | `#shortcutsOverlay`           | User guide. **No changelog yet** — Mounce is not released. The duff equivalent embeds a `<details class="user-guide-changelog">` here; once Mounce ships, add one. |
|  547–565   | `#consentOverlay`             | First-run "Before you begin" consent (`#consentTitle`). Also hosts a first-launch **study-pace chooser** (`#consentPacingRow`, radios `name="consentPacing"`, values `relaxed`/`intensive`, **default `relaxed`** = 8-month). Shown only in the first-run (require-agreement) state — hidden when the disclaimer is reopened later (`openDisclaimerModal` in `modals.js`). On accept, `handleConsentAction` reads the checked radio and calls the `setSpacingCadence` host hook (`configureModals` in `main.js`) → sets `runtime.spacingCadence` + saves. Old/returning users never reach this branch, so they keep their persisted (intensive) cadence. |
|  549–567   | `#resetKnownOverlay`          | Parsing-mode "Reset known" scope picker. Two actions: `confirmResetKnownFocused()` (clears the focused paradigm's per-form tally only) and `confirmResetKnownAll()` (clears every drilled paradigm's). On open, JS fills `#resetKnownFocusedLemma` + the `#resetKnownFocusedBtn` label with the focused lemma and hides the focused row/button (`#resetKnownFocusedRow`) when nothing is focused. Wired in `js/ui/navigation.js`; `resetKnownMorphs()` just opens this modal (falls back to a legacy all-paradigms `confirm` if the markup is missing). Reuses the `.reset-spaced-*` modal styles. |
|  567–589   | `#resetSpacedOverlay`         | Confirm reset of spaced review. Three actions: "Set selected to now" (`confirmResetSpacedTimingOnly`), "Smooth schedule" (`confirmResetSpacedSmooth` — levels a due-date pile-up by pulling cards due >3 study-days out to earlier days so a similar number come due each day; never delays a card, never touches the 0–3-day window), and the danger-row "Reset selected" (`confirmResetSpacedProgress`). **No required/optional scope toggle** — Mounce's core vocab is all `required:true`, so duff #317's "required cards only" reset scope is dropped here; reset always targets the whole current selection |
|  591–605   | `#resetStatsOverlay`          | Confirm reset of stats |
|  607–625   | `#resetUnspacedOverlay`       | Confirm reset of current (unspaced) deck |
|  ~625      | `#toggleInfoOverlay`          | Per-toggle help modal (`#toggleInfoTitle` + `#toggleInfoBody`). Opened by the injected (i) buttons on Advanced-settings toggles (`showToggleInfo` in `main.js`); the body is the toggle's own `title`. Close via `closeToggleInfoModal()` / Esc. |
|  627–641   | `#whatsNewV1_1Overlay`        | **Mounce-variant intro modal** — NOT a release announcement. Storage key `mounceBbgFlashcardsMounceVariantSeen`. Different role from duff's `#whatsNewVX_YOverlay` (which is a per-release "What's new" popup). When Mounce eventually does releases, decide whether to keep the variant intro and add a separate release modal, or repurpose this one. |
|  ~972      | `#refreshAvailableOverlay`     | **Blocking** "update available" modal (a `.consent-overlay`/`.consent-modal`, like the reset prompts) shown when a new service worker has finished installing and is `waiting`. Single action — **Refresh now** (`applyAppUpdate()` → posts `{type:'SKIP_WAITING'}` then reloads). Shown by `showAppUpdatePrompt(worker)` (adds `.show` + `aria-hidden=false` + `body.modal-open`); `dismissAppUpdate()` hides it. Replaced the old non-modal `#updateAvailableBanner` corner banner, which was too easy to miss (users stayed stranded on a stale cache). Wired up by the SW-registration block at the bottom of `js/app/main.js`. |

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
- **Irregular-practice selector** — Mounce surfaces the stem-flip sets in a
  dedicated **"Irregular practice"** section (`#irregularGrid`,
  `buildIrregularPracticeSelector`), but orders them **by week/Part** (the flip
  sets' `set.week`), *not* by chapter. Duff's version rides on its
  chapter-regrouped Supplemental selector (#269–#272) and its
  `chapterForSet`/`WEEK_FIRST_CHAPTER`/`CHAPTER_TITLES`/`HIDDEN_SUPPLEMENTAL_KEYS`
  helpers — all of which Mounce deliberately skipped. Mounce keeps its
  week-grouped `buildSupplementalSelector`, just (a) skips flip sets there via
  `isFlipSet` and (b) lists them in the new section, reusing a shared
  `renderSupplementalEntry`. No hidden drill-source set
  (`W4_SECOND_AORIST_STEMS`) exists in Mounce, so there's no
  `HIDDEN_SUPPLEMENTAL_KEYS`.
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
