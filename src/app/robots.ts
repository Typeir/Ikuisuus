/**
 * @fileoverview Builds robots.txt allowing all crawlers with a sitemap pointer.
 *
 * @module app/robots
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { resolveMetadataBase } from '@/lib/seo';
import type { MetadataRoute } from 'next';

/**
 * Returns robots.txt allowing all crawlers with a sitemap pointer.
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
