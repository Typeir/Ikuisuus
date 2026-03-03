/**
 * @fileoverview Edge Config Audit Adapter
 * @description Implements the AuditAdapter interface using Vercel Edge Config as a
 * simple KV store. Audit records are stored as a JSON array under a single key.
 *
 * Edge Config is a read-optimized store — writes go through the Vercel REST API.
 * This adapter is intentionally simple and suitable for low-volume audit trails.
 * For high-volume usage, swap in a database-backed adapter instead.
 *
 * @module lib/db/edgeConfigAuditAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 *
 * @requires @vercel/edge-config
 */

import { logger } from '@/lib/logging/logger';
import type { AuditAdapter, AuditRecord } from './auditAdapter';

const log = logger.child({ module: 'EdgeConfigAudit' });

/** Edge Config item key used for the audit log array. */
const AUDIT_KEY = 'corrections_audit';

/** Maximum number of records kept in Edge Config to avoid unbounded growth. */
const MAX_RECORDS = 500;

/**
 * Reads the current audit log array from Edge Config.
 *
 * @returns {Promise<AuditRecord[]>} Existing records or empty array
 */
const readFromEdgeConfig = async (): Promise<AuditRecord[]> => {
  try {
    const { get } = await import('@vercel/edge-config');
    const data = await get<AuditRecord[]>(AUDIT_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    log.debug('Edge Config read failed — returning empty', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Writes the audit log array back to Edge Config via the Vercel REST API.
 *
 * @param {AuditRecord[]} records - Full records array to persist
 * @returns {Promise<void>}
 */
const writeToEdgeConfig = async (records: AuditRecord[]): Promise<void> => {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const vercelToken = process.env.VERCEL_API_TOKEN;

  if (!edgeConfigId || !vercelToken) {
    log.debug('EDGE_CONFIG_ID or VERCEL_API_TOKEN not set — write skipped');
    return;
  }

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: AUDIT_KEY,
            value: records,
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Edge Config write failed (${res.status}): ${body}`);
  }
};

/**
 * Vercel Edge Config audit adapter.
 *
 * Stores audit records as a JSON array under a single Edge Config key.
 * New records are prepended (most-recent-first). The array is trimmed to
 * `MAX_RECORDS` on every write to prevent unbounded growth.
 *
 * Required environment variables:
 *   - `EDGE_CONFIG` — Connection string (set automatically by Vercel when Edge Config is linked)
 *   - `EDGE_CONFIG_ID` — Edge Config store ID (for write API)
 *   - `VERCEL_API_TOKEN` — Vercel API token with Edge Config write scope
 */
export const edgeConfigAuditAdapter: AuditAdapter = {
  write: async (record: AuditRecord): Promise<void> => {
    const stamped: AuditRecord = {
      ...record,
      timestamp: record.timestamp ?? new Date().toISOString(),
    };

    try {
      const existing = await readFromEdgeConfig();
      const updated = [stamped, ...existing].slice(0, MAX_RECORDS);
      await writeToEdgeConfig(updated);
    } catch (error) {
      log.error('Failed to write audit record', {
        error: error instanceof Error ? error.message : String(error),
        record: stamped,
      });
    }
  },

  read: async (limit = 50): Promise<AuditRecord[]> => {
    const records = await readFromEdgeConfig();
    return records.slice(0, limit);
  },
};
