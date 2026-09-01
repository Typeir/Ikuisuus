/**
 * @fileoverview Unit Tests — MetadataPane
 * @description Record rendering, refresh behaviour, and failure states.
 *
 * @module tests/unit/src/modules/mdx-editor/presentation/MetadataPane/MetadataPane.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

vi.mock(
  '@/modules/mdx-editor/infrastructure/api-clients/metadataPreviewClient',
  () => ({
    fetchMetadataPreview: vi.fn(),
  }),
);

vi.mock(
  '@/modules/mdx-editor/presentation/MetadataPane/MetadataPane.module.scss',
  () => ({ default: {} }),
);

import { fetchMetadataPreview } from '@/modules/mdx-editor/infrastructure/api-clients/metadataPreviewClient';
import { MetadataPane } from '@/modules/mdx-editor/presentation/MetadataPane/MetadataPane';

const fetchMock = vi.mocked(fetchMetadataPreview);

beforeEach(() => {
  fetchMock.mockReset();
});

afterEach(() => cleanup());

describe('MetadataPane', () => {
  it('fetches on mount and renders records with tags', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      kind: 'spell',
      records: [{ slug: 'a', title: 'Test Bolt', tags: ['damage:fire'] }],
    });

    render(
      <MetadataPane
        path='src/content/en/spells/a.mdx'
        content='# Test Bolt'
        refreshToken={0}
      />,
    );

    expect(await screen.findByText('Test Bolt')).toBeDefined();
    expect(screen.getByText('damage:fire')).toBeDefined();
    expect(screen.getByText('kind: spell')).toBeDefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'src/content/en/spells/a.mdx',
      '# Test Bolt',
    );
  });

  it('refetches when the refresh token bumps, not when content changes', async () => {
    fetchMock.mockResolvedValue({ ok: true, kind: 'spell', records: [] });

    const { rerender } = render(
      <MetadataPane
        path='src/content/en/spells/a.mdx'
        content='# A'
        refreshToken={0}
      />,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    rerender(
      <MetadataPane
        path='src/content/en/spells/a.mdx'
        content='# A typed more'
        refreshToken={0}
      />,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender(
      <MetadataPane
        path='src/content/en/spells/a.mdx'
        content='# A typed more'
        refreshToken={1}
      />,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith(
      'src/content/en/spells/a.mdx',
      '# A typed more',
    );
  });

  it('shows an error notice when the request fails', async () => {
    fetchMock.mockResolvedValue(null);

    render(
      <MetadataPane
        path='src/content/en/spells/a.mdx'
        content='# A'
        refreshToken={0}
      />,
    );

    expect(await screen.findByText('Metadata parse failed.')).toBeDefined();
  });

  it('fetches with an empty path so kind can come from frontmatter', async () => {
    fetchMock.mockResolvedValue({ ok: true, kind: 'generic', records: [] });

    render(<MetadataPane path='' content='# A' refreshToken={0} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('', '# A');
  });

  it('does not fetch when the buffer is empty', () => {
    render(<MetadataPane path='' content='' refreshToken={0} />);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keys duplicate record slugs by index without warnings', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      kind: 'monster',
      records: [
        { slug: 'dog', title: 'Dog A', tags: [] },
        { slug: 'dog', title: 'Dog B', tags: [] },
      ],
    });
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MetadataPane
        path='src/content/en/monsters/dog.sheet.mdx'
        content='# Dogs'
        refreshToken={0}
      />,
    );

    expect(await screen.findByText('Dog A')).toBeDefined();
    expect(screen.getByText('Dog B')).toBeDefined();
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('same key')),
    ).toBe(false);
    warn.mockRestore();
  });
});
