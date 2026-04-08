/**
 * Banned IPs Unit Tests
 *
 * @fileoverview Tests for IP banning functionality using adapter-backed persistence.
 *
 * @module tests/unit/lib/security/bannedIps
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockAdapter = {
  read: vi.fn(),
  write: vi.fn(),
  remove: vi.fn(),
};

vi.mock('@/lib/security/bannedIpsAdapterFactory', () => ({
  bannedIpsAdapter: mockAdapter,
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      error: vi.fn(),
      debug: vi.fn(),
      message: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

beforeEach(() => {
  vi.resetModules();
  mockAdapter.read.mockReset();
  mockAdapter.write.mockReset();
  mockAdapter.remove.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('bannedIps', () => {
  describe('ipToRange', () => {
    it('should convert IPv4 to /24 range', async () => {
      const { ipToRange } = await import('@/lib/security/bannedIps');
      expect(ipToRange('192.168.1.42')).toBe('192.168.1.0/24');
    });

    it('should strip ::ffff: prefix from mapped IPv4', async () => {
      const { ipToRange } = await import('@/lib/security/bannedIps');
      expect(ipToRange('::ffff:10.0.0.5')).toBe('10.0.0.0/24');
    });

    it('should convert IPv6 to /48 range', async () => {
      const { ipToRange } = await import('@/lib/security/bannedIps');
      const result = ipToRange('2001:db8:85a3::8a2e:370:7334');
      expect(result).toContain('/48');
    });

    it('should fallback to /32 for unrecognized format', async () => {
      const { ipToRange } = await import('@/lib/security/bannedIps');
      expect(ipToRange('localhost')).toBe('localhost/32');
    });
  });

  describe('isIpBanned', () => {
    it('should return true if range is banned', async () => {
      mockAdapter.read.mockResolvedValue([
        {
          range: '192.168.1.0/24',
          reason: 'spam',
          bannedAt: '2025-01-01T00:00:00.000Z',
        },
      ]);

      const { isIpBanned } = await import('@/lib/security/bannedIps');
      const result = await isIpBanned('192.168.1.100');
      expect(result.banned).toBe(true);
      expect(result.entry?.reason).toBe('spam');
    });

    it('should return false if not banned', async () => {
      mockAdapter.read.mockResolvedValue([]);

      const { isIpBanned } = await import('@/lib/security/bannedIps');
      const result = await isIpBanned('10.0.0.1');
      expect(result.banned).toBe(false);
    });
  });

  describe('banIp', () => {
    it('should add new ban entry', async () => {
      mockAdapter.read.mockResolvedValue([]);
      mockAdapter.write.mockResolvedValue(undefined);

      const { banIp } = await import('@/lib/security/bannedIps');
      const entry = await banIp('192.168.1.50', 'profanity');

      expect(entry.range).toBe('192.168.1.0/24');
      expect(entry.reason).toBe('profanity');
      expect(mockAdapter.write).toHaveBeenCalled();
    });

    it('should skip write if already banned', async () => {
      mockAdapter.read.mockResolvedValue([
        {
          range: '192.168.1.0/24',
          reason: 'old ban',
          bannedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);

      const { banIp } = await import('@/lib/security/bannedIps');
      const entry = await banIp('192.168.1.50', 'new reason');

      expect(entry.reason).toBe('old ban');
      expect(mockAdapter.write).not.toHaveBeenCalled();
    });
  });

  describe('unbanRange', () => {
    it('should remove banned range', async () => {
      mockAdapter.remove.mockResolvedValue(true);

      const { unbanRange } = await import('@/lib/security/bannedIps');
      const result = await unbanRange('10.0.0.0/24');
      expect(result).toBe(true);
      expect(mockAdapter.remove).toHaveBeenCalledWith('10.0.0.0/24');
    });

    it('should return false if range not found', async () => {
      mockAdapter.remove.mockResolvedValue(false);

      const { unbanRange } = await import('@/lib/security/bannedIps');
      const result = await unbanRange('10.0.0.0/24');
      expect(result).toBe(false);
    });
  });
});
