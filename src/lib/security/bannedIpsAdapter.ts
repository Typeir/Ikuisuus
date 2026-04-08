/**
 * @fileoverview Banned IP Storage Adapter Interface
 * @description Defines a pluggable adapter contract for persisting banned IP ranges.
 * Implementations can target the filesystem, PostgreSQL, or any other backend
 * without changing business logic in `bannedIps.ts`.
 *
 * @module lib/security/bannedIpsAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { BannedIpEntry } from './bannedIps';

/**
 * Adapter interface for banned IP range persistence.
 * Implementations MUST be safe to call even when the backing store is unavailable
 * (graceful degradation over hard failures).
 */
export interface BannedIpsAdapter {
  /**
   * Reads all currently banned IP ranges.
   *
   * @returns {Promise<BannedIpEntry[]>} Banned entries or empty array
   */
  read: () => Promise<BannedIpEntry[]>;

  /**
   * Writes the full list of banned IP ranges (replaces previous state).
   *
   * @param {BannedIpEntry[]} entries - Complete ban list to persist
   * @returns {Promise<void>}
   */
  write: (entries: BannedIpEntry[]) => Promise<void>;

  /**
   * Removes a single range from the ban list.
   *
   * @param {string} range - CIDR range to remove
   * @returns {Promise<boolean>} True if the range was found and removed
   */
  remove: (range: string) => Promise<boolean>;
}
