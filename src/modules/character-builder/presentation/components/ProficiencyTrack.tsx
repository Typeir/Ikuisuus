/**
 * @fileoverview ProficiencyTrack component
 * @description Reusable pip track for proficiency level selection. Renders 4 pips,
 * toggles on click: if current level clicked, sets to 'none'; else sets to clicked level.
 *
 * @module modules/character-builder/presentation/components/ProficiencyTrack
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { Tooltip } from '@/lib/components/ui';
import type { ProficiencyLevel } from '@/lib/types/character';
import {
    PROFICIENCY_CYCLE,
    PROFICIENCY_LABELS,
    PROFICIENCY_LEVELS,
} from '@/modules/character-builder/lib/utils/characterStorage';
import profTrackStyles from '../CharacterSheet/proficiencyTrack.module.scss';

/**
 * Props for ProficiencyTrack component.
 *
 * @interface ProficiencyTrackProps
 * @property {ProficiencyLevel} currentProficiency - Current proficiency level
 * @property {(level: ProficiencyLevel) => void} onChange - Fired when pip clicked
 * @property {boolean} [readOnly=false] - If true, disables pip clicks
 * @property {string} [itemName='item'] - Name for tooltip key (e.g., skill name)
 */
interface ProficiencyTrackProps {
  currentProficiency: ProficiencyLevel;
  onChange: (level: ProficiencyLevel) => void;
  readOnly?: boolean;
  itemName?: string;
}

/**
 * ProficiencyTrack component.
 *
 * @component
 * @param {ProficiencyTrackProps} props - Component props
 * @returns {JSX.Element} - Rendered proficiency pip track
 */
export function ProficiencyTrack({
  currentProficiency,
  onChange,
  readOnly = false,
  itemName = 'item',
}: ProficiencyTrackProps): JSX.Element {
  const levelIndex = PROFICIENCY_CYCLE.indexOf(currentProficiency);

  const handlePipClick = (level: ProficiencyLevel): void => {
    if (readOnly) return;
    const newLevel = getToggledLevel(level, currentProficiency);
    onChange(newLevel);
  };

  /**
   * Toggles proficiency level. If clicked level matches current, returns 'none'.
   * Otherwise returns the clicked level.
   *
   * @param {ProficiencyLevel} clickedLevel - Level pip that was clicked
   * @param {ProficiencyLevel} current - Current proficiency level
   * @returns {ProficiencyLevel} - New proficiency level
   */
  const getToggledLevel = (
    clickedLevel: ProficiencyLevel,
    current: ProficiencyLevel,
  ): ProficiencyLevel => (clickedLevel === current ? 'none' : clickedLevel);

  return (
    <span className={profTrackStyles.profTrack} aria-hidden='true'>
      {PROFICIENCY_LEVELS.map((level, idx) => {
        const isActive = idx < levelIndex;
        const label = PROFICIENCY_LABELS[level];
        return (
          <Tooltip
            key={`${itemName}-pip-${idx}`}
            content={label.tooltip}
            placement='top'
            showClickIcon={false}>
            <button
              type='button'
              disabled={readOnly}
              className={
                profTrackStyles[isActive ? 'trackDot-filled' : 'trackDot-empty']
              }
              onClick={() => handlePipClick(level)}
              aria-label={`${label.label} (${label.tooltip})`}
            />
          </Tooltip>
        );
      })}
    </span>
  );
}
