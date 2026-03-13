/**
 * Edge Config User Adapter Unit Tests
 *
 * @fileoverview Tests for the Vercel Edge Config user adapter.
 *
 * @module tests/unit/lib/db/auth/edgeConfigUserAdapter
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/edge-config', () => ({
  get: vi.fn(),
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env.EDGE_CONFIG_ID = 'test-config-id';
  process.env.VERCEL_API_TOKEN = 'test-token';
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...originalEnv };
});

const MOCK_USER = {
  id: 'u-1',
  username: 'admin',
  passwordHash: 'a'.repeat(64),
  role: 'admin' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
};

describe('edgeConfigUserAdapter', () => {
  describe('findByUsername', () => {
    it('should find user case-insensitively', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([MOCK_USER]);

      const { edgeConfigUserAdapter } =
        await import('@/lib/db/auth/edgeConfigUserAdapter');
      const result = await edgeConfigUserAdapter.findByUsername('Admin');
      expect(result?.id).toBe('u-1');
    });

    it('should return null when not found', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([MOCK_USER]);

      const { edgeConfigUserAdapter } =
        await import('@/lib/db/auth/edgeConfigUserAdapter');
      const result = await edgeConfigUserAdapter.findByUsername('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([MOCK_USER]);

      const { edgeConfigUserAdapter } =
        await import('@/lib/db/auth/edgeConfigUserAdapter');
      const result = await edgeConfigUserAdapter.findById('u-1');
      expect(result?.username).toBe('admin');
    });
  });

  describe('create', () => {
    it('should add user and write to Edge Config', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([]);
      mockFetch.mockResolvedValue({ ok: true });

      const { edgeConfigUserAdapter } =
        await import('@/lib/db/auth/edgeConfigUserAdapter');
      await edgeConfigUserAdapter.create(MOCK_USER);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('edge-config'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('should throw if username already exists', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([MOCK_USER]);

      const { edgeConfigUserAdapter } =
        await import('@/lib/db/auth/edgeConfigUserAdapter');
      await expect(edgeConfigUserAdapter.create(MOCK_USER)).rejects.toThrow(
        'already exists',
      );
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([MOCK_USER]);
      mockFetch.mockResolvedValue({ ok: true });

      const { edgeConfigUserAdapter } =
        await import('@/lib/db/auth/edgeConfigUserAdapter');
      await edgeConfigUserAdapter.update('u-1', {
        lastLoginAt: '2025-06-01T00:00:00.000Z',
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([]);

      const { edgeConfigUserAdapter } =
        await import('@/lib/db/auth/edgeConfigUserAdapter');
      await expect(edgeConfigUserAdapter.update('unknown', {})).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('listAll', () => {
    it('should return all users', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([MOCK_USER]);

      const { edgeConfigUserAdapter } =
        await import('@/lib/db/auth/edgeConfigUserAdapter');
      const result = await edgeConfigUserAdapter.listAll();
      expect(result).toEqual([MOCK_USER]);
    });
  });

  describe('delete', () => {
    it('should remove user and write', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([MOCK_USER]);
      mockFetch.mockResolvedValue({ ok: true });

      const { edgeConfigUserAdapter } =
        await import('@/lib/db/auth/edgeConfigUserAdapter');
      await edgeConfigUserAdapter.delete('u-1');

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      const { get } = await import('@vercel/edge-config');
      vi.mocked(get).mockResolvedValue([]);

      const { edgeConfigUserAdapter } =
        await import('@/lib/db/auth/edgeConfigUserAdapter');
      await expect(edgeConfigUserAdapter.delete('unknown')).rejects.toThrow(
        'User not found',
      );
    });
  });
});
