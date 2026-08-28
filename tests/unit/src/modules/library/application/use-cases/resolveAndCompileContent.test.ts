/**
 * @fileoverview Unit tests for resolveAndCompileContent use-case.
 * @module tests/unit/src/modules/library/application/use-cases/resolveAndCompileContent
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { resolveAndCompileContent } from '@/modules/library/application/use-cases/resolveAndCompileContent';
import { compileStatic } from '@/modules/library/infrastructure/compile/compileStatic';
import { fetchContent } from '@/modules/library/infrastructure/content/fetchContent';
import { resolveStreamText } from '@/modules/library/presentation/components/utils';
import { isMdFile } from '@/lib/md/isMdFile';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/library/presentation/components/utils', () => ({
  resolveStreamText: vi.fn(),
}));

vi.mock('@/lib/md/isMdFile', () => ({
  isMdFile: vi.fn(),
}));

vi.mock('@/modules/library/infrastructure/compile/compileStatic', () => ({
  compileStatic: vi.fn(),
}));

vi.mock('@/modules/library/infrastructure/content/fetchContent', () => ({
  fetchContent: vi.fn(),
}));

describe('resolveAndCompileContent', () => {
  it('returns not-found when no content exists', async () => {
    vi.mocked(fetchContent)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await resolveAndCompileContent({
      slug: ['en', 'unknown'],
      locale: 'en',
    });

    expect(result).toEqual({ kind: 'not-found' });
  });

  it('returns redirect when slug/main exists', async () => {
    vi.mocked(fetchContent).mockResolvedValueOnce(null).mockResolvedValueOnce({
      content: '# main',
      resolvedPath: '/repo/src/content/en/unknown/main.mdx',
    });

    const result = await resolveAndCompileContent({
      slug: ['en', 'unknown'],
      locale: 'en',
    });

    expect(result).toEqual({
      kind: 'redirect',
      href: '/en/library/unknown/main',
    });
  });

  it('redirects a suffixed leaf to its bare route without fetching', async () => {
    vi.mocked(fetchContent).mockClear();

    const result = await resolveAndCompileContent({
      slug: ['en', 'spells', 'acid-splash.spell'],
      locale: 'en',
    });

    expect(result).toEqual({
      kind: 'redirect',
      href: '/en/library/spells/acid-splash',
    });
    expect(fetchContent).not.toHaveBeenCalled();
  });

  it('keeps the redirect inside the embed tree', async () => {
    vi.mocked(fetchContent).mockClear();

    const result = await resolveAndCompileContent({
      slug: ['en', 'rules', 'combat', 'cover.rule'],
      locale: 'en',
      basePath: 'embed',
    });

    expect(result).toEqual({
      kind: 'redirect',
      href: '/en/embed/rules/combat/cover',
    });
  });

  it('leaves a bare leaf alone when it merely contains a dot', async () => {
    vi.mocked(fetchContent).mockClear();
    vi.mocked(fetchContent)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await resolveAndCompileContent({
      slug: ['en', 'spells', 'acid-splash'],
      locale: 'en',
    });

    expect(result).toEqual({ kind: 'not-found' });
    expect(fetchContent).toHaveBeenCalledWith('en', 'spells/acid-splash');
  });

  it('returns markdown payload for .md files', async () => {
    vi.mocked(fetchContent).mockResolvedValueOnce({
      content: '# Title',
      resolvedPath: '/repo/src/content/en/world/page.md',
    });
    vi.mocked(isMdFile).mockReturnValueOnce(true);

    const result = await resolveAndCompileContent({
      slug: ['en', 'world', 'page'],
      locale: 'en',
    });

    expect(result).toEqual({
      kind: 'md',
      slugPath: 'world/page',
      rawContent: '# Title',
    });
  });

  it('returns compiled mdx payload when compilation succeeds', async () => {
    vi.mocked(fetchContent).mockResolvedValueOnce({
      content: '# Title',
      resolvedPath: '/repo/src/content/en/world/page.mdx',
    });
    vi.mocked(isMdFile).mockReturnValueOnce(false);
    vi.mocked(resolveStreamText).mockResolvedValueOnce('stream');
    vi.mocked(compileStatic).mockResolvedValueOnce({
      content: 'compiled',
    } as never);

    const result = await resolveAndCompileContent({
      slug: ['en', 'world', 'page'],
      locale: 'en',
    });

    expect(result).toEqual({
      kind: 'mdx',
      slugPath: 'world/page',
      rawContent: '# Title',
      streamText: 'stream',
      articleMetadata: null,
      evalResult: { content: 'compiled' },
    });
  });

  it('returns mdx payload with compileError when compilation fails', async () => {
    vi.mocked(fetchContent).mockResolvedValueOnce({
      content: '# Title',
      resolvedPath: '/repo/src/content/en/world/page.mdx',
    });
    vi.mocked(isMdFile).mockReturnValueOnce(false);
    vi.mocked(resolveStreamText).mockResolvedValueOnce('stream');
    vi.mocked(compileStatic).mockRejectedValueOnce(new Error('compile failed'));

    const result = await resolveAndCompileContent({
      slug: ['en', 'world', 'page'],
      locale: 'en',
    });

    expect(result.kind).toBe('mdx');
    if (result.kind === 'mdx') {
      expect(result.compileError).toBeInstanceOf(Error);
      expect((result.compileError as Error).message).toBe('compile failed');
    }
  });
});
