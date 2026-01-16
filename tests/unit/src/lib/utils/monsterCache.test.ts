/**
 * @fileoverview Unit tests for Monster Cache Utilities
 * @description Tests for cached monster data fetching from API routes.
 * Tests cache behavior, fetch operations, and error handling.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/utils/monsterCache - Monster cache utilities
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearMonsterCache,
  getMonsterBySlug,
  getMonsterIndex,
} from '@/lib/utils/monsterCache';
import type { MonsterData, MonsterIndexEntry } from '@/lib/utils/monsterCache';
import { logger } from '@/lib/logging/logger';

const mockMonsterIndex: MonsterIndexEntry[] = [
  { slug: 'goblin', title: 'Goblin', cr: '1/4' },
  { slug: 'orc', title: 'Orc', cr: '1/2' },
  { slug: 'ancient-red-dragon', title: 'Ancient Red Dragon', cr: '24' },
];

const mockGoblinData: MonsterData = {
  slug: 'goblin',
  title: 'Goblin',
  cr: '1/4',
  size: 'small',
  creatureType: 'humanoid',
  ac: { value: 15, raw: '15 (leather armor, shield)' },
  hp: { average: 7, formula: '2d6', raw: '7 (2d6)' },
  abilities: {
    str: { score: 8, mod: -1 },
    dex: { score: 14, mod: 2 },
    con: { score: 10, mod: 0 },
    int: { score: 10, mod: 0 },
    wis: { score: 8, mod: -1 },
    cha: { score: 8, mod: -1 },
  },
  speed: { raw: '30 ft.', modes: { walk: 30 } },
  tags: ['creature:humanoid', 'size:small'],
};

const mockOrcData: MonsterData = {
  slug: 'orc',
  title: 'Orc',
  cr: '1/2',
  size: 'medium',
  creatureType: 'humanoid',
  ac: { value: 13, raw: '13 (hide armor)' },
  hp: { average: 15, formula: '2d8+6', raw: '15 (2d8+6)' },
  abilities: {
    str: { score: 16, mod: 3 },
    dex: { score: 12, mod: 1 },
    con: { score: 16, mod: 3 },
    int: { score: 7, mod: -2 },
    wis: { score: 11, mod: 0 },
    cha: { score: 10, mod: 0 },
  },
  speed: { raw: '30 ft.', modes: { walk: 30 } },
  tags: ['creature:humanoid', 'size:medium'],
};

describe('monsterCache', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearMonsterCache();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getMonsterIndex', () => {
    it('should fetch monster index from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMonsterIndex),
      });

      const result = await getMonsterIndex('en');

      expect(mockFetch).toHaveBeenCalledWith('/api/monsters/index?locale=en');
      expect(result).toEqual(mockMonsterIndex);
    });

    it('should cache index for subsequent calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMonsterIndex),
      });

      await getMonsterIndex('en');
      await getMonsterIndex('en');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should cache separately per locale', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMonsterIndex),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ slug: 'goblin', title: 'Goblin', cr: '1/4' }]),
        });

      await getMonsterIndex('en');
      await getMonsterIndex('es');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith('/api/monsters/index?locale=en');
      expect(mockFetch).toHaveBeenCalledWith('/api/monsters/index?locale=es');
    });

    it('should return empty array on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

      const result = await getMonsterIndex('en');

      expect(result).toEqual([]);
      expect(loggerSpy).toHaveBeenCalled();

      loggerSpy.mockRestore();
    });

    it('should return empty array on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

      const result = await getMonsterIndex('en');

      expect(result).toEqual([]);
      expect(loggerSpy).toHaveBeenCalled();

      loggerSpy.mockRestore();
    });

    it('should deduplicate concurrent requests', async () => {
      let resolvePromise: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(fetchPromise);

      const promise1 = getMonsterIndex('en');
      const promise2 = getMonsterIndex('en');

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(mockMonsterIndex),
      } as Response);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockMonsterIndex);
      expect(result2).toEqual(mockMonsterIndex);
    });
  });

  describe('getMonsterBySlug', () => {
    it('should fetch monster data from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGoblinData),
      });

      const result = await getMonsterBySlug('goblin', 'en');

      expect(mockFetch).toHaveBeenCalledWith('/api/monsters/goblin?locale=en');
      expect(result).toEqual(mockGoblinData);
    });

    it('should cache monster data for subsequent calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGoblinData),
      });

      await getMonsterBySlug('goblin', 'en');
      await getMonsterBySlug('goblin', 'en');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should cache separately per slug', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGoblinData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOrcData),
        });

      const goblin = await getMonsterBySlug('goblin', 'en');
      const orc = await getMonsterBySlug('orc', 'en');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(goblin?.slug).toBe('goblin');
      expect(orc?.slug).toBe('orc');
    });

    it('should cache separately per locale', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGoblinData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...mockGoblinData, title: 'Trasgo' }),
        });

      await getMonsterBySlug('goblin', 'en');
      await getMonsterBySlug('goblin', 'es');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith('/api/monsters/goblin?locale=en');
      expect(mockFetch).toHaveBeenCalledWith('/api/monsters/goblin?locale=es');
    });

    it('should return null on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

      const result = await getMonsterBySlug('goblin', 'en');

      expect(result).toBeNull();
      expect(loggerSpy).toHaveBeenCalled();

      loggerSpy.mockRestore();
    });

    it('should return null on 404 response without logging error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

      const result = await getMonsterBySlug('nonexistent', 'en');

      expect(result).toBeNull();
      expect(loggerSpy).not.toHaveBeenCalled();

      loggerSpy.mockRestore();
    });

    it('should return null on 500 response and log error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

      const result = await getMonsterBySlug('error-monster', 'en');

      expect(result).toBeNull();
      expect(loggerSpy).toHaveBeenCalled();

      loggerSpy.mockRestore();
    });

    it('should deduplicate concurrent requests for same slug', async () => {
      let resolvePromise: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(fetchPromise);

      const promise1 = getMonsterBySlug('goblin', 'en');
      const promise2 = getMonsterBySlug('goblin', 'en');

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(mockGoblinData),
      } as Response);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockGoblinData);
      expect(result2).toEqual(mockGoblinData);
    });
  });

  describe('clearMonsterCache', () => {
    it('should clear all cached data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMonsterIndex),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGoblinData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMonsterIndex),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGoblinData),
        });

      await getMonsterIndex('en');
      await getMonsterBySlug('goblin', 'en');

      clearMonsterCache();

      await getMonsterIndex('en');
      await getMonsterBySlug('goblin', 'en');

      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
});
