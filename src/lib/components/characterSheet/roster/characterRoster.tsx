/**
 * @fileoverview Character Roster Component
 * @description Two-panel character management view: a left sidebar lists all saved
 * characters; the right panel shows the selected character's full sheet. Provides
 * buttons to create a new character, delete the active character, and select between
 * existing ones.
 *
 * @module lib/components/characterSheet/characterRoster
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Modal } from '@/lib/components/ui';
import {
    useCharacters,
    useCharacterSheetDispatch,
    useCharacterSheetState,
} from '@/lib/context/CharacterSheetContext';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { CHARACTER_SHEET_ACTION_TYPES } from '@/lib/types/characterSheet';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { CharacterSheet } from '../characterSheet';
import styles from '../characterSheet.module.scss';

/**
 * Props for the CharacterRoster component.
 *
 * @interface CharacterRosterProps
 */
export interface CharacterRosterProps {}

/**
 * Character roster page with sidebar + detail panel layout.
 * All state comes from CharacterSheetContext.
 *
 * @component
 * @param {CharacterRosterProps} props - Component props
 * @returns {JSX.Element} Rendered character roster
 */
export const CharacterRoster: React.FC<CharacterRosterProps> = () => {
  const t = useTranslations('characterSheet');
  const characters = useCharacters();
  const { activeId, isHydrated } = useCharacterSheetState();
  const dispatch = useCharacterSheetDispatch();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeCharacter: CharacterSheetType | undefined =
    characters.find((c) => c.id === activeId) ?? characters[0];

  const handleCreate = useCallback(() => {
    const newChar = createEmptyCharacter();
    dispatch({
      type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
      payload: { character: newChar },
    });
    dispatch({
      type: CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID,
      payload: { id: newChar.id },
    });
  }, [dispatch]);

  const handleSelect = useCallback(
    (id: string) => {
      dispatch({
        type: CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID,
        payload: { id },
      });
    },
    [dispatch],
  );

  const handleDelete = useCallback((id: string) => {
    setConfirmDeleteId(id);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDeleteId) return;
    dispatch({
      type: CHARACTER_SHEET_ACTION_TYPES.DELETE_CHARACTER,
      payload: { id: confirmDeleteId },
    });
    setConfirmDeleteId(null);
  }, [confirmDeleteId, dispatch]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  if (!isHydrated) return null;

  return (
    <div className={styles.characterRoster}>
      <aside
        className={styles.rosterSidebar}
        aria-label={t('ariaCharacterList')}>
        <div className={styles.rosterSidebarHeader}>
          <h2 className={styles.rosterTitle}>{t('rosterTitle')}</h2>
          <button
            type='button'
            className={styles.createCharBtn}
            onClick={handleCreate}
            aria-label={t('ariaCreateCharacter')}>
            <PlusCircle size={16} aria-hidden='true' />
            {t('newCharacter')}
          </button>
        </div>

        {characters.length === 0 ? (
          <p className={styles.rosterEmpty}>{t('noCharactersYet')}</p>
        ) : (
          <ul className={styles.rosterList}>
            {characters.map((char) => (
              <li
                key={char.id}
                className={`${styles.rosterItem} ${char.id === activeCharacter?.id ? styles.rosterItemActive : ''}`}>
                <button
                  type='button'
                  className={styles.rosterItemBtn}
                  onClick={() => handleSelect(char.id)}
                  aria-pressed={char.id === activeCharacter?.id}>
                  <span className={styles.rosterItemName}>
                    {char.name || t('unnamed')}
                  </span>
                  <span className={styles.rosterItemMeta}>
                    {t('levelShort', { level: char.level })}
                  </span>
                </button>
                <button
                  type='button'
                  className={styles.rosterDeleteBtn}
                  onClick={() => handleDelete(char.id)}
                  aria-label={t('ariaDeleteCharacter', {
                    name: char.name || t('unnamed'),
                  })}>
                  <Trash2 size={12} aria-hidden='true' />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main
        className={styles.rosterMain}
        aria-label={t('ariaCharacterSheetPanel')}>
        {activeCharacter ? (
          <CharacterSheet character={activeCharacter} />
        ) : (
          <div className={styles.rosterPlaceholder}>
            <p>{t('selectOrCreate')}</p>
          </div>
        )}
      </main>

      {confirmDeleteId &&
        (() => {
          const target = characters.find((c) => c.id === confirmDeleteId);
          const targetName = target?.name || t('unnamed');
          return (
            <Modal
              isOpen
              onClose={handleCancelDelete}
              title={t('deleteConfirmTitle')}
              ariaLabel={t('deleteConfirmTitle')}>
              <p>{t('deleteConfirmBody', { name: targetName })}</p>
              <div className={styles.rosterConfirmActions}>
                <button
                  type='button'
                  className={styles.rosterConfirmCancel}
                  onClick={handleCancelDelete}>
                  {t('deleteConfirmCancel')}
                </button>
                <button
                  type='button'
                  className={styles.rosterConfirmDelete}
                  onClick={handleConfirmDelete}>
                  {t('deleteConfirmConfirm')}
                </button>
              </div>
            </Modal>
          );
        })()}
    </div>
  );
};
