#!/usr/bin/env python3
"""
Precompute a Mounce-keyed graded reader from a public-domain Greek NT.

Pipeline
  Mounce per-chapter vocab (js/data/words.js)
      ↓ parse headword → canonical lemma string(s)
      ↓ resolve each lemma → Strong's number(s) via inverse Strong's lookup
      ↓ build cumulative Strong's-vocab-set per chapter
  Robinson-Pierpont 2005 Byzantine text (accented, parsed, with Strong's)
      ↓ for each verse: every token's Strong's# must be in chapter set
      ↓ assign verse to the earliest chapter at which that is true
  → js/data/reader.js  (window.READER_CHAPTERS = [[ch1], [ch2], ...])

We match on Strong's number, not on lemma string, so spelling and
breathing variants (Δαυίδ↔Δαβίδ, Ἰεροσόλυμα↔Ἱεροσόλυμα, etc.) line up
automatically through Strong's.

Sources (both public domain):
  - github.com/biblicalhumanities/Byzantine-Textform-Robinson-Pierpont-2005
  - github.com/openscriptures/strongs
"""

import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict

REPO = Path(__file__).resolve().parent.parent
WORDS_JS = REPO / "js/data/words.js"
READER_JS = REPO / "js/data/reader.js"
RP_PATH = Path("/tmp/rp/texts/accented-parsed/byzantine-textform-2005.txt")
STRONGS_XML = Path("/tmp/strongs/greek/StrongsGreekDictionaryXML_1.4/strongsgreek.xml")

# Per-chapter verse cap — keeps the bundle small and the app responsive.
MAX_VERSES_PER_CHAPTER = 80

# RP book code → short display reference
BOOK_REF = {
    "MT":"Mt", "MR":"Mk", "LU":"Lk", "JOH":"Jn", "AC":"Ac",
    "RO":"Ro", "1CO":"1Co", "2CO":"2Co", "GA":"Ga", "EPH":"Eph",
    "PHP":"Php", "COL":"Col", "1TH":"1Th", "2TH":"2Th",
    "1TI":"1Ti", "2TI":"2Ti", "TIT":"Tit", "PHM":"Phm", "HEB":"Heb",
    "JAS":"Jas", "1PE":"1Pe", "2PE":"2Pe", "1JO":"1Jn", "2JO":"2Jn",
    "3JO":"3Jn", "JUDE":"Jud", "RE":"Rev",
}
BOOK_ORDER_IDX = {b: i for i, b in enumerate(BOOK_REF.keys())}

# Some Mounce vocab entries are *forms*, not lemmas — students learn
# the fixed surface form before the full paradigm. Match on the surface
# form only (no other inflected form of the underlying verb unlocks).
FORM_AS_VOCAB = {
    "εἶπεν",     # ch 7 — aorist of λέγω
    "ἀπεκρίθη",  # aorist passive of ἀποκρίνομαι
    "ἔφη",       # imperfect of φημί
}

# Multi-lemma vocab entries (article, οὐ family, εἰ μή, …)
MULTI_LEMMA = {
    "ὁ, ἡ, τό":          ["ὁ"],
    "οὐ, οὐκ, οὐχ":      ["οὐ"],
    "ὅς, ἥ, ὅ":          ["ὅς"],
    "ὅδε, ἥδε, τόδε":    ["ὅδε"],
    "ὅστις, ἥτις, ὅ τι": ["ὅστις"],
    "τίς, τί":           ["τίς"],
    "τις, τι":           ["τὶς"],
    "εἰ μή":             ["εἰ", "μή"],
}

# Mounce-headword → Strong's-headword aliases (manually maintained)
# when the breathing, accent, or lemma form differs. Resolved through
# the Strong's lemma→number inverse map below.
LEMMA_ALIASES = {
    # Koronis-leading capital → smooth-breathing capital
    "᾽Αβραάμ":      "Ἀβραάμ",
    "᾽Ιησοῦς":      "Ἰησοῦς",
    "᾽Ιωάννης":     "Ἰωάννης",
    # Spelling / breathing
    "Δαυίδ":        "Δαβίδ",
    "Ἰεροσόλυμα":   "Ἱεροσόλυμα",
    "Ἰερουσαλήμ":   "Ἱερουσαλήμ",
    "ὥδε":          "ὧδε",
    "οὕτως":        "οὕτω",
    "λοιπός":       "λοιποί",
    "τε":           "τέ",
    "Μωϋσῆς":       "Μωσεύς",
    # Mounce verb form ≠ Strong's headword
    "φοβέομαι":     "φοβέω",
    "δείκνυμι":     "δεικνύω",
    "οἶδα":         "εἴδω",
    "ἄρχωμαι":      "ἄρχομαι",
}


def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


