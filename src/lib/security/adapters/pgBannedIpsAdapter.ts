/**
 * @fileoverview PostgreSQL Banned IP Adapter (MikroORM)
 * @description Implements the `BannedIpsAdapter` interface using MikroORM.
 * Queries the `banned_ips` table via the shared ORM singleton.
 *
 * @module lib/security/adapters/pgBannedIpsAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { BannedIpEntity } from '@/lib/db/orm/entities/BannedIpEntity';
import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import type { BannedIpEntry } from '@/lib/security/bannedIps';
import type { BannedIpsAdapter } from '@/lib/security/bannedIpsAdapter';

const log = logger.child({ module: 'PGBannedIPs' });

/**
 * Maps a `BannedIpEntity` row to a `BannedIpEntry` domain object.
 *
 * @param {BannedIpEntity} row - MikroORM entity
 * @returns {BannedIpEntry} Domain model
 */
const rowToEntry = (row: BannedIpEntity): BannedIpEntry => ({
  range: row.range,
  reason: row.reason,
  bannedAt: row.bannedAt.toISOString(),
  sourceIp: row.sourceIp,
});

/**
 * MikroORM-backed banned IP adapter for the `banned_ips` table.
 */
export const pgBannedIpsAdapter: BannedIpsAdapter = {
  read: async (): Promise<BannedIpEntry[]> => {
    try {
      const em = await getEM();
      const rows = await em.find(
        BannedIpEntity,
        {},
        { orderBy: { bannedAt: 'desc' } },
      );
      return rows.map(rowToEntry);
    } catch (error) {
      log.error('Failed to read banned IPs from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  },

  write: async (entries: BannedIpEntry[]): Promise<void> => {
    try {
      const em = await getEM();
      for (const entry of entries) {
        const existing = await em.findOne(BannedIpEntity, {
          range: entry.range,
        });
        if (!existing) {
          em.create(BannedIpEntity, {
            range: entry.range,
            reason: entry.reason,
            bannedAt: new Date(entry.bannedAt),
            sourceIp: entry.sourceIp,
          });
        }
      }
      await em.flush();
    } catch (error) {
      log.error('Failed to write banned IPs to PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  remove: async (range: string): Promise<boolean> => {
    try {
      const em = await getEM();
      const row = await em.findOne(BannedIpEntity, { range });
      if (!row) return false;
      await em.removeAndFlush(row);
      return true;
    } catch (error) {
      log.error('Failed to remove banned IP from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        range,
      });
      return false;
    }
  },
};
