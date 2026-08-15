/**
 * @fileoverview Metadata Preview Client Tests
 * @description Posting the buffer and null-on-failure behaviour.
 *
 * @module tests/unit/src/modules/mdx-editor/infrastructure/api-clients/metadataPreviewClient
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/services/api/jsonClient', () => ({
  postJson: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let client: typeof import('@/modules/mdx-editor/infrastructure/api-clients/metadataPreviewClient');
let postJson: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  client = await import(
    '@/modules/mdx-editor/infrastructure/api-clients/metadataPreviewClient'
  );
  const jsonMod = await import('@/lib/services/api/jsonClient');
  postJson = vi.mocked(jsonMod.postJson) as unknown as ReturnType<typeof vi.fn>;
  postJson.mockReset();
});

describe('fetchMetadataPreview', () => {
  it('should post path and content to the preview endpoint', async () => {
    const payload = { ok: true, kind: 'spell', records: [{ slug: 'a' }] };
    postJson.mockResolvedValue(payload);

    const result = await client.fetchMetadataPreview(
      'src/content/en/spells/a.mdx',
      '# A',
    );

    expect(postJson).toHaveBeenCalledWith('/api/metadata/preview', {
      path: 'src/content/en/spells/a.mdx',
      content: '# A',
    });
    expect(result).toEqual(payload);
  });

  it('should return null on request failure', async () => {
    postJson.mockRejectedValue(new Error('500'));

    const result = await client.fetchMetadataPreview(
      'src/content/en/spells/a.mdx',
      '# A',
    );

    expect(result).toBeNull();
  });
});
