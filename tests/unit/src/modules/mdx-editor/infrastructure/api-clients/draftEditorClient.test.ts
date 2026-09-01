import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let client: typeof import('@/modules/mdx-editor/infrastructure/api-clients/draftEditorClient');
let fetcher: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  client = await import(
    '@/modules/mdx-editor/infrastructure/api-clients/draftEditorClient'
  );
  const fetcherMod = await import('@/lib/fetch/fetcher');
  fetcher = vi.mocked(fetcherMod.fetcher) as unknown as ReturnType<typeof vi.fn>;
  fetcher.mockReset();
});

describe('draftEditorService', () => {
  it('fetchActiveDraft should return draft payload when available', async () => {
    const payload = {
      draft: {
        id: 1,
        locale: 'en',
        slug: 'monsters/goblin',
        content: '# Goblin',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    };
    fetcher.mockResolvedValue(payload);

    const result = await client.fetchActiveDraft('en', 'monsters/goblin');

    expect(fetcher).toHaveBeenCalledWith(
      '/api/drafts?locale=en&slug=monsters%2Fgoblin',
    );
    expect(result).toEqual(payload.draft);
  });

  it('fetchActiveDraft should return null on failure', async () => {
    fetcher.mockRejectedValue(new Error('HTTP 404'));

    const result = await client.fetchActiveDraft('en', 'missing');

    expect(result).toBeNull();
  });

  it('fetchCorrectionsTree should return tree payload when available', async () => {
    const payload = {
      tree: [{ name: 'world', path: 'en/world', type: 'directory' }],
    };
    fetcher.mockResolvedValue(payload);

    const result = await client.fetchCorrectionsTree('fi');

    expect(fetcher).toHaveBeenCalledWith('/api/corrections/tree?locale=fi');
    expect(result).toEqual(payload.tree);
  });

  it('fetchCorrectionsTree should return empty array on failure', async () => {
    fetcher.mockRejectedValue(new Error('network down'));

    const result = await client.fetchCorrectionsTree('en');

    expect(result).toEqual([]);
  });
});
