/**
 * @fileoverview Filesystem Audit Adapter
 * @description Implements the `AuditAdapter` interface using a local JSON file.
 * Audit records are persisted as an array in `.meta/runtime/audit-log.json`.
 *
 * @module lib/db/adapters/fs/fsAuditAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { logger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import path from 'path';
import type { AuditAdapter, AuditRecord } from '../../auditAdapter';

const log = logger.child({ module: 'FSAudit' });

/** Maximum number of records kept in the JSON file to prevent unbounded growth. */
const MAX_RECORDS = 500;

/** Resolved path to the audit log JSON file. */
const DATA_PATH = path.resolve(process.cwd(), '.meta/runtime/audit-log.json');

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
 * Reads audit records from the JSON file.
 *
 * @returns {AuditRecord[]} Stored records or empty array
 */
const readRecords = async (): Promise<AuditRecord[]> => {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error && (error as any).code === 'ENOENT') return [];
    log.debug('FS audit read failed — returning empty', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Writes audit records to the JSON file.
 *
 * @param {AuditRecord[]} records - Full records array to persist
 */
const writeRecords = async (records: AuditRecord[]): Promise<void> => {
  await ensureDir();
  await fs.writeFile(DATA_PATH, JSON.stringify(records, null, 2), 'utf-8');
};

/**
 * Filesystem-backed audit adapter.
 *
 * Stores records as a JSON array in `.meta/runtime/audit-log.json`.
 * New records are prepended (most-recent-first). The array is trimmed to
 * `MAX_RECORDS` on every write.
 */
export const fsAuditAdapter: AuditAdapter = {
  write: async (record: AuditRecord): Promise<void> => {
    const stamped: AuditRecord = {
      ...record,
      timestamp: record.timestamp ?? new Date().toISOString(),
    };

    try {
      const existing = await readRecords();
      const updated = [stamped, ...existing].slice(0, MAX_RECORDS);
      await writeRecords(updated);
    } catch (error) {
      log.error('Failed to write audit record to filesystem', {
        error: error instanceof Error ? error.message : String(error),
        record: stamped,
      });
    }
  },

  read: async (limit = 50): Promise<AuditRecord[]> => {
    const records = await readRecords();
    return records.slice(0, limit);
  },
};
