/**
 * Submit Edit From Client Use Case
 *
 * @fileoverview Submit editor payload from client to corrections API.
 * @module modules/mdx-editor/application/use-cases/submitEditFromClient
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

/**
 * Client submission payload.
 *
 * @interface SubmitEditPayload
 * @property {string} token - Session token.
 * @property {string} path - Target repository path.
 * @property {string} content - New file content.
 * @property {string} baseSha - Base file SHA.
 * @property {boolean} isNew - Whether this is a new file.
 * @property {string | null} expectedDraftUpdatedAt - Optimistic concurrency cursor timestamp.
 * @property {string | null} expectedDraftVersionHash - Optimistic concurrency cursor hash.
 */
export interface SubmitEditPayload {
  token: string;
  path: string;
  content: string;
  baseSha: string;
  isNew: boolean;
  expectedDraftUpdatedAt: string | null;
  expectedDraftVersionHash: string | null;
  renameEnabled?: boolean;
  renameToPath?: string;
}

/**
 * Client submit response.
 *
 * @interface SubmitEditResult
 * @property {boolean} ok - Whether the request succeeded.
 * @property {number} status - HTTP status code.
 * @property {string} [prUrl] - Pull request URL on success.
 * @property {string} [error] - Error message on failure.
 */
export interface SubmitEditResult {
  ok: boolean;
  status: number;
  prUrl?: string;
  error?: string;
}

/**
 * Submits edited content to the corrections API.
 *
 * @param {SubmitEditPayload} payload - Submission payload.
 * @returns {Promise<SubmitEditResult>} Submit result.
 */
import { FetchError, fetcher } from '@/lib/fetch/fetcher';
export async function submitEditFromClient(
  payload: SubmitEditPayload,
): Promise<SubmitEditResult> {
  try {
    const data = await fetcher<{ prUrl?: string }>('/api/corrections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${payload.token.trim()}`,
      },
      body: JSON.stringify({
        path: payload.path,
        content: payload.content,
        baseSha: payload.baseSha,
        isNew: payload.isNew,
        expectedDraftUpdatedAt: payload.expectedDraftUpdatedAt,
        expectedDraftVersionHash: payload.expectedDraftVersionHash,
        renameEnabled: payload.renameEnabled,
        renameToPath: payload.renameToPath,
      }),
    });

    /* `status` is only read on the failure path, where it comes from the
       rejection. A success reports 200 rather than claim a code it cannot see. */
    return { ok: true, status: 200, prUrl: data.prUrl };
  } catch (err) {
    /* A conflict or a stale draft is reported in the body, and the caller
       branches on the status, so both are carried through. */
    if (err instanceof FetchError) {
      const body = err.body as { error?: string } | undefined;
      return {
        ok: false,
        status: err.status,
        error: body?.error || `HTTP ${err.status}`,
      };
    }

    throw err;
  }
}
