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

import type { CharacterSkill, ProficiencyLevel } from '@/lib/types/character';
import {
  computeAbilityModifier,
  PROFICIENCY_CYCLE,
  PROFICIENCY_LABELS,
  PROFICIENCY_LEVELS,
} from '@/modules/character-builder/lib/utils/characterStorage';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import profRowStyles from '../CharacterSheet/proficiencyRow.module.scss';
import profTrackStyles from '../CharacterSheet/proficiencyTrack.module.scss';

/**
 * Props for the SkillsTable component.
 *
 * @interface SkillsTableProps
 * @property {CharacterSkill[]} skills - Full list of character skills
 * @property {Record<string, number>} abilityScores - Map of ability key → raw score
 * @property {number} proficiencyBonus - Current proficiency bonus
 * @property {(skills: CharacterSkill[]) => void} onChange - Callback when proficiency changes
 * @property {boolean} [readOnly] - When true, proficiency toggles are disabled
 */
export interface SkillsTableProps {
  skills: CharacterSkill[];
  abilityScores: Record<string, number>;
  proficiencyBonus: number;
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
  proficiencyBonus,
  onChange,
  readOnly = false,
}) => {
  const t = useTranslations('characterSheet');

  const handlePipClick = (skillIndex: number, profLevel: ProficiencyLevel) => {
    if (readOnly) return;
    const updated = skills.map((s, i) =>
      i === skillIndex ? { ...s, proficiency: profLevel } : s,
    );
    onChange(updated);
  };

  const computeBonus = (skill: CharacterSkill): number => {
    const abilityMod = computeAbilityModifier(
      abilityScores[skill.ability] ?? 10,
    );
    if (skill.proficiency === 'savanthood')
      return abilityMod + proficiencyBonus * 3;
    if (skill.proficiency === 'expertise')
      return abilityMod + proficiencyBonus * 2;
    if (skill.proficiency === 'proficient')
      return abilityMod + proficiencyBonus;
    if (skill.proficiency === 'familiarity')
      return abilityMod + Math.floor(proficiencyBonus / 2);
    return abilityMod;
  };

  return (
    <table className={styles.skillsTable} aria-label={t('ariaSkillsTable')}>
      <thead>
        <tr>
          <th scope='col'>{t('colSkill')}</th>
          <th scope='col'>{t('colAbility')}</th>
          <th scope='col'>{t('colLevel')}</th>
          <th scope='col'>{t('colBonus')}</th>
        </tr>
      </thead>
      <tbody>
        {skills.map((skill, i) => {
          const bonus = computeBonus(skill);
          const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
          const levelIndex = PROFICIENCY_CYCLE.indexOf(skill.proficiency);
          return (
            <tr
              key={`skill-${i}`}
              className={profRowStyles[`prof-${skill.proficiency}`]}>
              <td>{t(skill.name)}</td>
              <td className={styles.abilityTag}>
                {skill.ability.toUpperCase()}
              </td>
              <td aria-label={t('ariaProfTrack')}>
                <span className={profTrackStyles.profTrack} aria-hidden='true'>
                  {PROFICIENCY_LEVELS.map((level, idx) => {
                    const isActive = idx < levelIndex;
                    const label = PROFICIENCY_LABELS[level];
                    return (
                      <button
                        key={`${skill.name}-pip-${idx}`}
                        type='button'
                        disabled={readOnly}
                        className={
                          profTrackStyles[
                            isActive ? 'trackDot-filled' : 'trackDot-empty'
                          ]
                        }
                        onClick={() => handlePipClick(i, level)}
                        title={label.tooltip}
                        aria-label={`${label.label} (${label.tooltip})`}
                      />
                    );
                  })}
                </span>
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
 * changes by reference (skills array, abilityScores map, proficiencyBonus,
 * onChange callback, readOnly flag).
 */
export const SkillsTable = memo(SkillsTableImpl);
