/**
 * @fileoverview Overview Tab
 * @description Two-column overview: combat stats / skills / tools on the left;
 * attacks, selected feature chips, and notes on the right.
 *
 * @module lib/components/characterSheet/tabs/overviewTab
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Chip } from '@/lib/components/ui/chip';
import type {
  CharacterSheet as CharacterSheetType,
  CharacterShard,
} from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import { AttacksTable } from '../attacksTable';
import { CombatStatsRow } from '../combatStatsRow';
import { NotesSection } from '../notesSection';
import { SkillsTable } from '../skillsTable';
import { ToolsTable } from '../toolsTable';
import styles from './tabs.module.scss';

/**
 * Props for `<OverviewTab>`.
 *
 * @interface OverviewTabProps
 * @property {CharacterSheetType} data - Active character data
 * @property {boolean} editing - Whether edit mode is active
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch the draft
 */
export interface OverviewTabProps {
  data: CharacterSheetType;
  editing: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
}

/**
 * Overview tab content.
 *
 * @component
 * @param {OverviewTabProps} props - Component props
 * @returns {JSX.Element} Rendered tab body
 */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  editing,
  onChange,
}) => {
  const t = useTranslations('characterSheet');
  const allShards: CharacterShard[] = [
    ...data.selectedBoons,
    ...data.vocationFeatures,
    ...data.specializationFeatures,
  ];

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        <CombatStatsRow
          hpCurrent={data.hpCurrent}
          hpMax={data.hpMax}
          tempHp={data.tempHp}
          ac={data.ac}
          initiativeBonus={data.initiativeBonus}
          speedOverride={data.speedOverride}
          proficiencyBonus={data.proficiencyBonus}
        />
        <SkillsTable
          skills={data.skills}
          abilityScores={data.abilityScores}
          proficiencyBonus={data.proficiencyBonus}
          onChange={(skills) => onChange({ skills })}
          readOnly={!editing}
        />
        <ToolsTable
          tools={data.tools}
          proficiencyBonus={data.proficiencyBonus}
          onChange={(tools) => onChange({ tools })}
          readOnly={!editing}
        />
      </div>

      <div className={styles.column}>
        <AttacksTable
          attacks={data.attacks}
          onChange={(attacks) => onChange({ attacks })}
          readOnly={!editing}
        />

        {allShards.length > 0 && (
          <section aria-label={t('ariaSelectedBoons')}>
            <h3 className={styles.sectionTitle}>{t('boons')}</h3>
            <div className={styles.chipCloud}>
              {allShards.map((shard) => {
                const variant =
                  shard.category === 'boon'
                    ? 'boon'
                    : shard.category === 'vocation-feature'
                      ? 'vocation-feature'
                      : 'specialization-feature';
                return (
                  <Chip
                    key={shard.id}
                    label={shard.heading}
                    variant={variant}
                    title={shard.cachedText?.slice(0, 200)}
                  />
                );
              })}
            </div>
          </section>
        )}

        <NotesSection
          values={{
            background: data.background,
            personality: data.personality,
            ideals: data.ideals,
            bonds: data.bonds,
            flaws: data.flaws,
            notes: data.notes,
          }}
          onChange={(fields) => onChange(fields)}
          readOnly={!editing}
        />
      </div>
    </div>
  );
};
