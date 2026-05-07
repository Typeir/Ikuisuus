/**
 * @fileoverview ToolsTable Component
 * @description Renders a table of tool proficiencies with cycling proficiency levels.
 * Mirrors SkillsTable but without ability scores (tools are independent).
 *
 * @module lib/components/characterSheet/toolsTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterTool, ProficiencyLevel } from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import styles from './characterSheetWidgets.module.scss';

/**
 * Props for ToolsTable component.
 *
 * @interface ToolsTableProps
 * @property {CharacterTool[]} tools - Tool list
 * @property {number} proficiencyBonus - Proficiency bonus from character level
 * @property {(tools: CharacterTool[]) => void} onChange - Fired when a tool's proficiency is clicked
 * @property {boolean} [readOnly=false] - If true, disables proficiency cycling
 */
interface ToolsTableProps {
  tools: CharacterTool[];
  proficiencyBonus: number;
  onChange: (tools: CharacterTool[]) => void;
  readOnly?: boolean;
}

/** Cycle order for proficiency levels. */
const PROFICIENCY_CYCLE: ProficiencyLevel[] = [
  'none',
  'familiarity',
  'proficient',
  'expertise',
];

/**
 * ToolsTable component.
 *
 * @component
 * @param {ToolsTableProps} props - Component props
 * @returns {JSX.Element} - Rendered tools table
 */
export function ToolsTable({
  tools,
  proficiencyBonus,
  onChange,
  readOnly = false,
}: ToolsTableProps): JSX.Element {
  const t = useTranslations('characterSheet');
  /**
   * Computes the bonus for a given tool.
   *
   * @param {CharacterTool} tool - The tool to compute bonus for
   * @returns {number} - Total bonus (0 + proficiency bonus if proficient)
   */
  const computeBonus = (tool: CharacterTool): number => {
    if (tool.proficiency === 'expertise') return proficiencyBonus * 2;
    if (tool.proficiency === 'proficient') return proficiencyBonus;
    if (tool.proficiency === 'familiarity')
      return Math.floor(proficiencyBonus / 2);
    return 0;
  };

  /**
   * Handles tool proficiency cycling via row click.
   *
   * @param {number} index - Index of tool to toggle
   * @returns {void}
   */
  const handleToggle = (index: number): void => {
    if (readOnly) return;
    const updatedTools = [...tools];
    const currentProf = updatedTools[index].proficiency;
    const nextIndex =
      (PROFICIENCY_CYCLE.indexOf(currentProf) + 1) % PROFICIENCY_CYCLE.length;
    updatedTools[index].proficiency = PROFICIENCY_CYCLE[nextIndex];
    onChange(updatedTools);
  };

  return (
    <table className={styles.skillsTable} aria-label={t('ariaToolsTable')}>
      <thead>
        <tr>
          <th scope='col'>{t('colTool')}</th>
          <th scope='col'>{t('colFamiliarity')}</th>
          <th scope='col'>{t('colProficiency')}</th>
          <th scope='col'>{t('colExpertise')}</th>
          <th scope='col'>{t('colBonus')}</th>
        </tr>
      </thead>
      <tbody>
        {tools.map((tool, i) => {
          const bonus = computeBonus(tool);
          const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
          return (
            <tr
              key={tool.name}
              className={styles[`prof-${tool.proficiency}`]}
              onClick={() => handleToggle(i)}
              style={{ cursor: readOnly ? 'default' : 'pointer' }}>
              <td>{tool.name}</td>
              <td aria-label={t('ariaFamiliarityLevel')}>
                <span
                  className={
                    styles[
                      `profDot-${tool.proficiency === 'familiarity' ? 'filled' : 'empty'}`
                    ]
                  }
                  aria-hidden='true'
                />
              </td>
              <td aria-label={t('ariaProficiencyLevel')}>
                <span
                  className={
                    styles[
                      `profDot-${tool.proficiency === 'proficient' ? 'filled' : 'empty'}`
                    ]
                  }
                  aria-hidden='true'
                />
              </td>
              <td aria-label={t('ariaExpertiseLevel')}>
                <span
                  className={
                    styles[
                      `profDot-${tool.proficiency === 'expertise' ? 'filled' : 'empty'}`
                    ]
                  }
                  aria-hidden='true'
                />
              </td>
              <td>{bonusStr}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
