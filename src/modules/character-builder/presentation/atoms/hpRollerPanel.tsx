/**
 * @fileoverview HP Roller Panel Component
 * @description Expandable panel for hit die rolling. Shows per-level rolls grouped by vocation
 * with mass roll/average/set/confirm actions and manual input editing.
 *
 * @module lib/components/characterSheet/atoms/hpRollerPanel
 * @version 2.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { rollDie } from '@/lib/utils/diceUtils';
import { DropdownPanel } from '@/modules/character-builder/presentation/atoms/dropdownPanel';
import { useCallback, useEffect, useState } from 'react';
import { HpRollerGroup } from './hpRollerGroup';
import styles from './hpRollerPanel.module.scss';

export interface HpRollerPanelProps {
  hitDiceLog: HitDieRollEntry[];
  conMod: number;
  onCommit: (updatedLog: HitDieRollEntry[], hpDelta: number) => void;
}

function groupByVocation(entries: HitDieRollEntry[]) {
  const map = new Map<
    string,
    {
      vocSlug: string;
      vocTitle: string;
      dieType: string;
      entries: HitDieRollEntry[];
    }
  >();
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

export const HpRollerPanel: React.FC<HpRollerPanelProps> = ({
  hitDiceLog,
  conMod,
  onCommit,
}) => {
  const [localLog, setLocalLog] = useState<HitDieRollEntry[]>(hitDiceLog);
  const [setAllMode, setSetAllMode] = useState<Set<string>>(new Set());
  const [manualValues, setManualValues] = useState<Map<string, number>>(
    new Map(),
  );

  useEffect(() => {
    setLocalLog(hitDiceLog);
  }, [hitDiceLog]);

  const getAverage = useCallback(
    (dieType: string) => Math.ceil(parseInt(dieType, 10) / 2) || 1,
    [],
  );

  const handleRoll = useCallback((entryId: string) => {
    setLocalLog((p) =>
      p.map((e) =>
        e.id === entryId
          ? { ...e, result: rollDie(parseInt(e.dieType, 10) || 1) }
          : e,
      ),
    );
  }, []);

  const handleRollAll = useCallback((vocSlug: string) => {
    setLocalLog((p) =>
      p.map((e) =>
        e.vocSlug === vocSlug && !e.addedToHp
          ? { ...e, result: rollDie(parseInt(e.dieType, 10) || 1) }
          : e,
      ),
    );
  }, []);

  const handleAverageAll = useCallback(
    (vocSlug: string) => {
      setLocalLog((p) =>
        p.map((e) =>
          e.vocSlug === vocSlug && !e.addedToHp
            ? { ...e, result: getAverage(e.dieType) }
            : e,
        ),
      );
    },
    [getAverage],
  );

  const handleSetAll = useCallback((vocSlug: string) => {
    setSetAllMode((p) => {
      const n = new Set(p);
      n.has(vocSlug) ? n.delete(vocSlug) : n.add(vocSlug);
      return n;
    });
  }, []);

  const handleManualChange = useCallback(
    (entryId: string, value: number | undefined) => {
      setManualValues((p) => {
        const m = new Map(p);
        value && value > 0 ? m.set(entryId, value) : m.delete(entryId);
        return m;
      });
    },
    [],
  );

  const handleAddAllToHp = useCallback(
    (vocSlug: string) => {
      const entries = localLog.filter(
        (e) => e.vocSlug === vocSlug && !e.addedToHp,
      );
      let delta = 0;
      const updated = localLog.map((e) => {
        if (e.vocSlug !== vocSlug || e.addedToHp) return e;
        const val = manualValues.get(e.id) ?? e.result ?? 0;
        delta += val + conMod;
        return { ...e, result: val, addedToHp: true };
      });
      setLocalLog(updated);
      onCommit(updated, delta);
      setSetAllMode((p) => {
        const n = new Set(p);
        n.delete(vocSlug);
        return n;
      });
      setManualValues((p) => {
        const m = new Map(p);
        entries.forEach((e) => m.delete(e.id));
        return m;
      });
    },
    [localLog, conMod, onCommit, manualValues],
  );

  const handleConfirm = useCallback(
    (entryId: string) => {
      const e = localLog.find((x) => x.id === entryId);
      if (!e) return;
      const val = manualValues.get(entryId) ?? e.result ?? 0;
      const updated = localLog.map((x) =>
        x.id === entryId ? { ...x, result: val, addedToHp: true } : x,
      );
      setLocalLog(updated);
      onCommit(updated, val + conMod);
      setManualValues((p) => {
        const m = new Map(p);
        m.delete(entryId);
        return m;
      });
    },
    [localLog, conMod, onCommit, manualValues],
  );

  const handleRemoveFromHp = useCallback(
    (entryId: string) => {
      const e = localLog.find((x) => x.id === entryId);
      if (!e || !e.addedToHp) return;
      const val = e.result ?? 0;
      const updated = localLog.map((x) =>
        x.id === entryId ? { ...x, addedToHp: false } : x,
      );
      setLocalLog(updated);
      onCommit(updated, -(val + conMod));
    },
    [localLog, conMod, onCommit],
  );

  const unrolled = localLog.filter((e) => !e.addedToHp).length;
  const groups = groupByVocation(localLog);

  return (
    <DropdownPanel
      triggerLabel='Open hit dice roller'
      badge={
        unrolled > 0 ? (
          <span className={styles.badge}>{unrolled}</span>
        ) : undefined
      }
      triggerClassName={styles.trigger}
      panelClassName={styles.panel}
      panelRole='dialog'
      panelLabel='Hit dice roller'>
      <div className={styles.panelHeader}>Hit Dice</div>
      {groups.length === 0 && (
        <p className={styles.empty}>No hit dice tracked yet.</p>
      )}
      {groups.map((g) => (
        <HpRollerGroup
          key={g.vocSlug}
          vocSlug={g.vocSlug}
          vocTitle={g.vocTitle}
          dieType={g.dieType}
          entries={g.entries}
          conMod={conMod}
          setAllMode={setAllMode}
          manualValues={manualValues}
          onRoll={handleRoll}
          onRollAll={handleRollAll}
          onAverageAll={handleAverageAll}
          onSetAll={handleSetAll}
          onAddAll={handleAddAllToHp}
          onConfirm={handleConfirm}
          onRemove={handleRemoveFromHp}
          onManualChange={handleManualChange}
          getAverage={getAverage}
        />
      ))}
    </DropdownPanel>
  );
};
