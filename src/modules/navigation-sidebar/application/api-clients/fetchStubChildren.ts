/**
 * @fileoverview Pure async function for fetching stub sidebar children from API
 * @module modules/navigation-sidebar/application/api-clients/fetchStubChildren
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import type { Item } from '@/modules/navigation-sidebar/domain/types';

/**
 * Fetches stub children for a sidebar item from the tree walk API
 *
 * @param {string} itemPath - Path of the item to fetch children for
 * @param {string} locale - Locale code for API call
 * @returns {Promise<Item[]>} Array of items (WalkNode structure from API); empty on a network error, a non-2xx status, or a non-array body
 */
export async function fetchStubChildren(
  itemPath: string,
  locale: string,
): Promise<Item[]> {
  try {
    const response = await fetch(
      `/api/content/walk?locale=${encodeURIComponent(locale)}&path=${encodeURIComponent(itemPath)}`,
    );
    if (!response.ok) return [];
    const nodes: unknown = await response.json();
    return Array.isArray(nodes) ? (nodes as Item[]) : [];
  } catch {
    return [];
  }
}
