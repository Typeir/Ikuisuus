/**
 * @fileoverview Directory Source Adapter Interface
 * @description Defines the hexagonal port contract for listing directory contents.
 * Implementations target the local filesystem (build-time / dev) or the GitHub
 * Git Trees API (production runtime) without changing consumer code.
 *
 * @module lib/db/content/directorySourceAdapter
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/**
 * A single entry returned by a directory listing.
 *
 * @property {string} name - Filename or directory name (e.g. "monsters", "albedo.sheet.mdx")
 * @property {boolean} isDirectory - True when the entry is a directory
 */
export interface DirectoryEntry {
  /** Filename or directory name */
  name: string;
  /** True when the entry is a directory */
  isDirectory: boolean;
}

/**
 * Adapter interface for listing directory contents.
 * Implementations MUST return an empty array when the path does not exist
 * rather than throwing.
 */
export interface DirectorySourceAdapter {
  /**
   * Lists the immediate children of a content directory.
   *
   * @param {string} locale - Locale code (e.g. "en", "es")
   * @param {string} relativePath - Slash-separated path relative to the content root
   *   (e.g. "" for root, "monsters", "items/heirlooms")
   * @returns {Promise<DirectoryEntry[]>} Entries in the directory, or empty array if not found
   */
  listEntries(locale: string, relativePath: string): Promise<DirectoryEntry[]>;
}
