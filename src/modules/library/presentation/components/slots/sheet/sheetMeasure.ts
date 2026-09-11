/**
 * @fileoverview The lengths a sheet reads off the page it is laid on.
 * @module modules/library/presentation/components/slots/sheet/sheetMeasure
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { setPx, setPxOrDrop } from '@/lib/utils/motion';

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
 * @description How far the header's ground has to reach to meet the edges of
 * the page, and how tall the layout's own bars are, are the layout's to say
 * and nothing a stylesheet can be told. They are read off the page instead.
 *
 * @param {HTMLElement} box - The run holding the page.
 * @param {HTMLElement} shelf - The sheet root the properties are written on.
 * @returns {void} Nothing.
 */
export function measureSheet(box: HTMLElement, shelf: HTMLElement): void {
  const root = document.documentElement;

  /* The header's ground reaches the edges of the page and no further. Told to
     run a viewport past each side it would clear them, but the surplus is real
     width the page then has to hold, and a narrow screen ends up able to pan
     sideways over it. */
  /* Measured off the run rather than the bar: a footer is positioned from
     these very numbers, and reading them back off it would be reading its own
     answer. The run holds the same column either way. */
  /* Rounded up rather than to the nearest. These lengths are how far a
     background has to reach to meet an edge, and an edge does not land on a
     whole pixel. Reaching a fraction too far is behind the edge and cannot be
     seen; falling a fraction short is a hairline of the page showing through
     where two surfaces were meant to meet. */
  const edges = box.getBoundingClientRect();
  setPx(shelf, '--sheet-bleed-start', Math.ceil(Math.max(0, edges.left)));
  setPx(
    shelf,
    '--sheet-bleed-end',
    Math.ceil(Math.max(0, root.clientWidth - edges.right)),
  );

  /* The rule across the top of the page is the layout's, not the sheet's. Its
     height is read rather than imposed: holding the layout's header to a
     number the sheet chose is what makes it grow and the menu beneath it
     stutter. */
  /* One reading for both bars, so the header cannot come out level with the
     layout's title while the footer drifts off its rule. */
  for (const [selector, prop] of EDGES) {
    const edge = document.querySelector(selector);
    const tall = edge ? edge.getBoundingClientRect().height : null;
    setPxOrDrop(shelf, prop, tall === null ? null : Math.ceil(tall));
  }
}
