# Repository notes for Claude

## Navigation

- **`index.html` structure:** see `docs/index-structure.md` before scanning
  the file. It maps the in-flow `.app` shell, the overlay siblings, and the
  script groups by line range and `id`.

## Maintenance rules

- **Keep `docs/index-structure.md` in sync.** If you edit `index.html` and
  any of the following change, update the doc in the same commit:
  - a section in `.app` is added, removed, reordered, or renamed
  - an overlay (`consent-overlay`) is added or removed
  - an `id` referenced by JS is added, removed, or renamed
  - the script load order / grouping changes
  - the `?v=NNN` cache-bust scheme changes
- Line numbers in the doc are approximate — don't chase a few lines of drift,
  but do refresh them when a section moves significantly.

## Cache-bust

Every asset URL in `index.html` ends in `?v=NNN`. The same number lives in
`sw.js` (`CACHE_NAME = 'mounce-bbg-greek-pwa-vNN'` and the precache list).
Bump both together on release.

## Porting from duff_study_tool

This repo is a Mounce-flavoured port of `hutima/duff_study_tool`. The
"Mounce ↔ duff differences" section of `docs/index-structure.md` captures
the persistent gotchas (changelog absence, paradigm-file naming, session
presets, off-the-record parsing). Consult it before applying a duff diff.

### Porting status — last version ported

**Last reviewed duff commit: `2d0a5017` (tip of duff `main`, 2026-06-27; the two
"optative mood" commits `4fabcb6f` + `2d0a5017`, ported below).**
When checking for new duff work, diff `origin/main` against that commit forward.
(PRs #300/#301/#305/#306, previously ported ahead, are now merged on duff `main`
and folded into the boundary; #302/#303/#304/#307, the #308–#316 batch, #317–#319,
and the optative pair ported below. Duff's `f92a2e6d` "Add files via upload" is
just a binary `Paradigms.pdf` reference sheet — a duff asset, not code; not ported.)

- **Ported duff's two "optative mood" commits (`4fabcb6f` "Add the optative mood"
  + `2d0a5017` "Mirror the GNT optative parses") — optative integrated into the
  parsing dimension, ADAPTED to Mounce and extended per a user review.**
  - **Plumbing (verbatim).** `'optative'` added to every mood pool/regex/list:
    `DIM_POOLS`/`parseAnswerDimensions`/`VALUE_ORDER` (morph_steps), `VALUE_ORDER`
    (morph_lookup), `DIM_VALUE_FILTER_VALUES` + `OPTIONAL_FILTER_KEYS`
    (main/persistence/navigation), `dimValueFilters.mood` + `optionalFormFilters`
    (runtime), `PARSE_WORD_ABBREVS` (progress → `opt`), the optional-form category
    filter (paradigm_focus). `STRUCTURAL_TENSE_MOOD_IMPOSSIBILITIES` gains the
    imperfect/pluperfect-optative bars (the future optative λύσοιμι is real, so NO
    future bar). render.js: `glossEimi` ("might be"), `conjugateVerbGloss`, and the
    `buildWhyThisFormNote` iota-mood-sign note.
  - **Full optative paradigms → OPTIONAL pool** (lemma_inventory `optionalFormGroups`
    + `extraForms`, mirroring how Mounce already parks the subjunctive). λύω / εἰμί /
    γίνομαι / δίδωμι / ποιέω / λαμβάνω ported verbatim from duff. **duff's model
    middle ῥύομαι (absent in Mounce) is swapped for Mounce's model deponent
    πορεύομαι** — present middle + aorist **PASSIVE** optative (πορευθείην, since its
    aorist is the passive-form ἐπορεύθην), hand-authored on the λυθείην pattern.
    Aorist qualifiers normalized to plain "aorist" (Mounce convention; the
    2nd-aorist fact stays in the family label). Gated at **ch 31** (Mounce's
    subjunctive chapter; δίδωμι at 34/35). Two `index.html` toggles added: mood
    value-filter "Optative (Ch. 31)" + optional-filter "Include optatives".
  - **duff's `week_8_optative.js` required set has NO Mounce file equivalent.**
    Mounce has no `paradigm_morphology.js` auto-gen (porting it would double-convert
    every existing parse-bearing supplemental vocab set), so the required NT forms
    are authored as a Mounce-native **core `MORPHOLOGY_SETS["31"]` deck** instead
    (see below) — the NT optatives εἴη/δῴη/γένοιτο + the λύω/πορεύομαι mirrors
    (λύοι/λύσαι/λύσαιτο, πορεύοιτο/πορευθείη), all 3sg, matching the GNT.
  - **Mounce-specific extensions from the user review (no duff source):**
    - **New core `MORPHOLOGY_SETS["31"]`** — Mounce previously drilled the subjunctive
      ONLY as optional groups (no core ch-31 deck). Added required λύω subjunctive
      (present + aorist, all voices) + εἰμί present subjunctive (ὦ/ᾖς/ᾖ…) + the
      optative item. Overlap with the optional λύω subjunctive groups is collapsed by
      the existing per-form dedup. Flows into cumulative λύω (lemma `"λύω"` ∈
      `LUO_VARIANTS`).
    - **Pluperfect** (ἐλελύκειν active + ἐλελύμην m/p) added to core **ch 25** — it
      existed only in grammar/parsing *examples*, never in a drillable paradigm, so it
      never surfaced (even in cumulative λύω). Keyed `"λύω → λέλυκα"`/`"λύω → λέλυμαι"`
      so it pools into the cumulative.
    - **Vocatives made drillable**: λόγε (ch 7, 2nd-decl masc noun), ἀγαθέ (ch 9,
      2-1-2 adjective), λυόμενε (ch 27, m/p participle → gives cumulative λύω a
      vocative). Only the genuinely-distinct (‑ε) vocatives are added; syncretic
      voc=nom forms are left as-is (Mounce's deliberate convention).
    - **3rd-person imperatives completed**: λύω present m/p imperative (λυέσθω…) +
      εἰμί imperative (ἔστω…) added to core **ch 33** (active + deponent 3rd-person
      were already there).
    - **Pool-constant collapse restricted** (`computeParadigmConstantDims`): now
      collapses a parsing step to one option ONLY for a **middle-only/deponent verb's
      voice** (πορεύομαι, γίνομαι). A full verb like λύω is never collapsed — drilling
      "λύω — aorist middle" tests the real tense/voice/mood options (the in-scope
      distractor pool is unchanged). Single-gender-noun **gender** still collapses, but
      via the separate `fixedGenderNoun` path. (Previously every constant dim of a
      focused sub-paradigm collapsed; the user judged that bad pedagogy for full verbs.)
    - **Build mode → cumulative only** (`syncParadigmFocusUi`, gated on
      `runtime.parsingLookup`): the focus dropdown lists only the "— all forms"
      aggregates + standalone paradigms with no ≥2-member family, hiding the
      principal-part sub-paradigms and the "↯ Shuffle all" entries.
    - **Chapter 0 — Letters**: a 24-card Greek-alphabet flashcard deck (`SETS["0"]`,
      letter ↔ name + transliteration) with its own **"Alphabet (Ch 0)" session**.
      Every other session (incl. "All Chapters 1–36") uses explicit lists that omit
      `"0"`, so it is never pulled in by a select-all.

- **Ported in full through duff #288** (parsing undo + 3-tier scoring,
  restructured parse summary + "Why this form" notes, 3rd-person imperative
  parsing at Mounce ch 33, and "Build mode" / interactive paradigm lookup).