# ── Strong's dictionary ─────────────────────────────────────────────────
def parse_strongs() -> tuple[dict[int, str], dict[str, int]]:
    text = STRONGS_XML.read_text(encoding="utf-8")
    text = re.sub(r"<!DOCTYPE.*?\]>", "", text, count=1, flags=re.DOTALL)
    root = ET.fromstring(text)

    by_num: dict[int, str] = {}
    by_lemma: dict[str, int] = {}
    for entry in root.findall(".//entry"):
        try:
            num = int(entry.attrib.get("strongs", ""))
        except ValueError:
            continue
        greek_el = entry.find("greek")
        if greek_el is None:
            continue
        uni = greek_el.attrib.get("unicode")
        if not uni:
            continue
        lemma = nfc(uni)
        by_num[num] = lemma
        # Don't overwrite earlier #s when two lemmas collide — earlier
        # (lower #) wins, which is usually the more common word.
        by_lemma.setdefault(lemma, num)
    return by_num, by_lemma


# ── Mounce vocab parsing ────────────────────────────────────────────────
PAREN_RE = re.compile(r"\([^)]*\)")
DASH_SUFFIX_RE = re.compile(r"\s+-\S+")

def extract_lemmas(raw: str) -> list[str]:
    """Convert a Mounce vocab headword to one or more lemma strings."""
    raw = nfc(raw).strip()
    if raw in FORM_AS_VOCAB:
        return []   # handled separately as form vocab
    if raw in MULTI_LEMMA:
        return [nfc(x) for x in MULTI_LEMMA[raw]]

    s = PAREN_RE.sub("", raw)               # strip "(adverb)", "(ἐμοῦ)" …
    s = s.split("+", 1)[0]                   # strip "+gen.", "+acc." …
    s = s.split(",", 1)[0]                   # strip paradigm tail
    s = DASH_SUFFIX_RE.sub("", s)            # strip " -οῦ" (no comma)
    s = s.strip()
    if not s or not re.search(r"[Ͱ-Ͽἀ-῿]", s):
        return []
    # If two Greek words remain (rare), take the first as the lemma
    s = s.split()[0] if " " in s else s
    s = nfc(s)
    return [LEMMA_ALIASES.get(s, s)]


def parse_words_js() -> tuple[dict[int, set[str]], dict[int, set[str]]]:
    text = WORDS_JS.read_text(encoding="utf-8")
    ch_lemmas: dict[int, set[str]] = defaultdict(set)
    ch_forms:  dict[int, set[str]] = defaultdict(set)

    block_re = re.compile(
        r'"(\d+)":\s*\{[^{}]*?"label":\s*"([^"]+)"[^{}]*?"cards":\s*\[(.*?)\]\s*\}',
        re.DOTALL,
    )
    for m in block_re.finditer(text):
        ch = int(m.group(1))
        if not 1 <= ch <= 36:
            continue
        for gm in re.finditer(r'"g":\s*"([^"]+)"', m.group(3)):
            raw = nfc(gm.group(1)).strip()
            if raw in FORM_AS_VOCAB:
                ch_forms[ch].add(raw)
                continue
            for lem in extract_lemmas(raw):
                ch_lemmas[ch].add(lem)
    return dict(ch_lemmas), dict(ch_forms)


# ── RP NT parsing ───────────────────────────────────────────────────────
WORD_LINE = re.compile(
    r"^([A-Z0-9]+)\s+(\d+):(\d+)\s+\S+\s+\S+\s+(\S+)\s+(\S+)\s+(\S+)\s*$"
)

def parse_rp() -> list[dict]:
    verses: dict[tuple, dict] = {}
    for line in RP_PATH.read_text(encoding="utf-8").splitlines():
        m = WORD_LINE.match(line.rstrip())
        if not m:
            continue
        book, ch_s, vs_s, accented, morph, strongs_raw = m.groups()
        if book not in BOOK_REF:
            continue
        ch, vs = int(ch_s), int(vs_s)
        strongs_num = int(strongs_raw.split("&", 1)[0])
        key = (book, ch, vs)
        if key not in verses:
            verses[key] = {
                "book": book, "ch": ch, "vs": vs,
                "ref": f"{BOOK_REF[book]} {ch}:{vs}",
                "tokens": [],
            }
        verses[key]["tokens"].append({
            "surface": nfc(accented),
            "strongs": strongs_num,
        })
    return sorted(verses.values(),
                  key=lambda v: (BOOK_ORDER_IDX[v["book"]], v["ch"], v["vs"]))


# ── Verse readability ──────────────────────────────────────────────────
PUNCT_RE = re.compile(r"[^\w]", re.UNICODE)

def verse_readable(verse: dict, strongs_set: set[int], form_set: set[str]) -> bool:
    for tok in verse["tokens"]:
        if tok["strongs"] in strongs_set:
            continue
        if PUNCT_RE.sub("", tok["surface"]).lower() in {f.lower() for f in form_set}:
            # Note: form match is loose (case/diacritic-tolerant lowercasing)
            continue
        return False
    return True


def render_verse(verse: dict) -> str:
    return " ".join(t["surface"] for t in verse["tokens"]).strip()


