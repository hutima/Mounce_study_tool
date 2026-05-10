// ═══════════════════════════════════════════════════════════════════════
//  READER DATA — Mounce variant (no NT verse curation)
// ═══════════════════════════════════════════════════════════════════════
//
//  The Duff build of this app shipped a graded reader of NT verses
//  hand-picked so each chapter's verses used only that chapter's
//  introduced vocabulary. That dataset is heavily Duff-tailored and
//  cannot be ported to Mounce's sequence without rebuilding it from
//  scratch. The Mounce variant therefore ships with NO verses; the
//  Translate tab is driven entirely by the synthetic-phrase drills in
//  reader_translations.js.
//
//  This file is intentionally minimal — keeping the global symbol
//  in place so main.js can keep its existing reader-render path.
// ═══════════════════════════════════════════════════════════════════════

window.READER_CHAPTERS = [];
