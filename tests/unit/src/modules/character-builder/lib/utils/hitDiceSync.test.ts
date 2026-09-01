/**
 * @fileoverview hitDiceSync Unit Tests
 * @description Covers the single-source-of-truth hit-dice reconciliation:
 * backfill (average, primary-L1 max), healing never-rolled dice, pruning removed
 * levels/vocations, preserving deliberate rolls, hpMax/tierBonus derivation, and
 * idempotency.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/hitDiceSync.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { UNKNOWN_DIE } from '@/lib/utils/diceUtils';
import type { VocationEntry } from '@/modules/character-builder/domain/character/characterEntity';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { syncHitDiceLog } from '@/modules/character-builder/lib/utils/hitDiceSync';
import { describe, expect, it } from 'vitest';

const voc = (
  slug: string,
  hitDie: number,
  level: number,
): VocationEntry => ({
  slug,
  title: slug[0].toUpperCase() + slug.slice(1),
  level,
  hitDie,
  specializationSlug: null,
  specializationTitle: '',
  vocationFeatures: [],
  specializationFeatures: [],
});

const makeChar = (
  vocations: VocationEntry[],
  overrides: Partial<CharacterSheet> = {},
): CharacterSheet => ({
  ...createEmptyCharacter(),
  vocations,
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  ...overrides,
});

const applied = (character: CharacterSheet): CharacterSheet => ({
  ...character,
  ...(syncHitDiceLog(character) ?? {}),
});

describe('syncHitDiceLog', () => {
  it('backfills every level, primary L1 at die max and the rest at average', () => {
    const patch = syncHitDiceLog(makeChar([voc('druid', 8, 2)]));
    const log = patch?.hitDiceLog as HitDieRollEntry[];
    expect(log).toHaveLength(2);
    expect(log[0]).toMatchObject({ id: 'druid-1', result: 8, addedToHp: true });
    expect(log[1]).toMatchObject({ id: 'druid-2', result: 5, addedToHp: true });
  });

  it('folds CON x N into hpMax across mixed vocations', () => {
    const patch = syncHitDiceLog(
      makeChar([voc('druid', 8, 2), voc('warrior', 10, 1)], {
        abilityScores: { str: 10, dex: 10, con: 20, int: 10, wis: 10, cha: 10 },
      }),
    );
    // dice = 8 + 5 + 6 = 19; CON +5 x 3 dice = 15 => 34
    expect(patch?.hpMax).toBe(34);
  });

  it('heals a never-rolled entry to its average, added to HP', () => {
    const stale: HitDieRollEntry = {
      id: 'druid-2',
      vocSlug: 'druid',
      vocTitle: 'Druid',
      dieType: 8,
      levelIndex: 2,
      result: null,
      conMod: 0,
      addedToHp: false,
    };
    const patch = syncHitDiceLog(
      makeChar([voc('druid', 8, 2)], { hitDiceLog: [stale] }),
    );
    const healed = (patch?.hitDiceLog as HitDieRollEntry[]).find(
      (e) => e.id === 'druid-2',
    );
    expect(healed).toMatchObject({ result: 5, addedToHp: true });
  });

  it('preserves a deliberately rolled-but-unadded non-primary die', () => {
    const primaryMax: HitDieRollEntry = {
      id: 'druid-1',
      vocSlug: 'druid',
      vocTitle: 'Druid',
      dieType: 8,
      levelIndex: 1,
      result: 8,
      conMod: 0,
      addedToHp: true,
    };
    const rolledUnadded: HitDieRollEntry = {
      id: 'druid-2',
      vocSlug: 'druid',
      vocTitle: 'Druid',
      dieType: 8,
      levelIndex: 2,
      result: 3,
      conMod: 0,
      addedToHp: false,
    };
    const patch = syncHitDiceLog(
      makeChar([voc('druid', 8, 2)], {
        hitDiceLog: [primaryMax, rolledUnadded],
      }),
    );
    // The log is already canonical (primary L1 maxed, L2 preserved) => no log change.
    expect(patch?.hitDiceLog).toBeUndefined();
  });

  it('forces the primary vocation level-1 die to max even if a lower roll is stored', () => {
    const lowRoll: HitDieRollEntry = {
      id: 'druid-1',
      vocSlug: 'druid',
      vocTitle: 'Druid',
      dieType: 8,
      levelIndex: 1,
      result: 3,
      conMod: 0,
      addedToHp: false,
    };
    const l1 = (
      syncHitDiceLog(
        makeChar([voc('druid', 8, 2)], { hitDiceLog: [lowRoll] }),
      )?.hitDiceLog as HitDieRollEntry[]
    ).find((e) => e.id === 'druid-1');
    expect(l1).toMatchObject({ result: 8, addedToHp: true });
  });

  it('prunes entries beyond the current level and for removed vocations', () => {
    const log: HitDieRollEntry[] = [
      { id: 'druid-1', vocSlug: 'druid', vocTitle: 'Druid', dieType: 8, levelIndex: 1, result: 8, conMod: 0, addedToHp: true },
      { id: 'druid-2', vocSlug: 'druid', vocTitle: 'Druid', dieType: 8, levelIndex: 2, result: 5, conMod: 0, addedToHp: true },
      { id: 'gone-1', vocSlug: 'gone', vocTitle: 'Gone', dieType: 6, levelIndex: 1, result: 4, conMod: 0, addedToHp: true },
    ];
    const patch = syncHitDiceLog(
      makeChar([voc('druid', 8, 1)], { hitDiceLog: log }),
    );
    const ids = (patch?.hitDiceLog as HitDieRollEntry[]).map((e) => e.id);
    expect(ids).toEqual(['druid-1']);
  });

  it('never emits tierBonus — the sheet reducer owns that derived cache', () => {
    const patch = syncHitDiceLog(
      makeChar([voc('druid', 8, 6)], { level: 6, tierBonus: 1 }),
    );
    expect(patch).not.toBeNull();
    expect(patch).not.toHaveProperty('tierBonus');
  });

  it('carries the vocation face count straight onto the log entry', () => {
    const log = syncHitDiceLog(makeChar([voc('warrior', 10, 1)]))
      ?.hitDiceLog as HitDieRollEntry[];
    expect(log[0].dieType).toBe(10);
    expect(log[0].result).toBe(10);
  });

  it('treats a vocation with no usable die as unrolled', () => {
    const log = syncHitDiceLog(makeChar([voc('warrior', UNKNOWN_DIE, 1)]))
      ?.hitDiceLog as HitDieRollEntry[];
    expect(log[0].dieType).toBe(UNKNOWN_DIE);
    expect(log[0].result).toBeNull();
    expect(log[0].addedToHp).toBe(false);
  });

  it('is idempotent — a synced character yields no further patch', () => {
    const once = applied(makeChar([voc('druid', 8, 2), voc('warrior', 10, 1)]));
    expect(syncHitDiceLog(once)).toBeNull();
  });
});

