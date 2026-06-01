/**
 * @fileoverview GitHub pull request creation helper.
 * @module modules/mdx-editor/infrastructure/github/openPullRequest
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { ghFetch } from '@/modules/mdx-editor/infrastructure/github/ghFetch';

/**
 * Opens a pull request targeting main.
 *
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {string} branch - Source branch.
 * @param {string} title - PR title.
 * @param {string} body - PR body.
 * @returns {Promise<string>} Created PR URL.
 */
export async function openPullRequest(
  owner: string,
  repo: string,
  branch: string,
  title: string,
  body: string,
): Promise<string> {
  const res = await ghFetch(`repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title, body, head: branch, base: 'main' }),
  });

  if (!res.ok) {
    throw new Error(`Failed to open PR: ${await res.text()}`);
  }

  const data = await res.json();
  return data.html_url as string;
}
