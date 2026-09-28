/**
 * @fileoverview Unit tests for the rehypeTableColumns rehype plugin.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest - Test framework
 * @requires hast-util-from-html - HTML fragment parser
 * @requires @/modules/library/infrastructure/compile/rehypeTableColumns - Plugin under test
 */

import rehypeTableColumns, {
  PROSE_CHARS,
} from '@/modules/library/infrastructure/compile/rehypeTableColumns';
import type { Element, Root } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { describe, expect, it } from 'vitest';

/**
 * Parses a fragment and runs the plugin over it.
 *
 * @param {string} html - Input HTML fragment
 * @returns {Root} Transformed tree
 */
function run(html: string): Root {
  const tree = fromHtml(html, { fragment: true });
  rehypeTableColumns()(tree, tree as never, () => {});
  return tree;
}

/**
 * Cells of the given tag in document order.
 *
 * @param {Root | Element} node - Tree to search
 * @param {string} tag - Cell tag name
 * @returns {Element[]} Matching cells
 */
function cells(node: Root | Element, tag: string): Element[] {
  const found: Element[] = [];
  for (const child of node.children) {
    if (child.type !== 'element') continue;
    if (child.tagName === tag) found.push(child);
    found.push(...cells(child, tag));
  }
  return found;
}

/**
 * Whether a cell carries the nowrap stamp.
 *
 * @param {Element} cell - Table cell
 * @returns {boolean} True when `data-nowrap` is set
 */
function nowrap(cell: Element): boolean {
  return cell.properties?.dataNowrap === true;
}

/**
 * Whether a cell carries the prose stamp.
 *
 * @param {Element} cell - Table cell
 * @returns {boolean} True when `data-prose` is set
 */
function prose(cell: Element): boolean {
  return cell.properties?.dataProse === true;
}

const long = 'x'.repeat(PROSE_CHARS + 1);
const edge = 'y'.repeat(PROSE_CHARS);

describe('rehypeTableColumns', () => {
  it('stamps every header cell', () => {
    const tree = run(
      `<table><thead><tr><th>Name</th><th>Notes</th></tr></thead><tbody><tr><td>a</td><td>${long}</td></tr></tbody></table>`,
    );
    expect(cells(tree, 'th').map(nowrap)).toEqual([true, true]);
    expect(cells(tree, 'th').map(prose)).toEqual([false, false]);
  });

  it('marks a whole column as prose when one of its cells passes the limit', () => {
    const tree = run(
      `<table><tbody><tr><td>a</td><td>short</td></tr><tr><td>b</td><td>${long}</td></tr></tbody></table>`,
    );
    expect(cells(tree, 'td').map(nowrap)).toEqual([true, false, true, false]);
    expect(cells(tree, 'td').map(prose)).toEqual([false, true, false, true]);
  });

  it('keeps a column at exactly the limit on one line', () => {
    const tree = run(
      `<table><tbody><tr><td>${edge}</td></tr></tbody></table>`,
    );
    expect(cells(tree, 'td').map(nowrap)).toEqual([true]);
  });

  it('collapses whitespace before measuring nested inline text', () => {
    const words = Array.from({ length: 7 }, () => 'word').join('   ');
    const tree = run(
      `<table><tbody><tr><td><strong>${words}</strong> <a href="#">tail</a></td></tr></tbody></table>`,
    );
    expect(cells(tree, 'td').map(nowrap)).toEqual([true]);
  });

  it('counts nested inline text toward the limit', () => {
    const tree = run(
      `<table><tbody><tr><td><strong>${edge}</strong> <a href="#">tail</a></td></tr></tbody></table>`,
    );
    expect(cells(tree, 'td').map(nowrap)).toEqual([false]);
  });

  it('reads childless inline components from their display attributes', () => {
    const jsx = (name: string, attributes: Record<string, string>) => ({
      type: 'mdxJsxTextElement',
      name,
      attributes: Object.entries(attributes).map(([key, value]) => ({
        type: 'mdxJsxAttribute',
        name: key,
        value,
      })),
      children: [],
    });
    const tree = fromHtml(
      '<table><tbody><tr><td></td><td></td><td></td></tr></tbody></table>',
      { fragment: true },
    );
    const [keyword, unit, dice] = cells(tree, 'td');
    keyword.children = [
      jsx('Keyword', { term: 'x', display: 'd'.repeat(PROSE_CHARS + 1) }),
    ] as never;
    unit.children = [jsx('Unit', { value: '30', unit: 'strides' })] as never;
    dice.children = [
      jsx('DiceRoll', { dice: '1d6', damageType: 'p'.repeat(PROSE_CHARS) }),
    ] as never;
    rehypeTableColumns()(tree, tree as never, () => {});
    expect([keyword, unit, dice].map(prose)).toEqual([true, false, true]);
  });

  it('marks each table on its own', () => {
    const tree = run(
      `<table><tbody><tr><td>${long}</td></tr></tbody></table><table><tbody><tr><td>ok</td></tr></tbody></table>`,
    );
    expect(cells(tree, 'td').map(nowrap)).toEqual([false, true]);
  });
});
