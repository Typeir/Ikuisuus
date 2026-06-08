/**
 * @fileoverview Dynamic sitemap.xml for the Library of Ikuisuus.
 *
 * Crawls the English content tree at build time using the same file-discovery
 * logic as `generateStaticParams`. Excludes `main.mdx` category index files
 * and maps every content MDX file to a canonical locale-prefixed URL.
 *
 * @module app/sitemap
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { REGEX_CONTENT_SUFFIX } from '@/lib/enums/constants';
import { resolveMetadataBase } from '@/lib/seo';
import findAllMdxFiles from '@/modules/library/infrastructure/content/findAllMdxFiles';
import type { MetadataRoute } from 'next';
import path from 'path';

/** Root path for English content files. */
const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content', 'en');

/**
 * Generates the sitemap.xml for all published English library content pages.
 *
 * @returns {Promise<MetadataRoute.Sitemap>} Array of sitemap entry objects.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolveMetadataBase().toString().replace(/\/$/, '');
  const mdxFiles = await findAllMdxFiles(CONTENT_ROOT);

  return mdxFiles
    .filter((filePath) => !filePath.endsWith('main.mdx'))
    .map((filePath) => {
      const relativePath = path.relative(CONTENT_ROOT, filePath);
      const slugPath = relativePath
        .replace(REGEX_CONTENT_SUFFIX, '')
        .replace(/\.mdx$/, '')
        .split(path.sep)
        .join('/');
      return {
        url: `${base}/en/library/${slugPath}`,
        lastModified: new Date(),
        priority: 0.8,
      };
    });
}
