import {
  useAffixIndex,
  useCreatureIndex,
  useSpellIndex,
  useSpellLinks,
} from '@/lib/hooks/data/useEncounterData';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useEncounterData', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('useCreatureIndex should map monster index records for combobox usage', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            slug: 'goblin',
            title: 'Goblin',
            cr: '1/4',
            size: 'small',
            creatureType: 'humanoid',
          },
        ]),
    });

    const { result } = renderHook(() => useCreatureIndex('en'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items[0].id).toBe('goblin');
    expect(result.current.items[0].searchableText).toContain('Goblin');
    expect(mockFetch).toHaveBeenCalledWith('/api/monsters/index?locale=en');
  });

  it('useSpellIndex should map spell index records for combobox usage', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            slug: 'fireball',
            title: 'Fireball',
            level: 3,
            school: 'Evocation',
          },
        ]),
    });

    const { result } = renderHook(() => useSpellIndex('fi'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items[0].id).toBe('fireball');
    expect(result.current.items[0].searchableText).toContain('Evocation');
    expect(mockFetch).toHaveBeenCalledWith('/api/spells/index?locale=fi');
  });

  it('useAffixIndex should filter out existing affix titles', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { slug: 'brutal', title: 'Brutal', link: '/brutal' },
          { slug: 'swift', title: 'Swift', link: '/swift' },
        ]),
    });

    const { result } = renderHook(() => useAffixIndex('en', ['Brutal']));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].title).toBe('Swift');
  });

  it('useSpellLinks should fetch and normalize relative links', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ link: '/spells/fireball' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ link: 'https://external.test/magic-missile' }),
      });

    const { result } = renderHook(() =>
      useSpellLinks(['fireball', 'magic-missile'], 'en'),
    );

    await waitFor(() => {
      expect(result.current.fireball).toBe('/en/spells/fireball');
      expect(result.current['magic-missile']).toBe(
        'https://external.test/magic-missile',
      );
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/spells/fireball?locale=en');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/spells/magic-missile?locale=en',
    );
  });
});
