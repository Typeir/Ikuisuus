/**
 * @fileoverview Persistence adapter contract for banned IP ranges.
 * @description Adapter interface used by `bannedIps.ts` to read, write, and
 * remove banned IP ranges.
 *
 * @module lib/security/bannedIpsAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { BannedIpEntry } from './bannedIps';

/**
 * Persistence contract for banned IP ranges.
 * Implementations MUST be safe to call when the backing store is unavailable.
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
