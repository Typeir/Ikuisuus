/**
 * @fileoverview Search Record Collector
 * @description Walks content directories for all 9 searchable content types,
 * extracts prose from MDX files, and joins metadata from `.metadata.json`
 * sidecars to produce `SearchRecord`-shaped entries for the Pagefind index.
 *
 * Locale-parameterized: accepts a `locale` argument. Sidecar lookup honors
 * METADATA_BACKEND: in `pg` mode `.meta/{locale}/{subdir}/` is tried first,
 * falling back to source-adjacent `src/content/{locale}/...` files (same
 * semantics as `src/lib/db/content/adapters/fs/readMetadataFiles.ts`).
 *
 * @module scripts/search/collectRecords
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { CONTENT_SUBDIR } from '@/modules/search/domain/contentTypes';
import { localizeLink } from '@/modules/search/domain/localizeLink';
import { promises as fs, type Dirent } from 'fs';
import path from 'path';
import {
  getMetadataBackend,
  getMetaSubdir,
} from '../metadata/generatorUtils';
import { extractProse } from './extractProse';

/** File patterns per content type for identifying source MDX files. */
const TYPE_PATTERNS: Record<string, RegExp> = {
  monsters: /\.sheet\.mdx$/,
  heirlooms: /\.heirloom\.mdx$/,
  spells: /\.mdx$/,
  trinkets: /\.trinket\.mdx$/,
  bloodlines: /\.bloodline\.mdx$/,
  vocations: /main\.mdx$/,
  specializations: /\.specialization\.mdx$/,
  feats: /\.mdx$/,
  world: /\.lore\.mdx$/,
  rules: /\.mdx$/,
};

