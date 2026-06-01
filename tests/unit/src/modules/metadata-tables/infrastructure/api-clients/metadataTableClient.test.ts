import { getJson } from '@/lib/services/api/jsonClient';
import {
    fetchHeirloomMetadata,
    fetchMonsterMetadata,
    fetchTrinketMetadata,
} from '@/modules/metadata-tables/infrastructure/api-clients/metadataTableClient';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/services/api/jsonClient', () => ({
  getJson: vi.fn(),
}));

describe('metadataTableClient', () => {
  it('fetchMonsterMetadata calls monsters route', async () => {
    vi.mocked(getJson).mockResolvedValueOnce([]);
    await fetchMonsterMetadata('en');
    expect(getJson).toHaveBeenCalledWith('/api/monsters?locale=en');
  });

  it('fetchHeirloomMetadata calls heirlooms route', async () => {
    vi.mocked(getJson).mockResolvedValueOnce([]);
    await fetchHeirloomMetadata('fi');
    expect(getJson).toHaveBeenCalledWith('/api/heirlooms?locale=fi');
  });

  it('fetchTrinketMetadata calls trinkets route', async () => {
    vi.mocked(getJson).mockResolvedValueOnce([]);
    await fetchTrinketMetadata('es');
    expect(getJson).toHaveBeenCalledWith('/api/trinkets?locale=es');
  });
});
