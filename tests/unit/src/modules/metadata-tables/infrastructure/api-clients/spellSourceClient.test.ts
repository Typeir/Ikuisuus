import { fetcher } from '@/lib/fetch/fetcher';
import { fetchSpellSources } from '@/modules/metadata-tables/infrastructure/api-clients/spellSourceClient';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: vi.fn(),
}));

describe('spellSourceClient', () => {
  it('fetches endpoint source and preserves inline source', async () => {
    vi.mocked(fetcher).mockResolvedValueOnce([
      { slug: 'remote-spell', title: 'Remote', level: 1, school: 'evocation' },
    ] as never);

    const result = await fetchSpellSources({
      sources: [
        '/api/spells',
        [
          {
            slug: 'inline-spell',
            title: 'Inline',
            level: 0,
            school: 'illusion',
          },
        ],
      ],
      locale: 'en',
    });

    expect(fetcher).toHaveBeenCalledWith('/api/spells', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'en' }),
    });
    expect(result.map((spell) => spell.slug).sort()).toEqual([
      'inline-spell',
      'remote-spell',
    ]);
  });
});
