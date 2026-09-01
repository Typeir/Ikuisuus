/**
 * @fileoverview Aspect Vocabulary Client Tests
 * @module tests/unit/src/modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { fetchAspectVocabulary } from '@/modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient';
import { fetcher } from '@/lib/fetch/fetcher';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: vi.fn(),
}));

const mockedFetcher = vi.mocked(fetcher);

afterEach(() => mockedFetcher.mockReset());

describe('fetchAspectVocabulary', () => {
  it('should return groups on success', async () => {
    mockedFetcher.mockResolvedValue({
      groups: [{ group: 'a', values: ['b'], scope: '*' }],
    });
    expect(await fetchAspectVocabulary()).toEqual([
      { group: 'a', values: ['b'], scope: '*' },
    ]);
  });

  it('should return null on HTTP failure or malformed body', async () => {
    mockedFetcher.mockRejectedValue(new Error('down'));
    expect(await fetchAspectVocabulary()).toBeNull();
    mockedFetcher.mockResolvedValue({});
    expect(await fetchAspectVocabulary()).toBeNull();
  });

  it('should return null when fetcher throws', async () => {
    mockedFetcher.mockRejectedValue(new Error('down'));
    expect(await fetchAspectVocabulary()).toBeNull();
  });
});
