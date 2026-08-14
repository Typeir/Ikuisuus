/**
 * @fileoverview Unit tests for EncounterStorage and HeroicAffix enum exports, values, and usage.
 * @description Verifies enum exports, storage key values, affix values, and format constraints.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/modules/encounter-planner/domain/storage/encounterStorageKeys - Encounter planner enums
 */

import { EncounterStorage, HeroicAffix } from '@/modules/encounter-planner/domain/storage/encounterStorageKeys';
import { describe, expect, it } from 'vitest';

describe('encounterPlanner', () => {
  describe('EncounterStorage enum', () => {
    describe('exports', () => {
      it('should export EncounterStorage enum', () => {
        expect(EncounterStorage).toBeDefined();
        expect(typeof EncounterStorage).toBe('object');
      });

      it('should have exactly 5 storage keys', () => {
        const keys = Object.keys(EncounterStorage);
        expect(keys).toHaveLength(5);
      });
    });

    describe('storage key values', () => {
      it('should have Encounters key with correct value', () => {
        expect(EncounterStorage.Encounters).toBe('encounter-planner-data');
      });

      it('should have ActiveEncounterId key with correct value', () => {
        expect(EncounterStorage.ActiveEncounterId).toBe(
          'encounter-planner-active-id',
        );
      });

      it('should have InProgressCombats key with correct value', () => {
        expect(EncounterStorage.InProgressCombats).toBe('in-progress-combats');
      });

      it('should have ActiveCombatId key with correct value', () => {
        expect(EncounterStorage.ActiveCombatId).toBe('active-combat-id');
      });

      it('should have SavedParties key with correct value', () => {
        expect(EncounterStorage.SavedParties).toBe('saved-parties');
      });
    });

    describe('value formats', () => {
      it('should have kebab-case storage key values', () => {
        const values = Object.values(EncounterStorage);
        values.forEach((value) => {
          expect(value).toMatch(/^[a-z]+(-[a-z]+)*$/);
        });
      });

      it('should have unique storage key values', () => {
        const values = Object.values(EncounterStorage);
        const uniqueValues = new Set(values);
        expect(uniqueValues.size).toBe(values.length);
      });
    });

    describe('localStorage compatibility', () => {
      it('should have string values usable as localStorage keys', () => {
        Object.values(EncounterStorage).forEach((value) => {
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
          expect(value).not.toContain(' ');
        });
      });

      it('should support typical localStorage operations pattern', () => {
        const testData = { test: true };
        expect(() => {
          JSON.stringify(testData);
          EncounterStorage.Encounters;
        }).not.toThrow();
      });
    });
  });

  describe('HeroicAffix enum', () => {
    describe('exports', () => {
      it('should export HeroicAffix enum', () => {
        expect(HeroicAffix).toBeDefined();
        expect(typeof HeroicAffix).toBe('object');
      });

      it('should have exactly 9 heroic affixes', () => {
        const affixes = Object.keys(HeroicAffix);
        expect(affixes).toHaveLength(9);
      });
    });

    describe('affix values', () => {
      it('should have Bloodthirsty affix', () => {
        expect(HeroicAffix.Bloodthirsty).toBe('Bloodthirsty');
      });

      it('should have Championed affix', () => {
        expect(HeroicAffix.Championed).toBe('Championed');
      });

      it('should have Crusading affix', () => {
        expect(HeroicAffix.Crusading).toBe('Crusading');
      });

      it('should have Flametongued affix', () => {
        expect(HeroicAffix.Flametongued).toBe('Flametongued');
      });

      it('should have Frostveined affix', () => {
        expect(HeroicAffix.Frostveined).toBe('Frostveined');
      });

      it('should have Psionic affix', () => {
        expect(HeroicAffix.Psionic).toBe('Psionic');
      });

      it('should have Rakish affix', () => {
        expect(HeroicAffix.Rakish).toBe('Rakish');
      });

      it('should have Stormbound affix', () => {
        expect(HeroicAffix.Stormbound).toBe('Stormbound');
      });

      it('should have Sulphurous affix', () => {
        expect(HeroicAffix.Sulphurous).toBe('Sulphurous');
      });
    });

    describe('value formats', () => {
      it('should have PascalCase display values', () => {
        Object.values(HeroicAffix).forEach((value) => {
          expect(value).toMatch(/^[A-Z][a-z]+$/);
        });
      });

      it('should have keys matching their values', () => {
        Object.entries(HeroicAffix).forEach(([key, value]) => {
          expect(key).toBe(value);
        });
      });

      it('should have unique affix values', () => {
        const values = Object.values(HeroicAffix);
        const uniqueValues = new Set(values);
        expect(uniqueValues.size).toBe(values.length);
      });
    });

    describe('usage patterns', () => {
      it('should support iteration over all affixes', () => {
        const affixes = Object.values(HeroicAffix);
        expect(affixes).toContain('Bloodthirsty');
        expect(affixes).toContain('Stormbound');
        expect(affixes.length).toBe(9);
      });

      it('should support type-safe affix assignment', () => {
        const selectedAffix: HeroicAffix = HeroicAffix.Flametongued;
        expect(selectedAffix).toBe('Flametongued');
      });

      it('should support affix arrays for multi-select scenarios', () => {
        const selectedAffixes: HeroicAffix[] = [
          HeroicAffix.Bloodthirsty,
          HeroicAffix.Psionic,
        ];
        expect(selectedAffixes).toHaveLength(2);
        expect(selectedAffixes).toContain(HeroicAffix.Bloodthirsty);
      });
    });
  });

  describe('module completeness', () => {
    it('should export both EncounterStorage and HeroicAffix', () => {
      expect(EncounterStorage).toBeDefined();
      expect(HeroicAffix).toBeDefined();
    });

    it('should have no overlapping values between enums', () => {
      const storageValues = new Set(Object.values(EncounterStorage));
      const affixValues = Object.values(HeroicAffix);

      affixValues.forEach((value) => {
        expect(storageValues.has(value as unknown as string)).toBe(false);
      });
    });
  });
});
