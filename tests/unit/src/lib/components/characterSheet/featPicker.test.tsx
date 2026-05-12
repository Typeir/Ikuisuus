/**
 * @fileoverview FeatPicker Unit Tests
 * @description Tests for the FeatPicker component.
 *
 * @module tests/unit/lib/components/characterSheet/featPicker
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { FeatPicker } from '@/lib/components/characterSheet/featPicker';
import type { CharacterShard } from '@/lib/types/character';
import { render as baseRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let swrCache: Map<unknown, unknown>;
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    SWRConfig,
    {
      value: {
        provider: () => swrCache,
        dedupingInterval: 0,
        shouldRetryOnError: false,
      },
    },
    children,
  );

const render = (
  ui: React.ReactElement,
  options?: Parameters<typeof baseRender>[1],
) => baseRender(ui, { ...options, wrapper });

const MOCK_FEATS = [
  {
    slug: 'tough',
    title: 'Tough',
    file: 'src/content/en/character-creation/feats/tough.mdx',
    link: '/library/character-creation/feats/tough',
    hasPrerequisite: false,
    tags: [],
  },
  {
    slug: 'great-weapon-master',
    title: 'Great Weapon Master',
    file: 'src/content/en/character-creation/feats/great-weapon-master.mdx',
    link: '/library/character-creation/feats/great-weapon-master',
    hasPrerequisite: true,
    tags: [],
  },
];

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

beforeEach(() => {
  swrCache = new Map();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FeatPicker', () => {
  it('shows loading state initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(<FeatPicker selectedFeats={[]} onToggle={vi.fn()} />);
    expect(screen.getByText('Loading feats…')).toBeTruthy();
  });

  it('renders feat cards after fetch', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_FEATS), { status: 200 }),
    );
    render(<FeatPicker selectedFeats={[]} onToggle={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Tough')).toBeTruthy();
      expect(screen.getByText('Great Weapon Master')).toBeTruthy();
    });
  });

  it('shows prerequisite badge for feats with prereqs', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_FEATS), { status: 200 }),
    );
    render(<FeatPicker selectedFeats={[]} onToggle={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Prereq')).toBeTruthy();
    });
  });

  it('calls onToggle with new feat when clicked', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_FEATS), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ shards: { main: 'Body' } }), {
          status: 200,
        }),
      );

    const handle = vi.fn();
    render(<FeatPicker selectedFeats={[]} onToggle={handle} />);
    await waitFor(() => screen.getByText('Tough'));

    await userEvent.click(screen.getByText('Tough'));

    await waitFor(() => {
      expect(handle).toHaveBeenCalled();
    });
    const next = handle.mock.calls[0][0] as CharacterShard[];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      sourceFile: 'tough',
      heading: 'Tough',
      category: 'feat',
    });
  });

  it('removes a feat when its already-selected card is clicked', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_FEATS), { status: 200 }),
    );

    const selected: CharacterShard[] = [
      {
        id: 'feat::tough',
        sourceFile: 'tough',
        heading: 'Tough',
        category: 'feat',
      },
    ];
    const handle = vi.fn();
    render(<FeatPicker selectedFeats={selected} onToggle={handle} />);
    await waitFor(() => screen.getByText('Tough'));

    await userEvent.click(screen.getByText('Tough'));
    await waitFor(() => expect(handle).toHaveBeenCalledWith([]));
  });

  it('shows empty state when API returns no feats', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    render(<FeatPicker selectedFeats={[]} onToggle={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('No feats available.')).toBeTruthy();
    });
  });
});
