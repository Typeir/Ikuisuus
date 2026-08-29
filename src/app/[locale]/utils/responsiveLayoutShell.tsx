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
 * NotificationProvider for toast messages. Below `lg` the fixed title bar
 * paints behind the status bar / display cutout and pads its controls clear
 * with the `--safe-area-*` tokens, and an always-mounted scrim dims the page
 * while the menu is open.
 */

'use client';

import btn from '@/styles/buttons.module.scss';
import { EmbedLinkBridge, isEmbedPathname } from '@/lib/embed';
import FlashlightLayer from '@/lib/components/flashlight/FlashlightLayer';
import { PreferencesModal } from '@/lib/components/preferences/PreferencesModal';
import { ThemeToggleButton } from '@/lib/components/themeToggle/ThemeToggleButton';
import themeToggleStyles from '@/lib/components/themeToggle/themeToggle.module.scss';
import { NotificationProvider } from '@/lib/components/ui';
import {
  useSidebarMenuActions,
  useSidebarMenuState,
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
import { usePathname, useRouter } from 'next/navigation';
import type { JSX } from 'react';
import { useState } from 'react';
import cn from '../../../lib/utils/classNameMerge';
import { MobileTitleBar } from './mobileTitleBar';
import styles from './responsiveLayoutShell.module.scss';
import { useThemeChangedEvent } from './useThemeChangedEvent';

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
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const t = useTranslations('layout');
  const tPreferences = useTranslations('preferences');
  const router = useRouter();
  const toolItems = useToolRegistry();

  const pathname = usePathname();
  const isEmbed = isEmbedPathname(pathname ?? '');

  useThemeChangedEvent();

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
        {/* The search bar lives in the title bar on mobile; the sidebar's
            copy is desktop-only. */}
        <MobileTitleBar
          open={open}
          onToggle={toggleSidebar}
          onNavigate={closeSidebar}
          controls={
            <>
              {themeToggle(styles.headerIconSlot)}
              {preferencesButton(styles.headerIconSlot)}
            </>
          }
        />

        {/* Scrim: dims the page behind the open mobile menu and closes it on
            tap. Always mounted so it fades in and out. */}
        <button
          type='button'
          onClick={closeSidebar}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          aria-label={t('closeSidebar')}
          className={`${styles.scrim} ${open ? styles.isOpen : ''}`}
        />

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
            className='sidebar-footer relative border-t px-3 lg:px-4 py-2'
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
        {/* `min-w-0`: a flex item's automatic minimum is its content's
            min-content width, so a wide scroller inside (an unpacked aspect
            carousel, a table) would otherwise widen main and shove the page. */}
        <main className={`flex-1 min-w-0 p-4 sm:p-10 ${styles.mainContent}`}>
          {children}
        </main>
      </div>
    </NotificationProvider>
  );
}

export default BaseResponsiveLayoutShell;
