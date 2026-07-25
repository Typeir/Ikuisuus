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
import { deriveGrantFloors } from '@/modules/character-builder/lib/utils/grants';
import { deriveProficiencyHints } from '@/modules/character-builder/lib/utils/proficiencyBudget';
import { ShardChip } from '@/modules/character-builder/presentation/shards/shardChip';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { UnassignedChips } from '../atoms/unassignedChips';
import { NotesSection } from '../notes/notesSection';
import { AttacksTable } from '../stats/attacksTable';
import { SkillsTable } from '../stats/skillsTable';
import { ToolsTable } from '../stats/toolsTable';
import styles from './tabs.module.scss';

/** Benefit categories the overview skill/trade tables account for. */
const SKILL_TABLE_CATEGORIES = ['skill', 'trade'] as const;

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
 * @param {CharacterSheetType} props.data - Active character data
 * @param {boolean} props.editing - Whether edit mode is active
 * @param {(patch: Partial<CharacterSheetType>) => void} props.onChange - Patch callback
 * @param {(skills: CharacterSheetType['skills']) => void} props.onSkillsChange - Skills patch
 * @param {(tools: CharacterSheetType['tools']) => void} props.onToolsChange - Tools patch
 * @param {(attacks: CharacterSheetType['attacks']) => void} props.onAttacksChange - Attacks patch
 * @param {(fields: Partial<CharacterSheetType>) => void} props.onNotesChange - Notes patch
 * @param {CharacterShard[]} props.boonShards - Selected boon shards
 * @param {CharacterShard[]} props.featShards - Selected feat shards
 * @param {CharacterShard[]} props.featureShards - Unlocked vocation/spec features
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
  const grantFloors = useMemo(() => deriveGrantFloors(data), [data]);
  const hints = useMemo(() => deriveProficiencyHints(data), [data]);

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
          <div className={styles.chipAnchor}>
            <UnassignedChips
              character={data}
              categories={SKILL_TABLE_CATEGORIES}
            />
            <SkillsTable
              skills={data.skills}
              abilityScores={data.abilityScores}
              tierBonus={data.tierBonus}
              onChange={onSkillsChange}
              readOnly={!editing}
              grantFloors={grantFloors.skills}
              hintSet={hints.skills}
            />
            {hints.skills.size > 0 && (
              <p className={styles.hintLegend}>{t('hintLegend')}</p>
            )}
          </div>
        </TabPanel>
        <TabPanel value='trades'>
          <ToolsTable
            tools={data.tools}
            tierBonus={data.tierBonus}
            onChange={onToolsChange}
            readOnly={!editing}
            grantFloors={grantFloors.tools}
            hintSet={hints.trades}
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
