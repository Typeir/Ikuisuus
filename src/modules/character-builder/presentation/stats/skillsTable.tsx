/**
 * @fileoverview Skills Table Component
 * @description Renders a full skills table with proficiency toggles, ability modifier,
 * and total bonus per skill. Each row can be clicked to cycle proficiency level.
 *
 * @module lib/components/characterSheet/skillsTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterSkill, TierLevel } from '@/lib/types/character';
import { computeSkillBonus, updateItemTier } from '@/modules/character-builder/lib/utils/proficiencyUtils';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import tbl from '@/styles/tables.module.scss';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import profRowStyles from '../CharacterSheet/proficiencyRow.module.scss';
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
 */
export interface SkillsTableProps {
  skills: CharacterSkill[];
  abilityScores: Record<string, number>;
  tierBonus: number;
  onChange: (skills: CharacterSkill[]) => void;
  readOnly?: boolean;
}

/**
 * Full skills table with proficiency cycling and computed bonuses.
 * Clicking a skill row cycles: none → proficient → expert → none.
 *
 * @component
 * @param {SkillsTableProps} props - Component props
 * @returns {JSX.Element} Rendered skills table
 */
export const SkillsTableImpl: React.FC<SkillsTableProps> = ({
  skills,
  abilityScores,
  tierBonus,
  onChange,
  readOnly = false,
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
          const bonus = computeSkillBonus(skill, abilityScores, tierBonus);
          const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
          return (
            <tr
              key={`skill-${i}`}
              className={profRowStyles[`prof-${skill.tier}`]}>
              <td>
                {t(skill.name)}
                <span className={styles.abilityTagInline}>
                  {skill.ability.toUpperCase()}
                </span>
              </td>
              <td className={`${styles.abilityTag} ${styles.abilityCol}`}>
                {skill.ability.toUpperCase()}
              </td>
              <td aria-label={t('ariaTierTrack')}>
                <ProficiencyTrack
                  currentProficiency={skill.tier}
                  onChange={(level) => handleSkillProficiencyChange(i, level)}
                  readOnly={readOnly}
                  itemName={skill.name}
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
