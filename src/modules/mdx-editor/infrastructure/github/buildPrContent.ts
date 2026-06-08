/**
 * @fileoverview Branch, commit, and PR content builders for corrections flow.
 * @module modules/mdx-editor/infrastructure/github/buildPrContent
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/**
 * Creates sanitized branch name for correction operation.
 *
 * @param {string} filePath - Target file path.
 * @param {boolean} isNew - Whether operation creates a new file.
 * @returns {string} Branch name.
 */
export function buildBranchName(filePath: string, isNew: boolean): string {
  const timestamp = Date.now();
  const actionLabel = isNew ? 'new' : 'corrections';
  const sanitized = filePath
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-zA-Z0-9\-_/]/g, '-');
  return `${actionLabel}/${sanitized}-${timestamp}`;
}

/**
 * Creates commit message text.
 *
 * @param {string} filePath - Target file path.
 * @param {boolean} isNew - Whether operation creates a new file.
 * @param {string} [customMessage] - Optional user-provided commit message.
 * @returns {string} Commit message.
 */
export function buildCommitMessage(
  filePath: string,
  isNew: boolean,
  customMessage?: string,
): string {
  return (
    customMessage ||
    (isNew ? `[new]: create ${filePath}` : `[correction]: update ${filePath}`)
  );
}

/**
 * Creates PR title and body text.
 *
 * @param {string} filePath - Target file path.
 * @param {boolean} isNew - Whether operation creates a new file.
 * @param {string} baseSha - Base SHA used for update operations.
 * @param {string} auditId - Audit actor identifier.
 * @param {string} clientIp - Client IP metadata.
 * @returns {{ title: string; body: string }} PR title/body payload.
 */
export function buildPrContent(
  filePath: string,
  isNew: boolean,
  baseSha: string,
  auditId: string,
  clientIp: string,
): { title: string; body: string } {
  const title = isNew ? `New file: ${filePath}` : `Correction: ${filePath}`;
  const bodyBase = isNew
    ? `New file submitted via the Library editor.\n\n**File**: \`${filePath}\`\n**Token label**: \`${auditId}\``
    : `Automated correction submitted via the Library editor.\n\n**File**: \`${filePath}\`\n**Based on SHA**: \`${baseSha}\`\n**Token label**: \`${auditId}\``;

  return {
    title,
    body: `${bodyBase}\n\n<!-- meta:ip=${clientIp} -->`,
  };
}
