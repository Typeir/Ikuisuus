/**
 * @fileoverview Tests for the SEO metadata builder.
 *
 * @module tests/unit/src/lib/seo/buildPageMetadata.test
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/seo/resolvePageImage', () => ({
  resolvePageImage: vi
    .fn()
    .mockReturnValue('/library/images/heirlooms/dreaded-defender.webp'),
}));

import { buildPageMetadata } from '@/lib/seo/buildPageMetadata';

describe('buildPageMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appends the site suffix to the title', () => {
    const result = buildPageMetadata({
      title: 'Dreaded Defender',
      locale: 'en',
      slugPath: 'items/heirlooms/dreaded-defender',
    });
    expect(result.title).toBe('Dreaded Defender | Library of Ikuisuus');
  });

  it('sets openGraph type to article', () => {
    const result = buildPageMetadata({
      title: 'Dreaded Defender',
      locale: 'en',
      slugPath: 'items/heirlooms/dreaded-defender',
    });
    const og = result.openGraph as Record<string, unknown>;
    expect(og.type).toBe('article');
  });

  it('passes description to both openGraph and twitter', () => {
    const result = buildPageMetadata({
      title: 'Dreaded Defender',
      description: 'A blackened medallion.',
      locale: 'en',
      slugPath: 'items/heirlooms/dreaded-defender',
    });
    const og = result.openGraph as Record<string, unknown>;
    const tw = result.twitter as Record<string, unknown>;
    expect(og.description).toBe('A blackened medallion.');
    expect(tw.description).toBe('A blackened medallion.');
  });

  it('sets twitter card to summary_large_image', () => {
    const result = buildPageMetadata({
      title: 'Test',
      locale: 'en',
      slugPath: 'items/heirlooms/test',
    });
    const tw = result.twitter as Record<string, unknown>;
    expect(tw.card).toBe('summary_large_image');
  });

  it('uses imageAlt from input when provided', () => {
    const result = buildPageMetadata({
      title: 'Test',
      imageAlt: 'Custom alt text',
      locale: 'en',
      slugPath: 'items/heirlooms/test',
    });
    const og = result.openGraph as { images: Array<{ alt: string }> };
    expect(og.images[0].alt).toBe('Custom alt text');
  });

  it('falls back to title when imageAlt is not provided', () => {
    const result = buildPageMetadata({
      title: 'Test Title',
      locale: 'en',
      slugPath: 'items/heirlooms/test',
    });
    const og = result.openGraph as { images: Array<{ alt: string }> };
    expect(og.images[0].alt).toBe('Test Title');
  });

  it('constructs the og:url from locale and slugPath', () => {
    const result = buildPageMetadata({
      title: 'Dreaded Defender',
      locale: 'en',
      slugPath: 'items/heirlooms/dreaded-defender',
    });
    const og = result.openGraph as Record<string, unknown>;
    expect(og.url).toBe('/en/library/items/heirlooms/dreaded-defender');
  });

  it('sets OG image dimensions to 1200x630', () => {
    const result = buildPageMetadata({
      title: 'Test',
      locale: 'en',
      slugPath: 'items/heirlooms/test',
    });
    const og = result.openGraph as {
      images: Array<{ width: number; height: number }>;
    };
    expect(og.images[0].width).toBe(1200);
    expect(og.images[0].height).toBe(630);
  });
});
