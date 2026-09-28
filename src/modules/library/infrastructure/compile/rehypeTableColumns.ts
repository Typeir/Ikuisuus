/**
 * @fileoverview Rehype plugin stamping markdown table cells `data-nowrap` (headers, short columns) or `data-prose` (long-text columns).
 *
 * @module modules/library/infrastructure/compile/rehypeTableColumns
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { Element, Root } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * Text length a body cell must pass for its column to count as prose and wrap.
 *
 * @constant
 */
export const PROSE_CHARS = 40;

/**
 * Attribute groups that carry the display text of a childless inline component, first match wins.
 *
 * @constant
 */
const DISPLAY_ATTRIBUTES: readonly (readonly string[])[] = [
  ['display'],
  ['term'],
  ['value', 'unit'],
  ['dice', 'modifier', 'damageType'],
];

/**
 * One MDX JSX attribute.
 *
 * @property {string} [name] - Attribute name
 * @property {unknown} [value] - Attribute value; a string for literal attributes
 */
interface JsxAttribute {
  name?: string;
  value?: unknown;
}

/**
 * Any tree node the walk can meet, MDX JSX included.
 *
 * @property {string} type - Node type
 * @property {string} [value] - Text of a text node
 * @property {TextNode[]} [children] - Child nodes
 * @property {JsxAttribute[]} [attributes] - Attributes of an MDX JSX node
 */
interface TextNode {
  type: string;
  value?: string;
  children?: TextNode[];
  attributes?: JsxAttribute[];
}

/**
 * Display text of a childless MDX JSX node such as `<Keyword>`, `<Unit>` or `<DiceRoll>`.
 *
 * @param {JsxAttribute[]} attributes - Node attributes
 * @returns {string} Text from the first attribute group present, or an empty string
 */
function attributeText(attributes: JsxAttribute[]): string {
  const literal = new Map(
    attributes
      .filter((attribute) => typeof attribute.value === 'string')
      .map((attribute) => [attribute.name, attribute.value as string]),
  );
  for (const group of DISPLAY_ATTRIBUTES) {
    const parts = group.map((name) => literal.get(name)).filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  }
  return '';
}

/**
 * Concatenated text of a node and its descendants, with childless MDX JSX nodes read from their attributes.
 *
 * @param {TextNode} node - Tree node
 * @returns {string} Text content
 */
function textOf(node: TextNode): string {
  if (node.type === 'text') return node.value ?? '';
  const children = node.children ?? [];
  if (children.length === 0 && node.attributes) {
    return attributeText(node.attributes);
  }
  return children.map(textOf).join('');
}

/**
 * Child elements of a node with one of the given tag names.
 *
 * @param {Element} node - Parent element
 * @param {string[]} tags - Tag names to keep
 * @returns {Element[]} Matching children in order
 */
function childElements(node: Element, tags: string[]): Element[] {
  return node.children.filter(
    (child): child is Element =>
      child.type === 'element' && tags.includes(child.tagName),
  );
}

/**
 * Rows of a table, head and body sections included.
 *
 * @param {Element} table - Table element
 * @returns {Element[]} Row elements in document order
 */
function rowsOf(table: Element): Element[] {
  return childElements(table, ['thead', 'tbody', 'tfoot', 'tr']).flatMap(
    (section) =>
      section.tagName === 'tr' ? [section] : childElements(section, ['tr']),
  );
}

/**
 * Stamps `data-nowrap` on headers and short-column body cells, and `data-prose` on body cells of columns past {@link PROSE_CHARS}.
 *
 * @param {Element} table - Table element, mutated in place
 */
function markCells(table: Element): void {
  const rows = rowsOf(table).map((row) => childElements(row, ['td', 'th']));
  const longest: number[] = [];

  for (const cells of rows) {
    cells.forEach((cell, index) => {
      if (cell.tagName !== 'td') return;
      const length = textOf(cell as TextNode).replace(/\s+/g, ' ').trim().length;
      longest[index] = Math.max(longest[index] ?? 0, length);
    });
  }

  for (const cells of rows) {
    cells.forEach((cell, index) => {
      const prose = cell.tagName === 'td' && (longest[index] ?? 0) > PROSE_CHARS;
      cell.properties = {
        ...cell.properties,
        ...(prose ? { dataProse: true } : { dataNowrap: true }),
      };
    });
  }
}

/**
 * Plugin factory.
 *
 * @returns {(tree: Root) => void} Transformer that marks the cells of every table element
 */
const rehypeTableColumns: Plugin<[], Root> = () => (tree: Root) => {
  visit(tree, 'element', (node: Element) => {
    if (node.tagName === 'table') markCells(node);
  });
};

export default rehypeTableColumns;
