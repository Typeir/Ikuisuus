/**
 * @fileoverview CharacterSheetHeader Tests
 * @description Smoke tests for the sticky character-sheet header — name/edit
 * toggle, edit/save/cancel buttons.
 *
 * @module tests/unit/lib/components/characterSheet/characterSheetHeader
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CharacterSheetHeader } from '@/lib/components/characterSheet/characterSheetHeader';
import { CharacterSheetEditProvider } from '@/lib/context/CharacterSheetEditContext';
import type { CharacterSheet } from '@/lib/types/character';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify([]), { status: 200 })),
  ),
);

interface RenderHeaderOptions {
  data?: CharacterSheet;
  editing?: boolean;
}

const renderHeader = ({
  data = createEmptyCharacter(),
  editing = false,
}: RenderHeaderOptions = {}) => {
  const onChange = vi.fn();
  return render(
    <CharacterSheetEditProvider
      data={data}
      editing={editing}
      onChange={onChange}
      locale='en'>
      <CharacterSheetHeader
        data={data}
        editing={editing}
        onEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onChange={onChange}
      />
    </CharacterSheetEditProvider>,
  );
};

describe('CharacterSheetHeader', () => {
  it('renders the character name in view mode', () => {
    renderHeader({
      data: { ...createEmptyCharacter(), name: 'Aria Dawnweaver' },
    });
    expect(
      screen.getByRole('heading', { name: /Aria Dawnweaver/i }),
    ).toBeTruthy();
  });

  it('renders edit/save/cancel actions appropriately', () => {
    const { rerender } = renderHeader();
    expect(
      screen.getByRole('button', { name: 'ariaEditCharacter' }),
    ).toBeTruthy();

    const data = createEmptyCharacter();
    rerender(
      <CharacterSheetEditProvider
        data={data}
        editing
        onChange={vi.fn()}
        locale='en'>
        <CharacterSheetHeader
          data={data}
          editing
          onEdit={() => {}}
          onSave={() => {}}
          onCancel={() => {}}
          onChange={() => {}}
        />
      </CharacterSheetEditProvider>,
    );
    expect(screen.getByRole('button', { name: 'save' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'cancel' })).toBeTruthy();
  });
});
