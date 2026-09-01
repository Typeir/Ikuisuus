/**
 * @fileoverview Shard Resolution By Reference
 * @description Answers what prose defines a keyword, using the `produces` array
 * every metadata record already carries.
 *
 * The reference names a shard id; the graph says which file defines that id;
 * that one file is read and its matching section extracted. Nothing walks the
 * content tree, so a resolution costs one read rather than a scan.
 *
 * Server only.
 *
 * @module lib/md/resolveShardByRef
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { getFile } from '@/lib/db/content/fileTreeService';
import { extractKeywordRefs } from './extractKeywordRefs';
import type { KeywordResolutions } from './remarkKeyword';
import type { ResolvedShard } from '@/lib/types/api';
import {
  loadKeywordGraph,
  producerOf,
} from '@/lib/db/content/keywordGraph';
import { resolveShards } from '@/lib/utils/contentShardResolver';
import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import { keywordTemplateId } from './keywordIndex';

/** Splits a normalised reference into its namespace and value. */
const REF_PARTS = /^([^;]+);(.+)$/;

/** Trailing thematic break left behind by a section boundary. */
const TRAILING_RULE = /\n+\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

/** Matches an ATX heading and captures its level and text. */
const HEADING = /^(#{1,6})\s+(.+?)\s*$/gm;

/**
 * Splits a reference into the parts resolution needs.
 *
 * @param {string} reference - Normalised reference, `namespace;value` or a bare value
 * @returns {{ id: string; anchor: string }} Shard id and the anchor it points at
 *
 * @example
 * partsOf('condition;Blinded'); // { id: 'kw-condition-blinded', anchor: 'blinded' }
 */
function partsOf(reference: string): { id: string; anchor: string } {
  const match = reference.match(REF_PARTS);
  const namespace = match ? match[1] : undefined;
  const anchor = anchorSlug(match ? match[2] : reference);

  return { id: keywordTemplateId(namespace, anchor), anchor };
}

/**
 * Shard id for a reference, without consulting anything.
 *
 * @param {string} reference - Normalised reference, `namespace;value` or a bare value
 * @returns {string} Shard id, e.g. `kw-condition-blinded`
 *
 * @example
 * shardIdOf('condition;Blinded'); // 'kw-condition-blinded'
 */
export function shardIdOf(reference: string): string {
  return partsOf(reference).id;
}

/**
 * Heading text whose slug matches an anchor.
 *
 * The extractor matches on prose, not on slugs, so the anchor has to be turned
 * back into the heading that produced it.
 *
 * @param {string} body - File source
 * @param {string} anchor - Anchor slug to match
 * @returns {string | null} Heading text, or null when the file has no such heading
 */
function headingFor(body: string, anchor: string): string | null {
  const pattern = new RegExp(HEADING.source, 'gm');

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    const text = match[2].replace(/[*_`]/g, '').trim();
    if (anchorSlug(text) === anchor) return text;
  }

  return null;
}

/**
 * Resolves one reference to the prose that defines it.
 *
 * @param {string} reference - Normalised reference, `namespace;value` or a bare value
 * @param {string} locale - Content locale
 * @returns {Promise<ResolvedShard | null>} The shard, or null when it resolves to nothing
 *
 * @example
 * await resolveShardByRef('condition;blinded', 'en');
 * // { id: 'kw-condition-blinded', heading: 'Blinded', source: '…', href: 'library/…#blinded' }
 */
export async function resolveShardByRef(
  reference: string,
  locale: string,
): Promise<ResolvedShard | null> {
  const { id, anchor } = partsOf(reference);

  const graph = await loadKeywordGraph(locale);
  const producer = producerOf(graph, id);
  if (!producer) return null;

  const file = await getFile(locale, producer.file);
  if (!file) return null;

  const heading = headingFor(file.content, anchor);
  if (!heading) return null;

  const shards = resolveShards(file.content, [{ name: heading, anchor }], [
    anchor,
  ]);
  const prose = shards[anchor]?.trim();
  if (!prose) return null;

  return {
    id,
    heading,
    source: prose.replace(TRAILING_RULE, '').trimEnd(),
    href: `${producer.route.replace(/^\//, '')}#${anchor}`,
  };
}

/**
 * Everything a document needs to render its own keywords.
 *
 * @interface DocumentKeywords
 * @property {ResolvedShard[]} shards - Prose for each reference, carried to the page
 * @property {KeywordResolutions} resolutions - Targets for the plugin to stamp
 */
export interface DocumentKeywords {
  shards: ResolvedShard[];
  resolutions: KeywordResolutions;
}

/**
 * Resolves every keyword a document writes. Shards are deduplicated by id, so
 * two spellings of one term carry one shard; every reference spelling still
 * receives its own resolution stamp.
 *
 * Only the references in the given source. One living inside a resolved shard
 * is left for the endpoint, requested when its card opens: following them here
 * would pull each shard's dependencies onto the page, and theirs after that,
 * until every page carried the whole corpus.
 *
 * @param {string} source - Document source, after reusable regions are inlined
 * @param {string} locale - Content locale
 * @returns {Promise<DocumentKeywords>} Shards and the stamps that point at them
 *
 * @example
 * const { shards, resolutions } = await resolveDocumentKeywords(source, 'en');
 */
export async function resolveDocumentKeywords(
  source: string,
  locale: string,
): Promise<DocumentKeywords> {
  const references = extractKeywordRefs(source);
  if (references.length === 0) return { shards: [], resolutions: {} };

  const resolved = await Promise.all(
    references.map(async (reference) => ({
      reference,
      shard: await resolveShardByRef(reference, locale),
    })),
  );

  const shards: ResolvedShard[] = [];
  const resolutions: KeywordResolutions = {};
  const seen = new Set<string>();

  for (const { reference, shard } of resolved) {
    if (!shard) continue;

    if (!seen.has(shard.id)) {
      seen.add(shard.id);
      shards.push(shard);
    }
    resolutions[reference] = {
      href: shard.href,
      templateId: shard.id,
      heading: shard.heading,
    };
  }

  return { shards, resolutions };
}
