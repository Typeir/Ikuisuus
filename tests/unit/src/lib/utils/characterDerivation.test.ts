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
} from '@/lib/utils/characterDerivation';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import {
  MAX_XP_LEVEL,
  XP_THRESHOLDS,
  getXPForLevel,
} from '@/lib/utils/xpProgression';
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
  it('falls back to character.level when no vocations have a slug', () => {
    expect(getTotalCharacterLevel(sheet({ level: 5 }))).toBe(5);
  });

  it('returns at least 1 when fallback level is missing', () => {
    expect(
      getTotalCharacterLevel(sheet({ level: 0 as unknown as number })),
    ).toBe(1);
  });

  it('returns the active vocation level for a single-class character', () => {
    expect(
      getTotalCharacterLevel(sheet({ vocations: [voc({ level: 6 })] })),
    ).toBe(6);
  });

  it('sums vocation levels for multiclass characters', () => {
    expect(
      getTotalCharacterLevel(
        sheet({
          vocations: [
            voc({ slug: 'wizard', level: 4 }),
            voc({ slug: 'rogue', level: 3 }),
          ],
        }),
      ),
    ).toBe(7);
  });

  it('ignores vocation entries with an empty slug', () => {
    expect(
      getTotalCharacterLevel(
        sheet({
          vocations: [voc({ slug: 'wizard', level: 4 }), voc({ slug: '', level: 9 })],
        }),
      ),
    ).toBe(4);
  });
});

describe('getCharacterDerived', () => {
  it('reports hasActiveVocations=false and uses stored experience when no slugs set', () => {
    const xp = 1500;
    const d = getCharacterDerived(sheet({ level: 1, experience: xp }));
    expect(d.hasActiveVocations).toBe(false);
    expect(d.experience).toBe(xp);
    expect(d.totalLevel).toBe(1);
  });

  it('raises experience to floor when stored value is below derived level floor', () => {
    const d = getCharacterDerived(
      sheet({
        vocations: [voc({ slug: 'wizard', level: 3 })],
        experience: 0,
      }),
    );
    expect(d.totalLevel).toBe(3);
    expect(d.experience).toBe(getXPForLevel(3));
    expect(d.xpFloor).toBe(getXPForLevel(3));
  });

  it('locks experience to the floor when vocations drive level (XP follows level changes)', () => {
    const floor = getXPForLevel(3);
    const ceiling = getXPForLevel(4);
    const midway = floor + Math.floor((ceiling - floor) / 2);
    const d = getCharacterDerived(
      sheet({
        vocations: [voc({ slug: 'wizard', level: 3 })],
        experience: midway,
      }),
    );
    expect(d.experience).toBe(floor);
    expect(d.xpProgressPercent).toBe(0);
  });

  it('clamps experience down when level decreases below the stored XP band', () => {
    const d = getCharacterDerived(
      sheet({
        vocations: [voc({ slug: 'wizard', level: 5 })],
        experience: getXPForLevel(8),
      }),
    );
    expect(d.totalLevel).toBe(5);
    expect(d.experience).toBe(getXPForLevel(5));
  });

  it('caps progress at 100% when at MAX_XP_LEVEL', () => {
    const d = getCharacterDerived(
      sheet({
        vocations: [voc({ slug: 'wizard', level: MAX_XP_LEVEL })],
        experience: XP_THRESHOLDS[MAX_XP_LEVEL],
      }),
    );
    expect(d.totalLevel).toBe(MAX_XP_LEVEL);
    expect(d.xpProgressPercent).toBe(100);
  });
});
