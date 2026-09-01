/**
 * @fileoverview Monster Index Hook
 * @description Custom hook for loading and caching the monster index from the API.
 *
 * @module modules/encounter-planner/presentation/importer/useMonsterIndex
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { MonsterIndexEntry } from '@/lib/db/content/schemas/monsterMetadata';
import { logger } from '@/lib/logging/logger';
import { fetcher } from '@/lib/fetch/fetcher';
import { useCallback, useState } from 'react';

const log = logger.child({ module: 'useMonsterIndex' });

/**
 * Hook for loading and querying the monster index.
 * Fetches the index lazily on first trigger and caches the result.
 *
 * @function useMonsterIndex
 * @param {string} locale - Locale for API requests
 * @returns {{ index: MonsterIndexEntry[], isLoading: boolean, loadIndex: () => void }}
 */
export const useMonsterIndex = (locale: string) => {
  const [index, setIndex] = useState<MonsterIndexEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadIndex = useCallback(async () => {
    if (index.length > 0) return;

    setIsLoading(true);
    try {
      const data = await fetcher<MonsterIndexEntry[]>(
        `/api/monsters/index?locale=${locale}`,
      );
      setIndex(
        data.map((monster: MonsterIndexEntry) => ({
          ...monster,
          id: monster.slug,
        })),
      );
    } catch (error) {
      log.error('Failed to load monster index', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
    } finally {
      setIsLoading(false);
    }
  }, [locale, index.length]);

  return { index, isLoading, loadIndex };
};
