/**
 * @fileoverview Tests for deleteFile GitHub operation.
 * @module tests/unit/src/modules/mdx-editor/infrastructure/github/deleteFile.test
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { deleteFile } from '@/modules/mdx-editor/infrastructure/github/deleteFile';
import * as ghFetchModule from '@/modules/mdx-editor/infrastructure/github/ghFetch';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/mdx-editor/infrastructure/github/ghFetch');

describe('deleteFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('calls ghFetch with DELETE method and correct payload', async () => {
    const mockResponse: Partial<Response> = {
      ok: true,
      status: 200,
    };

    vi.spyOn(ghFetchModule, 'ghFetch').mockResolvedValueOnce(
      mockResponse as Response,
    );

    await deleteFile(
      'owner',
      'repo',
      'src/file.ts',
      'abc123',
      'main',
      'Delete file',
    );

    expect(ghFetchModule.ghFetch).toHaveBeenCalledWith(
      'repos/owner/repo/contents/src%2Ffile.ts',
      {
        method: 'DELETE',
        body: JSON.stringify({
          message: 'Delete file',
          sha: 'abc123',
          branch: 'main',
        }),
      },
    );
  });

  it('throws CONFLICT error on 409 response', async () => {
    const mockResponse: Partial<Response> = {
      ok: false,
      status: 409,
    };

    vi.spyOn(ghFetchModule, 'ghFetch').mockResolvedValueOnce(
      mockResponse as Response,
    );

    await expect(
      deleteFile(
        'owner',
        'repo',
        'src/file.ts',
        'abc123',
        'main',
        'Delete file',
      ),
    ).rejects.toThrow('Conflict: file has been modified since you loaded it');
  });

  it('throws error with code CONFLICT on 409 response', async () => {
    const mockResponse: Partial<Response> = {
      ok: false,
      status: 409,
    };

    vi.spyOn(ghFetchModule, 'ghFetch').mockResolvedValueOnce(
      mockResponse as Response,
    );

    try {
      await deleteFile(
        'owner',
        'repo',
        'src/file.ts',
        'abc123',
        'main',
        'Delete file',
      );
    } catch (error: unknown) {
      const err = error as Error & { code?: string };
      expect(err.code).toBe('CONFLICT');
    }
  });

  it('throws error on non-ok response', async () => {
    const mockResponse: Partial<Response> = {
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('Bad request'),
    };

    vi.spyOn(ghFetchModule, 'ghFetch').mockResolvedValueOnce(
      mockResponse as Response,
    );

    await expect(
      deleteFile(
        'owner',
        'repo',
        'src/file.ts',
        'abc123',
        'main',
        'Delete file',
      ),
    ).rejects.toThrow('Failed to delete file');
  });

  it('encodes file path correctly', async () => {
    const mockResponse: Partial<Response> = {
      ok: true,
      status: 200,
    };

    vi.spyOn(ghFetchModule, 'ghFetch').mockResolvedValueOnce(
      mockResponse as Response,
    );

    await deleteFile(
      'owner',
      'repo',
      'src/my file with spaces.ts',
      'abc123',
      'main',
      'Delete file',
    );

    expect(ghFetchModule.ghFetch).toHaveBeenCalledWith(
      expect.stringContaining('my%20file%20with%20spaces'),
      expect.any(Object),
    );
  });
});
