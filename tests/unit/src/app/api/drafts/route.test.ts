/**
 * @fileoverview Unit Tests — drafts API route
 * @description Validates the GET and POST handlers for draft CRUD including
 * authentication, input validation, and error handling.
 *
 * @module tests/unit/src/app/api/drafts/route
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindActive = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/lib/db/content/repositories/draftRepository', () => ({
  draftRepository: {
    findActive: (...args: unknown[]) => mockFindActive(...args),
    upsert: (...args: unknown[]) => mockUpsert(...args),
  },
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      message: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

import { GET, POST } from '@/app/api/drafts/route';
import { NextRequest } from 'next/server';

const SECRET = 'test-revalidation-secret';

/**
 * Creates a GET request for the drafts endpoint.
 *
 * @param {string} locale - Locale query param
 * @param {string} slug - Slug query param
 * @returns {NextRequest} Mock request
 */
function makeGetRequest(locale: string, slug: string): NextRequest {
  return new NextRequest(
    `http://localhost/api/drafts?locale=${locale}&slug=${encodeURIComponent(slug)}`,
  );
}

/**
 * Creates a POST request for the drafts endpoint.
 *
 * @param {unknown} body - Request body
 * @param {Record<string, string>} headers - Request headers
 * @returns {NextRequest} Mock request
 */
function makePostRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest('http://localhost/api/drafts', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('GET /api/drafts', () => {
  beforeEach(() => {
    mockFindActive.mockReset();
  });

  it('returns 400 when slug is missing', async () => {
    const req = new NextRequest('http://localhost/api/drafts?locale=en');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('slug');
  });

  it('returns draft when an active draft exists', async () => {
    const draft = {
      id: 1,
      locale: 'en',
      slug: 'monsters/goblin',
      content: '# Goblin',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockFindActive.mockResolvedValue(draft);

    const res = await GET(makeGetRequest('en', 'monsters/goblin'));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.draft).toEqual(draft);
    expect(mockFindActive).toHaveBeenCalledWith('en', 'monsters/goblin');
  });

  it('returns null draft when no active draft exists', async () => {
    mockFindActive.mockResolvedValue(null);

    const res = await GET(makeGetRequest('en', 'monsters/albedo'));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.draft).toBeNull();
  });

  it('returns 500 when repository throws an error', async () => {
    mockFindActive.mockRejectedValue(new Error('DB connection failed'));

    const res = await GET(makeGetRequest('en', 'spells/fireball'));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Internal server error');
  });
});

describe('POST /api/drafts', () => {
  beforeEach(() => {
    process.env.REVALIDATION_SECRET = SECRET;
    mockUpsert.mockReset();
  });

  afterEach(() => {
    delete process.env.REVALIDATION_SECRET;
  });

  it('returns 503 when REVALIDATION_SECRET is not configured', async () => {
    delete process.env.REVALIDATION_SECRET;

    const res = await POST(
      makePostRequest({ slug: 'monsters/goblin', content: '# Goblin' }),
    );

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toContain('not configured');
  });

  it('returns 401 when secret header is missing', async () => {
    const res = await POST(
      makePostRequest({ slug: 'monsters/goblin', content: '# Goblin' }),
    );

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Invalid secret');
  });

  it('returns 401 when the secret header is wrong', async () => {
    const res = await POST(
      makePostRequest(
        { slug: 'monsters/goblin', content: '# Goblin' },
        { 'x-revalidation-secret': 'wrong-secret' },
      ),
    );

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/drafts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidation-secret': SECRET,
      },
      body: 'invalid-json',
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid JSON body');
  });

  it('returns 400 when slug is missing', async () => {
    const res = await POST(
      makePostRequest(
        { content: '# Test' },
        { 'x-revalidation-secret': SECRET },
      ),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('slug');
  });

  it('returns 400 when content is missing', async () => {
    const res = await POST(
      makePostRequest(
        { slug: 'monsters/goblin' },
        { 'x-revalidation-secret': SECRET },
      ),
    );

    expect(res.status).toBe(400);
  });

  it('returns 200 with the saved draft on success', async () => {
    const savedDraft = {
      id: 42,
      locale: 'en',
      slug: 'monsters/goblin',
      content: '# Goblin',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockUpsert.mockResolvedValue(savedDraft);

    const res = await POST(
      makePostRequest(
        { locale: 'en', slug: 'monsters/goblin', content: '# Goblin' },
        { 'x-revalidation-secret': SECRET },
      ),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.draft).toEqual(savedDraft);
    expect(mockUpsert).toHaveBeenCalledWith({
      locale: 'en',
      slug: 'monsters/goblin',
      content: '# Goblin',
    });
  });

  it('defaults locale to en when not provided in POST body', async () => {
    const savedDraft = {
      id: 1,
      locale: 'en',
      slug: 'test',
      content: '# Test',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockUpsert.mockResolvedValue(savedDraft);

    await POST(
      makePostRequest(
        { slug: 'test', content: '# Test' },
        { 'x-revalidation-secret': SECRET },
      ),
    );

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'en' }),
    );
  });
});
