/**
 * @fileoverview Unit tests for the chrome-less embed content route
 * @module tests/unit/src/app/[locale]/embed/[...slug]/page.test
 * @description Validates the route's exports and that its metadata keeps the
 * embed duplicates out of search indexes.
 *
 * @version 1.0.0
 * @author Typeir
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockBuildMetadata = vi.fn();
const mockStaticParams = vi.fn(async () => [{ slug: ['world'] }]);

vi.mock('@/modules/library/application/use-cases', () => ({
  buildLibraryMetadata: (...args: unknown[]) => mockBuildMetadata(...args),
  generateLibraryStaticParams: () => mockStaticParams(),
}));

vi.mock('@/modules/library/presentation', () => ({
  LibraryContent: () => null,
  mdxComponents: {},
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: { child: () => ({ warning: vi.fn(), error: vi.fn() }) },
}));

import * as PageModule from '@/app/[locale]/embed/[...slug]/page';

describe('embed page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export default Page component', () => {
    expect(typeof PageModule.default).toBe('function');
  });

  it('should export generateStaticParams function', () => {
    expect(typeof PageModule.generateStaticParams).toBe('function');
  });

  it('should export dynamic constant', () => {
    expect(PageModule.dynamic).toBe('force-static');
  });

  it('should mirror the library tree in its static params', async () => {
    await expect(PageModule.generateStaticParams()).resolves.toEqual([
      { slug: ['world'] },
    ]);
  });

  it('should mark embed pages noindex alongside the library metadata', async () => {
    mockBuildMetadata.mockResolvedValue({ title: 'Ordovica' });

    const metadata = await PageModule.generateMetadata({
      params: Promise.resolve({ slug: ['world'], locale: 'en' }),
    });

    expect(metadata).toMatchObject({
      title: 'Ordovica',
      robots: { index: false, follow: false },
    });
  });

  it('should stay noindex when metadata generation fails', async () => {
    mockBuildMetadata.mockRejectedValue(new Error('boom'));

    const metadata = await PageModule.generateMetadata({
      params: Promise.resolve({ slug: ['world'], locale: 'en' }),
    });

    expect(metadata).toMatchObject({
      title: 'Library of Ikuisuus',
      robots: { index: false, follow: false },
    });
  });
});
