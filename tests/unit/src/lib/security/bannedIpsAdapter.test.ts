/**
 * BannedIpsAdapter Interface Conformity Tests
 *
 * @fileoverview Validates that adapter implementations conform to the
 * BannedIpsAdapter contract by verifying the expected method signatures exist.
 *
 * @module tests/unit/lib/security/bannedIpsAdapter
 */

import type { BannedIpsAdapter } from '@/lib/security/bannedIpsAdapter';
import { describe, expect, it, vi } from 'vitest';

describe('BannedIpsAdapter interface', () => {
  it('should enforce the read/write/remove contract', () => {
    const adapter: BannedIpsAdapter = {
      read: vi.fn().mockResolvedValue([]),
      write: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(true),
    };

    expect(typeof adapter.read).toBe('function');
    expect(typeof adapter.write).toBe('function');
    expect(typeof adapter.remove).toBe('function');
  });

  it('should accept entries matching BannedIpEntry shape', async () => {
    const adapter: BannedIpsAdapter = {
      read: vi.fn().mockResolvedValue([
        {
          range: '10.0.0.0/24',
          reason: 'test',
          bannedAt: '2025-01-01T00:00:00.000Z',
        },
      ]),
      write: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(true),
    };

    const entries = await adapter.read();
    expect(entries).toHaveLength(1);
    expect(entries[0].range).toBe('10.0.0.0/24');
  });
});
