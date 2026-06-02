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
import {
    PROFICIENCY_CYCLE,
    PROFICIENCY_LABELS,
    PROFICIENCY_LEVELS,
} from '@/modules/character-builder/lib/utils/characterStorage';
import { useTranslations } from 'next-intl';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import profRowStyles from '../CharacterSheet/proficiencyRow.module.scss';
import profTrackStyles from '../CharacterSheet/proficiencyTrack.module.scss';

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
  const tTools = useTranslations('characterSheet.tools');

  const getToolName = (i18nKey: string): string => {
    const key = i18nKey.replace('tools.', '');
    try {
      return tTools(key);
    } catch {
      return i18nKey;
    }
  };

  /**
   * Computes the bonus for a given tool.
   *
   * @param {CharacterTool} tool - The tool to compute bonus for
   * @returns {number} - Total bonus (0 + proficiency bonus if proficient)
   */
  const computeBonus = (tool: CharacterTool): number => {
    if (tool.proficiency === 'savanthood') return proficiencyBonus * 3;
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
  const handlePipClick = (
    toolIndex: number,
    profLevel: ProficiencyLevel,
  ): void => {
    if (readOnly) return;
    const updatedTools = tools.map((t, i) =>
      i === toolIndex ? { ...t, proficiency: profLevel } : t,
    );
    onChange(updatedTools);
  };

  return (
    <table className={styles.skillsTable} aria-label={t('ariaToolsTable')}>
      <thead>
        <tr>
          <th scope='col'>{t('colTool')}</th>
          <th scope='col'>{t('colLevel')}</th>
          <th scope='col'>{t('colBonus')}</th>
        </tr>
      </thead>
      <tbody>
        {tools.map((tool, i) => {
          const bonus = computeBonus(tool);
          const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
          const levelIndex = PROFICIENCY_CYCLE.indexOf(tool.proficiency);
          return (
            <tr
              key={`tool-${i}`}
              className={profRowStyles[`prof-${tool.proficiency}`]}>
              <td>{tTools(tool.name.replace('tools.', ''))}</td>
              <td aria-label={t('ariaProfTrack')}>
                <span className={profTrackStyles.profTrack} aria-hidden='true'>
                  {PROFICIENCY_LEVELS.map((level, idx) => {
                    const isActive = idx < levelIndex;
                    const label = PROFICIENCY_LABELS[level];
                    return (
                      <button
                        key={`${tool.name}-pip-${idx}`}
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
}
