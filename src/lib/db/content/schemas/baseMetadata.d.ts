/**
 * @fileoverview Base Content Metadata Schema
 * @description Fields every content metadata record carries, whatever its type.
 * Identity fields are written by the generator that parses the file; reading time
 * and version hash are stamped afterwards by `stampSharedFields`.
 *
 * @module lib/db/content/schemas/baseMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Fields shared by every content metadata record.
 *
 * @interface BaseMetadata
 * @property {string} slug - URL slug, unique within a locale and content type
 * @property {string} title - Display title
 * @property {string} file - Source path relative to the locale root
 * @property {string} link - Locale-prefixed route for this record
 * @property {string} [description] - Short summary for cards and search results
 * @property {string[]} [tags] - Derived gameplay tags for filtering and search
 * @property {string[]} [consumes] - Shard references this file declares, as `file#anchor`
 * @property {string[]} [consumers] - Files declaring a reference into this one
 * @property {number} [indexVersion] - Index schema version for cache busting
 * @property {string} [readingTime] - Estimated reading time, stamped after parsing
 * @property {string} [versionHash] - Hash of source content, stamped after parsing
 */
export interface BaseMetadata {
  slug: string;
  title: string;
  file: string;
  link: string;
  description?: string;
  tags?: string[];
  consumes?: string[];
  consumers?: string[];
  indexVersion?: number;
  readingTime?: string;
  versionHash?: string;
}
