/**
 * @fileoverview Dynamic MDX content page for the library.
 * @module app/[locale]/library/[...slug]/page
 *
 * The rendering itself lives in `<LibraryContent>`, shared with the embed route
 * at `/{locale}/embed/[...slug]`. This route supplies the full wiki chrome.
 * @author Typeir
 * @version 2.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import {
  buildLibraryMetadata,
  generateLibraryStaticParams,
} from '@/modules/library/application/use-cases';
import { LibraryContent } from '@/modules/library/presentation/LibraryContent';
import { Metadata } from 'next';
import type { JSX } from 'react';

const log = logger.child({ module: 'LibraryPage' });

/**
 * Generates all static params for dynamic `[...slug]` route.
 *
 * Next.js uses this at build time to statically generate all MDX pages.
 *
 * @returns {Promise<Array<{ slug: string[] }>>} Array of slug params.
 */
export async function generateStaticParams(): Promise<
  Array<{ slug: string[] }>
> {
  return generateLibraryStaticParams();
}
/**
 * Props for the dynamic content route.
 */
type PageProps = {
  params: Promise<{
    slug: string[];
    locale: string;
  }>;
};

/**
 * Generates full SEO metadata for the page.
 *
 * Title resolution order: frontmatter `title` â†’ first MDX H1 â†’ slug-derived title.
 * Description resolution order: frontmatter `description` â†’ first prose paragraph.
 * Image resolution order: frontmatter `image` â†’ slug-derived public file â†’ `.webp` candidate.
 *
 * @param {PageProps} props - Route params
 * @param {Promise<{ slug: string[], locale: string }>} props.params - Async route parameters
 * @returns {Promise<Metadata>} Page metadata with openGraph and twitter sub-objects.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;

  try {
    return await buildLibraryMetadata({ slug, locale });
  } catch (error) {
    log.error('Error generating metadata', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });

    return {
      title: 'Library of Ikuisuus',
    };
  }
}

/**
 * Dynamic content page rendering one library article inside the wiki chrome.
 *
 * @param {PageProps} props - Route params
 * @param {Promise<{ slug: string[], locale: string }>} props.params - Async route parameters
 * @returns {Promise<JSX.Element>} Rendered page
 */
const Page = async ({ params }: PageProps): Promise<JSX.Element> => {
  const { slug, locale } = await params;

  return <LibraryContent slug={slug} locale={locale} basePath='library' />;
};

export default Page;

export const dynamic = 'force-static';
