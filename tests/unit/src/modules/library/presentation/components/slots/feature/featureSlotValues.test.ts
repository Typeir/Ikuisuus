/**
 * @fileoverview Unit tests for the feature block slot vocabulary.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/feature/featureSlotValues.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-12
 */

import { describe, expect, it } from 'vitest';
import {
  ATTACK_SLOT_NAMES,
  FEATURE_SLOT_NAMES,
  POOL_SLOT_NAMES,
} from '@/modules/library/domain/slots';
import {
  constructed,
  DEED_TYPES,
  HEADING_TAGS,
  SLOT_NAMES_BY_KIND,
} from '@/modules/library/presentation/components/slots/feature/featureSlotValues';

/**
 * Translator that reports the key and the values it was handed.
 *
 * @param {string} key - Translation key
 * @param {Record<string, string>} [values] - Interpolated values
 * @returns {string} Key, followed by the values when there are any
 */
const t = (key: string, values?: Record<string, string>): string =>
  values === undefined ? key : `${key}:${Object.values(values).join(',')}`;

describe('SLOT_NAMES_BY_KIND', () => {
  it('gives the prose kinds the feature slots', () => {
    expect(SLOT_NAMES_BY_KIND.feature).toBe(FEATURE_SLOT_NAMES);
    expect(SLOT_NAMES_BY_KIND.trait).toBe(FEATURE_SLOT_NAMES);
    expect(SLOT_NAMES_BY_KIND.curse).toBe(FEATURE_SLOT_NAMES);
    expect(SLOT_NAMES_BY_KIND.action).toBe(FEATURE_SLOT_NAMES);
  });

  it('gives pools and attacks their own slots', () => {
    expect(SLOT_NAMES_BY_KIND.pool).toBe(POOL_SLOT_NAMES);
    expect(SLOT_NAMES_BY_KIND.attack).toBe(ATTACK_SLOT_NAMES);
  });
});

describe('HEADING_TAGS', () => {
  it('indexes a host tag by heading level', () => {
    expect(HEADING_TAGS[1]).toBe('h1');
    expect(HEADING_TAGS[4]).toBe('h4');
    expect(HEADING_TAGS[6]).toBe('h6');
  });

  it('holds no tag at level zero', () => {
    expect(HEADING_TAGS[0]).toBeNull();
  });
});

describe('constructed', () => {
  it('names the kind a mastery slot writes', () => {
    expect(constructed('mastery', 'Longsword', t)).toBe(
      'feature.masteryWith:Longsword',
    );
  });

  it('falls back to any mastery when the slot is empty', () => {
    expect(constructed('mastery', '  ', t)).toBe('feature.masteryAny');
  });

  it('writes a level slot as a level', () => {
    expect(constructed('level', '3', t)).toBe('feature.level:3');
  });

  it('writes each deed type the card knows', () => {
    for (const type of DEED_TYPES) {
      expect(constructed('deed', type.toUpperCase(), t)).toBe(
        `feature.deed.${type}`,
      );
    }
  });

  it('keeps a deed value it does not know', () => {
    expect(constructed('deed', 'reverie', t)).toBe('reverie');
  });

  it('keeps every other slot as authored', () => {
    expect(constructed('targets', 'one creature', t)).toBe('one creature');
  });
});
