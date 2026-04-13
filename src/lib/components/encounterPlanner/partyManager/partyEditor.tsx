/**
 * @fileoverview Party Editor Component
 * @description Table-based editor for party name and member list.
 * Each member renders as a table row with name and delete button.
 * TODO: Rows will gain character links and additional fields in a future iteration.
 *
 * @module partyEditor
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { SavedParty } from '@/lib/types/party';
import { generateId } from '@/lib/utils/encounterStorage';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import styles from './partyManager.module.scss';

/**
 * Props for PartyEditor component.
 *
 * @interface PartyEditorProps
 * @property {SavedParty} party - The party being edited (mutable copy)
 * @property {(party: SavedParty) => void} onSave - Callback to persist the edited party
 * @property {() => void} onBack - Callback to return to the party list view
 */
export interface PartyEditorProps {
  party: SavedParty;
  onSave: (party: SavedParty) => void;
  onBack: () => void;
}

/**
 * Party editor with name input and table-based member list.
 * Each member is a table row with an editable name and a delete button.
 * TODO: Rows will gain character sheet links in a future iteration.
 *
 * @component
 * @param {PartyEditorProps} props - Component props
 * @param {SavedParty} props.party - The party being edited
 * @param {(party: SavedParty) => void} props.onSave - Save callback
 * @param {() => void} props.onBack - Back to list callback
 * @returns {JSX.Element} Rendered party editor form
 */
export const PartyEditor: React.FC<PartyEditorProps> = ({
  party: initialParty,
  onSave,
  onBack,
}) => {
  const t = useTranslations('encounterPlanner');
  const [party, setParty] = useState<SavedParty>(initialParty);

  const handleNameChange = useCallback((name: string) => {
    setParty((prev) => ({ ...prev, name }));
  }, []);

  const handleAddMember = useCallback(() => {
    setParty((prev) => ({
      ...prev,
      members: [...prev.members, { id: generateId(), name: t('newCharacter') }],
    }));
  }, [t]);

  const handleMemberNameChange = useCallback(
    (memberId: string, name: string) => {
      setParty((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId ? { ...m, name } : m,
        ),
      }));
    },
    [],
  );

  const handleRemoveMember = useCallback((memberId: string) => {
    setParty((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== memberId),
    }));
  }, []);

  const handleSave = useCallback(() => {
    if (!party.name.trim()) return;
    onSave(party);
  }, [party, onSave]);

  return (
    <div className={styles.editor}>
      <div className={styles.editorField}>
        <label className={styles.editorLabel}>{t('partyName')}</label>
        <input
          type='text'
          className={styles.editorInput}
          value={party.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={t('partyName')}
          autoFocus
        />
      </div>

      <table className={styles.memberTable}>
        <thead>
          <tr>
            <th className={styles.memberTableHeader}>{t('memberName')}</th>
            <th className={styles.memberTableHeaderAction} />
          </tr>
        </thead>
        <tbody>
          {party.members.map((member) => (
            <tr key={member.id} className={styles.memberTableRow}>
              <td className={styles.memberTableCell}>
                <input
                  type='text'
                  className={styles.memberNameInput}
                  value={member.name}
                  onChange={(e) =>
                    handleMemberNameChange(member.id, e.target.value)
                  }
                  aria-label={t('memberName')}
                />
              </td>
              <td className={styles.memberTableCellAction}>
                <button
                  className={styles.memberDeleteButton}
                  onClick={() => handleRemoveMember(member.id)}
                  aria-label={`${t('removeMember')} ${member.name}`}>
                  <Trash2 size={14} aria-hidden='true' />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className={styles.memberTableFooter}>
              <button
                className={styles.importCharacterButton}
                disabled
                title={t('importCharacterTodo')}>
                {t('importCharacter')}
              </button>
              <button
                className={styles.addCharacterButton}
                onClick={handleAddMember}>
                {t('addNewCharacter')}
              </button>
            </td>
          </tr>
        </tfoot>
      </table>

      <div className={styles.editorActions}>
        <button className={styles.actionButton} onClick={onBack}>
          {t('backToList')}
        </button>
        <button
          className={styles.createButton}
          onClick={handleSave}
          disabled={!party.name.trim()}>
          {t('saveParty')}
        </button>
      </div>
    </div>
  );
};
