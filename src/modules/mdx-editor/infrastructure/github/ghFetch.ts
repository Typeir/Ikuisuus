/**
 * @fileoverview Authenticated GitHub REST API wrapper for mdx-editor corrections.
 * @module modules/mdx-editor/infrastructure/github/ghFetch
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/**
 * Performs an authenticated GitHub API request.
 *
 * @param {string} endpoint - GitHub API endpoint without origin.
 * @param {RequestInit} [init] - Optional request options.
 * @returns {Promise<Response>} Raw response from GitHub API.
 */
export async function ghFetch(
  endpoint: string,
  init?: RequestInit,
): Promise<Response> {
  const token = process.env.GITHUB_PAT;
  return fetch(`https://api.github.com/${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}
