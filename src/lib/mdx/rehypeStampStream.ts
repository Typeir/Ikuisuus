/**
 * @fileoverview Rehype plugin that stamps a `data-stream` attribute on all
 * `<section>` elements already in the tree.
 *
 * @description Runs after `rehypeSectionize` has created the section tree.
 * Rather than replacing sectionize or running it twice, this micro-plugin
 * performs a single `visit` pass and writes `data-stream` onto every element
 * that has a `data-heading-level` attribute.
 *
 * @module lib/mdx/rehypeStampStream
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-28
 */

import type { Element, Root } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * Options accepted by the rehypeStampStream plugin.
 *
 * @property {string} streamText - Pre-composed doubled stream string written
 *   as `data-stream` on every `<section>` element with a `data-heading-level`
 *   attribute. The CSS terminal-stream animation reads it via
 *   `content: attr(data-stream)`.
 */
export type RehypeStampStreamOptions = {
  streamText: string;
};

/**
 * Unified/rehype plugin that stamps `data-stream` on all sectionized elements.
 * Expects `rehypeSectionize` to have already run in the same pipeline so that
 * `<section data-heading-level>` wrappers are present.
 *
 * @param {RehypeStampStreamOptions} opts - Plugin options
 * @returns {(tree: Root) => void} Transformer function
 */
const rehypeStampStream: Plugin<[RehypeStampStreamOptions], Root> = (
  opts: RehypeStampStreamOptions,
) => {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (
        (node.tagName === 'section' &&
          node.properties?.['dataHeadingLevel'] !== undefined) ||
        node.tagName === 'ul' ||
        node.tagName === 'ol'
      ) {
        node.properties['dataStream'] = opts.streamText;
        node.properties['style'] =
          `--heading-level: ${String(node.properties['dataHeadingLevel'])}`;
      }
    });
  };
};

export default rehypeStampStream;
