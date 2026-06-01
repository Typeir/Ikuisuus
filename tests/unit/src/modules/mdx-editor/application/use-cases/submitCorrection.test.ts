import * as auditModule from '@/lib/db/auditLog';
import { draftRepository } from '@/lib/db/content/repositories/draftRepository';
import { submitCorrection } from '@/modules/mdx-editor/application/use-cases/submitCorrection';
import * as commitFileModule from '@/modules/mdx-editor/infrastructure/github/commitFile';
import * as createBranchModule from '@/modules/mdx-editor/infrastructure/github/createBranch';
import * as openPullRequestModule from '@/modules/mdx-editor/infrastructure/github/openPullRequest';
import { describe, expect, it, vi } from 'vitest';

describe('submitCorrection', () => {
  it('returns PR URL when orchestration succeeds', async () => {
    vi.spyOn(draftRepository, 'upsertIfUnchanged').mockResolvedValue(
      undefined as never,
    );
    vi.spyOn(createBranchModule, 'createBranch').mockResolvedValue(undefined);
    vi.spyOn(commitFileModule, 'commitFile').mockResolvedValue(undefined);
    vi.spyOn(openPullRequestModule, 'openPullRequest').mockResolvedValue(
      'https://github.com/pr/2',
    );
    vi.spyOn(auditModule, 'writeAuditLog').mockResolvedValue(
      undefined as never,
    );

    const result = await submitCorrection({
      owner: 'o',
      repo: 'r',
      filePath: 'en/world/test.mdx',
      content: '# Test',
      baseSha: 'sha',
      isNew: false,
      auditId: 'alice',
      role: 'editor',
      clientIp: '127.0.0.1',
    });

    expect(result.prUrl).toBe('https://github.com/pr/2');
  });
});
