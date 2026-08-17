/**
 * Spell Metadata Generator Integration Tests
 *
 * @fileoverview Integration tests for spell metadata extraction.
 *
 * @module tests/integration/spell-metadata
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @scripts/metadata/generateSpellMetadata Spell metadata generator
 * @requires @/lib/metadata Shared utilities and data access
 *
 * @example
 * // Run these tests
 * npm run test:file tests/integration/src/scripts/spell-metadata.test.ts
 */

import { parseSpellFile } from '@scripts/metadata/generateSpellMetadata';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadSharedData } from '../../../../scripts/metadata';

/**
 * Path to the fixtures directory containing test spell files
 * @constant {string}
 */
const FIXTURES_DIR = path.resolve(process.cwd(), 'tests/fixtures/spells');

/**
 * Shared data loaded once before all tests
 * @type {Object}
 */
let sharedData: unknown;

describe('Spell Metadata Generator', () => {
  /** Loads shared data once before the test suite runs. */
  beforeAll(async () => {
    sharedData = await loadSharedData();
  });

  describe('Dual Casting Time Spell Parsing', () => {
    /**
     * Parses a spell with action-or-reaction casting time.
     * @description Asserts the resulting spell title is 'Forbidden Sun'.
     */
    it('should parse a legendary spell with dual casting time', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Forbidden Sun');
    });

    /**
     * Extracts spell level.
     * @description Asserts parsed level is 5.
     */
    it('should extract spell level (5th)', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.level).toBe(5);
    });

    /**
     * Extracts spell school.
     * @description Asserts parsed school is 'Evocation'.
     */
    it('should extract spell school', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.school).toBe('Evocation');
    });

    /**
     * Extracts spell quality (Legendary, Epic, Mythic).
     * @description Asserts parsed quality is 'Legendary'.
     */
    it('should extract legendary quality', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.quality).toBe('Legendary');
    });

    /**
     * Parses casting time into an array.
     * @description Asserts castingTime contains both 'action' and 'reaction'.
     */
    it('should extract casting time as array with both action and reaction', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.castingTime).toBeDefined();
      expect(Array.isArray(result.castingTime)).toBe(true);
      expect(result.castingTime).toContain('action');
      expect(result.castingTime).toContain('reaction');
    });

    /**
     * Preserves original casting time text.
     * @description Asserts castingTimeRaw contains both 'action' and 'reaction'.
     */
    it('should preserve raw casting time text', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.castingTimeRaw).toBeDefined();
      expect(result.castingTimeRaw.toLowerCase()).toContain('action');
      expect(result.castingTimeRaw.toLowerCase()).toContain('reaction');
    });

    /**
     * Detects concentration requirement.
     * @description Asserts concentration is true.
     */
    it('should detect concentration requirement', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.concentration).toBe(true);
    });

    /**
     * Parses spell components (V, S, M).
     * @description Asserts the somatic flag is true.
     */
    it('should extract somatic component', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.components?.somatic).toBe(true);
    });
  });

  describe('Cantrip Parsing', () => {
    /**
     * Parses a cantrip (level 0) spell.
     * @description Asserts the resulting spell title is 'Lesser Mooncleave'.
     */
    it('should parse a cantrip spell', async () => {
      const filePath = path.join(FIXTURES_DIR, 'cantrip.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Lesser Mooncleave');
    });

    /**
     * Identifies cantrip level.
     * @description Asserts parsed level is 0.
     */
    it('should identify as cantrip (level 0)', async () => {
      const filePath = path.join(FIXTURES_DIR, 'cantrip.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.level).toBe(0);
    });

    /**
     * Extracts a single action casting time.
     * @description Asserts castingTime contains 'action'.
     */
    it('should extract action casting time', async () => {
      const filePath = path.join(FIXTURES_DIR, 'cantrip.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.castingTime).toBeDefined();
      expect(result.castingTime).toContain('action');
    });

    /**
     * Detects verbal component.
     * @description Asserts the verbal flag is true.
     */
    it('should detect verbal component', async () => {
      const filePath = path.join(FIXTURES_DIR, 'cantrip.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      // Cantrip has V component
      expect(result.components?.verbal).toBe(true);
    });

    /**
     * Verifies cantrip has no concentration.
     * @description Asserts concentration is false.
     */
    it('should have no concentration', async () => {
      const filePath = path.join(FIXTURES_DIR, 'cantrip.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.concentration).toBe(false);
    });
  });

  describe('High-Level Concentration Spell Parsing', () => {
    /**
     * Parses a 9th-level spell.
     * @description Asserts title is 'True Light' and level is 9.
     */
    it('should parse a 9th-level spell', async () => {
      const filePath = path.join(FIXTURES_DIR, 'high-level-concentration.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result).toBeDefined();
      expect(result.title).toBe('True Light');
      expect(result.level).toBe(9);
    });

    /**
     * Extracts legendary quality at high level.
     * @description Asserts parsed quality is 'Legendary'.
     */
    it('should extract legendary quality', async () => {
      const filePath = path.join(FIXTURES_DIR, 'high-level-concentration.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.quality).toBe('Legendary');
    });

    /**
     * Detects concentration at high level.
     * @description Asserts concentration is true.
     */
    it('should detect concentration requirement', async () => {
      const filePath = path.join(FIXTURES_DIR, 'high-level-concentration.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.concentration).toBe(true);
    });

    /**
     * Parses components.
     * @description Asserts verbal and somatic are true and material is falsy.
     */
    it('should extract components correctly', async () => {
      const filePath = path.join(FIXTURES_DIR, 'high-level-concentration.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      // This fixture has V, S only (no material component)
      expect(result.components?.verbal).toBe(true);
      expect(result.components?.somatic).toBe(true);
      expect(result.components?.material).toBeFalsy();
    });

    /**
     * Extracts duration for concentration spells.
     * @description Asserts duration contains '10 minutes'.
     */
    it('should extract duration', async () => {
      const filePath = path.join(FIXTURES_DIR, 'high-level-concentration.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.duration).toBeDefined();
      expect(result.duration.toLowerCase()).toContain('10 minutes');
    });
  });

  describe('Reaction Spell Parsing', () => {
    /**
     * Parses a reaction-only spell.
     * @description Asserts the resulting spell title is 'Shield Spell'.
     */
    it('should parse a reaction spell', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result).toBeDefined();
      // Fixture title is "Shield Spell" (from # heading)
      expect(result.title).toBe('Shield Spell');
    });

    /**
     * Detects 1st-level spell.
     * @description Asserts parsed level is 1.
     */
    it('should identify as 1st-level', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.level).toBe(1);
    });

    /**
     * Extracts abjuration school.
     * @description Asserts parsed school is 'Abjuration'.
     */
    it('should extract abjuration school', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.school).toBe('Abjuration');
    });

    /**
     * Extracts reaction-only casting time.
     * @description Asserts castingTime contains 'reaction'.
     */
    it('should extract reaction casting time', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.castingTime).toBeDefined();
      expect(result.castingTime).toContain('reaction');
    });

    /**
     * Detects instantaneous duration.
     * @description Asserts duration contains 'round'.
     */
    it('should have instantaneous duration', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.duration?.toLowerCase()).toContain('round');
    });

    /**
     * Verifies spell requires no concentration.
     * @description Asserts concentration is false.
     */
    it('should not require concentration', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.concentration).toBe(false);
    });
  });

  describe('Tag Generation', () => {
    /**
     * Generates tags for a spell.
     * @description Tags derive from spell level, school, damage types, conditions, and mechanics.
     */
    it('should generate appropriate tags', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.tags.length).toBeGreaterThan(0);
    });

    /**
     * Includes a level tag.
     * @description Asserts a tag starting with 'level:' exists.
     */
    it('should include level tag', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      const hasLevelTag = result.tags.some((tag: string) =>
        tag.startsWith('level:'),
      );
      expect(hasLevelTag).toBe(true);
    });

    /**
     * Includes a school tag.
     * @description Asserts a tag starting with 'school:' or containing 'evocation' exists.
     */
    it('should not derive a school tag from the subtitle', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.tags.some((tag: string) => tag.startsWith('school:'))).toBe(false);
    });

    /**
     * Includes a quality tag for legendary spells.
     * @description Asserts a tag starting with 'quality:' or containing 'legendary' exists.
     */
    it('should include quality tag for legendary spell', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      const hasQualityTag = result.tags.some(
        (tag: string) =>
          tag.startsWith('quality:') || tag.toLowerCase().includes('legendary'),
      );
      expect(hasQualityTag).toBe(true);
    });

    /**
     * Includes a concentration tag.
     * @description Asserts tags contain 'tempo:sustained'.
     */
    it('should include concentration tag when applicable', async () => {
      const filePath = path.join(FIXTURES_DIR, 'high-level-concentration.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.tags).toContain('tempo:sustained');
    });

    /**
     * Includes a reaction tag.
     * @description Asserts tags contain 'tempo:reactive'.
     */
    it('should include reaction tag for reaction spells', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.tags).toContain('tempo:reactive');
    });
  });

  describe('Slug Generation', () => {
    /**
     * Generates a slug from the filename.
     * @description Asserts slug equals 'dual-casting-time'.
     */
    it('should generate correct slug from filename', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.slug).toBeDefined();
      expect(result.slug).toBe('dual-casting-time');
    });

    /**
     * Stores source file path in metadata.
     * @description Asserts file contains 'dual-casting-time.mdx'.
     */
    it('should include file path in metadata', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.file).toBeDefined();
      expect(result.file).toContain('dual-casting-time.mdx');
    });
  });

  describe('Range Extraction', () => {
    /**
     * Extracts spell range.
     * @description Asserts range equals the converted native measure '24 stride' (source is 120 feet).
     */
    it('should extract range for targeted spells', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.range).toBe('24 stride');
    });

    /**
     * Extracts self range for personal spells.
     * @description Asserts range contains 'self'.
     */
    it('should extract self range for personal spells', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);

      expect(result.range?.toLowerCase()).toContain('self');
    });
  });
});
