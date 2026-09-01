/**
 * @fileoverview FeatsTab Tests
 * @description Smoke tests for the feats tab, plus the focused-shard state that
 * belongs to this tab rather than to the character.
 *
 * @module tests/unit/src/modules/character-builder/presentation/tabs/featsTab.test
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { useSheetData } from '@/modules/character-builder/application/context/activeSheetContext';
import { FeatsTab } from '@/modules/character-builder/presentation/tabs/featsTab';
import { screen } from '@testing-library/react';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify([]), { status: 200 }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FeatsTab', () => {
  it('renders the empty state when no feats are selected and not editing', () => {
    renderWithActiveSheet(<FeatsTab />);
    expect(screen.getByText('shardPreviewFallback')).toBeTruthy();
  });

  it('renders the picker when in edit mode', async () => {
    renderWithActiveSheet(<FeatsTab />, { editing: true });
    expect(
      await screen.findByRole('list', { name: 'featAvailableAria' }),
    ).toBeTruthy();
  });

  it('keeps the focused shard off the character entity', () => {
    const seen: { keys: string[] } = { keys: [] };

    /**
     * Probe recording the keys present on the character entity.
     *
     * @component
     * @returns {null} Renders nothing
     */
    const Probe: React.FC = () => {
      seen.keys = Object.keys(useSheetData());
      return null;
    };

    renderWithActiveSheet(
      <>
        <FeatsTab />
        <Probe />
      </>,
    );

    expect(seen.keys).not.toContain('focusedShardType');
    expect(seen.keys).not.toContain('focusedShardSlug');
  });
});
