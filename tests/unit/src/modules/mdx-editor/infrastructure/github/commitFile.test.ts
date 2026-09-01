/**
 * @fileoverview Unit tests for commitFile helper.
 * @module tests/unit/src/modules/mdx-editor/infrastructure/github/commitFile.test
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { commitFile } from '@/modules/mdx-editor/infrastructure/github/commitFile';
import * as ghFetchModule from '@/modules/mdx-editor/infrastructure/github/ghFetch';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('commitFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws conflict error on 409 response', async () => {
    vi.spyOn(ghFetchModule, 'ghFetch').mockResolvedValue(
      new Response('{}', { status: 409 }),
    );

    await expect(
      commitFile(
        'owner',
        'repo',
        'en/file.mdx',
        'body',
        'sha',
        'branch',
        'msg',
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
