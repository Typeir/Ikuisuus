/**
 * @fileoverview Item List Editor Component
 * @description Reusable component for managing item lists (add/remove).
 * Simple text-based list with inline input field for adding new items.
 * Used in both CreatureRow (design mode) and PlayModeCombatantRow (play mode).
 *
 * @module itemListEditor
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side state and callbacks
 * @requires ../creatureRow.module.scss Shared component styles
 *
 * @example
 * ```tsx
 * <ItemListEditor
 *   items={creature.items}
 *   onChange={(items) => updateCreature({ items })}
 * />
 * ```
 */

'use client';

import { useCallback, useState } from 'react';
import { X } from 'lucide-react';
import styles from '../creatureRow.module.scss';

/**
 * Props for ItemListEditor component
 * @interface ItemListEditorProps
 * @property {string[]} items - Current item list
 * @property {Function} onChange - Callback when item list changes
 * @property {boolean} [readOnly=false] - Whether editing is disabled
 * @property {string} [addItemLabel] - Placeholder for input field
 * @property {string} [removeChipAriaLabel] - Accessibility label for remove button
 */
interface ItemListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  readOnly?: boolean;
  addItemLabel?: string;
  removeChipAriaLabel?: string;
}

/**
 * Item list editor with inline text input.
 * Displays item chips and allows adding new items via input field.
 *
 * @component
 * @param {ItemListEditorProps} props - Component props
 * @param {string[]} props.items - Current item names
 * @param {(items: string[]) => void} props.onChange - Callback when item list changes
 * @param {boolean} [props.readOnly] - Whether the editor is read-only
 * @param {string} [props.addItemLabel] - Label for the add item input
 * @param {string} [props.removeChipAriaLabel] - Aria label for remove chip buttons
 * @returns {JSX.Element} Rendered item list with add/remove controls
 *
 * @example
 * ```tsx
 * <ItemListEditor
 *   items={['Potion of Healing', 'Longsword']}
 *   onChange={setItems}
 *   readOnly={false}
 * />
 * ```
 */
export const ItemListEditor: React.FC<ItemListEditorProps> = ({
  items,
  onChange,
  readOnly = false,
  addItemLabel = 'Add item',
  removeChipAriaLabel = 'Remove item',
}) => {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = useCallback(() => {
    if (!newItem.trim()) return;
    onChange([...items, newItem.trim()]);
    setNewItem('');
  }, [newItem, items, onChange]);

  const handleRemoveItem = useCallback(
    (index: number) => {
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange]
  );

  return (
    <>
      <div className={styles.chips}>
        {items.map((item, idx) => (
          <div key={idx} className={styles.chip}>
            {item}
            {!readOnly && (
              <button
                onClick={() => handleRemoveItem(idx)}
                className={styles.removeChip}
                aria-label={removeChipAriaLabel}>
                <X size={12} aria-hidden='true' />
              </button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <div className={styles.addConditionContainer}>
          <input
            type='text'
            className={styles.addConditionInput}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            placeholder={addItemLabel}
          />
          <button
            onClick={handleAddItem}
            className={styles.addConditionButton}>
            +
          </button>
        </div>
      )}
    </>
  );
};
