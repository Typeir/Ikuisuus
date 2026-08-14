/**
 * @fileoverview LibraryContent Tests
 * @description Tests each resolution kind (md, mdx, redirect, not-found) and the
 * `basePath` hand-off. Invokes the async component directly and inspects the returned element.
 *
 * @module tests/unit/src/modules/library/presentation/LibraryContent/LibraryContent
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockResolve = vi.fn();
const mockRedirect = vi.fn((href: string) => {
  throw new Error(`REDIRECT:${href}`);
});
const mockNotFound = vi.fn(() => {
  throw new Error('NOT_FOUND');
});

vi.mock('@/modules/library/application/use-cases', () => ({
  resolveAndCompileContent: (...args: unknown[]) => mockResolve(...args),
}));

vi.mock('next/navigation', () => ({
  redirect: (href: string) => mockRedirect(href),
  notFound: () => mockNotFound(),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: { child: () => ({ warning: vi.fn(), error: vi.fn() }) },
}));

vi.mock('@/modules/library/presentation/components', () => ({
  HashNavigationProvider: () => null,
  SectionTrack: () => null,
}));

vi.mock('@/modules/library/presentation/LibraryArticle', () => ({
  LibraryArticle: () => null,
}));

vi.mock('@/modules/library/presentation/MdRawPage', () => ({
  MdRawPage: () => null,
}));

vi.mock('@/modules/library/application/context/ArticleMetadataContext', () => ({
  ArticleMetadataProvider: () => null,
}));

vi.mock('@/modules/mdx-editor', () => ({
  DraftOverlay: () => null,
  EditPageButton: () => null,
}));

vi.mock('@/lib/components/stream/StreamBootstrap', () => ({
  default: () => null,
}));

vi.mock('@/app/[locale]/utils/clientRendererLazy', () => ({
  default: () => null,
}));

import { LibraryContent } from '@/modules/library/presentation/LibraryContent/LibraryContent';
import { MdRawPage } from '@/modules/library/presentation/MdRawPage';
import { DraftOverlay } from '@/modules/mdx-editor';

describe('LibraryContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to the library tree when no basePath is given', async () => {
    mockResolve.mockResolvedValue({
      kind: 'md',
      slugPath: 'rules/movement',
      rawContent: '# Movement',
    });

    await LibraryContent({ slug: ['rules', 'movement'], locale: 'en' });

    expect(mockResolve).toHaveBeenCalledWith({
      slug: ['rules', 'movement'],
      locale: 'en',
      basePath: 'library',
    });
  });

  it('passes the embed tree through to content resolution', async () => {
    mockResolve.mockResolvedValue({
      kind: 'md',
      slugPath: 'rules/movement',
      rawContent: '# Movement',
    });

    await LibraryContent({
      slug: ['rules', 'movement'],
      locale: 'en',
      basePath: 'embed',
    });

    expect(mockResolve).toHaveBeenCalledWith({
      slug: ['rules', 'movement'],
      locale: 'en',
      basePath: 'embed',
    });
  });

  it('redirects to the href the resolver produced', async () => {
    mockResolve.mockResolvedValue({
      kind: 'redirect',
      href: '/en/embed/world/main',
    });

    await expect(
      LibraryContent({ slug: ['world'], locale: 'en', basePath: 'embed' }),
    ).rejects.toThrow('REDIRECT:/en/embed/world/main');
  });

  it('404s when nothing resolves', async () => {
    mockResolve.mockResolvedValue({ kind: 'not-found' });

    await expect(
      LibraryContent({ slug: ['nope'], locale: 'en' }),
    ).rejects.toThrow('NOT_FOUND');

    expect(mockNotFound).toHaveBeenCalled();
  });

  it('renders raw markdown through MdRawPage', async () => {
    mockResolve.mockResolvedValue({
      kind: 'md',
      slugPath: 'rules/movement',
      rawContent: '# Movement',
    });

    const element = (await LibraryContent({
      slug: ['rules', 'movement'],
      locale: 'en',
    })) as ReactElement;

    expect(element.type).toBe(MdRawPage);
  });

  it('renders compiled MDX inside the draft overlay', async () => {
    mockResolve.mockResolvedValue({
      kind: 'mdx',
      slugPath: 'spells/aid',
      rawContent: '',
      streamText: 'SPELL',
      articleMetadata: null,
      evalResult: { content: null, error: undefined },
    });

    const element = (await LibraryContent({
      slug: ['spells', 'aid'],
      locale: 'en',
    })) as ReactElement;

    expect(element.type).toBe(DraftOverlay);
    expect(element.props).toMatchObject({ locale: 'en', slug: 'spells/aid' });
  });

  it('falls back to the client renderer when compilation failed', async () => {
    mockResolve.mockResolvedValue({
      kind: 'mdx',
      slugPath: 'spells/aid',
      rawContent: '',
      streamText: '',
      articleMetadata: null,
      compileError: new Error('boom'),
    });

    const element = (await LibraryContent({
      slug: ['spells', 'aid'],
      locale: 'en',
    })) as ReactElement;

    expect(element.type).toBe('div');
  });
});
