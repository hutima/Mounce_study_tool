// Synthetic-tap bridge for touch and pen inputs.
//
// Some iOS WebKit builds suppress synthetic clicks on elements that have been
// hidden/shown around a touch, which makes onclick="" handlers unreliable.
// This module installs capture-phase listeners that observe a tap gesture,
// guard against scrolls / multi-finger gestures, and dispatch a synthetic
// click on the gesture's target. A follow-up suppressor silences the native
// click that some browsers still emit after our synthetic one. No external
// state — the module is entirely self-contained.
//
// Ghost-click suppression is one-shot, not time-based: a synthetic dispatch
// arms a flag that swallows the very next native click on that element,
// however long that takes. A time window can't work here because a tap
// handler may open a blocking dialog (window.confirm) that freezes JS while
// the user reads it — the queued ghost click is then delivered seconds later,
// long after any sane window, and would re-fire the handler (a duplicate
// confirm). Nothing can interleave between our synthetic click and the queued
// ghost (the main thread is busy), so consuming "the next native click on the
// same element" is exact.
//
// Event-pathway choice: iOS Safari fires BOTH pointer and touch events for
// the same physical tap, plus a "ghost" native click ~16 ms after touchend.
// Listening to both pathways at once means each pathway dispatches its own
// synthetic click for a single tap — once was caught by a same-element
// timing dedupe, but the gap between pointer and touch arrivals can vary
// (≤ tens of ms on a fresh device, sometimes 100+ ms under load), so a
// tight window leaks duplicates and a loose window drops legitimate rapid
// taps on mark/nav buttons. The fix is to bind the bridge to only ONE
// pathway: pointer events when supported (iOS 13+ and every other modern
// browser), touch events as a fallback for very old WebKit builds. The
// remaining native click is handled by suppressNativeFollowupClick.

