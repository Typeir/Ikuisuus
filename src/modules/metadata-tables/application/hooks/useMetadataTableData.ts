/**
 * @fileoverview Metadata Table Data Hook
 * @description Generic hook for locale-aware metadata table API loading.
 * Uses SWR for automatic caching, deduplication, and error handling.
 *
 * @module lib/hooks/data/useMetadataTableData
 * @author Typeir
 * @version 2.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import useSWR from 'swr';

/**
 * Metadata table hook state.
 *
 * @template T
 * @interface MetadataTableDataState
 * @property {T[]} data - Loaded metadata rows
 * @property {boolean} loading - Loading state flag
 * @property {string | null} error - Error message when loading fails
 */
export interface MetadataTableDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

const log = logger.child({ module: 'useMetadataTableData' });

/**
 * Loads locale-specific metadata rows using a supplied service fetcher.
 * Results are cached and deduplicated by SWR across all consumers sharing
 * the same `fetcher` + `locale` combination.
 *
 * @template T
 * @param {(locale: string) => Promise<T[]>} fetcher - Metadata service fetcher
 * @param {string} locale - Current locale
 * @param {string} entityName - Entity name for logs
 * @returns {MetadataTableDataState<T>} Metadata loading state
 */
export function useMetadataTableData<T>(
  fetcher: (locale: string) => Promise<T[]>,
  locale: string,
  entityName: string,
): MetadataTableDataState<T> {
  const {
    data,
    isLoading,
    error: swrError,
  } = useSWR<T[], Error>([entityName, locale], () => fetcher(locale), {
    onSuccess: (result) => {
      log.debug(`Loaded ${entityName}`, { count: result.length, locale });
    },
    onError: (err) => {
      log.error(`Failed to load ${entityName}`, {
        error: err instanceof Error ? err.message : String(err),
        locale,
      });
    },
  });

  return {
    data: data ?? [],
    loading: isLoading,
    error: swrError ? swrError.message : null,
  };
}
