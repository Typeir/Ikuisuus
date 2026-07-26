/**
 * @fileoverview useHpRoller hook
 * @description The two-phase hit-die roller state machine, extracted from
 * HpRollerPanel so the panel stays a thin renderer. Phase one sets a die's value
 * (roll / average / typed / bulk set); phase two adds it to HP (per-die add or
 * bulk add). Setting the value of a die that is already added re-commits so HP
 * stays live; every commit calls `onCommit` with the full log for the consumer to
 * derive hpMax from.
 *
 * @module modules/character-builder/presentation/atoms/useHpRoller
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { rollDie } from '@/lib/utils/diceUtils';
import { useCallback, useEffect, useState } from 'react';

/**
 * A per-vocation group of hit-die entries.
 *
 * @interface HpRollerVocationGroup
 * @property {string} vocSlug - Vocation slug
 * @property {string} vocTitle - Vocation display name
 * @property {number} dieType - Die face count (e.g. `10`)
 * @property {HitDieRollEntry[]} entries - Entries belonging to this vocation
 */
export interface HpRollerVocationGroup {
  vocSlug: string;
  vocTitle: string;
  dieType: number;
  entries: HitDieRollEntry[];
}

/**
 * Buckets a flat log into per-vocation groups, preserving encounter order.
 *
 * @function groupByVocation
 * @param {HitDieRollEntry[]} entries - The full log
 * @returns {HpRollerVocationGroup[]} Groups keyed by vocation slug
 */
function groupByVocation(entries: HitDieRollEntry[]): HpRollerVocationGroup[] {
  const map = new Map<string, HpRollerVocationGroup>();
  for (const entry of entries) {
    const existing = map.get(entry.vocSlug);
    if (existing) existing.entries.push(entry);
    else
      map.set(entry.vocSlug, {
        vocSlug: entry.vocSlug,
        vocTitle: entry.vocTitle,
        dieType: entry.dieType,
        entries: [entry],
      });
  }
  return [...map.values()];
}

/**
 * Rounded average for a die: `floor(faces/2) + 1`.
 *
 * @function dieAverage
 * @param {number} faces - Die face count
 * @returns {number} The average, floored at 1
 */
function dieAverage(faces: number): number {
  return faces > 0 ? Math.floor(faces / 2) + 1 : 1;
}

/**
 * The roller state and operations the UI binds to.
 *
 * @interface HpRoller
 * @property {HpRollerVocationGroup[]} groups - Per-vocation groups of the working log
 * @property {number} unrolled - Count of dice not yet added to HP
 * @property {(entryId: string) => void} onRoll - Roll one die
 * @property {(entryId: string) => void} onAverage - Set one die to its average
 * @property {(entryId: string, value: number | undefined) => void} onSet - Set one die to a typed value (or clear it)
 * @property {(entryId: string) => void} onAdd - Add one die to HP
 * @property {(entryId: string) => void} onRemove - Remove one die from HP
 * @property {(vocSlug: string) => void} onRollAll - Roll every die in a vocation
 * @property {(vocSlug: string) => void} onAverageAll - Average every die in a vocation
 * @property {(vocSlug: string) => void} onMaxAll - Maximise every die in a vocation
 * @property {(vocSlug: string, value: number) => void} onSetAll - Set every die in a vocation to a value
 * @property {(vocSlug: string) => void} onAddAll - Add every valued die in a vocation to HP
 * @property {(vocSlug: string) => void} onClearAll - Remove every added die in a vocation from HP
 */
export interface HpRoller {
  groups: HpRollerVocationGroup[];
  unrolled: number;
  onRoll: (entryId: string) => void;
  onAverage: (entryId: string) => void;
  onSet: (entryId: string, value: number | undefined) => void;
  onAdd: (entryId: string) => void;
  onRemove: (entryId: string) => void;
  onRollAll: (vocSlug: string) => void;
  onAverageAll: (vocSlug: string) => void;
  onMaxAll: (vocSlug: string) => void;
  onSetAll: (vocSlug: string, value: number) => void;
  onAddAll: (vocSlug: string) => void;
  onClearAll: (vocSlug: string) => void;
}

/**
 * Drives the two-phase hit-die roller over a working copy of `hitDiceLog` that
 * re-syncs when the prop changes.
 *
 * @function useHpRoller
 * @param {HitDieRollEntry[]} hitDiceLog - The character's current hit-dice log
 * @param {(updatedLog: HitDieRollEntry[]) => void} onCommit - Called with the full log on any HP-affecting change
 * @param {string} [maxedEntryId] - Id of the fixed max die (primary vocation, level 1); value/remove/clear ops skip it
 * @returns {HpRoller} Grouped entries and operations
 */
