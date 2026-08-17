/**
 * @fileoverview Inline aspect shorthand `[( group:value )]` → `<Aspect />`.
 * @description Prose authors write `[( condition:frightened )]` instead of the
 * JSX element; an optional `;display` picks the rendering mode
 * (`[( form:blade;glyph )]`). Runs before `remarkUnit`; the shorthand cannot
 * contain `=` or `%`, so the delimiters never collide. Malformed tokens are
 * left as text so a typo stays visible.
 *
 * @module lib/md/remarkAspect
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';

/**
 * Name of the component this plugin emits; the MDX runtime resolves it via the component map.
 *
 * @constant
 */
export const ASPECT_COMPONENT_NAME = 'Aspect';

/**
 * Matches `[( group:value )]` and `[( group:value;display )]`. Group and value
 * are kebab tokens; group may itself be namespaced (`meta:content`).
 *
 * @constant
 */
export const ASPECT_EXPR_REGEX =
  /\[\(\s*([a-z][a-z0-9-]*(?::[a-z0-9-]+)+)\s*(?:;\s*(verbose|compact|glyph)\s*)?\)\]/g;

interface TextNode extends Node {
  type: 'text';
  value: string;
}

interface MdxJsxAttributeNode extends Node {
  type: 'mdxJsxAttribute';
  name: string;
  value: string;
}

interface MdxJsxTextElementNode extends Node {
  type: 'mdxJsxTextElement';
  name: string;
  attributes: MdxJsxAttributeNode[];
  children: Node[];
}

/**
 * Builds the `<Aspect value display />` inline element.
 *
 * @param {string} value - Aspect token
 * @param {string | undefined} display - Rendering mode, when authored
 * @returns {MdxJsxTextElementNode} The element
 */
function aspectNode(
  value: string,
  display: string | undefined,
): MdxJsxTextElementNode {
  const attributes: MdxJsxAttributeNode[] = [
    { type: 'mdxJsxAttribute', name: 'value', value },
  ];
  if (display) {
    attributes.push({ type: 'mdxJsxAttribute', name: 'display', value: display });
  }
  return {
    type: 'mdxJsxTextElement',
    name: ASPECT_COMPONENT_NAME,
    attributes,
    children: [],
  };
}

/**
 * Splits one text node around its shorthand tokens.
 *
 * @param {TextNode} node - Text node
 * @param {number | null} index - Position in the parent
 * @param {Parent | null} parent - Parent node
 */
function processTextNode(
  node: TextNode,
  index: number | null,
  parent: Parent | null,
): void {
  if (!parent || typeof index !== 'number') return;
  const content = node.value;
  ASPECT_EXPR_REGEX.lastIndex = 0;
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = ASPECT_EXPR_REGEX.exec(content)) !== null) matches.push(m);
  if (matches.length === 0) return;

  const out: Node[] = [];
  let cursor = 0;
  for (const match of matches) {
    const before = content.slice(cursor, match.index);
    if (before) out.push({ type: 'text', value: before } as TextNode);
    out.push(aspectNode(match[1], match[2]));
    cursor = match.index + match[0].length;
  }
  const after = content.slice(cursor);
  if (after) out.push({ type: 'text', value: after } as TextNode);
  parent.children.splice(index, 1, ...out);
}

/**
 * Remark plugin factory. See file overview.
 *
 * @returns {(tree: Root) => void} Transformer
 */
const remarkAspect: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'text', (node, idx, parent) => {
      processTextNode(node as TextNode, idx ?? null, parent as Parent | null);
    });
  };
};

export default remarkAspect;
