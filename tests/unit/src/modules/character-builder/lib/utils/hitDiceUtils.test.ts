/**
 * @fileoverview Hit-dice HP derivation unit tests
 * @description Verifies `recalculateHpMax` (legacy frozen-conMod fold) and
 * `deriveHitPoints` / `perLevelGrantBonus` (the live fold: rolled dice + CON × N
 * + passive hp grants, minus the grievous-wound pool).
 *
 * @module tests/unit/modules/character-builder/lib/utils/hitDiceUtils
 * @version 2.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import {
  deriveHitPoints,
  perLevelGrantBonus,
  recalculateHpMax,
} from '@/modules/character-builder/lib/utils/hitDiceUtils';
import { describe, expect, it } from 'vitest';

/**
 * Builds a hit die entry with sensible defaults, overridable per test.
 *
 * @param {Partial<HitDieRollEntry> & { id: string }} overrides - Field overrides; `id` required
 * @returns {HitDieRollEntry} Fully-populated entry
 */
const entry = (
  overrides: Partial<HitDieRollEntry> & { id: string },
): HitDieRollEntry => ({
  vocSlug: 'berserker',
  vocTitle: 'Berserker',
  dieType: '12',
  levelIndex: 1,
  result: null,
  conMod: 2,
  addedToHp: false,
  ...overrides,
});

describe('recalculateHpMax', () => {
  it('returns 0 for an empty log', () => {
    expect(recalculateHpMax([])).toBe(0);
  });

  it('counts only entries added to HP, ignoring rolled-but-unadded and unrolled', () => {
    const log = [
      entry({ id: 'a', result: 8, addedToHp: true }),
      entry({ id: 'b', result: 6, addedToHp: false }),
      entry({ id: 'c', result: null, addedToHp: false }),
    ];
    expect(recalculateHpMax(log)).toBe(10);
  });

  it('uses each entry frozen conMod so a later CON change cannot drift the total', () => {
    const log = [
      entry({ id: 'a', result: 8, conMod: 2, addedToHp: true }),
      entry({ id: 'b', result: 5, conMod: 3, addedToHp: true }),
    ];
    expect(recalculateHpMax(log)).toBe(18);
  });

  it('drops phantom HP when a confirmed entry is pruned on level decrease or vocation removal', () => {
    const full = [
      entry({ id: 'a', result: 8, addedToHp: true }),
      entry({ id: 'b', result: 7, addedToHp: true }),
    ];
    expect(recalculateHpMax(full)).toBe(19);
    const pruned = full.filter((e) => e.id !== 'b');
    expect(recalculateHpMax(pruned)).toBe(10);
  });

  it('returns to the pre-add baseline when a confirmed roll is un-added for a re-roll', () => {
    const baseline = [entry({ id: 'a', result: 8, addedToHp: true })];
    expect(recalculateHpMax(baseline)).toBe(10);
    const reRolling = baseline.map((e) => ({
      ...e,
      addedToHp: false,
      result: 11,
    }));
    expect(recalculateHpMax(reRolling)).toBe(0);
  });

  it('never returns a negative maximum', () => {
    const log = [entry({ id: 'a', result: 1, conMod: -3, addedToHp: true })];
    expect(recalculateHpMax(log)).toBe(0);
  });
});

/**
 * Builds a minimal character exposing only the fields the live fold reads.
 *
 * @param {Partial<CharacterSheet>} overrides - Field overrides
 * @returns {CharacterSheet} Minimal character sheet
 */
const character = (overrides: Partial<CharacterSheet>): CharacterSheet =>
  ({
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    hitDiceLog: [],
    vocations: [
      {
        slug: 'warrior',
        title: 'Warrior',
        level: 1,
        specializationSlug: null,
        specializationTitle: '',
        vocationFeatures: [],
        specializationFeatures: [],
      },
    ],
    selectedFeats: [],
    ...overrides,
  }) as unknown as CharacterSheet;

/**
 * Builds a rolled-and-added Warrior hit die (deriveHitPoints ignores the frozen
 * conMod field — the live CON comes from `abilityScores`).
 *
 * @param {Partial<HitDieRollEntry> & { id: string }} over - Field overrides; `id` required
 * @returns {HitDieRollEntry} A committed hit die entry
 */
const rolled = (
  over: Partial<HitDieRollEntry> & { id: string },
): HitDieRollEntry =>
  entry({
    vocSlug: 'warrior',
    vocTitle: 'Warrior',
    dieType: '10',
    result: 6,
    addedToHp: true,
    ...over,
  });

