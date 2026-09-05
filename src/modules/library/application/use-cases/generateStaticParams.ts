/**
 * @fileoverview Builds static params for the library catch-all route.
 * @module modules/library/application/use-cases/generateStaticParams
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { isIndexFile, REGEX_CONTENT_SUFFIX } from '@/lib/constants/content';
import { getContentFolder } from '@/lib/utils/getContentFolder';
import findAllMdxFiles from '@/modules/library/infrastructure/content/findAllMdxFiles';
import path from 'path';

/**
 * Generates static slug params for the dynamic library route. A folder index —
 * `main`, or a file named after its folder — is served at the folder's route,
 * so that route is emitted beside the file's own.
 *
 * @param {string} [contentRoot] - Optional content root override.
 * @returns {Promise<Array<{ slug: string[] }>>} Next.js static params.
 */
export async function generateLibraryStaticParams(
  contentRoot: string = getContentFolder(),
): Promise<Array<{ slug: string[] }>> {
  const mdxFiles = await findAllMdxFiles(contentRoot);
  const seen = new Set<string>();
  const params: Array<{ slug: string[] }> = [];
  const push = (slug: string[]): void => {
    const key = slug.join('/');
    if (slug.length === 0 || seen.has(key)) return;
    seen.add(key);
    params.push({ slug });
  };

  for (const filePath of mdxFiles) {
    const relativePath = path.relative(contentRoot, filePath);
    const slug = relativePath
      .replace(/\.mdx$/, '')
      .replace(REGEX_CONTENT_SUFFIX, '')
      .split(path.sep);
    push(slug);

    const folder = slug.slice(0, -1);
    if (isIndexFile(path.basename(filePath), folder[folder.length - 1] ?? '')) {
      push(folder);
    }
  }

  return params;
}