- **Ported duff #296** — SRS rework: lapse **relearn ladders** (a slip no
  longer wipes a card — it relearns then resumes at ½ its pre-lapse interval,
  `preLapseIntervalDays`), a gentler **8-month/relaxed cadence** (near-linear
  14→28→42→56→60, ~60-day cap, `maxEasyStepDays`), a **leech** drill (relaxed,
  after 4 Hard lapses), and **variant-form gating "Model B"** — a shared
  base+derived set advances only once every active face is passed in one cycle
  (`cycleFacesPassed`/`getVariantCycleInfo`/`isCardDue`), **replacing** the
  weakest-active-face grading from the variant-forms back-fill. New progress
  fields (`inRelearn`/`relearnLeft`/`preLapseIntervalDays`/`lapseCount`/
  `leechDrill`/`leechStreak`/`cycleFacesPassed`) are seeded, whitelisted in the
  save compaction, and cleared on reset; `faceOutcomes` is gone. Also folded in
  duff #296's syncretic middle/passive "Your parse" form-lookup fix. The
  Mounce-side draft PR #81 (SRS only, deferred the gating) was the cross-check
  and is closed in favour of this fuller port. **Follow-up:** the earlier #296
  port covered only the SRS half — its analytics half (`de7c8f1`) is now in too:
  parsing accuracy scores **per dimension** (`countLemmaFormDimCredit`) so a
  4-of-5-dims parse counts 0.8, not the old whole-parse 0, feeding the headline %
  and per-value bars (the strict 2/2 dots / exclude-known rule is unchanged).
  Captions say "Per-dimension accuracy"; the old whole-parse
  `countLemmaFormCredit` / `recentAttemptCredit` / `recentAttemptOutcome` chain
  was removed (matching duff).
- **Ported duff #297** — parsing undo credit is now `0.5^(undos+1)` (a single
  undo → 0.25, was 0.5).
- **Ported duff #298 + the remaining tip-of-main commits:**
  - **#298 (`c0f41ee`) — variant "Uncertain re-queues a face" (SRS).** A variant
    "… as cards" set now advances only when **every active face is CLEARED with
    Easy** in one cycle. Easy clears a face (held 2h, hidden); **Uncertain
    re-queues just that face for 2h** (siblings stay active) and never completes
    the set; a miss still resets the whole cycle. Adds a per-face
    `cycleFacesHeld` map (face → re-show time) beside `cycleFacesPassed`, wired
    through `getWordProgress` (seed + sanitize), `isCardDue` (hide Easy-cleared
    faces until the set completes; hide Uncertain faces only until their 2h hold
    elapses), `applySpacedReview`, `migrations.js` (empty-check + compaction),
    and the spaced-progress reset. Replaces the old "Uncertain counts as a pass"
    behaviour from the #296 gating port.
  - **`69880d8` — touch ghost-click shield.** "I give up" collapses the step
    rows, sliding "Next →" under the finger; the browser's re-dispatched touch
    click hit Next and skipped the summary. A 200ms `morphGiveUpShieldUntil`
    stamp (set in `giveUpMorphologyStep`, checked in `handleNavNext`) swallows
    it.
