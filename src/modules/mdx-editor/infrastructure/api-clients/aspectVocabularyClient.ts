/**
 * @fileoverview Fetch authorable aspect vocabulary for picker.
 *
 * @module modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import { fetcher } from '@/lib/fetch/fetcher';
import type { AspectVocabularyGroup } from '@/lib/metadata/aspectVocabulary';

/**
 * Fetch vocabulary. Null on failure.
 *
 * @returns {Promise<AspectVocabularyGroup[] | null>} Groups with values
 */
export async function fetchAspectVocabulary(): Promise<
  AspectVocabularyGroup[] | null
> {
  try {
    const data = await fetcher<{ groups?: AspectVocabularyGroup[] }>(
      '/api/aspects/vocabulary',
    );
    return Array.isArray(data.groups) ? data.groups : null;
  } catch {
    return null;
  }
}
