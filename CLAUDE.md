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

**Last reviewed duff PR: #297 (`0dda000`, 2026-06-21).** When checking for new
duff work, diff `origin/main` against that commit forward.

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
  and is closed in favour of this fuller port.
- **Ported duff #297** — parsing undo credit is now `0.5^(undos+1)` (a single
  undo → 0.25, was 0.5).
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
