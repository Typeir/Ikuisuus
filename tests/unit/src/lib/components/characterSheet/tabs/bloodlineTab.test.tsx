/**
 * @fileoverview BloodlineTab Tests
 * @description Smoke tests for the bloodline tab — empty state and content
 * shard rendering (no iframe).
 *
 * @module tests/unit/lib/components/characterSheet/tabs/bloodlineTab
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import { BloodlineTab } from '@/lib/components/characterSheet/tabs/bloodlineTab';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/md/renderMarkdownToHtml', () => ({
  renderMarkdownToHtml: (md: string) => Promise.resolve(md),
}));

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify({ shards: { main: 'Bloodline lore text.' } }), {
      status: 200,
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

describe('BloodlineTab', () => {
  it('renders empty state when no bloodline is selected', () => {
    render(
      <BloodlineTab
        data={createEmptyCharacter()}
        editing={false}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('selectBloodline')).toBeTruthy();
  });

  it('fetches the bloodline content shard and renders markdown', async () => {
    const data = {
      ...createEmptyCharacter(),
      bloodlineSlug: 'sun-touched',
      bloodlineTitle: 'Sun-Touched',
    };
    render(
      <BloodlineTab
        data={data}
        editing={false}
        onChange={() => {}}
        locale='en'
      />,
    );

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull());

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/content-shards/bloodlines/sun-touched?keys[]=main&locale=en',
    );
    expect(screen.getByText('Bloodline lore text.')).toBeTruthy();
  });

  it('renders no iframe elements', () => {
    const data = {
      ...createEmptyCharacter(),
      bloodlineSlug: 'sun-touched',
      bloodlineTitle: 'Sun-Touched',
    };
    const { container } = render(
      <BloodlineTab data={data} editing={false} onChange={() => {}} />,
    );
    expect(container.querySelectorAll('iframe')).toHaveLength(0);
  });
});
