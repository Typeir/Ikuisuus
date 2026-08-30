/**
 * @fileoverview Filesystem Keyword Link Repository
 * @description Implements `KeywordLinkRepository` by reading the whole
 * `.meta/{locale}` mirror in one pass. The graph spans every content type, so
 * it reads the tree rather than a subdirectory.
 *
 * @module lib/db/content/adapters/fs/fsKeywordLinkRepository
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type {
  KeywordLink,
  KeywordLinkRepository,
} from '../../repositories/keywordLinkRepository';
import { readMetadataFiles } from './readMetadataFiles';

/**
 * One metadata record, narrowed to the fields the graph reads.
 *
 * @interface KeywordLinkRecord
 * @property {string} [file] - Source path
 * @property {string} [link] - Route without a locale prefix
 * @property {string[]} [produces] - Shard ids defined
 * @property {string[]} [consumes] - Shard ids ingested
 */
interface KeywordLinkRecord {
  file?: string;
  link?: string;
  produces?: string[];
  consumes?: string[];
}

/**
 * Filesystem-backed keyword link repository.
 *
 * @class FsKeywordLinkRepository
 * @implements {KeywordLinkRepository}
 */
class FsKeywordLinkRepository implements KeywordLinkRepository {
  /**
   * Reads every sidecar under the locale and keeps the participating records.
   *
   * @param {string} locale - Locale code
   * @returns {Promise<KeywordLink[]>} Participating records
   */
  async listLinks(locale: string): Promise<KeywordLink[]> {
    const records = await readMetadataFiles<KeywordLinkRecord>(locale, '');

    return records
      .filter(
        (record): record is KeywordLinkRecord & { file: string } =>
          typeof record?.file === 'string' &&
          Boolean(record.produces?.length || record.consumes?.length),
      )
      .map((record) => ({
        file: record.file,
        link: record.link ?? '',
        produces: record.produces ?? [],
        consumes: record.consumes ?? [],
      }));
  }
}

/** @property {KeywordLinkRepository} fsKeywordLinkRepository - Singleton instance. */
export const fsKeywordLinkRepository: KeywordLinkRepository =
  new FsKeywordLinkRepository();
