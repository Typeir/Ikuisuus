/**
 * Client-only providers for the app layout.
 *
 * @fileoverview Supplies client-only providers: internationalization and persistent UI state.
 * @module app/[locale]/ClientProviders
 * @version 2.1.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { Item as SidebarItem } from '@/modules/navigation-sidebar/domain/types';
import { CharacterSheetProvider } from '@/lib/context/CharacterSheetContext';
import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import { ThemeColorSync } from '@/lib/components/viewport/ThemeColorSync';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import SwrProvider from './SwrProvider';
import ResponsiveLayoutShell from './utils/responsiveLayoutShell';

/**
 * Props for ClientProviders component
 *
 * @interface ClientProvidersProps
 * @property {string} locale - Current locale code (e.g., 'en', 'es', 'fi')
 * @property {SidebarItem[]} tree - Navigation tree structure for sidebar
 * @property {AbstractIntlMessages} messages - Internationalization messages for current locale
 * @property {string[]} initialExpandedPaths - Server-read expanded paths from cookies
 * @property {React.ReactNode} children - Child components to render
 */
interface ClientProvidersProps {
  locale: string;
  tree: SidebarItem[];
  messages: AbstractIntlMessages;
  initialExpandedPaths: string[];
  children: React.ReactNode;
}

/**
 * Composes client-side providers around children.
 *
 * @component
 * @param {ClientProvidersProps} props - Component props
 * @param {string} props.locale - Current locale code (e.g., 'en', 'es', 'fi')
 * @param {SidebarItem[]} props.tree - Navigation tree structure for sidebar
 * @param {AbstractIntlMessages} props.messages - Internationalization messages for current locale
 * @param {string[]} props.initialExpandedPaths - Server-read expanded paths from cookies
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} Nested provider tree with children
 *
 * @description
 * Nests providers outermost-to-innermost: NextIntlClientProvider, SwrProvider,
 * PersistentUiProvider, CharacterSheetProvider, ResponsiveLayoutShell.
 * ThemeColorSync sits inside PersistentUiProvider so the UA chrome colour
 * follows the reader's theme.
 * PersistentUiProvider falls back to localStorage then URL-derived ancestors when
 * initialExpandedPaths is absent.
 */
export default function ClientProviders({
  locale,
  tree,
  messages,
  initialExpandedPaths,
  children,
}: ClientProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone='UTC'>
      <SwrProvider>
        <PersistentUiProvider initialExpandedPaths={initialExpandedPaths}>
          <ThemeColorSync />
          <CharacterSheetProvider>
            {/* @ts-ignore */}
            <ResponsiveLayoutShell tree={tree}>{children}</ResponsiveLayoutShell>
          </CharacterSheetProvider>
        </PersistentUiProvider>
      </SwrProvider>
    </NextIntlClientProvider>
  );
}
