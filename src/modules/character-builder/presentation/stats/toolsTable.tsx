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
import { computeToolBonus, updateItemProficiency } from '@/modules/character-builder/lib/utils/proficiencyUtils';
import { useTranslations } from 'next-intl';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import profRowStyles from '../CharacterSheet/proficiencyRow.module.scss';
import { ProficiencyTrack } from '../components/ProficiencyTrack';

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

  const handleToolProficiencyChange = (toolIndex: number, newProficiency: ProficiencyLevel): void => {
    if (readOnly) return;
    onChange(updateItemProficiency(tools, toolIndex, newProficiency));
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
          const bonus = computeToolBonus(tool.proficiency, proficiencyBonus);
          const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
          return (
            <tr
              key={`tool-${i}`}
              className={profRowStyles[`prof-${tool.proficiency}`]}>
              <td>{tTools(tool.name.replace('tools.', ''))}</td>
              <td aria-label={t('ariaProfTrack')}>
                <ProficiencyTrack
                  currentProficiency={tool.proficiency}
                  onChange={(level) => handleToolProficiencyChange(i, level)}
                  readOnly={readOnly}
                  itemName={tool.name}
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
