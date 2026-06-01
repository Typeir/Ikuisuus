/**
 * @fileoverview Active draft data hook for mdx-editor.
 * @module modules/mdx-editor/application/hooks/useActiveDraft
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

'use client';

import type { DraftMetadata } from '@/lib/db/content/schemas/draftMetadata';
import { draftKey } from '@/lib/fetch/swrKeys';
import type { DraftState } from '@/modules/mdx-editor/domain/types';
import { fetchActiveDraft } from '@/modules/mdx-editor/infrastructure/api-clients/draftEditorClient';
import useSWR from 'swr';

/**
 * Loads active draft metadata for the given locale and slug.
 *
 * @param {string} locale - Content locale.
 * @param {string} slug - Content slug.
 * @returns {DraftState} Draft loading state.
 */
export function useActiveDraft(locale: string, slug: string): DraftState {
  const { data, isLoading } = useSWR<DraftMetadata | null>(
    draftKey(locale, slug),
    () => fetchActiveDraft(locale, slug),
  );

  return { draft: data ?? null, loading: isLoading };
}
