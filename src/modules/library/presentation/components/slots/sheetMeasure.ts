/**
 * @fileoverview The lengths a sheet reads off the page it is laid on.
 * @module modules/library/presentation/components/slots/sheetMeasure
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { setPx, setPxOrDrop } from '@/lib/utils/motion';
import { scrollParentOf } from '@/lib/utils/scrollParentOf';

/**
 * The layout's own bars, and the properties the sheet keeps their heights in.
 *
 * @description The sheet's header stands as tall as the sidebar's title and
 * its footer as tall as the sidebar's footer.
 */
const EDGES: ReadonlyArray<readonly [string, string]> = [
  ['.sidebar-header', '--sheet-headline'],
  ['.sidebar-footer', '--sheet-footline'],
];

/**
 * Writes the lengths a sheet cannot know from a stylesheet.
 *
 * @description The page's run has to end exactly where the document does, or
 * the header lands on the page's own heading at the bottom of the scroll. What
 * lies under the sheet is the layout's, so it is measured. The body's own
 * height cancels out of the measurement, so growing it never moves the number.
 *
 * @param {HTMLElement} box - The run holding the page.
 * @param {HTMLElement} shelf - The sheet root the properties are written on.
 * @returns {void} Nothing.
 */
export function measureSheet(box: HTMLElement, shelf: HTMLElement): void {
  const root = document.documentElement;

  /* Embedded in a frame the page scrolls inside a container, so the run ends
     where that container's content does rather than where the document's
     does. */
  const view = scrollParentOf(box);
  const scroller = view ?? document.scrollingElement ?? root;
  const bottom =
    box.getBoundingClientRect().bottom -
    (view ? view.getBoundingClientRect().top : 0) +
    (view ? view.scrollTop : window.scrollY);

  /* The sheet pays this number out as padding of its own, and that padding is
     inside the scroll it is measured against. Read raw, every pass would find
     the space it added last pass and add it again, and the page would grow
     without end. Taking back what is already paid leaves the number standing
     still, and `setPx` holds the last pixel of it steady. */
  const paid = Number.parseFloat(getComputedStyle(shelf).paddingBlockEnd) || 0;
  setPx(
    shelf,
    '--sheet-trailing',
    Math.max(
      0,
      Math.min(window.innerHeight, scroller.scrollHeight - bottom - paid),
    ),
  );

  /* The header's ground reaches the edges of the page and no further. Told to
     run a viewport past each side it would clear them, but the surplus is real
     width the page then has to hold, and a narrow screen ends up able to pan
     sideways over it. */
  /* Measured off the run rather than the bar: a footer is positioned from
     these very numbers, and reading them back off it would be reading its own
     answer. The run holds the same column either way. */
  const edges = box.getBoundingClientRect();
  setPx(shelf, '--sheet-bleed-start', Math.max(0, edges.left));
  setPx(shelf, '--sheet-bleed-end', Math.max(0, root.clientWidth - edges.right));

  /* The rule across the top of the page is the layout's, not the sheet's. Its
     height is read rather than imposed: holding the layout's header to a
     number the sheet chose is what makes it grow and the menu beneath it
     stutter. */
  /* One reading for both bars, so the header cannot come out level with the
     layout's title while the footer drifts off its rule. */
  for (const [selector, prop] of EDGES) {
    const edge = document.querySelector(selector);
    setPxOrDrop(shelf, prop, edge ? edge.getBoundingClientRect().height : null);
  }
}
