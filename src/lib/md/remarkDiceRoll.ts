/**
 * Remark Dice Roll Plugin
 *
 * @fileoverview Remark plugin that finds `[% ... %]` dice expressions in text nodes
 * and replaces them with MDX JSX elements (`<DiceRoll>` component).
 * Handles mixed text + expression nodes by splitting into sequences.
 * Malformed expressions are left as plain text (fail-safe).
 *
 * @module lib/md/remarkDiceRoll
 * @version 1.0.0
 * @author Typeir
 * @since 2026-07-10
 */

import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';
import { DICE_EXPR_REGEX, parseDiceExpression } from './diceExpressionParser';

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
 * Builds an MDAST mdxJsxTextElement node for the `<DiceRoll>` component.
 * All props are passed as string attributes; specials are comma-joined.
 *
 * @param {string} dice - Dice notation, e.g. "2d20"
 * @param {string[]} specials - Array of special roll types
 * @param {string | null} modifier - Signed modifier string or null
 * @param {string | null} damageType - Damage type description or null
 * @returns {MdxJsxTextElementNode} An MDAST JSX element node
 */
function diceRollNode(
  dice: string,
  specials: string[],
  modifier: string | null,
  damageType: string | null,
): MdxJsxTextElementNode {
  const attributes: MdxJsxAttributeNode[] = [attributeNode('dice', dice)];

  if (specials.length > 0) {
    attributes.push(attributeNode('specials', specials.join(',')));
  }

  if (modifier !== null) {
    attributes.push(attributeNode('modifier', modifier));
  }

  if (damageType !== null) {
    attributes.push(attributeNode('damageType', damageType));
  }

  return {
    type: MDX_JSX_TEXT_ELEMENT,
    name: 'DiceRoll',
    attributes,
    children: [],
  };
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
 * Processes a single text node, replacing dice expressions with JSX elements.
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
  DICE_EXPR_REGEX.lastIndex = 0;

  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = DICE_EXPR_REGEX.exec(content)) !== null) {
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

    const parsed = parseDiceExpression(m[1]);
    if (parsed) {
      replacementNodes.push(
        diceRollNode(
          parsed.dice,
          parsed.specials,
          parsed.modifier,
          parsed.damageType,
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
 * Remark plugin factory that transforms `[% ... %]` dice expressions in text
 * nodes into `<DiceRoll>` MDX JSX elements.
 *
 * @returns {Plugin<[], Root>} A unified plugin that transforms the MDAST
 */
const remarkDiceRoll: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'text', (node, idx, parent) => {
      processTextNode(node as TextNode, idx ?? null, parent as Parent | null);
    });
  };
};

export default remarkDiceRoll;
