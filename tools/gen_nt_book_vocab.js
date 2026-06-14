#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
//  Generator for js/data/nt_book_vocab.js
// ═══════════════════════════════════════════════════════════════════════
//  Builds the per-book NT vocabulary that LINKS to existing cards.
//
//  What it does:
//   1. Loads every vocab card already in the app (words.js + supplementals +
//      advanced buckets) under a tiny `window` shim, exactly as the browser
//      loads them, to learn each card's headword (`g`).
//   2. Downloads the SBLGNT, morphologically tagged (morphgnt/sblgnt), and
//      counts how often each lexeme (lemma) occurs in each of the 27 books.
//   3. Resolves each book lexeme to the exact headword of an existing card.
//      Matching is accent-sensitive first, then accent-insensitive, with a
//      few Strong's-validated aliases for deponents the app cites in the
//      middle voice (ἄρχω→ἄρχομαι G757, εὐαγγελίζω→εὐαγγελίζομαι G2097,
//      ἅπτω→ἅπτομαι G680/681) and reciprocal ἀλλήλων (G240). Lexemes with no
//      card (rare/absent lemmas, e.g. the δέομαι simplex) are dropped.
//   4. Emits js/data/nt_book_vocab.js: a deduped master headword list plus,
//      per book, the indices of its linked headwords in descending in-book
//      frequency order. The runtime slices those into groups of 50.
//
//  Run:  node tools/gen_nt_book_vocab.js   (needs network + Node 18+ for fetch)
//
//  Re-run whenever the card inventory changes (new chapters/advanced buckets);
//  it only ever rewrites js/data/nt_book_vocab.js.

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'js/data/nt_book_vocab.js');
const MGNT_BASE = 'https://raw.githubusercontent.com/morphgnt/sblgnt/master/';

// MorphGNT file stem -> [display name, app key], in canonical NT order.
const BOOKS = [
  ['61-Mt','Matthew','MT'],['62-Mk','Mark','MK'],['63-Lk','Luke','LK'],['64-Jn','John','JN'],
  ['65-Ac','Acts','AC'],['66-Ro','Romans','RO'],['67-1Co','1 Corinthians','1CO'],['68-2Co','2 Corinthians','2CO'],
  ['69-Ga','Galatians','GA'],['70-Eph','Ephesians','EPH'],['71-Php','Philippians','PHP'],['72-Col','Colossians','COL'],
  ['73-1Th','1 Thessalonians','1TH'],['74-2Th','2 Thessalonians','2TH'],['75-1Ti','1 Timothy','1TI'],['76-2Ti','2 Timothy','2TI'],
  ['77-Tit','Titus','TIT'],['78-Phm','Philemon','PHM'],['79-Heb','Hebrews','HEB'],['80-Jas','James','JAS'],
  ['81-1Pe','1 Peter','1PE'],['82-2Pe','2 Peter','2PE'],['83-1Jn','1 John','1JN'],['84-2Jn','2 John','2JN'],
  ['85-3Jn','3 John','3JN'],['86-Jud','Jude','JUD'],['87-Re','Revelation','RE'],
];

// ── 1. load the app's card inventory ──────────────────────────────────────
function loadInventory() {
  const sb = {}; sb.window = sb; sb.globalThis = sb; sb.self = sb; sb.console = console;
  sb.document = { addEventListener() {}, getElementById: () => null };
  vm.createContext(sb);
  const run = rel => {
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sb, { filename: rel }); }
    catch (e) { console.error('  warn: failed to load', rel, '-', e.message); }
  };
  const dir = d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.js')).sort().map(f => `${d}/${f}`);
  ['js/data/words.js','js/data/morphology.js','js/data/lemma_inventory.js','js/data/supplemental.js','js/data/grammar.js']
    .forEach(run);
  dir('js/data/supplementals').forEach(run);
  dir('js/data/advanced').forEach(run);
  run('js/logic/pos_logic.js');

  const SETS = sb.SETS || {};
  const rows = [];
  for (const key of Object.keys(SETS)) {
    const set = SETS[key];
    if (!Array.isArray(set.cards)) continue;
    const type = set.type || (set.advanced ? 'advanced' : set.supplemental ? 'supplemental' : 'other');
    set.cards.forEach(c => rows.push({ key, g: c.g, type, advanced: !!set.advanced }));
  }
  return rows;
}

