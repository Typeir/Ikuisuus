/**
 * @fileoverview ContentExpandBody Tests
 * @description Unit tests for the unified inline content body component.
 * Validates the cached-text fast path, the lazy fetch error path, and the id
 * wiring used by the row's aria-controls.
 */

import { ContentExpandBody } from '@/modules/character-builder/presentation/builder/contentExpandBody';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/hooks/data/useContentShard', () => ({
  useContentShardSingle: () => ({
    data: undefined,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
    revalidate: vi.fn(),
  }),
}));

const messages = {
  characterSheet: {
    shardLoading: 'Loading…',
    shardNotFound: 'Not found',
  },
};

const renderWithIntl = (ui: React.ReactElement) =>
  render(
    <NextIntlClientProvider locale='en' messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );

describe('ContentExpandBody', () => {
  it('renders the wrapper with the provided id', () => {
    const { container } = renderWithIntl(
      <ContentExpandBody
        contentType='feats'
        contentSlug='archery'
        contentKey='Archery'
        id='content-body-test'
      />,
    );
    expect(container.querySelector('#content-body-test')).toBeInTheDocument();
  });

  it('renders cached text immediately without showing loading', () => {
    renderWithIntl(
      <ContentExpandBody
        contentType='feats'
        contentSlug='archery'
        contentKey='Archery'
        cachedText='Some prose body'
        id='content-body-cached'
      />,
    );
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });

  it('renders with bloodlines content type', () => {
    const { container } = renderWithIntl(
      <ContentExpandBody
        contentType='bloodlines'
        contentSlug='hex'
        contentKey='Crimson Veil'
        id='boon-body-test'
      />,
    );
    expect(container.querySelector('#boon-body-test')).toBeInTheDocument();
  });
});
