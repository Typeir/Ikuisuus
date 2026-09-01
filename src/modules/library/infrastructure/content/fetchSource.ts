/**
 * @fileoverview Fetches raw source content from the source API route.
 * @module modules/library/infrastructure/content/fetchSource
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { fetcher } from '@/lib/fetch/fetcher';

/**
 * Fetches raw MDX source text for a content file.
 *
 * @param {string} file - Content-root relative file path.
 * @param {string} locale - Locale code.
 * @returns {Promise<string>} Raw source content or empty string.
 */
export async function fetchSource(
  file: string,
  locale: string,
): Promise<string> {
  try {
    const params = new URLSearchParams({ file, locale });
    const data = await fetcher<{ content?: string }>(
      `/api/source?${params.toString()}`,
    );

    return data.content ?? '';
  } catch {
    return '';
  }
}
