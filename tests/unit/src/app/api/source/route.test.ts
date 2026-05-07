/**
 * @fileoverview MDX Source API Route Unit Tests
 * @description Tests for GET /api/source. Validates missing params, successful
 * content return, 404 handling, and locale forwarding.
 *
 * @module tests/unit/app/api/source/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import * as SourceRoute from '@/app/api/source/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchContent } = vi.hoisted(() => ({
  mockFetchContent: vi.fn(),
}));

vi.mock('@/lib/utils/fetchContent', () => ({
  fetchContent: mockFetchContent,
}));

beforeEach(() => {
  mockFetchContent.mockReset();
});

/** Helper: build a mock Request for the source route. */
function makeRequest(params: Record<string, string>): Request {
  const url = new URL('http://localhost/api/source');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString());
}

describe('GET /api/source', () => {
  it('returns 400 when file param is missing', async () => {
    const res = await SourceRoute.GET(makeRequest({}));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/missing/i);
  });

  it('returns 404 when fetchContent resolves null', async () => {
    mockFetchContent.mockResolvedValueOnce(null);
    const res = await SourceRoute.GET(
      makeRequest({ file: 'character-creation/bloodlines/empyrean.bloodline.mdx' }),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/not found/i);
  });

  it('returns 200 with content when file is found', async () => {
    mockFetchContent.mockResolvedValueOnce({
      content: '# Empyrean\n\n## Extended Reach\n\nYour reach increases.',
      resolvedPath: 'character-creation/bloodlines/empyrean.bloodline',
    });
    const res = await SourceRoute.GET(
      makeRequest({ file: 'character-creation/bloodlines/empyrean.bloodline.mdx' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { content: string };
    expect(body.content).toContain('Extended Reach');
  });

  it('strips .mdx extension before calling fetchContent', async () => {
    mockFetchContent.mockResolvedValueOnce({ content: '# Test', resolvedPath: 'test' });
    await SourceRoute.GET(
      makeRequest({ file: 'some/path/file.mdx' }),
    );
    expect(mockFetchContent).toHaveBeenCalledWith('en', 'some/path/file');
  });

  it('forwards locale param to fetchContent', async () => {
    mockFetchContent.mockResolvedValueOnce({ content: '# Test', resolvedPath: 'test' });
    await SourceRoute.GET(
      makeRequest({ file: 'some/path/file.mdx', locale: 'es' }),
    );
    expect(mockFetchContent).toHaveBeenCalledWith('es', 'some/path/file');
  });

  it('defaults locale to en when not provided', async () => {
    mockFetchContent.mockResolvedValueOnce({ content: '# Test', resolvedPath: 'test' });
    await SourceRoute.GET(
      makeRequest({ file: 'some/path/file.mdx' }),
    );
    expect(mockFetchContent).toHaveBeenCalledWith('en', 'some/path/file');
  });
});
