/**
 * @fileoverview GitHub file deletion helper.
 * @module modules/mdx-editor/infrastructure/github/deleteFile
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { ghFetch } from '@/modules/mdx-editor/infrastructure/github/ghFetch';

/**
 * Deletes a file from a branch using GitHub contents API.
 *
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {string} filePath - Repository file path.
 * @param {string} baseSha - Existing blob SHA.
 * @param {string} branch - Target branch.
 * @param {string} message - Commit message.
 * @returns {Promise<void>} Resolves when deletion succeeds.
 */
export async function deleteFile(
  owner: string,
  repo: string,
  filePath: string,
  baseSha: string,
  branch: string,
  message: string,
): Promise<void> {
  const payload: Record<string, string> = {
    message,
    sha: baseSha,
    branch,
  };

  const res = await ghFetch(
    `repos/${owner}/${repo}/contents/${encodeURI(filePath)}`,
    {
      method: 'DELETE',
      body: JSON.stringify(payload),
    },
  );

  if (res.status === 409) {
    throw Object.assign(
      new Error('Conflict: file has been modified since you loaded it'),
      { code: 'CONFLICT' },
    );
  }

  if (!res.ok) {
    throw new Error(`Failed to delete file: ${await res.text()}`);
  }
}
