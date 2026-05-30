// Second-aorist verb flashcards: each card has the present form on one face
// with its English gloss as a subtitle, and the aorist form on the other face
// with its English gloss as a subtitle. Characters that differ between the
// two stems are diff-highlighted by the renderer (see render.js's stem-flip
// branch) so the student can spot the stem change at a glance.
//
// Both faces also print the verbal (aorist) stem after a comma — the same stem
// on each side — so the form pair is anchored to the one stem that connects
// them (e.g. λαμβάνω, λαβ- ↔ ἔλαβον, λαβ-). keyVerb flags the high-frequency
// verbs worth singling out for a "★ key verb" badge.
//
// Mounce introduces second aorist in ch 22-23 (Part 3 — Indicative Verb), so
// these are tagged with week: 3 for grouping under the Part III supplemental
// section in the chapter selector.

(function () {
  if (typeof window.registerSupplementalVocabSet !== 'function') return;

  function entry(present, presentGloss, aorist, aoristGloss, stem, note, keyVerb) {
    return {
      stemFlip: true,
      stemFlipAorist: 'aorist active (1st sg.)',
      g: present,
      e: presentGloss,
      aorist,
      aoristGloss,
      stem: stem || '',
      stemNote: note || '',
      keyVerb: !!keyVerb,
      required: true
    };
  }

  window.registerSupplementalVocabSet('W3_SECOND_AORIST_FLIP', {
    label: 'Second-aorist verbs — present ↔ aorist flashcards',
    week: 3,
    cards: [
      entry('ἁμαρτάνω', 'I sin',    'ἥμαρτον', 'I sinned',    'ἁμαρτ-',   'shortened 2nd-aorist stem; α → η augment'),
      entry('ἀποθνῄσκω', 'I die',   'ἀπέθανον', 'I died',     'ἀποθαν-',  'shortened stem; ε-augment inside the compound'),
      entry('βάλλω', 'I throw',     'ἔβαλον', 'I threw',      'βαλ-',     'doubled λλ → single λ; ε-augment', true),
      entry('εὑρίσκω', 'I find',    'εὗρον', 'I found',       'εὑρ-',     'lost -ισκ- suffix; rough breathing kept'),
      entry('καταλείπω', 'I leave', 'κατέλιπον', 'I left',     'καταλιπ-', 'ει → ι in stem; augment after κατα-'),
      entry('λαμβάνω', 'I take',    'ἔλαβον', 'I took',       'λαβ-',     'lost -αν- suffix and the nasal', true),
      entry('μανθάνω', 'I learn',   'ἔμαθον', 'I learned',    'μαθ-',     'lost -αν- suffix and the nasal'),
      entry('πάσχω', 'I suffer',    'ἔπαθον', 'I suffered',   'παθ-',     'σχ → θ stem change'),
      entry('πίνω', 'I drink',      'ἔπιον', 'I drank',       'πι-',      'lost the nasal -ν-'),
      entry('φεύγω', 'I flee',      'ἔφυγον', 'I fled',       'φυγ-',     'ευ → υ vowel shortening'),
      entry('βαίνω', 'I go',        'ἔβην', 'I went',         'βη-',      'athematic -ην ending; different aorist pattern'),
      entry('γινώσκω', 'I know',    'ἔγνων', 'I knew',        'γνω-',     'lost -ισκ- suffix; athematic -ων ending', true),
      entry('ἄγω', 'I lead',        'ἤγαγον', 'I led',        'ἀγαγ-',    'reduplicated stem ἀγαγ-', true),
      entry('ἔχω', 'I have',        'ἔσχον', 'I had',         'σχ-',      'σχ- stem replaces ἔχ-', true),
      entry('πίπτω', 'I fall',      'ἔπεσον', 'I fell',       'πεσ-',     'πτ → πεσ stem change'),
      entry('γίνομαι', 'I become',  'ἐγενόμην', 'I became',   'γεν-',     'deponent -ομην; lost the nasal', true),
      entry('ἔρχομαι', 'I come',    'ἦλθον', 'I came',        'ἐλθ-',     'completely different root (ἐλθ-)', true),
      entry('λέγω', 'I say',        'εἶπον', 'I said',        'εἰπ-',     'completely different root (ἐπ-)', true),
      entry('ἐσθίω', 'I eat',       'ἔφαγον', 'I ate',        'φαγ-',     'completely different root (φαγ-)'),
      entry('ὁράω', 'I see',        'εἶδον', 'I saw',         'ἰδ-',      'completely different root (ἰδ-)', true),
      entry('φέρω', 'I carry',      'ἤνεγκον', 'I carried',   'ἐνεγκ-',   'completely different root (ἐνεγκ-); reduplicated')
    ]
  });
})();
