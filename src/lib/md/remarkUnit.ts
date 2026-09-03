/**
 * Remark Unit Plugin
 *
 * @fileoverview Remark plugin replacing `[= ... =]` unit expressions in text
 * nodes with `<Unit>` MDX JSX elements. Malformed expressions stay as plain text.
 *
 * @module lib/md/remarkUnit
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 */

import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';
import {
  parseUnitExpression,
  type ParsedUnitExpression,
  UNIT_EXPR_REGEX,
} from './unitExpressionParser';

/**
 * Name of the component this plugin emits.
 *
 * @constant
 */
export const UNIT_COMPONENT_NAME = 'Unit';

/** MDAST node type for an inline MDX JSX element. */
const MDX_JSX_TEXT_ELEMENT = 'mdxJsxTextElement' as const;

/** MDAST node type for an MDX JSX attribute. */
const MDX_JSX_ATTRIBUTE = 'mdxJsxAttribute' as const;

/**
 * MDAST node type for a text node.
 */
interface TextNode extends Node {
  type: 'text';
  value: string;
}

/**
 * MDAST node type for an inline MDX JSX element node.
 */
interface MdxJsxTextElementNode extends Node {
  type: 'mdxJsxTextElement';
  name: string;
  attributes: MdxJsxAttributeNode[];
  children: Node[];
}

/**
 * MDAST node type for an MDX JSX attribute node.
 */
interface MdxJsxAttributeNode extends Node {
  type: 'mdxJsxAttribute';
  name: string;
  value: string;
}

/**
 * Builds an MDAST text node.
 *
 * @param {string} value - The text content
 * @returns {TextNode} A text MDAST node
 */
function textNode(value: string): TextNode {
  return { type: 'text', value };
}

/**
 * Builds an MDAST mdxJsxAttribute node.
 *
 * @param {string} name - The attribute name
 * @param {string} value - The attribute value as a string
 * @returns {MdxJsxAttributeNode} An MDAST JSX attribute node
 */
function attributeNode(name: string, value: string): MdxJsxAttributeNode {
  return {
    type: MDX_JSX_ATTRIBUTE,
    name,
    value,
  };
}

/**
 * Builds an MDAST mdxJsxTextElement node for the `<Unit>` component.
 * Props are string attributes; flags comma-joined; denominator omitted when 1.
 *
 * @param {number} numerator - Quantity numerator
 * @param {number} denominator - Quantity denominator, 1 for whole quantities
 * @param {string} unit - Unit name
 * @param {string[]} flags - Flag shortcodes
 * @returns {MdxJsxTextElementNode} An MDAST JSX element node
 */
function unitNode(
  numerator: number,
  denominator: number,
  unit: string,
  flags: string[],
): MdxJsxTextElementNode {
  const attributes: MdxJsxAttributeNode[] = [
    attributeNode('value', String(numerator)),
    attributeNode('unit', unit),
  ];

  if (denominator !== 1) {
    attributes.push(attributeNode('denominator', String(denominator)));
  }

  if (flags.length > 0) {
    attributes.push(attributeNode('flags', flags.join(',')));
  }

  return {
    type: MDX_JSX_TEXT_ELEMENT,
    name: UNIT_COMPONENT_NAME,
    attributes,
    children: [],
  };
}

/**
 * Processes a single text node, replacing unit expressions with JSX elements.
 * Modifies the parent's children array in place. Handles mixed text by
 * splitting into sequences of text and element nodes.
 *
 * @param {TextNode} node - The text node to process
 * @param {number | null} index - The node's index in its parent
 * @param {Parent | null} parent - The node's parent
 */
function processTextNode(
  node: TextNode,
  index: number | null,
  parent: Parent | null,
): void {
  if (!parent || typeof index !== 'number') {
    return;
  }

  const content = node.value;
  UNIT_EXPR_REGEX.lastIndex = 0;

  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = UNIT_EXPR_REGEX.exec(content)) !== null) {
    matches.push(match);
  }

  if (matches.length === 0) {
    return;
  }

  const replacementNodes: Node[] = [];
  let cursor = 0;

  for (const m of matches) {
    const beforeText = content.slice(cursor, m.index);
    if (beforeText) {
      replacementNodes.push(textNode(beforeText));
    }

    const parsed = parseUnitExpression(m[1]);
    if (parsed) {
      replacementNodes.push(
        unitNode(
          parsed.numerator,
          parsed.denominator,
          parsed.unit,
          parsed.flags,
        ),
      );
    } else {
      replacementNodes.push(textNode(m[0]));
    }

    cursor = m.index + m[0].length;
  }

  const afterText = content.slice(cursor);
  if (afterText) {
    replacementNodes.push(textNode(afterText));
  }

  parent.children.splice(index, 1, ...replacementNodes);
}

/**
 * Remark plugin factory that transforms `[= ... =]` unit expressions in text
 * nodes into `<Unit>` MDX JSX elements.
 *
 * @returns {Plugin<[], Root>} A unified plugin that transforms the MDAST
 */
const remarkUnit: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'text', (node, idx, parent) => {
      processTextNode(node as TextNode, idx ?? null, parent as Parent | null);
    });
  };
};

export default remarkUnit;
