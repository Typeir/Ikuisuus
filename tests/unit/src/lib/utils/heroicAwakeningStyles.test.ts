/**
 * @fileoverview Unit tests for Heroic Awakening Styling Utilities
 * @module tests/unit/src/lib/utils/heroicAwakeningStyles.test
 * @description Tests for affix normalization, tier calculation, and class computation.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/utils/heroicAwakeningStyles
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeAffixToKey,
  getAwakeningTier,
  computeAwakeningClasses,
  type AffixKey,
  type AwakeningTier,
} from '@/lib/utils/heroicAwakeningStyles';
import type { HeroicAwakeningState } from '@/lib/types/inProgressCombat';

/**
 * Creates a mock HeroicAwakeningState for testing
 */
const createMockAwakeningState = (
  overrides: Partial<HeroicAwakeningState> = {}
): HeroicAwakeningState => ({
  fateDieResult: 0,
  heroicDc: 0,
  awakened: false,
  tier: 'none',
  affixes: [],
  bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
  hpOverride: null,
  ...overrides,
});

describe('heroicAwakeningStyles', () => {
  describe('normalizeAffixToKey', () => {
    it('should normalize valid affix names to lowercase keys', () => {
      const testCases: Array<[string, AffixKey]> = [
        ['Bloodthirsty', 'bloodthirsty'],
        ['Championed', 'championed'],
        ['Crusading', 'crusading'],
        ['Flametongued', 'flametongued'],
        ['Frostveined', 'frostveined'],
        ['Psionic', 'psionic'],
        ['Rakish', 'rakish'],
        ['Stormbound', 'stormbound'],
        ['Sulphurous', 'sulphurous'],
      ];

      for (const [input, expected] of testCases) {
        expect(normalizeAffixToKey(input)).toBe(expected);
      }
    });

    it('should handle case-insensitive input', () => {
      expect(normalizeAffixToKey('BLOODTHIRSTY')).toBe('bloodthirsty');
      expect(normalizeAffixToKey('stormbound')).toBe('stormbound');
      expect(normalizeAffixToKey('PsIoNiC')).toBe('psionic');
    });

    it('should trim whitespace from input', () => {
      expect(normalizeAffixToKey('  Bloodthirsty  ')).toBe('bloodthirsty');
      expect(normalizeAffixToKey('\tStormbound\n')).toBe('stormbound');
    });

    it('should return null for invalid affix names', () => {
      expect(normalizeAffixToKey('Unknown')).toBeNull();
      expect(normalizeAffixToKey('Invalid')).toBeNull();
      expect(normalizeAffixToKey('')).toBeNull();
      expect(normalizeAffixToKey('   ')).toBeNull();
    });
  });

  describe('getAwakeningTier', () => {
    it('should return null for 0 or 1 affixes', () => {
      expect(getAwakeningTier(0)).toBeNull();
      expect(getAwakeningTier(1)).toBeNull();
    });

    it('should return legendary for 2 affixes', () => {
      expect(getAwakeningTier(2)).toBe('legendary');
    });

    it('should return mythic for 3 or more affixes', () => {
      expect(getAwakeningTier(3)).toBe('mythic');
      expect(getAwakeningTier(4)).toBe('mythic');
      expect(getAwakeningTier(10)).toBe('mythic');
    });
  });

  describe('computeAwakeningClasses', () => {
    it('should return empty result when not awakened', () => {
      const state = createMockAwakeningState({ awakened: false });
      const result = computeAwakeningClasses(state);

      expect(result.isAwakened).toBe(false);
      expect(result.primaryAffix).toBeNull();
      expect(result.tier).toBeNull();
      expect(result.classNames).toEqual([]);
    });

    it('should return empty result when awakened but no affixes', () => {
      const state = createMockAwakeningState({ awakened: true, affixes: [] });
      const result = computeAwakeningClasses(state);

      expect(result.isAwakened).toBe(false);
      expect(result.classNames).toEqual([]);
    });

    it('should return base awakened class and affix class for single affix', () => {
      const state = createMockAwakeningState({
        awakened: true,
        tier: 'awakened',
        affixes: [{ text: 'Bloodthirsty' }],
      });
      const result = computeAwakeningClasses(state);

      expect(result.isAwakened).toBe(true);
      expect(result.primaryAffix).toBe('bloodthirsty');
      expect(result.tier).toBeNull();
      expect(result.classNames).toEqual(['awakened', 'awakened--bloodthirsty']);
    });

    it('should include legendary class for two affixes', () => {
      const state = createMockAwakeningState({
        awakened: true,
        tier: 'legendary',
        affixes: [{ text: 'Stormbound' }, { text: 'Psionic' }],
      });
      const result = computeAwakeningClasses(state);

      expect(result.isAwakened).toBe(true);
      expect(result.primaryAffix).toBe('stormbound');
      expect(result.tier).toBe('legendary');
      expect(result.classNames).toEqual([
        'awakened',
        'awakened--stormbound',
        'awakened--legendary',
      ]);
    });

    it('should include mythic class for three affixes', () => {
      const state = createMockAwakeningState({
        awakened: true,
        tier: 'mythic',
        affixes: [
          { text: 'Crusading' },
          { text: 'Flametongued' },
          { text: 'Frostveined' },
        ],
      });
      const result = computeAwakeningClasses(state);

      expect(result.isAwakened).toBe(true);
      expect(result.primaryAffix).toBe('crusading');
      expect(result.tier).toBe('mythic');
      expect(result.classNames).toEqual([
        'awakened',
        'awakened--crusading',
        'awakened--mythic',
      ]);
    });

    it('should use first affix for visual identity regardless of count', () => {
      const state = createMockAwakeningState({
        awakened: true,
        tier: 'mythic',
        affixes: [
          { text: 'Rakish' },
          { text: 'Championed' },
          { text: 'Sulphurous' },
        ],
      });
      const result = computeAwakeningClasses(state);

      expect(result.primaryAffix).toBe('rakish');
      expect(result.classNames).toContain('awakened--rakish');
      expect(result.classNames).not.toContain('awakened--championed');
      expect(result.classNames).not.toContain('awakened--sulphurous');
    });

    it('should handle unknown affix gracefully', () => {
      const state = createMockAwakeningState({
        awakened: true,
        tier: 'awakened',
        affixes: [{ text: 'UnknownAffix' }],
      });
      const result = computeAwakeningClasses(state);

      expect(result.isAwakened).toBe(true);
      expect(result.primaryAffix).toBeNull();
      expect(result.classNames).toEqual(['awakened']);
    });

    it('should handle all valid affixes', () => {
      const validAffixes = [
        'Bloodthirsty',
        'Championed',
        'Crusading',
        'Flametongued',
        'Frostveined',
        'Psionic',
        'Rakish',
        'Stormbound',
        'Sulphurous',
      ];

      for (const affix of validAffixes) {
        const state = createMockAwakeningState({
          awakened: true,
          tier: 'awakened',
          affixes: [{ text: affix }],
        });
        const result = computeAwakeningClasses(state);
        const expectedKey = affix.toLowerCase();

        expect(result.primaryAffix).toBe(expectedKey);
        expect(result.classNames).toContain(`awakened--${expectedKey}`);
      }
    });
  });
});
