/**
 * @fileoverview Unit tests for Combat Mechanics Utilities
 * @description Tests heroic awakening system, fate die rolling, affix generation,
 * tier resolution, and mechanics flag parsing.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/utils/combatMechanics - Combat mechanics utilities
 */

import type { InProgressCombatant } from '@/lib/types/inProgressCombat';
import {
    applyHeroicAwakening,
    forceHeroicAwakening,
    generateUniqueAffixes,
    getDefaultDeedCount,
    getDefaultResistCount,
    getHeroicDc,
    parseMechanicsFromTags,
} from '@/lib/utils/combatMechanics';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Create a minimal InProgressCombatant for testing
 *
 * @param {Partial<InProgressCombatant>} overrides - Properties to override
 * @returns {InProgressCombatant} Test combatant
 */
const createTestCombatant = (
  overrides: Partial<InProgressCombatant> = {},
): InProgressCombatant => ({
  id: 'test-id',
  name: 'Test Creature',
  hpCurrent: 100,
  hpMax: 100,
  hpMaxOverride: null,
  tempHp: null,
  ac: 15,
  stats: { str: 16, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
  conditions: [],
  initiativeValue: null,
  initiativeBonus: 2,
  proficiencyBonus: 3,
  proficiencyBonusOverride: null,
  speed: '30 ft.',
  hpFormula: '10d10+30',
  details: { buffs: [], items: [], spells: [], affixes: [] },
  slain: false,
  sessionOnly: false,
  crText: 'CR 5',
  heroicAwakening: {
    fateDieResult: 0,
    heroicDc: 0,
    awakened: false,
    tier: 'none',
    affixes: [],
    bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
    hpOverride: null,
  },
  mechanics: {
    lair: false,
    stratagem: false,
    legendaryDeed: false,
    resist: false,
    phase: false,
  },
  legendaryDeedsUsed: [],
  resistRemaining: 0,
  phaseDeeds: { wounded: false, bloodied: false, doomed: false },
  ...overrides,
});

describe('combatMechanics', () => {
  describe('getHeroicDc', () => {
    it('should return 15 for CR 1-5', () => {
      expect(getHeroicDc(1)).toBe(15);
      expect(getHeroicDc(5)).toBe(15);
    });

    it('should return 16 for CR 6-10', () => {
      expect(getHeroicDc(6)).toBe(16);
      expect(getHeroicDc(10)).toBe(16);
    });

    it('should return 17 for CR 11-15', () => {
      expect(getHeroicDc(11)).toBe(17);
      expect(getHeroicDc(15)).toBe(17);
    });

    it('should return 18 for CR 16-20', () => {
      expect(getHeroicDc(16)).toBe(18);
      expect(getHeroicDc(20)).toBe(18);
    });

    it('should return 19 for CR above 20', () => {
      expect(getHeroicDc(21)).toBe(19);
      expect(getHeroicDc(30)).toBe(19);
    });

    it('should accept string CR values', () => {
      expect(getHeroicDc('5')).toBe(15);
      expect(getHeroicDc('15')).toBe(17);
    });
  });

  describe('parseMechanicsFromTags', () => {
    it('should parse all mechanic tags correctly', () => {
      const tags = [
        'mechanic:lair',
        'mechanic:stratagem',
        'mechanic:legendary-deed',
        'mechanic:resist',
        'mechanic:phase',
      ];
      const result = parseMechanicsFromTags(tags);
      expect(result).toEqual({
        lair: true,
        stratagem: true,
        legendaryDeed: true,
        resist: true,
        phase: true,
      });
    });

    it('should return all false for empty tags', () => {
      const result = parseMechanicsFromTags([]);
      expect(result).toEqual({
        lair: false,
        stratagem: false,
        legendaryDeed: false,
        resist: false,
        phase: false,
      });
    });

    it('should return all false for undefined tags', () => {
      const result = parseMechanicsFromTags(undefined);
      expect(result).toEqual({
        lair: false,
        stratagem: false,
        legendaryDeed: false,
        resist: false,
        phase: false,
      });
    });

    it('should handle partial mechanic tags', () => {
      const result = parseMechanicsFromTags(['mechanic:lair', 'other-tag']);
      expect(result.lair).toBe(true);
      expect(result.stratagem).toBe(false);
    });

    it('should handle non-array input', () => {
      const result = parseMechanicsFromTags('not-an-array' as any);
      expect(result.lair).toBe(false);
    });
  });

  describe('getDefaultResistCount', () => {
    it('should return 3', () => {
      expect(getDefaultResistCount()).toBe(3);
      expect(getDefaultResistCount('CR 5')).toBe(3);
    });
  });

  describe('getDefaultDeedCount', () => {
    it('should return 3', () => {
      expect(getDefaultDeedCount()).toBe(3);
      expect(getDefaultDeedCount('CR 10')).toBe(3);
    });
  });

  describe('generateUniqueAffixes', () => {
    it('should generate the requested number of affixes', () => {
      const affixes = generateUniqueAffixes(3);
      expect(affixes).toHaveLength(3);
    });

    it('should generate unique affix names', () => {
      const affixes = generateUniqueAffixes(5);
      const names = new Set(affixes.map((a) => a.text));
      expect(names.size).toBe(5);
    });

    it('should include source slugs and hrefs', () => {
      const affixes = generateUniqueAffixes(1);
      expect(affixes[0].source?.slug).toBeTruthy();
      expect(affixes[0].source?.href).toContain(
        '/en/library/rules/heroic-awakening/',
      );
    });

    it('should use locale in href', () => {
      const affixes = generateUniqueAffixes(1, 'fi');
      expect(affixes[0].source?.href).toContain('/fi/');
    });

    it('should generate zero affixes for count 0', () => {
      const affixes = generateUniqueAffixes(0);
      expect(affixes).toHaveLength(0);
    });
  });

  describe('applyHeroicAwakening', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should set tier to none when crText is missing', () => {
      const combatant = createTestCombatant({ crText: undefined });
      applyHeroicAwakening(combatant, undefined);
      expect(combatant.heroicAwakening.tier).toBe('none');
    });

    it('should set awakened false when fate die roll is below heroicDc', () => {
      vi.mocked(Math.random).mockReturnValueOnce(0.01);
      const combatant = createTestCombatant();
      applyHeroicAwakening(combatant, 'CR 5');
      expect(combatant.heroicAwakening.awakened).toBe(false);
      expect(combatant.heroicAwakening.tier).toBe('none');
    });

    it('should calculate heroicDc based on CR', () => {
      vi.mocked(Math.random).mockReturnValueOnce(0.01);
      const combatant = createTestCombatant();
      applyHeroicAwakening(combatant, 'CR 15');
      expect(combatant.heroicAwakening.heroicDc).toBe(17);
    });

    it('should set awakened true when fate die meets DC', () => {
      vi.mocked(Math.random).mockReturnValueOnce(0.99).mockReturnValue(0.01);
      const combatant = createTestCombatant();
      applyHeroicAwakening(combatant, 'CR 5');
      expect(combatant.heroicAwakening.awakened).toBe(true);
    });

    it('should maximize hit dice when awakened', () => {
      vi.mocked(Math.random).mockReturnValueOnce(0.99).mockReturnValue(0.01);
      const combatant = createTestCombatant({ hpFormula: '10d10+30' });
      applyHeroicAwakening(combatant, 'CR 5');
      expect(combatant.hpMaxOverride).toBeGreaterThan(0);
      expect(combatant.hpCurrent).toBe(combatant.hpMaxOverride);
    });

    it('should apply AC bonus when awakened', () => {
      vi.mocked(Math.random).mockReturnValueOnce(0.99).mockReturnValue(0.01);
      const combatant = createTestCombatant({ ac: 15 });
      const originalAc = combatant.ac;
      applyHeroicAwakening(combatant, 'CR 5');
      expect(combatant.ac).toBeGreaterThan(originalAc);
    });

    it('should apply proficiency bonus override when awakened', () => {
      vi.mocked(Math.random).mockReturnValueOnce(0.99).mockReturnValue(0.01);
      const combatant = createTestCombatant({ proficiencyBonus: 3 });
      applyHeroicAwakening(combatant, 'CR 5');
      expect(combatant.proficiencyBonusOverride).toBeGreaterThan(3);
    });

    it('should not set proficiency override if proficiencyBonus is null', () => {
      vi.mocked(Math.random).mockReturnValueOnce(0.99).mockReturnValue(0.01);
      const combatant = createTestCombatant({ proficiencyBonus: null });
      applyHeroicAwakening(combatant, 'CR 5');
      expect(combatant.proficiencyBonusOverride).toBeNull();
    });

    it('should generate affixes when awakened', () => {
      vi.mocked(Math.random).mockReturnValueOnce(0.99).mockReturnValue(0.01);
      const combatant = createTestCombatant();
      applyHeroicAwakening(combatant, 'CR 5');
      expect(combatant.heroicAwakening.affixes.length).toBeGreaterThanOrEqual(
        1,
      );
    });

    it('should handle CR text without number gracefully', () => {
      vi.mocked(Math.random).mockReturnValueOnce(0.01);
      const combatant = createTestCombatant();
      applyHeroicAwakening(combatant, 'CR ???');
      expect(combatant.heroicAwakening.heroicDc).toBe(15);
    });

    it('should maximize HP using percentage approach when no hpFormula', () => {
      vi.mocked(Math.random).mockReturnValueOnce(0.99).mockReturnValue(0.01);
      const combatant = createTestCombatant({ hpFormula: null, hpMax: 50 });
      applyHeroicAwakening(combatant, 'CR 5');
      expect(combatant.hpMaxOverride).toBeGreaterThanOrEqual(50);
    });

    it('should apply HP bonus from proficiency when hpMaxOverride exists', () => {
      vi.mocked(Math.random).mockReturnValueOnce(0.99).mockReturnValue(0.01);
      const combatant = createTestCombatant({
        hpFormula: '10d10+30',
        proficiencyBonus: 3,
      });
      applyHeroicAwakening(combatant, 'CR 5');
      expect(combatant.hpCurrent).toBe(combatant.hpMaxOverride);
    });
  });

  describe('forceHeroicAwakening', () => {
    it('should set tier to awakened', () => {
      const combatant = createTestCombatant();
      forceHeroicAwakening(combatant, 'awakened');
      expect(combatant.heroicAwakening.tier).toBe('awakened');
      expect(combatant.heroicAwakening.awakened).toBe(true);
    });

    it('should set tier to legendary', () => {
      const combatant = createTestCombatant();
      forceHeroicAwakening(combatant, 'legendary');
      expect(combatant.heroicAwakening.tier).toBe('legendary');
    });

    it('should set tier to mythic', () => {
      const combatant = createTestCombatant();
      forceHeroicAwakening(combatant, 'mythic');
      expect(combatant.heroicAwakening.tier).toBe('mythic');
    });

    it('should apply AC bonus matching tier multiplier', () => {
      const combatant = createTestCombatant({ ac: 15 });
      forceHeroicAwakening(combatant, 'awakened');
      expect(combatant.ac).toBe(16);
    });

    it('should apply double AC bonus for legendary', () => {
      const combatant = createTestCombatant({ ac: 15 });
      forceHeroicAwakening(combatant, 'legendary');
      expect(combatant.ac).toBe(17);
    });

    it('should apply triple AC bonus for mythic', () => {
      const combatant = createTestCombatant({ ac: 15 });
      forceHeroicAwakening(combatant, 'mythic');
      expect(combatant.ac).toBe(18);
    });

    it('should undo previous awakening bonuses before applying new ones', () => {
      const combatant = createTestCombatant({ ac: 15 });
      forceHeroicAwakening(combatant, 'awakened');
      expect(combatant.ac).toBe(16);
      forceHeroicAwakening(combatant, 'mythic');
      expect(combatant.ac).toBe(18);
    });

    it('should set proficiency override when proficiencyBonus exists', () => {
      const combatant = createTestCombatant({ proficiencyBonus: 3 });
      forceHeroicAwakening(combatant, 'legendary');
      expect(combatant.proficiencyBonusOverride).toBe(5);
    });

    it('should generate correct number of affixes per tier', () => {
      const combatant = createTestCombatant();
      forceHeroicAwakening(combatant, 'awakened');
      expect(combatant.heroicAwakening.affixes).toHaveLength(1);

      forceHeroicAwakening(combatant, 'legendary');
      expect(combatant.heroicAwakening.affixes).toHaveLength(2);

      forceHeroicAwakening(combatant, 'mythic');
      expect(combatant.heroicAwakening.affixes).toHaveLength(3);
    });

    it('should not apply if crText is missing', () => {
      const combatant = createTestCombatant({ crText: undefined });
      forceHeroicAwakening(combatant, 'legendary');
      expect(combatant.heroicAwakening.tier).toBe('none');
    });

    it('should maximize hit dice when hpFormula exists', () => {
      const combatant = createTestCombatant({ hpFormula: '5d8+10', hpMax: 50 });
      forceHeroicAwakening(combatant, 'awakened');
      expect(combatant.hpCurrent).toBeGreaterThan(0);
    });

    it('should set HP to max of hpMaxOverride and hpMax', () => {
      const combatant = createTestCombatant({ hpMax: 100, hpMaxOverride: 50 });
      forceHeroicAwakening(combatant, 'awakened');
      expect(combatant.hpCurrent).toBeGreaterThanOrEqual(100);
    });

    it('should set fate die result to simulated values per tier', () => {
      const combatant = createTestCombatant();
      forceHeroicAwakening(combatant, 'awakened');
      expect(combatant.heroicAwakening.fateDieResult).toBe(10);

      forceHeroicAwakening(combatant, 'legendary');
      expect(combatant.heroicAwakening.fateDieResult).toBe(15);

      forceHeroicAwakening(combatant, 'mythic');
      expect(combatant.heroicAwakening.fateDieResult).toBe(20);
    });

    it('should undo proficiency override from previous tier', () => {
      const combatant = createTestCombatant({ proficiencyBonus: 3 });
      forceHeroicAwakening(combatant, 'awakened');
      expect(combatant.proficiencyBonusOverride).toBe(4);

      forceHeroicAwakening(combatant, 'mythic');
      expect(combatant.proficiencyBonusOverride).toBe(6);
    });
  });
});
