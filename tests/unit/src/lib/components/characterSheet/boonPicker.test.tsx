/**
 * @fileoverview BoonPicker Unit Tests
 * @description Tests for the BoonPicker component.
 *
 * @module tests/unit/lib/components/characterSheet/boonPicker
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { BoonPicker } from '@/lib/components/characterSheet/boonPicker';
import type { CharacterShard } from '@/lib/types/character';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const MOCK_BLOODLINES = [
  {
    slug: 'empyrean',
    title: 'Empyrean',
    file: 'src/content/en/character-creation/bloodlines/empyrean.bloodline.mdx',
    boonBudget: 10,
    boons: [
      {
        name: 'Extended Reach',
        bpLabel: '3 BP',
        bpValue: 3,
        sortOrder: 0,
        tags: [],
      },
      {
        name: 'Featherfall',
        bpLabel: '2 BP',
        bpValue: 2,
        sortOrder: 1,
        tags: [],
      },
    ],
  },
];

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BoonPicker', () => {
  it('shows loading state initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(
      <BoonPicker
        bloodlineSlug='empyrean'
        selectedBoons={[]}
        boonBudget={10}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('loadingBoons')).toBeTruthy();
  });

  it('renders boon cards after fetch', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_BLOODLINES), { status: 200 }),
    );
    render(
      <BoonPicker
        bloodlineSlug='empyrean'
        selectedBoons={[]}
        boonBudget={10}
        onToggle={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('Extended Reach')).toBeTruthy();
      expect(screen.getByText('Featherfall')).toBeTruthy();
    });
  });

  it('shows BP cost badges', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_BLOODLINES), { status: 200 }),
    );
    render(
      <BoonPicker
        bloodlineSlug='empyrean'
        selectedBoons={[]}
        boonBudget={10}
        onToggle={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('3 bpUnit')).toBeTruthy();
    });
  });

  it('calls onToggle with new shard when a boon is selected', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_BLOODLINES), { status: 200 }),
    );
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          shardType: 'bloodline',
          shards: {
            'Extended Reach': 'Your unarmed strikes gain +5 ft. reach.',
          },
        }),
        { status: 200 },
      ),
    );
    const onToggle = vi.fn();
    render(
      <BoonPicker
        bloodlineSlug='empyrean'
        selectedBoons={[]}
        boonBudget={10}
        onToggle={onToggle}
      />,
    );
    await waitFor(() => screen.getByText('Extended Reach'));
    await userEvent.click(
      screen.getByRole('button', { name: /Extended Reach/i }),
    );
    expect(onToggle).toHaveBeenCalledOnce();
    const newBoons = onToggle.mock.calls[0][0] as CharacterShard[];
    expect(newBoons[0].heading).toBe('Extended Reach');
    expect(newBoons[0].bpCost).toBe(3);
    expect(newBoons[0].cachedText).toBe(
      'Your unarmed strikes gain +5 ft. reach.',
    );
  });

  it('calls onToggle removing shard when a selected boon is clicked', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_BLOODLINES), { status: 200 }),
    );
    const existing: CharacterShard = {
      id: 'empyrean::Extended Reach',
      sourceFile: 'empyrean',
      heading: 'Extended Reach',
      category: 'boon',
      bpCost: 3,
    };
    const onToggle = vi.fn();
    render(
      <BoonPicker
        bloodlineSlug='empyrean'
        selectedBoons={[existing]}
        boonBudget={10}
        onToggle={onToggle}
      />,
    );
    await waitFor(() => screen.getByText('Extended Reach'));
    await userEvent.click(
      screen.getByRole('button', { name: /Extended Reach/i }),
    );
    expect(onToggle).toHaveBeenCalledOnce();
    const newBoons = onToggle.mock.calls[0][0] as CharacterShard[];
    expect(newBoons).toHaveLength(0);
  });

  it('shows budget meter with spent/total', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_BLOODLINES), { status: 200 }),
    );
    const selected: CharacterShard[] = [
      {
        id: '1',
        sourceFile: 'f.mdx',
        heading: 'Extended Reach',
        category: 'boon',
        bpCost: 3,
      },
    ];
    render(
      <BoonPicker
        bloodlineSlug='empyrean'
        selectedBoons={selected}
        boonBudget={10}
        onToggle={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('bpFormat')).toBeTruthy();
    });
  });

  it('shows error message on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    render(
      <BoonPicker
        bloodlineSlug='empyrean'
        selectedBoons={[]}
        boonBudget={10}
        onToggle={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });
});
