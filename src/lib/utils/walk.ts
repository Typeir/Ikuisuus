/**
 * Directory Walker Utility
 * 
 * @fileoverview Recursive directory traversal for building navigation trees.
 * Converts filesystem structure to URL-friendly paths with proper deduplication.
 * 
 * @module walk
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires fs Node.js file system module
 * @requires path Node.js path module
 * @requires ../enums/constants File patterns and ignored folders
 * @requires ./deduplicateFiles File deduplication utility
 * @requires ./toKebabCase String formatting utility
 * @requires ./toTitleCase String formatting utility
 * 
 * @description
 * Builds navigation tree structure from content directories:
 * - Recursively traverses directory structure
 * - Converts filenames to kebab-case URL paths
 * - Handles .sheet.mdx suffix for monster stat blocks
 * - Deduplicates files with same base name (prefers longer names)
 * - Filters out ignored directories and hidden files
 * 
 * @example
 * ```typescript
 * const tree = walk('/path/to/content');
 * // Returns: [{ name: 'Monsters', path: 'monsters', children: [...] }]
 * ```
 */

import fs from 'fs';
import path from 'path';
import {
  FILE_EXT_MD,
  FILE_EXT_MDX,
  IGNORED_FOLDERS,
  REGEX_EXTENSION,
  RegexPatterns,
} from '../enums/constants';
import { deduplicateFiles } from './deduplicateFiles';
import { toKebabCase } from './toKebabCase';
import { toTitleCase } from './toTitleCase';
import { logger } from '@/lib/logging/logger';

/**
 * Recursively traverses a directory and builds a tree of files and folders.
 *
 * - Converts filenames to kebab-case paths.
 * - Deduplicates files sharing the same base name, preferring longer names.
 * - Ignores folders listed in `IGNORED_FOLDERS`.
 *
 * @param {string} dir - Directory path to traverse.
 * @param {string} base - Base path prefix for recursion (default is '').
 * @returns {Array<{ name: string; path: string; children?: any[] }>} Tree nodes for navigation.
 */
export const walk = (
  dir: string,
  base = ''
): { name: string; path: string; children?: any[] }[] => {
  // Check if path exists and is a directory
  if (!fs.existsSync(dir)) {
    logger.warning('[walk] Directory does not exist', { dir, base });
    return [];
  }
  
  const stats = fs.statSync(dir);
  if (!stats.isDirectory()) {
    logger.warning('[walk] Path is not a directory', { dir, base, isDir: stats.isDirectory() });
    return [];
  }

  const IGNORED_FOLDERS_SET = new Set<string>(IGNORED_FOLDERS);

  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !IGNORED_FOLDERS_SET.has(e.name) && !e.name.includes(".hidden."))
    .sort((a, b) => a.name.localeCompare(b.name));

  logger.message('[walk] Reading directory', {
    dir,
    base,
    entryCount: entries.length,
    entries: entries.slice(0, 5).map(e => ({ name: e.name, isDir: e.isDirectory() })),
  });

  const files = entries
    .filter(
      (e) =>
        !e.isDirectory() &&
        (e.name.endsWith(FILE_EXT_MD) || e.name.endsWith(FILE_EXT_MDX))
    )
    .map((e) => e.name);

  const deduplicatedFiles = deduplicateFiles(files);

  return entries
    .map((entry) => {
      const fullPath = path.join(dir, entry.name);
      const fileName = entry.name.replace(REGEX_EXTENSION, '');
      
      // CRITICAL: Handle .sheet suffix before kebab-case conversion
      // toKebabCase removes ALL dots, so we must:
      // 1. Check if filename has .sheet suffix
      // 2. Remove .sheet for kebab-case conversion
      // 3. Convert base name to kebab-case (removes remaining dots)
      // 4. Add .sheet back if it was present
      // Without this, "abandoned-old-war-machine.sheet" becomes "abandoned-old-war-machinesheet"
      const hasSheet = fileName.endsWith('.sheet');
      const baseFileName = fileName.replace(RegexPatterns.SheetSuffix, '');
      const kebabBase = toKebabCase(baseFileName);
      const kebabFileName = hasSheet ? kebabBase + '.sheet' : kebabBase;
      // Normalize to forward slashes for URL consistency (works on Windows and Unix)
      const kebabPath = path.join(base, kebabFileName).replace(/\\/g, '/');
      const prettyFileName = baseFileName;

      if (entry.isDirectory()) {
        return {
          name: toTitleCase(prettyFileName),
          path: kebabPath,
          children: walk(fullPath, kebabPath),
        };
      }

      if (
        entry.name.endsWith(FILE_EXT_MD) ||
        entry.name.endsWith(FILE_EXT_MDX)
      ) {
        if (!deduplicatedFiles.includes(entry.name)) {
          return null; // Skip duplicate files
        }
        return {
          name: toTitleCase(prettyFileName),
          path: kebabPath,
        };
      }

      return null;
    })
    .filter(Boolean) as any[];
};