# ── Output ─────────────────────────────────────────────────────────────
def emit_reader_js(per_chapter: list[list[dict]]) -> str:
    """Emit `[{ chapter: N, verses: [{g,r},…] }, …]` (only non-empty chapters)."""
    chunks = []
    for ch_idx, items in enumerate(per_chapter, start=1):
        if not items:
            continue
        verse_lines = []
        for it in items:
            g = it["g"].replace("\\", "\\\\").replace('"', '\\"')
            r = it["r"].replace("\\", "\\\\").replace('"', '\\"')
            verse_lines.append(f'      {{ g: "{g}", r: "{r}" }},')
        chunks.append(
            f"  {{ chapter: {ch_idx}, verses: [\n"
            + "\n".join(verse_lines)
            + "\n    ] }"
        )
    body = ",\n".join(chunks)

    return (
        "// ═══════════════════════════════════════════════════════════════════════\n"
        "//  READER DATA — Mounce variant (precomputed, vocab-constrained)\n"
        "// ═══════════════════════════════════════════════════════════════════════\n"
        "//\n"
        "//  Verses are taken from the Robinson-Pierpont 2005 Byzantine Textform\n"
        "//  (public domain, textually close to the Textus Receptus). Each verse\n"
        "//  is placed in the EARLIEST Mounce BBG3 chapter at which every word's\n"
        "//  lemma is already in the cumulative vocab through that chapter, joined\n"
        "//  on Strong's number. Each chapter is capped at "
        f"{MAX_VERSES_PER_CHAPTER}\n"
        "//  verses in canonical NT order. Generated by /tmp/build_reader.py —\n"
        "//  do not hand-edit; re-run the script to regenerate.\n"
        "//\n"
        "//  Sources:\n"
        "//   - github.com/biblicalhumanities/Byzantine-Textform-Robinson-Pierpont-2005\n"
        "//   - github.com/openscriptures/strongs (Strong's Greek Dictionary)\n"
        "// ═══════════════════════════════════════════════════════════════════════\n"
        "\n"
        "window.READER_CHAPTERS = [\n"
        + body
        + "\n];\n"
    )


# ── Main ───────────────────────────────────────────────────────────────
def main():
    print("Parsing Strong's dictionary …")
    by_num, by_lemma = parse_strongs()
    print(f"  {len(by_num)} entries; sanity #976 = {by_num.get(976)!r}")

    print("\nParsing Mounce vocab …")
    ch_lemmas, ch_forms = parse_words_js()
    total = sum(len(s) for s in ch_lemmas.values()) + sum(len(s) for s in ch_forms.values())
    print(f"  {total} vocab tokens across {len([c for c in ch_lemmas if ch_lemmas[c]])} chapters")

    # Resolve every Mounce lemma → Strong's #
    ch_strongs: dict[int, set[int]] = {}
    unresolved: set[str] = set()
    for ch in range(1, 37):
        s_set: set[int] = set()
        for lem in ch_lemmas.get(ch, set()):
            num = by_lemma.get(lem)
            if num is None:
                unresolved.add(lem)
            else:
                s_set.add(num)
        ch_strongs[ch] = s_set
    if unresolved:
        print(f"  WARNING: {len(unresolved)} Mounce lemmas unresolved (verses with "
              f"these words will never be assigned):")
        for w in sorted(unresolved):
            print(f"    {w!r}")
    else:
        print("  All Mounce lemmas resolved to Strong's numbers ✓")

    print("\nParsing RP2005 NT …")
    verses = parse_rp()
    print(f"  {len(verses)} verses, {sum(len(v['tokens']) for v in verses)} tokens")

    # Cumulative-through-chapter Strong's# + form sets
    cum_s: dict[int, set[int]] = {}
    cum_f: dict[int, set[str]] = {}
    rs: set[int] = set()
    rf: set[str] = set()
    for ch in range(1, 37):
        rs |= ch_strongs.get(ch, set())
        rf |= ch_forms.get(ch, set())
        cum_s[ch] = set(rs)
        cum_f[ch] = set(rf)

    # Assign each verse to its earliest readable chapter
    per_chapter: list[list[dict]] = [[] for _ in range(37)]
    for v in verses:
        for ch in range(1, 37):
            if verse_readable(v, cum_s[ch], cum_f[ch]):
                per_chapter[ch].append({"g": render_verse(v), "r": v["ref"]})
                break

    print("\nVerses newly readable per chapter (pre-cap):")
    cumulative = 0
    for ch in range(1, 37):
        n = len(per_chapter[ch])
        cumulative += n
        if n or ch <= 16:
            print(f"  ch{ch:2d}: +{n:5d}  (cumulative {cumulative})")

    out = [per_chapter[ch][:MAX_VERSES_PER_CHAPTER] for ch in range(1, 37)]
    text = emit_reader_js(out)
    READER_JS.write_text(text, encoding="utf-8")
    final_count = sum(len(c) for c in out)
    print(f"\nWrote {READER_JS} ({len(text):,} bytes, {final_count} verses)")


if __name__ == "__main__":
    main()
