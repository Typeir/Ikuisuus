/**
 * Root Layout Component
 *
 * @fileoverview Next.js root layout with locale support, theme initialization,
 * and sidebar navigation tree generation. Wraps all pages with client providers.
 *
 * @module app/[locale]/layout
 * @version 2.1.0
 * @author Typeir
 * @since 1.0.0
 */

import { routing } from '@/i18n/routing';
import { resolveMetadataBase } from '@/lib/seo';
import { getServerExpandedPaths } from '@/lib/utils/getServerPersistentData';
import { getCombinedInitScript } from '@/lib/utils/persistentUiScript';
import { walk } from '@/lib/utils/walk';

import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import cn from '../../lib/utils/classNameMerge';
import { fonts } from '../fonts/';
import ClientProviders from './ClientProviders';
import './globals.scss';

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const tree = await walk(locale);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const initialExpandedPaths = await getServerExpandedPaths();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(fonts.map((font) => font.variable))}>
      {/* Theme init script - runs synchronously before React hydration */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: getCombinedInitScript() }} />
      </head>
      <body suppressHydrationWarning>
        <ClientProviders
          locale={locale}
          tree={tree}
          messages={messages}
          initialExpandedPaths={initialExpandedPaths}>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

export const dynamic = 'force-static';

/**
 * Site-wide metadataBase so all relative `/library/images/...` paths in
 * page-level Metadata objects are resolved to absolute URLs by Next.js.
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
};
