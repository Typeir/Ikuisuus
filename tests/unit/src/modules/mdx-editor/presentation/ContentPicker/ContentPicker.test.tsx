/**
 * @fileoverview Unit Tests — ContentPicker
 * @description Icon trigger, search-driven options, pick → editor slug,
 * keyboard navigation, and outside-click close.
 *
 * @module tests/unit/src/modules/mdx-editor/presentation/ContentPicker/ContentPicker.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

const searchState = vi.hoisted(() => ({
  results: [] as Array<{ record: Record<string, unknown>; score: number }>,
  loading: false,
  debouncing: false,
  lastTerm: '',
}));

vi.mock('@/modules/search/application/useSearch', () => ({
  useSearch: (term: string) => {
    searchState.lastTerm = term;
    return {
      results: term.trim() ? searchState.results : [],
      total: searchState.results.length,
      loading: searchState.loading,
      debouncing: searchState.debouncing,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
    };
  },
}));

vi.mock(
  '@/modules/mdx-editor/presentation/ContentPicker/ContentPicker.module.scss',
  () => ({ default: {} }),
);

import {
  ContentPicker,
  editorSlugOf,
} from '@/modules/mdx-editor/presentation/ContentPicker/ContentPicker';
import type { SearchRecord } from '@/modules/search/domain';

const record = (over: Partial<SearchRecord>): SearchRecord =>
  ({
    id: 'monsters:en:mucklord',
    type: 'monsters',
    locale: 'en',
    slug: 'mucklord',
    title: 'Mucklord',
    link: '/en/library/monsters/mucklord',
    tags: [],
    ...over,
  }) as SearchRecord;

beforeEach(() => {
  searchState.results = [
    { record: record({}), score: 1 },
    {
      record: record({
        id: 'spells:en:fireball',
        type: 'spells',
        slug: 'fireball',
        title: 'Fireball',
        link: '/en/library/spells/fireball',
      }),
      score: 0.5,
    },
  ];
  searchState.loading = false;
  searchState.debouncing = false;
});

afterEach(() => cleanup());

describe('editorSlugOf', () => {
  it('should strip locale and library prefix and any hash', () => {
    expect(editorSlugOf(record({}), 'en')).toBe('monsters/mucklord');
    expect(
      editorSlugOf(
        record({ link: '/en/library/monsters/hounds#dire-hound' }),
        'en',
      ),
    ).toBe('monsters/hounds');
    expect(
      editorSlugOf(record({ link: '/es/library/spells/bola-de-fuego' }), 'es'),
    ).toBe('spells/bola-de-fuego');
  });
});

describe('ContentPicker', () => {
  it('should render an icon trigger with the label and no dropdown', () => {
    render(
      <ContentPicker icon={<span data-testid='ic' />} label='Copy from' onPick={vi.fn()} />,
    );

    const trigger = screen.getByRole('button', { name: 'Copy from' });
    expect(trigger.querySelector('[data-testid="ic"]')).not.toBeNull();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('should open, focus the search box, and show a hint until typed', async () => {
    const user = userEvent.setup();
    render(<ContentPicker icon={<span />} label='Copy from' onPick={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Copy from' }));

    const input = screen.getByPlaceholderText('Search the library…');
    await waitFor(() => expect(document.activeElement).toBe(input));
    expect(screen.getByText(/Search the library for a page/)).toBeDefined();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('should list search results with title and editor slug, and pick on click', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<ContentPicker icon={<span />} label='Copy from' onPick={onPick} />);

    await user.click(screen.getByRole('button', { name: 'Copy from' }));
    await user.type(screen.getByPlaceholderText('Search the library…'), 'muck');

    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toContain('Mucklord');
    expect(options[0].textContent).toContain('monsters/mucklord');

    await user.click(options[1]);
    expect(onPick).toHaveBeenCalledWith(
      'spells/fireball',
      expect.objectContaining({ slug: 'fireball' }),
    );
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('should navigate with arrows and pick with Enter', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<ContentPicker icon={<span />} label='Copy from' onPick={onPick} />);

    await user.click(screen.getByRole('button', { name: 'Copy from' }));
    await user.type(screen.getByPlaceholderText('Search the library…'), 'x');
    await screen.findAllByRole('option');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onPick).toHaveBeenCalledWith('spells/fireball', expect.anything());
  });

  it('should show the empty state for a fruitless search and close on Escape', async () => {
    searchState.results = [];
    const user = userEvent.setup();
    render(<ContentPicker icon={<span />} label='Copy from' onPick={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Copy from' }));
    await user.type(screen.getByPlaceholderText('Search the library…'), 'zzz');
    expect(await screen.findByText('No pages match.')).toBeDefined();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('should close on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type='button'>outside</button>
        <ContentPicker icon={<span />} label='Copy from' onPick={vi.fn()} />
      </div>,
    );

    await user.click(screen.getByRole('button', { name: 'Copy from' }));
    expect(screen.getByRole('listbox')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('should disable the trigger', () => {
    render(
      <ContentPicker icon={<span />} label='Copy from' onPick={vi.fn()} disabled />,
    );
    expect(
      (screen.getByRole('button', { name: 'Copy from' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
