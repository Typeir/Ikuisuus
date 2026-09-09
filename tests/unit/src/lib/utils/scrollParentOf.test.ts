/**
 * @fileoverview scrollParentOf Tests
 * @module tests/unit/src/lib/utils/scrollParentOf.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { scrollParentOf } from '@/lib/utils/scrollParentOf';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Builds a chain of nested divs, innermost last.
 *
 * @param {number} depth - How many to nest.
 * @returns {HTMLElement[]} The chain, outermost first.
 */
const chain = (depth: number): HTMLElement[] => {
  const made: HTMLElement[] = [];
  let parent: HTMLElement = document.body;
  for (let i = 0; i < depth; i += 1) {
    const el = document.createElement('div');
    parent.appendChild(el);
    made.push(el);
    parent = el;
  }
  return made;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('scrollParentOf', () => {
  it('should return null when nothing between it and the document scrolls', () => {
    const [, , leaf] = chain(3);
    expect(scrollParentOf(leaf)).toBeNull();
  });

  it('should return null for no node at all', () => {
    expect(scrollParentOf(null)).toBeNull();
  });

  it('should find an ancestor that scrolls', () => {
    const [outer, middle, leaf] = chain(3);
    middle.style.overflowY = 'auto';
    expect(scrollParentOf(leaf)).toBe(middle);
    expect(outer).not.toBe(middle);
  });

  it('should take scroll as well as auto', () => {
    const [, middle, leaf] = chain(3);
    middle.style.overflowY = 'scroll';
    expect(scrollParentOf(leaf)).toBe(middle);
  });

  it('should take the nearest scroller, not the outermost', () => {
    const [outer, middle, leaf] = chain(3);
    outer.style.overflowY = 'auto';
    middle.style.overflowY = 'auto';
    expect(scrollParentOf(leaf)).toBe(middle);
  });

  it('should ask for the viewport when only the document scrolls', () => {
    const [, , leaf] = chain(3);
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';

    expect(scrollParentOf(leaf)).toBeNull();

    document.documentElement.style.overflowY = '';
    document.body.style.overflowY = '';
  });

  it('should not treat the node itself as its own scroller', () => {
    const [, , leaf] = chain(3);
    leaf.style.overflowY = 'auto';
    expect(scrollParentOf(leaf)).toBeNull();
  });
});
