/**
 * @fileoverview HP Roller Panel Component
 * @description Expandable panel triggered by a ▼ button adjacent to the HP
 * label. Shows a per-level hit die roll log grouped by vocation. Unrolled
 * entries have a Roll button; rolled-but-unconfirmed entries show the result
 * + CON modifier with an "Add to HP" confirm button; confirmed entries are
 * displayed as read-only.
 *
 * Panel open/close state and portal rendering are delegated to
 * {@link DropdownPanel}, which escapes parent stacking contexts.
 *
 * @module lib/components/characterSheet/atoms/hpRollerPanel
 * @version 2.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import { DropdownPanel } from '@/lib/components/characterSheet/atoms/dropdownPanel';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { rollDie } from '@/lib/utils/diceUtils';
import { useCallback, useEffect, useState } from 'react';
import styles from './hpRollerPanel.module.scss';

/**
 * Props for the HpRollerPanel component.
 *
 * @interface HpRollerPanelProps
 * @property {HitDieRollEntry[]} hitDiceLog - Full hit dice roll log from the character sheet
 * @property {number} conMod - Current CON modifier
 * @property {(updatedLog: HitDieRollEntry[], hpDelta: number) => void} onCommit - Called when entries are confirmed; receives the updated log and the total HP delta to add
 */
export interface HpRollerPanelProps {
  hitDiceLog: HitDieRollEntry[];
  conMod: number;
  onCommit: (updatedLog: HitDieRollEntry[], hpDelta: number) => void;
}

/**
 * Groups an array of hit die entries by vocation slug.
 *
 * @function groupByVocation
 * @param {HitDieRollEntry[]} entries - Roll log entries to group
 * @returns {{ vocSlug: string; vocTitle: string; dieType: string; entries: HitDieRollEntry[] }[]} Grouped entries
 */
function groupByVocation(entries: HitDieRollEntry[]): {
  vocSlug: string;
  vocTitle: string;
  dieType: string;
  entries: HitDieRollEntry[];
}[] {
  const map = new Map<
    string,
    { vocSlug: string; vocTitle: string; dieType: string; entries: HitDieRollEntry[] }
  >();
  for (const entry of entries) {
    const existing = map.get(entry.vocSlug);
    if (existing) {
      existing.entries.push(entry);
    } else {
      map.set(entry.vocSlug, {
        vocSlug: entry.vocSlug,
        vocTitle: entry.vocTitle,
        dieType: entry.dieType,
        entries: [entry],
      });
    }
  }
  return [...map.values()];
}

/**
 * HP roller panel — expandable hit die roll log with Roll / Add to HP actions.
 *
 * @component
 * @param {HpRollerPanelProps} props - Component props
 * @returns {JSX.Element} Rendered panel trigger and dropdown
 */
export const HpRollerPanel: React.FC<HpRollerPanelProps> = ({
  hitDiceLog,
  conMod,
  onCommit,
}) => {
  const [localLog, setLocalLog] = useState<HitDieRollEntry[]>(hitDiceLog);

  useEffect(() => {
    setLocalLog(hitDiceLog);
  }, [hitDiceLog]);

  const handleRoll = useCallback((entryId: string) => {
    setLocalLog((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e;
        const faces = parseInt(e.dieType, 10);
        const result = Number.isFinite(faces) && faces > 0 ? rollDie(faces) : 1;
        return { ...e, result };
      }),
    );
  }, []);

  const handleConfirm = useCallback(
    (entryId: string) => {
      const entry = localLog.find((e) => e.id === entryId);
      if (!entry || entry.result === null) return;
      const hpDelta = entry.result + conMod;
      const updatedLog = localLog.map((e) =>
        e.id === entryId ? { ...e, addedToHp: true } : e,
      );
      setLocalLog(updatedLog);
      onCommit(updatedLog, hpDelta);
    },
    [localLog, conMod, onCommit],
  );

  const unrolledCount = localLog.filter((e) => !e.addedToHp).length;
  const groups = groupByVocation(localLog);

  const badge =
    unrolledCount > 0 ? (
      <span className={styles.badge}>{unrolledCount}</span>
    ) : undefined;

  return (
    <DropdownPanel
      triggerLabel='Open hit dice roller'
      badge={badge}
      triggerClassName={styles.trigger}
      panelClassName={styles.panel}
      panelRole='dialog'
      panelLabel='Hit dice roller'>
      <div className={styles.panelHeader}>Hit Dice</div>

      {groups.length === 0 && (
        <p className={styles.empty}>No hit dice tracked yet.</p>
      )}

      {groups.map((group) => (
        <section key={group.vocSlug} className={styles.group}>
          <div className={styles.groupHeader}>
            <span className={styles.groupName}>{group.vocTitle || group.vocSlug}</span>
            <span className={styles.groupDie}>d{group.dieType}</span>
          </div>

          {group.entries.map((entry) => (
            <div
              key={entry.id}
              className={`${styles.entryRow}${entry.addedToHp ? ` ${styles.committed}` : ''}`}>
              <span className={styles.entryLabel}>Lv. {entry.levelIndex}</span>

              {entry.addedToHp ? (
                <span className={styles.entryDone}>
                  {entry.result} + {conMod} = {(entry.result ?? 0) + conMod}
                </span>
              ) : entry.result !== null ? (
                <>
                  <span className={styles.entryResult}>
                    {entry.result} + {conMod} = {entry.result + conMod}
                  </span>
                  <button
                    type='button'
                    className={styles.confirmBtn}
                    onClick={() => handleConfirm(entry.id)}>
                    Add to HP
                  </button>
                </>
              ) : (
                <button
                  type='button'
                  className={styles.rollBtn}
                  onClick={() => handleRoll(entry.id)}>
                  Roll d{entry.dieType}
                </button>
              )}
            </div>
          ))}
        </section>
      ))}
    </DropdownPanel>
  );
};
