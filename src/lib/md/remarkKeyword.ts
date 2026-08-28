/**
 * Remark Keyword Plugin
 *
 * @fileoverview Remark plugin replacing `[# kw:... #]` keyword expressions in
 * text nodes with `<Keyword>` MDX JSX elements. A reference is resolved against
 * a keyword registry when one is supplied, which adds the `href` attribute.
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
import {
  keywordTemplateId,
  resolveKeywordRef,
  routeForFile,
  type KeywordRegistry,
} from './keywordIndex';

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
 * @param {KeywordReference} reference - Parsed reference parts
 * @param {KeywordRegistry} [registry] - Registry used to resolve the link target
 * @returns {MdxJsxTextElementNode} An MDAST JSX element node
 */
function keywordNode(
  reference: KeywordReference,
  registry?: KeywordRegistry,
): MdxJsxTextElementNode {
  const attributes = [
    attributeNode('term', reference.value),
    attributeNode('display', reference.display),
  ];

  if (reference.namespace) {
    attributes.push(attributeNode('namespace', reference.namespace));
  }

  const resolved = registry
    ? resolveKeywordRef(registry, reference.namespace, reference.value)
    : null;

  if (resolved) {
    attributes.push(
      attributeNode(
        'href',
        `${routeForFile(resolved.filePath)}#${resolved.anchor}`,
      ),
      attributeNode(
        'templateId',
        keywordTemplateId(reference.namespace, resolved.anchor),
      ),
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
 */
function processTextNode(
  node: TextNode,
  index: number | null,
  parent: Parent | null,
  registry?: KeywordRegistry,
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
      replacementNodes.push(keywordNode(reference, registry));
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
 * Options accepted by the plugin.
 *
 * @interface RemarkKeywordOptions
 * @property {KeywordRegistry} [registry] - Discovered namespaces used to resolve link targets
 */
export interface RemarkKeywordOptions {
  registry?: KeywordRegistry;
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
        options?.registry,
      );
    });
  };
};

export default remarkKeyword;
