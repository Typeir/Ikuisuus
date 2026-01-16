/**
 * Persistent Data Retrieval Utility
 *
 * @fileoverview Retrieves persisted UI state from multi-layer storage.
 * Uses cookie-first priority for SSR compatibility.
 *
 * @module lib/utils/fetchPersistentData
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @description
 * Lookup priority order:
 * 1. Cookies - Source of truth, enables server-side reading for SSR
 * 2. sessionStorage - Tab-scoped fallback
 * 3. localStorage - Long-term fallback
 *
 * Returns first non-null value found. SSR-safe (returns null when window unavailable).
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
 * Reads from cookies first (for SSR compatibility), then sessionStorage,
 * then localStorage. Returns the first non-null value found.
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
