/**
 * Spell Metadata Generator Integration Tests
 * 
 * @fileoverview Integration tests for the spell metadata extraction system.
 * Tests parsing of D&D spells including cantrips, leveled spells, and legendary
 * spells with various casting times, components, and special mechanics.
 * 
 * @module tests/integration/spell-metadata
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires vitest Testing framework
 * @requires @scripts/metadata/generateSpellMetadata.mjs Spell metadata generator
 * @requires @scripts/core/shared-utils.mjs Shared utilities and data access
 * 
 * @example
 * // Run these tests
 * npm run test:file tests/integration/src/scripts/spell-metadata.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { parseSpellFile } from '@scripts/metadata/generateSpellMetadata.mjs';
import { loadSharedData } from '@scripts/core/shared-utils.mjs';

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
  /**
   * Load shared data once before running tests
   * This mimics the production behavior where shared data is loaded at generator startup
   */
  beforeAll(async () => {
    sharedData = await loadSharedData();
  });

  describe('Dual Casting Time Spell Parsing', () => {
    /**
     * Tests spell with action or reaction casting time
     * 
     * @description Validates parsing of spells that can be cast as either
     * an action or reaction (e.g., "1 action or reaction")
     */
    it('should parse a legendary spell with dual casting time', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Forbidden Sun');
    });

    /**
     * Tests spell level extraction
     * 
     * @description Validates parsing of spell level from header
     */
    it('should extract spell level (5th)', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.level).toBe(5);
    });

    /**
     * Tests spell school extraction
     * 
     * @description Validates parsing of spell school (Evocation, Abjuration, etc.)
     */
    it('should extract spell school', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.school).toBe('Evocation');
    });

    /**
     * Tests legendary quality extraction
     * 
     * @description Validates parsing of spell quality (Legendary, Epic, Mythic)
     */
    it('should extract legendary quality', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.quality).toBe('Legendary');
    });

    /**
     * Tests casting time array extraction
     * 
     * @description Validates that castingTime is parsed as an array
     * containing both 'action' and 'reaction'
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
     * Tests raw casting time preservation
     * 
     * @description Validates that the original casting time text is preserved
     */
    it('should preserve raw casting time text', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.castingTimeRaw).toBeDefined();
      expect(result.castingTimeRaw.toLowerCase()).toContain('action');
      expect(result.castingTimeRaw.toLowerCase()).toContain('reaction');
    });

    /**
     * Tests concentration detection
     * 
     * @description Validates detection of concentration requirement
     */
    it('should detect concentration requirement', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.concentration).toBe(true);
    });

    /**
     * Tests component extraction
     * 
     * @description Validates parsing of spell components (V, S, M)
     */
    it('should extract somatic component', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.somatic).toBe(true);
    });
  });

  describe('Cantrip Parsing', () => {
    /**
     * Tests cantrip (level 0) spell extraction
     * 
     * @description Validates parsing of cantrips which have special formatting
     */
    it('should parse a cantrip spell', async () => {
      const filePath = path.join(FIXTURES_DIR, 'cantrip.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Lesser Mooncleave');
    });

    /**
     * Tests cantrip level detection
     * 
     * @description Validates that cantrips are identified as level 0
     */
    it('should identify as cantrip (level 0)', async () => {
      const filePath = path.join(FIXTURES_DIR, 'cantrip.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.level).toBe(0);
    });

    /**
     * Tests simple casting time extraction
     * 
     * @description Validates parsing of single-action casting time
     */
    it('should extract action casting time', async () => {
      const filePath = path.join(FIXTURES_DIR, 'cantrip.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.castingTime).toBeDefined();
      expect(result.castingTime).toContain('action');
    });

    /**
     * Tests verbal component detection
     * 
     * @description Validates detection of verbal component
     */
    it('should detect verbal component', async () => {
      const filePath = path.join(FIXTURES_DIR, 'cantrip.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      // Cantrip has V component
      expect(result.verbal).toBe(true);
    });

    /**
     * Tests no concentration for cantrip
     * 
     * @description Validates cantrips without concentration
     */
    it('should have no concentration', async () => {
      const filePath = path.join(FIXTURES_DIR, 'cantrip.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.concentration).toBe(false);
    });
  });

  describe('High-Level Concentration Spell Parsing', () => {
    /**
     * Tests 9th-level spell extraction
     * 
     * @description Validates parsing of the highest level spells
     */
    it('should parse a 9th-level spell', async () => {
      const filePath = path.join(FIXTURES_DIR, 'high-level-concentration.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result).toBeDefined();
      expect(result.title).toBe('True Light');
      expect(result.level).toBe(9);
    });

    /**
     * Tests legendary quality at high level
     * 
     * @description Validates legendary quality detection for high-level spells
     */
    it('should extract legendary quality', async () => {
      const filePath = path.join(FIXTURES_DIR, 'high-level-concentration.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.quality).toBe('Legendary');
    });

    /**
     * Tests concentration spell at high level
     * 
     * @description Validates concentration detection for sustained spells
     */
    it('should detect concentration requirement', async () => {
      const filePath = path.join(FIXTURES_DIR, 'high-level-concentration.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.concentration).toBe(true);
    });

    /**
     * Tests component extraction for this spell
     * 
     * @description Validates parsing of V, S components (no material in this fixture)
     */
    it('should extract components correctly', async () => {
      const filePath = path.join(FIXTURES_DIR, 'high-level-concentration.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      // This fixture has V, S only (no material component)
      expect(result.verbal).toBe(true);
      expect(result.somatic).toBe(true);
      expect(result.material).toBe(false);
    });

    /**
     * Tests duration extraction for concentration spells
     * 
     * @description Validates parsing of concentration duration
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
     * Tests reaction-only spell extraction
     * 
     * @description Validates parsing of spells that can only be cast as reactions
     */
    it('should parse a reaction spell', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result).toBeDefined();
      // Fixture title is "Shield Spell" (from # heading)
      expect(result.title).toBe('Shield Spell');
    });

    /**
     * Tests 1st-level spell detection
     * 
     * @description Validates parsing of 1st-level spell
     */
    it('should identify as 1st-level', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.level).toBe(1);
    });

    /**
     * Tests abjuration school detection
     * 
     * @description Validates parsing of Abjuration school
     */
    it('should extract abjuration school', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.school).toBe('Abjuration');
    });

    /**
     * Tests reaction-only casting time
     * 
     * @description Validates that reaction is the only casting time
     */
    it('should extract reaction casting time', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.castingTime).toBeDefined();
      expect(result.castingTime).toContain('reaction');
    });

    /**
     * Tests instantaneous duration
     * 
     * @description Validates detection of instantaneous duration
     */
    it('should have instantaneous duration', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.duration?.toLowerCase()).toContain('round');
    });

    /**
     * Tests non-concentration spell
     * 
     * @description Validates that instantaneous spells don't require concentration
     */
    it('should not require concentration', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.concentration).toBe(false);
    });
  });

  describe('Tag Generation', () => {
    /**
     * Tests automatic tag generation for spells
     * 
     * @description Validates that tags are generated based on spell level,
     * school, damage types, conditions, and mechanics
     */
    it('should generate appropriate tags', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.tags.length).toBeGreaterThan(0);
    });

    /**
     * Tests level tag generation
     * 
     * @description Validates level is included in tags
     */
    it('should include level tag', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      const hasLevelTag = result.tags.some((tag: string) => tag.startsWith('level:'));
      expect(hasLevelTag).toBe(true);
    });

    /**
     * Tests school tag generation
     * 
     * @description Validates school is included in tags
     */
    it('should include school tag', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      const hasSchoolTag = result.tags.some((tag: string) => 
        tag.startsWith('school:') || tag.toLowerCase().includes('evocation')
      );
      expect(hasSchoolTag).toBe(true);
    });

    /**
     * Tests quality tag for legendary spells
     * 
     * @description Validates quality tag for legendary/epic/mythic spells
     */
    it('should include quality tag for legendary spell', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      const hasQualityTag = result.tags.some((tag: string) => 
        tag.startsWith('quality:') || tag.toLowerCase().includes('legendary')
      );
      expect(hasQualityTag).toBe(true);
    });

    /**
     * Tests concentration mechanic tag
     * 
     * @description Validates concentration is included in tags
     */
    it('should include concentration tag when applicable', async () => {
      const filePath = path.join(FIXTURES_DIR, 'high-level-concentration.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      const hasConcentrationTag = result.tags.some((tag: string) => 
        tag.includes('concentration')
      );
      expect(hasConcentrationTag).toBe(true);
    });

    /**
     * Tests reaction mechanic tag
     * 
     * @description Validates reaction is included in tags for reaction spells
     */
    it('should include reaction tag for reaction spells', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      const hasReactionTag = result.tags.some((tag: string) => 
        tag.includes('reaction')
      );
      expect(hasReactionTag).toBe(true);
    });
  });

  describe('Slug Generation', () => {
    /**
     * Tests slug generation from file path
     * 
     * @description Validates that slugs are correctly generated from filenames
     */
    it('should generate correct slug from filename', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.slug).toBeDefined();
      expect(result.slug).toBe('dual-casting-time');
    });

    /**
     * Tests file path is included in metadata
     * 
     * @description Validates the source file path is stored in metadata
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
     * Tests range extraction for spells
     * 
     * @description Validates parsing of spell range
     */
    it('should extract range for targeted spells', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-casting-time.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.range).toBeDefined();
      expect(result.range).toContain('120');
    });

    /**
     * Tests self range for personal spells
     * 
     * @description Validates detection of Self range
     */
    it('should extract self range for personal spells', async () => {
      const filePath = path.join(FIXTURES_DIR, 'reaction-spell.mdx');
      const result = await parseSpellFile(filePath, sharedData);
      
      expect(result.range?.toLowerCase()).toContain('self');
    });
  });
});
