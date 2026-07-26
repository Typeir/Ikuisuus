/**
 * @fileoverview Character Derivation Tests
 * @description Unit tests for {@link getTotalCharacterLevel} and
 * {@link getCharacterDerived}.
 *
 * @module tests/unit/src/lib/utils/characterDerivation
 * @version 1.0.0
 * @author Typeir
 * @since 5.0.0
 */

import type { CharacterSheet, VocationEntry } from '@/lib/types/character';
import {
  getCharacterDerived,
  getTotalCharacterLevel,
} from '@/modules/character-builder/lib/utils/characterDerivation';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import {
  MAX_XP_LEVEL,
  XP_THRESHOLDS,
  getXPForLevel,
} from '@/modules/character-builder/lib/utils/xpProgression';
import { describe, expect, it } from 'vitest';

const voc = (over: Partial<VocationEntry> = {}): VocationEntry => ({
  slug: 'wizard',
  title: 'Wizard',
  level: 1,
  specializationSlug: null,
  specializationTitle: '',
  vocationFeatures: [],
  specializationFeatures: [],
  ...over,
});

const sheet = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...createEmptyCharacter(),
  ...over,
});

describe('getTotalCharacterLevel', () => {
  it('falls back to character.level when experience is 0', () => {
    expect(getTotalCharacterLevel(sheet({ level: 5, experience: 0 }))).toBe(5);
  });

  it('returns at least 1 when fallback level is missing', () => {
    expect(
      getTotalCharacterLevel(
        sheet({ level: 0 as unknown as number, experience: 0 }),
      ),
    ).toBe(1);
  });

  it('derives level from experience when experience > 0', () => {
    expect(
      getTotalCharacterLevel(sheet({ level: 1, experience: XP_THRESHOLDS[5] })),
    ).toBe(5);
  });

  it('derives from XP when XP already covers the vocation sum', () => {
    expect(
      getTotalCharacterLevel(
        sheet({
          level: 1,
          experience: XP_THRESHOLDS[3],
          vocations: [voc({ slug: 'wizard', level: 3 })],
        }),
      ),
    ).toBe(3);
  });

  it('treats the vocation sum as a floor for un-normalized input', () => {
    expect(
      getTotalCharacterLevel(
        sheet({
          level: 1,
          experience: XP_THRESHOLDS[3],
          vocations: [voc({ slug: 'wizard', level: 8 })],
        }),
      ),
    ).toBe(8);
  });

  it('ignores the stored level cache once experience or vocations exist', () => {
    expect(
      getTotalCharacterLevel(
        sheet({
          level: 20,
          experience: XP_THRESHOLDS[3],
          vocations: [voc({ slug: 'wizard', level: 3 })],
        }),
      ),
    ).toBe(3);
  });

  it('caps total level at MAX_XP_LEVEL', () => {
    expect(
      getTotalCharacterLevel(
        sheet({ level: 1, experience: XP_THRESHOLDS[MAX_XP_LEVEL] + 1_000_000 }),
      ),
    ).toBe(MAX_XP_LEVEL);
  });
});

describe('getCharacterDerived', () => {
  it('returns experience verbatim without floor-clamping', () => {
    const d = getCharacterDerived(
      sheet({
        level: 1,
        experience: 1234,
        vocations: [voc({ slug: 'wizard', level: 5 })],
      }),
    );
    expect(d.experience).toBe(1234);
  });

  it('derives totalLevel from XP not from vocation sum', () => {
    const d = getCharacterDerived(
      sheet({
        level: 1,
        experience: XP_THRESHOLDS[7],
        vocations: [voc({ slug: 'wizard', level: 2 })],
      }),
    );
    expect(d.totalLevel).toBe(7);
    expect(d.vocationLevel).toBe(2);
  });

  it('reports unassignedLevels as totalLevel - vocationLevel', () => {
    const d = getCharacterDerived(
      sheet({
        level: 1,
        experience: XP_THRESHOLDS[5],
        vocations: [voc({ slug: 'wizard', level: 2 })],
      }),
    );
    expect(d.unassignedLevels).toBe(3);
    expect(d.hasUnassignedLevels).toBe(true);
  });

  it('reports unassignedLevels=0 when vocations sum >= totalLevel', () => {
    const d = getCharacterDerived(
      sheet({
        level: 1,
        experience: XP_THRESHOLDS[3],
        vocations: [voc({ slug: 'wizard', level: 3 })],
      }),
    );
    expect(d.unassignedLevels).toBe(0);
    expect(d.hasUnassignedLevels).toBe(false);
  });

  it('treats empty-slug vocations as 0 contribution', () => {
    const d = getCharacterDerived(
      sheet({
        level: 1,
        experience: XP_THRESHOLDS[2],
        vocations: [voc({ slug: '', level: 5 })],
      }),
    );
    expect(d.vocationLevel).toBe(0);
    expect(d.unassignedLevels).toBe(2);
  });

  it('caps progress at 100% when at MAX_XP_LEVEL', () => {
    const d = getCharacterDerived(
      sheet({
        level: MAX_XP_LEVEL,
        experience: XP_THRESHOLDS[MAX_XP_LEVEL],
      }),
    );
    expect(d.totalLevel).toBe(MAX_XP_LEVEL);
    expect(d.xpProgressPercent).toBe(100);
  });

  it('computes mid-level xpProgressPercent correctly', () => {
    const floor = getXPForLevel(3);
    const ceiling = getXPForLevel(4);
    const midway = floor + Math.floor((ceiling - floor) / 2);
    const d = getCharacterDerived(sheet({ level: 1, experience: midway }));
    expect(d.xpProgressPercent).toBeGreaterThanOrEqual(45);
    expect(d.xpProgressPercent).toBeLessThanOrEqual(55);
  });
});
