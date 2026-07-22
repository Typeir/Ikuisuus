/**
 * @fileoverview Mobile Overview Tab
 * @description Phone-layout overview: tabbed sections for skills, trades,
 * attacks, notes + shard chip clouds. Extracted from {@link OverviewTab}
 * to satisfy file-length gate (max 250 code lines).
 *
 * @module modules/character-builder/presentation/tabs/mobileOverviewTab
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { Tab, TabList, TabPanel, Tabs } from '@/lib/components/ui/tabs';
import type {
    CharacterShard,
    CharacterSheet as CharacterSheetType,
} from '@/lib/types/character';
import { ShardChip } from '@/modules/character-builder/presentation/shards/shardChip';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { NotesSection } from '../notes/notesSection';
import { AttacksTable } from '../stats/attacksTable';
import { SkillsTable } from '../stats/skillsTable';
import { ToolsTable } from '../stats/toolsTable';
import styles from './tabs.module.scss';

/** Overview section tab value on phone layouts. */
type OverviewSection = 'skills' | 'trades' | 'attacks' | 'notes';

/**
 * Props for `<MobileOverviewTab>`.
 *
 * @interface MobileOverviewTabProps
 * @property {CharacterSheetType} data - Active character data
 * @property {boolean} editing - Whether edit mode is active
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch callback
 * @property {(skills: CharacterSheetType['skills']) => void} onSkillsChange - Skills patch
 * @property {(tools: CharacterSheetType['tools']) => void} onToolsChange - Tools patch
 * @property {(attacks: CharacterSheetType['attacks']) => void} onAttacksChange - Attacks patch
 * @property {(fields: Partial<CharacterSheetType>) => void} onNotesChange - Notes patch
 * @property {CharacterShard[]} boonShards - Selected boon shards
 * @property {CharacterShard[]} featShards - Selected feat shards
 * @property {CharacterShard[]} featureShards - Unlocked vocation/spec features
 */
export interface MobileOverviewTabProps {
  data: CharacterSheetType;
  editing: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
  onSkillsChange: (skills: CharacterSheetType['skills']) => void;
  onToolsChange: (tools: CharacterSheetType['tools']) => void;
  onAttacksChange: (attacks: CharacterSheetType['attacks']) => void;
  onNotesChange: (fields: Partial<CharacterSheetType>) => void;
  boonShards: CharacterShard[];
  featShards: CharacterShard[];
  featureShards: CharacterShard[];
}

/**
 * Mobile (≤phone) overview layout with tabbed sections + shard clouds.
 *
 * @component
 * @param {MobileOverviewTabProps} props - Component props
 * @returns {JSX.Element} Rendered mobile overview
 */
export const MobileOverviewTab: React.FC<MobileOverviewTabProps> = ({
  data,
  editing,
  onChange,
  onSkillsChange,
  onToolsChange,
  onAttacksChange,
  onNotesChange,
  boonShards,
  featShards,
  featureShards,
}) => {
  const t = useTranslations('characterSheet');
  const [section, setSection] = useState<OverviewSection>('skills');

  return (
    <div className={styles.column}>
      <Tabs
        value={section}
        onChange={(v) => setSection(v as OverviewSection)}
        variant='nested'
        ariaLabel={t('ariaOverviewSections')}>
        <TabList ariaLabel={t('ariaOverviewSections')}>
          <Tab value='skills'>{t('overviewSkills')}</Tab>
          <Tab value='trades'>{t('overviewTrades')}</Tab>
          <Tab value='attacks'>{t('overviewAttacks')}</Tab>
          <Tab value='notes'>{t('overviewNotes')}</Tab>
        </TabList>

        <TabPanel value='skills'>
          <SkillsTable
            skills={data.skills}
            abilityScores={data.abilityScores}
            tierBonus={data.tierBonus}
            onChange={onSkillsChange}
            readOnly={!editing}
          />
        </TabPanel>
        <TabPanel value='trades'>
          <ToolsTable
            tools={data.tools}
            tierBonus={data.tierBonus}
            onChange={onToolsChange}
            readOnly={!editing}
          />
        </TabPanel>
        <TabPanel value='attacks'>
          <AttacksTable
            attacks={data.attacks}
            onChange={onAttacksChange}
            readOnly={!editing}
          />
        </TabPanel>
        <TabPanel value='notes'>
          <NotesSection
            values={{
              wants: data.wants,
              fears: data.fears,
              virtues: data.virtues,
              flaws: data.flaws,
              bonds: data.bonds,
              notes: data.notes,
            }}
            onChange={onNotesChange}
            readOnly={!editing}
          />
        </TabPanel>
      </Tabs>

      {boonShards.length > 0 && (
        <section aria-label={t('ariaSelectedBoons')}>
          <h3 className={styles.sectionTitle}>{t('boons')}</h3>
          <div className={styles.chipCloud}>
            {boonShards.map((shard) => (
              <ShardChip key={shard.id} shard={shard} color='primary' />
            ))}
          </div>
        </section>
      )}

      {featShards.length > 0 && (
        <section aria-label={t('ariaSelectedFeats')}>
          <h3 className={styles.sectionTitle}>{t('tabFeats')}</h3>
          <div className={styles.chipCloud}>
            {featShards.map((shard) => (
              <ShardChip key={shard.id} shard={shard} />
            ))}
          </div>
        </section>
      )}

      {featureShards.length > 0 && (
        <section aria-label={t('ariaSelectedFeatures')}>
          <h3 className={styles.sectionTitle}>{t('features')}</h3>
          <div className={styles.chipCloud}>
            {featureShards.map((shard) => (
              <ShardChip key={shard.id} shard={shard} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
