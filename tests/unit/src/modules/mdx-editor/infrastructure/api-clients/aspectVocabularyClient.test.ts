/**
 * @fileoverview Aspect Vocabulary Client Tests
 * @module tests/unit/src/modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { fetchAspectVocabulary } from '@/modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.restoreAllMocks());

describe('fetchAspectVocabulary', () => {
  it('should return groups on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ groups: [{ group: 'a', values: ['b'], scope: '*' }] }),
      }),
    );
    expect(await fetchAspectVocabulary()).toEqual([
      { group: 'a', values: ['b'], scope: '*' },
    ]);
  });

  it('should return null on HTTP failure or malformed body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchAspectVocabulary()).toBeNull();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
    expect(await fetchAspectVocabulary()).toBeNull();
  });

  it('should return null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect(await fetchAspectVocabulary()).toBeNull();
  });
});
