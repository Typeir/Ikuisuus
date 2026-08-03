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
 * Sidebar open/close state persists across page navigations and refreshes
 * via PersistentUiContext. Integrates with NotificationProvider for toast messages.
 */

'use client';

import btn from '@/styles/buttons.module.scss';
import FlashlightLayer from '@/lib/components/flashlight/FlashlightLayer';
import Icon from '@/lib/components/icon/icon';
import { NotificationProvider } from '@/lib/components/ui';
import {
  useSidebarMenuActions,
  useSidebarMenuState,
  useThemeActions,
  useThemeState,
} from '@/lib/context/PersistentUiContext';
import { Theme } from '@/lib/enums/themes';
import { SelectedCharacterBadge } from '@/modules/character-builder';
import { SidebarShell } from '@/modules/navigation-sidebar';
import { SearchBar } from '@/modules/search/presentation/SearchBar/SearchBar';
import {
  ToolsMenu,
  useToolRegistry,
  type ToolMenuItem,
} from '@/modules/tools-menu';
import { Moon, Sun, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
 * Responsive layout shell component wrapping the application content.
 *
 * Provides a 3-region sidebar: header (logo+theme), scrollable library navigation, and tools footer.
 * The sidebar open/close state persists via PersistentUiContext.
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
  const { setTheme } = useThemeActions();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('layout');
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const toolItems = useToolRegistry();

  const searchParams = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Dispatch theme-change event on window so non-React subsystems
   * (e.g. Three.js World Sim) can react to theme toggles.
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
   * Intercept link clicks in embed mode to preserve ?embed=true across
   * in-iframe navigations. Without this, clicking a link inside the embedded
   * page loses the query param and the full layout (with sidebar) renders.
   */
  useEffect(() => {
    if (!isEmbed) return;
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.searchParams.has('embed')) return;
        e.preventDefault();
        url.searchParams.set('embed', 'true');
        router.push(`${url.pathname}${url.search}`);
      } catch {
        return;
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isEmbed, router]);

  /** In embed mode, render only the bare page content — no sidebar, no header */
  if (isEmbed) {
    return (
      <div className={styles.embedShell} data-embed>
        <main className={styles.embedContent}>{children}</main>
      </div>
    );
  }

  const toggleTheme = () => {
    const newTheme = currentTheme === Theme.Dark ? Theme.Light : Theme.Dark;
    setTheme(newTheme);
  };

  const handleToolSelect = (tool: ToolMenuItem) => {
    closeSidebar();
    router.push(tool.href);
  };

  /** Theme toggle — rendered in the mobile bar and the desktop sidebar. */
  const themeToggle = (extraClassName?: string) => (
    <button
      onClick={toggleTheme}
      className={cn(btn.tertiary, styles.themeToggle, extraClassName)}
      aria-label='Toggle theme'>
      {mounted ? (
        currentTheme === Theme.Dark ? (
          <Moon size={20} aria-hidden='true' />
        ) : (
          <Sun size={20} aria-hidden='true' />
        )
      ) : (
        <span className={styles.ssrThemeIcon} aria-hidden='true' />
      )}
    </button>
  );

  return (
    <NotificationProvider position='top-right'>
      <FlashlightLayer />
      <div className='sidebar-container flex flex-col lg:flex-row min-h-screen relative max-w-full'>
        {/* Sticky Mobile Title Bar: four equal icon slots flanking a
            centered search bar — logo, theme, search, character, hamburger.
            The search bar lives here on mobile; the sidebar's copy is
            desktop-only. */}
        <div
          className={`mobile-title-bar solid lg:hidden fixed top-0 left-0 w-full z-40 flex items-center gap-1 px-2 border-b bg-background shadow-sm max-w-full ${styles.mobileTitleBar}`}>
          <Link
            href='/'
            className={styles.headerIconSlot}
            aria-label={t('libraryTitle')}>
            <Image
              src='/logo.png'
              alt={t('libraryTitle')}
              className='w-8 h-8'
              width={32}
              height={32}
            />
          </Link>
          {themeToggle(styles.headerIconSlot)}
          <div className='flex-1 min-w-0 px-1'>
            <SearchBar onNavigate={closeSidebar} />
          </div>
          <div className={styles.headerIconSlot}>
            <SelectedCharacterBadge dropDirection='down' />
          </div>
          <button
            onClick={toggleSidebar}
            className={cn(btn.tertiary, styles.headerIconSlot)}
            aria-label={t('toggleSidebar')}>
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
          style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Header Region: desktop only — the mobile bar carries the
              logo and theme toggle below lg */}
          <div
            className='sidebar-header hidden lg:block border-b px-3 lg:px-6 py-2 lg:py-3'
            style={{ flexShrink: 0 }}>
            <div className='flex items-center justify-between gap-2'>
              <Link
                href='/'
                className={`text-lg font-semibold hidden lg:block ${styles.title} flex-1`}>
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
              {themeToggle()}
            </div>
          </div>

          {/* Search Bar — desktop only; the mobile title bar owns it below lg */}
          <div
            className='sidebar-search hidden lg:block px-3 lg:px-6 pb-2'
            style={{ flexShrink: 0 }}>
            <SearchBar onNavigate={closeSidebar} />
          </div>

          {/* Body Region: Scrollable Library Navigation */}
          <div
            className='sidebar-body px-3 lg:px-6 py-3 lg:py-4'
            style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarGutter: 'stable' }}>
            <SidebarShell
              onNavigate={closeSidebar}
              items={tree}
              collapseSiblings={true}
            />
          </div>

          {/* Footer Region: Non-scrolling Tools + Selected Character */}
          <div
            className='sidebar-footer border-t px-3 lg:px-4 py-2'
            style={{ flexShrink: 0 }}>
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
