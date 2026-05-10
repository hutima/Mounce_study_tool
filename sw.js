// Service worker for the Mounce BBG Greek Flashcards PWA.
//
// GitHub Pages note: all app-shell URLs are resolved relative to the
// service worker registration scope so this works both at a domain root
// and at a project path such as https://user.github.io/repository/.
const CACHE_NAME = 'mounce-bbg-greek-pwa-v2';
const BASE_URL = new URL('./', self.registration.scope);

const APP_SHELL_PATHS = [
  './',
  'index.html',
  'pages/memorization.html',
  'styles.css?v=42',
  'manifest.json?v=26',
  'favicon.svg?v=26',
  'js/data/words.js?v=1',
  'js/data/morphology.js?v=1',
  'js/data/supplemental.js?v=1',
  'js/data/grammar.js?v=1',
  'js/data/memorization.js?v=1',
  'js/data/parsing_examples.js?v=1',
  'js/data/concept_examples.js?v=1',
  'js/data/grammar_examples.js?v=1',
  'js/data/setMeta.js?v=1',
  'js/logic/pos_logic.js?v=1',
  'js/data/reader.js?v=1',
  'js/data/reader_translations.js?v=2',
  'js/data/supplementals/mounce_paradigms.js?v=1',
  'js/app/main.js?v=1',
  'js/data/advanced/advanced_01.js?v=2',
  'js/data/advanced/advanced_02.js?v=2',
  'js/data/advanced/advanced_03.js?v=2',
  'js/data/advanced/advanced_04.js?v=2',
  'js/data/advanced/advanced_05.js?v=2',
  'js/data/advanced/advanced_06.js?v=2',
  'js/data/advanced/advanced_07.js?v=2',
  'js/data/advanced/advanced_08.js?v=2',
  'js/data/advanced/advanced_09.js?v=2',
  'js/data/advanced/advanced_10.js?v=2',
  'js/data/advanced/advanced_11.js?v=2',
  'js/data/advanced/advanced_12.js?v=2',
  'js/data/advanced/advanced_13.js?v=2',
  'js/data/advanced/advanced_14.js?v=2',
  'js/data/advanced/advanced_15.js?v=2',
  'js/data/advanced/advanced_16.js?v=2',
  'js/data/advanced/advanced_17.js?v=2',
  'js/data/advanced/advanced_18.js?v=2',
  'js/data/advanced/advanced_19.js?v=2',
  'js/data/advanced/advanced_20.js?v=2',
  'js/data/advanced/advanced_21.js?v=2',
  'js/data/advanced/advanced_22.js?v=2',
  'js/data/advanced/advanced_23.js?v=2',
  'js/data/advanced/advanced_24.js?v=2',
  'js/data/advanced/advanced_25.js?v=2',
  'js/utils/helpers.js?v=1',
  'js/utils/time.js?v=1',
  'js/utils/storage.js?v=1',
  'js/utils/greekSort.js?v=1',
  'js/domain/srs/constants.js?v=1',
  'js/domain/srs/scheduler.js?v=1',
  'js/domain/srs/confidence.js?v=1',
  'js/domain/gamification/levels.js?v=1',
  'js/domain/gamification/usageStats.js?v=1',
  'js/domain/deck/ordering.js?v=1',
  'js/domain/deck/filters.js?v=1',
  'js/domain/grammar/explanations.js?v=1',
  'js/state/migrations.js?v=1',
  'js/state/store.js?v=1',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png?v=26'
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
        const copy = res.clone();
        if (req.url.startsWith(BASE_URL.origin)) {
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
