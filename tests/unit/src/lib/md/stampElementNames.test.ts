/**
 * @fileoverview Unit tests for the element name stamping plugin.
 *
 * @module tests/unit/src/lib/md/stampElementNames.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-10
 */

import { ELEMENT_NAME_ATTRIBUTE } from '@/lib/constants/mdxElement';
import stampElementNames from '@/lib/md/stampElementNames';
import type { Root } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';

/**
 * A node the walk can read.
 */
type AnyNode = Record<string, unknown> & { children?: AnyNode[] };

/**
 * Parses MDX and runs the plugin over it.
 *
 * @param {string} source - MDX source
 * @returns {Root} Transformed tree
 */
function run(source: string): Root {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .parse(source) as Root;
  (stampElementNames as unknown as () => (t: Root) => void)()(tree);
  return tree;
}

/**
 * The name stamped on a node, or null.
 *
 * @param {AnyNode} node - Node to read
 * @returns {string | null} Stamped name
 */
function stampOf(node: AnyNode): string | null {
  const attributes = (node.attributes ?? []) as Array<{
    name?: string;
    value?: unknown;
  }>;
  const stamped = attributes.find((a) => a.name === ELEMENT_NAME_ATTRIBUTE);
  return typeof stamped?.value === 'string' ? stamped.value : null;
}

/**
 * Every stamped name in the tree, in document order.
 *
 * @param {Root} tree - Tree to walk
 * @returns {string[]} Stamped names
 */
function stampedNames(tree: Root): string[] {
  const out: string[] = [];
  const walk = (node: AnyNode): void => {
    const name = stampOf(node);
    if (name) out.push(name);
    for (const child of node.children ?? []) walk(child);
  };
  for (const child of tree.children as AnyNode[]) walk(child);
  return out;
}

describe('stampElementNames', () => {
  it('names every component, flow or inline', () => {
    const tree = run(
      '<Progression>\n\n  <Column label="Abandon" values="12" />\n\n</Progression>\n\nText with a <Keyword>x</Keyword> in it.\n',
    );

    expect(stampedNames(tree)).toEqual(['Progression', 'Column', 'Keyword']);
  });

  it('leaves HTML tags to React, which keeps their names', () => {
    const tree = run('<div>\n\n<span>plain</span>\n\n</div>\n');

    expect(stampedNames(tree)).toEqual([]);
  });

  it('does not stamp an element twice', () => {
    const tree = run('<Column data-element="Column" label="Abandon" />\n');

    expect(stampedNames(tree)).toEqual(['Column']);
  });
});
