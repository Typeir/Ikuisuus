import { useSpellSources } from '@/lib/hooks/data/useSpellSources';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useSpellSources', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should load spell data from source endpoints', async () => {
    const sources = ['/api/spells/list'];

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

    const { result } = renderHook(() => useSpellSources(sources, 'en'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.spellData).toHaveLength(1);
    expect(result.current.spellData[0].slug).toBe('fireball');
  });

  it('should expose error when source request fails', async () => {
    const sources = ['/api/spells/list'];

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useSpellSources(sources, 'en'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.spellData).toEqual([]);
    expect(result.current.error).toContain('HTTP 500');
  });
});
