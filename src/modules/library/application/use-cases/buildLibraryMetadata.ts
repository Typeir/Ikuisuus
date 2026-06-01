/**
 * @fileoverview Builds SEO metadata for library content pages.
 * @module modules/library/application/use-cases/buildLibraryMetadata
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { buildPageMetadata, extractDescriptionFromMdx } from '@/lib/seo';
import { fetchContent } from '@/modules/library/infrastructure/content/fetchContent';
import matter from 'gray-matter';
import type { Metadata } from 'next';

/**
 * Converts a kebab-case slug segment into a title-cased label.
 *
 * @param {string} segment - Kebab-case segment.
 * @returns {string} Title-cased segment.
 */
export function slugSegmentToTitle(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extracts the first H1 heading from markdown/MDX content.
 *
 * @param {string} content - Raw markdown/MDX content.
 * @returns {string | null} First heading text when available.
 */
export function extractH1FromMdx(content: string): string | null {
  const mdH1Match = content.match(/^#\s+(.+)$/m);
  if (mdH1Match) {
    return mdH1Match[1].trim();
  }

  const htmlH1Match = content.match(/<h1[^>]*>(.+?)<\/h1>/i);
  if (htmlH1Match) {
    return htmlH1Match[1].replace(/<[^>]*>/g, '').trim();
  }

  return null;
}

/**
 * Route metadata payload.
 */
export interface LibraryMetadataParams {
  slug: string[];
  locale: string;
}

/**
 * Builds route metadata for library content pages.
 *
 * @param {LibraryMetadataParams} params - Route metadata params.
 * @param {string[]} params.slug - Route slug segments.
 * @param {string} params.locale - Active locale.
 * @returns {Promise<Metadata>} Next.js metadata object.
 */
export async function buildLibraryMetadata({
  slug,
  locale,
}: LibraryMetadataParams): Promise<Metadata> {
  const slugSegments = (slug[0] === locale ? slug.slice(1) : slug).map(
    (segment) => decodeURIComponent(segment),
  );
  const slugPath = slugSegments.join('/');

  const result = await fetchContent(locale, slugPath);

  if (!result) {
    return {
      title: 'Not Found | Library of Ikuisuus',
    };
  }

  const { data: frontmatter, content: bodyContent } = matter(result.content);
  const fm = frontmatter as {
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
    keywords?: string | string[];
  };

  const fallbackTitle = slugSegmentToTitle(
    slugSegments[slugSegments.length - 1] ?? 'Library',
  );

  const resolvedTitle =
    fm.title ?? extractH1FromMdx(result.content) ?? fallbackTitle;

  const resolvedKeywords: string[] = Array.isArray(fm.keywords)
    ? fm.keywords
    : typeof fm.keywords === 'string'
      ? fm.keywords.split(',').map((keyword) => keyword.trim())
      : [...slugSegments.map(slugSegmentToTitle), 'd20', 'Library of Ikuisuus'];

  return buildPageMetadata({
    title: resolvedTitle,
    description:
      fm.description ?? extractDescriptionFromMdx(bodyContent) ?? undefined,
    image: fm.image,
    imageAlt: fm.imageAlt,
    keywords: resolvedKeywords,
    locale,
    slugPath,
  });
}
