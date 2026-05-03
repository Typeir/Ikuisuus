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
import fs from 'fs/promises';
import path from 'path';

const log = logger.child({ module: 'FSBannedIPs' });

/** Resolved path to the banned IPs JSON file. */
const DATA_PATH = path.resolve(process.cwd(), '.meta/runtime/banned-ips.json');

/**
 * Ensures the parent directory for the data file exists.
 */
const ensureDir = async (): Promise<void> => {
  const dir = path.dirname(DATA_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {}
};

/**
 * Filesystem-backed banned IP adapter.
 *
 * Stores entries as a JSON array in `.meta/runtime/banned-ips.json`.
 */
export const fsBannedIpsAdapter: BannedIpsAdapter = {
  read: async (): Promise<BannedIpEntry[]> => {
    try {
      const raw = await fs.readFile(DATA_PATH, 'utf-8');
      const data: unknown = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error && (error as any).code === 'ENOENT') return [];
      log.debug('FS banned IPs read failed — returning empty', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  },

  write: async (entries: BannedIpEntry[]): Promise<void> => {
    await ensureDir();
    await fs.writeFile(DATA_PATH, JSON.stringify(entries, null, 2), 'utf-8');
  },

  remove: async (range: string): Promise<boolean> => {
    try {
      const raw = await fs.readFile(DATA_PATH, 'utf-8');
      const data: unknown = JSON.parse(raw);
      const entries: BannedIpEntry[] = Array.isArray(data) ? data : [];
      const filtered = entries.filter((e) => e.range !== range);
      if (filtered.length === entries.length) return false;
      await ensureDir();
      await fs.writeFile(DATA_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (error) {
      if (error && (error as any).code === 'ENOENT') return false;
      log.error('FS banned IPs remove failed', {
        error: error instanceof Error ? error.message : String(error),
        range,
      });
      return false;
    }
  },
};
