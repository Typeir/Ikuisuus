/**
 * Content Search API Route
 *
 * @fileoverview Next.js API route for searching MDX content files.
 * Performs filesystem-based search with title and body matching.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/app/api/search/route
 */

import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { REGEX_CONTENT_SUFFIX } from '../../../lib/enums/constants';
import { getContentFolder } from '../../../lib/utils/getContentFolder';

/**
 * Converts a string to kebab-case format.
 *
 * Transforms camelCase, PascalCase, snake_case, and spaces into lowercase
 * hyphen-separated format commonly used in URLs and file paths.
 *
 * @param {string} str - The string to convert
 * @returns {string} The kebab-cased string
 *
 * @example
 * toKebabCase('MyFileName') // 'my-file-name'
 * toKebabCase('snake_case_name') // 'snake-case-name'
 * toKebabCase('Space Separated') // 'space-separated'
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .toLowerCase();
}

/**
 * GET /api/search
 *
 * Searches MDX content files by filename matching.
 * Recursively walks the content directory and returns files whose names
 * contain the search query (case-insensitive).
 *
 * Query Parameters:
 * - q: Search query string (minimum 2 characters)
 *
 * Returns empty array if query is too short or no matches found.
 * Strips .sheet suffix and converts paths to kebab-case for URLs.
 *
 * @param {Request} req - Next.js request object with search params
 * @returns {NextResponse} JSON array of {name: string, path: string} objects
 *
 * @example
 * fetch('/api/search?q=dragon')
 * // Returns: [{name: 'Ancient Dragon', path: 'monsters/ancient-dragon'}, ...]
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  const matches: { name: string; path: string }[] = [];

  if (q.length < 2) return NextResponse.json([]);

  const contentDir = getContentFolder();

  /**
   * Recursively walks directory tree to find matching MDX files.
   *
   * @param {string} dir - Current directory path to scan
   * @param {string} base - Accumulated relative path for URL construction
   */
  function walk(dir: string, base: string = ''): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const rawStem = entry.name.replace(/\.(md|mdx)$/, '');
      const cleanStem = rawStem.replace(REGEX_CONTENT_SUFFIX, '');
      const kebabPath = path
        .join(base, toKebabCase(cleanStem))
        .replace(/\\/g, '/');

      if (entry.isDirectory()) {
        walk(fullPath, kebabPath);
      } else if (
        (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) &&
        cleanStem.toLowerCase().includes(q)
      ) {
        matches.push({
          name: cleanStem,
          path: kebabPath,
        });
      }
    }
  }

  walk(contentDir);

  return NextResponse.json(matches);
}
