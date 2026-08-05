/**
 * @fileoverview Article Metadata Loader
 * @description Resolves the generated metadata for a library route into the flat
 * shape the article context provides to components.
 *
 * Every content kind carries aspects, so every content kind is resolved here.
 * Loading only monsters left the other seven kinds with aspects sitting in
 * metadata and nothing rendering them — the pills existed in the index and never
 * on the page.
 *
 * Lookups go through the content repositories, which are adapter-agnostic: the
 * live site reads pg and dev reads sidecars. Fields that exist only in one of
 * those backends must not be relied on — anything absent from the pg schema is
 * simply missing in production, which is why every field here is optional and a
 * miss returns null rather than throwing.
 *
 * @module modules/library/application/use-cases/loadArticleMetadata
 * @version 2.0.0
 * @author Typeir
 * @since 2026-08-04
 */

import { bloodlineRepository } from '@/lib/db/content/repositories/bloodlineRepository';
import { featRepository } from '@/lib/db/content/repositories/featRepository';
import { heirloomRepository } from '@/lib/db/content/repositories/heirloomRepository';
import { monsterRepository } from '@/lib/db/content/repositories/monsterRepository';
import { specializationRepository } from '@/lib/db/content/repositories/specializationRepository';
import { spellRepository } from '@/lib/db/content/repositories/spellRepository';
import { trinketRepository } from '@/lib/db/content/repositories/trinketRepository';
import { vocationRepository } from '@/lib/db/content/repositories/vocationRepository';
import { logger } from '@/lib/logging/logger';
import type {
  ArticleMetadata,
  ArticleSection,
} from '@/modules/library/application/context/ArticleMetadataContext';

const log = logger.child({ module: 'LoadArticleMetadata' });

