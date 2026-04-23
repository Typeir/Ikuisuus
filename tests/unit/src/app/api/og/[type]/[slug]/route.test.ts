/**
 * @fileoverview Unit tests for the OG image API route.
 *
 * Mocks the data layer and renderer so the test runs without a real filesystem
 * or network. Validates 400 / 404 / 500 / 200 response paths.
 *
 * @module tests/unit/src/app/api/og/route.test
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/seo/og/data', () => ({
  getSupportedOgTypes: vi.fn(() => ['monsters', 'heirlooms']),
  getOgCardData: vi.fn(),
  resolveOgImagePath: vi.fn(() => ''),
  resolveOgBackgroundImagePath: vi.fn(() => undefined),
}));

vi.mock('@/lib/seo/og/renderer', () => ({
  renderOgCard: vi.fn().mockResolvedValue(new Uint8Array([137, 80, 78, 71])),
}));

vi.mock('@/lib/seo/resolveMetadataBase', () => ({
  resolveMetadataBase: vi.fn(() => new URL('https://ikuisuus.vercel.app')),
}));

import { GET } from '@/app/api/og/[type]/[slug]/route';
import { getOgCardData } from '@/lib/seo/og/data';
import { renderOgCard } from '@/lib/seo/og/renderer';

const mockGetOgCardData = vi.mocked(getOgCardData);
const mockRenderOgCard = vi.mocked(renderOgCard);

/**
 * Builds a mock Next.js route context with resolved params.
 *
 * @param {string} type - Content type param
 * @param {string} slug - Slug param
 * @returns {{ params: Promise<{type: string; slug: string}> }} Mock context
 */
function makeCtx(type: string, slug: string) {
  return { params: Promise.resolve({ type, slug }) };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/og/[type]/[slug]', () => {
  it('returns 400 for unsupported content type', async () => {
    const res = await GET(new Request('http://localhost'), makeCtx('unknown', 'foo'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when slug has no metadata', async () => {
    mockGetOgCardData.mockReturnValue(null);
    const res = await GET(new Request('http://localhost'), makeCtx('monsters', 'ghost'));
    expect(res.status).toBe(404);
  });

  it('returns 200 PNG for valid type + slug', async () => {
    mockGetOgCardData.mockReturnValue({
      slug: 'abominable-avian',
      title: 'Abominable Avian',
      creatureType: 'beast',
    });

    const res = await GET(
      new Request('http://localhost'),
      makeCtx('monsters', 'abominable-avian'),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Cache-Control')).toContain('immutable');
  });

  it('returns 500 when renderer throws', async () => {
    mockGetOgCardData.mockReturnValue({
      slug: 'abominable-avian',
      title: 'Abominable Avian',
    });
    mockRenderOgCard.mockRejectedValue(new Error('satori crash'));

    const res = await GET(
      new Request('http://localhost'),
      makeCtx('monsters', 'abominable-avian'),
    );

    expect(res.status).toBe(500);
  });
});
