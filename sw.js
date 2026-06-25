// Service worker for the Mounce BBG Greek Flashcards PWA.
//
// GitHub Pages note: all app-shell URLs are resolved relative to the
// service worker registration scope so this works both at a domain root
// and at a project path such as https://user.github.io/repository/.
const CACHE_NAME = 'mounce-bbg-greek-pwa-v160';
const BASE_URL = new URL('./', self.registration.scope);

const APP_SHELL_PATHS = [
  './',
  'index.html',
  'pages/memorization.html',
  'styles.css?v=160',
  'manifest.json?v=160',
  'favicon.svg?v=160',
  'js/data/words.js?v=160',
  'js/data/morphology.js?v=160',
  'js/data/lemma_inventory.js?v=160',
  'js/data/supplemental.js?v=160',
  'js/data/grammar.js?v=160',
  'js/data/parsing_examples.js?v=160',
  'js/data/concept_examples.js?v=160',
  'js/data/grammar_examples.js?v=160',
  'js/data/setMeta.js?v=160',
  'js/logic/pos_logic.js?v=160',
  'js/data/reader.js?v=160',
  'js/data/reader_verse_literals.js?v=160',
  'js/data/reader_translations.js?v=160',
  'js/data/supplementals/mounce_paradigms.js?v=160',
  'js/data/supplementals/stem_change_drills.js?v=160',
  'js/data/supplementals/second_aorist_flip.js?v=160',
  'js/data/supplementals/liquid_future_flip.js?v=160',
  'js/data/supplementals/w3_aorist_passive_flip.js?v=160',
  'js/data/supplementals/w3_perfect_active_flip.js?v=160',
  'js/data/supplementals/w4_mi_verb_principal_parts_flip.js?v=160',
  'js/app/main.js?v=160',
  'js/data/advanced/advanced_01.js?v=160',
  'js/data/advanced/advanced_02.js?v=160',
  'js/data/advanced/advanced_03.js?v=160',
  'js/data/advanced/advanced_04.js?v=160',
  'js/data/advanced/advanced_05.js?v=160',
  'js/data/advanced/advanced_06.js?v=160',
  'js/data/advanced/advanced_07.js?v=160',
  'js/data/advanced/advanced_08.js?v=160',
  'js/data/advanced/advanced_09.js?v=160',
  'js/data/advanced/advanced_10.js?v=160',
  'js/data/advanced/advanced_11.js?v=160',
  'js/data/advanced/advanced_12.js?v=160',
  'js/data/advanced/advanced_13.js?v=160',
  'js/data/advanced/advanced_14.js?v=160',
  'js/data/advanced/advanced_15.js?v=160',
  'js/data/advanced/advanced_16.js?v=160',
  'js/data/advanced/advanced_17.js?v=160',
  'js/data/advanced/advanced_18.js?v=160',
  'js/data/advanced/advanced_19.js?v=160',
  'js/data/advanced/advanced_20.js?v=160',
  'js/data/advanced/advanced_21.js?v=160',
  'js/data/advanced/advanced_22.js?v=160',
  'js/data/advanced/advanced_23.js?v=160',
  'js/data/advanced/advanced_24.js?v=160',
  'js/data/advanced/advanced_25.js?v=160',
  'js/data/nt_book_vocab.js?v=160',
  'js/utils/helpers.js?v=160',
  'js/utils/time.js?v=160',
  'js/utils/storage.js?v=160',
  'js/utils/greekSort.js?v=160',
  'js/utils/clickShield.js?v=160',
  'js/domain/srs/constants.js?v=160',
  'js/domain/srs/scheduler.js?v=160',
  'js/domain/srs/confidence.js?v=160',
  'js/domain/gamification/levels.js?v=160',
  'js/domain/gamification/usageStats.js?v=160',
  'js/domain/deck/ordering.js?v=160',
  'js/domain/deck/filters.js?v=160',
  'js/domain/grammar/explanations.js?v=160',
  'js/domain/grammar/morph_steps.js?v=160',
  'js/domain/grammar/morph_lookup.js?v=160',
  'js/domain/grammar/paradigm_focus.js?v=160',
  'js/state/migrations.js?v=160',
  'js/state/store.js?v=160',
  'js/state/runtime.js?v=160',
  'js/state/persistence.js?v=160',
  'js/domain/gamification/xp.js?v=160',
  'js/ui/analytics.js?v=160',
  'js/ui/charts.js?v=160',
  'js/ui/keyboard.js?v=160',
  'js/ui/modals.js?v=160',
  'js/ui/navigation.js?v=160',
  'js/ui/progress.js?v=160',
  'js/ui/reader.js?v=160',
  'js/ui/render.js?v=160',
  'js/ui/selectors.js?v=160',
  'js/ui/toast.js?v=160',
  'js/ui/touchTapBridge.js?v=160',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png?v=160',
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
  // Deliberately NO skipWaiting() here: a new worker installs and then WAITS.
  // Activating + claiming the moment we install fired `controllerchange` in the
  // running page, which auto-reloaded it at launch — and on iOS standalone PWAs
  // that programmatic reload hangs (the page renders but taps do nothing until a
  // force-quit). Waiting lets the update land the safe way instead: silently on
  // the next cold start (no client is using the old worker), or when the user
  // taps "Refresh" in the update banner (skipWaiting fires via the message
  // handler — a reload inside a user gesture, which iOS allows). Until then the
  // old worker keeps serving its own complete, consistent asset set, so the app
  // still works — just on the old version.
  event.waitUntil(
    // cache: 'reload' bypasses the HTTP cache during install so each release
    // precaches fresh copies even if a ?v= bump was missed for some file.
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_SHELL.map(url => new Request(url, { cache: 'reload' })))
    )
  );
});

self.addEventListener('activate', event => {
  // We only get here when the user taps "Refresh" (posting SKIP_WAITING) or on a
  // cold start with no old client around — never automatically mid-session, now
  // that install doesn't skipWaiting. Drop stale caches and claim. Any reload is
  // owned by main.js's controllerchange listener and only fires for a user-
  // accepted update. We do NOT force-navigate clients here: competing
  // navigations on the same URL wedged iOS standalone PWAs on a frozen,
  // half-loaded launch.
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Drives the "Refresh" banner button. The page posts SKIP_WAITING to the
// waiting worker so it activates and takes over, then reloads. Since install no
// longer calls skipWaiting, this is the ONLY on-demand activation path — so a
// new worker takes over in response to a user tap, never automatically mid-
// session.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          // Only cache good responses — a 404/500 (e.g. a Pages outage)
          // must not overwrite the working cached shell.
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match(INDEX_URL)))
    );
    return;
  }

  // Static assets: cache first, then network. When the URL carries an
  // explicit `?v=N` cache-bust, match exactly so a version bump always
  // falls through to network rather than serving a stale cross-version
  // entry. When it doesn't (bare ES-module imports from main.js have no
  // query string), use ignoreSearch so they resolve to the precached
  // versioned entry instead of double-caching one copy per version.
  const reqUrl = new URL(req.url);
  const isVersioned = reqUrl.searchParams.has('v');
  const matchOpts = isVersioned ? {} : { ignoreSearch: true };
  event.respondWith(
    caches.match(req, matchOpts).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // Cache only good same-origin responses; error pages cached here
        // would be served as the asset on every later hit.
        if (res.ok && req.url.startsWith(BASE_URL.origin)) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
