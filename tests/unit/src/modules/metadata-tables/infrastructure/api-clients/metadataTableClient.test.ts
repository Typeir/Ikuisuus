import { fetcher } from '@/lib/fetch/fetcher';
import {
    fetchHeirloomMetadata,
    fetchMonsterMetadata,
    fetchTrinketMetadata,
} from '@/modules/metadata-tables/infrastructure/api-clients/metadataTableClient';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: vi.fn(),
}));

describe('metadataTableClient', () => {
  it('fetchMonsterMetadata calls monsters route', async () => {
    vi.mocked(fetcher).mockResolvedValueOnce([]);
    await fetchMonsterMetadata('en');
    expect(fetcher).toHaveBeenCalledWith('/api/monsters?locale=en');
  });

  it('fetchHeirloomMetadata calls heirlooms route', async () => {
    vi.mocked(fetcher).mockResolvedValueOnce([]);
    await fetchHeirloomMetadata('fi');
    expect(fetcher).toHaveBeenCalledWith('/api/heirlooms?locale=fi');
  });

  it('fetchTrinketMetadata calls trinkets route', async () => {
    vi.mocked(fetcher).mockResolvedValueOnce([]);
    await fetchTrinketMetadata('es');
    expect(fetcher).toHaveBeenCalledWith('/api/trinkets?locale=es');
  });
});
