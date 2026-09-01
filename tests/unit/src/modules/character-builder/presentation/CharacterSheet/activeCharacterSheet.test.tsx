/**
 * @fileoverview ActiveCharacterSheet Unit Tests
 * @description Tests for the ActiveCharacterSheet wrapper component.
 *
 * @module tests/unit/src/modules/character-builder/presentation/CharacterSheet/activeCharacterSheet.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { ActiveCharacterSheet } from '@/modules/character-builder/presentation/CharacterSheet/activeCharacterSheet';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/context/CharacterSheetContext', () => ({
  useActiveCharacter: vi.fn(() => null),
  useCharacterSheetDispatch: vi.fn(() => vi.fn()),
}));

vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify([]), { status: 200 })),
  ),
);

describe('ActiveCharacterSheet', () => {
  it('renders null when no active character', () => {
    const { container } = render(<ActiveCharacterSheet />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the character sheet when a character is active', async () => {
    const { useActiveCharacter } =
      await import('@/lib/context/CharacterSheetContext');
    const character = { ...createEmptyCharacter(), name: 'Elara Voss' };
    vi.mocked(useActiveCharacter).mockReturnValue(character);

    render(<ActiveCharacterSheet />);
    expect(screen.getByRole('article')).toBeTruthy();
  });
});
