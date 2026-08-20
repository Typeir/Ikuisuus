/**
 * Remark Keyword Plugin
 *
 * @fileoverview Remark plugin replacing `[# kw:... #]` keyword expressions in
 * text nodes with `<Keyword>` MDX JSX elements. Malformed or unregistered
 * expressions stay as plain text.
 *
 * @module lib/md/remarkKeyword
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-19
 */

import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';
import {
  KEYWORD_EXPR_REGEX,
  parseKeywordExpression,
} from './keywordExpressionParser';

/**
 * Name of the component this plugin emits.
 *
 * @constant
 */
export const KEYWORD_COMPONENT_NAME = 'Keyword';

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
 * Builds an MDAST mdxJsxTextElement node for the `<Keyword>` component.
 *
 * @param {string} term - Canonical registry term
 * @param {string} display - Author-written text with casing preserved
 * @returns {MdxJsxTextElementNode} An MDAST JSX element node
 */
function keywordNode(term: string, display: string): MdxJsxTextElementNode {
  return {
    type: MDX_JSX_TEXT_ELEMENT,
    name: KEYWORD_COMPONENT_NAME,
    attributes: [
      attributeNode('term', term),
      attributeNode('display', display),
    ],
    children: [],
  };
}

/**
 * Processes a single text node, replacing keyword expressions with JSX
 * elements. Modifies the parent's children array in place. Handles mixed text
 * by splitting into sequences of text and element nodes.
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
  KEYWORD_EXPR_REGEX.lastIndex = 0;

  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = KEYWORD_EXPR_REGEX.exec(content)) !== null) {
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

    const parsed = parseKeywordExpression(m[1]);
    if (parsed) {
      replacementNodes.push(keywordNode(parsed.term, parsed.display));
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
 * Remark plugin factory that transforms `[# kw:... #]` keyword expressions in
 * text nodes into `<Keyword>` MDX JSX elements.
 *
 * @returns {Plugin<[], Root>} A unified plugin that transforms the MDAST
 */
const remarkKeyword: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'text', (node, idx, parent) => {
      processTextNode(node as TextNode, idx ?? null, parent as Parent | null);
    });
  };
};

export default remarkKeyword;
