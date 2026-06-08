/**
 * @fileoverview GitHub branch creation helper.
 * @module modules/mdx-editor/infrastructure/github/createBranch
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { ghFetch } from '@/modules/mdx-editor/infrastructure/github/ghFetch';

/**
 * Creates a branch from main.
 *
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {string} branchName - New branch name.
 * @returns {Promise<void>} Resolves when branch creation succeeds.
 */
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
): Promise<void> {
  const refRes = await ghFetch(`repos/${owner}/${repo}/git/ref/heads/main`);
  if (!refRes.ok) {
    throw new Error(`Failed to get main ref: ${await refRes.text()}`);
  }

  const refData = await refRes.json();
  const mainSha = refData.object.sha as string;

  const createRes = await ghFetch(`repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create branch: ${await createRes.text()}`);
  }
}
