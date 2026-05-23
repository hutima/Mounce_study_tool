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
