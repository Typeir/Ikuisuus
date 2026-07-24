/**
 * @fileoverview Boon Sub-Option Selector
 * @description Radio (choose-one) or checkbox (pick-any) group for a variable-cost
 * bloodline boon's sub-options. Rendered inside a FeatureCard beneath the boon
 * toggle; changing a selection drives the boon's BP cost via the parent picker.
 *
 * @module lib/components/characterSheet/builder/boonSubOptions
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

'use client';

import type { BloodlineBoonSubOption } from '@/lib/db/content/schemas/bloodlineMetadata';
import pipStyles from '../CharacterSheet/proficiencyTrack.module.scss';
import styles from './boonSubOptions.module.scss';

/**
 * Props for the BoonSubOptions component.
 *
 * @interface BoonSubOptionsProps
 * @property {string} boonName - Parent boon name, used to scope the radio group
 * @property {BloodlineBoonSubOption[]} options - Selectable options with per-option BP cost
 * @property {'choose-one' | 'pick-any'} mode - Single-select (radio) or multi-select (checkbox)
 * @property {string[]} selected - Names of the currently chosen options
 * @property {boolean} readOnly - When true, the group is disabled
 * @property {string} bpUnitLabel - Translated BP unit label (e.g. "BP")
 * @property {(optionName: string) => void} onChange - Fired when an option is toggled
 */
export interface BoonSubOptionsProps {
  boonName: string;
  options: BloodlineBoonSubOption[];
  mode: 'choose-one' | 'pick-any';
  selected: string[];
  readOnly: boolean;
  bpUnitLabel: string;
  onChange: (optionName: string) => void;
}

/**
 * Strips `[% … %]` dice shortcodes from an effect summary for plain display.
 *
 * @param {string} text - Raw effect text
 * @returns {string} Text with shortcode wrappers removed
 */
function cleanEffect(text: string): string {
  return text.replace(/\[%\s*(.*?)\s*%\]/g, '$1');
}

/**
 * Renders the sub-option selection group for a variable-cost boon.
 *
 * @component
 * @param {BoonSubOptionsProps} props - Component props
 * @param {string} props.boonName - Parent boon name, used to scope the radio group
 * @param {BloodlineBoonSubOption[]} props.options - Selectable options with per-option BP cost
 * @param {'choose-one' | 'pick-any'} props.mode - Single-select (radio) or multi-select (checkbox)
 * @param {string[]} props.selected - Names of the currently chosen options
 * @param {boolean} props.readOnly - When true, the group is disabled
 * @param {string} props.bpUnitLabel - Translated BP unit label
 * @param {(optionName: string) => void} props.onChange - Fired when an option is toggled
 * @returns {JSX.Element} Rendered sub-option group
 */
export const BoonSubOptions: React.FC<BoonSubOptionsProps> = ({
  boonName,
  options,
  mode,
  selected,
  readOnly,
  bpUnitLabel,
  onChange,
}) => {
  const isMulti = mode === 'pick-any';

  return (
    <fieldset
      className={styles.subOptions}
      disabled={readOnly}
      role={isMulti ? 'group' : 'radiogroup'}
      aria-label={boonName}>
      {options.map((option) => {
        const isSelected = selected.includes(option.name);
        return (
          <div key={option.name} className={styles.subOption}>
            <button
              type='button'
              role={isMulti ? 'checkbox' : 'radio'}
              aria-checked={isSelected}
              aria-label={option.name}
              disabled={readOnly}
              className={
                pipStyles[isSelected ? 'trackDot-filled' : 'trackDot-empty']
              }
              onClick={() => onChange(option.name)}
            />
            <span className={styles.subOptionName}>{option.name}</span>
            <span className={styles.subOptionCost}>
              {option.bpValue} {bpUnitLabel}
            </span>
            {option.effect && (
              <span className={styles.subOptionEffect}>
                {cleanEffect(option.effect)}
              </span>
            )}
          </div>
        );
      })}
    </fieldset>
  );
};
