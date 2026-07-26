/**
 * @fileoverview Equipment Tab
 * @description Equipment table editor with per-item quantity and weight columns.
 * Exposes a lightweight {@link EquipmentProvider} context so the
 * `CarryingCapacityCalculator` can consume `totalWeight` without prop-drilling.
 *
 * @module lib/components/characterSheet/tabs/equipmentTab
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import { TextArea } from '@/lib/components/ui/textArea';
import { TextInput } from '@/lib/components/ui/textInput';
import type {
  CharacterSheet as CharacterSheetType,
  EquipmentItem,
} from '@/lib/types/character';
import {
  useSheetData,
  useSheetEditing,
  useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { EquipmentProvider } from '@/modules/character-builder/application/context/equipmentContext';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { CarryingCapacityCalculator } from '../CarryingCapacity/carryingCapacityCalculator';
import { CoinPouch } from '../CarryingCapacity/coinPouch';
import { AttacksTable } from '../stats/attacksTable';
import btn from '@/styles/buttons.module.scss';
import tbl from '@/styles/tables.module.scss';
import styles from './tabs.module.scss';

/**
 * Equipment tab content. Renders a table with Name / Units / Weight (lb) columns
 * and exposes derived totals via {@link EquipmentProvider}. Reads the character
 * and edit mode from the active-sheet context.
 *
 * @component
 * @returns {JSX.Element} Rendered tab body
 */
export const EquipmentTab: React.FC = () => {
  const t = useTranslations('characterSheet');
  const tCommon = useTranslations('common');
  const data = useSheetData();
  const editing = useSheetEditing();
  const { patch: onChange } = useSheetMutators();
  const equipmentNotes = data.equipmentNotes ?? '';

  const items = useMemo(
    () => (data.equipment ?? []) as EquipmentItem[],
    [data.equipment],
  );

  const totalWeight = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity * it.weightLb, 0),
    [items],
  );

  const updateItem = useCallback(
    (idx: number, patch: Partial<EquipmentItem>) => {
      const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
      onChange({ equipment: next });
    },
    [items, onChange],
  );

  const addRow = useCallback(() => {
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    onChange({
      equipment: [...items, { id, name: '', quantity: 1, weightLb: 0 }],
    });
  }, [items, onChange]);

  const removeRow = useCallback(
    (idx: number) => {
      onChange({ equipment: items.filter((_, i) => i !== idx) });
    },
    [items, onChange],
  );

  const updateNotes = useCallback(
    (value: string) => {
      onChange({ equipmentNotes: value } as Partial<CharacterSheetType>);
    },
    [onChange],
  );

  const handleAttacksChange = useCallback(
    (attacks: CharacterSheetType['attacks']) => onChange({ attacks }),
    [onChange],
  );

  return (
    <EquipmentProvider value={{ totalWeight, totalCount: items.length }}>
      <div className={styles.twoColumns}>
        <div className={styles.column}>
          <h3 className={styles.sectionTitle}>{t('equipmentTitle')}</h3>
          <div className={styles.tableScrollGuard}>
            <table className={`${tbl.dataTable} ${tbl.fixed}`}>
            <thead>
              <tr>
                <th className={styles.equipmentColName}>
                  {tCommon('name')}
                </th>
                <th className={styles.equipmentColNum}>
                  {t('equipmentColUnits')}
                </th>
                <th className={styles.equipmentColNum}>
                  {t('equipmentColWeight')}
                </th>
                {editing && <th className={styles.equipmentColAction} />}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td>
                    <TextInput
                      className={styles.equipmentInput}
                      value={item.name}
                      onChange={(v) => updateItem(idx, { name: v })}
                      disabled={!editing}
                    />
                  </td>
                  <td>
                    <NumericInput
                      className={styles.equipmentNumInput}
                      value={item.quantity}
                      min={0}
                      step={1}
                      allowDecimals={false}
                      disabled={!editing}
                      onChange={(v) => updateItem(idx, { quantity: v ?? 0 })}
                    />
                  </td>
                  <td>
                    <NumericInput
                      className={styles.equipmentNumInput}
                      value={item.weightLb}
                      min={0}
                      step={0.1}
                      allowDecimals
                      disabled={!editing}
                      onChange={(v) => updateItem(idx, { weightLb: v ?? 0 })}
                    />
                  </td>
                  {editing && (
                    <td>
                      <button
                        type='button'
                        className={styles.equipmentRemoveBtn}
                        onClick={() => removeRow(idx)}
                        aria-label={t('equipmentRemoveItemAria', {
                          name: item.name || 'item',
                        })}>
                        <Trash2 size={14} aria-hidden='true' />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          {editing && (
            <button
              type='button'
              className={btn.add}
              onClick={addRow}
              aria-label={t('equipmentAddRowAria')}>
              <Plus size={14} aria-hidden='true' />
              {t('equipmentAddItem')}
            </button>
          )}

          <h3 className={styles.sectionTitle}>{t('equipmentNotesTitle')}</h3>
          <TextArea
            className={styles.notesArea}
            value={equipmentNotes}
            readOnly={!editing}
            onChange={updateNotes}
          />
        </div>

        <div className={styles.column}>
          <h3 className={styles.sectionTitle}>{t('equipmentWeaponsTitle')}</h3>
          <AttacksTable
            attacks={data.attacks}
            onChange={handleAttacksChange}
            readOnly={!editing}
          />

          <h3 className={styles.sectionTitle}>
            {t('equipmentCoinPouchTitle')}
          </h3>
          <CoinPouch />

          <h3 className={styles.sectionTitle}>
            {t('equipmentCarryingCapacityTitle')}
          </h3>
          <CarryingCapacityCalculator />
        </div>
      </div>
    </EquipmentProvider>
  );
};
