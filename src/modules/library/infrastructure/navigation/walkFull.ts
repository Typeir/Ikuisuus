/**
 * @fileoverview Full recursive navigation walkers.
 * @module modules/library/infrastructure/navigation/walkFull
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import type { DirectorySourceAdapter } from '@/lib/db/content/directorySourceAdapter';
import {
    FILE_EXT_MD,
    FILE_EXT_MDX,
    IGNORED_FOLDERS,
    REGEX_CONTENT_SUFFIX,
    REGEX_EXTENSION,
} from '@/lib/enums/constants';
import { deduplicateFiles } from '@/lib/utils/deduplicateFiles';
import { toKebabCase } from '@/lib/utils/toKebabCase';
import { toTitleCase } from '@/lib/utils/toTitleCase';
import type { WalkNode } from './types';

/**
 * Recursively walks all visible content entries for navigation.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source adapter.
 * @param {string} locale - Locale code.
 * @param {string} relativePath - Relative path from content root.
 * @param {string} basePath - Path prefix for generated slugs.
 * @returns {Promise<WalkNode[]>} Full navigation tree.
 */
export async function walk(
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath: string,
  basePath: string,
): Promise<WalkNode[]> {
  const entries = await adapter.listEntries(locale, relativePath);
  const filteredEntries = entries
    .filter(
      (entry) =>
        !IGNORED_FOLDERS.some((pattern) => pattern.test(entry.name)) &&
        !entry.name.includes('.hidden.'),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const files = filteredEntries
    .filter(
      (entry) =>
        !entry.isDirectory &&
        (entry.name.endsWith(FILE_EXT_MD) || entry.name.endsWith(FILE_EXT_MDX)),
    )
    .map((entry) => entry.name);

  const deduplicatedFiles = deduplicateFiles(files);
  const nodes = await Promise.all(
    filteredEntries.map(async (entry) => {
      const fileName = entry.name.replace(REGEX_EXTENSION, '');
      const suffixMatch = fileName.match(REGEX_CONTENT_SUFFIX);
      const suffix = suffixMatch ? suffixMatch[0] : '';
      const baseFileName = suffix
        ? fileName.slice(0, -suffix.length)
        : fileName;
      const kebabBase = toKebabCase(baseFileName);
      const kebabPath = basePath ? `${basePath}/${kebabBase}` : kebabBase;

      if (entry.isDirectory) {
        const childRelativePath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;

        return {
          name: toTitleCase(baseFileName),
          path: kebabPath,
          children: await walk(adapter, locale, childRelativePath, kebabPath),
        } satisfies WalkNode;
      }

      if (
        (entry.name.endsWith(FILE_EXT_MD) ||
          entry.name.endsWith(FILE_EXT_MDX)) &&
        deduplicatedFiles.includes(entry.name)
      ) {
        return {
          name: toTitleCase(baseFileName),
          path: kebabPath,
        } satisfies WalkNode;
      }

      return null;
    }),
  );

  return nodes.filter(Boolean) as WalkNode[];
}

/**
 * Alias of walk.
 */
export const walkTree = walk;
