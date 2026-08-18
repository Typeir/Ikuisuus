/**
 * Responsive Layout Shell Component
 *
 * @fileoverview Provides a 3-region sidebar layout: header with logo and theme toggle,
 * scrollable library navigation tree, and tools footer with locale/archive links.
 *
 * @module app/[locale]/utils/responsiveLayoutShell
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @description
 * Sidebar open/close state persists via PersistentUiContext. Renders within
 * NotificationProvider for toast messages.
 */

'use client';

import btn from '@/styles/buttons.module.scss';
import { EmbedLinkBridge, isEmbedPathname } from '@/lib/embed';
import FlashlightLayer from '@/lib/components/flashlight/FlashlightLayer';
import Icon from '@/lib/components/icon/icon';
import { PreferencesModal } from '@/lib/components/preferences/PreferencesModal';
import { ThemeToggleButton } from '@/lib/components/themeToggle/ThemeToggleButton';
import themeToggleStyles from '@/lib/components/themeToggle/themeToggle.module.scss';
import { NotificationProvider } from '@/lib/components/ui';
import {
  useSidebarMenuActions,
  useSidebarMenuState,
  useThemeState,
} from '@/lib/context/PersistentUiContext';
import { SelectedCharacterBadge } from '@/modules/character-builder';
import { SidebarShell } from '@/modules/navigation-sidebar';
import { SearchBar } from '@/modules/search/presentation/SearchBar/SearchBar';
import {
  ToolsMenu,
  useToolRegistry,
  type ToolMenuItem,
} from '@/modules/tools-menu';
import { SlidersHorizontal, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import cn from '../../../lib/utils/classNameMerge';
import styles from './responsiveLayoutShell.module.scss';

/**
 * Sidebar navigation item with optional nested children.
 *
 * @typedef {Object} Item
 * @property {string} name - Display name
 * @property {string} path - URL path segment
 * @property {Item[]} [children] - Nested child items
 */
type Item = {
  name: string;
  path: string;
  children?: Item[];
};

/**
 * Responsive layout shell wrapping the application content.
 *
 * Provides a 3-region sidebar: header (logo+theme), scrollable library navigation, and tools footer.
 * Sidebar open/close state persists via PersistentUiContext.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The main content to render
 * @param {Item[]} props.tree - Navigation tree items for sidebar
 * @returns {JSX.Element} The rendered layout with sidebar and main content
 */
function BaseResponsiveLayoutShell({
  children,
  tree,
}: {
  children: React.ReactNode;
  tree: Item[];
}): JSX.Element {
  const { isOpen: open } = useSidebarMenuState();
  const { toggle: toggleSidebar, close: closeSidebar } =
    useSidebarMenuActions();
  const { theme: currentTheme } = useThemeState();
  const [mounted, setMounted] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const t = useTranslations('layout');
  const tPreferences = useTranslations('preferences');
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const toolItems = useToolRegistry();

  const pathname = usePathname();
  const isEmbed = isEmbedPathname(pathname ?? '');

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Dispatch `ik:theme-changed` CustomEvent on window with current theme.
   */
  useEffect(() => {
    if (!mounted) return;
    window.dispatchEvent(
      new CustomEvent('ik:theme-changed', {
        detail: { theme: currentTheme },
      }),
    );
  }, [currentTheme, mounted]);

  /**
   * In embed mode, render only the bare page content — no sidebar, no header.
   * `<EmbedLinkBridge>` handles navigation out of the frame.
   */
  if (isEmbed) {
    return (
      <div className={styles.embedShell} data-embed>
        <EmbedLinkBridge />
        <main className={styles.embedContent}>{children}</main>
      </div>
    );
  }

  const handleToolSelect = (tool: ToolMenuItem) => {
    closeSidebar();
    router.push(tool.href);
  };

  /** Theme toggle — rendered in the mobile bar and the desktop sidebar. */
  const themeToggle = (extraClassName?: string) => (
    <ThemeToggleButton className={extraClassName} />
  );

  /** Preferences launcher — sits beside the theme toggle in both bars. */
  const preferencesButton = (extraClassName?: string) => (
    <button
      onClick={() => setPreferencesOpen(true)}
      className={cn(btn.tertiary, themeToggleStyles.themeToggle, extraClassName)}
      aria-label={tPreferences('open')}>
      <SlidersHorizontal size={16} aria-hidden='true' />
    </button>
  );

  return (
    <NotificationProvider position='top-right'>
      <FlashlightLayer />
      <PreferencesModal
        isOpen={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />
      <div className='sidebar-container flex flex-col lg:flex-row min-h-screen relative max-w-full'>
        {/* Sticky Mobile Title Bar: four equal icon slots flanking a
            centered search bar — logo, theme, search, character, hamburger.
            The search bar lives here on mobile; the sidebar's copy is
            desktop-only. */}
        <div
          className={`mobile-title-bar solid lg:hidden fixed top-0 left-0 w-full z-40 flex items-center gap-1 px-2 border-b bg-background shadow-sm max-w-full ${styles.mobileTitleBar}`}
        >
          <Link
            href='/'
            className={styles.headerIconSlot}
            aria-label={t('libraryTitle')}
          >
            <Image
              src='/logo.png'
              alt={t('libraryTitle')}
              className='w-8 h-8'
              width={32}
              height={32}
            />
          </Link>
          {themeToggle(styles.headerIconSlot)}
          {preferencesButton(styles.headerIconSlot)}
          <div className='flex-1 min-w-0 px-1'>
            <SearchBar onNavigate={closeSidebar} />
          </div>
          <div className={styles.headerIconSlot}>
            <SelectedCharacterBadge dropDirection='down' />
          </div>
          <button
            onClick={toggleSidebar}
            className={cn(btn.tertiary, styles.headerIconSlot)}
            aria-label={t('toggleSidebar')}
          >
            <Icon
              type='hamburger'
              className={`${styles.hamburger} ${open ? styles.isOpen : ''} w-5 h-5`}
              aria-hidden='true'
            />
          </button>
        </div>

        {/* Sidebar: 3-Region Layout */}
        <aside
          className={`${styles.mobileMenu} ${
            open ? styles.isOpen : ''
          } lg:translate-x-0 lg:block w-full lg:w-80 border-r fixed lg:sticky top-0 h-screen solid bg-background z-30`}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {/* Header Region: desktop only — the mobile bar carries the
              logo and theme toggle below lg */}
          <div
            className='sidebar-header hidden lg:block border-b px-3 lg:px-6 py-2 lg:py-3'
            style={{ flexShrink: 0 }}
          >
            <div
              className={cn(
                'flex items-center justify-between gap-2',
                styles.headerRow,
              )}>
              <Link
                href='/'
                className={`text-lg font-semibold hidden lg:block ${styles.title} flex-1`}
              >
                <div className='flex flex-row gap-3 items-center'>
                  <Image
                    src='/logo.png'
                    alt={t('libraryTitle')}
                    className='logo w-8 h-8 lg:w-10 lg:h-10'
                    width={40}
                    height={40}
                  />
                  <p className={`text-base lg:text-lg ${styles.title}`}>
                    <span className='text-xs'>{t('libraryTitleSmall')}</span>
                    <br />
                    {t('libraryTitleLarge')}
                  </p>
                </div>
              </Link>
              <div className={styles.headerControls}>
                {themeToggle()}
                {preferencesButton()}
              </div>
            </div>
          </div>

          {/* Search Bar — desktop only; the mobile title bar owns it below lg */}
          <div
            className='sidebar-search hidden lg:block px-3 lg:px-6 pb-2'
            style={{ flexShrink: 0 }}
          >
            <SearchBar onNavigate={closeSidebar} />
          </div>

          {/* Body Region: Scrollable Library Navigation */}
          <div
            className='sidebar-body px-3 lg:px-6 py-3 lg:py-4'
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              scrollbarGutter: 'stable',
            }}
          >
            <SidebarShell
              onNavigate={closeSidebar}
              items={tree}
              collapseSiblings={true}
            />
          </div>

          {/* Footer Region: Non-scrolling Tools + Selected Character */}
          <div
            className='sidebar-footer border-t px-3 lg:px-4 py-2'
            style={{ flexShrink: 0 }}
          >
            <div className={styles.footerRow}>
              <div className={styles.footerTools}>
                <ToolsMenu
                  items={toolItems}
                  onSelect={handleToolSelect}
                  trigger={
                    <>
                      <Wrench size={18} aria-hidden='true' />
                      <span className='hidden lg:inline text-sm'>
                        {t('tools.label')}
                      </span>
                    </>
                  }
                />
              </div>
              {/* Desktop only — the mobile bar carries the badge below lg */}
              <div className='hidden lg:block'>
                <SelectedCharacterBadge />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 p-4 sm:p-10 ${styles.mainContent}`}>
          {children}
        </main>
      </div>
    </NotificationProvider>
  );
}

export default BaseResponsiveLayoutShell;
