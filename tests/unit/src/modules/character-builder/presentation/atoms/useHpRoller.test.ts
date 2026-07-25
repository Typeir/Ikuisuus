/**
 * @fileoverview useHpRoller tests
 * @description Verifies grouping/counting and the two-phase operations: valuing
 * a die does not commit an unadded die but does re-commit an added one; adding
 * requires a value; set-all values every die; clear-all removes them.
 *
 * @module tests/unit/src/modules/character-builder/presentation/atoms/useHpRoller
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { useHpRoller } from '@/modules/character-builder/presentation/atoms/useHpRoller';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const entry = (
  over: Partial<HitDieRollEntry> & { id: string },
): HitDieRollEntry => ({
  vocSlug: 'warrior',
  vocTitle: 'Warrior',
  dieType: '10',
  levelIndex: 1,
  result: null,
  conMod: 0,
  addedToHp: false,
  ...over,
});

const committedLog = (fn: ReturnType<typeof vi.fn>): HitDieRollEntry[] =>
  fn.mock.calls[0][0] as HitDieRollEntry[];

describe('useHpRoller', () => {
  it('groups by vocation and counts not-added dice', () => {
    const log = [
      entry({ id: 'a' }),
      entry({ id: 'b', vocSlug: 'scion', vocTitle: 'Scion' }),
    ];
    const { result } = renderHook(() => useHpRoller(log, () => undefined));
    expect(result.current.groups).toHaveLength(2);
    expect(result.current.unrolled).toBe(2);
  });

  it('onRoll sets a value but does not commit an unadded die', () => {
    const onCommit = vi.fn();
    const log = [entry({ id: 'a' })];
    const { result } = renderHook(() => useHpRoller(log, onCommit));
    act(() => result.current.onRoll('a'));
    expect(result.current.groups[0].entries[0].result).not.toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('onAdd adds a valued die and commits; is a no-op without a value', () => {
    const onCommit = vi.fn();
    const log = [entry({ id: 'a', result: 7 }), entry({ id: 'b', levelIndex: 2 })];
    const { result } = renderHook(() => useHpRoller(log, onCommit));
    act(() => result.current.onAdd('b'));
    expect(onCommit).not.toHaveBeenCalled();
    act(() => result.current.onAdd('a'));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(committedLog(onCommit)[0].addedToHp).toBe(true);
  });

  it('re-valuing an added die commits the new value', () => {
    const onCommit = vi.fn();
    const log = [entry({ id: 'a', result: 5, addedToHp: true })];
    const { result } = renderHook(() => useHpRoller(log, onCommit));
    act(() => result.current.onSet('a', 9));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(committedLog(onCommit)[0].result).toBe(9);
    expect(committedLog(onCommit)[0].addedToHp).toBe(true);
  });

  it('onSetAll sets every die in the vocation to the value', () => {
    const onCommit = vi.fn();
    const log = [
      entry({ id: 'a', result: 1, addedToHp: true }),
      entry({ id: 'b', levelIndex: 2 }),
    ];
    const { result } = renderHook(() => useHpRoller(log, onCommit));
    act(() => result.current.onSetAll('warrior', 6));
    expect(result.current.groups[0].entries.every((e) => e.result === 6)).toBe(
      true,
    );
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('onClearAll removes every added die and commits', () => {
    const onCommit = vi.fn();
    const log = [entry({ id: 'a', result: 8, addedToHp: true })];
    const { result } = renderHook(() => useHpRoller(log, onCommit));
    act(() => result.current.onClearAll('warrior'));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(committedLog(onCommit)[0].addedToHp).toBe(false);
  });
});
