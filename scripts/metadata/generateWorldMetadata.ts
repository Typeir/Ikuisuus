/**
 * @fileoverview Parses `.lore.mdx` files in `src/content/{locale}/world/` and
 * emits `.metadata.json` sidecars. Parses leading frontmatter via `gray-matter`;
 * `description` falls back to the first prose paragraph, `tags`/`category` to
 * the `world/` subfolder path.
 *
 * @module scripts/metadata/generateWorldMetadata
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
  parseDescription,
  parseFirstProseParagraph,
  parseTitle,
  runGenerator,
  runWithCli,
  type SharedData,
  type StorageAdapter,
} from '.';
import { SLUG } from './parsingPatterns';

const log = createLogger({ component: 'WorldMetadataGenerator' });

/** Content subdirectory path segments relative to the project root for `en`. */
const WORLD_DIR_SEGMENTS = ['src', 'content', 'en', 'world'];

/**
 * Frontmatter field name → metadata key mapping.
 */
const FRONTMATTER_FIELD_MAP: Record<string, string> = {
  description: 'description',
  tags: 'tags',
  category: 'category',
  related: 'relatedSlugs',
  aliases: 'aliases',
  'knowledge-tiers': 'knowledgeTiers',
  knowledgeTiers: 'knowledgeTiers',
};

/**
 * Derives a page-level `library/world/…` link from a file path.
 *
 * @param {string} filePath - Absolute path to the lore file
 * @param {string} slug - URL-friendly identifier
 * @returns {string} Page-level link (e.g. `/library/world/the-lands-of-damocles/thule`)
 */
function deriveWorldLink(filePath: string, slug: string): string {
  const segments = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
  const worldIdx = segments.lastIndexOf('world');
  let relativeSegments: string[];

  if (worldIdx !== -1) {
    relativeSegments = segments.slice(worldIdx + 1);
  } else {
    relativeSegments = [slug];
  }

  const kebabSegments = relativeSegments.map((s) =>
    s
      .replace(/\.lore\.mdx$/, '')
      .replace(/\.mdx$/, '')
      .replace(/\s+/g, '-')
      .replace(/_/g, '-')
      .toLowerCase(),
  );

  return `/library/world/${kebabSegments.join('/')}`;
}

/**
 * Derives display tags from the file's subfolder path under `world/`.
 * `world/gods-and-demigods/dreamcatcher.lore.mdx` → `['gods and demigods']`;
 * files at the world root get `['lore']` so they still surface one tag.
 *
 * @param {string} filePath - Absolute path to the lore file
 * @returns {string[]} Humanised folder tags
 */
function deriveWorldFolderTags(filePath: string): string[] {
  const segments = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
  const worldIdx = segments.lastIndexOf('world');
  if (worldIdx === -1) return [];

  const folders = segments.slice(worldIdx + 1, -1);
  if (folders.length === 0) return ['lore'];
  return folders.map((s) => s.replace(/[-_]+/g, ' ').toLowerCase());
}

/**
 * Parses a world/lore MDX file into a metadata record.
 *
 * When no frontmatter block is found, falls back to the minimal shape
 * (slug, title from H1, file, link).
 *
 * @param {string} filePath - Absolute path to the lore file
 * @param {SharedData} _sharedData - Shared game data (unused for world lore)
 * @returns {Promise<object | null>} Metadata record, or null on parse error
 */
async function parseWorldFile(
  filePath: string,
  _sharedData: SharedData,
): Promise<object | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(raw);
    const lines = content.split('\n');
    const slug = filePathToSlug(filePath);
    const title =
      (frontmatter.title as string | undefined) || parseTitle(lines);
    const relativePath = path
      .relative(process.cwd(), filePath)
      .replace(SLUG.pathBackslash, '/');
    const link = deriveWorldLink(filePath, slug);

    const metadata: Record<string, unknown> = {
      slug,
      title: title || slug,
      file: relativePath,
      link,
      indexVersion: 1,
    };

    const description =
      parseDescription(content) ?? parseFirstProseParagraph(lines);
    if (description) {
      metadata.description = description;
    }

    if (frontmatter && typeof frontmatter === 'object') {
      for (const [key, value] of Object.entries(
        frontmatter as Record<string, unknown>,
      )) {
        const mappedKey = FRONTMATTER_FIELD_MAP[key] || key;
        if (mappedKey === 'title') continue;
        if (value !== undefined && value !== null) {
          metadata[mappedKey] = value;
        }
      }
    }

    /* Most lore files carry no frontmatter tags; derive them from the
       world/ subfolder path so MetaTrail and tag facets are never empty. */
    const folderTags = deriveWorldFolderTags(filePath);
    if (
      folderTags.length > 0 &&
      (!Array.isArray(metadata.tags) || metadata.tags.length === 0)
    ) {
      metadata.tags = folderTags;
    }
    if (metadata.category === undefined && folderTags.length > 0) {
      metadata.category = folderTags[0];
    }

    return metadata;
  } catch (error) {
    log.warning('Error parsing world file', {
      file: filePath,
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Main entry point for world/lore metadata generation.
 *
 * Passes a custom `contentDir`; world content lives outside `CONTENT_PATHS`.
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
    options.contentDir ?? path.resolve(process.cwd(), ...WORLD_DIR_SEGMENTS);

  await runGenerator({
    name: 'World / Lore Metadata Generator',
    contentType: 'world',
    filePattern: options.filePattern || /\.lore\.mdx$/,
    parseFile: parseWorldFile,
    processResult: (result) => {
      if (result === null) return { metadata: null, count: 0 };
      return { metadata: result, count: 1 };
    },
    contentDir: defaultContentDir,
    storage: options.storage,
    locale,
    recursive: true,
    metadataVersion: '1.0.0',
  });
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  runWithCli(main).catch((error) => {
    log.error('Fatal error during world metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseWorldFile };

