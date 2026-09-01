import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    fetcher: vi.fn(),
    // Mock FetchError so instanceof checks in the use-case resolve correctly.
    FetchError: class extends Error {
        status: number;
        statusText: string;
        body: unknown;
        url: string;
        constructor(
            status: number,
            statusText: string,
            body: unknown,
            url: string,
        ) {
            super(`HTTP ${status} ${statusText}`);
            this.status = status;
            this.statusText = statusText;
            this.body = body;
            this.url = url;
        }
    },
}));

vi.mock('@/lib/fetch/fetcher', () => mocks);

import {
    submitEditFromClient,
    type SubmitEditPayload,
} from '@/modules/mdx-editor/application/use-cases/submitEditFromClient';

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
    vi.mocked(mocks.fetcher).mockResolvedValue({
      prUrl: 'https://github.com/pr/1',
    });

    await expect(submitEditFromClient(payload)).resolves.toEqual({
      ok: true,
      status: 200,
      prUrl: 'https://github.com/pr/1',
    });
  });

  it('returns normalized error payload on failure', async () => {
    vi.mocked(mocks.fetcher).mockRejectedValue(
      new mocks.FetchError(
        409,
        'Conflict',
        { error: 'Draft conflict' },
        '/api/corrections',
      ),
    );

    await expect(submitEditFromClient(payload)).resolves.toEqual({
      ok: false,
      status: 409,
      error: 'Draft conflict',
    });
  });
});
