/**
 * @fileoverview Attacks Table Component
 * @description Renders the character's attack entries in a table. Supports
 * adding, editing, and removing individual attacks. Each row shows name,
 * to-hit bonus, damage, and notes.
 *
 * @module lib/components/characterSheet/attacksTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterAttack } from '@/lib/types/character';
import { generateId } from '@/lib/utils/encounterStorage';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import styles from './characterSheetWidgets.module.scss';

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
 * @returns {JSX.Element} Rendered attacks table
 */
export const AttacksTable: React.FC<AttacksTableProps> = ({
  attacks,
  onChange,
  readOnly = false,
}) => {
  const t = useTranslations('characterSheet');
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
      <table className={styles.attacksTable} aria-label={t('ariaAttacksTable')}>
        <thead>
          <tr>
            <th scope='col'>{t('colName')}</th>
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
                  <input
                    className={styles.attackInput}
                    value={attack.name}
                    onChange={(e) =>
                      handleField(attack.id, 'name', e.target.value)
                    }
                    aria-label={t('ariaAttackName')}
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  attack.toHit
                ) : (
                  <input
                    className={styles.attackInput}
                    value={attack.toHit}
                    onChange={(e) =>
                      handleField(attack.id, 'toHit', e.target.value)
                    }
                    aria-label={t('ariaToHit')}
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  attack.damage
                ) : (
                  <input
                    className={styles.attackInput}
                    value={attack.damage}
                    onChange={(e) =>
                      handleField(attack.id, 'damage', e.target.value)
                    }
                    aria-label={t('ariaDamage')}
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  attack.notes
                ) : (
                  <input
                    className={styles.attackInput}
                    value={attack.notes}
                    onChange={(e) =>
                      handleField(attack.id, 'notes', e.target.value)
                    }
                    aria-label={t('ariaNotes')}
                  />
                )}
              </td>
              {!readOnly && (
                <td>
                  <button
                    type='button'
                    className={styles.removeBtn}
                    onClick={() => handleRemove(attack.id)}
                    aria-label={t('ariaRemoveAttack', {
                      name: attack.name || t('unnamed'),
                    })}>
                    <Trash2 size={14} aria-hidden='true' />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <button
          type='button'
          className={styles.addRowBtn}
          onClick={handleAdd}
          aria-label={t('ariaAddAttack')}>
          {t('addAttack')}
        </button>
      )}
    </div>
  );
};
