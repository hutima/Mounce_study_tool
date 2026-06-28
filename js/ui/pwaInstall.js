// PWA "install to Home Screen" prompt.
//
// Two pieces:
//   1. A persistent top banner (styled like the achievement toast, but it never
//      auto-hides — it requires an explicit Install or ✕). Shown ONCE, on phones
//      only, a short while after the consent gate is dealt with. Once dismissed
//      it never reappears on its own (a localStorage flag), but the user can
//      re-trigger the install flow from the user guide.
//   2. A platform-aware "how to install" modal (iOS Safari vs Android Chrome vs
//      generic) opened when the user taps Install on a browser that has no native
//      install prompt to fire (e.g. iOS).
//
// Self-contained: main.js calls initPwaInstall() once, maybeScheduleInstallPrompt()
// at launch, and triggerInstall() from the user-guide button.

import { getStorage } from '../utils/storage.js';

// Local string literal (NOT imported from store.js) on purpose: a brand-new
// cross-module export would risk the Safari "frozen on update" failure mode
// where a fresh module is momentarily paired with an old cached sibling that
// lacks the export. See CLAUDE.md › "ES-module imports are NOT cache-busted".
const PWA_INSTALL_DISMISSED_STORAGE_KEY = 'mounceBbgFlashcardsInstallPromptDismissedV1';

// Scheduled right after the new user accepts the consent gate — show the nudge
// almost immediately once they reach the app (a brief beat, not a long wait).
const FIRST_LAUNCH_DELAY_MS = 2 * 1000;
// If a modal is still covering the screen when the timer fires (e.g. the study
// selector that opens on consent-accept), re-check shortly so the banner lands
// right after it closes.
const BUSY_RETRY_MS = 2 * 1000;
// Treat a screen whose shorter edge is at most this many CSS px as a phone.
const PHONE_MAX_SHORT_EDGE = 480;

// Captured beforeinstallprompt event (Chromium / Android Chrome only).
let deferredPrompt = null;
let scheduleTimer = null;
let scheduled = false;

// ── Environment detection ────────────────────────────────────────────────

function isStandalone() {
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true
  );
}

function platform() {
  const ua = window.navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && 'ontouchend' in document)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

function isLikelyPhone() {
  const ua = window.navigator.userAgent || '';
  if (/iPhone|iPod/i.test(ua)) return true;
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) return true;
  // Generic fallback: a coarse pointer on a small screen.
  const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const screen = window.screen || {};
  const shortEdge = Math.min(screen.width || Infinity, screen.height || Infinity);
  return coarse && shortEdge <= PHONE_MAX_SHORT_EDGE;
}

// ── Dismissal state ──────────────────────────────────────────────────────

function isDismissed() {
  const storage = getStorage();
  return !!storage && storage.getItem(PWA_INSTALL_DISMISSED_STORAGE_KEY) === 'dismissed';
}

function markDismissed() {
  const storage = getStorage();
  if (storage) {
    try { storage.setItem(PWA_INSTALL_DISMISSED_STORAGE_KEY, 'dismissed'); } catch (_) {}
  }
}

function anyOverlayOpen() {
  return !!document.querySelector('.consent-overlay.show');
}

// ── Top banner ───────────────────────────────────────────────────────────

const DOWNLOAD_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg>';

function ensureBannerHost() {
  let host = document.getElementById('pwaInstallHost');
  if (host) return host;
  host = document.createElement('div');
  host.id = 'pwaInstallHost';
  host.className = 'pwa-install-host';
  document.body.appendChild(host);
  return host;
}

function hideBanner() {
  const host = document.getElementById('pwaInstallHost');
  if (!host) return;
  host.classList.remove('show');
  window.setTimeout(() => { if (host) host.innerHTML = ''; }, 220);
}

function dismissBanner() {
  markDismissed();
  hideBanner();
  syncUserGuideButton();
}

function renderBanner() {
  const host = ensureBannerHost();
  host.innerHTML =
    '<div class="pwa-install" role="dialog" aria-label="Install this app">' +
      '<span class="pwa-install-icon">' + DOWNLOAD_ICON + '</span>' +
      '<span class="pwa-install-copy">' +
        '<span class="pwa-install-title">Get the best experience</span>' +
        '<span class="pwa-install-body">Install this app to your Home Screen for a full-screen, distraction-free view.</span>' +
      '</span>' +
      '<button type="button" class="pwa-install-action">Install</button>' +
      '<button type="button" class="pwa-install-close" aria-label="Dismiss">×</button>' +
    '</div>';
  const action = host.querySelector('.pwa-install-action');
  if (action) action.addEventListener('click', () => { triggerInstall(); });
  const close = host.querySelector('.pwa-install-close');
  if (close) close.addEventListener('click', dismissBanner);
  requestAnimationFrame(() => host.classList.add('show'));
}

// Show the banner. Auto-launch path respects the dismissed flag; the user-guide
// path passes { force:true } to re-surface it regardless.
export function showInstallPrompt(opts = {}) {
  if (isStandalone()) return;
  if (!opts.force && isDismissed()) return;
  renderBanner();
}

// ── "How to install" modal ───────────────────────────────────────────────

