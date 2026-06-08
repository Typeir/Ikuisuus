/**
 * @fileoverview Builds static params for the library catch-all route.
 * @module modules/library/application/use-cases/generateStaticParams
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { REGEX_CONTENT_SUFFIX } from '@/lib/enums/constants';
import findAllMdxFiles from '@/modules/library/infrastructure/content/findAllMdxFiles';
import path from 'path';

/**
 * Generates static slug params for the dynamic library route.
 *
 * @param {string} [contentRoot] - Optional content root override.
 * @returns {Promise<Array<{ slug: string[] }>>} Next.js static params.
 */
export async function generateLibraryStaticParams(
  contentRoot: string = path.join(process.cwd(), 'src', 'content', 'en'),
): Promise<Array<{ slug: string[] }>> {
  const mdxFiles = await findAllMdxFiles(contentRoot);

  return mdxFiles.map((filePath) => {
    const relativePath = path.relative(contentRoot, filePath);
    const slug = relativePath
      .replace(/\.mdx$/, '')
      .replace(REGEX_CONTENT_SUFFIX, '')
      .split(path.sep);

    return { slug };
  });
}
