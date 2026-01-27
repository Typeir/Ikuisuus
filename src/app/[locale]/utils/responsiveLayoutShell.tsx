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
import Icon from '@/lib/components/icon/icon';
import { Sidebar } from '@/lib/components/sidebar/sidebar';
import { ToolMenuItem, ToolsMenu } from '@/lib/components/toolsMenu/toolsMenu';
import { NotificationProvider } from '@/lib/components/ui';
import {
  useSidebarMenuActions,
  useSidebarMenuState,
  useThemeActions,
  useThemeState,
} from '@/lib/context/PersistentUiContext';
import { Theme } from '@/lib/enums/themes';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from './responsiveLayoutShell.module.scss';

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
  const t = useTranslations('layout');
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;

  const toolItems: ToolMenuItem[] = [
    {
      id: 'encounter-creator',
      label: t('tools.encounterCreator'),
      href: `/${locale}/utils/encounter-planner`,
    },
  ];

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
                  <h1 className={`text-base lg:text-lg ${styles.title}`}>
                    <span className='text-xs'>{t('libraryTitleSmall')}</span>
                    <br />
                    {t('libraryTitleLarge')}
                  </h1>
                </div>
              </Link>
              <button
                onClick={toggleTheme}
                className={tertiaryStyles.tertiaryButton}
                aria-label='Toggle theme'>
                <span className={styles.emojiIcon} />
              </button>
            </div>
          </div>

          {/* Body Region: Scrollable Library Navigation */}
          <div
            className='sidebar-body px-3 lg:px-6 py-3 lg:py-4'
            style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <Sidebar
              onNavigate={closeSidebar}
              items={tree}
              collapseSiblings={true}
            />
          </div>

          {/* Footer Region: Non-scrolling Tools */}
          <div
            className='sidebar-footer border-t px-3 lg:px-4 py-2'
            style={{ flexShrink: 0 }}>
            <ToolsMenu
              items={toolItems}
              onSelect={handleToolSelect}
              trigger={
                <>
                  <span className={styles.toolsEmoji} />
                  <span className='hidden lg:inline text-sm'>Tools</span>
                </>
              }
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className='flex-1 p-6 sm:p-10 mt-12 lg:mt-0'>{children}</main>
      </div>
    </NotificationProvider>
  );
}

export default BaseResponsiveLayoutShell;
