import { postJson } from '@/lib/services/api/jsonClient';
import { fetchSpellSources } from '@/modules/metadata-tables/infrastructure/api-clients/spellSourceClient';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/services/api/jsonClient', () => ({
  postJson: vi.fn(),
}));

describe('spellSourceClient', () => {
  it('fetches endpoint source and preserves inline source', async () => {
    vi.mocked(postJson).mockResolvedValueOnce([
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

    expect(postJson).toHaveBeenCalledWith('/api/spells', { locale: 'en' });
    expect(result.map((spell) => spell.slug).sort()).toEqual([
      'inline-spell',
      'remote-spell',
    ]);
  });
});