export function installTouchSafeTapBridge() {
  const TOUCH_TAP_SELECTOR = [
    'button',
    '[role="button"]',
    '[role="switch"]',
    '.card-wrapper',
    '[onclick]'
  ].join(',');
  const MAX_TAP_MOVEMENT_PX = 14;
  const MAX_TAP_SCROLL_PX = 8;
  // Cross-pathway dedupe used only when both pointer and touch listeners
  // are installed (legacy fallback path). The primary modern path binds
  // to a single pathway, so this is purely a safety net.
  const SAME_PATHWAY_DEDUPE_MS = 60;

  let lastTouchTriggeredEl = null;
  let lastTouchTriggeredAt = 0;
  // One-shot token: the element whose next native ghost click should be
  // swallowed. Armed when we dispatch a synthetic click, cleared the moment
  // that ghost arrives (or when a fresh gesture begins, so a ghost that never
  // shows can't strand the token and suppress a later genuine click).
  let pendingGhostSuppressEl = null;
  let syntheticTapDispatchDepth = 0;
  let activeTouchGesture = null;
  let activePointerGesture = null;

  function getTapTarget(startEl) {
    if (!startEl || !startEl.closest) return null;
    const el = startEl.closest(TOUCH_TAP_SELECTOR);
    if (!el) return null;
    if (el.closest('label') && !el.matches('button,[role="button"],[role="switch"],.card-wrapper,[onclick]')) return null;
    return el;
  }

  function isDisabledTapTarget(el) {
    return !el || el.disabled || el.getAttribute('aria-disabled') === 'true';
  }

  function shouldIgnoreTouchEvent(event) {
    if (event.type === 'pointerup' || event.type === 'pointerdown' || event.type === 'pointermove' || event.type === 'pointercancel') {
      return event.pointerType && event.pointerType !== 'touch' && event.pointerType !== 'pen';
    }
    return false;
  }

  function getEventPoint(event) {
    const touch = (event.changedTouches && event.changedTouches[0]) || (event.touches && event.touches[0]);
    if (touch) {
      return { id: touch.identifier, x: touch.clientX, y: touch.clientY };
    }
    if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
      return { id: event.pointerId || 'pointer', x: event.clientX, y: event.clientY };
    }
    return null;
  }

  function getScrollSnapshots(el) {
    const snapshots = [];
    let node = el instanceof Element ? el.parentElement : null;
    while (node) {
      const style = window.getComputedStyle(node);
      const overflowY = style.overflowY || '';
      const overflowX = style.overflowX || '';
      const isScrollable = /(auto|scroll|overlay)/.test(`${overflowY} ${overflowX}`)
        && (node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1);
      if (isScrollable) {
        snapshots.push({ el: node, top: node.scrollTop, left: node.scrollLeft });
      }
      node = node.parentElement;
    }
    snapshots.push({
      el: window,
      top: window.scrollY || window.pageYOffset || 0,
      left: window.scrollX || window.pageXOffset || 0
    });
    return snapshots;
  }

  function hasScrollGesture(snapshots) {
    return snapshots.some(({ el, top, left }) => {
      const currentTop = el === window ? (window.scrollY || window.pageYOffset || 0) : el.scrollTop;
      const currentLeft = el === window ? (window.scrollX || window.pageXOffset || 0) : el.scrollLeft;
      return Math.abs(currentTop - top) > MAX_TAP_SCROLL_PX || Math.abs(currentLeft - left) > MAX_TAP_SCROLL_PX;
    });
  }

  function createGesture(event, target) {
    const point = getEventPoint(event);
    if (!point || !target) return null;
    return {
      id: point.id,
      target,
      startX: point.x,
      startY: point.y,
      moved: false,
      scrolled: false,
      scrollSnapshots: getScrollSnapshots(target)
    };
  }

  function updateGesture(gesture, event) {
    if (!gesture) return gesture;
    const point = getEventPoint(event);
    if (point && point.id === gesture.id) {
      if (Math.abs(point.x - gesture.startX) > MAX_TAP_MOVEMENT_PX || Math.abs(point.y - gesture.startY) > MAX_TAP_MOVEMENT_PX) {
        gesture.moved = true;
      }
    }
    if (!gesture.scrolled && gesture.scrollSnapshots && gesture.scrollSnapshots.length) {
      gesture.scrolled = hasScrollGesture(gesture.scrollSnapshots);
    }
    return gesture;
  }

  function clearGestureForEvent(event) {
    if (event.type.startsWith('pointer')) {
      activePointerGesture = null;
    } else {
      activeTouchGesture = null;
    }
  }

  function dispatchSyntheticClick(el) {
    // Arm one-shot suppression for the ghost click this dispatch will trigger.
    // Set before dispatch so it's in place even if the handler blocks on a
    // dialog; the synthetic click itself is ignored by the suppressor (depth>0).
    pendingGhostSuppressEl = el;
    syntheticTapDispatchDepth += 1;
    try {
      el.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
    } finally {
      syntheticTapDispatchDepth = Math.max(0, syntheticTapDispatchDepth - 1);
    }
  }

  function onTouchLikeStart(event) {
    if (shouldIgnoreTouchEvent(event)) return;
    // A new gesture means any prior ghost has already arrived (or never will);
    // drop a stale token so it can't swallow this gesture's real click.
    pendingGhostSuppressEl = null;
    if (event.defaultPrevented) return;
    if (event.touches && event.touches.length > 1) {
      activeTouchGesture = null;
      return;
    }
    const el = getTapTarget(event.target);
    if (isDisabledTapTarget(el)) return;
    const gesture = createGesture(event, el);
    if (event.type === 'pointerdown') activePointerGesture = gesture;
    else activeTouchGesture = gesture;
  }

  function onTouchLikeMove(event) {
    if (shouldIgnoreTouchEvent(event)) return;
    if (event.type === 'pointermove') updateGesture(activePointerGesture, event);
    else updateGesture(activeTouchGesture, event);
  }

  function onTouchLikeTap(event) {
    if (shouldIgnoreTouchEvent(event)) return;
    const gesture = event.type === 'pointerup' ? activePointerGesture : activeTouchGesture;
    updateGesture(gesture, event);
    if (!gesture) return;

    const el = getTapTarget(event.target) || gesture.target;
    const gestureTarget = gesture.target;
    clearGestureForEvent(event);
    if (event.defaultPrevented) return;
    if (isDisabledTapTarget(gestureTarget) || !el || el !== gestureTarget) return;
    if (gesture.moved || gesture.scrolled) return;

    // Safety net for the legacy touch-only fallback path: when both
    // touchstart and touchend somehow fire twice for the same tap (seen
    // on some Android keyboards), collapse anything inside a hair-trigger
    // window. The primary modern path uses pointer events only, so this
    // never runs for typical iOS users.
    const now = Date.now();
    if (lastTouchTriggeredEl === gestureTarget && (now - lastTouchTriggeredAt) < SAME_PATHWAY_DEDUPE_MS) {
      event.preventDefault();
      return;
    }

    lastTouchTriggeredEl = gestureTarget;
    lastTouchTriggeredAt = now;
    event.preventDefault();
    dispatchSyntheticClick(gestureTarget);
  }

  function onTouchLikeCancel(event) {
    if (shouldIgnoreTouchEvent(event)) return;
    clearGestureForEvent(event);
  }

  function suppressNativeFollowupClick(event) {
    if (syntheticTapDispatchDepth > 0) return;
    const el = getTapTarget(event.target);
    if (!el) return;
    // Swallow the native ghost click that iOS emits after our synthetic one.
    // This is one-shot and time-independent: the token is consumed here so a
    // genuine later tap (which re-arms it) still works, and a tap handler that
    // blocks on window.confirm — delaying the ghost well past any timeout —
    // is still deduped correctly.
    if (pendingGhostSuppressEl === el) {
      pendingGhostSuppressEl = null;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }

  // Bind to ONE pathway, not both. Pointer events have been supported in
  // every shipping browser since 2019 (Safari 13, iOS 13, Chrome, Edge,
  // Firefox), so the touch fallback is exercised only on truly ancient
  // builds — never on a current iPhone or iPad. Eliminating the dual
  // pathway is what actually fixes the iOS spaced-undo bug: the timing
  // dedupe couldn't reliably tell apart "second pathway for the same
  // physical tap" from "second physical tap" across the full range of
  // device speeds.
  const hasPointerEvents = typeof window !== 'undefined' && 'PointerEvent' in window;
  if (hasPointerEvents) {
    document.addEventListener('pointerdown', onTouchLikeStart, true);
    document.addEventListener('pointermove', onTouchLikeMove, true);
    document.addEventListener('pointerup', onTouchLikeTap, true);
    document.addEventListener('pointercancel', onTouchLikeCancel, true);
  } else {
    document.addEventListener('touchstart', onTouchLikeStart, true);
    document.addEventListener('touchmove', onTouchLikeMove, true);
    document.addEventListener('touchend', onTouchLikeTap, true);
    document.addEventListener('touchcancel', onTouchLikeCancel, true);
  }
  document.addEventListener('click', suppressNativeFollowupClick, true);
}
