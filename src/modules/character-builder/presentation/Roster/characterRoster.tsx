/**
 * @fileoverview Character Roster Component
 * @description Two-panel view: left sidebar lists saved characters; the right panel
 * shows the active character's sheet. Provides create, delete, and select actions.
 *
 * @module modules/character-builder/presentation/Roster/characterRoster
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Modal } from '@/lib/components/ui';
import { ROSTER_COLLAPSED_KEY } from '@/lib/constants/persistentData';
import { fetchPersistentData } from '@/lib/utils/fetchPersistentData';
import { storePersistentDataFallbackOnly } from '@/lib/utils/storePersistentData';
import {
    useCharacters,
    useCharacterSheetDispatch,
    useCharacterSheetState,
} from '@/lib/context/CharacterSheetContext';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { CHARACTER_SHEET_ACTION_TYPES } from '@/lib/types/characterSheet';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { IconButton } from '@/lib/components/ui/iconButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CharacterSheet } from '../CharacterSheet/characterSheet';
import styles from './roster.module.scss';

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
  const tCommon = useTranslations('common');
  const characters = useCharacters();
  const { activeId, isHydrated } = useCharacterSheetState();
  const dispatch = useCharacterSheetDispatch();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [startEditingId, setStartEditingId] = useState<string | null>(null);
  const autoCreatedRef = useRef(false);

  useEffect(() => {
    try {
      const stored = fetchPersistentData(ROSTER_COLLAPSED_KEY);
      if (stored === 'true') setCollapsed(true);
    } catch {
      /** storage unavailable — non-fatal */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        storePersistentDataFallbackOnly(ROSTER_COLLAPSED_KEY, String(next));
      } catch {
        /** storage unavailable — non-fatal */
      }
      return next;
    });
  }, []);

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
    setStartEditingId(newChar.id);
  }, [dispatch]);

  const handleSelect = useCallback(
    (id: string) => {
      setStartEditingId(null);
      dispatch({
        type: CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID,
        payload: { id },
      });
    },
    [dispatch],
  );

  useEffect(() => {
    if (!isHydrated || autoCreatedRef.current) return;
    if (characters.length === 0) {
      autoCreatedRef.current = true;
      handleCreate();
    }
  }, [isHydrated, characters.length, handleCreate]);

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

  const collapseLabel = collapsed
    ? t('ariaRosterExpand')
    : t('ariaRosterCollapse');

  return (
    <div className={styles.rosterShell}>
      <header className={styles.rosterTopBar}>
        <h2 className={styles.rosterTitle}>{t('rosterTitle')}</h2>
        <IconButton
          kind='add'
          size='s'
          shape='rhombus'
          label={t('ariaCreateCharacter')}
          onClick={handleCreate}>
          {t('newCharacter')}
        </IconButton>
      </header>
      <div
        className={styles.characterRoster}
        data-collapsed={collapsed ? 'true' : 'false'}>
        <aside
          className={styles.rosterSidebar}
          aria-label={t('ariaCharacterList')}>
          <div className={styles.rosterCollapseBar}>
            <button
              type='button'
              className={styles.rosterCollapseBtn}
              onClick={toggleCollapsed}
              aria-label={collapseLabel}
              aria-expanded={!collapsed}>
              {collapsed ? (
                <ChevronRight size={14} aria-hidden='true' />
              ) : (
                <ChevronLeft size={14} aria-hidden='true' />
              )}
            </button>
          </div>

          {characters.length === 0 ? (
            <p className={styles.rosterEmpty}>
              {collapsed ? '' : t('noCharactersYet')}
            </p>
          ) : (
            <ul className={styles.rosterList}>
              {characters.map((char) => {
                const displayName = char.name || tCommon('unnamed');
                const initial = displayName.charAt(0).toUpperCase();
                return (
                  <li
                    key={char.id}
                    className={`${styles.rosterItem} ${char.id === activeCharacter?.id ? styles.rosterItemActive : ''}`}>
                    <button
                      type='button'
                      className={styles.rosterItemBtn}
                      onClick={() => handleSelect(char.id)}
                      aria-pressed={char.id === activeCharacter?.id}
                      title={collapsed ? displayName : undefined}>
                      <span
                        className={styles.rosterItemAvatar}
                        aria-hidden='true'>
                        {initial}
                      </span>
                      <span className={styles.rosterItemName}>
                        {displayName}
                      </span>
                      <span className={styles.rosterItemMeta}>
                        {tCommon('levelShort', { level: char.level })}
                      </span>
                    </button>
                    <IconButton
                      kind='delete'
                      size='s'
                      label={t('ariaDeleteCharacter', {
                        name: displayName,
                      })}
                      onClick={() => handleDelete(char.id)}
                      className={styles.rosterDeleteBtn}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <main
          className={styles.rosterMain}
          aria-label={t('ariaCharacterSheetPanel')}>
          {activeCharacter ? (
            <CharacterSheet
              character={activeCharacter}
              startEditingId={startEditingId}
            />
          ) : (
            <div className={styles.rosterPlaceholder}>
              <p>{t('selectOrCreate')}</p>
            </div>
          )}
        </main>
      </div>

      {confirmDeleteId &&
        (() => {
          const target = characters.find((c) => c.id === confirmDeleteId);
          const targetName = target?.name || tCommon('unnamed');
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
                  {tCommon('cancel')}
                </button>
                <button
                  type='button'
                  className={styles.rosterConfirmDelete}
                  onClick={handleConfirmDelete}>
                  {tCommon('delete')}
                </button>
              </div>
            </Modal>
          );
        })()}
    </div>
  );
};