/** The shape every content record shares, as far as this module cares. */
interface TaggedRecord {
  title?: string;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * A content kind and how to reach it from a route.
 *
 * @property {string[]} prefix - Leading slug segments that identify the kind
 * @property {string} contentType - The kind's name, as the context reports it
 * @property {string[]} shardKeys - Fields holding sub-records that carry their own aspects
 * @property {(locale: string, slug: string) => Promise<unknown>} load - Repository lookup
 */
interface ContentKind {
  prefix: string[];
  contentType: string;
  shardKeys: string[];
  load: (locale: string, slug: string) => Promise<unknown>;
}

/**
 * Resolution table, ordered so a longer prefix is tested before a shorter one
 * that would also match.
 *
 * Vocations are absent: their route nests specializations underneath, so the two
 * are told apart by shape rather than by prefix. See `resolveVocationRoute`.
 */
const KINDS: ContentKind[] = [
  {
    prefix: ['monsters'],
    contentType: 'monsters',
    shardKeys: ['features'],
    load: (locale, slug) => monsterRepository.getBySlug(locale, slug),
  },
  {
    prefix: ['spells'],
    contentType: 'spells',
    shardKeys: [],
    load: (locale, slug) => spellRepository.getBySlug(locale, slug),
  },
  {
    prefix: ['items', 'heirlooms'],
    contentType: 'heirlooms',
    shardKeys: [],
    load: (locale, slug) => heirloomRepository.getBySlug(locale, slug),
  },
  {
    prefix: ['items', 'trinkets'],
    contentType: 'trinkets',
    shardKeys: [],
    load: (locale, slug) => trinketRepository.getBySlug(locale, slug),
  },
  {
    prefix: ['character-creation', 'feats'],
    contentType: 'feats',
    shardKeys: ['features'],
    load: (locale, slug) => featRepository.getBySlug(locale, slug),
  },
  {
    prefix: ['character-creation', 'bloodlines'],
    contentType: 'bloodlines',
    shardKeys: ['boons'],
    load: (locale, slug) => bloodlineRepository.getBySlug(locale, slug),
  },
];

/** Where a vocation's own page lives, as opposed to one of its specializations. */
const VOCATION_PREFIX = ['character-creation', 'vocations'];

/**
 * Picks the kind a route belongs to.
 *
 * @param {string[]} slug - Route slug segments
 * @returns {{ kind: ContentKind; key: string } | null} The kind and its lookup key
 */
function matchKind(
  slug: string[],
): { kind: ContentKind; key: string } | null {
  for (const kind of KINDS) {
    const matches = kind.prefix.every((part, index) => slug[index] === part);
    const key = slug[kind.prefix.length];
    if (matches && key) return { kind, key };
  }
  return null;
}

/**
 * Resolves a vocation route, which is the one kind whose children share its path.
 *
 * `…/vocations/wizard/main` is the vocation; `…/vocations/wizard/evocation` is a
 * specialization of it. The trailing segment decides which, so the two cannot be
 * separated by prefix like every other kind.
 *
 * @param {string[]} slug - Route slug segments
 * @param {string} locale - Active locale
 * @returns {Promise<{ record: TaggedRecord | null; contentType: string; shardKeys: string[] } | null>}
 */
async function resolveVocationRoute(
  slug: string[],
  locale: string,
): Promise<{
  record: TaggedRecord | null;
  contentType: string;
  shardKeys: string[];
} | null> {
  const onVocationPath = VOCATION_PREFIX.every(
    (part, index) => slug[index] === part,
  );
  if (!onVocationPath) return null;

  const vocation = slug[2];
  const leaf = slug[3];
  if (!vocation) return null;

  if (!leaf || leaf === 'main') {
    return {
      record: (await vocationRepository.getBySlug(
        locale,
        vocation,
      )) as TaggedRecord | null,
      contentType: 'vocations',
      shardKeys: ['features'],
    };
  }

  return {
    record: (await specializationRepository.getBySlug(
      locale,
      leaf,
    )) as TaggedRecord | null,
    contentType: 'specializations',
    shardKeys: ['features'],
  };
}

/**
 * Collects the sub-records of a document that carry their own aspects.
 *
 * The field differs by kind — a bloodline has `boons`, everything else has
 * `features` — which is why the key is declared per kind rather than guessed.
 *
 * @param {TaggedRecord} record - The loaded metadata record
 * @param {string[]} shardKeys - Fields to read
 * @returns {ArticleSection[]} Sections carrying aspects
 */
function sectionsOf(
  record: TaggedRecord,
  shardKeys: string[],
): ArticleSection[] {
  const sections: ArticleSection[] = [];

  for (const key of shardKeys) {
    const shards = record[key];
    if (!Array.isArray(shards)) continue;

    for (const shard of shards) {
      if (!shard || typeof shard !== 'object') continue;
      const { name, tags } = shard as { name?: string; tags?: string[] };
      if (name) sections.push({ name, tags });
    }
  }

  return sections;
}

/**
 * Loads the article metadata for a resolved library slug.
 *
 * A kind with no match, or a backend that fails, returns null — the provider
 * then mounts with nothing and every consumer renders nothing, which is the same
 * path a page without metadata takes.
 *
 * @param {string[]} slug - Route slug segments, e.g. `['monsters', 'mucklord']`
 * @param {string} locale - Active locale
 * @returns {Promise<ArticleMetadata | null>} The article's metadata, or null
 */
export async function loadArticleMetadata(
  slug: string[],
  locale: string,
): Promise<ArticleMetadata | null> {
  if (!slug.length) return null;

  try {
    const vocationRoute = await resolveVocationRoute(slug, locale);

    let record: TaggedRecord | null = null;
    let contentType = '';
    let shardKeys: string[] = [];

    if (vocationRoute) {
      ({ record, contentType, shardKeys } = vocationRoute);
    } else {
      const matched = matchKind(slug);
      if (!matched) return null;

      record = (await matched.kind.load(
        locale,
        matched.key,
      )) as TaggedRecord | null;
      contentType = matched.kind.contentType;
      shardKeys = matched.kind.shardKeys;
    }

    if (!record) return null;

    return {
      title: record.title,
      contentType,
      tags: record.tags,
      sections: sectionsOf(record, shardKeys),
    };
  } catch (error) {
    log.warning('Could not load article metadata', {
      slug: slug.join('/'),
      locale,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * The heading texts that carry aspects, for the placement plugin.
 *
 * @param {ArticleMetadata | null} metadata - Loaded article metadata
 * @returns {string[]} Heading texts an aspect row should be placed under
 */
export function aspectSectionsOf(metadata: ArticleMetadata | null): string[] {
  if (!metadata) return [];

  const sections = (metadata.sections ?? [])
    .filter((section) => section.tags?.length)
    .map((section) => section.name);

  if (metadata.title && metadata.tags?.length) sections.push(metadata.title);

  return sections;
}
