import { fetchSpellSources } from '@/modules/metadata-tables/infrastructure/api-clients/spellSourceClient';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('spellSourceService', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should merge inline and endpoint spell sources and de-duplicate by slug', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            slug: 'fireball',
            title: 'Fireball',
            level: 3,
            school: 'Evocation',
            castingTime: ['action'],
            castingTimeRaw: '1 action',
            range: '150 feet',
            duration: 'Instantaneous',
            verbal: true,
            somatic: true,
            material: false,
            concentration: false,
          },
        ]),
    });

    const result = await fetchSpellSources({
      locale: 'en',
      sources: [
        '/api/spells/list',
        [
          {
            slug: 'fireball',
            title: 'Fireball Duplicate',
            level: 3,
            school: 'Evocation',
            castingTime: ['action'],
            castingTimeRaw: '1 action',
            range: '150 feet',
            duration: 'Instantaneous',
            verbal: true,
            somatic: true,
            material: false,
            concentration: false,
          },
          {
            slug: 'mage-hand',
            title: 'Mage Hand',
            level: 0,
            school: 'Conjuration',
            castingTime: ['action'],
            castingTimeRaw: '1 action',
            range: '30 feet',
            duration: '1 minute',
            verbal: true,
            somatic: true,
            material: false,
            concentration: false,
          },
        ],
      ],
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/spells/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'en' }),
    });
    expect(result).toHaveLength(2);
    expect(result.map((spell) => spell.slug)).toEqual([
      'fireball',
      'mage-hand',
    ]);
  });

  it('should prioritize listSource payload over spells filter payload', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    await fetchSpellSources({
      locale: 'en',
      listSource: 'wizard',
      spells: ['fireball'],
      sources: ['/api/spells/list'],
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/spells/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'en', listSource: 'wizard' }),
    });
  });

  it('should forward filters in the POST body when provided', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    const filters = [
      { field: 'source', operator: 'neq', value: 'basic' } as const,
    ];

    await fetchSpellSources({
      locale: 'en',
      sources: ['/api/spells/list'],
      filters,
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/spells/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'en', filters }),
    });
  });

  it('should omit filters from the POST body when array is empty', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    await fetchSpellSources({
      locale: 'en',
      sources: ['/api/spells/list'],
      filters: [],
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/spells/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'en' }),
    });
  });
});
