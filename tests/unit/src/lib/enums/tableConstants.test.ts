/**
 * @fileoverview Table Constants Unit Tests
 * @description Tests for table sorting order constants and display labels used
 * across metadata tables (MonsterTable, HeirloomTable, SpellTable, TrinketTable).
 *
 * @module tests/unit/lib/enums/tableConstants
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/enums/tableConstants Constants under test
 */

import { describe, it, expect } from 'vitest';
import {
  RARITY_SORT_ORDER,
  SIZE_SORT_ORDER,
  DEFAULT_SPELL_LEVEL_LABELS,
} from '@/lib/enums/tableConstants';

describe('RARITY_SORT_ORDER', () => {
  describe('structure', () => {
    it('should be defined', () => {
      expect(RARITY_SORT_ORDER).toBeDefined();
    });

    it('should have all expected rarities', () => {
      const expectedRarities = [
        'nonmagical',
        'common',
        'uncommon',
        'rare',
        'very rare',
        'legendary',
        'artifact',
        'mythic artifact',
        'mythic',
        'unique',
      ];
      expectedRarities.forEach((rarity) => {
        expect(RARITY_SORT_ORDER).toHaveProperty(rarity);
      });
    });
  });

  describe('sort order', () => {
    it('should have nonmagical as lowest', () => {
      expect(RARITY_SORT_ORDER['nonmagical']).toBe(0);
    });

    it('should order common rarities correctly', () => {
      expect(RARITY_SORT_ORDER['common']).toBeLessThan(RARITY_SORT_ORDER['uncommon']);
      expect(RARITY_SORT_ORDER['uncommon']).toBeLessThan(RARITY_SORT_ORDER['rare']);
      expect(RARITY_SORT_ORDER['rare']).toBeLessThan(RARITY_SORT_ORDER['very rare']);
      expect(RARITY_SORT_ORDER['very rare']).toBeLessThan(RARITY_SORT_ORDER['legendary']);
    });

    it('should order high rarities correctly', () => {
      expect(RARITY_SORT_ORDER['legendary']).toBeLessThan(RARITY_SORT_ORDER['artifact']);
      expect(RARITY_SORT_ORDER['artifact']).toBeLessThan(RARITY_SORT_ORDER['mythic artifact']);
      expect(RARITY_SORT_ORDER['mythic artifact']).toBeLessThan(RARITY_SORT_ORDER['mythic']);
      expect(RARITY_SORT_ORDER['mythic']).toBeLessThan(RARITY_SORT_ORDER['unique']);
    });

    it('should have unique as highest', () => {
      const maxOrder = Math.max(...Object.values(RARITY_SORT_ORDER));
      expect(RARITY_SORT_ORDER['unique']).toBe(maxOrder);
    });

    it('should have all positive or zero values', () => {
      Object.values(RARITY_SORT_ORDER).forEach((order) => {
        expect(order).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have consecutive order values', () => {
      const values = Object.values(RARITY_SORT_ORDER).sort((a, b) => a - b);
      for (let i = 0; i < values.length; i++) {
        expect(values[i]).toBe(i);
      }
    });
  });

  describe('usage', () => {
    it('should allow sorting items by rarity', () => {
      const items = [
        { rarity: 'legendary' },
        { rarity: 'common' },
        { rarity: 'rare' },
      ];
      const sorted = [...items].sort(
        (a, b) => RARITY_SORT_ORDER[a.rarity] - RARITY_SORT_ORDER[b.rarity]
      );
      expect(sorted[0].rarity).toBe('common');
      expect(sorted[1].rarity).toBe('rare');
      expect(sorted[2].rarity).toBe('legendary');
    });
  });
});

describe('SIZE_SORT_ORDER', () => {
  describe('structure', () => {
    it('should be defined', () => {
      expect(SIZE_SORT_ORDER).toBeDefined();
    });

    it('should have all D&D sizes plus extended sizes', () => {
      const expectedSizes = [
        'tiny',
        'small',
        'medium',
        'large',
        'huge',
        'gargantuan',
        'colossal',
        'titanic',
      ];
      expectedSizes.forEach((size) => {
        expect(SIZE_SORT_ORDER).toHaveProperty(size);
      });
    });
  });

  describe('sort order', () => {
    it('should have tiny as smallest', () => {
      expect(SIZE_SORT_ORDER['tiny']).toBe(0);
    });

    it('should order standard D&D sizes correctly', () => {
      expect(SIZE_SORT_ORDER['tiny']).toBeLessThan(SIZE_SORT_ORDER['small']);
      expect(SIZE_SORT_ORDER['small']).toBeLessThan(SIZE_SORT_ORDER['medium']);
      expect(SIZE_SORT_ORDER['medium']).toBeLessThan(SIZE_SORT_ORDER['large']);
      expect(SIZE_SORT_ORDER['large']).toBeLessThan(SIZE_SORT_ORDER['huge']);
      expect(SIZE_SORT_ORDER['huge']).toBeLessThan(SIZE_SORT_ORDER['gargantuan']);
    });

    it('should order extended sizes correctly', () => {
      expect(SIZE_SORT_ORDER['gargantuan']).toBeLessThan(SIZE_SORT_ORDER['colossal']);
      expect(SIZE_SORT_ORDER['colossal']).toBeLessThan(SIZE_SORT_ORDER['titanic']);
    });

    it('should have titanic as largest', () => {
      const maxOrder = Math.max(...Object.values(SIZE_SORT_ORDER));
      expect(SIZE_SORT_ORDER['titanic']).toBe(maxOrder);
    });

    it('should have consecutive order values', () => {
      const values = Object.values(SIZE_SORT_ORDER).sort((a, b) => a - b);
      for (let i = 0; i < values.length; i++) {
        expect(values[i]).toBe(i);
      }
    });
  });

  describe('usage', () => {
    it('should allow sorting creatures by size', () => {
      const creatures = [
        { size: 'huge' },
        { size: 'tiny' },
        { size: 'medium' },
      ];
      const sorted = [...creatures].sort(
        (a, b) => SIZE_SORT_ORDER[a.size] - SIZE_SORT_ORDER[b.size]
      );
      expect(sorted[0].size).toBe('tiny');
      expect(sorted[1].size).toBe('medium');
      expect(sorted[2].size).toBe('huge');
    });
  });
});

describe('DEFAULT_SPELL_LEVEL_LABELS', () => {
  describe('structure', () => {
    it('should be defined', () => {
      expect(DEFAULT_SPELL_LEVEL_LABELS).toBeDefined();
    });

    it('should have labels for cantrips through 12th level', () => {
      for (let level = 0; level <= 12; level++) {
        expect(DEFAULT_SPELL_LEVEL_LABELS).toHaveProperty(level.toString());
      }
    });

    it('should have 13 level entries', () => {
      expect(Object.keys(DEFAULT_SPELL_LEVEL_LABELS).length).toBe(13);
    });
  });

  describe('label format', () => {
    it('should label level 0 as Cantrip', () => {
      expect(DEFAULT_SPELL_LEVEL_LABELS[0]).toBe('Cantrip');
    });

    it('should use ordinal suffixes for levels 1-3', () => {
      expect(DEFAULT_SPELL_LEVEL_LABELS[1]).toBe('1st Level');
      expect(DEFAULT_SPELL_LEVEL_LABELS[2]).toBe('2nd Level');
      expect(DEFAULT_SPELL_LEVEL_LABELS[3]).toBe('3rd Level');
    });

    it('should use th suffix for levels 4-12', () => {
      for (let level = 4; level <= 12; level++) {
        expect(DEFAULT_SPELL_LEVEL_LABELS[level]).toBe(`${level}th Level`);
      }
    });
  });

  describe('usage', () => {
    it('should provide display labels for spell level tabs', () => {
      const spellLevel = 5;
      const label = DEFAULT_SPELL_LEVEL_LABELS[spellLevel];
      expect(label).toBe('5th Level');
    });

    it('should handle cantrip lookup', () => {
      const label = DEFAULT_SPELL_LEVEL_LABELS[0];
      expect(label).toBe('Cantrip');
    });
  });
});
