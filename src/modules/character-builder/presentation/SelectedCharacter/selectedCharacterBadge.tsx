/**
 * @fileoverview Selected Character Badge
 * @description Round profile-picture style badge showing the globally
 * selected character (the one whose stats will drive wiki formula
 * substitution). Lives in the sidebar footer next to the tools menu.
 * Clicking it opens an upward character picker; selecting an entry
 * dispatches `SET_ACTIVE_ID` on the global roster context, and the final
 * row navigates to the character manager page.
 *
 * The picker is a mixed menu. Character rows are buttons because they act on
 * state without leaving the page; the manager row is an anchor with a real
 * `href`, since a control that navigates has to be a link for middle-click,
 * ctrl-click and "open in new tab" to work. An unmodified left click is
 * upgraded to a client-side push, and the browser keeps every other gesture.
 *
 * @module modules/character-builder/presentation/SelectedCharacter/selectedCharacterBadge
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip';
import { isPlainLeftClick } from '@/lib/utils/isPlainLeftClick';
import {
  useActiveCharacter,
  useCharacters,
  useCharacterSheetDispatch,
  useCharacterSheetState,
} from '@/lib/context/CharacterSheetContext';
import { CHARACTER_SHEET_ACTION_TYPES } from '@/lib/types/characterSheet';
import { UserRound, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './selectedCharacterBadge.module.scss';

/**
 * Props for the SelectedCharacterBadge component.
 *
 * @interface SelectedCharacterBadgeProps
 * @property {'up' | 'down'} [dropDirection='up'] - Which way the picker
 * expands. 'up' suits the sidebar footer; 'down' suits top bars.
 */
interface SelectedCharacterBadgeProps {
  dropDirection?: 'up' | 'down';
}

/**
 * Badge for the globally selected character (sidebar footer or mobile
 * header). Renders nothing until the roster context has hydrated.
 *
 * @component
 * @param {SelectedCharacterBadgeProps} props - Component props
 * @param {'up' | 'down'} [props.dropDirection='up'] - Which way the picker expands. 'up' suits the sidebar footer; 'down' suits top bars.
 * @returns {JSX.Element | null} Rendered badge or null pre-hydration
 */
export const SelectedCharacterBadge: React.FC<SelectedCharacterBadgeProps> = ({
  dropDirection = 'up',
}) => {
  const t = useTranslations('layout');
  const tCommon = useTranslations('common');
  const characters = useCharacters();
  const { isHydrated } = useCharacterSheetState();
  const active = useActiveCharacter();
  const dispatch = useCharacterSheetDispatch();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;

  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        close();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  const handleSelect = useCallback(
    (id: string) => {
      dispatch({
        type: CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID,
        payload: { id },
      });
      close();
    },
    [dispatch, close],
  );

  const handleDeselect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({
        type: CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID,
        payload: { id: null },
      });
    },
    [dispatch],
  );

  const manageHref = `/${locale}/utils/characters`;

  const handleManage = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isPlainLeftClick(event)) return;
      event.preventDefault();
      close();
      router.push(manageHref);
    },
    [close, router, manageHref],
  );

  if (!isHydrated) return null;

  const activeName = active?.name || tCommon('unnamed');
  const initial = activeName.charAt(0).toUpperCase();

  return (
    <div ref={rootRef} className={styles.badge}>
      <div className={styles.triggerWrap}>
        <button
          ref={triggerRef}
          type='button'
          className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup='menu'
          aria-label={t('characterBadge.ariaToggle')}
          title={active ? activeName : t('characterBadge.ariaToggle')}>
          {active ? (
            <span className={styles.avatar} aria-hidden='true'>
              {initial}
            </span>
          ) : (
            <span
              className={`${styles.avatar} ${styles.avatarEmpty}`}
              aria-hidden='true'>
              <UserRound size={14} aria-hidden='true' />
            </span>
          )}
        </button>

        {active && (
          <span className={styles.deselectWrap}>
            <Tooltip
              content={t('characterBadge.deselect')}
              placement='top'
              showDelay={300}
              showClickIcon={false}>
              <button
                type='button'
                className={styles.deselect}
                onClick={handleDeselect}
                aria-label={t('characterBadge.deselect')}>
                <X size={12} strokeWidth={2.5} aria-hidden='true' />
              </button>
            </Tooltip>
          </span>
        )}
      </div>

      {isOpen && (
        <div
          className={`${styles.dropdown} ${
            dropDirection === 'down' ? styles.dropdownDown : ''
          }`}
          role='menu'>
          <ul className={styles.list}>
            {characters.length === 0 && (
              <li className={styles.empty}>{t('characterBadge.empty')}</li>
            )}
            {characters.map((char) => {
              const name = char.name || tCommon('unnamed');
              return (
                <li key={char.id}>
                  <button
                    type='button'
                    role='menuitem'
                    className={`${styles.listItem} ${
                      char.id === active?.id ? styles.active : ''
                    }`}
                    onClick={() => handleSelect(char.id)}>
                    <span className={styles.itemAvatar} aria-hidden='true'>
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <span className={styles.itemName}>{name}</span>
                    <span className={styles.itemMeta}>
                      {tCommon('levelShort', { level: char.level })}
                    </span>
                  </button>
                </li>
              );
            })}
            <li>
              <a
                role='menuitem'
                href={manageHref}
                className={`${styles.listItem} ${styles.manageRow}`}
                onClick={handleManage}>
                {t('characterBadge.manage')}
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
