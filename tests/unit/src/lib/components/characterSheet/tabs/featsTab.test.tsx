/**
 * @fileoverview FeatsTab Tests
 * @description Smoke tests for the feats tab.
 *
 * @module tests/unit/lib/components/characterSheet/tabs/featsTab
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import { FeatsTab } from '@/lib/components/characterSheet/tabs/featsTab';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
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
    render(
      <FeatsTab
        data={createEmptyCharacter()}
        editing={false}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/no feats selected/i)).toBeTruthy();
  });

  it('renders the picker when in edit mode', () => {
    render(
      <FeatsTab
        data={createEmptyCharacter()}
        editing={true}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/loading feats/i)).toBeTruthy();
  });
});
