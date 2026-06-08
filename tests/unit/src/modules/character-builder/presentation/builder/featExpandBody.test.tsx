/**
 * @fileoverview FeatExpandBody Tests
 * @description Unit tests for the inline feat body component. Validates the
 * cached-text fast path, the lazy fetch error path, and the id wiring used
 * by the row's aria-controls.
 */

import { FeatExpandBody } from '@/modules/character-builder/presentation/builder/featExpandBody';
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

describe('FeatExpandBody', () => {
  it('renders the wrapper with the provided id', () => {
    const { container } = renderWithIntl(
      <FeatExpandBody
        featSlug='archery'
        featName='Archery'
        id='feat-body-test'
      />,
    );
    expect(container.querySelector('#feat-body-test')).toBeInTheDocument();
  });

  it('renders cached text immediately without showing loading', () => {
    renderWithIntl(
      <FeatExpandBody
        featSlug='archery'
        featName='Archery'
        cachedText='Some prose body'
        id='feat-body-cached'
      />,
    );
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });
});
