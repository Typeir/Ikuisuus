/**
 * @fileoverview Embed route serving library articles with the wiki chrome stripped.
 * @module app/[locale]/embed/[...slug]/page
 *
 * Serves the same articles as `/{locale}/library/[...slug]` without wiki chrome.
 * Statically generated; renders inside iframes.
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
 * Generates a param set matching the library tree.
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
 * Returns library metadata with `noindex, nofollow` robots set.
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
