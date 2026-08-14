/**
 * @fileoverview Raw Content API Route Unit Tests
 * @description Tests for POST /api/raw-content. Covers validation, type→dir
 * mapping, frontmatter stripping, 404 handling, and error handling.
 *
 * @module tests/unit/app/api/raw-content/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import * as RawContentRoute from '@/app/api/raw-content/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockExistsSync, mockReadFile } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFile: vi.fn(),
}));

/**
 * Mocks both the bare and `node:`-prefixed `fs`/`fs/promises` specifiers.
 */
vi.mock('fs', () => {
  const api = { existsSync: mockExistsSync };
  return { ...api, default: api };
});

vi.mock('node:fs', () => {
  const api = { existsSync: mockExistsSync };
  return { ...api, default: api };
});

vi.mock('fs/promises', () => {
  const api = { readFile: mockReadFile };
  return { ...api, default: api };
});

vi.mock('node:fs/promises', () => {
  const api = { readFile: mockReadFile };
  return { ...api, default: api };
});

/**
 * Builds a POST request carrying the given JSON body.
 *
 * @function makeRequest
 * @param {unknown} body - Body to serialize
 * @returns {Request} Request for the route handler
 */
const makeRequest = (body: unknown): Request =>
  new Request('http://localhost/api/raw-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  mockExistsSync.mockReset();
  mockReadFile.mockReset();
});

describe('POST /api/raw-content', () => {
  it('returns 400 when type is missing', async () => {
    const res = await RawContentRoute.POST(makeRequest({ slug: 'fireball' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/required/i);
  });

  it('returns 400 when slug is missing', async () => {
    const res = await RawContentRoute.POST(makeRequest({ type: 'spells' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for an unknown type', async () => {
    const res = await RawContentRoute.POST(
      makeRequest({ type: 'nonsense', slug: 'x' }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/unknown type/i);
  });

  it('returns 404 when the file does not exist', async () => {
    mockExistsSync.mockReturnValue(false);
    const res = await RawContentRoute.POST(
      makeRequest({ type: 'spells', slug: 'missing' }),
    );
    expect(res.status).toBe(404);
  });

  it('returns the file content with frontmatter stripped', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      '---\ntitle: Fireball\n---\n\n# Fireball\n\nA bright streak.',
    );

    const res = await RawContentRoute.POST(
      makeRequest({ type: 'spells', slug: 'fireball' }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { content: string };
    expect(body.content).toBe('# Fireball\n\nA bright streak.');
    expect(body.content).not.toContain('title: Fireball');
  });

  it('returns content unchanged when there is no frontmatter', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue('# Tough\n\nExtra hit points.');

    const res = await RawContentRoute.POST(
      makeRequest({ type: 'feats', slug: 'tough' }),
    );

    const body = (await res.json()) as { content: string };
    expect(body.content).toBe('# Tough\n\nExtra hit points.');
  });

  it('maps each known type to its content directory', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue('body');

    const cases: [string, string][] = [
      ['spells', 'spells'],
      ['heirlooms', ['items', 'heirlooms'].join('/')],
      ['trinkets', ['items', 'trinkets'].join('/')],
      ['feats', ['character-creation', 'feats'].join('/')],
    ];

    for (const [type, expectedDir] of cases) {
      mockExistsSync.mockClear();
      await RawContentRoute.POST(makeRequest({ type, slug: 'thing' }));
      const attemptedPath = String(mockExistsSync.mock.calls[0][0]).replace(
        /\\/g,
        '/',
      );
      expect(attemptedPath).toContain(expectedDir);
      expect(attemptedPath).toContain('thing.mdx');
    }
  });

  it('defaults the locale to en and honours an explicit locale', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue('body');

    await RawContentRoute.POST(makeRequest({ type: 'spells', slug: 'a' }));
    expect(String(mockExistsSync.mock.calls[0][0]).replace(/\\/g, '/')).toContain(
      'content/en/',
    );

    mockExistsSync.mockClear();
    await RawContentRoute.POST(
      makeRequest({ type: 'spells', slug: 'a', locale: 'fi' }),
    );
    expect(String(mockExistsSync.mock.calls[0][0]).replace(/\\/g, '/')).toContain(
      'content/fi/',
    );
  });

  it('returns 500 when the body is not valid JSON', async () => {
    const res = await RawContentRoute.POST(
      new Request('http://localhost/api/raw-content', {
        method: 'POST',
        body: 'not json',
      }),
    );
    expect(res.status).toBe(500);
  });

  it('returns 500 when reading the file fails', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockRejectedValue(new Error('EACCES'));

    const res = await RawContentRoute.POST(
      makeRequest({ type: 'spells', slug: 'fireball' }),
    );

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/failed to read/i);
  });
});
