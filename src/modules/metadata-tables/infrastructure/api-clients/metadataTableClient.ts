/**
 * @fileoverview Metadata Table Service
 * @description API service helpers for metadata table wrapper components.
 *
 * @module modules/metadata-tables/infrastructure/api-clients/metadataTableClient
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { fetcher } from '@/lib/fetch/fetcher';

/**
 * Fetches monster metadata rows for the given locale.
 *
 * @template T
 * @param {string} locale - Current locale
 * @returns {Promise<T[]>} Monster metadata rows
 */
export function fetchMonsterMetadata<T>(locale: string): Promise<T[]> {
  return fetcher<T[]>(`/api/monsters?locale=${locale}`);
}

/**
 * Fetches heirloom metadata rows for the given locale.
 *
 * @template T
 * @param {string} locale - Current locale
 * @returns {Promise<T[]>} Heirloom metadata rows
 */
export function fetchHeirloomMetadata<T>(locale: string): Promise<T[]> {
  return fetcher<T[]>(`/api/heirlooms?locale=${locale}`);
}

/**
 * Fetches trinket metadata rows for the given locale.
 *
 * @template T
 * @param {string} locale - Current locale
 * @returns {Promise<T[]>} Trinket metadata rows
 */
export function fetchTrinketMetadata<T>(locale: string): Promise<T[]> {
  return fetcher<T[]>(`/api/trinkets?locale=${locale}`);
}