// ── normalization ─────────────────────────────────────────────────────────
const GREEK = /[^Ͱ-Ͽἀ-῿̀-ͯ]/g;
const stripMarks = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
// Standalone (spacing) Greek diacritics: koronis ᾽, psili, dasia, the spacing
// accents, the legacy tonos/acute. Mounce writes a capital vowel that carries a
// breathing as "᾽" + plain capital (e.g. "᾽Ιησοῦς") rather than the precomposed
// Ἰ, so unless these are dropped the headword never folds to the same key as its
// MorphGNT lemma; they hold no info the accent-insensitive key keeps anyway.
const SPACING_DIACRITICS = /[´΄΅᾽-῁῍-῏῝-῟῭-`´῾]/g;
const keyA = s => (s || '').normalize('NFC').toLowerCase().replace(/ς/g, 'σ').replace(SPACING_DIACRITICS, '').normalize('NFD').replace(GREEK, '').normalize('NFC');
const keyB = s => stripMarks(keyA(s));
const ARTICLES = new Set(['ο', 'η', 'το', 'οι', 'αι', 'τα']);
const isArticle = t => ARTICLES.has(keyB(t));
function firstHead(seg) {
  let toks = String(seg || '').split(/[\s,]+/).filter(Boolean);
  if (toks.length > 1 && isArticle(toks[0]) && !isArticle(toks[1])) toks = toks.slice(1);
  return (toks[0] || '').replace(/^[-–—]+|[-–—]+$/g, '');
}
function withParen(h, add) { add(h); if (h.includes('(')) { add(h.replace(/[()]/g, '')); add(h.replace(/\([^)]*\)/g, '')); } }
function cardKeys(g) { // index an app card under each slash-spelling's lead word
  const out = new Set();
  const add = h => { const a = keyA(h), b = keyB(h); if (a) out.add('A:' + a); if (b) out.add('B:' + b); };
  for (const seg of String(g || '').split('/')) { const h = firstHead(seg); if (h) withParen(h, add); }
  return out;
}
function lemmaKeys(lemma) { // look up a MorphGNT lemma (may carry "(ν)")
  const out = new Set();
  const add = h => { const a = keyA(h), b = keyB(h); if (a) out.add('A:' + a); if (b) out.add('B:' + b); };
  withParen(String(lemma), add);
  return out;
}

// ── 2. download MorphGNT, count per book ──────────────────────────────────
async function loadFrequencies() {
  const bookLemmaCount = {};
  const ntCount = new Map();
  for (const [file] of BOOKS) {
    const res = await fetch(MGNT_BASE + file + '-morphgnt.txt');
    if (!res.ok) throw new Error(`download ${file}: HTTP ${res.status}`);
    const text = await res.text();
    const m = new Map();
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      const cols = line.split(' ').filter(Boolean);
      const lemma = cols[cols.length - 1]; // last column = lemma
      m.set(lemma, (m.get(lemma) || 0) + 1);
      ntCount.set(lemma, (ntCount.get(lemma) || 0) + 1);
    }
    bookLemmaCount[file] = m;
  }
  return { bookLemmaCount, ntCount };
}

// ── 3 & 4. match, order, emit ─────────────────────────────────────────────
async function main() {
  console.log('Loading app card inventory…');
  const inv = loadInventory();
  console.log(`  ${inv.length} cards`);
  console.log('Downloading SBLGNT (MorphGNT)…');
  const { bookLemmaCount, ntCount } = await loadFrequencies();

  const prio = r => (r.type === 'chapter' ? 0 : r.advanced ? 1 : 2);
  // Deterministic among same-priority collisions (so output doesn't depend on
  // file-load order): prefer the lower set key, then the lower headword.
  const tie = r => `${String(r.key).padStart(8, '0')}|${r.g}`;
  const indexA = new Map(), indexB = new Map();
  const put = (v, r) => {
    const idx = v.startsWith('A:') ? indexA : indexB;
    const cur = idx.get(v);
    if (!cur || prio(r) < prio(cur) || (prio(r) === prio(cur) && tie(r) < tie(cur))) idx.set(v, r);
  };
  for (const r of inv) for (const v of cardKeys(r.g)) put(v, r);

  // Strong's-validated aliases: a MorphGNT lemma the app stores under a
  // headword it doesn't fold to. Mounce cites the deponent ἄρχομαι (G757) as
  // "ἄρχωμαι", so the lemma ἄρχω needs the bridge. (εὐαγγελίζω and ἀλλήλων match
  // their Mounce headwords directly, and ἅπτω/ἅπτομαι has no Mounce card, so the
  // Duff aliases for those don't apply here.)
  const ALIASES = [['ἄρχω', 'ἄρχωμαι']];
  for (const [lemma, cardG] of ALIASES) {
    const row = inv.find(r => keyB(firstHead(r.g.split('/')[0])) === keyB(firstHead(cardG)));
    if (!row) { console.error('  warn: alias miss', lemma, '->', cardG); continue; }
    for (const v of lemmaKeys(lemma)) { const idx = v.startsWith('A:') ? indexA : indexB; if (!idx.has(v)) idx.set(v, row); }
  }

  const lookup = lemma => {
    for (const v of lemmaKeys(lemma)) if (v.startsWith('A:') && indexA.has(v)) return indexA.get(v);
    for (const v of lemmaKeys(lemma)) if (v.startsWith('B:') && indexB.has(v)) return indexB.get(v);
    return null;
  };

  const collator = new Intl.Collator('el');
  const outBooks = [];
  const unmatched = new Map();
  BOOKS.forEach(([file, name, key], i) => {
    const byG = new Map();
    for (const [lemma, cnt] of bookLemmaCount[file]) {
      const row = lookup(lemma);
      if (!row) { if (!unmatched.has(lemma)) unmatched.set(lemma, ntCount.get(lemma) || 0); continue; }
      const cur = byG.get(row.g);
      if (cur) { cur.count += cnt; cur.nt = Math.max(cur.nt, ntCount.get(lemma) || 0); }
      else byG.set(row.g, { g: row.g, count: cnt, nt: ntCount.get(lemma) || 0 });
    }
    const refs = [...byG.values()]
      .sort((a, b) => (b.count - a.count) || (b.nt - a.nt) || collator.compare(a.g, b.g))
      .map(e => e.g);
    outBooks.push({ key, name, order: i + 1, refs });
  });

  // compact master list: most-referenced headwords get the smallest indices
  const refFreq = new Map();
  for (const b of outBooks) for (const g of b.refs) refFreq.set(g, (refFreq.get(g) || 0) + 1);
  const lemmas = [...refFreq.keys()].sort((a, b) => (refFreq.get(b) - refFreq.get(a)) || collator.compare(a, b));
  const lemmaIndex = new Map(lemmas.map((g, i) => [g, i]));

  const esc = s => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const lemmasLine = lemmas.map(g => '"' + esc(g) + '"').join(',');
  const body = outBooks.map(b =>
    `    { key: "${b.key}", name: "${esc(b.name)}", order: ${b.order}, refs: [${b.refs.map(g => lemmaIndex.get(g)).join(',')}] },`
  ).join('\n');

  const out = `// ═══════════════════════════════════════════════════════════════════════
//  NT BOOK VOCAB — per-book vocabulary that LINKS to existing cards.
// ═══════════════════════════════════════════════════════════════════════
//  GENERATED FILE — do not hand-edit. Regenerate with
//  \`node tools/gen_nt_book_vocab.js\` when the card inventory changes.
//
//  Each book lists, in descending order of frequency WITHIN that book, the
//  exact headword (\`g\`) of every existing app card whose lexeme occurs in the
//  book. The runtime resolves each headword to its live card, so these are
//  links — not new cards — and study progress is shared with the card's home
//  chapter / advanced bucket. Sub-groups of 50 are positional slices of each
//  book's frequency-ordered list.
//
//  Per-book lexeme frequencies: SBLGNT via MorphGNT (morphgnt/sblgnt).
//  Lexeme identity cross-checked against Strong's numbers — the same source
//  the Advanced buckets were built from. Lexemes occurring in a book but not
//  present as a card (rare/absent lemmas, e.g. the δέομαι simplex) are omitted.
//
//  Shape: LEMMAS is the deduplicated list of card headwords (\`g\`); each book's
//  \`refs\` are indices into LEMMAS, in descending in-book frequency order.
(function () {
  const LEMMAS = [${lemmasLine}];
  const BOOKS = [
${body}
  ].map(b => ({ ...b, refs: b.refs.map(i => LEMMAS[i]) }));
  window.NT_BOOK_VOCAB = { books: BOOKS, groupSize: 50 };
  if (typeof window.registerNtBookVocab === 'function') window.registerNtBookVocab(BOOKS);
})();
`;
  fs.writeFileSync(OUT, out);
  const total = outBooks.reduce((n, b) => n + b.refs.length, 0);
  console.log(`Wrote ${path.relative(ROOT, OUT)}: ${outBooks.length} books, ${lemmas.length} unique headwords, ${total} links.`);
  const un = [...unmatched.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`Lexemes with no card (omitted): ${un.length}` + (un.length ? ' — top: ' + un.slice(0, 8).map(([l, c]) => `${l}(${c})`).join(' ') : ''));
}

main().catch(e => { console.error(e); process.exit(1); });
