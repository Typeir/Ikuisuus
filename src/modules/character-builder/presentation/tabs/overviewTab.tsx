/**
 * @fileoverview Overview Tab
 * @description Two-column overview: combat stats / skills / tools on the left;
 * attacks, selected feature chips, and notes on the right. Also hosts the
 * hit-dice sync effect that keeps the roll log, tier bonus, and hpMax in step
 * with the character's vocations and level.
 *
 * @module lib/components/characterSheet/tabs/overviewTab
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useIsMobileViewport } from '@/lib/hooks/useMediaQuery';
import type {
    CharacterShard,
    CharacterSheet as CharacterSheetType,
} from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { getTotalCharacterLevel } from '@/modules/character-builder/lib/utils/characterDerivation';
import {
    computeAbilityModifier,
    computeTierBonus,
} from '@/modules/character-builder/lib/utils/characterStorage';
import { deriveGrantFloors } from '@/modules/character-builder/lib/utils/grants';
import { deriveProficiencyHints } from '@/modules/character-builder/lib/utils/proficiencyBudget';
import { recalculateHpMax } from '@/modules/character-builder/lib/utils/hitDiceUtils';
import { ShardChip } from '@/modules/character-builder/presentation/shards/shardChip';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo } from 'react';
import { NotesSection } from '../notes/notesSection';
import { AttacksTable } from '../stats/attacksTable';
import { UnassignedChips } from '../atoms/unassignedChips';
import { GrantedProficiencies } from '../stats/grantedProficiencies';
import { SkillsTable } from '../stats/skillsTable';
import { ToolsTable } from '../stats/toolsTable';
import { MobileOverviewTab } from './mobileOverviewTab';
import styles from './tabs.module.scss';

/** Benefit categories the overview skill/trade tables account for. */
const SKILL_TABLE_CATEGORIES = ['skill', 'trade'] as const;

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
 * @param {CharacterSheetType} props.data - Active character data
 * @param {boolean} props.editing - Whether edit mode is active
 * @param {(patch: Partial<CharacterSheetType>) => void} props.onChange - Patch the draft
 * @param {string} [props.locale=en] - Content locale (default `en`)
 * @returns {JSX.Element} Rendered tab body
 */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  editing,
  onChange,
  locale = 'en',
}) => {
  const t = useTranslations('characterSheet');
  const boonShards: CharacterShard[] = data.selectedBoons;
  const featShards: CharacterShard[] = data.selectedFeats ?? [];
  const totalLevel = getTotalCharacterLevel(data);
  const featureShards: CharacterShard[] = data.vocations.flatMap((v) => [
    ...v.vocationFeatures.filter(
      (s) => s.level === undefined || s.level <= v.level,
    ),
    ...v.specializationFeatures.filter(
      (s) => s.level === undefined || s.level <= v.level,
    ),
  ]);

  /**
   * Syncs the hit-dice log, tier bonus, and hpMax with the current vocations
   * and levels. Backfills a roll entry for every vocation level from 1 (diffing
   * against the previous render would miss levels assigned while this tab was
   * unmounted; `alreadyLogged` dedupes), prunes (idempotent) entries beyond the
   * current level or for removed vocations, derives the tier bonus, and — only
   * when entries were pruned — recalculates hpMax from the surviving log so HP
   * confirmed against a removed level leaves no phantom value.
   */
  useEffect(() => {
    const curr = data.vocations;

    const totalLevel = getTotalCharacterLevel(data);
    const derivedPb = computeTierBonus(totalLevel);
    const pbChanged = derivedPb !== data.tierBonus;

    const newEntries: HitDieRollEntry[] = [];
    const conMod = computeAbilityModifier(data.abilityScores.con);
    let updatedLog = [...(data.hitDiceLog ?? [])];

    for (const currEntry of curr) {
      if (!currEntry.slug) continue;
      const currLevel = currEntry.level ?? 1;

      for (let li = 1; li <= currLevel; li++) {
        const id = `${currEntry.slug}-${li}`;
        const alreadyLogged = updatedLog.some((e) => e.id === id);
        if (!alreadyLogged) {
          newEntries.push({
            id,
            vocSlug: currEntry.slug,
            vocTitle: currEntry.title,
            dieType: (currEntry.hitDie ?? '').replace(/^d/i, '') || '?',
            levelIndex: li,
            result: null,
            conMod,
            addedToHp: false,
          });
        }
      }

      updatedLog = updatedLog.filter((e) => {
        if (e.vocSlug !== currEntry.slug) return true;
        return e.levelIndex <= currLevel;
      });
    }

    const activeSlugs = new Set(curr.filter((v) => v.slug).map((v) => v.slug));
    updatedLog = updatedLog.filter((e) => activeSlugs.has(e.vocSlug));

    const logChanged = updatedLog.length !== (data.hitDiceLog ?? []).length;

    if (!pbChanged && newEntries.length === 0 && !logChanged) return;

    const patch: Partial<CharacterSheetType> = {};
    if (pbChanged) patch.tierBonus = derivedPb;
    if (newEntries.length > 0 || logChanged) {
      patch.hitDiceLog =
        newEntries.length > 0 ? [...updatedLog, ...newEntries] : updatedLog;
    }
    if (logChanged) {
      const nextHpMax = recalculateHpMax(patch.hitDiceLog ?? updatedLog);
      if (nextHpMax !== (data.hpMax ?? 0)) patch.hpMax = nextHpMax;
    }
    onChange(patch);
  }, [data, onChange]);

  /**
   * Patches the character's skill list.
   *
   * @param {CharacterSheetType['skills']} skills - Updated skill entries
   */
  const handleSkillsChange = useCallback(
    (skills: CharacterSheetType['skills']) => onChange({ skills }),
    [onChange],
  );
  /**
   * Patches the character's tool list.
   *
   * @param {CharacterSheetType['tools']} tools - Updated tool entries
   */
  const handleToolsChange = useCallback(
    (tools: CharacterSheetType['tools']) => onChange({ tools }),
    [onChange],
  );
  /**
   * Patches the character's attacks list.
   *
   * @param {CharacterSheetType['attacks']} attacks - Updated attack entries
   */
  const handleAttacksChange = useCallback(
    (attacks: CharacterSheetType['attacks']) => onChange({ attacks }),
    [onChange],
  );
  /**
   * Patches the character's notes/identity prose fields.
   *
   * @param {Partial<CharacterSheetType>} fields - Partial patch of note fields
   */
  const handleNotesChange = useCallback(
    (fields: Partial<CharacterSheetType>) => onChange(fields),
    [onChange],
  );

  const conMod = computeAbilityModifier(data.abilityScores.con);
  const grantFloors = useMemo(() => deriveGrantFloors(data), [data]);
  const hints = useMemo(() => deriveProficiencyHints(data), [data]);
  const isMobile = useIsMobileViewport();

  if (isMobile === true) {
    return (
      <MobileOverviewTab
        data={data}
        editing={editing}
        onChange={onChange}
        onSkillsChange={handleSkillsChange}
        onToolsChange={handleToolsChange}
        onAttacksChange={handleAttacksChange}
        onNotesChange={handleNotesChange}
        boonShards={boonShards}
        featShards={featShards}
        featureShards={featureShards}
      />
    );
  }

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        <GrantedProficiencies data={data} />
        <div className={styles.skillsToolsRow}>
          <UnassignedChips character={data} categories={SKILL_TABLE_CATEGORIES} />
          <SkillsTable
            skills={data.skills}
            abilityScores={data.abilityScores}
            tierBonus={data.tierBonus}
            onChange={handleSkillsChange}
            readOnly={!editing}
            grantFloors={grantFloors.skills}
            hintSet={hints.skills}
          />
          <ToolsTable
            tools={data.tools}
            tierBonus={data.tierBonus}
            onChange={handleToolsChange}
            readOnly={!editing}
            grantFloors={grantFloors.tools}
            hintSet={hints.trades}
          />
        </div>
        {hints.skills.size > 0 && (
          <p className={styles.hintLegend}>{t('hintLegend')}</p>
        )}
      </div>

      <div className={styles.column}>
        <AttacksTable
          attacks={data.attacks}
          onChange={handleAttacksChange}
          readOnly={!editing}
        />

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

        <NotesSection
          values={{
            wants: data.wants,
            fears: data.fears,
            virtues: data.virtues,
            flaws: data.flaws,
            bonds: data.bonds,
            notes: data.notes,
          }}
          onChange={handleNotesChange}
          readOnly={!editing}
        />
      </div>
    </div>
  );
};
