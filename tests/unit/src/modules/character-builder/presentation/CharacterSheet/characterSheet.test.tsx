/**
 * @fileoverview CharacterSheet Unit Tests
 * @description Tests for the CharacterSheet and ActiveCharacterSheet components.
 *
 * @module tests/unit/src/modules/character-builder/presentation/CharacterSheet/characterSheet.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CharacterSheet } from '@/modules/character-builder/presentation/CharacterSheet/characterSheet';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function makeCharacter(
  overrides: Partial<CharacterSheetType> = {},
): CharacterSheetType {
  return {
    ...createEmptyCharacter(),
    name: 'Aria Dawnweaver',
    level: 3,
    ...overrides,
  };
}

describe('CharacterSheet', () => {
  /**
   * userEvent dispatches keystrokes without real-timer waits.
   */
  const user = userEvent.setup({ delay: null });
  it('renders the character name', () => {
    render(<CharacterSheet character={makeCharacter()} />);
    expect(
      screen.getByRole('heading', { name: /Aria Dawnweaver/i }),
    ).toBeTruthy();
  });

  it('renders level and bloodline info', () => {
    render(
      <CharacterSheet
        character={makeCharacter({
          bloodlineTitle: 'Empyrean',
          vocations: [
            {
              slug: 'wizard',
              title: 'Wizard',
              level: 3,
              specializationSlug: null,
              specializationTitle: '',
              vocationFeatures: [],
              specializationFeatures: [],
            },
          ],
        })}
      />,
    );
    expect(screen.getByText('levelFull')).toBeTruthy();
    expect(screen.getAllByText('Empyrean')[0]).toBeTruthy();
    expect(screen.getAllByText(/Wizard/)[0]).toBeTruthy();
  });

  it('shows Edit button in view mode', () => {
    render(<CharacterSheet character={makeCharacter()} />);
    expect(
      screen.getByRole('button', { name: 'ariaEditCharacter' }),
    ).toBeTruthy();
  });

  it('opens in edit mode when startEditingId matches the character', () => {
    const character = makeCharacter();
    render(
      <CharacterSheet character={character} startEditingId={character.id} />,
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy();
  });

  it('switches to edit mode when Edit is clicked', async () => {
    render(<CharacterSheet character={makeCharacter()} />);
    await user.click(
      screen.getByRole('button', { name: 'ariaEditCharacter' }),
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy();
  });

  it('reverts changes when Cancel is clicked', async () => {
    render(<CharacterSheet character={makeCharacter()} />);
    await user.click(
      screen.getByRole('button', { name: 'ariaEditCharacter' }),
    );
    const nameInput = screen.getByRole('textbox', {
      name: 'ariaCharacterName',
    });
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Name');
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(
      screen.getByRole('heading', { name: /Aria Dawnweaver/i }),
    ).toBeTruthy();
  });

  it('dispatches UPSERT_CHARACTER with the edited character when Save is clicked', async () => {
    const { useCharacterSheetDispatch } =
      await import('@/lib/context/CharacterSheetContext');
    const dispatch = vi.fn();
    vi.mocked(useCharacterSheetDispatch).mockReturnValue(dispatch);

    render(<CharacterSheet character={makeCharacter()} />);
    await user.click(
      screen.getByRole('button', { name: 'ariaEditCharacter' }),
    );
    const nameInput = screen.getByRole('textbox', {
      name: 'ariaCharacterName',
    });
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Name');
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CHARACTER_SHEET/UPSERT_CHARACTER',
        payload: expect.objectContaining({
          character: expect.objectContaining({ name: 'Changed Name' }),
        }),
      }),
    );
  });

  it('persists a live-play write made outside edit mode', async () => {
    const { useCharacterSheetDispatch } =
      await import('@/lib/context/CharacterSheetContext');
    const dispatch = vi.fn();
    vi.mocked(useCharacterSheetDispatch).mockReturnValue(dispatch);

    render(
      <CharacterSheet
        character={{ ...makeCharacter(), gritCurrent: 3, gritMax: 5 }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'gritSpend' }));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CHARACTER_SHEET/UPSERT_CHARACTER',
        payload: expect.objectContaining({
          character: expect.objectContaining({ gritCurrent: 2 }),
        }),
      }),
    );
  });
});
