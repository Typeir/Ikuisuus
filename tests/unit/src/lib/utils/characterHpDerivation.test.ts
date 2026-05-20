/**
 * @fileoverview characterHpDerivation Unit Tests
 * @description Tests for {@link rebaseHitDiceLogForCon}.
 *
 * @module tests/unit/src/lib/utils/characterHpDerivation
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { rebaseHitDiceLogForCon } from '@/lib/utils/characterHpDerivation';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { describe, expect, it } from 'vitest';

const entry = (over: Partial<HitDieRollEntry> = {}): HitDieRollEntry => ({
  id: 'barbarian-1',
  vocSlug: 'barbarian',
  vocTitle: 'Barbarian',
  dieType: '12',
  levelIndex: 1,
  result: 8,
  conMod: 2,
  addedToHp: true,
  ...over,
});

describe('rebaseHitDiceLogForCon', () => {
  it('returns delta=0 and the same log reference when CON is unchanged', () => {
    const log = [entry()];
    const result = rebaseHitDiceLogForCon(log, 2);
    expect(result.delta).toBe(0);
    expect(result.rebasedLog).toBe(log);
  });

  it('returns the cumulative delta when CON increases', () => {
    const log = [entry({ conMod: 2 }), entry({ id: 'b-2', conMod: 2 })];
    const result = rebaseHitDiceLogForCon(log, 4);
    expect(result.delta).toBe(4);
    expect(result.rebasedLog.every((e) => e.conMod === 4)).toBe(true);
  });

  it('returns the cumulative delta when CON decreases', () => {
    const log = [entry({ conMod: 3 }), entry({ id: 'b-2', conMod: 3 })];
    const result = rebaseHitDiceLogForCon(log, 1);
    expect(result.delta).toBe(-4);
    expect(result.rebasedLog.every((e) => e.conMod === 1)).toBe(true);
  });

  it('ignores entries that have not been added to HP yet', () => {
    const log = [
      entry({ conMod: 2, addedToHp: true }),
      entry({ id: 'b-2', conMod: 2, addedToHp: false, result: null }),
    ];
    const result = rebaseHitDiceLogForCon(log, 4);
    expect(result.delta).toBe(2);
    expect(result.rebasedLog[0].conMod).toBe(4);
    expect(result.rebasedLog[1].conMod).toBe(2);
  });
});
