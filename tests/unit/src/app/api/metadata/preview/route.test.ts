/**
 * @fileoverview Metadata Preview API Route Unit Tests
 * @description Validation and dispatch tests for POST /api/metadata/preview.
 *
 * @module tests/unit/src/app/api/metadata/preview/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@scripts/metadata/sharedData', () => ({
  loadSharedData: vi.fn().mockResolvedValue({}),
}));

vi.mock('@scripts/metadata/sourceParser', () => ({
  parseMetadataFromSource: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let RouteModule: typeof import('@/app/api/metadata/preview/route');
let parseMetadataFromSource: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  RouteModule = await import('@/app/api/metadata/preview/route');
  const parserMod = await import('@scripts/metadata/sourceParser');
  parseMetadataFromSource = vi.mocked(
    parserMod.parseMetadataFromSource,
  ) as unknown as ReturnType<typeof vi.fn>;
  parseMetadataFromSource.mockReset();
});

/**
 * Builds a POST request with a JSON body.
 *
 * @param {unknown} body - Request body
 * @returns {Request} Fetch-compatible request
 */
function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/metadata/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/metadata/preview route', () => {
  it('should export POST handler', () => {
    expect(typeof RouteModule.POST).toBe('function');
  });

  it('should return 400 on invalid JSON', async () => {
    const req = new Request('http://localhost/api/metadata/preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });
    const resp = await RouteModule.POST(req as never);
    expect(resp.status).toBe(400);
  });

  it.each([
    ['outside src/content', { path: 'src/lib/a.mdx', content: '# x' }],
    ['traversal', { path: 'src/content/../secret.mdx', content: '# x' }],
    ['non-mdx', { path: 'src/content/en/a.txt', content: '# x' }],
    ['non-string path', { path: 42, content: '# x' }],
  ])('should return 400 for %s', async (_label, body) => {
    const resp = await RouteModule.POST(makeRequest(body) as never);
    expect(resp.status).toBe(400);
  });

  it.each([
    ['missing path', { content: '# x' }],
    ['empty path', { path: '', content: '# x' }],
  ])('should dispatch with an empty path for %s', async (_label, body) => {
    parseMetadataFromSource.mockReturnValue({ kind: 'generic', records: [] });

    const resp = await RouteModule.POST(makeRequest(body) as never);

    expect(resp.status).toBe(200);
    expect(parseMetadataFromSource).toHaveBeenCalledWith(
      '# x',
      '',
      expect.anything(),
    );
  });

  it('should return 400 for empty content', async () => {
    const resp = await RouteModule.POST(
      makeRequest({ path: 'src/content/en/spells/a.mdx', content: '' }) as never,
    );
    expect(resp.status).toBe(400);
  });

  it('should return 413 for oversized content', async () => {
    const resp = await RouteModule.POST(
      makeRequest({
        path: 'src/content/en/spells/a.mdx',
        content: 'x'.repeat(2 * 1024 * 1024 + 1),
      }) as never,
    );
    expect(resp.status).toBe(413);
  });

  it('should return parsed records on success', async () => {
    parseMetadataFromSource.mockReturnValue({
      kind: 'spell',
      records: [{ slug: 'a', tags: ['damage:fire'] }],
    });

    const resp = await RouteModule.POST(
      makeRequest({
        path: 'src/content/en/spells/a.mdx',
        content: '# A',
      }) as never,
    );

    expect(resp.status).toBe(200);
    const payload = await resp.json();
    expect(payload.ok).toBe(true);
    expect(payload.kind).toBe('spell');
    expect(payload.records).toHaveLength(1);
    expect(parseMetadataFromSource).toHaveBeenCalledWith(
      '# A',
      'src/content/en/spells/a.mdx',
      expect.anything(),
    );
  });

  it('should normalize backslash paths before dispatch', async () => {
    parseMetadataFromSource.mockReturnValue({ kind: 'spell', records: [] });

    const resp = await RouteModule.POST(
      makeRequest({
        path: 'src\\content\\en\\spells\\a.mdx',
        content: '# A',
      }) as never,
    );

    expect(resp.status).toBe(200);
    expect(parseMetadataFromSource).toHaveBeenCalledWith(
      '# A',
      'src/content/en/spells/a.mdx',
      expect.anything(),
    );
  });

  it('should return 500 when the parser throws', async () => {
    parseMetadataFromSource.mockImplementation(() => {
      throw new Error('boom');
    });

    const resp = await RouteModule.POST(
      makeRequest({
        path: 'src/content/en/spells/a.mdx',
        content: '# A',
      }) as never,
    );

    expect(resp.status).toBe(500);
  });
});
