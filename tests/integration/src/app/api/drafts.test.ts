/**
 * Drafts API + Revalidation Integration Tests
 *
 * @fileoverview Integration tests for the draft CRUD API and the
 * revalidation endpoint's draft archival behavior. Uses mocked
 * database layer to test the full request→service→response flow.
 *
 * @module tests/integration/src/app/api/drafts
 */

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUpsert = vi.fn();
const mockFindActive = vi.fn();
const mockArchive = vi.fn();
const mockSyncMetadata = vi.fn();

vi.mock('@/lib/db/content/repositories/draftRepository', () => ({
  draftRepository: {
    upsert: (...args: unknown[]) => mockUpsert(...args),
    findActive: (...args: unknown[]) => mockFindActive(...args),
    archive: (...args: unknown[]) => mockArchive(...args),
  },
}));

vi.mock('@/lib/metadata/syncService', () => ({
  syncMetadata: (...args: unknown[]) => mockSyncMetadata(...args),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      message: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

/** @property {object} sampleDraft - Draft fixture for API assertions */
const sampleDraft = {
  id: 1,
  locale: 'en',
  slug: 'monsters/albedo',
  content: '# Albedo\n\nNew draft content.',
  status: 'active',
  createdAt: '2026-03-12T00:00:00.000Z',
  updatedAt: '2026-03-12T01:00:00.000Z',
  versionHash: null,
};

/**
 * Drafts exist only on the pg backend, so these tests declare it. On `fs` the
 * route short-circuits before reaching the repository — correct in production,
 * and it would make every assertion below vacuous here.
 */
beforeEach(() => {
  process.env.REVALIDATION_SECRET = 'test-secret-123';
  process.env.METADATA_BACKEND = 'pg';
});

afterEach(() => {
  vi.restoreAllMocks();
  mockUpsert.mockReset();
  mockFindActive.mockReset();
  mockArchive.mockReset();
  mockSyncMetadata.mockReset();
  delete process.env.METADATA_BACKEND;
});

describe('Drafts API (POST /api/drafts)', () => {
  it('should reject requests without auth secret', async () => {
    const { POST } = await import('@/app/api/drafts/route');

    const req = new NextRequest('http://localhost:3000/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'monsters/albedo',
        content: '# Test',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should reject requests with wrong secret', async () => {
    const { POST } = await import('@/app/api/drafts/route');

    const req = new NextRequest('http://localhost:3000/api/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': 'wrong-secret',
      },
      body: JSON.stringify({
        slug: 'monsters/albedo',
        content: '# Test',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should create a draft with valid input', async () => {
    mockUpsert.mockResolvedValue(sampleDraft);
    const { POST } = await import('@/app/api/drafts/route');

    const req = new NextRequest('http://localhost:3000/api/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': 'test-secret-123',
      },
      body: JSON.stringify({
        slug: 'monsters/albedo',
        content: '# Albedo\n\nNew draft content.',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.draft.slug).toBe('monsters/albedo');
    expect(data.draft.status).toBe('active');
  });

  it('should reject requests missing slug', async () => {
    const { POST } = await import('@/app/api/drafts/route');

    const req = new NextRequest('http://localhost:3000/api/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': 'test-secret-123',
      },
      body: JSON.stringify({ content: '# Test' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should reject requests missing content', async () => {
    const { POST } = await import('@/app/api/drafts/route');

    const req = new NextRequest('http://localhost:3000/api/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': 'test-secret-123',
      },
      body: JSON.stringify({ slug: 'test' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 503 when REVALIDATION_SECRET is not configured', async () => {
    delete process.env.REVALIDATION_SECRET;
    vi.resetModules();
    const { POST } = await import('@/app/api/drafts/route');

    const req = new NextRequest('http://localhost:3000/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'test', content: 'hi' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });
});

describe('Drafts API (GET /api/drafts)', () => {
  it('should return a draft without requiring auth', async () => {
    mockFindActive.mockResolvedValue(sampleDraft);
    const { GET } = await import('@/app/api/drafts/route');

    const req = new NextRequest(
      'http://localhost:3000/api/drafts?locale=en&slug=monsters/albedo',
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.draft.slug).toBe('monsters/albedo');
  });

  it('should return 200 with null draft when no active draft exists', async () => {
    mockFindActive.mockResolvedValue(null);
    const { GET } = await import('@/app/api/drafts/route');

    const req = new NextRequest(
      'http://localhost:3000/api/drafts?locale=en&slug=nonexistent',
    );

    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.draft).toBeNull();
  });

  it('should return 400 when slug is missing', async () => {
    const { GET } = await import('@/app/api/drafts/route');

    const req = new NextRequest('http://localhost:3000/api/drafts?locale=en');

    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should default locale to en when not specified', async () => {
    mockFindActive.mockResolvedValue(sampleDraft);
    const { GET } = await import('@/app/api/drafts/route');

    const req = new NextRequest(
      'http://localhost:3000/api/drafts?slug=monsters/albedo',
    );

    await GET(req);

    expect(mockFindActive).toHaveBeenCalledWith('en', 'monsters/albedo');
  });
});

describe('Revalidation + Draft Archival', () => {
  it('should archive drafts after successful revalidation', async () => {
    mockArchive.mockResolvedValue(true);
    mockSyncMetadata.mockResolvedValue({});

    vi.mock('next/cache', () => ({
      revalidatePath: vi.fn(),
      revalidateTag: vi.fn(),
    }));

    vi.resetModules();
    const { POST } = await import('@/app/api/revalidate/route');

    const req = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': 'test-secret-123',
      },
      body: JSON.stringify({
        paths: ['/en/library/monsters/albedo'],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.results[0].status).toBe('ok');
    expect(mockSyncMetadata).toHaveBeenCalledWith({
      locale: 'en',
      contentTypes: ['monsters'],
    });
  });

  it('should not fail revalidation when draft archival fails', async () => {
    mockArchive.mockRejectedValue(new Error('DB timeout'));

    vi.mock('next/cache', () => ({
      revalidatePath: vi.fn(),
      revalidateTag: vi.fn(),
    }));

    vi.resetModules();
    const { POST } = await import('@/app/api/revalidate/route');

    const req = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': 'test-secret-123',
      },
      body: JSON.stringify({
        paths: ['/en/library/monsters/albedo'],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
