/**
 * @fileoverview Post MDX buffer to preview API. Returns parsed metadata.
 *
 * @module modules/mdx-editor/infrastructure/api-clients/metadataPreviewClient
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import { fetcher } from '@/lib/fetch/fetcher';

/**
 * Response of POST /api/metadata/preview.
 *
 * @property {boolean} ok - True on success
 * @property {string} kind - Content kind the path routed to
 * @property {Record<string, unknown>[]} records - Parsed metadata records
 */
export interface MetadataPreviewResult {
  ok: boolean;
  kind: string;
  records: Record<string, unknown>[];
}

/**
 * Fetches parsed metadata for an unsaved MDX buffer.
 *
 * @param {string} path - Repo-relative content path under `src/content/`
 * @param {string} content - Complete MDX source including frontmatter
 * @returns {Promise<MetadataPreviewResult | null>} Parsed records, or null on failure
 */
export async function fetchMetadataPreview(
  path: string,
  content: string,
): Promise<MetadataPreviewResult | null> {
  try {
    return await fetcher<MetadataPreviewResult>('/api/metadata/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    });
  } catch {
    return null;
  }
}
