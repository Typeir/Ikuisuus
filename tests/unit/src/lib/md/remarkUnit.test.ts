/**
 * @fileoverview remarkUnit Plugin Unit Tests
 * @description Tests for the remark plugin that transforms `[= ... =]`
 * unit expressions in text nodes into `<Unit>` MDX JSX elements.
 *
 * @module tests/unit/src/lib/md/remarkUnit.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/remarkUnit Plugin under test
 */

import remarkUnit from '@/lib/md/remarkUnit';
import { describe, expect, it } from 'vitest';

/**
 * Builds a minimal MDAST root containing a single text node.
 *
 * @param {string} value - The text content
 * @returns {{ type: string; children: { type: string; value: string }[] }} A root node
 */
const rootWithText = (value: string) => ({
  type: 'root',
  children: [{ type: 'text', value }],
});

describe('remarkUnit', () => {
  describe('exports', () => {
    it('should export default function', () => {
      expect(remarkUnit).toBeDefined();
      expect(typeof remarkUnit).toBe('function');
    });
  });

  describe('plugin factory', () => {
    it('should return a transformer function', () => {
      expect(typeof remarkUnit()).toBe('function');
    });
  });

  describe('text without unit expressions', () => {
    it('should leave plain text unchanged', () => {
      const tree = rootWithText('Hello world');
      remarkUnit()(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        type: 'text',
        value: 'Hello world',
      });
    });

    it('should leave dice expressions untouched', () => {
      const tree = rootWithText('deals [% 3d8 fire %] damage');
      remarkUnit()(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        value: 'deals [% 3d8 fire %] damage',
      });
    });
  });

  describe('transformation', () => {
    it('should replace a lone expression with a Unit element', () => {
      const tree = rootWithText('[= 6 stride =]');
      remarkUnit()(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'Unit',
      });
    });

    it('should carry value and unit as attributes', () => {
      const tree = rootWithText('[= 6 stride =]');
      remarkUnit()(tree);

      const attrs = (tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      }).attributes;

      expect(attrs).toEqual(
        expect.arrayContaining([
          { type: 'mdxJsxAttribute', name: 'value', value: '6' },
          { type: 'mdxJsxAttribute', name: 'unit', value: 'stride' },
        ]),
      );
    });

    it('should omit the denominator attribute for whole quantities', () => {
      const tree = rootWithText('[= 6 stride =]');
      remarkUnit()(tree);

      const attrs = (tree.children[0] as unknown as {
        attributes: { name: string }[];
      }).attributes;

      expect(attrs.some((a) => a.name === 'denominator')).toBe(false);
    });

    it('should emit the denominator attribute for fractions', () => {
      const tree = rootWithText('[= 1/5 stride =]');
      remarkUnit()(tree);

      const attrs = (tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      }).attributes;

      expect(attrs).toEqual(
        expect.arrayContaining([
          { type: 'mdxJsxAttribute', name: 'denominator', value: '5' },
        ]),
      );
    });

    it('should emit flags when present', () => {
      const tree = rootWithText('[= 6 stride;ADJ =]');
      remarkUnit()(tree);

      const attrs = (tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      }).attributes;

      expect(attrs).toEqual(
        expect.arrayContaining([
          { type: 'mdxJsxAttribute', name: 'flags', value: 'ADJ' },
        ]),
      );
    });
  });

  describe('mixed text and expressions', () => {
    it('should split surrounding text into separate nodes', () => {
      const tree = rootWithText('move [= 6 stride =] north');
      remarkUnit()(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0]).toMatchObject({ type: 'text', value: 'move ' });
      expect(tree.children[1]).toMatchObject({ name: 'Unit' });
      expect(tree.children[2]).toMatchObject({ type: 'text', value: ' north' });
    });

    it('should handle multiple expressions in one node', () => {
      const tree = rootWithText('[= 6 stride =] then [= 30 burden =]');
      remarkUnit()(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0]).toMatchObject({ name: 'Unit' });
      expect(tree.children[1]).toMatchObject({ type: 'text', value: ' then ' });
      expect(tree.children[2]).toMatchObject({ name: 'Unit' });
    });
  });

  describe('fail-safe behaviour', () => {
    it.each([
      ['unknown unit', '[= 6 furlong =]'],
      ['missing quantity', '[= stride =]'],
      ['empty expression', '[= =]'],
      ['trailing garbage', '[= 6 stride north =]'],
    ])('should leave %s as plain text', (_label, input) => {
      const tree = rootWithText(input);
      remarkUnit()(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({ type: 'text', value: input });
    });

    it('should keep valid expressions when a malformed one is adjacent', () => {
      const tree = rootWithText('[= 6 furlong =] and [= 6 stride =]');
      remarkUnit()(tree);

      expect(tree.children[0]).toMatchObject({ type: 'text' });
      expect(tree.children[2]).toMatchObject({ name: 'Unit' });
    });
  });
});
