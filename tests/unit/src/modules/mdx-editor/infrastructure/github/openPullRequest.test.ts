/**
 * @fileoverview Unit tests for openPullRequest helper.
 * @module tests/unit/src/modules/mdx-editor/infrastructure/github/openPullRequest.test
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import * as ghFetchModule from '@/modules/mdx-editor/infrastructure/github/ghFetch';
import { openPullRequest } from '@/modules/mdx-editor/infrastructure/github/openPullRequest';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('openPullRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns html_url from GitHub response payload', async () => {
    vi.spyOn(ghFetchModule, 'ghFetch').mockResolvedValue(
      new Response(JSON.stringify({ html_url: 'https://github.com/pr/1' }), {
        status: 201,
      }),
    );

    const prUrl = await openPullRequest(
      'owner',
      'repo',
      'branch',
      'title',
      'body',
    );

    expect(prUrl).toBe('https://github.com/pr/1');
  });
});
