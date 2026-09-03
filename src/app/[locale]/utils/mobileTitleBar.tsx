/**
 * Mobile Title Bar
 *
 * @fileoverview Fixed title bar shown below `lg`: logo, shell controls, search,
 * selected character and the hamburger that opens the sidebar.
 *
 * @module app/[locale]/utils/mobileTitleBar
 * @version 1.0.0
 * @author Typeir
 * @since 1.1.0
 */

'use client';

import btn from '@/styles/buttons.module.scss';
import Icon from '@/lib/components/icon/icon';
import themeToggleStyles from '@/lib/components/themeToggle/themeToggle.module.scss';
import { SelectedCharacterBadge } from '@/modules/character-builder/presentation/SelectedCharacter/selectedCharacterBadge';
import { SearchBar } from '@/modules/search/presentation/SearchBar/SearchBar';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import type { JSX, ReactNode } from 'react';
import cn from '../../../lib/utils/classNameMerge';
import styles from './responsiveLayoutShell.module.scss';

/**
 * Props for MobileTitleBar.
 *
 * @interface MobileTitleBarProps
 * @property {boolean} open - Whether the sidebar menu is open
 * @property {() => void} onToggle - Toggles the sidebar menu
 * @property {() => void} onNavigate - Closes the menu after a search navigation
 * @property {ReactNode} controls - Icon-slot controls rendered between the logo and the search bar
 */
export interface MobileTitleBarProps {
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  controls: ReactNode;
}

/**
 * Fixed mobile title bar: equal icon slots flanking a centered search bar.
 *
 * @param {MobileTitleBarProps} props - Component props
 * @returns {JSX.Element} The title bar
 */
export function MobileTitleBar({
  open,
  onToggle,
  onNavigate,
  controls,
}: MobileTitleBarProps): JSX.Element {
  const t = useTranslations('layout');

  return (
    <div
      className={`mobile-title-bar solid lg:hidden fixed top-0 inset-x-0 z-40 flex items-center gap-3 px-2 border-b bg-background shadow-sm max-w-full ${styles.mobileTitleBar}`}
    >
      <Link
        href='/'
        className={styles.headerIconSlot}
        aria-label={t('libraryTitle')}
      >
        <Image
          src='/logo.png'
          alt={t('libraryTitle')}
          className='w-7 h-7'
          width={32}
          height={32}
        />
      </Link>
      {controls}
      <div className={`flex-1 min-w-0 px-1 ${styles.headerSearchSlot}`}>
        <SearchBar onNavigate={onNavigate} />
      </div>
      <div className={styles.headerIconSlot}>
        <SelectedCharacterBadge dropDirection='down' deselectSide='start' />
      </div>
      <button
        onClick={onToggle}
        className={cn(
          btn.tertiary,
          themeToggleStyles.themeToggle,
          styles.headerIconSlot,
        )}
        aria-label={t('toggleSidebar')}
      >
        <Icon
          type='hamburger'
          className={`${styles.hamburger} ${open ? styles.isOpen : ''} w-4 h-4`}
          aria-hidden='true'
        />
      </button>
    </div>
  );
}
