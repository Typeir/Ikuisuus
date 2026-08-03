/**
 * @fileoverview Aspect Vocabulary Tests
 * @description Guards the closed aspect vocabulary in `shared-data.json` and the
 * helpers that read it. The vocabulary is the thing a health check validates
 * content against, so a mistake here silently weakens every downstream check.
 *
 * @module tests/unit/scripts/metadata/aspects
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 */

import {
  aspectGroupAppliesTo,
  isInternalAspect,
  loadSharedData,
  parseAspect,
  resolveAspectValues,
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

  describe('resolveAspectValues', () => {
    it('should return literal values', () => {
      expect(resolveAspectValues(sharedData, 'phase')).toEqual([
        'wounded',
        'bloodied',
        'doomed',
        'slain',
      ]);
    });

    it('should borrow values from another shared-data section', () => {
      expect(resolveAspectValues(sharedData, 'condition')).toEqual(
        sharedData.gameData.conditions,
      );
    });

    it('should merge a sibling group with a borrowed section', () => {
      const immunity = resolveAspectValues(sharedData, 'immunity');

      expect(immunity).toContain('fire');
      expect(immunity).toContain('frightened');
    });

    /**
     * References resolve one level and must never chain, because a chain makes
     * resolution order significant and lets a group silently resolve to nothing.
     */
    it('should not require chained resolution', () => {
      const chained: string[] = [];
      for (const [name, group] of Object.entries(sharedData.aspects)) {
        for (const reference of group.valuesFrom ?? []) {
          if (reference.includes('.')) continue;
          const target = sharedData.aspects[reference];
          if (target && !target.values) chained.push(`${name} -> ${reference}`);
        }
      }

      expect(chained).toEqual([]);
    });

    it('should resolve every group to at least one value unless open', () => {
      const barren = Object.keys(sharedData.aspects).filter(
        (name) =>
          !sharedData.aspects[name].open &&
          resolveAspectValues(sharedData, name).length === 0,
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
      expect(aspectGroupAppliesTo(sharedData, 'creaturetype', 'monsters')).toBe(
        true,
      );
      expect(aspectGroupAppliesTo(sharedData, 'creaturetype', 'spells')).toBe(
        false,
      );
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
