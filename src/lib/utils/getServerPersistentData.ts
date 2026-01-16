/**
 * Server-side persistent data reader
 *
 * @fileoverview Reads persistent UI state from cookies on the server.
 * Uses Next.js cookies() API for server component access.
 *
 * @module lib/utils/getServerPersistentData
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @description
 * Enables server-side reading of persistent UI state stored in cookies.
 * This allows SSR to render with the same expanded paths as client hydration,
 * preventing hydration mismatch warnings.
 *
 * The cookie is set client-side via PersistentUiContext when state changes.
 */

import { cookies } from 'next/headers';
import {
    PERSISTENT_UI_STORAGE_KEY,
    SerializedPersistentUiState,
} from '../types/persistentUiState';

/**
 * Reads persistent UI state from server-side cookies
 *
 * @async
 * @function getServerPersistentData
 * @returns {Promise<SerializedPersistentUiState | null>} Parsed state or null
 *
 * @description
 * Decodes URL-encoded cookie value and parses as JSON.
 * Returns null if cookie is missing, empty, or malformed.
 *
 * @example
 * // In a Server Component
 * const state = await getServerPersistentData();
 * if (state?.theme) {
 *   console.log('User theme:', state.theme);
 * }
 */
export async function getServerPersistentData(): Promise<SerializedPersistentUiState | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(PERSISTENT_UI_STORAGE_KEY);

    if (!cookie?.value) {
      return null;
    }

    const decoded = decodeURIComponent(cookie.value);
    const parsed = JSON.parse(decoded) as SerializedPersistentUiState;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Gets initial expanded paths for SSR hydration
 *
 * @async
 * @function getServerExpandedPaths
 * @returns {Promise<string[]>} Array of expanded paths from cookies
 *
 * @description
 * Returns the sidebar expanded paths stored in the persistent UI cookie.
 * Used by layout.tsx to pass initial state to client providers,
 * ensuring SSR and client hydration use identical expanded paths.
 *
 * @example
 * // In layout.tsx (Server Component)
 * const initialExpandedPaths = await getServerExpandedPaths();
 * // Returns: ['monsters', 'monsters/dragons'] or []
 */
export async function getServerExpandedPaths(): Promise<string[]> {
  const state = await getServerPersistentData();
  return state?.sidebarMenu?.expandedPaths ?? [];
}
