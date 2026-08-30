/**
 * @fileoverview Buff list editor component.
 * @description Renders a text list of buffs with add/remove controls.
 *
 * @module buffListEditor
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side state and callbacks
 * @requires ../creatureRow.module.scss Shared component styles
 *
 * @example
 * ```tsx
 * <BuffListEditor
 *   buffs={creature.buffs}
 *   onChange={(buffs) => updateCreature({ buffs })}
 * />
 * ```
 */

'use client';

import { useCallback, useState } from 'react';
import styles from '../creatureRow.module.scss';
import { IconButton } from '@/lib/components/ui/iconButton';

/**
 * @interface BuffListEditorProps
 * @property {string[]} buffs - Current buff list
 * @property {Function} onChange - Callback when buff list changes
 * @property {boolean} [readOnly=false] - Disables editing when true
 * @property {string} [addBuffLabel] - Placeholder for input field
 * @property {string} [removeChipAriaLabel] - Accessibility label for remove button
 */
interface BuffListEditorProps {
  buffs: string[];
  onChange: (buffs: string[]) => void;
  readOnly?: boolean;
  addBuffLabel?: string;
  removeChipAriaLabel?: string;
}

/**
 * Renders buff chips with add/remove controls.
 *
 * @component
 * @param {BuffListEditorProps} props - Component props
 * @param {string[]} props.buffs - Current buff names
 * @param {(buffs: string[]) => void} props.onChange - Callback when buff list changes
 * @param {boolean} [props.readOnly] - Whether the editor is read-only
 * @param {string} [props.addBuffLabel] - Label for the add buff input
 * @param {string} [props.removeChipAriaLabel] - Aria label for remove chip buttons
 * @returns {JSX.Element} Rendered buff list with add/remove controls
 *
 * @example
 * ```tsx
 * <BuffListEditor
 *   buffs={['Haste', 'Bless']}
 *   onChange={setBuffs}
 *   readOnly={false}
 * />
 * ```
 */
export const BuffListEditor: React.FC<BuffListEditorProps> = ({
  buffs,
  onChange,
  readOnly = false,
  addBuffLabel = 'Add buff',
  removeChipAriaLabel = 'Remove buff',
}) => {
  const [newBuff, setNewBuff] = useState('');

  const handleAddBuff = useCallback(() => {
    if (!newBuff.trim()) return;
    onChange([...buffs, newBuff.trim()]);
    setNewBuff('');
  }, [newBuff, buffs, onChange]);

  const handleRemoveBuff = useCallback(
    (index: number) => {
      onChange(buffs.filter((_, i) => i !== index));
    },
    [buffs, onChange]
  );

  return (
    <>
      <div className={styles.chips}>
        {buffs.map((buff, idx) => (
          <div key={idx} className={styles.chip}>
            {buff}
            {!readOnly && (
              <IconButton
                kind='close'
                label={removeChipAriaLabel}
                onClick={() => handleRemoveBuff(idx)}
              />
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <div className={styles.addConditionContainer}>
          <input
            type='text'
            className={styles.addConditionInput}
            value={newBuff}
            onChange={(e) => setNewBuff(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddBuff()}
            placeholder={addBuffLabel}
          />
          <IconButton
            kind='add'
            size='s'
            label={addBuffLabel}
            onClick={handleAddBuff}
            className={styles.addConditionSlot}
          />
        </div>
      )}
    </>
  );
};
