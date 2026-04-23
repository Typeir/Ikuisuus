/**
 * @fileoverview Next.js Metadata builder for library content pages.
 *
 * Assembles Open Graph and Twitter Card metadata objects from a content
 * page's SEO input record. Intended for use exclusively inside
 * `generateMetadata` exports in page routes.
 *
 * All image and URL paths are root-relative strings. Next.js resolves them
 * to absolute URLs automatically using the `metadataBase` set in the root
 * layout.
 *
 * @module lib/seo/buildPageMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { Metadata } from 'next';
import { resolvePageImage } from './resolvePageImage';
import type { PageSeoInput } from './types';

const SITE_NAME_SUFFIX = '| Library of Ikuisuus';
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

/**
 * Appends the site name suffix to a raw page title.
 *
 * @param {string} title - Page title without site suffix.
 * @returns {string} Full formatted title for `<title>` and `og:title`.
 */
function formatTitle(title: string): string {
  return `${title} ${SITE_NAME_SUFFIX}`;
}

/**
 * Builds the `openGraph` sub-object for a library content page.
 *
 * @param {PageSeoInput} input - SEO input record for the page.
 * @param {string} imageUrl - Resolved root-relative image path.
 * @returns {NonNullable<Metadata['openGraph']>} Open Graph metadata object.
 */
function buildOpenGraph(
  input: PageSeoInput,
  imageUrl: string,
): NonNullable<Metadata['openGraph']> {
  return {
    title: input.title,
    description: input.description,
    url: `/${input.locale}/library/${input.slugPath}`,
    images: [
      {
        url: imageUrl,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: input.imageAlt ?? input.title,
      },
    ],
    type: 'article',
  };
}

/**
 * Builds the `twitter` sub-object for a library content page.
 *
 * @param {PageSeoInput} input - SEO input record for the page.
 * @param {string} imageUrl - Resolved root-relative image path.
 * @returns {NonNullable<Metadata['twitter']>} Twitter Card metadata object.
 */
function buildTwitter(
  input: PageSeoInput,
  imageUrl: string,
): NonNullable<Metadata['twitter']> {
  return {
    card: 'summary_large_image' as const,
    title: input.title,
    description: input.description,
    images: [imageUrl],
  };
}

/**
 * Assembles a full Next.js `Metadata` object for a library content page.
 *
 * Resolves the OG image from frontmatter or slug convention and builds
 * `openGraph` and `twitter` sub-objects with consistent dimensions and
 * alt text. Also sets canonical URL, robots directives, author, publisher,
 * and page keywords.
 *
 * @param {PageSeoInput} input - SEO input record for the page.
 * @returns {Metadata} Complete Next.js Metadata object.
 */
export function buildPageMetadata(input: PageSeoInput): Metadata {
  const imageUrl = resolvePageImage(input.image, input.slugPath);
  return {
    title: formatTitle(input.title),
    description: input.description,
    keywords: input.keywords,
    authors: [
      { name: 'Library of Ikuisuus', url: 'https://ikuisuus.vercel.app' },
    ],
    publisher: 'Library of Ikuisuus',
    robots: { index: true, follow: true },
    alternates: { canonical: `/${input.locale}/library/${input.slugPath}` },
    openGraph: buildOpenGraph(input, imageUrl),
    twitter: buildTwitter(input, imageUrl),
  };
}
