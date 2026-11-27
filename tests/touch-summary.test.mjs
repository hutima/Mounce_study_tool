import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

// Run the real gesture bridge with a small event tree, including the modal's
// backdrop-only close handler. This catches summary taps being retargeted to
// that backdrop and the native follow-up click toggling the disclosure twice.
function harness(pointerEvents) {
  let clock = Date.now();
  class Clock extends Date { static now() { return clock; } }
  const listeners = {};
  const doc = { addEventListener(type, listener) { (listeners[type] ||= []).push(listener); } };
  const win = { scrollX: 0, scrollY: 0, getComputedStyle: () => ({ overflowX: '', overflowY: '' }) };
  if (pointerEvents) win.PointerEvent = class {};
  class Event {
    constructor(type, init = {}) { Object.assign(this, { type, defaultPrevented: false }, init); }
    preventDefault() { this.defaultPrevented = true; }
    stopPropagation() { this.stopped = true; }
    stopImmediatePropagation() { this.stopped = true; }
  }
  class Element {
    constructor(tag, parent = null) { this.tag = tag; this.parentElement = parent; this.attrs = {}; this.open = false; }
    getAttribute(name) { return this.attrs[name] ?? null; }
    matches(selector) {
      return selector.split(',').some(part => {
        const s = part.trim();
        if (s === '[onclick]') return !!this.onclick;
        if (s.startsWith('[') || s.startsWith('.')) return false;
        return s === this.tag;
      });
    }
    closest(selector) { for (let el = this; el; el = el.parentElement) if (el.matches(selector)) return el; return null; }
    dispatchEvent(event) {
      event.target = this;
      for (const listener of listeners[event.type] || []) listener(event);
      if (!event.stopped) {
        for (let el = this; el; el = el.parentElement) {
          if (el.onclick) el.onclick(event);
          if (event.stopped) break;
        }
      }
      const summary = this.closest('summary');
      if (!event.defaultPrevented && summary) summary.parentElement.open = !summary.parentElement.open;
    }
  }
  const ctx = vm.createContext({ document: doc, window: win, MouseEvent: Event, Element, Date: Clock });
  const source = readFileSync(new URL('../js/ui/touchTapBridge.js', import.meta.url), 'utf8').replace('export function', 'function');
  vm.runInContext(source + '\ninstallTouchSafeTapBridge();', ctx);
  const overlay = new Element('div');
  let guideOpen = true;
  overlay.onclick = event => { if (event.target === overlay) guideOpen = false; };
  const modal = new Element('div', overlay);
  const details = new Element('details', modal);
  const summary = new Element('summary', details);
  const label = new Element('span', summary);
  const send = (type, target, init = {}) => {
    const event = new Event(type, { target, clientX: 30, clientY: 30, pointerId: 1, pointerType: 'touch', ...init });
    if (!pointerEvents) event.changedTouches = [{ identifier: 1, clientX: event.clientX, clientY: event.clientY }];
    for (const listener of listeners[type] || []) listener(event);
    return event;
  };
  const tap = target => {
    clock += 100;
    send(pointerEvents ? 'pointerdown' : 'touchstart', target);
    send(pointerEvents ? 'pointerup' : 'touchend', target);
  };
  return { overlay, details, summary, label, tap, send, Event, guideOpen: () => guideOpen };
}

for (const pointers of [true, false]) test(`changelog tap expands inside guide (${pointers ? 'pointer' : 'touch fallback'})`, () => {
  const h = harness(pointers);
  h.tap(h.label);
  assert.equal(h.details.open, true);
  assert.equal(h.guideOpen(), true);
  h.label.dispatchEvent(new h.Event('click'));
  assert.equal(h.details.open, true, 'native ghost click is suppressed');
  h.tap(h.label);
  assert.equal(h.details.open, false, 'second physical tap collapses normally');
  assert.equal(h.guideOpen(), true);
  h.tap(h.overlay);
  assert.equal(h.guideOpen(), false, 'direct backdrop tap still closes');
});

test('scrolling across a disclosure does not toggle it or close the guide', () => {
  const h = harness(true);
  h.send('pointerdown', h.label);
  h.send('pointermove', h.label, { clientY: 120 });
  h.send('pointerup', h.label, { clientY: 120 });
  assert.equal(h.details.open, false);
  assert.equal(h.guideOpen(), true);
});
