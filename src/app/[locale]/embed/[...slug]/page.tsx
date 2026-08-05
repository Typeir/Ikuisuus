/**
 * @fileoverview Chrome-less embed route for library content.
 * @module app/[locale]/embed/[...slug]/page
 *
 * Serves the same articles as `/{locale}/library/[...slug]` with the wiki
 * chrome stripped, for rendering inside iframes â€” draggable preview panels,
 * world-sim overlays, archivist snippets. Statically generated alongside the
 * library tree, so an embed costs a cached document fetch rather than a
 * client-side compile.
 *
 * Embed mode rides the path rather than a query parameter deliberately; see
 * `src/lib/embed/embedRoutes.ts` for why.
 *
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import { logger } from '@/lib/logging/logger';
import {
  buildLibraryMetadata,
  generateLibraryStaticParams,
} from '@/modules/library/application/use-cases';
import { LibraryContent } from '@/modules/library/presentation/LibraryContent';
import { Metadata } from 'next';
import type { JSX } from 'react';

const log = logger.child({ module: 'EmbedPage' });

/**
 * Generates all static params for the embed `[...slug]` route.
 *
 * Mirrors the library tree exactly â€” every page that can be read can be
 * embedded.
 *
 * @returns {Promise<Array<{ slug: string[] }>>} Array of slug params.
 */
export async function generateStaticParams(): Promise<
  Array<{ slug: string[] }>
> {
  return generateLibraryStaticParams();
}

/**
 * Props for the embed content route.
 */
type PageProps = {
  params: Promise<{
    slug: string[];
    locale: string;
  }>;
};

/**
 * Generates metadata for the embed variant.
 *
 * Reuses the library metadata for title and description, then marks the page
 * `noindex, nofollow`. The embed and library trees serve identical prose, and
 * only the library URL should be the one search engines rank and users share.
 *
 * @param {PageProps} props - Route params
 * @param {Promise<{ slug: string[], locale: string }>} props.params - Async route parameters
 * @returns {Promise<Metadata>} Page metadata, excluded from indexing
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;

  const robots = { index: false, follow: false };

  try {
    return { ...(await buildLibraryMetadata({ slug, locale })), robots };
  } catch (error) {
    log.error('Error generating embed metadata', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });

    return { title: 'Library of Ikuisuus', robots };
  }
}

/**
 * Embed content page rendering one library article with no wiki chrome.
 *
 * @param {PageProps} props - Route params
 * @param {Promise<{ slug: string[], locale: string }>} props.params - Async route parameters
 * @returns {Promise<JSX.Element>} Rendered page
 */
const Page = async ({ params }: PageProps): Promise<JSX.Element> => {
  const { slug, locale } = await params;

  return <LibraryContent slug={slug} locale={locale} basePath='embed' />;
};

export default Page;

export const dynamic = 'force-static';
