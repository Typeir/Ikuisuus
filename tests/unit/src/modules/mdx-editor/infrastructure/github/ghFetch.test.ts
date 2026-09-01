/**
 * @fileoverview Unit tests for ghFetch GitHub API wrapper.
 * @module tests/unit/src/modules/mdx-editor/infrastructure/github/ghFetch.test
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { ghFetch } from '@/modules/mdx-editor/infrastructure/github/ghFetch';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('ghFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds GitHub authentication and default headers', async () => {
    vi.stubEnv('GITHUB_PAT', 'token-123');
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    await ghFetch('repos/acme/library/pulls');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/library/pulls',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });
});
