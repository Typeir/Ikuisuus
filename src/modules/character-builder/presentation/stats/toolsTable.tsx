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

import type { CharacterTool, TierLevel } from '@/lib/types/character';
import { higherTier } from '@/modules/character-builder/lib/utils/grants';
import { computeToolBonus, updateItemTier } from '@/modules/character-builder/lib/utils/proficiencyUtils';
import { useTranslations } from 'next-intl';
import tbl from '@/styles/tables.module.scss';
import profRowStyles from '../CharacterSheet/proficiencyRow.module.scss';
import { HintMarker } from '../atoms/hintMarker';
import { ProficiencyTrack } from '../components/ProficiencyTrack';

/**
 * Props for ToolsTable component.
 *
 * @interface ToolsTableProps
 * @property {CharacterTool[]} tools - Tool list
 * @property {number} tierBonus - tier bonus from character level
 * @property {(tools: CharacterTool[]) => void} onChange - Fired when a tool's proficiency is clicked
 * @property {boolean} [readOnly=false] - If true, disables proficiency cycling
 * @property {Record<string, TierLevel>} [grantFloors] - Granted floor tier per tool i18n name; the row shows `higherTier(manual, floor)`
 * @property {ReadonlySet<string>} [hintSet] - Trade row-keys the vocation offers as free picks; each such row shows an informational hint marker
 */
interface ToolsTableProps {
  tools: CharacterTool[];
  tierBonus: number;
  onChange: (tools: CharacterTool[]) => void;
  readOnly?: boolean;
  grantFloors?: Record<string, TierLevel>;
  hintSet?: ReadonlySet<string>;
}

/**
 * ToolsTable component.
 *
 * @component
 * @param {ToolsTableProps} props - Component props
 * @param {CharacterTool[]} props.tools - Tool list
 * @param {number} props.tierBonus - tier bonus from character level
 * @param {(tools: CharacterTool[]) => void} props.onChange - Fired when a tool's proficiency is clicked
 * @param {boolean} [props.readOnly=false] - If true, disables proficiency cycling
 * @param {Record<string, TierLevel>} [props.grantFloors] - Granted floor tier per tool i18n name; the row shows `higherTier(manual, floor)`
 * @param {ReadonlySet<string>} [props.hintSet] - Trade row-keys the vocation offers as free picks; each such row shows an informational hint marker
 * @returns {JSX.Element} - Rendered tools table
 */
export function ToolsTable({
  tools,
  tierBonus,
  onChange,
  readOnly = false,
  grantFloors,
  hintSet,
}: ToolsTableProps): JSX.Element {
  const t = useTranslations('characterSheet');
  const tTools = useTranslations('characterSheet.tools');

  const handleToolProficiencyChange = (toolIndex: number, newTier: TierLevel): void => {
    if (readOnly) return;
    onChange(updateItemTier(tools, toolIndex, newTier));
  };

  return (
    <table
      className={`${tbl.dataTable} ${tbl.fixed}`}
      aria-label={t('ariaToolsTable')}>
      <thead>
        <tr>
          <th scope='col'>{t('colTool')}</th>
          <th scope='col'>{t('colLevel')}</th>
          <th scope='col'>{t('colBonus')}</th>
        </tr>
      </thead>
      <tbody>
        {tools.map((tool, i) => {
          const floor = grantFloors?.[tool.name] ?? 'none';
          const effectiveTier = higherTier(tool.tier, floor);
          const bonus = computeToolBonus(effectiveTier, tierBonus);
          const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
          return (
            <tr
              key={`tool-${i}`}
              className={profRowStyles[`prof-${effectiveTier}`]}>
              <td>
                {tTools(tool.name.replace('tools.', ''))}
                <HintMarker show={hintSet?.has(tool.name) ?? false} />
              </td>
              <td aria-label={t('ariaTierTrack')}>
                <ProficiencyTrack
                  currentProficiency={effectiveTier}
                  onChange={(level) => handleToolProficiencyChange(i, level)}
                  readOnly={readOnly}
                  itemName={tool.name}
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
}
