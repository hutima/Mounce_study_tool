// Synthetic-tap bridge for touch and pen inputs.
//
// Some iOS WebKit builds suppress synthetic clicks on elements that have been
// hidden/shown around a touch, which makes onclick="" handlers unreliable.
// This module installs capture-phase listeners that observe a tap gesture,
// guard against scrolls / multi-finger gestures, and dispatch a synthetic
// click on the gesture's target. A follow-up suppressor silences the native
// click that some browsers still emit after our synthetic one. No external
// state — the module is entirely self-contained.

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

  let lastTouchTriggeredEl = null;
  let lastTouchTriggeredAt = 0;
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

  // Mark (Hard/Uncertain/Easy) and nav (Prev/Next/Undo) buttons exist to
  // be tapped repeatedly while flipping through a deck. The original
  // 350 ms same-element dedupe throttled real study sessions, so these
  // controls use a much tighter window — just enough to collapse the
  // pointer/touch/native-click triple-fire iOS emits for a single
  // physical tap (those land within tens of milliseconds of each other,
  // well below any human tap cadence). The wider window still applies
  // to modals, toggles, and other one-shot controls.
  const RAPID_TAP_DEDUPE_MS = 80;
  const DEFAULT_TAP_DEDUPE_MS = 350;
  function isRapidTapExempt(el) {
    return !!(el && el.closest && el.closest('.mark-btn, .nav-btn'));
  }
  function getDedupeWindowMs(el) {
    return isRapidTapExempt(el) ? RAPID_TAP_DEDUPE_MS : DEFAULT_TAP_DEDUPE_MS;
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

    const now = Date.now();
    if (lastTouchTriggeredEl === gestureTarget && (now - lastTouchTriggeredAt) < getDedupeWindowMs(gestureTarget)) {
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
    // The iOS-emitted native click after a touchend lands ~16 ms later,
    // so it's always inside even the tight rapid-tap window. Suppress it
    // whenever our synthetic click just fired for this element —
    // otherwise the onclick handler runs twice per physical tap, which
    // breaks anything that snapshots state per call (e.g. the spaced
    // undo flow captures a fresh snapshot before each review, so a
    // duplicate fire overwrites the pre-tap snapshot with the
    // post-first-review state).
    if (lastTouchTriggeredEl === el && (Date.now() - lastTouchTriggeredAt) < DEFAULT_TAP_DEDUPE_MS) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }

  document.addEventListener('touchstart', onTouchLikeStart, true);
  document.addEventListener('touchmove', onTouchLikeMove, true);
  document.addEventListener('touchend', onTouchLikeTap, true);
  document.addEventListener('touchcancel', onTouchLikeCancel, true);
  document.addEventListener('pointerdown', onTouchLikeStart, true);
  document.addEventListener('pointermove', onTouchLikeMove, true);
  document.addEventListener('pointerup', onTouchLikeTap, true);
  document.addEventListener('pointercancel', onTouchLikeCancel, true);
  document.addEventListener('click', suppressNativeFollowupClick, true);
}
