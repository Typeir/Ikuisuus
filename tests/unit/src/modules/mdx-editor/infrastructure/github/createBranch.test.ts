/**
 * @fileoverview Unit tests for createBranch helper.
 * @module tests/unit/src/modules/mdx-editor/infrastructure/github/createBranch
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { createBranch } from '@/modules/mdx-editor/infrastructure/github/createBranch';
import * as ghFetchModule from '@/modules/mdx-editor/infrastructure/github/ghFetch';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('createBranch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates branch from main reference sha', async () => {
    const ghFetchSpy = vi
      .spyOn(ghFetchModule, 'ghFetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ object: { sha: 'abc123' } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response('{}', { status: 201 }));

    await createBranch('owner', 'repo', 'corrections/slug');

    expect(ghFetchSpy).toHaveBeenNthCalledWith(
      1,
      'repos/owner/repo/git/ref/heads/main',
    );
    expect(ghFetchSpy).toHaveBeenNthCalledWith(
      2,
      'repos/owner/repo/git/refs',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
