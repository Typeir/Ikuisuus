/**
 * @fileoverview CharacterSheetHeader Tests
 * @description Smoke tests for the sticky character-sheet header — name/edit
 * toggle, edit/save/cancel buttons.
 *
 * @module tests/unit/lib/components/characterSheet/characterSheetHeader
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CharacterSheetHeader } from '@/lib/components/characterSheet/header/characterSheetHeader';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { cleanup, screen } from '@testing-library/react';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify([]), { status: 200 })),
  ),
);

describe('CharacterSheetHeader', () => {
  it('renders the character name in view mode', () => {
    renderWithActiveSheet(
      <CharacterSheetHeader
        data={{ ...createEmptyCharacter(), name: 'Aria Dawnweaver' }}
        editing={false}
        onEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onChange={() => {}}
      />,
      { character: { name: 'Aria Dawnweaver' } },
    );
    expect(
      screen.getByRole('heading', { name: /Aria Dawnweaver/i }),
    ).toBeTruthy();
  });

  it('renders edit/save/cancel actions appropriately', () => {
    renderWithActiveSheet(
      <CharacterSheetHeader
        data={createEmptyCharacter()}
        editing={false}
        onEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'ariaEditCharacter' }),
    ).toBeTruthy();

    cleanup();

    renderWithActiveSheet(
      <CharacterSheetHeader
        data={createEmptyCharacter()}
        editing
        onEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onChange={() => {}}
      />,
      { editing: true },
    );
    expect(screen.getByRole('button', { name: 'save' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'cancel' })).toBeTruthy();
  });
});
