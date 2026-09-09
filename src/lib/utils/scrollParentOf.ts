/**
 * @fileoverview The nearest ancestor a node actually scrolls inside.
 * @module lib/utils/scrollParentOf
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/**
 * The nearest ancestor that scrolls, or null when the document does.
 *
 * @description A page embedded in a frame scrolls inside a container rather
 * than the viewport
 *
 * @param {HTMLElement | null} node - Node to look up from.
 * @returns {HTMLElement | null} The scrolling ancestor, or null for the document.
 */
export function scrollParentOf(node: HTMLElement | null): HTMLElement | null {
  const stop = [document.body, document.documentElement];
  for (
    let el = node?.parentElement ?? null;
    el && !stop.includes(el);
    el = el.parentElement
  ) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === 'auto' || overflowY === 'scroll') return el;
  }
  /* The document scrolling is the viewport scrolling, and the two are not the
     same to an observer: rooted at the document element it reports nothing a
     page can use. Null is what asks for the viewport. */
  return null;
}
