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

import type { JSX } from 'react';
import { Tooltip } from '@/lib/components/ui';
import type { TierLevel } from '@/lib/types/character';
import {
    TIER_CYCLE,
    TIER_LABELS,
    TIER_LEVELS,
} from '@/modules/character-builder/lib/utils/characterStorage';
import profTrackStyles from '../CharacterSheet/proficiencyTrack.module.scss';

/**
 * Props for ProficiencyTrack component.
 *
 * @interface ProficiencyTrackProps
 * @property {TierLevel} currentProficiency - Effective proficiency level (already the max of manual and any granted floor)
 * @property {(level: TierLevel) => void} onChange - Fired when pip clicked
 * @property {boolean} [readOnly=false] - If true, disables pip clicks
 * @property {string} [itemName='item'] - Name for tooltip key (e.g., skill name)
 * @property {TierLevel} [grantedFloor='none'] - Tier auto-granted by active features; those pips render in the granted style and cannot be toggled off
 */
interface ProficiencyTrackProps {
  currentProficiency: TierLevel;
  onChange: (level: TierLevel) => void;
  readOnly?: boolean;
  itemName?: string;
  grantedFloor?: TierLevel;
}

/**
 * ProficiencyTrack component.
 *
 * @component
 * @param {ProficiencyTrackProps} props - Component props
 * @param {TierLevel} props.currentProficiency - Effective proficiency level (already the max of manual and any granted floor)
 * @param {(level: TierLevel) => void} props.onChange - Fired when pip clicked
 * @param {boolean} [props.readOnly=false] - If true, disables pip clicks
 * @param {string} [props.itemName='item'] - Name for tooltip key (e.g., skill name)
 * @param {TierLevel} [props.grantedFloor='none'] - Tier auto-granted by active features; those pips render in the granted style and cannot be toggled off
 * @returns {JSX.Element} - Rendered proficiency pip track
 */
export function ProficiencyTrack({
  currentProficiency,
  onChange,
  readOnly = false,
  itemName = 'item',
  grantedFloor = 'none',
}: ProficiencyTrackProps): JSX.Element {
  const levelIndex = TIER_CYCLE.indexOf(currentProficiency);
  const floorIndex = TIER_CYCLE.indexOf(grantedFloor);

  const handlePipClick = (level: TierLevel): void => {
    if (readOnly) return;
    const newLevel = getToggledLevel(level, currentProficiency);
    onChange(newLevel);
  };

  /**
   * Toggles proficiency level. If clicked level matches current, returns 'none'.
   * Otherwise returns the clicked level.
   *
   * @param {TierLevel} clickedLevel - Level pip that was clicked
   * @param {TierLevel} current - Current proficiency level
   * @returns {TierLevel} - New proficiency level
   */
  const getToggledLevel = (
    clickedLevel: TierLevel,
    current: TierLevel,
  ): TierLevel => (clickedLevel === current ? 'none' : clickedLevel);

  return (
    <span className={profTrackStyles.profTrack} aria-hidden='true'>
      {TIER_LEVELS.map((level, idx) => {
        const isActive = idx < levelIndex;
        const isGranted = idx < floorIndex;
        const label = TIER_LABELS[level];
        const dotClass = isGranted
          ? 'trackDot-granted'
          : isActive
            ? 'trackDot-filled'
            : 'trackDot-empty';
        return (
          <Tooltip
            key={`${itemName}-pip-${idx}`}
            content={label.tooltip}
            placement='top'
            showClickIcon={false}>
            <button
              type='button'
              disabled={readOnly || isGranted}
              className={profTrackStyles[dotClass]}
              onClick={() => handlePipClick(level)}
              aria-label={`${label.label} (${label.tooltip})`}
            />
          </Tooltip>
        );
      })}
    </span>
  );
}
