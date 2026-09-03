/**
 * @fileoverview Unit tests for the shared attribute shortcode visitor.
 *
 * @module tests/unit/src/lib/md/rewriteAttributeShortcodes.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-02
 */

import { DICE_EXPR_REGEX, parseDiceExpression } from '@/lib/md/diceExpressionParser';
import { rewriteAttributeShortcodes } from '@/lib/md/rewriteAttributeShortcodes';
import { parseUnitExpression, UNIT_EXPR_REGEX } from '@/lib/md/unitExpressionParser';
import { describe, expect, it } from 'vitest';

/**
 * Minimal mdast tree with one JSX element carrying a string attribute.
 *
 * @param {string} value - Attribute value
 * @returns {object} Tree
 */
function treeOf(value: string) {
  return {
    type: 'root',
    children: [
      {
        type: 'mdxJsxFlowElement',
        name: 'Feature',
        attributes: [{ type: 'mdxJsxAttribute', name: 'targets', value }],
        children: [],
      },
    ],
  };
}

/**
 * Minimal unit node builder mirroring remarkUnit's unitNode output.
 */
function buildUnitNode(parsed: unknown) {
  const p = parsed as { numerator: number; denominator: number; unit: string; flags: string[] };
  return {
    type: 'mdxJsxTextElement',
    name: 'Unit',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'value', value: String(p.numerator) },
      { type: 'mdxJsxAttribute', name: 'unit', value: p.unit },
    ],
  };
}

describe('rewriteAttributeShortcodes', () => {
  it('replaces a matching string attribute with an expression carrying estree', () => {
    const tree = treeOf('creatures within a [= 6 stride;ADJ =] cone');
    rewriteAttributeShortcodes(tree, UNIT_EXPR_REGEX, parseUnitExpression, buildUnitNode);

    const element = tree.children[0] as unknown as {
      attributes: Array<{ type: string; name: string; value?: string; data?: { estree?: unknown } }>;
    };
    const attr = element.attributes[0];
    expect(attr.type).toBe('mdxJsxAttribute');
    expect(typeof attr.value).toBe('object');
    const expression = attr.value as unknown as { type: string; data: { estree: unknown } };
    expect(expression.type).toBe('mdxJsxAttributeValueExpression');
    expect(expression.data.estree).toBeTruthy();
  });

  it('leaves attributes without shortcodes untouched', () => {
    const tree = treeOf('1 Minor Action');
    rewriteAttributeShortcodes(tree, UNIT_EXPR_REGEX, parseUnitExpression, buildUnitNode);

    const element = tree.children[0] as unknown as {
      attributes: Array<{ type: string; value?: string }>;
    };
    expect(element.attributes[0]).toMatchObject({
      type: 'mdxJsxAttribute',
      value: '1 Minor Action',
    });
  });

  it('leaves unparseable shortcode text as JSXText inside the expression', () => {
    const tree = treeOf('a [= 6 furlong =] b');
    rewriteAttributeShortcodes(tree, UNIT_EXPR_REGEX, parseUnitExpression, buildUnitNode);

    const element = tree.children[0] as unknown as {
      attributes: Array<{ value?: { type: string; data: { estree: unknown } } }>;
    };
    const expression = element.attributes[0].value as { type: string; data: { estree: unknown } };
    expect(expression.type).toBe('mdxJsxAttributeValueExpression');
    expect(JSON.stringify(expression.data.estree)).toContain('[= 6 furlong =]');
  });

  it('rewrites a second shortcode family inside a fragment an earlier pass built', () => {
    const tree = treeOf('[% 1d6 %] within [= 6 stride =]');
    rewriteAttributeShortcodes(tree, UNIT_EXPR_REGEX, parseUnitExpression, buildUnitNode);
    rewriteAttributeShortcodes(tree, DICE_EXPR_REGEX, parseDiceExpression, () => ({
      type: 'mdxJsxTextElement',
      name: 'DiceRoll',
      attributes: [],
    }));

    const element = tree.children[0] as unknown as {
      attributes: Array<{ value?: { data: { estree: unknown } } }>;
    };
    const estree = JSON.stringify(element.attributes[0].value?.data.estree);
    expect(estree).toContain('"name":"Unit"');
    expect(estree).toContain('"name":"DiceRoll"');
    expect(estree).not.toContain('[=');
    expect(estree).not.toContain('[%');
  });
});
