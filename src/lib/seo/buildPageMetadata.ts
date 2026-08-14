/**
 * @fileoverview Builds Next.js Metadata objects for library content pages.
 *
 * Assembles Open Graph and Twitter metadata from a PageSeoInput. Image and
 * URL paths are root-relative strings.
 *
 * @module lib/seo/buildPageMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { Metadata } from 'next';
import { getSupportedOgTypes } from './og/data';
import { resolvePageImage } from './resolvePageImage';
import type { PageSeoInput } from './types';

const SITE_NAME_SUFFIX = '| Library of Ikuisuus';
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

/**
 * Parses a `slugPath` into an OG content type and slug.
 *
 * Supports flat paths (`monsters/slug`) and nested item paths
 * (`items/heirlooms/slug`). Returns `null` when no type is identified.
 *
 * @param {string} slugPath - Slash-separated content path
 * @returns {{ type: string; slug: string } | null} Parsed type + slug or null
 */
function parseOgType(slugPath: string): { type: string; slug: string } | null {
  const parts = slugPath.split('/');
  if (parts.length < 2) return null;

  const lastSegment = parts[parts.length - 1]!;

  /** items/heirlooms/slug → type = 'heirlooms' */
  if (parts.length >= 3 && parts[0] === 'items') {
    const subtype = parts[1]!;
    if (getSupportedOgTypes().includes(subtype)) {
      return { type: subtype, slug: lastSegment };
    }
    return null;
  }

  /** monsters/slug, spells/slug, etc. */
  const topType = parts[0]!;
  if (getSupportedOgTypes().includes(topType)) {
    return { type: topType, slug: lastSegment };
  }

  return null;
}

/**
 * Appends the site name suffix to a page title.
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
 * @param {PageSeoInput} input - SEO input record for the page.
 * @returns {Metadata} Complete Next.js Metadata object.
 */
export function buildPageMetadata(input: PageSeoInput): Metadata {
  const ogTypeParsed = parseOgType(input.slugPath);
  const dynamicOgUrl = ogTypeParsed
    ? `/api/og/${ogTypeParsed.type}/${ogTypeParsed.slug}`
    : null;
  const imageUrl =
    dynamicOgUrl ?? resolvePageImage(input.image, input.slugPath);
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
