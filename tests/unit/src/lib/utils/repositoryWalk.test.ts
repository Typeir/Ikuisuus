/**
 * @fileoverview Unit tests for library navigation repository walk adapters.
 * @module tests/unit/src/lib/utils/repositoryWalk
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockListDirectory, mockListEntries } = vi.hoisted(() => ({
  mockListEntries: vi.fn(),
  mockListDirectory: vi.fn(),
}));

vi.mock('@/lib/db/content/directorySourceResolver', () => ({
  resolveDirectorySource: () => ({
    listEntries: mockListEntries,
  }),
}));

vi.mock('@/lib/db/content/fileTreeService', () => ({
  listDirectory: (...args: unknown[]) => mockListDirectory(...args),
}));

import {
    repositoryShallowWalk,
    repositoryWalk,
} from '@/modules/library/infrastructure/navigation/repositoryWalk';

describe('repositoryWalk', () => {
  beforeEach(() => {
    mockListEntries.mockReset().mockResolvedValue([]);
    mockListDirectory
      .mockReset()
      .mockResolvedValue({ entries: [], total: 0, truncated: false });
  });

  it('exports both traversal entrypoints', () => {
    expect(typeof repositoryWalk).toBe('function');
    expect(typeof repositoryShallowWalk).toBe('function');
  });

  it('resolves full walk using environment adapter', async () => {
    await expect(repositoryWalk('en')).resolves.toEqual([]);
    expect(mockListEntries).toHaveBeenCalled();
  });

  it('resolves shallow walk using cached listDirectory facade', async () => {
    await expect(repositoryShallowWalk('en')).resolves.toEqual([]);
    expect(mockListDirectory).toHaveBeenCalled();
  });
});
