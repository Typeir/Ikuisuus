/**
 * @fileoverview Tests for treeHandler orchestrator
 * @module tests/unit/src/modules/navigation-sidebar/infrastructure/server/treeHandler
 */

import {
    handleTreeRequest,
    type TreeQueryParams,
} from '@/modules/navigation-sidebar/infrastructure/server/treeHandler';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content', () => ({
  listDirectory: vi.fn(),
}));

describe('handleTreeRequest', () => {
  it('should call listDirectory with correct parameters', async () => {
    const { listDirectory } = await import('@/lib/db/content');
    const mockListDirectory = vi.mocked(listDirectory);
    mockListDirectory.mockResolvedValueOnce({
      entries: [],
      total: 0,
    });

    const params: TreeQueryParams = {
      locale: 'en',
      path: 'test',
      limit: 10,
    };

    await handleTreeRequest(params);

    expect(mockListDirectory).toHaveBeenCalledWith(
      'en',
      'test',
      expect.objectContaining({ limit: 10 }),
    );
  });

  it('should return directory listing result on success', async () => {
    const { listDirectory } = await import('@/lib/db/content');
    const mockListDirectory = vi.mocked(listDirectory);
    const mockResult = { entries: [{ name: 'test' }], total: 1 };
    mockListDirectory.mockResolvedValueOnce(mockResult);

    const params: TreeQueryParams = {
      locale: 'es',
      path: 'monsters',
    };

    const result = await handleTreeRequest(params);

    expect(result).toEqual(mockResult);
  });

  it('should throw error on listDirectory failure', async () => {
    const { listDirectory } = await import('@/lib/db/content');
    const mockListDirectory = vi.mocked(listDirectory);
    mockListDirectory.mockRejectedValueOnce(new Error('Database error'));

    const params: TreeQueryParams = {
      locale: 'en',
      path: 'test',
    };

    await expect(handleTreeRequest(params)).rejects.toThrow('Database error');
  });

  it('should pass optional parameters to listDirectory', async () => {
    const { listDirectory } = await import('@/lib/db/content');
    const mockListDirectory = vi.mocked(listDirectory);
    mockListDirectory.mockResolvedValueOnce({ entries: [], total: 0 });

    const params: TreeQueryParams = {
      locale: 'en',
      path: 'test',
      limit: 20,
      page: 2,
      filter: 'spell',
      sort: 'name',
    };

    await handleTreeRequest(params);

    expect(mockListDirectory).toHaveBeenCalledWith(
      'en',
      'test',
      expect.objectContaining({
        limit: 20,
        page: 2,
        filter: 'spell',
        sort: 'name',
      }),
    );
  });
});
