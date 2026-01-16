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
import { getContentFolder } from '@/lib/utils/getContentFolder';
import { getServerExpandedPaths } from '@/lib/utils/getServerPersistentData';
import { getCombinedInitScript } from '@/lib/utils/persistentUiScript';
import { walk } from '@/lib/utils/walk';

import { hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import path from 'path';
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
  const contentDir = path.join(getContentFolder(locale));
  const tree = walk(contentDir);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const initialExpandedPaths = await getServerExpandedPaths();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Theme init script - runs synchronously before React hydration */}
        <script dangerouslySetInnerHTML={{ __html: getCombinedInitScript() }} />
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

// export const dynamic = 'force-static';
