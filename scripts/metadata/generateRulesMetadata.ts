/**
 * @fileoverview Rules Metadata Generator
 * @description Parses `.mdx` files in `src/content/{locale}/rules/` and emits
 * `.metadata.json` sidecars with slug, title, link, description, and
 * folder-derived tags/category. Section hubs (`main.mdx`) are slugged and
 * sidecar-named after their parent folder.
 *
 * @module scripts/metadata/generateRulesMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import matter from 'gray-matter';
import path from 'path';
import {
  filePathToSlug,
  getMetaSubdir,
  parseDescription,
  parseFirstProseParagraph,
  parseTitle,
  runGenerator,
  runWithCli,
  type SharedData,
  type StorageAdapter,
} from '.';
import { SLUG } from './parsingPatterns';

const log = createLogger({ component: 'RulesMetadataGenerator' });

/** Content subdirectory path segments relative to the project root for `en`. */
const RULES_DIR_SEGMENTS = ['src', 'content', 'en', 'rules'];

/**
 * Whether a rules file is a section hub (`main.mdx`).
 *
 * @param {string} filePath - Absolute path to the rules file
 * @returns {boolean} True for `main.mdx` files
 */
function isSectionHub(filePath: string): boolean {
  return path.basename(filePath).toLowerCase() === 'main.mdx';
}

/**
 * Derives a page-level `library/rules/…` link from a file path. Section hubs
 * link to their folder (e.g. `/library/rules/steel-and-strife`), regular rule
 * pages to their own segment.
 *
 * @param {string} filePath - Absolute path to the rules file
 * @param {string} slug - URL-friendly identifier
 * @returns {string} Page-level link
 */
function deriveRulesLink(filePath: string, slug: string): string {
  const segments = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
  const rulesIdx = segments.lastIndexOf('rules');
  let relativeSegments: string[];

  if (rulesIdx !== -1) {
    relativeSegments = segments.slice(rulesIdx + 1);
  } else {
    relativeSegments = [slug];
  }

  const kebabSegments = relativeSegments
    .map((s) =>
      s
        .replace(/\.mdx$/, '')
        .replace(/\s+/g, '-')
        .replace(/_/g, '-')
        .toLowerCase(),
    )
    .filter((s) => s !== 'main');

  return `/library/rules${kebabSegments.length ? '/' : ''}${kebabSegments.join('/')}`;
}

/**
 * Derives display tags from the file's subfolder path under `rules/`.
 * `rules/steel-and-strife/initiative.mdx` → `['steel and strife']`; files at
 * the rules root get `['rules']`.
 *
 * @param {string} filePath - Absolute path to the rules file
 * @returns {string[]} Humanised folder tags
 */
function deriveRulesFolderTags(filePath: string): string[] {
  const segments = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
  const rulesIdx = segments.lastIndexOf('rules');
  if (rulesIdx === -1) return [];

  const folders = segments.slice(rulesIdx + 1, -1);
  if (folders.length === 0) return ['rules'];
  return folders.map((s) => s.replace(/[-_]+/g, ' ').toLowerCase());
}

/**
 * Parses a single rules MDX file into a metadata record.
 *
 * @param {string} filePath - Absolute path to the rules file
 * @param {SharedData} _sharedData - Shared game data (unused for rules)
 * @returns {Promise<object | null>} Metadata record, or null on parse error
 */
async function parseRulesFile(
  filePath: string,
  _sharedData: SharedData,
): Promise<object | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(raw);
    const lines = content.split('\n');

    const slug = isSectionHub(filePath)
      ? path.basename(path.dirname(filePath))
      : filePathToSlug(filePath);
    const title =
      (frontmatter.title as string | undefined) || parseTitle(lines);
    const relativePath = path
      .relative(process.cwd(), filePath)
      .replace(SLUG.pathBackslash, '/');
    const link = deriveRulesLink(filePath, slug);

    const metadata: Record<string, unknown> = {
      slug,
      title:
        title ||
        slug
          .replace(SLUG.hyphensUnderscores, ' ')
          .replace(SLUG.titleCase, (c) => c.toUpperCase()),
      file: relativePath,
      link,
      indexVersion: 1,
    };

    const description =
      (frontmatter.description as string | undefined) ||
      parseDescription(content) ||
      parseFirstProseParagraph(lines);
    if (description) {
      metadata.description = description;
    }

    const frontmatterTags = frontmatter.tags as string[] | undefined;
    const folderTags = deriveRulesFolderTags(filePath);
    const tags =
      Array.isArray(frontmatterTags) && frontmatterTags.length > 0
        ? frontmatterTags
        : folderTags;
    if (tags.length > 0) {
      metadata.tags = tags;
    }
    if (folderTags.length > 0) {
      metadata.category = folderTags[0];
    }

    return metadata;
  } catch (error) {
    log.warning('Error parsing rules file', {
      file: filePath,
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Resolves the sidecar output path for a rules file. Section hubs
 * (`main.mdx`) are named after their parent folder; regular rule pages
 * use the default suffix replacement.
 *
 * @param {string} sourceFilePath - Original MDX file path
 * @param {string} contentType - Content type key
 * @param {string} backend - 'pg' or 'fs'
 * @param {string} locale - Locale code
 * @returns {string} Absolute output path
 */
function resolveRulesOutputPath(
  sourceFilePath: string,
  contentType: string,
  locale: string,
): string {
  const baseName = isSectionHub(sourceFilePath)
    ? `${path.basename(path.dirname(sourceFilePath))}.metadata.json`
    : path.basename(sourceFilePath).replace(/\.mdx$/, '.metadata.json');

  return path.join(
    process.cwd(),
    '.meta',
    locale,
    getMetaSubdir(contentType),
    baseName,
  );
}

/**
 * Main entry point for rules metadata generation.
 *
 * @param {object} [options] - Configuration
 * @param {string} [options.contentDir] - Override content directory
 * @param {RegExp} [options.filePattern] - Override file pattern
 * @param {StorageAdapter} [options.storage] - Optional DB storage
 * @param {string} [options.locale] - Locale code (defaults to 'en')
 * @returns {Promise<void>}
 */
async function main(
  options: {
    contentDir?: string;
    filePattern?: RegExp;
    storage?: StorageAdapter;
    locale?: string;
  } = {},
): Promise<void> {
  const locale = options.locale ?? 'en';

  const defaultContentDir =
    options.contentDir ?? path.resolve(process.cwd(), ...RULES_DIR_SEGMENTS);

  await runGenerator({
    name: 'Rules Metadata Generator',
    contentType: 'rules',
    filePattern: options.filePattern || /\.mdx$/,
    parseFile: parseRulesFile,
    processResult: (result) => {
      if (result === null) return { metadata: null, count: 0 };
      return { metadata: result, count: 1 };
    },
    contentDir: defaultContentDir,
    storage: options.storage,
    locale,
    recursive: true,
    resolveOutputPath: resolveRulesOutputPath,
    metadataVersion: '1.0.0',
  });
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  runWithCli(main).catch((error) => {
    log.error('Fatal error during rules metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseRulesFile };
