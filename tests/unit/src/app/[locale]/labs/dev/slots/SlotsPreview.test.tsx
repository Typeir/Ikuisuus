/**
 * @fileoverview Tests for the slot card fixture preview.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/slots/SlotsPreview.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-03
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const compileStatic = vi.fn();
const loadArticleMetadata = vi.fn();
const resolveStreamText = vi.fn();

vi.mock('@/modules/library/infrastructure/compile/compileStatic', () => ({
  compileStatic: (...args: unknown[]) => compileStatic(...args),
}));

vi.mock('@/modules/library/application/use-cases/loadArticleMetadata', () => ({
  loadArticleMetadata: (...args: unknown[]) => loadArticleMetadata(...args),
  aspectIndexOf: () => ({ keys: ['probe'], records: [] }),
}));

vi.mock('@/modules/library/presentation/components/utils', () => ({
  resolveStreamText: (...args: unknown[]) => resolveStreamText(...args),
}));

vi.mock('@/modules/library/presentation/components', () => ({
  default: { Keyword: () => null },
  HashNavigationProvider: () => null,
  SectionTrack: () => null,
}));

vi.mock('@/modules/library/presentation/components/slots', () => ({
  slotComponents: { Heirloom: () => null },
}));

vi.mock('@/modules/library/presentation/components/Keyword/KeywordShardContext', () => ({
  KeywordShardProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/modules/library/presentation/LibraryArticle', () => ({
  LibraryArticle: ({ children }: { children: React.ReactNode }) => (
    <article data-testid='frame'>{children}</article>
  ),
}));

vi.mock('@/modules/library/application/context/ArticleMetadataContext', () => ({
  ArticleMetadataProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { render, screen } from '@testing-library/react';
import React from 'react';
import { FIXTURE, SlotsPreview } from '@/app/[locale]/labs/dev/slots/SlotsPreview';

describe('SlotsPreview', () => {
  beforeEach(() => {
    compileStatic.mockReset().mockResolvedValue({
      content: <p>compiled fixture</p>,
      shards: [],
    });
    loadArticleMetadata.mockReset().mockResolvedValue({ title: 'Alfanjón' });
    resolveStreamText.mockReset().mockResolvedValue('// STREAM //');
  });

  it('compiles the fixture with the slot registry, the rewrite on, and the article aspects', async () => {
    render(await SlotsPreview());
    expect(screen.getByTestId('frame')).toHaveTextContent('compiled fixture');

    expect(FIXTURE.replace(/\\/g, '/')).toMatch(/tests\/fixtures\/slots\/alfanjon\.mdx$/);
    const call = compileStatic.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.source).toContain('<Heirloom');
    expect(call.attributeRewrite).toBe(true);
    expect(call.locale).toBe('en');
    expect(call.aspects).toEqual({ keys: ['probe'], records: [] });
    expect(Object.keys(call.components as object)).toEqual(
      expect.arrayContaining(['Keyword', 'Heirloom']),
    );
    expect(loadArticleMetadata).toHaveBeenCalledWith(
      ['items', 'heirlooms', 'alfanjon-of-the-crescent-moon'],
      'en',
    );
  });
});
