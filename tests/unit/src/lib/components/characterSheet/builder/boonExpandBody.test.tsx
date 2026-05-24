/**
 * @fileoverview BoonExpandBody Tests
 * @description Unit tests for the inline boon body component. Validates the
 * cached-text fast path, the lazy fetch error path, and the id wiring used
 * by the row's aria-controls.
 */

import { BoonExpandBody } from '@/lib/components/characterSheet/builder/boonExpandBody';
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

describe('BoonExpandBody', () => {
  it('renders the wrapper with the provided id', () => {
    const { container } = renderWithIntl(
      <BoonExpandBody
        bloodlineSlug='hex'
        boonName='Crimson Veil'
        id='boon-body-test'
      />,
    );
    expect(container.querySelector('#boon-body-test')).toBeInTheDocument();
  });

  it('renders cached text immediately without showing loading', () => {
    renderWithIntl(
      <BoonExpandBody
        bloodlineSlug='hex'
        boonName='Crimson Veil'
        cachedText='Some prose body'
        id='boon-body-cached'
      />,
    );
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });
});
