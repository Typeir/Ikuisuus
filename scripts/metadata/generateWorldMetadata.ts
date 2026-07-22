/**
 * @fileoverview World / Lore Metadata Generator
 * @description Parses `.lore.mdx` files in `src/content/{locale}/world/` and
 * emits `.metadata.json` sidecars. EXTRACTS FROM YAML FRONTMATTER ONLY — the
 * generator does NOT regex-scan prose body content (NLP/spacy is a future
 * effort). When no frontmatter is present, a minimal record is emitted with
 * `slug`, `title` (from the first H1), `file`, and `link`.
 *
 * Frontmatter vs. tier-HR disambiguation: many lore files use `---` as
 * knowledge-tier horizontal rules (Common / Advanced / Deep / Truth). The
 * generator distinguishes true leading frontmatter via `gray-matter` (which
 * only parses a leading `---`…`---` block), so body HRs are never mis-parsed
 * as frontmatter.
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
 * Frontmatter field name → metadata key mapping used when a lore file does
 * have YAML frontmatter.
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
 * Parses a single world/lore MDX file into a metadata record.
 *
 * Uses `gray-matter` to attempt frontmatter extraction at file head. When no
 * frontmatter block is found, `matter(raw).data` is an empty object and the
 * record falls back to the minimal shape (slug, title from H1, file, link).
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

    const description = parseDescription(content);
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
 * Passes a custom `contentDir` because world content lives outside of
 * `CONTENT_PATHS` (which is en-specific). When called through the
 * orchestrator (`generateMetadata.ts`), the content directory is resolved
 * from `CONTENT_TYPES.world.dir`.
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

