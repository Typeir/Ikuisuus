/**
 * @fileoverview GitHub content commit helper.
 * @module modules/mdx-editor/infrastructure/github/commitFile
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { ghFetch } from '@/modules/mdx-editor/infrastructure/github/ghFetch';

/**
 * Commits file content to a branch using GitHub contents API.
 *
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {string} filePath - Repository file path.
 * @param {string} content - File content.
 * @param {string} baseSha - Existing blob SHA, empty for new file.
 * @param {string} branch - Target branch.
 * @param {string} message - Commit message.
 * @returns {Promise<void>} Resolves when commit succeeds.
 */
export async function commitFile(
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  baseSha: string,
  branch: string,
  message: string,
): Promise<void> {
  const payload: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  };

  if (baseSha) {
    payload.sha = baseSha;
  }

  const res = await ghFetch(
    `repos/${owner}/${repo}/contents/${encodeURI(filePath)}`,
    {
      method: 'PUT',
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
    throw new Error(`Failed to commit file: ${await res.text()}`);
  }
}
