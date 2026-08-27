/**
 * Root layout component.
 *
 * @fileoverview Next.js root layout with locale support and sidebar navigation
 * tree generation. Wraps all pages with client providers.
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
import { repositoryShallowWalk } from '@/modules/library/infrastructure/navigation/repositoryWalk';

import type { Metadata, Viewport } from 'next';
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

  const tree = await repositoryShallowWalk(locale);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const initialExpandedPaths = await getServerExpandedPaths();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(fonts.map((font) => font.variable))}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: getCombinedInitScript() }} />
      </head>
      <body suppressHydrationWarning>
        <ClientProviders
          locale={locale}
          tree={tree}
          messages={messages}
          initialExpandedPaths={initialExpandedPaths}
        >
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

export const dynamic = 'force-static';

/**
 * Returns the locale params to prerender.
 *
 * @returns {Array<{ locale: string }>} Locale params to prerender
 */
export function generateStaticParams(): Array<{ locale: string }> {
  return [{ locale: 'en' }];
}

/**
 * Site-wide metadataBase so Next.js resolves relative `/library/images/...`
 * paths in page-level Metadata objects to absolute URLs.
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  appleWebApp: {
    capable: true,
    title: 'Ikuisuus',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

/**
 * Viewport contract for the document.
 *
 * `viewportFit: 'cover'` lets the page paint into the display cutout instead
 * of being letterboxed beside it; the mobile title bar pads itself clear with
 * the `--safe-area-*` tokens. Browsers without cutout support report zero
 * insets and lay out unchanged.
 *
 * `interactiveWidget: 'resizes-content'` shrinks the layout viewport when the
 * on-screen keyboard opens, so the fixed title bar stays anchored to the
 * visible area while the search field is focused.
 *
 * @type {Viewport}
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};
