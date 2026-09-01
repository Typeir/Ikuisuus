/**
 * @fileoverview Keyword Link Repository Port + Factory
 * @description Selects the backend that answers which files define and which
 * files ingest a shard, and exports a resolved instance.
 *
 * The query spans every content type rather than one, since a page can consume
 * a shard defined anywhere. The per-type repositories cannot answer it, and two
 * of the ten tables carrying the columns — `rules` and `world` — have no
 * repository of their own.
 *
 * @module lib/db/content/repositories/keywordLinkRepository
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import 'server-only';

import { fsKeywordLinkRepository } from '../adapters/fs/fsKeywordLinkRepository';
import { pgKeywordLinkRepository } from '../adapters/pg/pgKeywordLinkRepository';

/**
 * One file's shard participation, in both directions.
 *
 * @interface KeywordLink
 * @property {string} file - Source path as the generator stamped it
 * @property {string} link - Route for the page, without a locale prefix
 * @property {string[]} produces - Shard ids the file defines
 * @property {string[]} consumes - Shard ids the file ingests
 */
export interface KeywordLink {
  file: string;
  link: string;
  produces: string[];
  consumes: string[];
}

/**
 * Repository contract for the keyword link graph.
 *
 * Implementations MUST be safe to call when the backing store is unavailable —
 * return an empty array rather than throwing. Invalidation is best effort and
 * must never fail the write that triggered it.
 */
export interface KeywordLinkRepository {
  /**
   * Returns every record that defines or ingests at least one shard.
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @returns {Promise<KeywordLink[]>} Participating records, in no set order
   */
  listLinks(locale: string): Promise<KeywordLink[]>;
}

/** @property {string} metadataBackend - Active backend: `'fs'` (default) or `'pg'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Resolves the keyword link repository for the active backend.
 *
 * @returns {KeywordLinkRepository} Keyword link repository
 * @throws {Error} If `METADATA_BACKEND` is not `'fs'` or `'pg'`
 */
const createKeywordLinkRepository = (): KeywordLinkRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgKeywordLinkRepository;
    case 'fs':
      return fsKeywordLinkRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

/** @property {KeywordLinkRepository} keywordLinkRepository - Resolved instance. */
export const keywordLinkRepository = createKeywordLinkRepository();
