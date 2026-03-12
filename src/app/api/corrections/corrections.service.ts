/**
 * @fileoverview GitHub Corrections Service
 * @description Handles GitHub API operations for the corrections submission flow:
 * authenticated fetch wrapper, branch creation, file commits, and PR opening.
 *
 * @module app/api/corrections/corrections.service
 */

/**
 * Authenticated fetch wrapper for the GitHub REST API.
 *
 * @function ghFetch
 * @param {string} endpoint - GitHub API endpoint (without base URL)
 * @param {RequestInit} [init] - Fetch options (method, body, headers)
 * @returns {Promise<Response>} Raw fetch response
 */
export const ghFetch = async (
  endpoint: string,
  init?: RequestInit,
): Promise<Response> => {
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
};

/**
 * Create a new branch from the current HEAD of `main`.
 *
 * @function createBranch
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branchName - Name for the new branch
 * @throws {Error} If fetching main ref or creating branch fails
 */
export const createBranch = async (
  owner: string,
  repo: string,
  branchName: string,
): Promise<void> => {
  const refRes = await ghFetch(`repos/${owner}/${repo}/git/ref/heads/main`);
  if (!refRes.ok) {
    throw new Error(`Failed to get main ref: ${await refRes.text()}`);
  }
  const refData = await refRes.json();
  const mainSha = refData.object.sha;

  const createRes = await ghFetch(`repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Failed to create branch: ${body}`);
  }
};

/**
 * Commit (PUT) a file's contents to a branch via the GitHub Contents API.
 *
 * @function commitFile
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} filePath - Path within the repository
 * @param {string} content - Raw file content (base64-encoded internally)
 * @param {string} baseSha - SHA of the file being replaced (empty string for new files)
 * @param {string} branch - Target branch name
 * @param {string} message - Commit message
 * @throws {Error} With `code: 'CONFLICT'` on HTTP 409, generic error otherwise
 */
export const commitFile = async (
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  baseSha: string,
  branch: string,
  message: string,
): Promise<void> => {
  const payload: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  };
  if (baseSha) payload.sha = baseSha;

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
      {
        code: 'CONFLICT',
      },
    );
  }

  if (!res.ok) {
    throw new Error(`Failed to commit file: ${await res.text()}`);
  }
};

/**
 * Open a pull request against the `main` branch.
 *
 * @function openPullRequest
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Source branch name
 * @param {string} title - PR title
 * @param {string} body - PR body (markdown)
 * @returns {Promise<string>} URL of the created pull request
 * @throws {Error} If PR creation fails
 */
export const openPullRequest = async (
  owner: string,
  repo: string,
  branch: string,
  title: string,
  body: string,
): Promise<string> => {
  const res = await ghFetch(`repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title, body, head: branch, base: 'main' }),
  });

  if (!res.ok) {
    throw new Error(`Failed to open PR: ${await res.text()}`);
  }

  const data = await res.json();
  return data.html_url as string;
};

/**
 * Build a sanitized branch name from the action label and file path.
 *
 * @function buildBranchName
 * @param {string} filePath - Content file path
 * @param {boolean} isNew - Whether this is a new file creation
 * @returns {string} Branch name (e.g., 'corrections/path-to-file-1234567890')
 */
export const buildBranchName = (filePath: string, isNew: boolean): string => {
  const timestamp = Date.now();
  const actionLabel = isNew ? 'new' : 'corrections';
  return `${actionLabel}/${filePath.replace(/[^a-zA-Z0-9\-_/]/g, '-')}-${timestamp}`;
};

/**
 * Build the commit message for a correction or new file submission.
 *
 * @function buildCommitMessage
 * @param {string} filePath - Content file path
 * @param {boolean} isNew - Whether this is a new file creation
 * @param {string} [customMessage] - Optional user-provided message
 * @returns {string} Commit message
 */
export const buildCommitMessage = (
  filePath: string,
  isNew: boolean,
  customMessage?: string,
): string => {
  return (
    customMessage ||
    (isNew ? `[new]: create ${filePath}` : `[correction]: update ${filePath}`)
  );
};

/**
 * Build the title and body for the pull request.
 *
 * @function buildPrContent
 * @param {string} filePath - Content file path
 * @param {boolean} isNew - Whether this is a new file creation
 * @param {string} baseSha - Base SHA of the file
 * @param {string} auditId - Token label / username for attribution
 * @param {string} clientIp - Client IP for metadata comment
 * @returns {{ title: string; body: string }} PR title and body
 */
export const buildPrContent = (
  filePath: string,
  isNew: boolean,
  baseSha: string,
  auditId: string,
  clientIp: string,
): { title: string; body: string } => {
  const title = isNew ? `New file: ${filePath}` : `Correction: ${filePath}`;
  const bodyBase = isNew
    ? `New file submitted via the Library editor.\n\n**File**: \`${filePath}\`\n**Token label**: \`${auditId}\``
    : `Automated correction submitted via the Library editor.\n\n**File**: \`${filePath}\`\n**Based on SHA**: \`${baseSha}\`\n**Token label**: \`${auditId}\``;
  const body = `${bodyBase}\n\n<!-- meta:ip=${clientIp} -->`;
  return { title, body };
};
