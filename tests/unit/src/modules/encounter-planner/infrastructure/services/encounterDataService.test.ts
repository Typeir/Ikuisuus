import {
  fetchAffixIndex,
  fetchMonsterIndex,
  fetchSpellBySlug,
  fetchSpellIndex,
} from '@/modules/encounter-planner/infrastructure/services/encounterDataService';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('encounterDataService', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
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
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchMonsterIndex('en');

    expect(mockFetch).toHaveBeenCalledWith('/api/monsters/index?locale=en');
    expect(result).toEqual(payload);
  });

  it('fetchSpellIndex should call spells index endpoint with locale', async () => {
    const payload = [
      { slug: 'fireball', title: 'Fireball', level: 3, school: 'Evocation' },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchSpellIndex('fi');

    expect(mockFetch).toHaveBeenCalledWith('/api/spells/index?locale=fi');
    expect(result).toEqual(payload);
  });

  it('fetchAffixIndex should call affix index endpoint with locale', async () => {
    const payload = [
      { slug: 'brutal', title: 'Brutal', link: '/world/brutal' },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchAffixIndex('es');

    expect(mockFetch).toHaveBeenCalledWith('/api/affixes/index?locale=es');
    expect(result).toEqual(payload);
  });

  it('fetchSpellBySlug should call spell detail endpoint with locale and slug', async () => {
    const payload = { link: '/spells/fireball' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchSpellBySlug('en', 'fireball');

    expect(mockFetch).toHaveBeenCalledWith('/api/spells/fireball?locale=en');
    expect(result).toEqual(payload);
  });
});
