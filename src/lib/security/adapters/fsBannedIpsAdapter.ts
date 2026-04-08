/**
 * @fileoverview Filesystem Banned IP Adapter
 * @description Implements the `BannedIpsAdapter` interface using a local JSON file.
 * Banned IP ranges are persisted as an array in `.meta/runtime/banned-ips.json`.
 *
 * @module lib/security/adapters/fsBannedIpsAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { logger } from '@/lib/logging/logger';
import type { BannedIpEntry } from '@/lib/security/bannedIps';
import type { BannedIpsAdapter } from '@/lib/security/bannedIpsAdapter';
import fs from 'fs';
import path from 'path';

const log = logger.child({ module: 'FSBannedIPs' });

/** Resolved path to the banned IPs JSON file. */
const DATA_PATH = path.resolve(process.cwd(), '.meta/runtime/banned-ips.json');

/**
 * Ensures the parent directory for the data file exists.
 */
const ensureDir = (): void => {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Filesystem-backed banned IP adapter.
 *
 * Stores entries as a JSON array in `.meta/runtime/banned-ips.json`.
 */
export const fsBannedIpsAdapter: BannedIpsAdapter = {
  read: async (): Promise<BannedIpEntry[]> => {
    try {
      if (!fs.existsSync(DATA_PATH)) return [];
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      const data: unknown = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      log.debug('FS banned IPs read failed — returning empty', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  },

  write: async (entries: BannedIpEntry[]): Promise<void> => {
    ensureDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(entries, null, 2), 'utf-8');
  },

  remove: async (range: string): Promise<boolean> => {
    try {
      if (!fs.existsSync(DATA_PATH)) return false;
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      const data: unknown = JSON.parse(raw);
      const entries: BannedIpEntry[] = Array.isArray(data) ? data : [];
      const filtered = entries.filter((e) => e.range !== range);
      if (filtered.length === entries.length) return false;
      ensureDir();
      fs.writeFileSync(DATA_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (error) {
      log.error('FS banned IPs remove failed', {
        error: error instanceof Error ? error.message : String(error),
        range,
      });
      return false;
    }
  },
};
