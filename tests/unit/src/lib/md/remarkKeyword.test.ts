/**
 * @fileoverview remarkKeyword Plugin Unit Tests
 * @description Tests for the remark plugin that transforms `[# kw:... #]`
 * keyword expressions in text nodes into `<Keyword>` MDX JSX elements.
 *
 * @module tests/unit/src/lib/md/remarkKeyword.test
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

/**
 * Reads the MDX JSX attributes of a node into a plain object.
 *
 * @param {unknown} node - The MDAST node to read
 * @returns {Record<string, string>} Attribute name mapped to value
 */
const attributesOf = (node: unknown): Record<string, string> =>
  Object.fromEntries(
    ((node as { attributes?: { name: string; value: string }[] }).attributes ??
      []).map((attribute) => [attribute.name, attribute.value]),
  );

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
      ['missing kw: marker', '[# accuracy #]'],
      ['empty expression', '[# #]'],
      ['stray semicolon', '[# kw:;prone #]'],
    ])('should leave %s as plain text', (_label, input) => {
      const tree = rootWithText(input);
      remarkKeyword()(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({ type: 'text', value: input });
    });

    it('should render an unresolved term rather than its source markup', () => {
      const tree = rootWithText('[# kw:swiftness #]');
      remarkKeyword()(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({ name: 'Keyword' });
      expect(attributesOf(tree.children[0])).toMatchObject({
        term: 'swiftness',
        display: 'swiftness',
      });
    });

    it('should never leave a well-formed expression as raw text', () => {
      const tree = rootWithText('resists [# kw:resist #] the effect');
      remarkKeyword()(tree);

      const text = tree.children
        .filter((child: { type: string }) => child.type === 'text')
        .map((child: { value: string }) => child.value)
        .join('');
      expect(text).not.toContain('[#');
    });

    it('should keep valid expressions when a malformed one is adjacent', () => {
      const tree = rootWithText('[# accuracy #] and [# kw:accuracy #]');
      remarkKeyword()(tree);

      expect(tree.children[0]).toMatchObject({ type: 'text' });
      expect(tree.children[2]).toMatchObject({ name: 'Keyword' });
    });
  });

  describe('resolution stamping', () => {
    it('should carry the namespace through as an attribute', () => {
      const tree = rootWithText('[# kw:condition:Prone #]');
      remarkKeyword()(tree);

      expect(attributesOf(tree.children[0])).toMatchObject({
        term: 'prone',
        display: 'Prone',
        namespace: 'condition',
      });
    });

    it('should omit href when no resolutions are supplied', () => {
      const tree = rootWithText('[# kw:condition:prone #]');
      remarkKeyword()(tree);

      expect(attributesOf(tree.children[0])).not.toHaveProperty('href');
    });

    it('should render a display override while resolving the target', () => {
      const resolutions = {
        'condition;bleeding': {
          href: 'library/rules/steel-and-strife/conditions#bleeding',
          templateId: 'kw-condition-bleeding',
          heading: 'Bleeding',
        },
      };
      const tree = rootWithText('[# kw:condition:bleeding;the dog bleeds #]');
      remarkKeyword({ resolutions })(tree);

      expect(attributesOf(tree.children[0])).toMatchObject({
        term: 'bleeding',
        display: 'the dog bleeds',
        namespace: 'condition',
        templateId: 'kw-condition-bleeding',
      });
    });

    it('should stamp the target it is handed', () => {
      const resolutions = {
        'condition;prone': {
          href: 'library/rules/steel-and-strife/conditions#prone',
          templateId: 'kw-condition-prone',
          heading: 'Prone',
        },
      };
      const tree = rootWithText('[# kw:condition:prone #]');
      remarkKeyword({ resolutions })(tree);

      expect(attributesOf(tree.children[0])).toMatchObject({
        href: 'library/rules/steel-and-strife/conditions#prone',
        templateId: 'kw-condition-prone',
        heading: 'Prone',
      });
    });

    it('should key a bare reference without a namespace segment', () => {
      const resolutions = {
        resist: {
          href: 'library/rules/steel-and-strife/effects-and-enhancements#resist',
          templateId: 'kw--resist',
          heading: 'Resist',
        },
      };
      const tree = rootWithText('[# kw:Resist #]');
      remarkKeyword({ resolutions })(tree);

      expect(attributesOf(tree.children[0]).templateId).toBe('kw--resist');
    });

    it('should omit href for a reference nothing resolved', () => {
      const tree = rootWithText('[# kw:condition:prone #]');
      remarkKeyword({ resolutions: {} })(tree);

      expect(attributesOf(tree.children[0])).not.toHaveProperty('href');
    });
  });
});
