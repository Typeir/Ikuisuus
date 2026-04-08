/**
 * @fileoverview Metadata Table Data Hook
 * @description Generic hook for locale-aware metadata table API loading.
 *
 * @module lib/hooks/data/useMetadataTableData
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import { useEffect, useState } from 'react';

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
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher(locale);
        if (cancelled) {
          return;
        }
        log.debug(`Loaded ${entityName}`, {
          count: result.length,
          locale,
        });
        setData(result);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        const message =
          loadError instanceof Error ? loadError.message : String(loadError);
        log.error(`Failed to load ${entityName}`, { error: message, locale });
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [entityName, fetcher, locale]);

  return { data, loading, error };
}
