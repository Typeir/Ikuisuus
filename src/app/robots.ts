/**
 * @fileoverview Dynamic robots.txt for the Library of Ikuisuus.
 *
 * Allows all crawlers to index all pages and points to the canonical sitemap.
 * The base URL is resolved from the SITE_URL environment variable so the
 * sitemap reference always targets the production domain.
 *
 * @module app/robots
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { resolveMetadataBase } from '@/lib/seo';
import type { MetadataRoute } from 'next';

/**
 * Generates the robots.txt content for the site.
 *
 * @returns {MetadataRoute.Robots} Robots configuration allowing all crawlers with a sitemap pointer.
 */
export default function robots(): MetadataRoute.Robots {
  const base = resolveMetadataBase().toString().replace(/\/$/, '');
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${base}/sitemap.xml`,
  };
}
