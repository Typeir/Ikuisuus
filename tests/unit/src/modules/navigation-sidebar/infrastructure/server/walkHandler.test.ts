/**
 * @fileoverview Tests for walkHandler orchestrator
 * @module tests/unit/src/modules/navigation-sidebar/infrastructure/server/walkHandler.test
 */

import {
    handleWalkRequest,
    type WalkQueryParams,
} from '@/modules/navigation-sidebar/infrastructure/server/walkHandler';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/library/infrastructure/navigation/repositoryWalk', () => ({
  repositoryShallowWalk: vi.fn(),
}));

describe('handleWalkRequest', () => {
  it('should call repositoryShallowWalk with correct parameters', async () => {
    const { repositoryShallowWalk } =
      await import('@/modules/library/infrastructure/navigation/repositoryWalk');
    const mockWalk = vi.mocked(repositoryShallowWalk);
    mockWalk.mockResolvedValueOnce([]);

    const params: WalkQueryParams = {
      locale: 'en',
      path: 'monsters',
    };

    await handleWalkRequest(params);

    expect(mockWalk).toHaveBeenCalledWith('en', 'monsters', 2);
  });

  it('should use custom depth parameter when provided', async () => {
    const { repositoryShallowWalk } =
      await import('@/modules/library/infrastructure/navigation/repositoryWalk');
    const mockWalk = vi.mocked(repositoryShallowWalk);
    mockWalk.mockResolvedValueOnce([]);

    const params: WalkQueryParams = {
      locale: 'es',
      path: 'spells',
      depth: 3,
    };

    await handleWalkRequest(params);

    expect(mockWalk).toHaveBeenCalledWith('es', 'spells', 3);
  });

  it('should return array of walk nodes on success', async () => {
    const { repositoryShallowWalk } =
      await import('@/modules/library/infrastructure/navigation/repositoryWalk');
    const mockWalk = vi.mocked(repositoryShallowWalk);
    const mockNodes = [
      { name: 'child1', path: '/child1' },
      { name: 'child2', path: '/child2' },
    ];
    mockWalk.mockResolvedValueOnce(mockNodes);

    const params: WalkQueryParams = {
      locale: 'en',
      path: 'test',
    };

    const result = await handleWalkRequest(params);

    expect(result).toEqual(mockNodes);
  });

  it('should throw error on repositoryShallowWalk failure', async () => {
    const { repositoryShallowWalk } =
      await import('@/modules/library/infrastructure/navigation/repositoryWalk');
    const mockWalk = vi.mocked(repositoryShallowWalk);
    mockWalk.mockRejectedValueOnce(new Error('Walk failed'));

    const params: WalkQueryParams = {
      locale: 'en',
      path: 'test',
    };

    await expect(handleWalkRequest(params)).rejects.toThrow('Walk failed');
  });

  it('should default to depth 2 when not provided', async () => {
    const { repositoryShallowWalk } =
      await import('@/modules/library/infrastructure/navigation/repositoryWalk');
    const mockWalk = vi.mocked(repositoryShallowWalk);
    mockWalk.mockResolvedValueOnce([]);

    const params: WalkQueryParams = {
      locale: 'en',
      path: 'items',
    };

    await handleWalkRequest(params);

    expect(mockWalk).toHaveBeenCalledWith('en', 'items', 2);
  });
});
