/**
 * @fileoverview HP Roller Panel Component
 * @description Expandable panel for hit die rolling. Shows per-level rolls
 * grouped by vocation with per-die and bulk roll / average / max / set / add /
 * clear actions. All state and operations live in {@link useHpRoller}; this
 * component only renders them.
 *
 * @module lib/components/characterSheet/atoms/hpRollerPanel
 * @version 3.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { DropdownPanel } from '@/modules/character-builder/presentation/atoms/dropdownPanel';
import { useTranslations } from 'next-intl';
import { HpRollerGroup } from './hpRollerGroup';
import styles from './hpRollerPanel.module.scss';
import { useHpRoller } from './useHpRoller';

/**
 * Props for {@link HpRollerPanel}.
 *
 * @interface HpRollerPanelProps
 * @property {HitDieRollEntry[]} hitDiceLog - Per-level hit die roll log to display
 * @property {number} conMod - Live CON modifier, shown alongside each entry
 * @property {(updatedLog: HitDieRollEntry[]) => void} onCommit - Called with the full updated log when confirmed HP changes; the consumer derives hpMax from it
 */
export interface HpRollerPanelProps {
  hitDiceLog: HitDieRollEntry[];
  conMod: number;
  onCommit: (updatedLog: HitDieRollEntry[]) => void;
}

/**
 * Renders the hit-dice roller dropdown, delegating all behaviour to
 * {@link useHpRoller}.
 *
 * @component
 * @param {HpRollerPanelProps} props - Component props
 * @param {HitDieRollEntry[]} props.hitDiceLog - Per-level hit die roll log
 * @param {number} props.conMod - Live CON modifier shown per entry
 * @param {(updatedLog: HitDieRollEntry[]) => void} props.onCommit - HP-change commit callback
 * @returns {JSX.Element} The roller dropdown panel
 */
export const HpRollerPanel: React.FC<HpRollerPanelProps> = ({
  hitDiceLog,
  conMod,
  onCommit,
}) => {
  const t = useTranslations('characterSheet');
  const roller = useHpRoller(hitDiceLog, onCommit);

  return (
    <DropdownPanel
      triggerLabel={t('hpRollerTriggerLabel')}
      badge={
        roller.unrolled > 0 ? (
          <span className={styles.badge}>{roller.unrolled}</span>
        ) : undefined
      }
      triggerClassName={styles.trigger}
      panelClassName={styles.panel}
      panelRole='dialog'
      panelLabel={t('hpRollerPanelLabel')}>
      <div className={styles.panelHeader}>{t('hpRollerPanelHeader')}</div>
      {roller.groups.length === 0 && (
        <p className={styles.empty}>{t('hpRollerEmpty')}</p>
      )}
      {roller.groups.map((g) => (
        <HpRollerGroup
          key={g.vocSlug}
          vocSlug={g.vocSlug}
          vocTitle={g.vocTitle}
          dieType={g.dieType}
          entries={g.entries}
          conMod={conMod}
          onRoll={roller.onRoll}
          onAverage={roller.onAverage}
          onSet={roller.onSet}
          onAdd={roller.onAdd}
          onRemove={roller.onRemove}
          onRollAll={roller.onRollAll}
          onAverageAll={roller.onAverageAll}
          onMaxAll={roller.onMaxAll}
          onSetAll={roller.onSetAll}
          onAddAll={roller.onAddAll}
          onClearAll={roller.onClearAll}
        />
      ))}
    </DropdownPanel>
  );
};
