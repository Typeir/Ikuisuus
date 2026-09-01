/**
 * @fileoverview Attacks Table Component
 * @description Renders the character's attack entries in a table. Supports
 * adding, editing, and removing individual attacks. Each row shows name,
 * to-hit bonus, damage, and notes.
 *
 * @module modules/character-builder/presentation/stats/attacksTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { TextInput } from '@/lib/components/ui/textInput';
import type { CharacterAttack } from '@/lib/types/character';
import { generateId } from '@/modules/encounter-planner/domain/shared/utils';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import { IconButton } from '@/lib/components/ui/iconButton';
import tbl from '@/styles/tables.module.scss';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';

/**
 * Props for the AttacksTable component.
 *
 * @interface AttacksTableProps
 * @property {CharacterAttack[]} attacks - Current list of attack entries
 * @property {(attacks: CharacterAttack[]) => void} onChange - Callback when attacks list changes
 * @property {boolean} [readOnly] - When true, add/edit/remove controls are hidden
 */
export interface AttacksTableProps {
  attacks: CharacterAttack[];
  onChange: (attacks: CharacterAttack[]) => void;
  readOnly?: boolean;
}

/**
 * Attacks table with editable name, to-hit, damage, and notes fields.
 * Supports adding new rows and removing existing ones.
 *
 * @component
 * @param {AttacksTableProps} props - Component props
 * @param {CharacterAttack[]} props.attacks - Current list of attack entries
 * @param {(attacks: CharacterAttack[]) => void} props.onChange - Callback when attacks list changes
 * @param {boolean} [props.readOnly=false] - When true, add/edit/remove controls are hidden
 * @returns {JSX.Element} Rendered attacks table
 */
export const AttacksTableImpl: React.FC<AttacksTableProps> = ({
  attacks,
  onChange,
  readOnly = false,
}) => {
  const t = useTranslations('characterSheet');
  const tCommon = useTranslations('common');
  const handleAdd = () => {
    onChange([
      ...attacks,
      { id: generateId(), name: '', toHit: '', damage: '', notes: '' },
    ]);
  };

  const handleRemove = (id: string) => {
    onChange(attacks.filter((a) => a.id !== id));
  };

  const handleField = (
    id: string,
    field: keyof Omit<CharacterAttack, 'id'>,
    value: string,
  ) => {
    onChange(attacks.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  return (
    <div className={styles.attacksSection}>
      <div className={styles.attacksScrollGuard}>
        <table
          className={`${tbl.dataTable} ${tbl.fixed} ${styles.attacksTable}`}
          aria-label={t('ariaAttacksTable')}>
        <thead>
          <tr>
            <th scope='col'>{tCommon('name')}</th>
            <th scope='col'>{t('colToHit')}</th>
            <th scope='col'>{t('colDamage')}</th>
            <th scope='col'>{t('colNotes')}</th>
            {!readOnly && (
              <th scope='col'>
                <span className='sr-only'>{t('colActions')}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {attacks.map((attack) => (
            <tr key={attack.id}>
              <td>
                {readOnly ? (
                  attack.name
                ) : (
                  <TextInput
                    className={styles.attackInput}
                    value={attack.name}
                    onChange={(v) => handleField(attack.id, 'name', v)}
                    ariaLabel={t('ariaAttackName')}
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  attack.toHit
                ) : (
                  <TextInput
                    className={styles.attackInput}
                    value={attack.toHit}
                    onChange={(v) => handleField(attack.id, 'toHit', v)}
                    ariaLabel={t('ariaToHit')}
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  attack.damage
                ) : (
                  <TextInput
                    className={styles.attackInput}
                    value={attack.damage}
                    onChange={(v) => handleField(attack.id, 'damage', v)}
                    ariaLabel={t('ariaDamage')}
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  attack.notes
                ) : (
                  <TextInput
                    className={styles.attackInput}
                    value={attack.notes}
                    onChange={(v) => handleField(attack.id, 'notes', v)}
                    ariaLabel={t('ariaNotes')}
                  />
                )}
              </td>
              {!readOnly && (
                <td>
                  <IconButton
                    kind='close'
                    label={t('ariaRemoveAttack', {
                      name: attack.name || tCommon('unnamed'),
                    })}
                    onClick={() => handleRemove(attack.id)}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      {!readOnly && (
        <IconButton
          kind='add'
          dashed
          label={t('ariaAddAttack')}
          onClick={handleAdd}>
          {t('addAttack')}
        </IconButton>
      )}
    </div>
  );
};

/**
 * Memoized `AttacksTable` export. Re-renders only when `attacks`, `onChange`,
 * or `readOnly` changes by reference.
 */
export const AttacksTable = memo(AttacksTableImpl);
