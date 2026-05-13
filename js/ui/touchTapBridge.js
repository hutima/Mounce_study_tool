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
    if (lastTouchTriggeredEl === gestureTarget && (now - lastTouchTriggeredAt) < 700) {
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
    if (lastTouchTriggeredEl === el && (Date.now() - lastTouchTriggeredAt) < 700) {
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
