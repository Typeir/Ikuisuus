/**
 * @fileoverview Resolves the generated metadata for a library route into the flat
 * shape the article context provides to components.
 * @description Loads every content kind through its repository and returns null
 * on no match or load failure.
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
import { toPlainMeasure } from '@/lib/units/nativeMeasure';
import { anchorSlug } from '@/modules/library/domain/anchorSlug';
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
 * @property {(locale: string, slug: string) => Promise<unknown[]>} [loadAll] - Every record sharing the slug, for multi-record files
 */
interface ContentKind {
  prefix: string[];
  contentType: string;
  shardKeys: string[];
  load: (locale: string, slug: string) => Promise<unknown>;
  loadAll?: (locale: string, slug: string) => Promise<unknown[]>;
}

/**
 * Resolution table, ordered so a longer prefix is tested before a shorter one
 * that would also match.
 *
 * Vocations are absent, handled by `resolveVocationRoute`.
 */
const KINDS: ContentKind[] = [
  {
    prefix: ['monsters'],
    contentType: 'monsters',
    shardKeys: ['features'],
    load: (locale, slug) => monsterRepository.getBySlug(locale, slug),
    loadAll: (locale, slug) => monsterRepository.getAllBySlug(locale, slug),
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
    shardKeys: ['boons', 'features'],
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
 * Resolves a vocation route.
 *
 * `…/vocations/wizard/main` is the vocation; `…/vocations/wizard/evocation` is a
 * specialization of it. The trailing segment decides which.
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
 * Anchor of a heading or feature name: the same slug the sectionizer stamps
 * on the matching `<section>`/`<article>`, measure-normalised.
 *
 * @param {string} text - Heading text or feature name
 * @returns {string} Anchor slug
 */
function anchorOf(text: string): string {
  return anchorSlug(toPlainMeasure(text));
}

/**
 * Collects the sub-records of one stat block that carry their own aspects,
 * keyed by anchor. Each shard yields its record-scoped key
 * (`record/anchor`) and the bare anchor; a feature whose heading differs
 * from its name (`## 1st Level – Spellcasting` → `Spellcasting`) yields both
 * anchors, since the heading is what the sectionizer sees and the name is
 * what list-entry and paragraph articles carry.
 *
 * @param {TaggedRecord} record - The loaded metadata record
 * @param {string[]} shardKeys - Fields to read
 * @param {string | undefined} recordAnchor - Anchor of the record's own title
 * @returns {ArticleSection[]} Sections carrying aspects
 */
function sectionsOf(
  record: TaggedRecord,
  shardKeys: string[],
  recordAnchor: string | undefined,
): ArticleSection[] {
  const sections: ArticleSection[] = [];

  for (const key of shardKeys) {
    const shards = record[key];
    if (!Array.isArray(shards)) continue;

    for (const shard of shards) {
      if (!shard || typeof shard !== 'object') continue;
      const { name, heading, tags } = shard as {
        name?: string;
        heading?: string;
        tags?: string[];
      };
      const anchors = new Set<string>();
      if (heading) anchors.add(anchorOf(heading));
      if (name) anchors.add(anchorOf(name));
      for (const anchor of anchors) {
        if (recordAnchor) sections.push({ name: `${recordAnchor}/${anchor}`, tags });
        sections.push({ name: anchor, tags });
      }
    }
  }

  return sections;
}

/**
 * Builds the article's aspect index from its records: every stat block title
 * becomes a record entry carrying that block's tags, features are keyed
 * record-scoped and bare, and bare keys shared across records union their
 * tags as a fallback for a row whose record cannot be told apart.
 *
 * @param {TaggedRecord[]} records - All records of the file, in file order
 * @param {string[]} shardKeys - Fields holding sub-records
 * @returns {{ title?: string; tags?: string[]; sections: ArticleSection[]; records: string[] }} Merged article parts
 */
function mergeRecords(
  records: TaggedRecord[],
  shardKeys: string[],
): {
  title?: string;
  tags?: string[];
  sections: ArticleSection[];
  records: string[];
} {
  const byName = new Map<string, Set<string>>();
  const order: string[] = [];
  const add = (name: string, tags?: string[]) => {
    if (!byName.has(name)) {
      byName.set(name, new Set());
      order.push(name);
    }
    const bucket = byName.get(name)!;
    for (const tag of tags ?? []) bucket.add(tag);
  };

  const recordAnchors: string[] = [];
  for (const record of records) {
    const recordAnchor = record.title ? anchorOf(record.title) : undefined;
    if (recordAnchor) {
      recordAnchors.push(recordAnchor);
      add(recordAnchor, record.tags);
    }
    for (const section of sectionsOf(record, shardKeys, recordAnchor)) {
      add(section.name, section.tags);
    }
  }

  const first = records[0];
  return {
    title: first?.title,
    tags: first?.tags,
    sections: order.map((name) => ({ name, tags: [...byName.get(name)!] })),
    records: recordAnchors,
  };
}

/**
 * Loads the article metadata for a resolved library slug.
 *
 * Returns null on no match, load failure, or an empty slug.
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

      contentType = matched.kind.contentType;
      shardKeys = matched.kind.shardKeys;

      if (matched.kind.loadAll) {
        const records = (await matched.kind.loadAll(
          locale,
          matched.key,
        )) as TaggedRecord[];
        if (records.length > 1) {
          return { contentType, ...mergeRecords(records, shardKeys) };
        }
        record = records[0] ?? null;
      }

      if (!record) {
        record = (await matched.kind.load(
          locale,
          matched.key,
        )) as TaggedRecord | null;
      }
    }

    if (!record) return null;

    return { contentType, ...mergeRecords([record], shardKeys) };
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
 * The keys and record anchors the placement plugin needs.
 *
 * @param {ArticleMetadata | null} metadata - Loaded article metadata
 * @returns {{ keys: string[]; records: string[] }} Section keys carrying aspects, record anchors in file order
 */
export function aspectIndexOf(metadata: ArticleMetadata | null): {
  keys: string[];
  records: string[];
} {
  if (!metadata) return { keys: [], records: [] };
  return {
    keys: (metadata.sections ?? [])
      .filter((section) => section.tags?.length)
      .map((section) => section.name),
    records: metadata.records ?? [],
  };
}
