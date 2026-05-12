/**
 * @fileoverview Equipment Tab
 * @description Equipment list editor + freeform notes + placeholders for the
 * coin pouch (Phase 5) and carrying capacity calculator (Phase 6).
 *
 * @module lib/components/characterSheet/tabs/equipmentTab
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { TextArea } from '@/lib/components/ui/textArea';
import { TextInput } from '@/lib/components/ui/textInput';
import { Plus, X } from 'lucide-react';
import { CarryingCapacityCalculator } from '../carryingCapacityCalculator';
import { CoinPouch } from '../coinPouch';
import styles from './tabs.module.scss';

/**
 * Props for `<EquipmentTab>`.
 *
 * @interface EquipmentTabProps
 * @property {CharacterSheetType} data - Active character data
 * @property {boolean} editing - Whether edit mode is active
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch the draft
 */
export interface EquipmentTabProps {
  data: CharacterSheetType;
  editing: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
}

/**
 * Equipment tab content.
 *
 * @component
 * @param {EquipmentTabProps} props - Component props
 * @returns {JSX.Element} Rendered tab body
 */
export const EquipmentTab: React.FC<EquipmentTabProps> = ({
  data,
  editing,
  onChange,
}) => {
  const equipment = data.equipment ?? [];
  const equipmentNotes =
    (data as unknown as { equipmentNotes?: string }).equipmentNotes ?? '';

  const updateRow = (idx: number, value: string) => {
    const next = [...equipment];
    next[idx] = value;
    onChange({ equipment: next });
  };

  const addRow = () => {
    onChange({ equipment: [...equipment, ''] });
  };

  const removeRow = (idx: number) => {
    onChange({ equipment: equipment.filter((_, i) => i !== idx) });
  };

  const updateNotes = (value: string) => {
    onChange({
      equipmentNotes: value,
    } as unknown as Partial<CharacterSheetType>);
  };

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        <h3 className={styles.sectionTitle}>Equipment</h3>
        <div className={styles.equipmentList}>
          {equipment.map((item, idx) => (
            <div key={idx} className={styles.equipmentRow}>
              <TextInput
                className={styles.equipmentInput}
                value={item}
                onChange={(v) => updateRow(idx, v)}
                disabled={!editing}
              />
              {editing && (
                <button
                  type='button'
                  className={styles.iconBtn}
                  onClick={() => removeRow(idx)}
                  aria-label={`Remove ${item || 'item'}`}>
                  <X size={12} aria-hidden='true' />
                </button>
              )}
            </div>
          ))}
          {editing && (
            <button
              type='button'
              className={styles.iconBtn}
              onClick={addRow}
              aria-label='Add equipment row'>
              <Plus size={14} aria-hidden='true' />
            </button>
          )}
        </div>

        <h3 className={styles.sectionTitle}>Notes</h3>
        <TextArea
          className={styles.notesArea}
          value={equipmentNotes}
          readOnly={!editing}
          onChange={(v) => updateNotes(v)}
        />
      </div>

      <div className={styles.column}>
        <h3 className={styles.sectionTitle}>Coin Pouch</h3>
        <CoinPouch data={data} editing={editing} onChange={onChange} />

        <h3 className={styles.sectionTitle}>Carrying Capacity</h3>
        <CarryingCapacityCalculator data={data} />
      </div>
    </div>
  );
};
