/**
 * @fileoverview sheetPresence tests.
 * @module tests/unit/src/modules/library/presentation/components/slots/sheetPresence.test
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest Testing framework
 */

import {
  hidePages,
  pageAsked,
} from '@/modules/library/presentation/components/slots/sheetPresence';
import { beforeEach, describe, expect, it } from 'vitest';

/** A stack of three pages. */
let stack: HTMLElement;

beforeEach(() => {
  stack = document.createElement('div');
  for (const anchor of ['traits', 'features', 'deeds']) {
    const page = document.createElement('div');
    page.setAttribute('data-sheet-page', '');
    page.setAttribute('data-anchor', anchor);
    page.innerHTML = `<p>${anchor} prose</p>`;
    stack.appendChild(page);
  }
  document.body.replaceChildren(stack);
});

describe('hidePages', () => {
  it('should hide every page but the one named', () => {
    hidePages(stack, [0]);

    expect(stack.children[0].hasAttribute('hidden')).toBe(false);
    expect(stack.children[1].getAttribute('hidden')).toBe('until-found');
    expect(stack.children[2].getAttribute('hidden')).toBe('until-found');
  });

  it('should hide with the value that keeps a page findable', () => {
    hidePages(stack, [0]);

    /* A plain `hidden` would be `display: none`, which find-in-page skips. */
    expect(stack.children[1].getAttribute('hidden')).not.toBe('');
  });

  it('should leave two showing while one fades into the other', () => {
    hidePages(stack, [2, 0]);

    expect(stack.children[0].hasAttribute('hidden')).toBe(false);
    expect(stack.children[2].hasAttribute('hidden')).toBe(false);
    expect(stack.children[1].getAttribute('hidden')).toBe('until-found');
  });

  it('should take the attribute off a page that is shown again', () => {
    hidePages(stack, [0]);
    hidePages(stack, [1]);

    expect(stack.children[1].hasAttribute('hidden')).toBe(false);
    expect(stack.children[0].getAttribute('hidden')).toBe('until-found');
  });

  it('should hide everything when nothing is named', () => {
    hidePages(stack, []);

    for (const page of stack.children) {
      expect(page.getAttribute('hidden')).toBe('until-found');
    }
  });
});

describe('pageAsked', () => {
  it('should name the page an event was raised on', () => {
    expect(pageAsked(stack, eventOn(stack.children[2]))).toBe(2);
  });

  it('should name the page an event came up from', () => {
    const buried = stack.children[1].querySelector('p') as HTMLElement;
    expect(pageAsked(stack, eventOn(buried))).toBe(1);
  });

  it('should name nothing for an event from outside the stack', () => {
    const stray = document.createElement('p');
    document.body.appendChild(stray);

    expect(pageAsked(stack, eventOn(stray))).toBe(-1);
  });

  it('should name nothing for an event from a page of another stack', () => {
    const other = document.createElement('div');
    other.setAttribute('data-sheet-page', '');
    document.body.appendChild(other);

    expect(pageAsked(stack, eventOn(other))).toBe(-1);
  });
});

/**
 * An event that has already been raised on an element.
 *
 * @param {Element} el - What to raise it on.
 * @returns {Event} The event, carrying that element as its target.
 */
function eventOn(el: Element): Event {
  const event = new CustomEvent('ik:reveal', { bubbles: true });
  el.dispatchEvent(event);
  return event;
}
