/**
 * @fileoverview remarkKeyword Plugin Unit Tests
 * @description Tests for the remark plugin that transforms `[# kw:... #]`
 * keyword expressions in text nodes into `<Keyword>` MDX JSX elements.
 *
 * @module tests/unit/lib/md/remarkKeyword
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-19
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/remarkKeyword Plugin under test
 */

import remarkKeyword from '@/lib/md/remarkKeyword';
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

describe('remarkKeyword', () => {
  describe('exports', () => {
    it('should export default function', () => {
      expect(remarkKeyword).toBeDefined();
      expect(typeof remarkKeyword).toBe('function');
    });
  });

  describe('plugin factory', () => {
    it('should return a transformer function', () => {
      expect(typeof remarkKeyword()).toBe('function');
    });
  });

  describe('text without keyword expressions', () => {
    it('should leave plain text unchanged', () => {
      const tree = rootWithText('Hello world');
      remarkKeyword()(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        type: 'text',
        value: 'Hello world',
      });
    });

    it('should leave unit expressions untouched', () => {
      const tree = rootWithText('within [= 2 stride =] of it');
      remarkKeyword()(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        value: 'within [= 2 stride =] of it',
      });
    });
  });

  describe('transformation', () => {
    it('should replace a lone expression with a Keyword element', () => {
      const tree = rootWithText('[# kw:accuracy #]');
      remarkKeyword()(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'Keyword',
      });
    });

    it('should carry term and display as attributes', () => {
      const tree = rootWithText('[# kw:Briefly #]');
      remarkKeyword()(tree);

      const attrs = (tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      }).attributes;

      expect(attrs).toEqual(
        expect.arrayContaining([
          { type: 'mdxJsxAttribute', name: 'term', value: 'briefly' },
          { type: 'mdxJsxAttribute', name: 'display', value: 'Briefly' },
        ]),
      );
    });

    it('should handle multi-word keywords', () => {
      const tree = rootWithText('[# kw:damage bonus #]');
      remarkKeyword()(tree);

      const attrs = (tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      }).attributes;

      expect(attrs).toEqual(
        expect.arrayContaining([
          { type: 'mdxJsxAttribute', name: 'term', value: 'damage bonus' },
        ]),
      );
    });
  });

  describe('mixed text and expressions', () => {
    it('should split surrounding text into separate nodes', () => {
      const tree = rootWithText('uses your [# kw:accuracy #] here');
      remarkKeyword()(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0]).toMatchObject({
        type: 'text',
        value: 'uses your ',
      });
      expect(tree.children[1]).toMatchObject({ name: 'Keyword' });
      expect(tree.children[2]).toMatchObject({ type: 'text', value: ' here' });
    });

    it('should handle multiple expressions in one node', () => {
      const tree = rootWithText('[# kw:accuracy #] and [# kw:damage bonus #]');
      remarkKeyword()(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0]).toMatchObject({ name: 'Keyword' });
      expect(tree.children[1]).toMatchObject({ type: 'text', value: ' and ' });
      expect(tree.children[2]).toMatchObject({ name: 'Keyword' });
    });
  });

  describe('fail-safe behaviour', () => {
    it.each([
      ['unregistered keyword', '[# kw:swiftness #]'],
      ['missing kw: marker', '[# accuracy #]'],
      ['empty expression', '[# #]'],
    ])('should leave %s as plain text', (_label, input) => {
      const tree = rootWithText(input);
      remarkKeyword()(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({ type: 'text', value: input });
    });

    it('should keep valid expressions when a malformed one is adjacent', () => {
      const tree = rootWithText('[# kw:swiftness #] and [# kw:accuracy #]');
      remarkKeyword()(tree);

      expect(tree.children[0]).toMatchObject({ type: 'text' });
      expect(tree.children[2]).toMatchObject({ name: 'Keyword' });
    });
  });
});
