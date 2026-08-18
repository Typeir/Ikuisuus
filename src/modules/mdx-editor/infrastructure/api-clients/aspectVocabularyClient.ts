/**
 * @fileoverview Fetch authorable aspect vocabulary for picker.
 *
 * @module modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

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
    const res = await fetch('/api/aspects/vocabulary');
    if (!res.ok) return null;
    const data = (await res.json()) as { groups?: AspectVocabularyGroup[] };
    return Array.isArray(data.groups) ? data.groups : null;
  } catch {
    return null;
  }
}
