/**
 * @fileoverview Overview Tab
 * @description Two-column overview: combat stats / skills / tools on the left;
 * attacks, selected feature chips, and notes on the right.
 *
 * Responsible for deriving tier bonus from total vocation level and
 * appending new hit die roll entries when a level-up is detected.
 *
 * @module lib/components/characterSheet/tabs/overviewTab
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Tab, TabList, TabPanel, Tabs } from '@/lib/components/ui/tabs';
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
import { ShardChip } from '@/modules/character-builder/presentation/shards/shardChip';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { NotesSection } from '../notes/notesSection';
import { AttacksTable } from '../stats/attacksTable';
import { SkillsTable } from '../stats/skillsTable';
import { ToolsTable } from '../stats/toolsTable';
import styles from './tabs.module.scss';

/** Overview section tab value on phone layouts. */
type OverviewSection = 'skills' | 'trades' | 'attacks' | 'notes';

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
  const featureShards: CharacterShard[] = data.vocations.flatMap((v) => [
    ...v.vocationFeatures.filter(
      (s) => s.level === undefined || s.level <= v.level,
    ),
    ...v.specializationFeatures.filter(
      (s) => s.level === undefined || s.level <= v.level,
    ),
  ]);
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

      /* Backfill every level from 1 rather than diffing against the previous
         render — levels assigned while this tab was unmounted would otherwise
         never enter the log (the ref initialises to the current state on
         mount, so the diff sees no change). `alreadyLogged` dedupes. */
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

      /* Idempotent prune of entries beyond the current level — same
         unmounted-diff blindness applies to level decreases. */
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
    onChange(patch);
  }, [data, onChange]);

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

  const conMod = computeAbilityModifier(data.abilityScores.con);
  const isMobile = useIsMobileViewport();
  const [section, setSection] = useState<OverviewSection>('skills');

  if (isMobile === true) {
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
              onChange={handleSkillsChange}
              readOnly={!editing}
            />
          </TabPanel>
          <TabPanel value='trades'>
            <ToolsTable
              tools={data.tools}
              tierBonus={data.tierBonus}
              onChange={handleToolsChange}
              readOnly={!editing}
            />
          </TabPanel>
          <TabPanel value='attacks'>
            <AttacksTable
              attacks={data.attacks}
              onChange={handleAttacksChange}
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
              onChange={handleNotesChange}
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
  }

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        <div className={styles.skillsToolsRow}>
          <SkillsTable
            skills={data.skills}
            abilityScores={data.abilityScores}
            tierBonus={data.tierBonus}
            onChange={handleSkillsChange}
            readOnly={!editing}
          />
          <ToolsTable
            tools={data.tools}
            tierBonus={data.tierBonus}
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
