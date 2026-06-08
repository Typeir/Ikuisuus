import {
  fetchActiveDraft,
  fetchCorrectionsTree,
} from '@/modules/mdx-editor/infrastructure/api-clients/draftEditorClient';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('draftEditorService', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchActiveDraft('en', 'monsters/goblin');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/drafts?locale=en&slug=monsters%2Fgoblin',
    );
    expect(result).toEqual(payload.draft);
  });

  it('fetchActiveDraft should return null on failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });

    const result = await fetchActiveDraft('en', 'missing');

    expect(result).toBeNull();
  });

  it('fetchCorrectionsTree should return tree payload when available', async () => {
    const payload = {
      tree: [{ name: 'world', path: 'en/world', type: 'directory' }],
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchCorrectionsTree('fi');

    expect(mockFetch).toHaveBeenCalledWith('/api/corrections/tree?locale=fi');
    expect(result).toEqual(payload.tree);
  });

  it('fetchCorrectionsTree should return empty array on failure', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));

    const result = await fetchCorrectionsTree('en');

    expect(result).toEqual([]);
  });
});
