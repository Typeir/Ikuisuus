/**
 * @fileoverview Draft and Editor Service
 * @description API service helpers for draft overlay and MDX editor tree data.
 *
 * @module lib/services/api/draftEditorService
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import type { DraftMetadata } from '@/lib/db/content/schemas/draftMetadata';
import { getJson } from './jsonClient';

/**
 * Tree node shape for corrections file tree response.
 *
 * @interface CorrectionsTreeNode
 * @property {string} name - Display name for node
 * @property {string} path - Full relative path
 * @property {'file' | 'directory'} type - Node type
 * @property {CorrectionsTreeNode[]} [children] - Nested nodes for directories
 */
export interface CorrectionsTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: CorrectionsTreeNode[];
}

/**
 * Fetches active draft for locale and slug.
 *
 * @param {string} locale - Content locale
 * @param {string} slug - Content slug
 * @returns {Promise<DraftMetadata | null>} Draft metadata or null
 */
export async function fetchActiveDraft(
  locale: string,
  slug: string,
): Promise<DraftMetadata | null> {
  try {
    const payload = await getJson<{ draft?: DraftMetadata }>(
      `/api/drafts?locale=${encodeURIComponent(locale)}&slug=${encodeURIComponent(slug)}`,
    );
    return payload.draft ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches corrections tree used by the MDX editor path picker.
 *
 * @param {string} locale - Current locale
 * @returns {Promise<CorrectionsTreeNode[]>} Tree nodes for selection
 */
export async function fetchCorrectionsTree(
  locale: string,
): Promise<CorrectionsTreeNode[]> {
  try {
    const payload = await getJson<{ tree?: CorrectionsTreeNode[] }>(
      `/api/corrections/tree?locale=${encodeURIComponent(locale)}`,
    );
    return payload.tree ?? [];
  } catch {
    return [];
  }
}