describe('deriveHitPoints', () => {
  it('sums rolled dice plus CON × N', () => {
    const c = character({
      abilityScores: { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 10 },
      hitDiceLog: [
        rolled({ id: 'a', result: 6, levelIndex: 1 }),
        rolled({ id: 'b', result: 8, levelIndex: 2 }),
      ],
    });
    expect(deriveHitPoints(c)).toEqual({ base: 18, effective: 18 });
  });

  it('counts only rolled+added dice toward N, never total level', () => {
    const c = character({
      abilityScores: { str: 10, dex: 10, con: 12, int: 10, wis: 10, cha: 10 },
      hitDiceLog: [
        rolled({ id: 'a', result: 7 }),
        rolled({ id: 'b', result: 5, addedToHp: false }),
        rolled({ id: 'c', result: null, addedToHp: false }),
      ],
    });
    expect(deriveHitPoints(c).base).toBe(8);
  });

  it('spreads a per-level feature grant across every rolled die', () => {
    const c = character({
      vocations: [
        {
          slug: 'warrior',
          title: 'Warrior',
          level: 3,
          specializationSlug: null,
          specializationTitle: '',
          vocationFeatures: [
            { id: 'ff', heading: 'Fortified Frame', level: 1, grants: ['hp:1:level'] },
          ],
          specializationFeatures: [],
        },
      ] as unknown as CharacterSheet['vocations'],
      hitDiceLog: [
        rolled({ id: 'a', result: 6, levelIndex: 1 }),
        rolled({ id: 'b', result: 6, levelIndex: 2 }),
        rolled({ id: 'c', result: 6, levelIndex: 3 }),
      ],
    });
    expect(deriveHitPoints(c).base).toBe(21);
  });

  it('applies a once flat grant plus a vocation-scoped level grant (Draconic shape)', () => {
    const c = character({
      vocations: [
        {
          slug: 'scion',
          title: 'Scion',
          level: 4,
          specializationSlug: 'draconic-sorcery',
          specializationTitle: 'Draconic',
          vocationFeatures: [],
          specializationFeatures: [
            {
              id: 'dr',
              heading: 'Draconic Resilience',
              level: 1,
              grants: ['hp:2:once', 'hp:1:level-vocation-scion'],
            },
          ],
        },
      ] as unknown as CharacterSheet['vocations'],
      hitDiceLog: [
        rolled({ id: 'a', vocSlug: 'scion', result: 5, levelIndex: 1 }),
        rolled({ id: 'b', vocSlug: 'scion', result: 5, levelIndex: 2 }),
        rolled({ id: 'c', vocSlug: 'scion', result: 5, levelIndex: 3 }),
        rolled({ id: 'd', vocSlug: 'scion', result: 5, levelIndex: 4 }),
      ],
    });
    expect(deriveHitPoints(c).base).toBe(26);
  });

  it('degrades effective by the grievous-wound pool, leaving base intact', () => {
    const c = character({
      abilityScores: { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 10 },
      hitDiceLog: [
        rolled({ id: 'a', result: 6, levelIndex: 1 }),
        rolled({ id: 'b', result: 8, levelIndex: 2 }),
      ],
      grievousWounds: 5,
    });
    expect(deriveHitPoints(c)).toEqual({ base: 18, effective: 13 });
  });

  it('stays finite on a pre-migration character with no grievousWounds field', () => {
    const c = character({
      abilityScores: { str: 10, dex: 10, con: 12, int: 10, wis: 10, cha: 10 },
      hitDiceLog: [rolled({ id: 'a', result: 6 })],
    });
    const derived = deriveHitPoints(c);
    expect(Number.isFinite(derived.base)).toBe(true);
    expect(derived.base).toBe(7);
    expect(derived.effective).toBe(derived.base);
  });

  it('yields 0 with no rolled dice even when grants exist (unrolled contributes nothing)', () => {
    const c = character({
      abilityScores: { str: 10, dex: 10, con: 20, int: 10, wis: 10, cha: 10 },
      vocations: [
        {
          slug: 'warrior',
          title: 'Warrior',
          level: 5,
          specializationSlug: null,
          specializationTitle: '',
          vocationFeatures: [{ id: 'ff', level: 1, grants: ['hp:1:level'] }],
          specializationFeatures: [],
        },
      ] as unknown as CharacterSheet['vocations'],
      hitDiceLog: [],
    });
    expect(deriveHitPoints(c)).toEqual({ base: 0, effective: 0 });
  });

  it('clamps the aggregate at 0 while letting a negative CON reduce it', () => {
    const c = character({
      abilityScores: { str: 10, dex: 10, con: 6, int: 10, wis: 10, cha: 10 },
      hitDiceLog: [rolled({ id: 'a', result: 1 })],
    });
    expect(deriveHitPoints(c).base).toBe(0);
  });
});

describe('perLevelGrantBonus', () => {
  it('sums CON and matching per-level grants, excluding once grants and other vocations', () => {
    const c = character({
      abilityScores: { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 10 },
      vocations: [
        {
          slug: 'warrior',
          title: 'Warrior',
          level: 2,
          specializationSlug: null,
          specializationTitle: '',
          vocationFeatures: [
            {
              id: 'ff',
              level: 1,
              grants: ['hp:1:level', 'hp:5:once', 'hp:1:level-vocation-scion'],
            },
          ],
          specializationFeatures: [],
        },
      ] as unknown as CharacterSheet['vocations'],
    });
    expect(perLevelGrantBonus(c, 'warrior', null)).toBe(3);
  });
});
