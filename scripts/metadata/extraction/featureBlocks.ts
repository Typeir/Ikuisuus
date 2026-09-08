/**
 * @fileoverview Named blocks inside slot-form content.
 * @description Finds the headings that name a mechanic, which in slot-form
 * content are the headings written inside a block component.
 *
 * @module scripts/metadata/extraction/featureBlocks
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-07
 */

import { plain } from '../textUtils';

/**
 * A named block
 *
 * @interface NamedBlock
 * @property {string} name - Heading text as the page prints it
 * @property {number} startLine - 1-indexed line of the block's opening tag
 * @property {number} endLine - 1-indexed line of its closing tag
 */
export interface NamedBlock {
  name: string;
  startLine: number;
  endLine: number;
}

/**
 * Block components whose heading names a mechanic.
 */
const BLOCK_NAMES = ['Feature', 'Trait', 'Curse', 'Action', 'Attack', 'Pool'];

const OPEN = new RegExp(`^\\s*<(${BLOCK_NAMES.join('|')})\\b`);
const CLOSE = new RegExp(`^\\s*</(${BLOCK_NAMES.join('|')})>\\s*$`);
const HEADING = /^#{2,6}\s+(.+?)\s*$/;
const TAG_END = />\s*$/;

/**
 * Reads every named block in slot-form text.
 *
 * @description Nested blocks each report their own heading, since a feature
 * inside a feature is a mechanic in its own right; a block whose heading is
 * missing reports nothing
 *
 * @param {string} text - File text
 * @returns {NamedBlock[]} Blocks in document order
 */
export function namedFeatureBlocks(text: string): NamedBlock[] {
  const lines = text.split('\n');
  const blocks: NamedBlock[] = [];
  const open: { name: string | null; startLine: number }[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (OPEN.test(lines[i])) {
      /* A block with several slots writes one attribute per line, so the tag
         it opens with runs to whichever line closes it. */
      const startLine = i + 1;
      while (i < lines.length && !TAG_END.test(lines[i])) i += 1;
      open.push({ name: null, startLine });
      continue;
    }
    if (CLOSE.test(lines[i])) {
      const block = open.pop();
      if (block?.name) {
        blocks.push({
          name: block.name,
          startLine: block.startLine,
          endLine: i + 1,
        });
      }
      continue;
    }
    const heading = lines[i].match(HEADING);
    if (heading && open.length > 0) {
      const innermost = open[open.length - 1];
      innermost.name ??= plain(heading[1]);
    }
  }

  return blocks.sort((a, b) => a.startLine - b.startLine);
}
