/**
 * @fileoverview Draft and Editor Service
 * @description API service helpers for draft overlay and MDX editor tree data.
 *
 * @module modules/mdx-editor/infrastructure/api-clients/draftEditorClient
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import type { DraftMetadata } from '@/lib/db/content/schemas/draftMetadata';
import { fetcher } from '@/lib/fetch/fetcher';
import type { CorrectionsTreeNode } from '@/modules/mdx-editor/domain/types';

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
    const payload = await fetcher<{ draft?: DraftMetadata }>(
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
    const payload = await fetcher<{ tree?: CorrectionsTreeNode[] }>(
      `/api/corrections/tree?locale=${encodeURIComponent(locale)}`,
    );
    return payload.tree ?? [];
  } catch {
    return [];
  }
}
