/**
 * UserAdapter Interface Unit Tests
 *
 * @fileoverview Tests that UserAdapter interface export is usable.
 *
 * @module tests/unit/src/lib/db/auth/userAdapter.test
 */

import type { UserAdapter } from '@/lib/db/auth/userAdapter';
import { describe, expect, it, vi } from 'vitest';

describe('UserAdapter interface', () => {
  it('should define all required methods', () => {
    const mockAdapter: UserAdapter = {
      findByUsername: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    expect(typeof mockAdapter.findByUsername).toBe('function');
    expect(typeof mockAdapter.findById).toBe('function');
    expect(typeof mockAdapter.create).toBe('function');
    expect(typeof mockAdapter.update).toBe('function');
    expect(typeof mockAdapter.listAll).toBe('function');
    expect(typeof mockAdapter.delete).toBe('function');
  });

  it('should be callable with expected signatures', async () => {
    const mockAdapter: UserAdapter = {
      findByUsername: vi.fn().mockResolvedValue(null),
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    await expect(mockAdapter.findByUsername('test')).resolves.toBeNull();
    await expect(mockAdapter.findById('id')).resolves.toBeNull();
    await expect(mockAdapter.listAll()).resolves.toEqual([]);
  });
});