/** Exclusion patterns applied after the suffix match (per-type special cases). */
const TYPE_EXCLUSIONS: Record<string, RegExp[]> = {
  feats: [/\/fighting-styles\//, /main\.mdx$/],
  spells: [/\/spell-lists\//],
  world: [],
  monsters: [],
  heirlooms: [],
  trinkets: [],
  bloodlines: [],
  vocations: [],
  specializations: [],
  rules: [],
};

/**
 * Shape of a record ready for Pagefind `addCustomRecord`.
 *
 * @interface IndexRecord
 * @property {string} url - Page-level URL with locale prefix
 * @property {string} content - Full plain-text prose
 * @property {string} language - ISO 639-1 locale code
 * @property {Record<string, string>} meta - Display metadata
 * @property {Record<string, string[]>} filters - Facet filters
 */
export interface IndexRecord {
  url: string;
  content: string;
  language: string;
  meta: Record<string, string>;
  filters: Record<string, string[]>;
}

/**
 * Strip the MDX-specific suffix from a filename to derive the slug.
 *
 * @param {string} fileName - Base filename (e.g. `aboleth.sheet.mdx`)
 * @returns {string} Sluggified name (e.g. `aboleth`)
 */
function deriveSlug(fileName: string, contentType: string): string {
  const pattern = TYPE_PATTERNS[contentType];
  if (!pattern) {
    return fileName.replace(/\.(md|mdx)$/, '');
  }
  return fileName.replace(pattern, '');
}

/**
 * Converts a folder slug (kebab or snake case) into a display title.
 *
 * @param {string} folderName - Raw directory name (e.g. `the-long-road`)
 * @returns {string} Humanised Title Case string (e.g. `The Long Road`)
 */
function humanizeFolderName(folderName: string): string {
  return folderName
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Derives a display title for a record. Prefers a sidecar `title`; otherwise
 * falls back to the filename-derived slug. When that slug is empty or a bare
 * `main` — i.e. a `main.mdx` index file with no usable title — the parent
 * folder name is humanised and used instead, so index pages never surface as
 * "main".
 *
 * @param {string} filePath - Absolute path to the source MDX file
 * @param {string} contentType - Content type key
 * @param {Record<string, unknown> | null} sidecar - Parsed metadata sidecar
 * @returns {string} Display title
 */
function deriveTitle(
  filePath: string,
  contentType: string,
  sidecar: Record<string, unknown> | null,
): string {
  const sidecarTitle = sidecar?.title;
  if (typeof sidecarTitle === 'string' && sidecarTitle.trim()) {
    return sidecarTitle;
  }

  const slug = deriveSlug(path.basename(filePath), contentType);
  if (!slug || slug.toLowerCase() === 'main') {
    return humanizeFolderName(path.basename(path.dirname(filePath)));
  }

  return slug;
}

/**
 * Derives a page-level URL path from a file path and content type.
 *
 * @param {string} filePath - Absolute path to the MDX file
 * @param {string} contentType - Content type key
 * @param {string} locale - Locale code
 * @returns {string} URL path (e.g. `/en/library/monsters/aboleth`)
 */
function deriveUrl(
  filePath: string,
  _contentType: string,
  locale: string,
): string {
  const normalized = filePath.replace(/\\/g, '/');
  const contentIdx = normalized.indexOf(`/content/${locale}/`);

  if (contentIdx !== -1) {
    let relative = normalized.slice(
      contentIdx + `/content/${locale}/`.length,
    );

    relative = relative
      .replace(/\.(?:sheet|lore|heirloom|trinket|bloodline|specialization)\.(?:md|mdx)$/, '')
      .replace(/\.(?:md|mdx)$/, '');

    return `/${locale}/library/${relative}`;
  }

  return `/${locale}/library/${deriveSlug(path.basename(filePath), _contentType)}`;
}

/**
 * Recursively scans a directory for MDX files matching the type pattern,
 * excluding files that match any exclusion pattern.
 *
 * @param {string} dir - Directory to scan
 * @param {RegExp} pattern - File matching regex
 * @param {RegExp[]} exclusions - Exclusion regex patterns
 * @returns {Promise<string[]>} Absolute file paths
 */
async function scanDir(
  dir: string,
  pattern: RegExp,
  exclusions: RegExp[],
): Promise<string[]> {
  const results: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    let entries: Dirent[] = [];
    try {
      entries = await fs.readdir(currentDir, {
        withFileTypes: true,
      });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (
        pattern.test(entry.name) &&
        !exclusions.some((ex) => ex.test(fullPath.replace(/\\/g, '/')))
      ) {
        results.push(fullPath);
      }
    }
  }

  await walk(dir);
  return results;
}

/**
 * Candidate sidecar paths for a source file, in lookup-priority order.
 *
 * Mirrors the metadata generators' output naming (`generateMetadata.ts`
 * CONTENT_TYPES patterns; `resolveVocationOutputPath` in
 * `generateVocationMetadata.ts`):
 * - vocations: `{dir}/main.mdx` → `{dir}/{dirName}.metadata.json`
 * - world: type suffix kept — `x.lore.mdx` → `x.lore.metadata.json`
 *   (plus the suffix-stripped form the standalone generator default emits)
 * - all others: type suffix replaced — e.g. `x.sheet.mdx` → `x.metadata.json`
 *
 * With METADATA_BACKEND=pg the generators write to
 * `.meta/{locale}/{metaSubdir}/{basename}` instead, so those paths are tried
 * first and the source-adjacent locations act as the fallback.
 *
 * @param {string} filePath - Absolute path to the source MDX file
 * @param {string} contentType - Content type key
 * @param {string} locale - Locale code
 * @returns {string[]} Absolute candidate paths, highest priority first
 */
function sidecarCandidates(
  filePath: string,
  contentType: string,
  locale: string,
): string[] {
  const sourceAdjacent: string[] = [];

  if (contentType === 'vocations') {
    const dir = path.dirname(filePath);
    sourceAdjacent.push(
      path.join(dir, `${path.basename(dir)}.metadata.json`),
    );
  } else if (
    contentType === 'rules' &&
    path.basename(filePath).toLowerCase() === 'main.mdx'
  ) {
    /* Rules section hubs are sidecar-named after their parent folder
       (13 main.mdx files would otherwise collide in .meta/) —
       see resolveRulesOutputPath in generateRulesMetadata.ts. */
    const dir = path.dirname(filePath);
    sourceAdjacent.push(
      path.join(dir, `${path.basename(dir)}.metadata.json`),
    );
  } else if (contentType === 'world') {
    sourceAdjacent.push(filePath.replace(/\.mdx$/, '.metadata.json'));
    sourceAdjacent.push(filePath.replace(/\.lore\.mdx$/, '.metadata.json'));
  } else {
    const pattern = TYPE_PATTERNS[contentType];
    if (pattern) {
      sourceAdjacent.push(filePath.replace(pattern, '.metadata.json'));
    }
  }

  const candidates: string[] = [];
  if (getMetadataBackend() === 'pg') {
    for (const sidecarPath of sourceAdjacent) {
      candidates.push(
        path.join(
          process.cwd(),
          '.meta',
          locale,
          getMetaSubdir(contentType),
          path.basename(sidecarPath),
        ),
      );
    }
  }
  candidates.push(...sourceAdjacent);
  return candidates;
}

/**
 * Reads the metadata sidecar for a source file, if it exists.
 *
 * Tries each candidate path from {@link sidecarCandidates} and returns the
 * first that parses. Monster sidecars are JSON arrays (one entry per stat
 * variant); all other types are single objects — callers must handle both.
 *
 * @param {string} filePath - Absolute path to the source MDX file
 * @param {string} contentType - Content type key
 * @param {string} locale - Locale code
 * @returns {Promise<Record<string, unknown> | Record<string, unknown>[] | null>} Parsed metadata or null
 */
async function readSidecar(
  filePath: string,
  contentType: string,
  locale: string,
): Promise<Record<string, unknown> | Record<string, unknown>[] | null> {
  for (const candidate of sidecarCandidates(filePath, contentType, locale)) {
    try {
      const raw = await fs.readFile(candidate, 'utf-8');
      return JSON.parse(raw);
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

/**
 * Converts metadata fields to Pagefind meta (string values only).
 *
 * @param {Record<string, unknown>} metadata - Parsed metadata record
 * @returns {Record<string, string>} String-keyed meta map
 */
function metadataToMeta(
  metadata: Record<string, unknown>,
): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      meta[key] = value;
    } else if (typeof value === 'number') {
      meta[key] = String(value);
    } else if (Array.isArray(value)) {
      meta[key] = value
        .filter((v): v is string => typeof v === 'string')
        .join(', ');
    }
  }
  return meta;
}

/**
 * Converts metadata fields to Pagefind filters (string arrays).
 *
 * @param {Record<string, unknown>} metadata - Parsed metadata record
 * @param {string} contentType - Content type key
 * @returns {Record<string, string[]>} Facet filter map
 */
function metadataToFilters(
  metadata: Record<string, unknown>,
  contentType: string,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {
    type: [contentType],
  };

  const tagFields = ['tags', 'school', 'cr', 'level', 'rarity', 'category'];
  for (const field of tagFields) {
    const value = metadata[field];
    if (Array.isArray(value)) {
      filters[field] = value
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.toLowerCase());
    } else if (typeof value === 'string') {
      filters[field] = [value.toLowerCase()];
    } else if (typeof value === 'number') {
      filters[field] = [String(value)];
    }
  }

  return filters;
}

/**
 * Collects all index records for a given locale across all content types.
 *
 * @param {string} locale - Locale code (e.g. 'en')
 * @returns {Promise<IndexRecord[]>} Flattened array of records ready for Pagefind
 */
export async function collectRecords(locale: string): Promise<IndexRecord[]> {
  const contentRoot = path.join(process.cwd(), 'src', 'content', locale);
  const allRecords: IndexRecord[] = [];

  for (const [contentType, relativeDir] of Object.entries(CONTENT_SUBDIR)) {
    const dirPath = path.join(contentRoot, relativeDir);
    const pattern = TYPE_PATTERNS[contentType];
    const exclusions = TYPE_EXCLUSIONS[contentType] ?? [];

    if (!pattern) continue;

    let stat;
    try {
      stat = await fs.stat(dirPath);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;

    const files = await scanDir(dirPath, pattern, exclusions);

    for (const filePath of files) {
      const raw = await fs.readFile(filePath, 'utf-8').catch(() => '');
      if (!raw.trim()) continue;

      const prose = extractProse(raw);
      const parsed = await readSidecar(filePath, contentType, locale);

      /* Monster sidecars are arrays (one entry per stat variant). Use the
         entry matching the file slug (else the first) as the record's
         primary metadata; variant-only tags are unioned into filters below
         so they stay searchable. */
      const variants = Array.isArray(parsed)
        ? parsed.filter(
            (v): v is Record<string, unknown> =>
              typeof v === 'object' && v !== null,
          )
        : null;
      const fileSlug = deriveSlug(path.basename(filePath), contentType);
      const sidecar = variants
        ? (variants.find((v) => v.slug === fileSlug) ?? variants[0] ?? null)
        : (parsed as Record<string, unknown> | null);

      const url = sidecar?.link
        ? localizeLink(sidecar.link as string, locale)
        : deriveUrl(filePath, contentType, locale);
      const title = deriveTitle(filePath, contentType, sidecar);

      const meta: Record<string, string> = { title, type: contentType };
      const filters: Record<string, string[]> = { type: [contentType] };

      if (sidecar) {
        Object.assign(meta, metadataToMeta(sidecar));
        Object.assign(filters, metadataToFilters(sidecar, contentType));
      }

      if (variants && variants.length > 1) {
        const allTags = new Set(filters.tags ?? []);
        for (const variant of variants) {
          if (!Array.isArray(variant.tags)) continue;
          for (const tag of variant.tags) {
            if (typeof tag === 'string') allTags.add(tag.toLowerCase());
          }
        }
        if (allTags.size > 0) filters.tags = [...allTags];
      }

      allRecords.push({
        url,
        content: prose,
        language: locale,
        meta,
        filters,
      });
    }
  }

  return allRecords;
}
