/**
 * @fileoverview Metadata Preview Client Tests
 * @description Posting the buffer and null-on-failure behaviour.
 *
 * @module tests/unit/src/modules/mdx-editor/infrastructure/api-clients/metadataPreviewClient.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let client: typeof import('@/modules/mdx-editor/infrastructure/api-clients/metadataPreviewClient');
let fetcher: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  client = await import(
    '@/modules/mdx-editor/infrastructure/api-clients/metadataPreviewClient'
  );
  const fetcherMod = await import('@/lib/fetch/fetcher');
  fetcher = vi.mocked(fetcherMod.fetcher) as unknown as ReturnType<typeof vi.fn>;
  fetcher.mockReset();
});

describe('fetchMetadataPreview', () => {
  it('should post path and content to the preview endpoint', async () => {
    const payload = { ok: true, kind: 'spell', records: [{ slug: 'a' }] };
    fetcher.mockResolvedValue(payload);

    const result = await client.fetchMetadataPreview(
      'src/content/en/spells/a.mdx',
      '# A',
    );

    expect(fetcher).toHaveBeenCalledWith('/api/metadata/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'src/content/en/spells/a.mdx',
        content: '# A',
      }),
    });
    expect(result).toEqual(payload);
  });

  it('should return null on request failure', async () => {
    fetcher.mockRejectedValue(new Error('500'));

    const result = await client.fetchMetadataPreview(
      'src/content/en/spells/a.mdx',
      '# A',
    );

    expect(result).toBeNull();
  });
});
