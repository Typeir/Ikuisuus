/**
 * @fileoverview Unit tests for buildLibraryMetadata use-case.
 * @module tests/unit/src/modules/library/application/use-cases/buildLibraryMetadata.test
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { buildPageMetadata, extractDescriptionFromMdx } from '@/lib/seo';
import {
    buildLibraryMetadata,
    extractH1FromMdx,
    slugSegmentToTitle,
} from '@/modules/library/application/use-cases/buildLibraryMetadata';
import { fetchContent } from '@/modules/library/infrastructure/content/fetchContent';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/library/infrastructure/content/fetchContent', () => ({
  fetchContent: vi.fn(),
}));

vi.mock('@/lib/seo', () => ({
  buildPageMetadata: vi.fn((payload) => payload),
  extractDescriptionFromMdx: vi.fn(() => 'Derived description'),
}));

describe('buildLibraryMetadata', () => {
  it('returns not found metadata when content is missing', async () => {
    vi.mocked(fetchContent).mockResolvedValueOnce(null);

    const metadata = await buildLibraryMetadata({
      slug: ['en', 'missing-page'],
      locale: 'en',
    });

    expect(metadata).toEqual({ title: 'Not Found | Library of Ikuisuus' });
  });

  it('builds metadata from frontmatter and body fallback values', async () => {
    vi.mocked(fetchContent).mockResolvedValueOnce({
      content: '# Page Title\n\nBody text.',
      resolvedPath: '/repo/src/content/en/world/page.mdx',
    });

    const metadata = await buildLibraryMetadata({
      slug: ['en', 'world', 'page-title'],
      locale: 'en',
    });

    expect(buildPageMetadata).toHaveBeenCalledOnce();
    expect(extractDescriptionFromMdx).toHaveBeenCalledOnce();
    expect(metadata).toMatchObject({
      title: 'Page Title',
      description: 'Derived description',
      locale: 'en',
      slugPath: 'world/page-title',
    });
  });
});

describe('metadata helpers', () => {
  it('extracts markdown and html h1 headings', () => {
    expect(extractH1FromMdx('# Heading\nBody')).toBe('Heading');
    expect(extractH1FromMdx('<h1>Rendered Heading</h1>')).toBe(
      'Rendered Heading',
    );
  });

  it('converts slug segments to title case', () => {
    expect(slugSegmentToTitle('dreaded-defender')).toBe('Dreaded Defender');
  });
});