function installStepsHtml() {
  const steps = {
    ios: [
      ['Open the Share menu',
        'Tap the <strong>Share</strong> icon (a box with an upward arrow) at the bottom of Safari. ' +
        "If you don't see it, tap the <strong>…</strong> page menu next to the address bar and choose <strong>Share</strong>."],
      ['Find &ldquo;Add to Home Screen&rdquo;',
        'Scroll down the share sheet and tap <strong>Add to Home Screen</strong>. ' +
        'Tap <strong>Edit Actions…</strong> if it is not listed.'],
      ['Keep &ldquo;Open as Web App&rdquo; on',
        'If you see an <strong>Open as Web App</strong> toggle, leave it on (the default). ' +
        'This makes the app launch full-screen instead of opening in the browser.'],
      ['Tap &ldquo;Add&rdquo;',
        'Tap <strong>Add</strong> in the top-right corner. The app will appear on your Home Screen ' +
        'and open full-screen, with no browser address bar.']
    ],
    android: [
      ['Open the browser menu',
        'Tap the <strong>⋮</strong> menu in the top-right corner of Chrome.'],
      ['Choose Install',
        'Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).'],
      ['Confirm',
        'Tap <strong>Install</strong> / <strong>Add</strong> in the dialog that appears.'],
      ['Open it full-screen',
        'The app icon appears on your Home Screen and launches full-screen, with no browser address bar.']
    ],
    other: [
      ['Open your browser menu',
        'Look for the browser&rsquo;s main menu (often <strong>⋮</strong> or <strong>…</strong>).'],
      ['Add to your device',
        'Choose <strong>Install app</strong> or <strong>Add to Home Screen</strong> and confirm.']
    ]
  };
  const chosen = steps[platform()] || steps.other;
  const rows = chosen.map((s, i) =>
    '<li class="install-step">' +
      '<span class="install-step-num">' + (i + 1) + '</span>' +
      '<span class="install-step-copy">' +
        '<span class="install-step-title">' + s[0] + '</span>' +
        '<span class="install-step-body">' + s[1] + '</span>' +
      '</span>' +
    '</li>'
  ).join('');
  return '<ol class="install-steps">' + rows + '</ol>';
}

export function openInstallInstructions() {
  const overlay = document.getElementById('installInstructionsOverlay');
  if (!overlay) return;
  // The how-to takes over, so retire the banner as it comes up (visual dismiss
  // only — the forever-dismiss flag stays owned by the banner ✕ / "Don't show
  // again").
  hideBanner();
  const body = document.getElementById('installInstructionsBody');
  if (body) {
    body.innerHTML =
      '<p>Add this app to your Home Screen for a full-screen experience without the browser address bar.</p>' +
      installStepsHtml();
  }
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

export function closeInstallInstructions() {
  const overlay = document.getElementById('installInstructionsOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.consent-overlay.show')) document.body.classList.remove('modal-open');
}

export function isInstallInstructionsOpen() {
  return !!document.getElementById('installInstructionsOverlay')?.classList.contains('show');
}

// ── Install action ───────────────────────────────────────────────────────

// Tapping Install (banner or user-guide button): fire the native prompt when the
// browser gave us one (Chromium), otherwise fall back to the platform how-to.
// Opening the how-to does NOT permanently dismiss — the modal's own "Don't show
// again" / "Got it!" buttons decide that (the banner ✕ is the forever-dismiss).
export function triggerInstall() {
  if (deferredPrompt) {
    const evt = deferredPrompt;
    deferredPrompt = null;
    try {
      evt.prompt();
      Promise.resolve(evt.userChoice).then((res) => {
        // Accepting installs the app (appinstalled also fires); either way the
        // banner has served its purpose, so take it down. Only an accepted
        // install marks it gone for good — a declined prompt may show again later.
        if (res && res.outcome === 'accepted') markDismissed();
        hideBanner();
        syncUserGuideButton();
      }).catch(() => { hideBanner(); });
    } catch (_) {
      openInstallInstructions();
    }
    return;
  }
  // No native prompt available (iOS Safari, or Chromium that already consumed
  // the event): explain how to do it by hand.
  openInstallInstructions();
}

// Modal "Don't show again" — the explicit forever-dismiss.
export function dontShowInstallAgain() {
  markDismissed();
  closeInstallInstructions();
  hideBanner();
  syncUserGuideButton();
}

// ── Scheduling (first-launch auto prompt) ────────────────────────────────

function tryShowScheduled() {
  scheduleTimer = null;
  if (isStandalone() || isDismissed() || !isLikelyPhone()) return;
  // Don't pop the banner over an open modal (consent gate, study selector, …).
  if (anyOverlayOpen()) {
    scheduleTimer = window.setTimeout(tryShowScheduled, BUSY_RETRY_MS);
    return;
  }
  showInstallPrompt();
}

export function maybeScheduleInstallPrompt() {
  if (scheduled) return;
  if (isStandalone() || isDismissed() || !isLikelyPhone()) return;
  scheduled = true;
  scheduleTimer = window.setTimeout(tryShowScheduled, FIRST_LAUNCH_DELAY_MS);
}

// ── User-guide button visibility ─────────────────────────────────────────

function syncUserGuideButton() {
  const btn = document.getElementById('userGuideInstallBtn');
  if (!btn) return;
  // Hide once the app is already installed; otherwise keep it available so the
  // user can re-open the install flow after dismissing the banner.
  btn.style.display = isStandalone() ? 'none' : '';
}

// ── Init ─────────────────────────────────────────────────────────────────

export function initPwaInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    markDismissed();
    hideBanner();
    closeInstallInstructions();
    syncUserGuideButton();
  });
  syncUserGuideButton();
}
