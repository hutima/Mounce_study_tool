// Service worker for the Mounce BBG Greek Flashcards PWA.
//
// GitHub Pages note: all app-shell URLs are resolved relative to the
// service worker registration scope so this works both at a domain root
// and at a project path such as https://user.github.io/repository/.
const CACHE_NAME = 'mounce-bbg-greek-pwa-v92';
const BASE_URL = new URL('./', self.registration.scope);

const APP_SHELL_PATHS = [
  './',
  'index.html',
  'pages/memorization.html',
  'styles.css?v=92',
  'manifest.json?v=92',
  'favicon.svg?v=92',
  'js/data/words.js?v=92',
  'js/data/morphology.js?v=92',
  'js/data/lemma_inventory.js?v=92',
  'js/data/supplemental.js?v=92',
  'js/data/grammar.js?v=92',
  'js/data/parsing_examples.js?v=92',
  'js/data/concept_examples.js?v=92',
  'js/data/grammar_examples.js?v=92',
  'js/data/setMeta.js?v=92',
  'js/logic/pos_logic.js?v=92',
  'js/data/reader.js?v=92',
  'js/data/reader_verse_literals.js?v=92',
  'js/data/reader_translations.js?v=92',
  'js/data/supplementals/mounce_paradigms.js?v=92',
  'js/data/supplementals/stem_change_drills.js?v=92',
  'js/data/supplementals/second_aorist_flip.js?v=92',
  'js/data/supplementals/w3_aorist_passive_flip.js?v=92',
  'js/data/supplementals/w3_perfect_active_flip.js?v=92',
  'js/data/supplementals/w4_mi_verb_principal_parts_flip.js?v=92',
  'js/app/main.js?v=92',
  'js/data/advanced/advanced_01.js?v=92',
  'js/data/advanced/advanced_02.js?v=92',
  'js/data/advanced/advanced_03.js?v=92',
  'js/data/advanced/advanced_04.js?v=92',
  'js/data/advanced/advanced_05.js?v=92',
  'js/data/advanced/advanced_06.js?v=92',
  'js/data/advanced/advanced_07.js?v=92',
  'js/data/advanced/advanced_08.js?v=92',
  'js/data/advanced/advanced_09.js?v=92',
  'js/data/advanced/advanced_10.js?v=92',
  'js/data/advanced/advanced_11.js?v=92',
  'js/data/advanced/advanced_12.js?v=92',
  'js/data/advanced/advanced_13.js?v=92',
  'js/data/advanced/advanced_14.js?v=92',
  'js/data/advanced/advanced_15.js?v=92',
  'js/data/advanced/advanced_16.js?v=92',
  'js/data/advanced/advanced_17.js?v=92',
  'js/data/advanced/advanced_18.js?v=92',
  'js/data/advanced/advanced_19.js?v=92',
  'js/data/advanced/advanced_20.js?v=92',
  'js/data/advanced/advanced_21.js?v=92',
  'js/data/advanced/advanced_22.js?v=92',
  'js/data/advanced/advanced_23.js?v=92',
  'js/data/advanced/advanced_24.js?v=92',
  'js/data/advanced/advanced_25.js?v=92',
  'js/utils/helpers.js?v=92',
  'js/utils/time.js?v=92',
  'js/utils/storage.js?v=92',
  'js/utils/greekSort.js?v=92',
  'js/utils/clickShield.js?v=92',
  'js/domain/srs/constants.js?v=92',
  'js/domain/srs/scheduler.js?v=92',
  'js/domain/srs/confidence.js?v=92',
  'js/domain/gamification/levels.js?v=92',
  'js/domain/gamification/usageStats.js?v=92',
  'js/domain/deck/ordering.js?v=92',
  'js/domain/deck/filters.js?v=92',
  'js/domain/grammar/explanations.js?v=92',
  'js/domain/grammar/morph_steps.js?v=92',
  'js/domain/grammar/paradigm_focus.js?v=92',
  'js/state/migrations.js?v=92',
  'js/state/store.js?v=92',
  'js/state/runtime.js?v=92',
  'js/state/persistence.js?v=92',
  'js/domain/gamification/xp.js?v=92',
  'js/ui/analytics.js?v=92',
  'js/ui/charts.js?v=92',
  'js/ui/keyboard.js?v=92',
  'js/ui/modals.js?v=92',
  'js/ui/navigation.js?v=92',
  'js/ui/progress.js?v=92',
  'js/ui/reader.js?v=92',
  'js/ui/render.js?v=92',
  'js/ui/selectors.js?v=92',
  'js/ui/toast.js?v=92',
  'js/ui/touchTapBridge.js?v=92',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png?v=92',
  // Bundled webfonts — referenced from styles.css @font-face declarations.
  // Same-origin, so no runtime CDN fetches. Gentium Plus is the serif
  // (regular/bold × upright/italic × 3 subsets = 12 files); Noto Sans is
  // the sans-serif variable font (upright/italic × 3 subsets = 6 files,
  // each file covers the full 100–900 weight axis).
  'fonts/gentium-plus/gentium-plus-400n-latin.woff2',
  'fonts/gentium-plus/gentium-plus-400n-greek.woff2',
  'fonts/gentium-plus/gentium-plus-400n-greek-ext.woff2',
  'fonts/gentium-plus/gentium-plus-700n-latin.woff2',
  'fonts/gentium-plus/gentium-plus-700n-greek.woff2',
  'fonts/gentium-plus/gentium-plus-700n-greek-ext.woff2',
  'fonts/gentium-plus/gentium-plus-400i-latin.woff2',
  'fonts/gentium-plus/gentium-plus-400i-greek.woff2',
  'fonts/gentium-plus/gentium-plus-400i-greek-ext.woff2',
  'fonts/gentium-plus/gentium-plus-700i-latin.woff2',
  'fonts/gentium-plus/gentium-plus-700i-greek.woff2',
  'fonts/gentium-plus/gentium-plus-700i-greek-ext.woff2',
  'fonts/noto-sans/noto-sans-n-latin.woff2',
  'fonts/noto-sans/noto-sans-n-greek.woff2',
  'fonts/noto-sans/noto-sans-n-greek-ext.woff2',
  'fonts/noto-sans/noto-sans-i-latin.woff2',
  'fonts/noto-sans/noto-sans-i-greek.woff2',
  'fonts/noto-sans/noto-sans-i-greek-ext.woff2'
];

const APP_SHELL = APP_SHELL_PATHS.map(path => new URL(path, BASE_URL).toString());
const INDEX_URL = new URL('index.html', BASE_URL).toString();

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match(INDEX_URL)))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (req.url.startsWith(BASE_URL.origin)) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
