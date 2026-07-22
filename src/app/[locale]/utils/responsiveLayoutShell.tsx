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

import tertiaryStyles from '@/lib/components/button/tertiaryButton.module.scss';
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
      <div className={styles.embedShell}>
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

  return (
    <NotificationProvider position='top-right'>
      <FlashlightLayer />
      <div className='sidebar-container flex flex-col lg:flex-row min-h-screen relative max-w-full'>
        {/* Sticky Hamburger Button */}
        <button
          onClick={toggleSidebar}
          className='hamburger lg:hidden fixed top-4 right-4 z-50 bg-background border p-2 rounded shadow-md'
          aria-label={t('toggleSidebar')}>
          <Icon
            type='hamburger'
            className={`${styles.hamburger} ${open ? styles.isOpen : ''} w-6 h-6`}
            aria-hidden='true'
          />
        </button>

        {/* Sticky Mobile Title Bar */}
        <div className='mobile-title-bar solid lg:hidden fixed top-0 left-0 w-full h-[72px] z-40 flex items-center px-4 border-b bg-background shadow-sm max-w-full'>
          <Link
            href='/'
            className='py-8 px-6 text-base font-semibold leading-tight'>
            {t('libraryTitle')}
          </Link>
        </div>

        {/* Sidebar: 3-Region Layout */}
        <aside
          className={`${styles.mobileMenu} ${
            open ? styles.isOpen : ''
          } lg:translate-x-0 lg:block w-full lg:w-80 border-r fixed lg:sticky top-0 h-screen solid bg-background z-30`}
          style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Header Region: Non-scrolling */}
          <div
            className='sidebar-header border-b px-3 lg:px-6 py-2 lg:py-3'
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
              <button
                onClick={toggleTheme}
                className={cn(
                  tertiaryStyles.tertiaryButton,
                  styles.themeToggle,
                )}
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
            </div>
          </div>

          {/* Search Bar — always visible under heading */}
          <div
            className='sidebar-search px-3 lg:px-6 pb-2'
            style={{ flexShrink: 0 }}>
            <SearchBar onNavigate={closeSidebar} />
          </div>

          {/* Body Region: Scrollable Library Navigation */}
          <div
            className='sidebar-body px-3 lg:px-6 py-3 lg:py-4'
            style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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
              <SelectedCharacterBadge />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className='flex-1 p-4 sm:p-10 mt-12 lg:mt-0'>{children}</main>
      </div>
    </NotificationProvider>
  );
}

export default BaseResponsiveLayoutShell;
