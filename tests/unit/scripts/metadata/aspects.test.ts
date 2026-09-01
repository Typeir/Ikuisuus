/**
 * @fileoverview Aspect Vocabulary Tests
 * @description Tests the aspect vocabulary in `shared-data.json` and its reader helpers.
 *
 * @module tests/unit/scripts/metadata/aspects.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 */

import { resolveAspectVocabulary } from '@/lib/metadata/aspectVocabulary';
import {
  aspectGroupAppliesTo,
  isInternalAspect,
  loadSharedData,
  parseAspect,
  type SharedData,
} from '@scripts/metadata/sharedData';
import { beforeAll, describe, expect, it } from 'vitest';

describe('aspect vocabulary', () => {
  let sharedData: SharedData;

  beforeAll(async () => {
    sharedData = await loadSharedData();
  });

  describe('shape', () => {
    it('should declare a scope for every group', () => {
      const missing = Object.entries(sharedData.aspects)
        .filter(([, group]) => group.scope === undefined)
        .map(([name]) => name);

      expect(missing).toEqual([]);
    });

    it('should give every group either values, a reference, or an open flag', () => {
      const empty = Object.entries(sharedData.aspects)
        .filter(
          ([, group]) => !group.values && !group.valuesFrom && !group.open,
        )
        .map(([name]) => name);

      expect(empty).toEqual([]);
    });

    it('should not use uppercase or spaces in any value', () => {
      const malformed: string[] = [];
      for (const [name, group] of Object.entries(sharedData.aspects)) {
        for (const value of group.values ?? []) {
          if (value !== value.toLowerCase() || /\s/.test(value)) {
            malformed.push(`${name}:${value}`);
          }
        }
      }

      expect(malformed).toEqual([]);
    });
  });

  describe('resolveAspectVocabulary over shared-data', () => {
    it('should resolve borrowed sections and sibling groups into values', () => {
      const groups = resolveAspectVocabulary(sharedData as never);
      const immunity = groups.find((row) => row.group === 'immunity');

      expect(immunity?.values).toContain('fire');
      expect(immunity?.values).toContain('frightened');
    });

    it('should kebab-case borrowed values', () => {
      const groups = resolveAspectVocabulary(sharedData as never);
      const rarity = groups.find((row) => row.group === 'rarity');

      expect(sharedData.itemData.rarities).toContain('mythic artifact');
      expect(rarity?.values).toContain('mythic-artifact');
      expect(rarity?.values).not.toContain('mythic artifact');
    });

    it('should resolve every closed group to at least one value', () => {
      const groups = resolveAspectVocabulary(sharedData as never);
      const resolved = new Set(groups.map((row) => row.group));
      const barren = Object.keys(sharedData.aspects).filter(
        (name) =>
          !name.startsWith('meta:') &&
          !sharedData.aspects[name].open &&
          !resolved.has(name),
      );

      expect(barren).toEqual([]);
    });
  });

  describe('parseAspect', () => {
    it('should split a plain aspect on its colon', () => {
      expect(parseAspect('damage:fire')).toEqual({
        group: 'damage',
        value: 'fire',
      });
    });

    it('should split an internal aspect on the last colon', () => {
      expect(parseAspect('meta:source:official')).toEqual({
        group: 'meta:source',
        value: 'official',
      });
    });

    it('should reject tokens without a usable colon', () => {
      expect(parseAspect('damage')).toBeNull();
      expect(parseAspect('damage:')).toBeNull();
      expect(parseAspect(':fire')).toBeNull();
    });
  });

  describe('scope', () => {
    it('should apply a universal group to any content type', () => {
      expect(aspectGroupAppliesTo(sharedData, 'damage', 'spells')).toBe(true);
      expect(aspectGroupAppliesTo(sharedData, 'damage', 'monsters')).toBe(true);
    });

    it('should confine a scoped group to its listed content types', () => {
      expect(aspectGroupAppliesTo(sharedData, 'creature', 'monsters')).toBe(
        true,
      );
      expect(aspectGroupAppliesTo(sharedData, 'creature', 'spells')).toBe(false);
    });

    it('should reject an unknown group', () => {
      expect(aspectGroupAppliesTo(sharedData, 'nonsense', 'spells')).toBe(false);
    });
  });

  describe('internal aspects', () => {
    it('should treat meta-prefixed aspects as internal', () => {
      expect(isInternalAspect('meta:source:official')).toBe(true);
      expect(isInternalAspect('damage:fire')).toBe(false);
    });

    it('should scope every internal group like any other', () => {
      const internal = Object.keys(sharedData.aspects).filter((name) =>
        name.startsWith('meta:'),
      );

      expect(internal.length).toBeGreaterThan(0);
      for (const name of internal) {
        expect(sharedData.aspects[name].scope).toBeDefined();
      }
    });
  });
});
