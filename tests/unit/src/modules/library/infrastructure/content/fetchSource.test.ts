/**
 * @fileoverview Unit tests for fetchSource.
 * @module tests/unit/src/modules/library/infrastructure/content/fetchSource
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { fetcher } from '@/lib/fetch/fetcher';
import { fetchSource } from '@/modules/library/infrastructure/content/fetchSource';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: vi.fn(),
}));

const mockedFetcher = vi.mocked(fetcher);

describe('fetchSource', () => {
  beforeEach(() => {
    mockedFetcher.mockReset();
  });

  it('returns content when API responds successfully', async () => {
    mockedFetcher.mockResolvedValue({ content: '# Demo' });

    await expect(fetchSource('spells/demo.mdx', 'en')).resolves.toBe('# Demo');
  });

  it('returns empty string on failed response', async () => {
    mockedFetcher.mockRejectedValue(new Error('request failed'));

    await expect(fetchSource('spells/demo.mdx', 'en')).resolves.toBe('');
  });
});
