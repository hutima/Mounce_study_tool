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

**Last reviewed duff PR: #292 (`a82839e`, 2026-06-20).** When checking for new
duff work, diff `origin/main` against that commit forward.

- **Ported in full through duff #288** (parsing undo + 3-tier scoring,
  restructured parse summary + "Why this form" notes, 3rd-person imperative
  parsing at Mounce ch 33, and "Build mode" / interactive paradigm lookup).
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
