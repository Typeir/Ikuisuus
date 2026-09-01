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
    loadContentForEditing,
    type LoadContentResponse,
} from '@/modules/mdx-editor/application/use-cases/loadContentForEditing';

describe('loadContentForEditing', () => {
  it('returns parsed payload on success', async () => {
    const payload: LoadContentResponse = {
      content: '# Test',
      path: 'en/world/test.mdx',
      sha: 'abc123',
    };
    vi.mocked(mocks.fetcher).mockResolvedValue(payload);

    await expect(loadContentForEditing('world/test', 'en')).resolves.toEqual(
      payload,
    );
  });

  it('throws API error message on failure', async () => {
    vi.mocked(mocks.fetcher).mockRejectedValue(
      new mocks.FetchError(
        404,
        'Not Found',
        { error: 'Missing content' },
        'url',
      ),
    );

    await expect(loadContentForEditing('world/missing', 'en')).rejects.toThrow(
      'Missing content',
    );
  });
});
