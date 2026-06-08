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
export async function loadContentForEditing(
  slug: string,
  locale: string,
): Promise<LoadContentResponse> {
  const res = await fetch(
    `/api/corrections/read?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`,
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return (await res.json()) as LoadContentResponse;
}
