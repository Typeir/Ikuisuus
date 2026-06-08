import {
  fetchHeirloomMetadata,
  fetchMonsterMetadata,
  fetchTrinketMetadata,
} from '@/modules/metadata-tables/infrastructure/api-clients/metadataTableClient';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('metadataTableService', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetchMonsterMetadata should request locale-specific endpoint', async () => {
    const payload = [{ slug: 'aboleth' }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchMonsterMetadata<{ slug: string }>('en');

    expect(mockFetch).toHaveBeenCalledWith('/api/monsters?locale=en');
    expect(result).toEqual(payload);
  });

  it('fetchHeirloomMetadata should request locale-specific endpoint', async () => {
    const payload = [{ slug: 'blade' }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchHeirloomMetadata<{ slug: string }>('fi');

    expect(mockFetch).toHaveBeenCalledWith('/api/heirlooms?locale=fi');
    expect(result).toEqual(payload);
  });

  it('fetchTrinketMetadata should request locale-specific endpoint', async () => {
    const payload = [{ slug: 'rope' }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchTrinketMetadata<{ slug: string }>('es');

    expect(mockFetch).toHaveBeenCalledWith('/api/trinkets?locale=es');
    expect(result).toEqual(payload);
  });
});
