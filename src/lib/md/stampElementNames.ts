/**
 * @fileoverview Stamps the authored element name on every MDX component.
 * @description Turns `<Column label="Abandon" />` into the element form with
 * `data-element="Column"` on it
 *
 * @module lib/md/stampElementNames
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-10
 */

import { ELEMENT_NAME_ATTRIBUTE } from '@/lib/constants/mdxElement';
import type { Root, RootContent } from 'mdast';
import type { Plugin } from 'unified';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';

/**
 * An MDX JSX element as the syntax carries it.
 */
interface MdxJsxElementNode extends Node {
  type: 'mdxJsxFlowElement' | 'mdxJsxTextElement';
  name: string | null;
  attributes: Array<{ type: string; name?: string; value?: unknown }>;
}

/**
 * Whether a node is a JSX element the compiler should name.
 *
 * @description A lower-cased name is an HTML tag, which React keeps its own
 * name for.
 *
 * @param {Node} node - Node to test
 * @returns {boolean} True for a component element
 */
function isComponentElement(node: Node): node is MdxJsxElementNode {
  const element = node as MdxJsxElementNode;
  if (
    element.type !== 'mdxJsxFlowElement' &&
    element.type !== 'mdxJsxTextElement'
  ) {
    return false;
  }
  return /^[A-Z]/.test(element.name ?? '');
}

/**
 * Names every component element in the document.
 *
 * @returns {(tree: Root) => void} Transformer
 */
const stampElementNames: Plugin<[], Root> = () => (tree: Root) => {
  visit(tree, (node: RootContent | Node) => {
    if (!isComponentElement(node)) return;
    const name = node.name ?? '';
    node.attributes ??= [];
    if (node.attributes.some((a) => a.name === ELEMENT_NAME_ATTRIBUTE)) return;
    node.attributes.push({
      type: 'mdxJsxAttribute',
      name: ELEMENT_NAME_ATTRIBUTE,
      value: name,
    });
  });
};

export default stampElementNames;
