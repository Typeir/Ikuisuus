/**
 * @fileoverview Correction submission orchestration use-case.
 * @module modules/mdx-editor/application/use-cases/submitCorrection
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { writeAuditLog } from '@/lib/db/auditLog';
import { draftRepository } from '@/lib/db/content/repositories/draftRepository';
import {
    buildBranchName,
    buildCommitMessage,
    buildPrContent,
} from '@/modules/mdx-editor/infrastructure/github/buildPrContent';
import { commitFile } from '@/modules/mdx-editor/infrastructure/github/commitFile';
import { createBranch } from '@/modules/mdx-editor/infrastructure/github/createBranch';
import { deleteFile } from '@/modules/mdx-editor/infrastructure/github/deleteFile';
import { openPullRequest } from '@/modules/mdx-editor/infrastructure/github/openPullRequest';

/**
 * Correction submission payload.
 *
 * @interface SubmitCorrectionPayload
 * @property {string} owner - Content repository owner.
 * @property {string} repo - Content repository name.
 * @property {string} filePath - Target file path.
 * @property {string} content - New file content.
 * @property {string} baseSha - Base SHA for optimistic concurrency.
 * @property {boolean} isNew - Whether this submission creates a file.
 * @property {string | undefined} message - Optional commit message.
 * @property {string} auditId - Actor id for audit log.
 * @property {'admin' | 'editor'} role - Session role.
 * @property {string} clientIp - Client ip for PR metadata.
 * @property {string | null | undefined} expectedDraftUpdatedAt - Draft timestamp cursor.
 * @property {string | null | undefined} expectedDraftVersionHash - Draft hash cursor.
 * @property {boolean} [renameEnabled] - Whether file rename is enabled.
 * @property {string} [renameToPath] - Target path for renamed file.
 */
export interface SubmitCorrectionPayload {
  owner: string;
  repo: string;
  filePath: string;
  content: string;
  baseSha: string;
  isNew: boolean;
  message?: string;
  auditId: string;
  role: 'admin' | 'editor';
  clientIp: string;
  expectedDraftUpdatedAt?: string | null;
  expectedDraftVersionHash?: string | null;
  renameEnabled?: boolean;
  renameToPath?: string;
}

/**
 * Correction submission result.
 *
 * @interface SubmitCorrectionResult
 * @property {string} prUrl - Created pull request URL.
 * @property {string} slugFromPath - Slug derived from file path.
 * @property {string} [oldSlugFromPath] - Slug derived from old file path if renamed.
 */
export interface SubmitCorrectionResult {
  prUrl: string;
  slugFromPath: string;
  oldSlugFromPath?: string;
}

/**
 * Executes correction submission flow: persist draft, create branch, commit file, open PR, and audit.
 *
 * @param {SubmitCorrectionPayload} payload - Submission payload.
 * @returns {Promise<SubmitCorrectionResult>} Submission outcome.
 */
export async function submitCorrection(
  payload: SubmitCorrectionPayload,
): Promise<SubmitCorrectionResult> {
  const branchName = buildBranchName(payload.filePath, payload.isNew);
  const commitMsg = buildCommitMessage(
    payload.filePath,
    payload.isNew,
    payload.message,
  );
  const { title: prTitle, body: prBody } = buildPrContent(
    payload.filePath,
    payload.isNew,
    payload.baseSha,
    payload.auditId,
    payload.clientIp,
  );

  const locale = payload.filePath.match(/^([a-z]{2})\//)?.[1] ?? 'en';
  const slugFromPath = payload.filePath
    .replace(/^[a-z]{2}\//, '')
    .replace(/\.(sheet\.)?mdx$/, '');

  let oldSlugFromPath: string | undefined;
  if (payload.renameEnabled && payload.renameToPath) {
    oldSlugFromPath = slugFromPath;
  }

  const draftStatus = payload.role === 'admin' ? 'active' : 'pending';

  await draftRepository.upsertIfUnchanged(
    {
      locale,
      slug: slugFromPath,
      content: payload.content,
      status: draftStatus,
    },
    {
      updatedAt:
        payload.expectedDraftUpdatedAt === undefined
          ? undefined
          : payload.expectedDraftUpdatedAt,
      versionHash:
        payload.expectedDraftVersionHash === undefined
          ? undefined
          : payload.expectedDraftVersionHash,
    },
  );

  await createBranch(payload.owner, payload.repo, branchName);

  if (payload.renameEnabled && payload.renameToPath) {
    await deleteFile(
      payload.owner,
      payload.repo,
      payload.filePath,
      payload.baseSha,
      branchName,
      `Delete ${payload.filePath} (rename)`,
    );
  }

  const targetPath =
    payload.renameEnabled && payload.renameToPath
      ? payload.renameToPath
      : payload.filePath;

  await commitFile(
    payload.owner,
    payload.repo,
    targetPath,
    payload.content,
    payload.renameEnabled && payload.renameToPath ? '' : payload.baseSha,
    branchName,
    commitMsg,
  );

  const prUrl = await openPullRequest(
    payload.owner,
    payload.repo,
    branchName,
    prTitle,
    prBody,
  );

  await writeAuditLog({
    content_path: payload.filePath,
    base_sha: payload.baseSha,
    pr_url: prUrl,
    status: 'submitted',
    token_id: payload.auditId,
  });

  return { prUrl, slugFromPath, oldSlugFromPath };
}
