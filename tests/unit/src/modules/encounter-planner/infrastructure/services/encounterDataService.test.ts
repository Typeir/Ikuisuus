import {
  fetchAffixIndex,
  fetchMonsterIndex,
  fetchSpellBySlug,
  fetchSpellIndex,
} from '@/modules/encounter-planner/infrastructure/services/encounterDataService';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetcher = vi.fn();

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: (...args: unknown[]) => mockFetcher(...args),
}));

describe('encounterDataService', () => {
  beforeEach(() => {
    mockFetcher.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetchMonsterIndex should call monsters index endpoint with locale', async () => {
    const payload = [
      {
        slug: 'goblin',
        title: 'Goblin',
        cr: '1/4',
        size: 'small',
        creatureType: 'humanoid',
      },
    ];
    mockFetcher.mockResolvedValue(payload);

    const result = await fetchMonsterIndex('en');

    expect(mockFetcher).toHaveBeenCalledWith('/api/monsters/index?locale=en');
    expect(result).toEqual(payload);
  });

  it('fetchSpellIndex should call spells index endpoint with locale', async () => {
    const payload = [
      { slug: 'fireball', title: 'Fireball', level: 3, school: 'Evocation' },
    ];
    mockFetcher.mockResolvedValue(payload);

    const result = await fetchSpellIndex('fi');

    expect(mockFetcher).toHaveBeenCalledWith('/api/spells/index?locale=fi');
    expect(result).toEqual(payload);
  });

  it('fetchAffixIndex should call affix index endpoint with locale', async () => {
    const payload = [
      { slug: 'brutal', title: 'Brutal', link: '/world/brutal' },
    ];
    mockFetcher.mockResolvedValue(payload);

    const result = await fetchAffixIndex('es');

    expect(mockFetcher).toHaveBeenCalledWith('/api/affixes/index?locale=es');
    expect(result).toEqual(payload);
  });

  it('fetchSpellBySlug should call spell detail endpoint with locale and slug', async () => {
    const payload = { link: '/spells/fireball' };
    mockFetcher.mockResolvedValue(payload);

    const result = await fetchSpellBySlug('en', 'fireball');

    expect(mockFetcher).toHaveBeenCalledWith('/api/spells/fireball?locale=en');
    expect(result).toEqual(payload);
  });
});
