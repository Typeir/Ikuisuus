import {
    submitEditFromClient,
    type SubmitEditPayload,
} from '@/modules/mdx-editor/application/use-cases/submitEditFromClient';
import { describe, expect, it, vi } from 'vitest';

const payload: SubmitEditPayload = {
  token: ' token ',
  path: 'en/world/test.mdx',
  content: '# Test',
  baseSha: 'abc123',
  isNew: false,
  expectedDraftUpdatedAt: null,
  expectedDraftVersionHash: null,
};

describe('submitEditFromClient', () => {
  it('returns success payload when request succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ prUrl: 'https://github.com/pr/1' }),
      }),
    );

    await expect(submitEditFromClient(payload)).resolves.toEqual({
      ok: true,
      status: 200,
      prUrl: 'https://github.com/pr/1',
    });
  });

  it('returns normalized error payload on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Draft conflict' }),
      }),
    );

    await expect(submitEditFromClient(payload)).resolves.toEqual({
      ok: false,
      status: 409,
      error: 'Draft conflict',
    });
  });
});
