/**
 * @fileoverview Party Editor Component
 * @description Table-based editor for party name and member list.
 * Each member renders as a table row with name, optional character link, and delete button.
 *
 * @module partyEditor
 * @version 2.1.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useCharacters } from '@/lib/context/CharacterSheetContext';
import type { SavedParty } from '@/modules/encounter-planner/domain/parties/party.types';
import { generateId } from '@/modules/encounter-planner/domain/shared/utils';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import styles from './partyManager.module.scss';
import btn from '@/styles/buttons.module.scss';

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
 * Each member is a table row with an editable name, a character link dropdown, and a delete button.
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
  const tCommon = useTranslations('common');
  const [party, setParty] = useState<SavedParty>(initialParty);
  const characters = useCharacters();

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

  const handleLinkCharacter = useCallback(
    (memberId: string, characterId: string) => {
      setParty((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId
            ? { ...m, characterId: characterId || undefined }
            : m,
        ),
      }));
    },
    [],
  );

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
            <th className={styles.memberTableHeader}>{t('linkedCharacter')}</th>
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
              <td className={styles.memberTableCell}>
                <select
                  className={styles.memberNameInput}
                  value={member.characterId ?? ''}
                  onChange={(e) =>
                    handleLinkCharacter(member.id, e.target.value)
                  }
                  aria-label={t('linkCharacter')}>
                  <option value=''>{t('noCharacterLinked')}</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className={styles.memberTableCellAction}>
                <button
                  className={btn.iconDanger}
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
                className={`${btn.neutral} ${styles.pendingImport}`}
                disabled
                title={t('importCharacterTodo')}>
                {t('importCharacter')}
              </button>
              <button className={btn.secondary} onClick={handleAddMember}>
                {t('addNewCharacter')}
              </button>
            </td>
          </tr>
        </tfoot>
      </table>

      <div className={styles.editorActions}>
        <button className={btn.neutral} onClick={onBack}>
          {tCommon('back')}
        </button>
        <button onClick={handleSave} disabled={!party.name.trim()}>
          {t('saveParty')}
        </button>
      </div>
    </div>
  );
};
