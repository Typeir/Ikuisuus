/**
 * @fileoverview Metadata Table Service
 * @description API service helpers for metadata table wrapper components.
 *
 * @module lib/services/api/metadataTableService
 */

import { getJson } from './jsonClient';

/**
 * Fetches monster metadata rows for the given locale.
 *
 * @template T
 * @param {string} locale - Current locale
 * @returns {Promise<T[]>} Monster metadata rows
 */
export function fetchMonsterMetadata<T>(locale: string): Promise<T[]> {
  return getJson<T[]>(`/api/monsters?locale=${locale}`);
}

/**
 * Fetches heirloom metadata rows for the given locale.
 *
 * @template T
 * @param {string} locale - Current locale
 * @returns {Promise<T[]>} Heirloom metadata rows
 */
export function fetchHeirloomMetadata<T>(locale: string): Promise<T[]> {
  return getJson<T[]>(`/api/heirlooms?locale=${locale}`);
}

/**
 * Fetches trinket metadata rows for the given locale.
 *
 * @template T
 * @param {string} locale - Current locale
 * @returns {Promise<T[]>} Trinket metadata rows
 */
export function fetchTrinketMetadata<T>(locale: string): Promise<T[]> {
  return getJson<T[]>(`/api/trinkets?locale=${locale}`);
}
