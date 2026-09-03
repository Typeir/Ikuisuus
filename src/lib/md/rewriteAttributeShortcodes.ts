/**
 * @fileoverview Shared attribute shortcode visitor for the remark plugins.
 * @description Visits `mdxJsxFlowElement` and `mdxJsxTextElement`, and rewrites
 * each `mdxJsxAttribute` whose string value matches a shortcode regex into an
 * `mdxJsxAttributeValueExpression` whose estree is a JSX fragment of JSXText
 * and JSXElement nodes, built by the same parse the text visitor uses. Plugins
 * never see attribute strings without this pass.
 *
 * @module lib/md/rewriteAttributeShortcodes
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-02
 */

import type { Root } from 'mdast';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';

/**
 * MDAST node type for an inline MDX JSX element.
 */
interface MdxJsxElementNode extends Node {
  type: 'mdxJsxFlowElement' | 'mdxJsxTextElement';
  name: string;
  attributes: MdxJsxAttributeNode[];
  children: Node[];
}

/**
 * MDAST node type for an MDX JSX attribute with a string value.
 */
interface MdxJsxAttributeNode extends Node {
  type: 'mdxJsxAttribute';
  name: string;
  value: string;
}

/**
 * MDAST node shape the build function returns: a JSX element with string
 * attributes, converted here into its estree form.
 */
interface BuiltElementNode extends Node {
  type: 'mdxJsxTextElement';
  name: string;
  attributes: MdxJsxAttributeNode[];
}

/**
 * Parsed shortcode payload, plugin-defined.
 */
type Parsed = unknown;

/**
 * Node builders hand the attribute visitor the same element nodes the text
 * visitor emits.
 */
type BuildNodeFn = (parsed: Parsed) => BuiltElementNode;

/**
 * JSXText estree node.
 *
 * @param {string} value - Text content
 * @returns {object} Estree JSXText
 */
function jsxText(value: string) {
  return { type: 'JSXText', value, raw: value };
}

/**
 * String literal estree node.
 *
 * @param {string} value - Literal value
 * @returns {object} Estree Literal
 */
function stringLiteral(value: string) {
  return { type: 'Literal', value };
}

/**
 * JSX attribute estree node.
 *
 * @param {string} name - Attribute name
 * @param {string} value - Attribute value
 * @returns {object} Estree JSXAttribute
 */
function jsxAttribute(name: string, value: string) {
  return {
    type: 'JSXAttribute',
    name: { type: 'JSXIdentifier', name },
    value: stringLiteral(value),
  };
}

/**
 * Self-closing JSX element estree node for a built element.
 *
 * @param {BuiltElementNode} node - Built MDAST element
 * @returns {object} Estree JSXElement
 */
function jsxElement(node: BuiltElementNode) {
  return {
    type: 'JSXElement',
    openingElement: {
      type: 'JSXOpeningElement',
      name: { type: 'JSXIdentifier', name: node.name },
      attributes: node.attributes.map((attr) => jsxAttribute(attr.name, attr.value)),
      selfClosing: true,
    },
    closingElement: null,
    children: [],
  };
}

/**
 * JSX fragment estree node.
 *
 * @param {object[]} children - Fragment children
 * @returns {object} Estree JSXFragment
 */
function jsxFragment(children: object[]) {
  return {
    type: 'JSXFragment',
    openingFragment: { type: 'JSXOpeningFragment' },
    closingFragment: { type: 'JSXClosingFragment' },
    children,
  };
}

/**
 * Program estree node wrapping one fragment expression.
 *
 * @param {object} expression - Fragment expression
 * @returns {object} Estree Program
 */
function program(expression: object) {
  return {
    type: 'Program',
    body: [{ type: 'ExpressionStatement', expression }],
    sourceType: 'module',
    comments: [],
  };
}

