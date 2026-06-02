/**
 * @fileoverview FeatsTab Tests
 * @description Smoke tests for the feats tab.
 *
 * @module tests/unit/lib/components/characterSheet/tabs/featsTab
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import { FeatsTab } from '@/modules/character-builder/presentation/tabs/featsTab';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
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
    renderWithActiveSheet(
      <FeatsTab data={createEmptyCharacter()} onChange={() => {}} />,
    );
    expect(screen.getByText(/select a feat to preview/i)).toBeTruthy();
  });

  it('renders the picker when in edit mode', async () => {
    renderWithActiveSheet(
      <FeatsTab data={createEmptyCharacter()} onChange={() => {}} />,
      { editing: true },
    );
    expect(
      await screen.findByRole('list', { name: /available feats/i }),
    ).toBeTruthy();
  });
});
