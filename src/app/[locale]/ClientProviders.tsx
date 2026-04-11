/**
 * ClientProviders wrapper for client-only context/providers
 *
 * @fileoverview Provides client-only providers for layout including internationalization
 * and persistent UI state management.
 * @module ClientProviders
 * @version 2.1.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { Item as SidebarItem } from '@/lib/components/sidebar/sidebar';
import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
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
 * Root provider component wrapping the application with client-side contexts
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
 * Provider hierarchy (outermost to innermost):
 * 1. NextIntlClientProvider - Internationalization context
 * 2. PersistentUiProvider - Persistent UI state (theme, sidebar expansion)
 * 3. ResponsiveLayoutShell - Layout with sidebar and notifications
 *
 * PersistentUiProvider uses deterministic client-side initialization:
 * - Server provides initialExpandedPaths from cookies for SSR/client match
 * - Fallback chain: in-memory state → localStorage → URL-derived ancestors
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
      <PersistentUiProvider initialExpandedPaths={initialExpandedPaths}>
        {/* @ts-ignore */}
        <ResponsiveLayoutShell tree={tree}>{children}</ResponsiveLayoutShell>
      </PersistentUiProvider>
    </NextIntlClientProvider>
  );
}
