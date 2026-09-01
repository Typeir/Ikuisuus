/**
 * @fileoverview BloodlineTab Tests
 * @description Smoke tests for the bloodline tab — empty state and content
 * shard rendering (no iframe).
 *
 * @module tests/unit/src/modules/character-builder/presentation/tabs/bloodlineTab.test
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import { CharacterSheetProvider } from '@/lib/context/CharacterSheetContext';
import type { CharacterSheet } from '@/lib/types/character';
import { ActiveSheetProvider } from '@/modules/character-builder/application/context/activeSheetContext';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { BloodlineTab } from '@/modules/character-builder/presentation/tabs/bloodlineTab';
import {
  act,
  render as baseRender,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/md/renderMarkdownToHtml', () => ({
  renderMarkdownToHtml: (md: string) => Promise.resolve(md),
}));

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

let swrCache: Map<unknown, unknown>;
const makeWrapper =
  (seed: CharacterSheet) =>
  ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ provider: () => swrCache, dedupingInterval: 0 }}>
      <CharacterSheetProvider>
        <ActiveSheetProvider character={seed}>{children}</ActiveSheetProvider>
      </CharacterSheetProvider>
    </SWRConfig>
  );
const render = (ui: React.ReactElement, seed: CharacterSheet) =>
  baseRender(ui, { wrapper: makeWrapper(seed) });

beforeEach(() => {
  swrCache = new Map();
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/content-shards/')) {
      return new Response(
        JSON.stringify({ shards: { main: 'Bloodline lore text.' } }),
        { status: 200 },
      );
    }
    return new Response(JSON.stringify([]), { status: 200 });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

describe('BloodlineTab', () => {
  it('renders empty state when no bloodline is selected', () => {
    const seed = createEmptyCharacter();
    render(<BloodlineTab data={seed} onChange={() => {}} />, seed);
    expect(screen.getByText('selectBloodline')).toBeTruthy();
  });

  it('fetches the bloodline content shard and renders markdown', async () => {
    const data = {
      ...createEmptyCharacter(),
      bloodlineSlug: 'sun-touched',
      bloodlineTitle: 'Sun-Touched',
    };
    await act(async () => {
      render(<BloodlineTab data={data} onChange={() => {}} />, data);
    });

    await waitFor(() =>
      expect(screen.getByText('Bloodline lore text.')).toBeTruthy(),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/content-shards/bloodlines/sun-touched?locale=en',
    );
  });

  it('renders no iframe elements', () => {
    const data = {
      ...createEmptyCharacter(),
      bloodlineSlug: 'sun-touched',
      bloodlineTitle: 'Sun-Touched',
    };
    const { container } = render(
      <BloodlineTab data={data} onChange={() => {}} />,
      data,
    );
    expect(container.querySelectorAll('iframe')).toHaveLength(0);
  });
});
