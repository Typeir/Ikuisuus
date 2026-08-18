/**
 * @fileoverview Parse metadata from raw MDX source.
 * @description Route (path, content) to matching parser; no disk access.
 *
 * @module scripts/metadata/sourceParser
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import matter from 'gray-matter';
import { parseHeirloomSource } from './generateHeirloomMetadata';
import { parseMonsterSource } from './generateMonsterMetadata';
import { parseSpellSource } from './generateSpellMetadata';
import { parseTrinketSource } from './generateTrinketMetadata';
import { parseTitle } from './parsingUtils';
import type { SharedData } from './sharedData';
import { applyAuthoredAspects, extractAllTags } from './taggingUtils';
import { filePathToSlug, readLines } from './textUtils';

/**
 * Content kinds the dispatcher recognizes.
 */
export type SourceContentKind =
  | 'monster'
  | 'heirloom'
  | 'spell'
  | 'trinket'
  | 'generic';

/**
 * Result of a source parse.
 *
 * @property {SourceContentKind} kind - Parser the path routed to
 * @property {object[]} records - Parsed records; one per stat block for monsters, one otherwise
 */
export interface SourceParseResult {
  kind: SourceContentKind;
  records: object[];
}

/**
 * Extractor names a file may declare in frontmatter (`extractor: spell`),
 * for content living outside its kind's folder (adventures, one-offs).
 */
const DECLARED_EXTRACTORS: Readonly<Record<string, SourceContentKind>> = {
  monster: 'monster',
  heirloom: 'heirloom',
  spell: 'spell',
  trinket: 'trinket',
};

/**
 * Frontmatter `contentType:` values (plural site taxonomy) mapped to parser
 * kinds, for buffers with no file path yet.
 */
const CONTENT_TYPE_KINDS: Readonly<Record<string, SourceContentKind>> = {
  monsters: 'monster',
  heirlooms: 'heirloom',
  spells: 'spell',
  trinkets: 'trinket',
};

/**
 * Stand-in paths per kind so slug and org-tag derivation works when the
 * buffer has no destination yet.
 */
const FALLBACK_PATHS: Readonly<Record<SourceContentKind, string>> = {
  monster: 'src/content/en/monsters/untitled.sheet.mdx',
  heirloom: 'src/content/en/heirlooms/untitled.heirloom.mdx',
  spell: 'src/content/en/spells/untitled.mdx',
  trinket: 'src/content/en/trinkets/untitled.trinket.mdx',
  generic: 'src/content/en/untitled.mdx',
};

/**
 * Detects the content kind of a repo path.
 *
 * @param {string} filePath - Repo-relative or absolute content path
 * @returns {SourceContentKind} The kind
 */
export function kindOfPath(filePath: string): SourceContentKind {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  if (normalized.endsWith('.sheet.mdx')) return 'monster';
  if (normalized.endsWith('.heirloom.mdx')) return 'heirloom';
  if (normalized.endsWith('.trinket.mdx')) return 'trinket';
  if (normalized.includes('/spells/') && normalized.endsWith('.mdx')) {
    return 'spell';
  }
  return 'generic';
}

/**
 * Resolves the content kind of a source. Precedence: frontmatter
 * `extractor: <name>`, frontmatter `contentType:`, then path detection.
 * Works without a path — an unsaved buffer resolves from frontmatter alone.
 *
 * @param {string} raw - Complete file text including frontmatter
 * @param {string} [filePath] - Repo-relative content path, when known
 * @returns {SourceContentKind} The kind
 */
export function kindOfSource(raw: string, filePath = ''): SourceContentKind {
  const frontmatter = matter(raw).data ?? {};
  const declared = frontmatter.extractor;
  if (typeof declared === 'string') {
    const kind = DECLARED_EXTRACTORS[declared.trim().toLowerCase()];
    if (kind) return kind;
  }
  const contentType = frontmatter.contentType;
  if (typeof contentType === 'string') {
    const kind = CONTENT_TYPE_KINDS[contentType.trim().toLowerCase()];
    if (kind) return kind;
  }
  return filePath ? kindOfPath(filePath) : 'generic';
}

/**
 * Parses metadata records from raw MDX source. An empty path is fine: kind
 * comes from frontmatter and a per-kind stand-in path feeds slug derivation.
 *
 * @param {string} raw - Complete file text including frontmatter
 * @param {string} filePath - Path the source belongs to; '' for unsaved buffers
 * @param {SharedData} sharedData - Shared game data
 * @returns {SourceParseResult} Parsed records and the kind they came from
 */
export function parseMetadataFromSource(
  raw: string,
  filePath: string,
  sharedData: SharedData,
): SourceParseResult {
  const kind = kindOfSource(raw, filePath);
  if (!filePath) filePath = FALLBACK_PATHS[kind];

  switch (kind) {
    case 'monster':
      return { kind, records: parseMonsterSource(raw, filePath, sharedData) };
    case 'heirloom':
      return {
        kind,
        records: [parseHeirloomSource(raw, filePath, sharedData)],
      };
    case 'spell':
      return { kind, records: [parseSpellSource(raw, filePath, sharedData)] };
    case 'trinket': {
      const record = parseTrinketSource(raw, filePath, sharedData);
      return { kind, records: record ? [record] : [] };
    }
    default: {
      const { data: frontmatter, content } = matter(raw);
      const lines = readLines(content);
      return {
        kind,
        records: [
          {
            slug: filePathToSlug(filePath),
            title: parseTitle(lines),
            tags: applyAuthoredAspects(
              extractAllTags(raw, filePath, sharedData),
              frontmatter,
            ),
          },
        ],
      };
    }
  }
}
