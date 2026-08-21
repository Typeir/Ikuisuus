/**
 * @fileoverview Builds sitemap.xml from the English content tree, mapping each
 * MDX file to its canonical locale-prefixed URL. Index files map to the URL of
 * the folder they stand for.
 *
 * @module app/sitemap
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import {
  isIndexFile,
  REGEX_EXTENSION,
  stripContentSuffix,
} from '@/lib/enums/constants';
import { resolveMetadataBase } from '@/lib/seo';
import findAllMdxFiles from '@/modules/library/infrastructure/content/findAllMdxFiles';
import type { MetadataRoute } from 'next';
import path from 'path';

/** Root path for English content files. */
const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content', 'en');

/**
 * Resolves a content file's slug path, pruning the extension and content-type
 * suffix. An index file resolves to its containing folder.
 *
 * @param {string} relativePath - Path relative to the content root
 * @returns {string} Slug path with forward slashes, empty for a root index
 */
function slugPathFor(relativePath: string): string {
  const segments = relativePath.split(/[\\/]/);
  const fileName = segments.pop() ?? '';
  const folderName = segments[segments.length - 1] ?? '';

  if (isIndexFile(fileName, folderName)) {
    return segments.join('/');
  }

  const stem = stripContentSuffix(fileName.replace(REGEX_EXTENSION, ''));
  return [...segments, stem].join('/');
}

/**
 * Generates the sitemap.xml for all published English library content pages.
 *
 * @returns {Promise<MetadataRoute.Sitemap>} Array of sitemap entry objects
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolveMetadataBase().toString().replace(/\/$/, '');
  const mdxFiles = await findAllMdxFiles(CONTENT_ROOT);
  const lastModified = new Date();

  const slugs = new Set<string>();
  for (const filePath of mdxFiles) {
    const slugPath = slugPathFor(path.relative(CONTENT_ROOT, filePath));
    if (slugPath) slugs.add(slugPath);
  }

  return [...slugs].map((slugPath) => ({
    url: `${base}/en/library/${slugPath}`,
    lastModified,
    priority: 0.8,
  }));
}
