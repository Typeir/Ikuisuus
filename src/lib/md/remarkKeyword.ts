/**
 * Remark Keyword Plugin
 *
 * @fileoverview Remark plugin replacing `[# kw:... #]` keyword expressions in
 * text nodes with `<Keyword>` MDX JSX elements. A reference is resolved against
 * the resolutions the caller supplies, which add the `href` attribute. The
 * plugin resolves nothing itself: it has no filesystem and no index, so a
 * document's targets are worked out before it runs and handed in.
 *
 * Malformed expressions stay as plain text; a well-formed expression that
 * resolves to nothing still renders its display text, never its source markup.
 *
 * @module lib/md/remarkKeyword
 * @version 2.0.0
 * @author Typeir
 * @since 2026-08-19
 */

import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';
import {
  KEYWORD_EXPR_REGEX,
  parseKeywordReference,
  type KeywordReference,
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
 * Normalised lookup key for a reference, matching what the extractor emits.
 *
 * @param {KeywordReference} reference - Parsed reference parts
 * @returns {string} `namespace;value`, or the bare value
 */
function keyOf(reference: KeywordReference): string {
  return reference.namespace
    ? `${reference.namespace};${reference.value}`
    : reference.value;
}

/**
 * Builds an MDAST mdxJsxTextElement node for the `<Keyword>` component.
 *
 * Resolution is the caller's: this stamps what it is handed. An unresolved
 * reference still renders its display text, never its source markup.
 *
 * @param {KeywordReference} reference - Parsed reference parts
 * @param {KeywordResolutions} [resolutions] - Targets, keyed by normalised reference
 * @returns {MdxJsxTextElementNode} An MDAST JSX element node
 */
function keywordNode(
  reference: KeywordReference,
  resolutions?: KeywordResolutions,
): MdxJsxTextElementNode {
  const attributes = [
    attributeNode('term', reference.value),
    attributeNode('display', reference.display),
  ];

  if (reference.namespace) {
    attributes.push(attributeNode('namespace', reference.namespace));
  }

  const resolved = resolutions?.[keyOf(reference)];

  if (resolved) {
    attributes.push(
      attributeNode('href', resolved.href),
      attributeNode('templateId', resolved.templateId),
      attributeNode('heading', resolved.heading),
    );
  }

  return {
    type: MDX_JSX_TEXT_ELEMENT,
    name: KEYWORD_COMPONENT_NAME,
    attributes,
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
 * @param {KeywordResolutions} [resolutions] - Targets, keyed by normalised reference
 */
function processTextNode(
  node: TextNode,
  index: number | null,
  parent: Parent | null,
  resolutions?: KeywordResolutions,
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

    const reference = parseKeywordReference(m[1]);
    if (reference) {
      replacementNodes.push(keywordNode(reference, resolutions));
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
 * Where one reference points, once something has resolved it.
 *
 * @interface KeywordResolution
 * @property {string} href - Locale-relative route and anchor of the defining heading
 * @property {string} templateId - Id of the shard carrying that section's prose
 * @property {string} heading - Heading text, used as the card title
 */
export interface KeywordResolution {
  href: string;
  templateId: string;
  heading: string;
}

/** Resolutions keyed by normalised reference, `namespace;value` or a bare value. */
export type KeywordResolutions = Record<string, KeywordResolution>;

/**
 * Options accepted by the plugin.
 *
 * @interface RemarkKeywordOptions
 * @property {KeywordResolutions} [resolutions] - Targets for the references this document writes
 */
export interface RemarkKeywordOptions {
  resolutions?: KeywordResolutions;
}

/**
 * Remark plugin factory that transforms `[# kw:... #]` keyword expressions in
 * text nodes into `<Keyword>` MDX JSX elements.
 *
 * @param {RemarkKeywordOptions} [options] - Plugin options
 * @returns {Plugin<[RemarkKeywordOptions?], Root>} A unified plugin that transforms the MDAST
 */
const remarkKeyword: Plugin<[RemarkKeywordOptions?], Root> = (options) => {
  return (tree: Root) => {
    visit(tree, 'text', (node, idx, parent) => {
      processTextNode(
        node as TextNode,
        idx ?? null,
        parent as Parent | null,
        options?.resolutions,
      );
    });
  };
};

export default remarkKeyword;