- **Ported duff's post-#298 tip-of-main commits (not yet PR'd in duff):**
  - **Aorist collapse** (`f650d3d`) — the parsing Tense step collapsed
    first/second aorist to plain `aorist` via
    `dims.tense = dims.tense.replace(/^(first |second )/, '')` in *both*
    `computeAccessibleDimensionPools` (distractor pool) and `buildMorphSteps`
    (correct value + summary) in `morph_steps.js`. First/second aorist is a
    stem-formation distinction, not a tense, so the step no longer offers
    "second aorist" beside "aorist" (Mounce data ships `"… 2nd aorist active"`
    parses, so this matters here too). Aspect + the stem-change footer are
    unaffected.
  - **Variant gating no longer bypassed in relearn/leech** (duff #299,
    `94b3976`) — `applySpacedReview`'s per-face gate was guarded by `if (variant
    && !inRelearn && !leechDrill)`, so once a heavily-lapsed variant set (e.g.
    ἵστημι) entered the relearn/leech ladder a single correct answer on ONE face
    (or an easy+uncertain mix) advanced the ladder and scheduled the whole set
    out, stranding the unreviewed siblings. Fix: drop the `!inRelearn &&
    !leechDrill` guard (`if (variant)`) so the ladder step (`applyCorrectOutcome`)
    fires only when the cycle completes — every active face cleared with Easy —
    and a lapsed set relearns together as documented. (duff's other two
    post-#298 commits, `2f12bdd`/the #299 merge, are duff back-porting Mounce
    #86 into duff — no new Mounce content.)
- **Ported duff PR #300 + #301 (ahead of their duff `main` merge):**
  - **#300 (`20d386c`) — parse-answer form lookup no longer dashes aorist picks
    to "—".** The wrong-pick "Your parse" lookup (`resolveFormForPickedDims` in
    `render.js`) rejected an otherwise-correct aorist parse when the only
    matching form is stored with a "first/second aorist" qualifier: the Tense
    step collapses both to plain `aorist` (so the student picks `aorist`), but
    candidate answers parse straight from the data and keep the qualifier, and
    `dimsCompatible('aorist','first aorist')` is false — the candidate was
    discarded on tense alone and the line rendered "—" (e.g. ῥῦσαι + a wrong
    subjunctive pick should surface ῥύσῃ). Fix: collapse the first/second-aorist
    qualifier on BOTH the picked tense and each candidate's tense
    (`/^(first|second)\s+/`) before comparison, mirroring `buildMorphSteps`.
    (Mounce's `parseAnswerDimensions` already normalizes "2nd aorist"→"second
    aorist", so the regex matches its dim values.)
  - **#301 (`6d89c13`) — per-paradigm "completely-correct / tested" progress
    bar** in the parsing review panel. Each row (per paradigm + the overall row)
    gets a thin bar tallying completely-correct parses over total tested parses,
    summed across the paradigm's in-scope forms using the same 2/2 known window
    as the dots / exclude-known filter (each form contributes 2/2, 1/2, 1/1,
    0/1, …). Distinct from the per-dimension half-credit headline %. Exports
    `FORM_RECENT_CAP` from `morph_steps.js`; adds `lemmaParseProgress` (folds
    `countLemmaFormRecent` over `cardsFor(lemma)`) and `parsingProgressBarHtml`
    (5-band gradient, empty grey track + "0/0" when untested) to `progress.js`,
    wired into both rows of `renderParsingReviewPanel`; new
    `.parsing-review-bar*` CSS (light-theme variants included). Adapted to
    Mounce's memoized `cardsFor()` cache instead of duff's direct
    `getMorphCardsForLemma`.
- **Ported duff PR #302 + #303 + #304:**
  - **#302 (`971c8da1`) — λύω optional participle completeness.** duff added two
    λύω -μενος participle declensions (present m/p λυόμενος + aorist middle
    λυσάμενος), both **ported here**. (Initially mis-scoped as present-m/p-already-
    covered: Mounce only drills a **5-form recognition SUBSET** of λυόμενος — nom/
    gen/acc sg masc + nom/gen sg fem, the `S27_PRES_PTC_MIDPAS` card — **not** the
    full declension, and λυσάμενος ships only as a grammar example. The contract
    verbs ἀγαπάω/ποιέω/πληρόω already got their *full* present-m/p participles as
    Ch-27 optional + extraForms, so λύω, the model verb, was the odd one out.)
    Added `LUO_PRESENT_MP_PARTICIPLE = menosParticipleParadigm('λυό','λυο',…)`
    (Ch 27) and `LUO_AORIST_MIDDLE_PARTICIPLE = menosParticipleParadigm('λυσά',
    'λυσα',…)` (Ch 28), each as an optional group **and** in `extraForms` (so the
    wrong-parse "Your parse" lookup can reconstruct any picked slot). Chapters
    track the matching concrete forms (present m/p ptc = the S27 card / contract
    verbs at 27; aorist middle ptc = γίνομαι's γενόμενος + λύω's aorist-active
    λύσας at 28; not duff's BBG Ch 15). The ~5 already-drilled recognition forms
    collapse against the optional set via the per-form dedup in
    `getCardsForFocusedParadigm` (keyed by form, richest parse wins), so only the
    remaining ~12 present-m/p slots surface as new cards — no duplicates.
  - **#303 (`5c3a5bf3`) — touch ghost-click suppression is now one-shot, not
    time-based.** `touchTapBridge.js` swallowed the iOS native ghost click via a
    500 ms window (`NATIVE_CLICK_SUPPRESS_MS`) measured from synthetic dispatch.
    A tap handler that opens a blocking `window.confirm()` (e.g. "fast-forward 1
    week") freezes JS while the user reads it, so the queued ghost click lands
    long after the window, escapes suppression, and re-fires the handler — a
    second confirm popup. Replaced the timer with a one-shot
    `pendingGhostSuppressEl` token: armed in `dispatchSyntheticClick`, cleared
    when the next native click on that element arrives (or when a fresh gesture
    starts, in `onTouchLikeStart`), so it's exact regardless of delay. Mounce's
    bridge matched duff's pre-fix structure verbatim, so this ported 1:1.
  - **#304 (`5775ce0b`) — PWA double-reload race fix (+ banner reload fallback).**
    On a SW upgrade, `sw.js`'s `activate` force-navigated every window client
    (`clients.matchAll` → `client.navigate`) AND `main.js`'s `controllerchange`
    listener reloaded — two competing navigations on the same URL that could
    wedge an iOS standalone PWA on a frozen half-loaded launch. Dropped the
    force-navigate dance from `activate`, leaving just stale-cache cleanup +
    `clients.claim()`, so the single reload is owned by `main.js`'s
    `controllerchange` listener (one reload, one owner). **duff's `#refresh-
    AvailableOverlay` *modal* rework is N/A** — Mounce's update UI is a different
    artifact, the non-modal `#updateAvailableBanner` (`applyAppUpdate` /
    `showAppUpdateBanner`). But the model-agnostic *core* of duff's main.js
    change — a force-reload guarantee for when `controllerchange` never lands —
    DID apply: Mounce's `applyAppUpdate()` posted `SKIP_WAITING` and then relied
    solely on `controllerchange`, so on the stuck-PWA path the Refresh button did
    nothing. Added a 1.5 s fallback `setTimeout(reload)` after the post (the
    controllerchange reload tears this document/timer down first in the normal
    case, so the fallback only fires when the auto-reload didn't).
  - **Parsing review panel scoped to the custom set** (`d5a7a8c`) — in
    custom-paradigm-set mode the bottom panel becomes a live scorecard for the
    ticked deck (`runtime.parsingCustomParadigms`), showing selected-but-undrilled
    paradigms and dropping drilled paradigms outside the set; nothing is pinned;
    labels become "Custom set: N" / "Selected paradigms". (`customMode`/`baseStats`
    in `renderParsingReviewPanel`.)
- **Ported duff PR #305 — PARTIAL (Mounce had already diverged here):**
  - **Choice ordering (`CHOICE_SORT_ORDER`)** — ported. MC choice lists place a
    syncretic/composite value next to the singles it combines instead of exiling
    it to the end: case = nom, acc, **nom/acc**, gen, dat, voc; gender = masc,
    fem, neut, **masc/fem**, **masc/neut**, **masc/fem/neut**.
    `sortChoicesCanonically` now reads `CHOICE_SORT_ORDER[dim] || DIM_POOLS[dim]`.
    Decoupled from the deponent/gender engine; pure ordering.
  - **Single-gender noun gender = single-option reinforcement step** — ported
    (per user request). A single-gender noun (λόγος masc., ἀγάπη fem., ἔργον
    neut.) previously **auto-skipped** the gender step; now it shows one button
    for its fixed gender + a note naming the noun type ("λόγος is a … noun — every
    form keeps this gender"). `fixedGenderNoun` (replaces the auto-skip `continue`)
    folds into `collapseToSingle` so the step pool is `[stepCorrect]`;
    `step.fixedGender` drives the renderer's `stepReinforcementNote` /
    `fixedGenderNote` + `.morph-step-single-note` CSS (the lone button already
    centers via Mounce's `:only-child` rule). Gender is now a real step, so the
    `impliedDims.gender` injection in `assembleParseLine` is gone (3rd-decl nouns
    still get the real multi-choice test; multi-gender paradigms unchanged).
  - **Deponent voice → single 'middle' + contested-voice note — NOT ported
    (user chose to keep Mounce's design).** Mounce already single-options a
    focused deponent's voice via the pool-constant collapse, *displayed* as
    "middle (deponent)", and soft-accepts 'active' in mixed decks. duff #305's
    per-card strict-'middle' rewrite would supersede that Mounce-specific feature
    and change pooled-deck grading, so it's left as-is. (The contested-voice
    explanatory note is the one genuinely new idea; deferred with the rest.)
  - **Lone-button centering / custom-set pseudo-lemma exclusion — N/A.** Mounce
    already centers a lone choice via `.morph-choices .choice-btn:only-child`
    (duff's `.morph-choices-single` not needed). The stem-recall pseudo-lemma
    filter is a no-op here: `stem_change_drills.js` is dormant (its `W4_*` vocab
    keys don't exist in Mounce), so `'Second-aorist stems'` never registers as a
    selectable paradigm and never reaches the custom checklist — nothing to
    exclude. (`PARSING_INCOMPATIBLE_LEMMAS` stays in `render.js`.)
- **Ported duff PR #306 — PWA: stop the auto-reload, wait-then-prompt (iOS
  freeze).** A follow-up that revises #304: the auto-reload itself (not the
  navigation *race* #304 fixed) was wedging iOS standalone PWAs — the programmatic
  `controllerchange` reload at launch hangs the webview (page renders, taps dead
  until force-quit). duff switched to the wait-then-prompt pattern; the two
  model-agnostic cores ported to Mounce's banner (duff's `#refreshAvailableOverlay`
  *modal* rewrite stays N/A):
  - **`sw.js`: removed `self.skipWaiting()` from `install`** — the new worker now
    installs and WAITS instead of auto-activating. `skipWaiting()` fires only via
    the `message` handler (the "Refresh" button's `SKIP_WAITING`). The old worker
    keeps serving its complete asset set until then, so the app still works on the
    old version. (`activate` is unchanged — still cache-cleanup + `claim`, no
    force-navigate.)
  - **`main.js`: `controllerchange` now reloads ONLY for a user-accepted update.**
    Added a module-level `__refreshAccepted` flag set by `applyAppUpdate()`; the
    `controllerchange` listener early-returns unless it's set, so a launch/cold-
    start controllerchange (first install, or a waiting worker activating) never
    auto-reloads. Dropped the now-redundant `__hadInitialController` snapshot. The
    `#updateAvailableBanner` still shows the moment a waiting worker is detected;
    tapping Refresh posts `SKIP_WAITING` and reloads inside the gesture (the 1.5 s
    fallback from the #304 re-review stays). `index.html` banner reworded to note
    that fully closing+reopening also applies the update.
- **Ported duff PR #307 — split-card per-round confidence + comprehension-
  weighted parsing order.** Two features layered on machinery Mounce already had
  (variant-form gating + per-dimension form stats), so both ported cleanly:
  - **Split-card per-round confidence (SRS).** A variant "… as cards" set now
    scores confidence once per ROUND instead of once per face review (which let
    one shaky form, repeated until known, dominate the rolling history). A round
    is one attempt at clearing every active face, bounded by a 2 h window from
    when the set's first face is seen (`cycleStartedAt`); per-face outcome samples
    collect in `cycleFaceSamples`, and on round-end the score is the mean across
    active faces — a face never reached counts 0%. New `confidence.js` helpers
    `computeVariantRoundConfidence` / `addVariantFaceSample` /
    `recordVariantRoundConfidence`; `endVariantRound` (main.js) closes a round
    (records confidence, clears bookkeeping) and is called from `isCardDue` (2 h
    deadline fired → also resets the set due-now, intervalDays 0, so an incomplete
    set isn't left half-cleared), `applySpacedReview` (a miss, a stale round on a
    late return, and the set-completing Easy). `recordStudyOutcome` gained a
    `skipConfidence` opt (variant cards suppress the per-review sample). The #298
    per-face `cycleFacesHeld` 2 h re-queue is **superseded**: within a round an
    un-cleared face just stays surfaceable (Uncertain no longer walls a form off);
    `setProgressDelay` now uses the shared `roundDeadlineMs` (time left in the
    round) instead of a fresh 2 h per face. New `cycleStartedAt`/`cycleFaceSamples`
    progress fields seeded + sanitized in `getWordProgress`, defaulted/empty-
    checked/compacted in `migrations.js`, and cleared on the spaced-progress reset.
  - **Comprehension-weighted parsing order.** The parsing review's wrong/uncertain
    tier is no longer a flat weight — it scales with `weightedRecentMissScore`
    (morph_steps.js): the importance-weighted magnitude of a form's recent missed
    dimensions, using `DIM_COMPREHENSION_WEIGHT` (mood 1.5 / tense·case 1.4 / voice
    1.3 … gender 0.6). So a form blowing high-impact dims (mood/tense/case) surfaces
    ahead of one fumbling only gender, and a verb outranks a noun at similar
    shakiness. `parsingFormPriorityWeight` keeps fixed weights for unseen (6) /
    right (1.5) / known (1) and grades wrong/uncertain as `min(2.5 + 0.7·miss,
    5.5)` (capped under unseen). The show-count rule stays the primary sort, so the
    "shown at most twice before every form has a turn" cap is preserved.
- **Ported duff PR #309–#313 — parsing partial-credit chain** (one tightly-coupled
  feature evolved over five PRs; ported as its net final state, not the
  intermediate diffs, since #311 discards #310's `partialBeforeUndo` and #312
  only retunes one exponent inside #311):
  - **#309 (`28e0d378`) — partial credit for naming one value of a multi-value
    form.** A pick that's a proper non-empty SUBSET of a slash-composite `correct`
    (case `nom/acc`, gender `masc/neut`…) is accepted (advances, shuffler treats it
    as right) but flagged `partial` and scored `PARTIAL_COMPOSITE_CREDIT = 0.75` —
    never the exact-1 the strict 2/2 "known" test needs, so the form keeps coming
    back until the FULL composite is named. New `isPartialCompositePick` +
    `attemptAllAcceptable` + a `'partial'` form status (yellow dot, low shuffle
    weight `PARSING_PARTIAL_WEIGHT`) in `morph_steps.js`; `getLemmaFormStatus`
    rewritten to read `form.recent` directly and split clean-vs-acceptable;
    `answerMorphologyStep` sets `answer.partial`; `sanitizeDimCredit` (persistence)
    gains a 0.75 bucket; testable-forms summary gains a "partial" tally.
  - **#310 (`7b9f66c0`) — extend partial to ASPECT** (`continuous` for the
    present/future `continuous/undefined`). In Mounce this is just the `'aspect'`
    token in `isPartialCompositePick` (folded into #309's body above). #310's undo
    half (`partialBeforeUndo`) is **superseded by #311 and NOT implemented.**
  - **#311 (`cdd458ae`) — undo credit-floor.** `undoMorphologyStep` records each
    rolled-back pick's first-attempt merit (1/0.75/0) into `state.firstAttemptCredit`
    (set-once); `finalizeMorphStepAttempt` floors an undone dim at
    `max(firstAttemptCredit, 0.5^undos)` when the final pick is valid (else 0) and
    stashes `state.finalCredit`, so the summary marks match the recorded score.
  - **#312 (`27fc0310`) — self-correction credit is `0.5^undos`** (not `^(undos+1)`):
    wrong→undo→correct now earns 0.5, not 0.25 (correct→undo and partial→undo stay
    floored at their first-attempt merit). One exponent inside #311's block.
  - **#313 (`a937d4a6`) — correct→undo→correct shows a green `*`** + green footnote
    "counted correct due to correct first attempt" (full credit, still counts toward
    X/N). All five land in `render.js` (R1–R7: credit-driven breadcrumb dots +
    summary marks/footnotes, **merged with Mounce's `softDeponentMiddle` branch** so
    the deponent soft-✓ survives), plus `.morph-step-dot.partial` / dagger /
    partial-note / correct-note CSS (+ light variants). Off-the-record preserved
    (no `noteStudyInteraction`).
- **Ported duff PR #308 + #314 + #315 — SRS split-card round model + smoothing:**
  - **#315 (`cd9c8087`) — split-card "parked-face round" model** (reworks, but
    reuses, the #307 round machinery). A variant "… as cards" set runs as a round
    (2h window from `cycleStartedAt`); each face is marked until **final** — Easy
    (`cycleFacesPassed`) or **Uncertain** (new `cycleFacesUncertain`); a **Hard
    just requeues** the face (no lapse, no round end). A final face parks **out of
    "Due now"** (deferred); a pending one stays due. All-Easy advances the shared
    schedule; any Uncertain — or the 2h elapsing with faces pending — **resets the
    whole set** to due-now. The variant path of `applySpacedReview` is extracted to
    a new **`applyVariantRoundReview`**; `isCardDue`/`endVariantRound`/`getWordProgress`
    seed+sanitize, `migrations.js` (empty-check + compaction), and the
    spaced-progress reset all carry the new `cycleFacesUncertain` field
    (persistence.js needs no change — the whitelist lives in migrations.js). The
    #298 per-face `cycleFacesHeld` 2h re-queue is superseded.
  - **#308 (`7e407e09`) — "Uncertain does nothing on a split card" fix — FOLDED
    INTO #315.** The standalone fix (drop the Uncertain'd face from
    `spacedActiveIds` so `navigate(1)` advances) lives inside
    `applyVariantRoundReview`'s `dropFromActive()`; #315 rewrites the whole branch
    #308 touched, so no separate edit.
  - **#314 (`03562d8b`) — "Smooth schedule" reset reworked to a 1.1×/1×
    pile-shedding pass.** `performSpacedScheduleSmooth` (navigation.js) now buckets
    cards by due-day over `[day 4 .. lastDay]`, computes `value = cards/n`, and
    walks the window end-inward shedding each day's surplus above **1.1× value**
    onto the nearest earlier day still under a **1× value** cap (cards only move
    earlier, never past day 4, never delayed). Replaces the old least-loaded-day
    placement. Manual reset only — there's no auto-smoothing.
- **Ported duff PR #316 (`c906e2f4`) — parsing-review summary bar realigned to
  testable-form counts.** The per-paradigm bar (and overall row) is now a **stacked
  breakdown over the testable forms** — known · right-once · seen-but-wrong ·
  not-seen, each form counted **once** — so its denominator matches the `X/Y forms`
  tally on the same row (the old `lemmaParseProgress` counted 1-or-2 tested *parses*
  per form, a mismatched denominator). The headline % and the worst-first sort both
  re-point to `formStatusPctRight` (= `(known+right)/total`), so the number, the
  sort, and the bar agree. `progress.js`: `lemmaParseProgress`/`parsingProgressBarHtml`
  → `lemmaFormStatusCounts`/`formStatusPctRight`/`parsingBreakdownBarHtml` (drops the
  now-unused `countLemmaFormRecent`/`FORM_RECENT_CAP` imports — both still exported
  from `morph_steps.js` for other callers); `.parsing-review-bar-fill*` →
  `.parsing-review-seg*` CSS. Composes with Mounce's broader default `baseStats`
  (all in-scope paradigms) and memoized `cardsFor()` — both kept. `render.js`
  untouched (Mounce's parsing-review panel lives entirely in `progress.js`).
- **Ported duff PR #317 (`c5c2d399`) — ADAPTED into a Mounce divergence.** #317
  rewrote the spaced-reset labels to name their scope ("selected" / "starred
  selected" per the required-only toggle). But **Mounce's core vocab is all
  `required:true`** (zero `required:false` in the data), so the required/optional
  split only ever excluded selected supplemental/advanced extras — the user judged
  it pointless. So instead of the toggle-driven labels, Mounce **drops the
  required/optional scope from the reset flow entirely**: the "Required cards only"
  checkbox is removed from both the spaced AND unspaced reset modals, the dedicated
  "Reset required" button (`#resetRequiredBtn`) and `resetRequiredOnly()` are gone,
  and the labels are static "Set selected to now" / "Reset selected" (keeping #317's
  clarification that reset targets the current *selection*, not "all"). Reset always
  targets the whole selection now (`isResetScopeRequiredOnly` degrades to false).
- **Ported duff PR #318 (`b66a8b2e`) — bounded SW navigation + re-surface update
  on resume (the iOS-freeze fix).** Two model-agnostic cores, both PORTED:
  - **`sw.js`: bounded navigation fetch.** The navigate handler now races the
    network against a **4 s `NAV_TIMEOUT_MS`** (`Promise.race`) and falls back to
    the cached shell (`cachedShell` helper) if the network errors OR *stalls* — a
    stalled (not errored) launch fetch otherwise hangs forever, which on iOS
    standalone PWAs renders a frozen page (taps dead until force-quit). The network
    keeps running past the timeout to refresh the cache for next launch.
  - **`main.js`: re-surface the update prompt on resume.** The `visibilitychange`
    handler, after `reg.update()`, now also checks `reg.waiting && controller` and
    re-shows `showAppUpdateBanner` — so reopening a backgrounded PWA that has a
    worker waiting from before no longer sits silently on the old version (the
    one-time waiting-check runs only at registration). Calls `showAppUpdatePrompt`
    (see the banner→modal note below).
- **Ported duff PR #319 (`9e0cf80`) — aspect alternates + study-pace chooser +
  case order; one part ADAPTED, one N/A.** This was the duff PR that prompted the
  user's explicit case-order / aspect-wording asks, so two of its four parts were
  steered to Mounce's own teaching rather than copied verbatim:
  - **Aspect wording → Mounce's "Perfect" (PRIMARY rename, Mounce divergence).**
    Mounce's own aspect chart (Ch. 15, `mounce.pdf` p.49) lists the three aspects
    as **Continuous / Undefined / Perfect** — Mounce calls the third **"Perfect"**,
    not duff's "completed". So the aspect *value* `'completed'` was renamed to
    `'perfect'` everywhere: `DIM_POOLS.aspect` + `TENSE_TO_ASPECT` (perfect/pluperfect
    → `'perfect'`) in `morph_steps.js`, the `dimValueFilters.aspect` default
    (`runtime.js`), the `DIM_VALUE_FILTER_VALUES` whitelist (`persistence.js`) and
    UI lists (`main.js`/`navigation.js`), and the value-filter toggle in `index.html`
    (`dimValueFilter_aspect_perfect_Toggle/Btn`, label "Perfect (Ch. 25)"). Aspect is
    always *derived* from tense (never parsed from text), so the `'perfect'` aspect
    value never collides with the `'perfect'` *tense*. (Descriptive prose in
    `grammar.js`/`concept_examples.js` that says "completed action…" describes the
    perfect's *meaning* and is left as-is.) **No save migration** — the aspect step
    defaults OFF and an old `completed:false` exclusion just degrades to the
    default-included `perfect:true`; Mounce is pre-release.
  - **Aspect alternate labels (duff feature, ADAPTED to Mounce's terms).** A small
    italic sub-label under each parsing aspect choice cross-references the common
    linguistic terms (`ASPECT_ALTERNATE_LABELS` in `render.js` → `.choice-btn-alt`
    CSS): continuous → *imperfective*, undefined → *perfective / aoristic*,
    continuous/undefined → *imperfective / perfective*, **perfect → *stative*** (duff
    keyed this off `'completed'` and mapped it to "stative / perfect"; since Mounce's
    primary is now "perfect", the alt is just *stative*).
  - **Case order → Mounce's teaching order (USER-SPECIFIED, diverges from duff's
    own #319 order).** `CHOICE_SORT_ORDER.case` in `morph_steps.js` is now
    **`['nominative', 'nominative/accusative', 'genitive', 'dative', 'accusative',
    'vocative']`** — the order Mounce's paradigm tables use (nom, gen, dat, acc, voc)
    with the neuter nom/acc syncretism slotted right after the nominative it shares.
    duff #319 reordered to `nom, nom/acc, voc, acc, gen, dat`; Mounce follows the
    user's explicit Mounce-paradigm order instead.
  - **Study-pace chooser + inverted cadence toggle (duff feature, PORTED).** New
    users pick their pace on the first-launch consent gate (`#consentPacingRow`
    radios, default **relaxed 8-month**); `handleConsentAction` (`modals.js`) reads
    the radio and calls a new `setSpacingCadence` host hook (`configureModals` in
    `main.js`) to set `runtime.spacingCadence` + save. The Advanced-settings cadence
    toggle is **inverted** to "2-month pace" (ON = intensive); `syncToggleButtons`
    now reflects `cadenceIntensive`. `DEFAULT_SRS_CADENCE` stays `'intensive'`, so
    old/returning users (who never hit the consent branch) keep their 2-month pace.
    New `.consent-pacing*` CSS; the pacing row is hidden when the disclaimer is
    reopened later (Close mode).
  - **Session relabeling (Week N → Part N-M) — N/A.** Mounce already ships the
    four-Parts + Cumulative session set (no "Week N" tags), so there was nothing to
    relabel.
- **Mounce-specific Advanced-settings + selector cleanup (no duff equivalent).**
  A UX pass on the controls bar / session selector, layered on the #317/#318 ports:
  - **Parsing-step toggles no longer leak into vocab/grammar.** The eight
    parsing-step master toggles + their value-filter `<details>` + the optional-forms
    toggle/filters are wrapped in a new **`#parsingStepOptions`** container, hidden
    as a unit outside parsing mode (`syncLayoutVisibility`). Previously they had no
    mode gating and showed in vocab.
  - **`#requiredToggle` removed from the controls bar; `runtime.requiredOnly` forced
    `false` everywhere** (runtime default + both load paths in `persistence.js`), so
    the deck = whatever the user selected (selected supplemental/advanced cards are
    no longer silently filtered out). `toggleRequiredOnly` + its wiring removed; the
    inert `requiredFlag`/`isResetScopeRequiredOnly` plumbing is left (always false).
  - **`#splitSelectionToggle` defaults ON** (`runtime.splitSelection` default true +
    `!== false` load semantics) — separate vocab vs grammar chapter selections.
  - **Grammar counts dropped from the session selector.** Chapter/supplemental/week
    labels show only the vocab count (or **"grammar only"** for a 0-vocab set);
    `selectors.js` no longer appends "· N grammar".
  - **"No vocab" card.** A vocab deck that's empty because the selected chapters are
    grammar-only now shows "Selected chapter(s) have no vocab — use the Grammar
    section for chapter practice." (hard-review-drained decks get their own note);
    `render.js` empty-state branch.
  - **Update prompt is now a BLOCKING MODAL, not a corner banner.** The old
    non-modal `#updateAvailableBanner` (bottom-left, easy to ignore) left users
    stranded on a stale cached version — they never noticed the update. Adopted
    duff's **`#refreshAvailableOverlay`** approach: a `.consent-overlay`/`.consent-modal`
    with a single **"Refresh now"** action (`applyAppUpdate`), shown by
    `showAppUpdatePrompt` (renamed from `showAppUpdateBanner`; the 4 SW-block call
    sites updated). This **reverses** the earlier #304/#306 "modal rework stays N/A"
    call — the easy-to-miss banner was the actual cause of the stuck-on-old-version
    reports. `.update-banner*` CSS removed; `dismissAppUpdate` now closes the modal
    (no dismiss button is wired, matching duff's force-through prompt).
- **Participle full declensions promoted to REQUIRED (no duff equivalent).**
  Mounce teaches the λύω participle as a full paradigm, so every participle
  declension in the Paradigms-page screenshots is now **drilled by default in
  parsing**, not hidden behind the optional-extensions toggle (an earlier PR had
  added them as `optionalFormGroups` only — toggle-gated). New mechanism: an
  optional-form group can carry **`alwaysInclude: true`** (`js/data/lemma_inventory.js`)
  — it's emitted regardless of `runtime.includeOptionalForms`, chapter-gated like
  everything else, tagged as curriculum (`supplemental:false`), and ignores the
  optional per-category filters. `buildOptionalMorphCardsForLemma` gained an
  `includeToggleGated` param and `getCardsForFocusedParadigm` now *always* calls it
  (`js/domain/grammar/paradigm_focus.js`); all parsing-deck/review/analytics
  consumers funnel through there, so the change is one place. Promoted groups
  (each `alwaysInclude`): **λύω** present-active (λύων), present-m/p (λυόμενος),
  1st-aorist-active (λύσας), aorist-middle (λυσάμενος), 1st-aorist-passive
  (λυθείς), perfect-active (λελυκώς), perfect-m/p (λελυμένος); **λείπω**
  2nd-aorist-active (λιπών) + 2nd-aorist-middle (λιπόμενος); **γράφω**
  2nd-aorist-passive (γραφείς). Two declensions were missing as data and added via
  the existing generators (`LUO_PRESENT_ACTIVE_PARTICIPLE` = `presentActiveNtParticiple`,
  `LUO_AORIST_PASSIVE_PARTICIPLE` = `aoristPassiveParticipleParadigm('λυ')`,
  `LEIPO_AORIST_MIDDLE_PARTICIPLE` = `menosParticipleParadigm('λιπό','λιπο',…)`). The
  **rare future participles stay toggle-gated** (no `alwaysInclude`). λύω stays
  chapter-gated so cumulative parses flow through. The core `MORPHOLOGY_SETS`
  participle subsets in `morphology.js` are kept (they own the lemma keys + dropdown
  entries); per-form dedup collapses the overlap with the now-required full forms.
- **`pages/memorization.html` — case order + participle tables (no duff equivalent).**
  The page is a duff-derived static artifact that ordered case rows **nom, acc, gen,
  dat**; every declension table is now reordered to Mounce's **nom, gen, dat, acc**
  (90 four-row blocks; verb person/number tables, rule lists, and nom/acc-combined
  plurals are untouched). The present-m/p and aorist-middle participle tables used
  **ῥύομαι** (a duff model-verb leftover) — converted to **λύω** (λυόμενος /
  λυσάμενος) to match the screenshots. Added full 3-gender declension tables for the
  five missing participles: perfect-active (λελυκώς), perfect-m/p (λελυμένος), λείπω
  2nd-aor-active (λιπών) + 2nd-aor-middle (λιπόμενος), γράφω 2nd-aor-passive
  (γραφείς), plus the ἀγαθός 2-1-2 adjective paradigm. **Note / open item:** the
  remaining ῥύομαι tables (deponent indicative, "Other Moods of the Middle Voice",
  subjunctive, 3rd-person middle imperatives) are NOT yet converted — Mounce's
  deponent models are πορεύομαι/ἔρχομαι, but neither has an aorist *middle* (their
  aorist is passive-form ἐπορεύθην / 2nd-aor ἦλθον), so a clean ῥυ→ swap isn't
  possible; left for a follow-up.
- **Mounce-specific (no duff equivalent):**
  - **Parsing steps collapse pool-constant dimensions to one option.**
    Any parsing step whose value never varies across the WHOLE pool the student
    is drilling is rendered with a single choice instead of distractors — they
    click through it ("yes, still future / still a participle") rather than being
    quizzed on a contrast the deck doesn't contain, since Mounce breaks paradigms
    out by type/aspect. This is **pool-aware**, covering both a single focused
    paradigm (e.g. "λύω → future" → tense/voice/mood collapse, person+number stay
    a real test) AND a pooled deck that's still constant on a dim (e.g. the
    "↯ Shuffle all — Participles" pick → mood always "participle" and tense always
    "aorist" collapse, while voice/case/gender stay tested). A deck that genuinely
    varies a dim — the cumulative "— all forms" aggregate, shuffle-all across
    types — keeps the full test. `computeParadigmConstantDims` in `morph_steps.js`
    (first/second aorist collapsed to plain "aorist"; composite voices like
    "middle/passive" kept whole; a mood-less finite verb counted as "indicative"
    so an indicative+imperative pool doesn't falsely look mood-constant) computes
    the map; `buildMorphSteps` reads it via `options.singleParadigmConstantDims`
    and sets that step's pool to `[stepCorrect]`. `render.js`'s
    `ensureStepStateForCard` feeds it the live pool via `host.getParsingPoolCards`
    (= `buildFilteredFocusedParadigmCards`). The single button spans full width
    (`.morph-choices .choice-btn:only-child { grid-column: 1 / -1 }`).
    **Deponent label:** a focused GENUINE deponent paradigm (πορεύομαι, γίνομαι)
    has a constant middle/middle-passive voice, so its collapsed one-option voice
    step is *displayed* as "middle (deponent)" (display-only; the recorded voice
    stays the middle form, consistent with the full voice test / summary / stats).
    This relies on `isDeponentLemma` testing the **base** dictionary form before
    any `→` principal-part suffix, so λύω's genuine middle (`'λύω → λύομαι'`) is
    NOT relabelled — it stays plain "middle/passive" — and only dictionary forms
    in -μαι (πορεύομαι, γίνομαι, εἰμί's ἔσομαι) qualify. That base-form check also
    fixed a pre-existing latent bug where the "deponent accepts active" voice rule
    mis-fired on λύω's middle principal-part keys (which end in -μαι).
  - **Default parsing review panel shows ALL in-scope paradigms** — not just
    drilled ones. Outside custom mode `baseStats` = every chapter-gate-met
    concrete paradigm (`host.getInScopeParadigmLemmas` →
    `listAvailableParadigms(...).filter(!isAggregate)`) unioned with any drilled
    lemma, so unseen-but-in-scope paradigms are visible (and an attempt under a
    now-out-of-scope chapter still shows). Label: "Paradigms: X drilled · Y in
    scope". duff only has the custom-mode scoping above; this general default is
    a Mounce extension layered on the same `customMode`/`baseStats` plumbing —
    portable back to duff.
  - **Pooled optional-form de-dup** — `collectCardsForLemmas` (paradigm_focus.js)
    collapses `OPT_*` cards by `(form, parse)` across shuffle-all /
    category-shuffle / custom-set pools. Variant-family members share one
    `optionalFormGroups` set (`registerVariants`) and the synthetic optional id
    embeds the lemma, so each λύω principal part re-emitted the same optional
    forms; core cards keep id-dedup.
  - **Dedicated "Cumulative (full paradigms)" dropdown category** — the
    summative "— all forms (cumulative)" aggregates (λύω, **πορεύομαι**, δίδωμι)
    now live in their own optgroup (`AGGREGATE_CATEGORY` in `paradigm_focus.js`,
    placed before the verb categories in `CATEGORY_ORDER`) instead of inheriting
    their base lemma's category. This keeps the comprehensive cumulative deck
    (every tense/voice/mood **plus** participles, imperatives, infinitives — it
    resolves by `*_VARIANTS` family membership, not by category) visually
    distinct from the per-category **"↯ Shuffle all — &lt;type&gt;"** pick,
    which only pools the concrete lemmas tagged with that one category (so the
    ω-pattern shuffle is the finite indicatives, while the cumulative is the
    whole verb). Relatedly, `'λύω infinitive forms'` was **moved back** into its
    own `Infinitives` optgroup (it had briefly been folded into `Verbs ·
    standard ω-pattern (λύω)`) so the ω-pattern shuffle stays scoped to finite
    forms; the cumulative still includes the infinitives via family membership.
  - **Friendly verb-paradigm dropdown labels.** Verb principal-part lemma keys
    (`'λύω → λύσω'`) render as `"<base> — <form name>"` ("λύω — future active",
    "πορεύομαι — present middle", …) via `PARADIGM_FORM_DISPLAY_NAMES` in
    `paradigm_focus.js` (checked first in `displayLabelForLemma`), instead of the
    English-gloss label — so the dropdown reads as a form chooser. Covers the λύω,
    πορεύομαι and δίδωμι families; other lemmas fall back to the gloss style.
  - **πορεύομαι (model deponent) is split into full principal-part paradigms.**
    Like λύω, πορεύομαι now has its own dropdown entries per form — present middle
    (`'πορεύομαι'`, also carrying the present participle + present imperative),
    imperfect (`'πορεύομαι → ἐπορευόμην'`), future (`'πορεύομαι → πορεύσομαι'`),
    aorist passive-form (`'πορεύομαι → ἐπορεύθην'`, + the aorist passive
    imperative), aorist passive participle (`'πορεύομαι → πορευθείς'`),
    infinitives (`'πορεύομαι infinitive forms'`) — all added as core
    `MORPHOLOGY_SETS` items in their Mounce chapters (18/19/21/24/27/28/32/33).
    They form `POREUOMAI_VARIANTS`, registered in `PARADIGM_VARIANT_FAMILIES` so
    the cumulative "πορεύομαι — all forms" appears. **All πορεύομαι forms — incl.
    its participle and infinitives — are categorized under `Verbs · deponent /
    middle`**, NOT scattered into the generic Participles / Infinitives optgroups,
    so the one deponent paradigm reads as a single self-contained group. Because
    every form is now core morphology, `POREUOMAI_OPTIONAL_GROUPS` is emptied (no
    non-core extensions left; the full participle declensions stay in
    `POREUOMAI_EXTRA_FORMS` for wrong-parse lookup, mirroring λύω whose drilled
    participles are recognition-nominative subsets).
  - **λύω present participles are linked copies in the Participles optgroup.**
    `'λύω → λύων'` (present active ptc) and `'λύω → λυόμενος'` (present m/p ptc) are
    added as their own `MORPHOLOGY_SETS` items / dropdown entries under
    `Participles` so they shuffle with the aorist participles and can be drilled
    alone — while the SAME forms also remain in the base `λύω` present paradigm
    (the present entry is unchanged). They're added to `LUO_VARIANTS`; the
    cumulative's per-form dedup collapses the overlap (λύων appears once). Unlike
    πορεύομαι (a single deponent kept whole), λύω is the teaching model, so its
    participles populate the cross-paradigm Participles shuffle.
- **Optional-paradigm completeness audit (`lemma_inventory.js`).** Every Mounce
  verb paradigm was checked for optional-form coverage (matters for wrong-parse
  lookup as well as the optional-extension toggle). Verbs WITH coverage before:
  λύω, γίνομαι, δίδωμι, τίθημι, ἵστημι. Added now, **ported verbatim from duff**
  (Greek + parses; chapters remapped to Mounce):
  - **λαμβάνω** (`'λαμβάνω → ἔλαβον'`) and **λείπω** (`'λείπω → ἔλιπον'`) — full
    optional coverage (present/imperfect/future indicative, 2nd-aorist
    subj/impv/inf, aorist passive, perfect, present + 2nd-aorist active + aorist
    passive participles), bringing the 2nd-aorist actives to γίνομαι parity.
  - **κρίνω** (`'κρίνω → κρινῶ'`) — participles (present κρίνων, **1st**-aorist
    κρίνας `-ας/-αντος`, aorist passive κριθείς) as `extraForms` ONLY (no
    drillable optional groups), mirroring duff — they back wrong-parse feedback.
  - Two new participle helpers: `aoristActiveParticipleParadigm(stem)` (2nd-aorist
    `-ών` type, e.g. λαβών/λιπών) and `presentActiveNtParticiple(accStem,
    bareStem, neuter)` (recessive `-ων` type), alongside the existing
    `aoristPassiveParticipleParadigm`.
  - **Hand-authored (no duff source)** — now also complete:
    - **ἀγαπάω / ποιέω / πληρόω** (α/ε/ο contracts): present-system gaps —
      present mid/pas indicative, imperfect active + mid/pas indicative, present
      infinitives (act + MP), present MP participle (via new
      `menosParticipleParadigm`), present active participle recognition
      nominatives (full contracted `-ῶν/-οῦντος` declension deferred). Future/
      aorist/perfect are uncontracted/regular, so not added.
    - **γράφω** (`'γράφω → ἐγράφην'`): 2nd-aor-passive non-indicatives (subj
      γραφῶ, impv γράφηθι, inf γραφῆναι, ptc γραφείς via new θ-less
      `eisParticipleParadigm`) + present active indicative.
    - **πορεύομαι** (`'πορεύομαι → πορεύσομαι'`): present + imperfect middle
      indicative, aorist (passive-form) ἐπορεύθην, present/aorist inf + impv,
      present middle participle (menos) + aorist passive participle (θ-type).
    - **δείκνυμι** (`'δείκνυμι (no reduplication)'`): present active indicative +
      inf, 1st-aorist ἔδειξα + inf, present/aorist active participle recognition
      nominatives (full μι-/-ας declensions deferred). All gated at Ch 36.
    - New helpers: `menosParticipleParadigm(accStem, bareStem, label)` (λυόμενος
      2-1-2 pattern, also handles contracted stems) and `eisParticipleParadigm`
      (θ-less 2nd-aor passive `-είς`). Every Mounce-drilled verb now has optional
      coverage; remaining gaps are the deferred accent-dense participle
      declensions noted above.
- **Added the "Irregular practice" selector section** (duff #269's
  `buildIrregularPracticeSelector` / `#irregularGrid`) — the five stem-flip
  flashcard sets (second-aorist / liquid-future / aorist-passive /
  perfect-active / μι-verb, changed letters diff-highlighted) now sit in their
  own selector section instead of being scattered through the per-week
  Supplemental groups. **Adapted, not copied:** duff's version rides on its
  chapter-regrouped Supplemental selector (#269–#272, skipped here), so Mounce
  keeps its week-grouped `buildSupplementalSelector` — it just skips flip sets
  (`isFlipSet`) and lists them in the new section ordered by `set.week`, via a
  shared `renderSupplementalEntry`. No `HIDDEN_SUPPLEMENTAL_KEYS`
  (`W4_SECOND_AORIST_STEMS` doesn't exist here). `deselectAllSupplementals` now
  leaves the other sections alone (`isParadigmPracticeKey`); `deselectAllIrregular`
  clears just the flip sets. NB: `stem_change_drills.js` here is still dormant —
  it points at duff-only `W4_*_STEMS` arrow-delimited vocab keys Mounce lacks,
  so it registers nothing (the flip sets carry the stem highlighting instead).
- **Fixed a latent crash** (not a duff change): `escapeAttr` was used in
  `syncParsingCustomParadigmsUi` but never defined in `main.js`, so entering
  parsing mode threw — now defined.
- **Back-filled the generalized "Variant forms as cards" panel** (duff #272 +
  #273 + #277) — earlier ports had skipped it as "duff irregular-cards infra
  Mounce lacks," but Mounce ships all five flip sets, so it was just wiring.
  `IRREGULAR_CARD_CONFIGS` generalizes the old single `secondAoristCards` toggle
  to 5 (`2aor`/`lfut`/`aorpass`/`perfact`/`mi`), each default-on once its Mounce
  chapter (20/22/24/25/34) is selected, plus "Show tense on irregular cards".
  Adapted: Mounce chapters/flip keys, the `flipLookupKey` accent fold kept on
  both sides, and a `secondAoristCards → irregularCards` save migration. So
  #272/#273/#277's irregular-cards bits are no longer "skipped." (If a NEWER
  duff PR refines this infra, it's now portable here.)
- **#289–#292 — evaluated; mostly skipped as duff-specific (not translatable):**
  - **#289** "Required only → Starred words only" rename — **skip**: Mounce uses
    "required / optional" everywhere (the `(req.)/(opt.)` card tags), so renaming
    just the toggle would clash. Its Advanced-settings reorg (reset / progress
    collapsibles) is duff's own layout.
  - **#290** Reset-actions / Progress layout reorg — **skip** (duff layout). The
    "star non-name Ch.1 vocab" (ἀμήν, ῥαββί) is duff's BBG Chapter 1; Mounce's
    chapter vocab differs, so starring is a Mounce content decision, not a port.
  - **#291** "Merge legacy supplemental sets away" (W1O/W3O/W6O/W7O/W8O →
    chapters/grammar; `LEGACY_GRAMMAR_TIE`) — **N/A**: Mounce has no
    `week_N_supplemental` / `wNo_supplemental` files. Chapter-grouped selector
    consistency — **N/A** (Mounce groups by Part). **Applied:** the one
    model-agnostic bit — hide the empty controls-bar frame in reader mode
    (`syncLayoutVisibility`).
  - **#292** selector spacing tweak — **skip** (rides on #289's starred toggle).
  - **#293–#294** CSS fixes to `.selector-required-toggle` (dead margin /
    30px→15px gap) — **N/A**: that mirror "Starred words only" toggle is #289's,
    which Mounce never added, so there's no element to style.
