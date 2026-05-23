// Service worker for the Mounce BBG Greek Flashcards PWA.
//
// GitHub Pages note: all app-shell URLs are resolved relative to the
// service worker registration scope so this works both at a domain root
// and at a project path such as https://user.github.io/repository/.
const CACHE_NAME = 'mounce-bbg-greek-pwa-v66';
const BASE_URL = new URL('./', self.registration.scope);

// Cross-origin hosts whose responses we want to keep in the runtime cache
// so the app survives going offline after a single online load. Currently
// just the Google Fonts CSS endpoint and the static font-file CDN it
// references for @font-face URLs.
const RUNTIME_CACHE_HOSTS = [
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/'
];

// CSS endpoint that the page's <link> tag requests. Adding it to the
// install precache means even the very first offline navigation (after
// the SW has installed online) can render with the intended typefaces;
// the @font-face woff2 URLs inside it are then captured by the runtime
// fetch handler the first time the browser resolves them.
const FONT_STYLESHEET_URL = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Noto+Serif:ital,wght@0,400;1,400&display=swap';

const APP_SHELL_PATHS = [
  './',
  'index.html',
  'pages/memorization.html',
  'styles.css?v=66',
  'manifest.json?v=66',
  'favicon.svg?v=66',
  'js/data/words.js?v=66',
  'js/data/morphology.js?v=66',
  'js/data/supplemental.js?v=66',
  'js/data/grammar.js?v=66',
  'js/data/parsing_examples.js?v=66',
  'js/data/concept_examples.js?v=66',
  'js/data/grammar_examples.js?v=66',
  'js/data/setMeta.js?v=66',
  'js/logic/pos_logic.js?v=66',
  'js/data/reader.js?v=66',
  'js/data/reader_verse_literals.js?v=66',
  'js/data/reader_translations.js?v=66',
  'js/data/supplementals/mounce_paradigms.js?v=66',
  'js/app/main.js?v=66',
  'js/data/advanced/advanced_01.js?v=66',
  'js/data/advanced/advanced_02.js?v=66',
  'js/data/advanced/advanced_03.js?v=66',
  'js/data/advanced/advanced_04.js?v=66',
  'js/data/advanced/advanced_05.js?v=66',
  'js/data/advanced/advanced_06.js?v=66',
  'js/data/advanced/advanced_07.js?v=66',
  'js/data/advanced/advanced_08.js?v=66',
  'js/data/advanced/advanced_09.js?v=66',
  'js/data/advanced/advanced_10.js?v=66',
  'js/data/advanced/advanced_11.js?v=66',
  'js/data/advanced/advanced_12.js?v=66',
  'js/data/advanced/advanced_13.js?v=66',
  'js/data/advanced/advanced_14.js?v=66',
  'js/data/advanced/advanced_15.js?v=66',
  'js/data/advanced/advanced_16.js?v=66',
  'js/data/advanced/advanced_17.js?v=66',
  'js/data/advanced/advanced_18.js?v=66',
  'js/data/advanced/advanced_19.js?v=66',
  'js/data/advanced/advanced_20.js?v=66',
  'js/data/advanced/advanced_21.js?v=66',
  'js/data/advanced/advanced_22.js?v=66',
  'js/data/advanced/advanced_23.js?v=66',
  'js/data/advanced/advanced_24.js?v=66',
  'js/data/advanced/advanced_25.js?v=66',
  'js/utils/helpers.js?v=66',
  'js/utils/time.js?v=66',
  'js/utils/storage.js?v=66',
  'js/utils/greekSort.js?v=66',
  'js/utils/clickShield.js?v=66',
  'js/domain/srs/constants.js?v=66',
  'js/domain/srs/scheduler.js?v=66',
  'js/domain/srs/confidence.js?v=66',
  'js/domain/gamification/levels.js?v=66',
  'js/domain/gamification/usageStats.js?v=66',
  'js/domain/deck/ordering.js?v=66',
  'js/domain/deck/filters.js?v=66',
  'js/domain/grammar/explanations.js?v=66',
  'js/domain/grammar/morph_steps.js?v=66',
  'js/domain/grammar/paradigm_focus.js?v=66',
  'js/state/migrations.js?v=66',
  'js/state/store.js?v=66',
  'js/state/runtime.js?v=66',
  'js/state/persistence.js?v=66',
  'js/domain/gamification/xp.js?v=66',
  'js/ui/analytics.js?v=66',
  'js/ui/charts.js?v=66',
  'js/ui/keyboard.js?v=66',
  'js/ui/modals.js?v=66',
  'js/ui/navigation.js?v=66',
  'js/ui/progress.js?v=66',
  'js/ui/reader.js?v=66',
  'js/ui/render.js?v=66',
  'js/ui/selectors.js?v=66',
  'js/ui/toast.js?v=66',
  'js/ui/touchTapBridge.js?v=66',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png?v=66'
];

const APP_SHELL = APP_SHELL_PATHS.map(path => new URL(path, BASE_URL).toString());
const INDEX_URL = new URL('index.html', BASE_URL).toString();

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL).then(() => {
        // Best-effort: prime the Google Fonts CSS so offline navigation
        // still has the @font-face declarations. A network failure here
        // must not abort the SW install or the whole app shell never
        // becomes available offline.
        return cache.add(new Request(FONT_STYLESHEET_URL, { mode: 'cors' })).catch(() => {});
      }))
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
        const sameOrigin = req.url.startsWith(BASE_URL.origin);
        const isCacheableCrossOrigin = RUNTIME_CACHE_HOSTS.some(host => req.url.startsWith(host));
        if (sameOrigin || isCacheableCrossOrigin) {
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
