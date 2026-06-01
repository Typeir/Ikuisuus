/**
 * @fileoverview Unit tests for fetchSource.
 * @module tests/unit/src/modules/library/infrastructure/content/fetchSource
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { fetchSource } from '@/modules/library/infrastructure/content/fetchSource';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('fetchSource', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns content when API responds successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: '# Demo' }),
      }),
    );

    await expect(fetchSource('spells/demo.mdx', 'en')).resolves.toBe('# Demo');
  });

  it('returns empty string on failed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    await expect(fetchSource('spells/demo.mdx', 'en')).resolves.toBe('');
  });
});
