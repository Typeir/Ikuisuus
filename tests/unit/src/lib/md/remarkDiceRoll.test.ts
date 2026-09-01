/**
 * @fileoverview remarkDiceRoll Plugin Unit Tests
 * @description Tests for the remark plugin that transforms `[% ... %]`
 * dice expressions in text nodes into `<DiceRoll>` MDX JSX elements.
 *
 * @module tests/unit/src/lib/md/remarkDiceRoll.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-07-10
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/remarkDiceRoll Plugin under test
 */

import remarkDiceRoll from '@/lib/md/remarkDiceRoll';
import { describe, expect, it } from 'vitest';

describe('remarkDiceRoll', () => {
  describe('exports', () => {
    it('should export default function', () => {
      expect(remarkDiceRoll).toBeDefined();
      expect(typeof remarkDiceRoll).toBe('function');
    });
  });

  describe('plugin factory', () => {
    it('should return a transformer function', () => {
      const transformer = remarkDiceRoll();
      expect(typeof transformer).toBe('function');
    });
  });

  describe('text without dice expressions', () => {
    it('should leave plain text unchanged', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [{ type: 'text', value: 'Hello world' }],
      };

      transformer(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        type: 'text',
        value: 'Hello world',
      });
    });

    it('should leave text with plain dice notation unchanged', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [{ type: 'text', value: 'Roll 2d20 for attack' }],
      };

      transformer(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        type: 'text',
        value: 'Roll 2d20 for attack',
      });
    });
  });

  describe('single dice expression', () => {
    it('should replace a pure dice expression with mdxJsxTextElement', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [{ type: 'text', value: '[% 2d20 + 5 fire %]' }],
      };

      transformer(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'DiceRoll',
        attributes: expect.arrayContaining([
          expect.objectContaining({ name: 'dice', value: '2d20' }),
          expect.objectContaining({ name: 'modifier', value: '+5' }),
          expect.objectContaining({ name: 'damageType', value: 'fire' }),
        ]),
      });
    });

    it('should handle expression with special', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [{ type: 'text', value: '[% 2d20;KH1 %]' }],
      };

      transformer(tree);

      const node = tree.children[0] as Record<string, unknown>;
      expect(node.type).toBe('mdxJsxTextElement');
      expect(node.name).toBe('DiceRoll');
      const attrs = node.attributes as Array<{ name: string; value: string }>;
      expect(attrs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'specials', value: 'KH1' }),
        ]),
      );
    });

    it('should handle expression with multiple specials', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [{ type: 'text', value: '[% 2d20;KH1;DL1 + 5 %]' }],
      };

      transformer(tree);

      const node = tree.children[0] as Record<string, unknown>;
      const attrs = node.attributes as Array<{ name: string; value: string }>;
      expect(attrs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'specials', value: 'KH1,DL1' }),
        ]),
      );
    });

    it('should omit null attributes', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [{ type: 'text', value: '[% 2d20 %]' }],
      };

      transformer(tree);

      const node = tree.children[0] as Record<string, unknown>;
      const attrs = node.attributes as Array<{ name: string }>;
      const attrNames = attrs.map((a) => a.name);
      expect(attrNames).toContain('dice');
      expect(attrNames).not.toContain('specials');
      expect(attrNames).not.toContain('modifier');
      expect(attrNames).not.toContain('damageType');
    });
  });

  describe('mixed text and expressions', () => {
    it('should split text with expression in the middle', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [{ type: 'text', value: 'Deals [% 3d6 fire %] damage.' }],
      };

      transformer(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0]).toMatchObject({ type: 'text', value: 'Deals ' });
      expect(tree.children[1]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'DiceRoll',
      });
      expect(tree.children[2]).toMatchObject({
        type: 'text',
        value: ' damage.',
      });
    });

    it('should handle expression at the start of text', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [{ type: 'text', value: '[% 2d20;KH1 %] to hit' }],
      };

      transformer(tree);

      expect(tree.children).toHaveLength(2);
      expect(tree.children[0]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'DiceRoll',
      });
      expect(tree.children[1]).toMatchObject({
        type: 'text',
        value: ' to hit',
      });
    });

    it('should handle expression at the end of text', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [
          { type: 'text', value: 'Damage: [% 8d10 + 10 bludgeoning %]' },
        ],
      };

      transformer(tree);

      expect(tree.children).toHaveLength(2);
      expect(tree.children[0]).toMatchObject({
        type: 'text',
        value: 'Damage: ',
      });
      expect(tree.children[1]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'DiceRoll',
      });
    });

    it('should handle multiple expressions in one text node', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [
          { type: 'text', value: '[% 2d6 fire %] plus [% 1d8 + 3 %] damage' },
        ],
      };

      transformer(tree);

      const elementCount = tree.children.filter(
        (c: Record<string, unknown>) => c.type === 'mdxJsxTextElement',
      ).length;
      expect(elementCount).toBe(2);
    });
  });

  describe('malformed expressions', () => {
    it('should leave malformed dice as plain text', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [{ type: 'text', value: '[% abc %]' }],
      };

      transformer(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        type: 'text',
        value: '[% abc %]',
      });
    });

    it('should leave empty expression as plain text', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [{ type: 'text', value: '[% %]' }],
      };

      transformer(tree);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        type: 'text',
        value: '[% %]',
      });
    });

    it('should handle mixed valid and invalid expressions', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [
          { type: 'text', value: '[% 2d20 %] works but [% abc %] does not' },
        ],
      };

      transformer(tree);

      const elements = tree.children.filter(
        (c: Record<string, unknown>) => c.type === 'mdxJsxTextElement',
      );
      expect(elements).toHaveLength(1);
    });
  });

  describe('paragraph context', () => {
    it('should process text inside a paragraph node', () => {
      const transformer = remarkDiceRoll();

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'Roll [% 1d20 + 5 %] to succeed.' },
            ],
          },
        ],
      };

      transformer(tree);

      const paragraph = tree.children[0] as Record<string, unknown>;
      const paragraphChildren = paragraph.children as Array<
        Record<string, unknown>
      >;
      expect(paragraphChildren).toHaveLength(3);
      expect(paragraphChildren[1].type).toBe('mdxJsxTextElement');
    });
  });
});
