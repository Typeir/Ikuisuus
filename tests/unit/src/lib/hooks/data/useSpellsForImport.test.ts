/**
 * @fileoverview useSpellsForImport Tests
 * @description Verifies the abilities-import spell hook scopes its POST body to
 * the character's vocation spell lists when `listSources` is provided, and falls
 * back to the full library otherwise.
 *
 * @module tests/unit/src/lib/hooks/data/useSpellsForImport.test
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { useSpellsForImport } from '@/lib/hooks/data/useSpellsForImport';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fetcherMock = vi.fn().mockResolvedValue([]);

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: (...args: unknown[]) => fetcherMock(...args),
}));

/**
 * Parses the request body from the first fetcher call.
 *
 * @returns {Record<string, unknown>} Parsed POST body
 */
function firstCallBody(): Record<string, unknown> {
  const [, opts] = fetcherMock.mock.calls[0] as [string, { body: string }];
  return JSON.parse(opts.body);
}

describe('useSpellsForImport', () => {
  afterEach(() => {
    fetcherMock.mockClear();
  });

  it('scopes the body to listSources when provided', async () => {
    renderHook(() =>
      useSpellsForImport({ locale: 'en', listSources: ['Bard', 'Wizard'] }),
    );
    await waitFor(() => expect(fetcherMock).toHaveBeenCalled());
    expect(firstCallBody()).toEqual({
      locale: 'en',
      listSources: ['Bard', 'Wizard'],
    });
  });

  it('omits listSources for the full library when none are given', async () => {
    renderHook(() => useSpellsForImport({ locale: 'es' }));
    await waitFor(() => expect(fetcherMock).toHaveBeenCalled());
    expect(firstCallBody()).toEqual({ locale: 'es' });
  });

  it('treats an empty listSources array as the full library', async () => {
    renderHook(() => useSpellsForImport({ locale: 'fr', listSources: [] }));
    await waitFor(() => expect(fetcherMock).toHaveBeenCalled());
    expect(firstCallBody()).toEqual({ locale: 'fr' });
  });
});
