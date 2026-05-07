/**
 * @fileoverview ShardDisplay Unit Tests
 * @description Tests for the ShardDisplay component.
 *
 * @module tests/unit/lib/components/characterSheet/shardDisplay
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { ShardDisplay } from '@/lib/components/characterSheet/shardDisplay';
import type { CharacterShard } from '@/lib/types/character';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/md/renderMarkdownToHtml', () => ({
  renderMarkdownToHtml: (md: string) => Promise.resolve(md),
}));

const SHARD: CharacterShard = {
  id: 'empyrean::Extended Reach',
  sourceFile: 'character-creation/bloodlines/empyrean.bloodline.mdx',
  heading: 'Extended Reach',
  category: 'boon',
  bpCost: 3,
  cachedText: 'Your unarmed reach increases by 5 ft.',
};

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ShardDisplay', () => {
  it('renders the heading', () => {
    render(<ShardDisplay shard={SHARD} />);
    expect(screen.getByText('Extended Reach')).toBeTruthy();
  });

  it('shows BP cost badge for boon shards', () => {
    render(<ShardDisplay shard={SHARD} />);
    expect(screen.getByText('3 bpUnit')).toBeTruthy();
  });

  it('shows category label', () => {
    render(<ShardDisplay shard={SHARD} />);
    expect(screen.getByText('shardCategoryBoon')).toBeTruthy();
  });

  it('starts collapsed by default', () => {
    render(<ShardDisplay shard={SHARD} />);
    expect(screen.queryByText('Your unarmed reach')).toBeNull();
  });

  it('shows cached text without fetching when expanded', async () => {
    render(<ShardDisplay shard={SHARD} defaultExpanded />);
    await waitFor(() => {
      expect(
        screen.getByText('Your unarmed reach increases by 5 ft.'),
      ).toBeTruthy();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches body text on expand when no cached text', async () => {
    const shardNoCached: CharacterShard = { ...SHARD, cachedText: undefined };
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          startLine: 3,
          endLine: 6,
          text: '## Extended Reach\n\nFull body text here.',
        }),
        { status: 200 },
      ),
    );

    render(<ShardDisplay shard={shardNoCached} />);
    await userEvent.click(
      screen.getByRole('button', { name: /Extended Reach/i }),
    );

    await waitFor(() => {
      expect(screen.getByText('Full body text here.')).toBeTruthy();
    });
  });

  it('shows error message on fetch failure', async () => {
    const shardNoCached: CharacterShard = { ...SHARD, cachedText: undefined };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }),
    );

    render(<ShardDisplay shard={shardNoCached} />);
    await userEvent.click(
      screen.getByRole('button', { name: /Extended Reach/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/HTTP 404/i)).toBeTruthy();
    });
  });

  it('toggles closed on second click', async () => {
    render(<ShardDisplay shard={SHARD} defaultExpanded />);
    await waitFor(() => {
      expect(
        screen.getByText('Your unarmed reach increases by 5 ft.'),
      ).toBeTruthy();
    });
    await userEvent.click(
      screen.getByRole('button', { name: /Extended Reach/i }),
    );
    expect(screen.queryByText('Your unarmed reach')).toBeNull();
  });
});
