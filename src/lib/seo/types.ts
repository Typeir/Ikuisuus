/**
 * @fileoverview SEO module shared types.
 *
 * Defines the input contract for the SEO metadata builder used across all
 * library content pages.
 *
 * @module lib/seo/types
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Input record for building page-level SEO metadata.
 *
 * @interface PageSeoInput
 * @property {string} title - Page title without site name suffix.
 * @property {string} [description] - Short description for og:description and twitter:description.
 * @property {string} [image] - Explicit image path from MDX frontmatter.
 * @property {string} [imageAlt] - Alt text for the social preview image.
 * @property {string} locale - Active locale code, e.g. "en".
 * @property {string} slugPath - Slash-separated content path, e.g. "items/heirlooms/dreaded-defender".
 */
export interface PageSeoInput {
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  locale: string;
  slugPath: string;
}
