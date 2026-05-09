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

import { ShardChip } from '@/lib/components/characterSheet/shardChip';
import type {
  CharacterShard,
  CharacterSheet as CharacterSheetType,
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
 * @property {string} [locale] - Content locale (default `en`)
 */
export interface OverviewTabProps {
  data: CharacterSheetType;
  editing: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
  locale?: string;
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
  locale = 'en',
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
        <div className={styles.skillsToolsRow}>
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
                const chipColor =
                  shard.category === 'boon'
                    ? 'primary'
                    : shard.category === 'vocation-feature'
                      ? 'secondary'
                      : 'tertiary';
                return (
                  <ShardChip
                    key={shard.id}
                    shard={shard}
                    color={chipColor}
                    locale={locale}
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
