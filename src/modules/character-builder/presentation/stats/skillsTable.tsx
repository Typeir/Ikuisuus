/**
 * @fileoverview Skills Table Component
 * @description Renders a full skills table with proficiency toggles, ability modifier,
 * and total bonus per skill. Each row can be clicked to cycle proficiency level.
 *
 * @module modules/character-builder/presentation/stats/skillsTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterSkill, TierLevel } from '@/lib/types/character';
import { formatModifier } from '@/lib/utils/formatModifier';
import { higherTier } from '@/modules/character-builder/lib/utils/grants';
import { computeSkillBonus, updateItemTier } from '@/modules/character-builder/lib/utils/proficiencyUtils';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import tbl from '@/styles/tables.module.scss';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import profRowStyles from '../CharacterSheet/proficiencyRow.module.scss';
import { HintMarker } from '../atoms/hintMarker';
import { ProficiencyTrack } from '../components/ProficiencyTrack';

/**
 * Props for the SkillsTable component.
 *
 * @interface SkillsTableProps
 * @property {CharacterSkill[]} skills - Full list of character skills
 * @property {Record<string, number>} abilityScores - Map of ability key → raw score
 * @property {number} tierBonus - Current tier bonus
 * @property {(skills: CharacterSkill[]) => void} onChange - Callback when proficiency changes
 * @property {boolean} [readOnly] - When true, proficiency toggles are disabled
 * @property {Record<string, TierLevel>} [grantFloors] - Granted floor tier per skill i18n name; the row shows `higherTier(manual, floor)`
 * @property {ReadonlySet<string>} [hintSet] - Skill row-keys the vocation offers as free picks; each such row shows an informational hint marker
 */
export interface SkillsTableProps {
  skills: CharacterSkill[];
  abilityScores: Record<string, number>;
  tierBonus: number;
  onChange: (skills: CharacterSkill[]) => void;
  readOnly?: boolean;
  grantFloors?: Record<string, TierLevel>;
  hintSet?: ReadonlySet<string>;
}

/**
 * Full skills table with proficiency cycling and computed bonuses.
 * Clicking a skill row cycles: none → proficient → expert → none.
 *
 * @component
 * @param {SkillsTableProps} props - Component props
 * @param {CharacterSkill[]} props.skills - Full list of character skills
 * @param {Record<string, number>} props.abilityScores - Map of ability key → raw score
 * @param {number} props.tierBonus - Current tier bonus
 * @param {(skills: CharacterSkill[]) => void} props.onChange - Callback when proficiency changes
 * @param {boolean} [props.readOnly=false] - When true, proficiency toggles are disabled
 * @param {Record<string, TierLevel>} [props.grantFloors] - Granted floor tier per skill i18n name; the row shows `higherTier(manual, floor)`
 * @param {ReadonlySet<string>} [props.hintSet] - Skill row-keys the vocation offers as free picks; each such row shows an informational hint marker
 * @returns {JSX.Element} Rendered skills table
 */
export const SkillsTableImpl: React.FC<SkillsTableProps> = ({
  skills,
  abilityScores,
  tierBonus,
  onChange,
  readOnly = false,
  grantFloors,
  hintSet,
}) => {
  const t = useTranslations('characterSheet');

  const handleSkillProficiencyChange = (
    skillIndex: number,
    newTier: TierLevel,
  ) => {
    if (readOnly) return;
    onChange(updateItemTier(skills, skillIndex, newTier));
  };

  return (
    <table
      className={`${tbl.dataTable} ${tbl.fixed}`}
      aria-label={t('ariaSkillsTable')}>
      <thead>
        <tr>
          <th scope='col'>{t('colSkill')}</th>
          <th scope='col' className={styles.abilityCol}>
            {t('colAbility')}
          </th>
          <th scope='col'>{t('colLevel')}</th>
          <th scope='col'>{t('colBonus')}</th>
        </tr>
      </thead>
      <tbody>
        {skills.map((skill, i) => {
          const floor = grantFloors?.[skill.name] ?? 'none';
          const effectiveTier = higherTier(skill.tier, floor);
          const bonus = computeSkillBonus(
            { ...skill, tier: effectiveTier },
            abilityScores,
            tierBonus,
          );
          const bonusStr = formatModifier(bonus);
          return (
            <tr
              key={`skill-${i}`}
              className={profRowStyles[`prof-${effectiveTier}`]}>
              <td>
                {t(skill.name)}
                <HintMarker show={hintSet?.has(skill.name) ?? false} />
                <span className={styles.abilityTagInline}>
                  {skill.ability.toUpperCase()}
                </span>
              </td>
              <td className={`${styles.abilityTag} ${styles.abilityCol}`}>
                {skill.ability.toUpperCase()}
              </td>
              <td aria-label={t('ariaTierTrack')}>
                <ProficiencyTrack
                  currentProficiency={effectiveTier}
                  onChange={(level) => handleSkillProficiencyChange(i, level)}
                  readOnly={readOnly}
                  itemName={skill.name}
                  grantedFloor={floor}
                />
              </td>
              <td>{bonusStr}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

/**
 * Memoized `SkillsTable` export. Re-renders only when one of its props
 * changes by reference (skills array, abilityScores map, tierBonus,
 * onChange callback, readOnly flag).
 */
export const SkillsTable = memo(SkillsTableImpl);