/**
 * Attribute with its string value replaced by a fragment expression, matching
 * the shape mdast-util-mdx-jsx parses for authored `attr={<>…</>}`.
 *
 * @param {MdxJsxAttributeNode} attr - Original attribute
 * @param {string} value - Original attribute string
 * @param {object} expression - Fragment expression
 * @returns {object} MDX attribute node with an expression value
 */
function expressionAttribute(
  attr: MdxJsxAttributeNode,
  value: string,
  expression: object,
) {
  return {
    ...attr,
    value: {
      type: 'mdxJsxAttributeValueExpression',
      value: `<>${value}</>`,
      data: { estree: program(expression) },
    },
  };
}

/**
 * Expression attribute value carrying a fragment an earlier plugin built.
 */
interface ExpressionAttributeValue {
  type: 'mdxJsxAttributeValueExpression';
  value: string;
  data?: { estree?: { body?: Array<{ expression?: { children?: object[] } }> } };
}

/**
 * Rewrites shortcode-bearing string attributes into JSX fragment expressions.
 * A string attribute becomes a fragment on its first match; a fragment an
 * earlier plugin built has its `JSXText` children split again, so every
 * shortcode family in one attribute is rewritten no matter which plugin runs
 * first.
 *
 * @param {Root} tree - MDAST tree
 * @param {RegExp} regex - Shortcode regex with one inner capture
 * @param {(inner: string) => Parsed | null} parseFn - Inner-content parser
 * @param {BuildNodeFn} buildNodeFn - Parsed payload to element node
 * @returns {void}
 */
export function rewriteAttributeShortcodes(
  tree: Root,
  regex: RegExp,
  parseFn: (inner: string) => Parsed | null,
  buildNodeFn: BuildNodeFn,
): void {
  const scan = new RegExp(regex.source, regex.flags);

  const splitText = (text: string): object[] | null => {
    scan.lastIndex = 0;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    while ((match = scan.exec(text)) !== null) {
      matches.push(match);
    }
    if (matches.length === 0) {
      return null;
    }

    const children: object[] = [];
    let cursor = 0;
    for (const found of matches) {
      const before = text.slice(cursor, found.index);
      if (before) {
        children.push(jsxText(before));
      }
      const parsed = parseFn(found[1]);
      if (parsed === null || parsed === undefined) {
        children.push(jsxText(found[0]));
      } else {
        children.push(jsxElement(buildNodeFn(parsed)));
      }
      cursor = found.index + found[0].length;
    }
    const after = text.slice(cursor);
    if (after) {
      children.push(jsxText(after));
    }
    return children;
  };

  const fragmentOf = (value: unknown): { children?: object[] } | null => {
    const expression = value as ExpressionAttributeValue | null;
    if (
      !expression ||
      typeof expression !== 'object' ||
      expression.type !== 'mdxJsxAttributeValueExpression'
    ) {
      return null;
    }
    const fragment = expression.data?.estree?.body?.[0]?.expression;
    return fragment && Array.isArray(fragment.children) ? fragment : null;
  };

  const rewriteAttributes = (node: MdxJsxElementNode): void => {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      if (attr.type !== 'mdxJsxAttribute') {
        continue;
      }

      if (typeof attr.value === 'string') {
        const children = splitText(attr.value);
        if (!children) {
          continue;
        }
        node.attributes[i] = expressionAttribute(
          attr,
          attr.value,
          jsxFragment(children),
        ) as unknown as MdxJsxAttributeNode;
        continue;
      }

      const fragment = fragmentOf(attr.value);
      if (!fragment?.children) {
        continue;
      }
      fragment.children = fragment.children.flatMap((child) => {
        const text = child as { type?: string; value?: string };
        if (text.type !== 'JSXText' || typeof text.value !== 'string') {
          return [child];
        }
        return splitText(text.value) ?? [child];
      });
    }
  };

  visit(tree, (node: Node) => {
    const type = node.type as string;
    if (type === 'mdxJsxFlowElement' || type === 'mdxJsxTextElement') {
      rewriteAttributes(node as unknown as MdxJsxElementNode);
    }
  });
}
