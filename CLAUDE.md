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

**Last reviewed duff commit: `5775ce0b` (tip of duff `main`, 2026-06-22; merge of
PR #304).** When checking for new duff work, diff `origin/main` against that
commit forward. (PRs #300/#301, previously ported ahead, are now merged on duff
`main` and folded into the boundary; #302/#303/#304 ported below. Duff's
`f92a2e6d` "Add files via upload" is just a binary `Paradigms.pdf` reference
sheet — a duff asset, not code; not ported.)

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
