/**
 * @fileoverview Load content for editing use-case.
 * @module modules/mdx-editor/application/use-cases/loadContentForEditing
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/**
 * Payload returned by read endpoint.
 *
 * @interface LoadContentResponse
 * @property {string} content - File contents.
 * @property {string} path - Resolved repository path.
 * @property {string} sha - Current file SHA.
 * @property {{ updatedAt?: string | null; versionHash?: string | null }} [draftCursor] - Draft cursor values.
 */
export interface LoadContentResponse {
  content: string;
  path: string;
  sha: string;
  draftCursor?: {
    updatedAt?: string | null;
    versionHash?: string | null;
  };
}

/**
 * Loads content from corrections read endpoint.
 *
 * @param {string} slug - Target content slug.
 * @param {string} locale - Active locale.
 * @returns {Promise<LoadContentResponse>} Resolved content payload.
 * @throws {Error} When request fails.
 */
import { FetchError, fetcher } from '@/lib/fetch/fetcher';
export async function loadContentForEditing(
  slug: string,
  locale: string,
): Promise<LoadContentResponse> {
  try {
    return await fetcher<LoadContentResponse>(
      `/api/corrections/read?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`,
    );
  } catch (err) {
    /* The route explains itself in the body; surface that over the status. */
    if (err instanceof FetchError) {
      const body = err.body as { error?: string } | undefined;
      throw new Error(body?.error || `HTTP ${err.status}`);
    }

    throw err;
  }
}