export function useHpRoller(
  hitDiceLog: HitDieRollEntry[],
  onCommit: (updatedLog: HitDieRollEntry[]) => void,
  maxedEntryId?: string,
): HpRoller {
  const [localLog, setLocalLog] = useState<HitDieRollEntry[]>(hitDiceLog);

  useEffect(() => {
    setLocalLog(hitDiceLog);
  }, [hitDiceLog]);

  const valueOne = useCallback(
    (entryId: string, next: (entry: HitDieRollEntry) => number | null) => {
      if (entryId === maxedEntryId) return;
      let committed = false;
      const updated = localLog.map((e) => {
        if (e.id !== entryId) return e;
        if (e.addedToHp) committed = true;
        return { ...e, result: next(e) };
      });
      setLocalLog(updated);
      if (committed) onCommit(updated);
    },
    [localLog, onCommit, maxedEntryId],
  );

  const onRoll = useCallback(
    (entryId: string) =>
      valueOne(entryId, (e) => rollDie(e.dieType)),
    [valueOne],
  );
  const onAverage = useCallback(
    (entryId: string) => valueOne(entryId, (e) => dieAverage(e.dieType)),
    [valueOne],
  );
  const onSet = useCallback(
    (entryId: string, value: number | undefined) =>
      valueOne(entryId, () => value ?? null),
    [valueOne],
  );

  const setAddedOne = useCallback(
    (entryId: string, added: boolean) => {
      if (entryId === maxedEntryId && !added) return;
      let changed = false;
      const updated = localLog.map((e) => {
        if (e.id !== entryId || e.addedToHp === added) return e;
        if (added && e.result == null) return e;
        changed = true;
        return { ...e, addedToHp: added };
      });
      if (!changed) return;
      setLocalLog(updated);
      onCommit(updated);
    },
    [localLog, onCommit, maxedEntryId],
  );

  const onAdd = useCallback(
    (entryId: string) => setAddedOne(entryId, true),
    [setAddedOne],
  );
  const onRemove = useCallback(
    (entryId: string) => setAddedOne(entryId, false),
    [setAddedOne],
  );

  const valueAll = useCallback(
    (vocSlug: string, next: (entry: HitDieRollEntry) => number) => {
      let committed = false;
      const updated = localLog.map((e) => {
        if (e.vocSlug !== vocSlug || e.id === maxedEntryId) return e;
        if (e.addedToHp) committed = true;
        return { ...e, result: next(e) };
      });
      setLocalLog(updated);
      if (committed) onCommit(updated);
    },
    [localLog, onCommit, maxedEntryId],
  );

  const onRollAll = useCallback(
    (vocSlug: string) =>
      valueAll(vocSlug, (e) => rollDie(e.dieType)),
    [valueAll],
  );
  const onAverageAll = useCallback(
    (vocSlug: string) => valueAll(vocSlug, (e) => dieAverage(e.dieType)),
    [valueAll],
  );
  const onMaxAll = useCallback(
    (vocSlug: string) => valueAll(vocSlug, (e) => e.dieType || 1),
    [valueAll],
  );
  const onSetAll = useCallback(
    (vocSlug: string, value: number) => valueAll(vocSlug, () => value),
    [valueAll],
  );

  const setAddedAll = useCallback(
    (vocSlug: string, added: boolean) => {
      let changed = false;
      const updated = localLog.map((e) => {
        if (e.vocSlug !== vocSlug || e.id === maxedEntryId) return e;
        if (e.addedToHp === added) return e;
        if (added && e.result == null) return e;
        changed = true;
        return { ...e, addedToHp: added };
      });
      if (!changed) return;
      setLocalLog(updated);
      onCommit(updated);
    },
    [localLog, onCommit, maxedEntryId],
  );

  const onAddAll = useCallback(
    (vocSlug: string) => setAddedAll(vocSlug, true),
    [setAddedAll],
  );
  const onClearAll = useCallback(
    (vocSlug: string) => setAddedAll(vocSlug, false),
    [setAddedAll],
  );

  return {
    groups: groupByVocation(localLog),
    unrolled: localLog.filter((e) => !e.addedToHp).length,
    onRoll,
    onAverage,
    onSet,
    onAdd,
    onRemove,
    onRollAll,
    onAverageAll,
    onMaxAll,
    onSetAll,
    onAddAll,
    onClearAll,
  };
}
