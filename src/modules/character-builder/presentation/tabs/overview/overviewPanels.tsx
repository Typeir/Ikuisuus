/**
 * @fileoverview Overview Panels
 * @description The content blocks the overview is built from, each reading the
 * character straight from the active-sheet context.
 *
 * The desktop and mobile overviews show the same blocks in different
 * arrangements — two columns versus a tab strip. Keeping the blocks here means
 * the layouts hold nothing but arrangement, so a change to what a block renders
 * lands in one place instead of being mirrored between two near-identical files.
 *
 * @module modules/character-builder/presentation/tabs/overview/overviewPanels
 * @version 1.0.0
 * @author Typeir
 * @since 10.0.0
 */

'use client';

import type {
    CharacterShard,
    CharacterSheet as CharacterSheetType,
} from '@/lib/types/character';
import {
    useSheetData,
    useSheetEditing,
    useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { deriveGrantFloors } from '@/modules/character-builder/lib/utils/grants';
import { deriveProficiencyHints } from '@/modules/character-builder/lib/utils/proficiencyBudget';
import { ShardChip } from '@/modules/character-builder/presentation/shards/shardChip';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { UnassignedChips } from '../../atoms/unassignedChips';
import { NotesSection } from '../../notes/notesSection';
import { AttacksTable } from '../../stats/attacksTable';
import { SkillsTable } from '../../stats/skillsTable';
import { ToolsTable } from '../../stats/toolsTable';
import styles from '../tabs.module.scss';

/** Benefit categories the overview skill/trade tables account for. */
const SKILL_TABLE_CATEGORIES = ['skill', 'trade'] as const;

/**
 * Unassigned-benefit chips plus the skill proficiency table.
 *
 * @component
 * @returns {JSX.Element} Rendered skills block
 */
export const SkillsPanel: React.FC = () => {
  const data = useSheetData();
  const editing = useSheetEditing();
  const { patch } = useSheetMutators();
  const grantFloors = useMemo(() => deriveGrantFloors(data), [data]);
  const hints = useMemo(() => deriveProficiencyHints(data), [data]);

  const onChange = useCallback(
    (skills: CharacterSheetType['skills']) => patch({ skills }),
    [patch],
  );

  return (
    <>
      <UnassignedChips categories={SKILL_TABLE_CATEGORIES} />
      <SkillsTable
        skills={data.skills}
        abilityScores={data.abilityScores}
        tierBonus={data.tierBonus}
        onChange={onChange}
        readOnly={!editing}
        grantFloors={grantFloors.skills}
        hintSet={hints.skills}
      />
    </>
  );
};

/**
 * Trade proficiency table.
 *
 * @component
 * @returns {JSX.Element} Rendered trades block
 */
export const TradesPanel: React.FC = () => {
  const data = useSheetData();
  const editing = useSheetEditing();
  const { patch } = useSheetMutators();
  const grantFloors = useMemo(() => deriveGrantFloors(data), [data]);
  const hints = useMemo(() => deriveProficiencyHints(data), [data]);

  const onChange = useCallback(
    (tools: CharacterSheetType['tools']) => patch({ tools }),
    [patch],
  );

  return (
    <ToolsTable
      tools={data.tools}
      tierBonus={data.tierBonus}
      onChange={onChange}
      readOnly={!editing}
      grantFloors={grantFloors.tools}
      hintSet={hints.trades}
    />
  );
};

/**
 * Legend explaining the skill hint markers. Renders nothing when no skill
 * carries a hint.
 *
 * @component
 * @returns {JSX.Element | null} The legend, or null when there is nothing to explain
 */
export const HintLegend: React.FC = () => {
  const t = useTranslations('characterSheet');
  const data = useSheetData();
  const hints = useMemo(() => deriveProficiencyHints(data), [data]);

  if (hints.skills.size === 0) return null;
  return <p className={styles.hintLegend}>{t('hintLegend')}</p>;
};

/**
 * Attacks table.
 *
 * @component
 * @returns {JSX.Element} Rendered attacks block
 */
export const AttacksPanel: React.FC = () => {
  const data = useSheetData();
  const editing = useSheetEditing();
  const { patch } = useSheetMutators();

  const onChange = useCallback(
    (attacks: CharacterSheetType['attacks']) => patch({ attacks }),
    [patch],
  );

  return (
    <AttacksTable
      attacks={data.attacks}
      onChange={onChange}
      readOnly={!editing}
    />
  );
};

/**
 * Identity prose fields (wants, fears, virtues, flaws, bonds, notes).
 *
 * @component
 * @returns {JSX.Element} Rendered notes block
 */
export const NotesPanel: React.FC = () => {
  const data = useSheetData();
  const editing = useSheetEditing();
  const { patch } = useSheetMutators();

  return (
    <NotesSection
      values={{
        wants: data.wants,
        fears: data.fears,
        virtues: data.virtues,
        flaws: data.flaws,
        bonds: data.bonds,
        notes: data.notes,
      }}
      onChange={patch}
      readOnly={!editing}
    />
  );
};

/**
 * The features a character has actually unlocked: every vocation and
 * specialization feature at or below that vocation's own level.
 *
 * @function unlockedFeatureShards
 * @param {CharacterSheetType} data - Active character
 * @returns {CharacterShard[]} Unlocked feature shards across all vocations
 */
const unlockedFeatureShards = (
  data: CharacterSheetType,
): CharacterShard[] =>
  data.vocations.flatMap((v) => [
    ...v.vocationFeatures.filter(
      (s) => s.level === undefined || s.level <= v.level,
    ),
    ...v.specializationFeatures.filter(
      (s) => s.level === undefined || s.level <= v.level,
    ),
  ]);

/**
 * Chip clouds for the character's chosen boons, feats, and unlocked features.
 * Each section is omitted when it holds nothing.
 *
 * @component
 * @returns {JSX.Element} Rendered shard cloud sections
 */
export const SelectedShardClouds: React.FC = () => {
  const t = useTranslations('characterSheet');
  const data = useSheetData();

  const sections = useMemo(
    () => [
      {
        key: 'boons',
        ariaLabel: t('ariaSelectedBoons'),
        title: t('boons'),
        shards: data.selectedBoons,
        color: 'primary' as const,
      },
      {
        key: 'feats',
        ariaLabel: t('ariaSelectedFeats'),
        title: t('tabFeats'),
        shards: data.selectedFeats ?? [],
        color: undefined,
      },
      {
        key: 'features',
        ariaLabel: t('ariaSelectedFeatures'),
        title: t('features'),
        shards: unlockedFeatureShards(data),
        color: undefined,
      },
    ],
    [t, data],
  );

  return (
    <>
      {sections
        .filter((section) => section.shards.length > 0)
        .map((section) => (
          <section key={section.key} aria-label={section.ariaLabel}>
            <h3 className={styles.sectionTitle}>{section.title}</h3>
            <div className={styles.chipCloud}>
              {section.shards.map((shard) => (
                <ShardChip key={shard.id} shard={shard} color={section.color} />
              ))}
            </div>
          </section>
        ))}
    </>
  );
};
