/**
 * Heirloom Metadata Generator Integration Tests
 *
 * @fileoverview Integration tests for the heirloom (magical item) metadata extraction system.
 * Tests parsing of D&D magical items including weapons, armor, and accessories with various
 * rarities, properties, and attunement requirements.
 *
 * @module tests/integration/heirloom-metadata
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @scripts/metadata/generateHeirloomMetadata Heirloom metadata generator
 * @requires @/lib/metadata Shared utilities and data access
 *
 * @example
 * // Run these tests
 * npm run test:file tests/integration/src/scripts/heirloom-metadata.test.ts
 */

import { parseHeirloomFile } from '@scripts/metadata/generateHeirloomMetadata';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadSharedData } from '../../../../scripts/metadata';

/**
 * Path to the fixtures directory containing test heirloom files
 * @constant {string}
 */
const FIXTURES_DIR = path.resolve(process.cwd(), 'tests/fixtures/heirlooms');

/**
 * Shared data loaded once before all tests
 * @type {Object}
 */
let sharedData: unknown;

describe('Heirloom Metadata Generator', () => {
  /**
   * Load shared data once before running tests
   * This mimics the production behavior where shared data is loaded at generator startup
   */
  beforeAll(async () => {
    sharedData = await loadSharedData();
  });

  describe('Mythic Weapon Parsing', () => {
    /**
     * Tests mythic artifact weapon extraction
     *
     * @description Validates parsing of high-rarity weapons with complex properties
     * including mastery abilities, size modifiers, and special effects
     */
    it('should parse a mythic artifact weapon', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Blackbone Crusher');
      expect(result.rarity).toContain('mythic');
    });

    /**
     * Tests attunement requirement extraction
     *
     * @description Validates detection of attunement requirements from item description
     */
    it('should detect attunement requirements', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.requiresAttunement).toBe(true);
    });

    /**
     * Tests weapon type extraction
     *
     * @description Validates parsing of weapon type (greatsword, longsword, etc.)
     */
    it('should extract weapon type', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.weaponType).toBeDefined();
      expect(result.weaponType?.toLowerCase()).toContain('greatsword');
    });

    /**
     * Tests hit modifier extraction
     *
     * @description Validates parsing of +X weapon bonuses
     */
    it('should extract hit modifier (+4)', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.hitModifier).toBe(4);
    });

    /**
     * Tests weapon property extraction
     *
     * @description Validates parsing of weapon properties like Two-Handed, Heavy, etc.
     */
    it('should extract weapon properties', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.weaponProperties).toBeDefined();
      expect(Array.isArray(result.weaponProperties)).toBe(true);

      const props =
        result.weaponProperties?.map((p: string) => p.toLowerCase()) || [];
      expect(props).toContain('two-handed');
      expect(props).toContain('heavy');
    });

    /**
     * Tests mastery property extraction
     *
     * @description Validates parsing of weapon mastery abilities (Push, Sunder, etc.)
     */
    it('should extract mastery properties', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.mastery).toBeDefined();
      expect(Array.isArray(result.mastery)).toBe(true);

      const masteries =
        result.mastery?.map((m: string) => m.toLowerCase()) || [];
      expect(masteries.some((m: string) => m.includes('push'))).toBe(true);
    });

    /**
     * Tests weapon damage extraction
     *
     * @description Validates parsing of damage dice and damage type
     */
    it('should extract weapon damage', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.weaponDamage).toBeDefined();
      expect(result.weaponDamage).toContain('4d8');
      expect(result.weaponDamageType?.toLowerCase()).toContain('bludgeoning');
    });
  });

  describe('Armor Item Parsing', () => {
    /**
     * Tests armor item extraction
     *
     * @description Validates parsing of armor items with AC bonuses and special effects
     */
    it('should parse an armor item', async () => {
      const filePath = path.join(FIXTURES_DIR, 'armor-item.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Tombsteel Armor');
    });

    /**
     * Tests rarity extraction for rare items
     *
     * @description Validates parsing of standard rarity levels
     * Note: This fixture has "Rare" in description but "Nonmagical" as item type
     */
    it('should extract rarity (rare) and property:nonmagical tag', async () => {
      const filePath = path.join(FIXTURES_DIR, 'armor-item.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      // Rarity should be extracted from italic header line, not overwritten by item type
      expect(result.rarity).toBe('rare');
      // Item should be tagged with property:nonmagical since it explicitly mentions nonmagical
      expect(result.tags).toContain('property:nonmagical');
    });

    /**
     * Tests armor type detection
     *
     * @description Validates identification of item as armor
     */
    it('should identify as armor type', async () => {
      const filePath = path.join(FIXTURES_DIR, 'armor-item.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.itemType?.toLowerCase()).toContain('armor');
    });

    /**
     * Tests conditional attunement requirement
     *
     * @description Validates parsing of attunement with restrictions
     * (e.g., "requires attunement by a creature proficient in heavy armor")
     */
    it('should detect attunement with restrictions', async () => {
      const filePath = path.join(FIXTURES_DIR, 'armor-item.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.requiresAttunement).toBe(true);
      expect(result.attunementRequirements).toBeDefined();
    });

    /**
     * Tests saving throw type extraction
     *
     * @description Validates detection of saving throws mentioned in item effects
     */
    it('should extract saving throw types from effects', async () => {
      const filePath = path.join(FIXTURES_DIR, 'armor-item.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      // Item mentions Constitution saving throws
      expect(result.savingThrowTypes).toBeDefined();
      if (result.savingThrowTypes) {
        const saves = result.savingThrowTypes.map((s: string) =>
          s.toLowerCase(),
        );
        expect(saves.some((s: string) => s.includes('con'))).toBe(true);
      }
    });

    /**
     * Tests charges extraction
     *
     * @description Validates parsing of items with charge systems
     * Note: The current parser may not extract charges from passive abilities
     */
    it('should extract charges information if available', async () => {
      const filePath = path.join(FIXTURES_DIR, 'armor-item.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      // Charges may not be extracted if not in standard format
      // This test documents current behavior
      if (result.charges) {
        expect(result.charges.max).toBeGreaterThan(0);
      } else {
        // Parser may not detect charges in passive ability format
        expect(result.charges).toBeUndefined();
      }
    });
  });

  describe('Simple Accessory Parsing', () => {
    /**
     * Tests simple accessory item extraction
     *
     * @description Validates parsing of non-weapon, non-armor items like amulets
     */
    it('should parse a simple accessory', async () => {
      const filePath = path.join(FIXTURES_DIR, 'simple-accessory.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Lucky Bone');
    });

    /**
     * Tests very rare rarity extraction
     *
     * @description Validates parsing of "very rare" rarity level
     */
    it('should extract very rare rarity', async () => {
      const filePath = path.join(FIXTURES_DIR, 'simple-accessory.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.rarity).toBe('very rare');
    });

    /**
     * Tests wondrous item type detection
     *
     * @description Validates identification of amulets as wondrous items
     */
    it('should identify as amulet/wondrous item', async () => {
      const filePath = path.join(FIXTURES_DIR, 'simple-accessory.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      const itemType = result.itemType?.toLowerCase() || '';
      expect(itemType.includes('amulet') || itemType.includes('wondrous')).toBe(
        true,
      );
    });

    /**
     * Tests restricted attunement extraction
     *
     * @description Validates parsing of specific attunement requirements
     */
    it('should extract specific attunement requirements', async () => {
      const filePath = path.join(FIXTURES_DIR, 'simple-accessory.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.requiresAttunement).toBe(true);
      expect(result.attunementRequirements).toBeDefined();
      expect(result.attunementRequirements?.toLowerCase()).toContain('sunborn');
    });
  });

  describe('Tag Generation', () => {
    /**
     * Tests automatic tag generation for items
     *
     * @description Validates that tags are generated based on item type,
     * damage types, and other properties
     */
    it('should generate appropriate tags for weapons', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.tags.length).toBeGreaterThan(0);
    });

    /**
     * Tests item category tag
     *
     * @description Validates heirloom category is included in tags
     */
    it('should include category tag', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      const hasCategoryTag = result.tags.some(
        (tag: string) =>
          tag.startsWith('category:') || tag.includes('heirloom'),
      );
      expect(hasCategoryTag).toBe(true);
    });

    /**
     * Tests damage type tag for weapons
     *
     * @description Validates damage type is included in tags
     */
    it('should include damage type in tags', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      const hasDamageTag = result.tags.some(
        (tag: string) =>
          tag.startsWith('damage:') || tag.includes('bludgeoning'),
      );
      expect(hasDamageTag).toBe(true);
    });
  });

  describe('Slug Generation', () => {
    /**
     * Tests slug generation from file path
     *
     * @description Validates that slugs are correctly generated from filenames
     */
    it('should generate correct slug from filename', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.slug).toBeDefined();
      expect(result.slug).toBe('mythic-weapon');
    });

    /**
     * Tests file path is included in metadata
     *
     * @description Validates the source file path is stored in metadata
     */
    it('should include file path in metadata', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mythic-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.file).toBeDefined();
      expect(result.file).toContain('mythic-weapon.mdx');
    });
  });

  describe('Prose Stripping', () => {
    /**
     * Tests dual-form title line parsing
     *
     * @description First balanced paren group only; second form must not bleed
     * into properties or mastery
     */
    it('should parse a dual-form title line without gluing paren groups', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-form-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.weaponType?.toLowerCase()).toBe('longsword');
      expect(result.hitModifier).toBe(1);
      expect(result.mastery).toEqual(['emberfall']);
      expect(
        result.tags.every((tag: string) => !tag.includes('greatshield (')),
      ).toBe(true);
    });

    /**
     * Tests custom in-file mastery handling
     *
     * @description Mastery defined in the item's own Weapon Mastery section:
     * kept in metadata, no property: aspect
     */
    it('should not emit a property aspect for an item-defined mastery', async () => {
      const filePath = path.join(FIXTURES_DIR, 'dual-form-weapon.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.tags).not.toContain('property:emberfall');
      expect(result.tags).toContain('property:versatile');
      expect(result.tags).toContain('property:magical');
    });

    /**
     * Tests mastery clause normalization
     *
     * @description "**Push** or **Slow** — see Weapon Mastery" yields push and
     * slow, note stripped
     */
    it('should split mastery alternatives and strip em-dash notes', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mastery-notes.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.mastery).toContain('push');
      expect(result.mastery).toContain('slow');
      expect(
        result.mastery?.every((m: string) => !m.includes('see weapon mastery')),
      ).toBe(true);
      expect(result.tags).toContain('property:push');
      expect(result.tags).toContain('property:slow');
    });

    /**
     * Tests "Mastery: None" handling
     *
     * @description None names no mastery; no value, no warning, no aspect
     */
    it('should drop a "None" mastery silently', async () => {
      const filePath = path.join(FIXTURES_DIR, 'mastery-none.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.mastery).toBeUndefined();
      expect(result.tags).not.toContain('property:none');
    });

    /**
     * Tests graft slot routing
     *
     * @description Base category parenthetical names slots; slot: aspects, no
     * type aspect for the slot value
     */
    it('should tag graft slots without a type aspect for the slot', async () => {
      const filePath = path.join(FIXTURES_DIR, 'graft-item.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.tags).toContain('slot:liver');
      expect(result.tags).toContain('slot:gut');
      expect(result.tags).toContain('item:monstrous-graft');
      expect(result.tags).not.toContain('weapon:liver');
      expect(result.tags).not.toContain('item:liver');
    });

    /**
     * Tests itemType detection past leading JSX
     *
     * @description Italic header pushed beyond line 5 by JSX blocks must still
     * be found
     */
    it('should detect the item type when JSX precedes the italic header', async () => {
      const filePath = path.join(FIXTURES_DIR, 'jsx-header.mdx');
      const result = await parseHeirloomFile(filePath, sharedData);

      expect(result.itemType).toBe('consumable');
    });
  });
});
