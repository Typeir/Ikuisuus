/**
 * Filesystem Banned IP Adapter Unit Tests
 *
 * @fileoverview Tests for fs-backed banned IP persistence.
 *
 * @module tests/unit/src/lib/security/adapters/fsBannedIpsAdapter.test
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

const DATA_PATH = path.resolve(process.cwd(), '.meta/runtime/banned-ips.json');

describe('fsBannedIpsAdapter', () => {
  beforeEach(() => {
    vi.resetModules();
    if (fs.existsSync(DATA_PATH)) fs.unlinkSync(DATA_PATH);
  });

  afterEach(() => {
    if (fs.existsSync(DATA_PATH)) fs.unlinkSync(DATA_PATH);
  });

  it('should read empty list when file does not exist', async () => {
    const { fsBannedIpsAdapter } =
      await import('@/lib/security/adapters/fsBannedIpsAdapter');
    const entries = await fsBannedIpsAdapter.read();
    expect(entries).toEqual([]);
  });

  it('should write and read entries', async () => {
    const { fsBannedIpsAdapter } =
      await import('@/lib/security/adapters/fsBannedIpsAdapter');

    await fsBannedIpsAdapter.write([
      {
        range: '192.168.1.0/24',
        reason: 'spam',
        bannedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);

    const entries = await fsBannedIpsAdapter.read();
    expect(entries).toHaveLength(1);
    expect(entries[0].range).toBe('192.168.1.0/24');
  });

  it('should remove a range', async () => {
    const { fsBannedIpsAdapter } =
      await import('@/lib/security/adapters/fsBannedIpsAdapter');

    await fsBannedIpsAdapter.write([
      {
        range: '10.0.0.0/24',
        reason: 'test',
        bannedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);

    const result = await fsBannedIpsAdapter.remove('10.0.0.0/24');
    expect(result).toBe(true);

    const entries = await fsBannedIpsAdapter.read();
    expect(entries).toHaveLength(0);
  });

  it('should return false when removing non-existent range', async () => {
    const { fsBannedIpsAdapter } =
      await import('@/lib/security/adapters/fsBannedIpsAdapter');
    const result = await fsBannedIpsAdapter.remove('10.0.0.0/24');
    expect(result).toBe(false);
  });
});
