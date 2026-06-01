/**
 * @fileoverview Overview Tab
 * @description Two-column overview: combat stats / skills / tools on the left;
 * attacks, selected feature chips, and notes on the right.
 *
 * Responsible for deriving proficiency bonus from total vocation level and
 * appending new hit die roll entries when a level-up is detected.
 *
 * @module lib/components/characterSheet/tabs/overviewTab
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { ShardChip } from '@/lib/components/characterSheet/shards/shardChip';
import type {
    CharacterShard,
    CharacterSheet as CharacterSheetType,
    VocationEntry,
} from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { getTotalCharacterLevel } from '@/lib/utils/characterDerivation';
import {
    computeAbilityModifier,
    computeProficiencyBonus,
} from '@/lib/utils/characterStorage';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef } from 'react';
import { NotesSection } from '../notes/notesSection';
import { AttacksTable } from '../stats/attacksTable';
import { CombatStatsRow } from '../stats/combatStatsRow';
import { SkillsTable } from '../stats/skillsTable';
import { ToolsTable } from '../stats/toolsTable';
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
  const boonShards: CharacterShard[] = data.selectedBoons;
  const featShards: CharacterShard[] = data.selectedFeats ?? [];
  const totalLevel = getTotalCharacterLevel(data);
  const featureShards: CharacterShard[] = data.vocations
    .flatMap((v) => [...v.vocationFeatures, ...v.specializationFeatures])
    .filter((s) => s.level === undefined || s.level <= totalLevel);
  const prevVocationsRef = useRef<VocationEntry[]>(data.vocations);

  useEffect(() => {
    const prev = prevVocationsRef.current;
    const curr = data.vocations;
    prevVocationsRef.current = curr;

    const totalLevel = getTotalCharacterLevel(data);
    const derivedPb = computeProficiencyBonus(totalLevel);
    const pbChanged = derivedPb !== data.proficiencyBonus;

    const newEntries: HitDieRollEntry[] = [];
    const conMod = computeAbilityModifier(data.abilityScores.con);

    for (const currEntry of curr) {
      if (!currEntry.slug) continue;
      const prevEntry = prev.find((p) => p.slug === currEntry.slug);
      const prevLevel = prevEntry?.level ?? 0;
      const currLevel = currEntry.level ?? 1;
      if (currLevel > prevLevel) {
        for (let li = prevLevel + 1; li <= currLevel; li++) {
          const id = `${currEntry.slug}-${li}`;
          const alreadyLogged = (data.hitDiceLog ?? []).some(
            (e) => e.id === id,
          );
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
      }
    }

    if (!pbChanged && newEntries.length === 0) return;

    const patch: Partial<CharacterSheetType> = {};
    if (pbChanged) patch.proficiencyBonus = derivedPb;
    if (newEntries.length > 0) {
      patch.hitDiceLog = [...(data.hitDiceLog ?? []), ...newEntries];
    }
    onChange(patch);
  }, [
    data,
    onChange,
  ]);

  const handleSkillsChange = useCallback(
    (skills: CharacterSheetType['skills']) => onChange({ skills }),
    [onChange],
  );
  const handleToolsChange = useCallback(
    (tools: CharacterSheetType['tools']) => onChange({ tools }),
    [onChange],
  );
  const handleAttacksChange = useCallback(
    (attacks: CharacterSheetType['attacks']) => onChange({ attacks }),
    [onChange],
  );
  const handleNotesChange = useCallback(
    (fields: Partial<CharacterSheetType>) => onChange(fields),
    [onChange],
  );
  const handleHitDiceCommit = useCallback(
    (updatedLog: HitDieRollEntry[], hpDelta: number) => {
      onChange({
        hitDiceLog: updatedLog,
        hpMax: (data.hpMax ?? 0) + hpDelta,
      });
    },
    [onChange, data.hpMax],
  );

  const conMod = computeAbilityModifier(data.abilityScores.con);

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
          bloodlineSpeeds={data.bloodlineSpeeds ?? []}
          proficiencyBonus={data.proficiencyBonus}
          vocations={data.vocations}
          hitDiceLog={data.hitDiceLog ?? []}
          conMod={conMod}
          onHitDiceCommit={handleHitDiceCommit}
        />
        <div className={styles.skillsToolsRow}>
          <SkillsTable
            skills={data.skills}
            abilityScores={data.abilityScores}
            proficiencyBonus={data.proficiencyBonus}
            onChange={handleSkillsChange}
            readOnly={!editing}
          />
          <ToolsTable
            tools={data.tools}
            proficiencyBonus={data.proficiencyBonus}
            onChange={handleToolsChange}
            readOnly={!editing}
          />
        </div>
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
            background: data.background,
            personality: data.personality,
            ideals: data.ideals,
            bonds: data.bonds,
            flaws: data.flaws,
            notes: data.notes,
          }}
          onChange={handleNotesChange}
          readOnly={!editing}
        />
      </div>
    </div>
  );
};
