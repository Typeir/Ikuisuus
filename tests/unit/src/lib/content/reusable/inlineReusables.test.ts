/**
 * @fileoverview inlineReusables Unit Tests
 * @description Tests source-level splicing of reusable regions, including
 * named regions, unknown-tag passthrough, and recursion guarding.
 *
 * @module tests/unit/lib/content/reusable/inlineReusables
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 * @requires @/lib/content/reusable/inlineReusables Module under test
 */

import { inlineReusables } from '@/lib/content/reusable/inlineReusables';
import type { ReusableEntry } from '@/lib/content/reusable/reusableRegistry';
import { describe, expect, it } from 'vitest';

/**
 * Builds a registry from plain entries.
 *
 * @param {Record<string, Partial<ReusableEntry>>} entries - Entry shapes by name
 * @returns {Map<string, ReusableEntry>} A registry map
 */
const registryOf = (
  entries: Record<string, Partial<ReusableEntry>>,
): Map<string, ReusableEntry> =>
  new Map(
    Object.entries(entries).map(([name, partial]) => [
      name,
      {
        name,
        filePath: `/content/${name}.mdx`,
        body: partial.body ?? null,
        regions: partial.regions ?? {},
      },
    ]),
  );

describe('inlineReusables', () => {
  describe('whole-body references', () => {
    it('should splice the body in place of the tag', () => {
      const reg = registryOf({ LesserMooncleave: { body: 'THE STAT BLOCK' } });
      const out = inlineReusables('before\n\n<LesserMooncleave />\n\nafter', reg);

      expect(out).toContain('THE STAT BLOCK');
      expect(out).toContain('before');
      expect(out).toContain('after');
      expect(out).not.toContain('<LesserMooncleave />');
    });

    it('should splice every occurrence', () => {
      const reg = registryOf({ Boons: { body: 'X' } });
      const out = inlineReusables('<Boons />\n<Boons />', reg);

      expect(out.match(/X/g)).toHaveLength(2);
    });

    it('should surround the splice with blank lines', () => {
      const reg = registryOf({ Boons: { body: '# Heading' } });
      const out = inlineReusables('text\n<Boons />', reg);

      expect(out).toContain('\n\n# Heading\n\n');
    });
  });

  describe('named regions', () => {
    it('should splice a dotted region', () => {
      const reg = registryOf({
        Mooncleave: { regions: { statBlock: 'BLOCK', lore: 'LORE' } },
      });
      const out = inlineReusables('<Mooncleave.statBlock />', reg);

      expect(out).toContain('BLOCK');
      expect(out).not.toContain('LORE');
    });

    it('should resolve a bare tag when exactly one region exists', () => {
      const reg = registryOf({ Mooncleave: { regions: { only: 'ONLY' } } });
      expect(inlineReusables('<Mooncleave />', reg)).toContain('ONLY');
    });

    it('should leave a bare tag alone when the region is ambiguous', () => {
      const reg = registryOf({
        Mooncleave: { regions: { a: 'A', b: 'B' } },
      });
      expect(inlineReusables('<Mooncleave />', reg)).toContain('<Mooncleave />');
    });

    it('should leave an unknown region name alone', () => {
      const reg = registryOf({ Mooncleave: { regions: { a: 'A' } } });
      const out = inlineReusables('<Mooncleave.missing />', reg);

      expect(out).toContain('<Mooncleave.missing />');
    });
  });

  describe('passthrough', () => {
    it('should leave unknown components untouched', () => {
      const reg = registryOf({ Boons: { body: 'X' } });
      const out = inlineReusables('<Image src="a.webp" alt="a" />', reg);

      expect(out).toBe('<Image src="a.webp" alt="a" />');
    });

    it('should not shadow a built-in that shares a content filename', () => {
      const reg = registryOf({ Boons: { body: 'X' } });
      const out = inlineReusables('<Image />', reg);

      expect(out).toBe('<Image />');
    });

    it('should return source unchanged for an empty registry', () => {
      const out = inlineReusables('<Boons />', new Map());
      expect(out).toBe('<Boons />');
    });

    it('should ignore lowercase tags', () => {
      const reg = registryOf({ Boons: { body: 'X' } });
      expect(inlineReusables('<div />', reg)).toBe('<div />');
    });
  });

  describe('nesting', () => {
    it('should resolve a region that references another region', () => {
      const reg = registryOf({
        Outer: { body: 'outer <Inner />' },
        Inner: { body: 'INNERMOST' },
      });

      expect(inlineReusables('<Outer />', reg)).toContain('INNERMOST');
    });

    it('should terminate on a self-referencing region', () => {
      const reg = registryOf({ Loop: { body: 'loop <Loop />' } });
      const out = inlineReusables('<Loop />', reg);

      expect(out).toContain('loop');
      expect(typeof out).toBe('string');
    });
  });

  describe('attributes', () => {
    it('should splice even when the tag carries attributes', () => {
      const reg = registryOf({ Boons: { body: 'X' } });
      expect(inlineReusables('<Boons  />', reg)).toContain('X');
    });
  });
});
