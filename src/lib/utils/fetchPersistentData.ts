/**
 * Persistent Data Retrieval Utility
 *
 * @fileoverview Retrieves persisted UI state from storage by priority.
 *
 * @module lib/utils/fetchPersistentData
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @description
 * Lookup priority order: cookies, sessionStorage, localStorage.
 * Returns first non-null value; null when window is unavailable (SSR).
 */

import { readCookie } from './storePersistentData';

/**
 * Fetches persistent data from storage layers by priority
 *
 * @function fetchPersistentData
 * @param {string} key - The storage key to retrieve
 * @returns {string | null} The stored value, or null if not found / SSR
 *
 * @description
 * Checks cookies, then sessionStorage, then localStorage; returns the
 * first non-null value found.
 *
 * @example
 * const uiState = fetchPersistentData('ikuisuus-ui');
 * if (uiState) {
 *   const parsed = JSON.parse(uiState);
 * }
 */
export const fetchPersistentData = (key: string): string | null => {
  if (typeof window === 'undefined') return null;

  const cookieValue = readCookie(key);
  if (cookieValue !== null) return cookieValue;

  const session = sessionStorage.getItem(key);
  if (session) return session;

  return localStorage.getItem(key);
};
