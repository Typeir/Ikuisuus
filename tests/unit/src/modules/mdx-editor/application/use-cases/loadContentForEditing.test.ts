import {
    loadContentForEditing,
    type LoadContentResponse,
} from '@/modules/mdx-editor/application/use-cases/loadContentForEditing';
import { describe, expect, it, vi } from 'vitest';

describe('loadContentForEditing', () => {
  it('returns parsed payload on success', async () => {
    const payload: LoadContentResponse = {
      content: '# Test',
      path: 'en/world/test.mdx',
      sha: 'abc123',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    );

    await expect(loadContentForEditing('world/test', 'en')).resolves.toEqual(
      payload,
    );
  });

  it('throws API error message on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Missing content' }),
      }),
    );

    await expect(loadContentForEditing('world/missing', 'en')).rejects.toThrow(
      'Missing content',
    );
  });
});
