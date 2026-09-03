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
    stripContentSuffix,
} from '@/lib/constants/content';
import { toKebabCase } from '@/lib/utils/toKebabCase';
import { toTitleCase } from '@/lib/utils/toTitleCase';
import type { WalkNode } from './types';

/**
 * Chooses one file per navigation slug, so that a suffixed content file and a
 * bare one sharing a base name do not both become nodes.
 *
 * A content suffix wins over none: `dragon.sheet.mdx` is preferred to
 * `dragon.mdx`, both of which resolve to the slug `dragon`. Where neither
 * carries a suffix, or both do, the first name in the sorted list wins.
 *
 * @param {string[]} files - Content filenames in one directory, already sorted.
 * @returns {Map<string, string>} Kebab-cased slug to the filename that owns it.
 *
 * @example
 * selectPreferredFiles(['dragon.mdx', 'dragon.sheet.mdx'])
 * // Map { 'dragon' => 'dragon.sheet.mdx' }
 */
export function selectPreferredFiles(files: string[]): Map<string, string> {
  const preferred = new Map<string, string>();

  for (const name of files) {
    const stem = name.replace(REGEX_EXTENSION, '');
    const hasSuffix = REGEX_CONTENT_SUFFIX.test(stem);
    const kebabBase = toKebabCase(stripContentSuffix(stem));
    const incumbent = preferred.get(kebabBase);

    if (incumbent === undefined) {
      preferred.set(kebabBase, name);
      continue;
    }

    const incumbentHasSuffix = REGEX_CONTENT_SUFFIX.test(
      incumbent.replace(REGEX_EXTENSION, ''),
    );

    if (hasSuffix && !incumbentHasSuffix) {
      preferred.set(kebabBase, name);
    }
  }

  return preferred;
}

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

  const preferredFiles = selectPreferredFiles(files);

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
        preferredFiles.get(kebabBase) === entry.name
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
