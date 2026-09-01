/**
 * @fileoverview Character Entity Context Tests
 * @description Unit tests for CharacterEntityProvider and its hooks,
 * including the bridge from ActiveSheetProvider.
 *
 * @module tests/unit/src/modules/character-builder/application/context/characterEntityContext.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CharacterSheetProvider } from '@/lib/context/CharacterSheetContext';
import { ActiveSheetProvider } from '@/modules/character-builder/application/context/activeSheetContext';
import {
    CharacterEntityProvider,
    useCharacterEntity,
    useCharacterEntityContext,
    useCharacterEntityField,
} from '@/modules/character-builder/application/context/characterEntityContext';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/**
 * Test consumer exposing entity fields via the DOM.
 *
 * @component
 * @returns {JSX.Element} Test rig markup
 */
function Consumer() {
  const entity = useCharacterEntity();
  const ac = useCharacterEntityField('ac');
  const { patchEntity } = useCharacterEntityContext();
  return (
    <div>
      <span data-testid='name'>{entity.name}</span>
      <span data-testid='ac'>{ac}</span>
      <span data-testid='writable'>{String(patchEntity !== null)}</span>
    </div>
  );
}

describe('CharacterEntityContext', () => {
  it('exposes the entity JSON to consumers', () => {
    const entity = { ...createEmptyCharacter(), name: 'Aila', ac: 15 };
    render(
      <CharacterEntityProvider entity={entity}>
        <Consumer />
      </CharacterEntityProvider>,
    );
    expect(screen.getByTestId('name').textContent).toBe('Aila');
    expect(screen.getByTestId('ac').textContent).toBe('15');
  });

  it('is read-only when no patchEntity is supplied', () => {
    render(
      <CharacterEntityProvider entity={createEmptyCharacter()}>
        <Consumer />
      </CharacterEntityProvider>,
    );
    expect(screen.getByTestId('writable').textContent).toBe('false');
  });

  it('exposes the patcher when supplied', () => {
    render(
      <CharacterEntityProvider
        entity={createEmptyCharacter()}
        patchEntity={vi.fn()}>
        <Consumer />
      </CharacterEntityProvider>,
    );
    expect(screen.getByTestId('writable').textContent).toBe('true');
  });

  it('throws when used outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      /useCharacterEntityContext must be used inside a CharacterEntityProvider/,
    );
    spy.mockRestore();
  });

  it('is bridged by ActiveSheetProvider with a writable patcher', () => {
    const character = { ...createEmptyCharacter(), name: 'Bridged' };
    render(
      <CharacterSheetProvider>
        <ActiveSheetProvider character={character}>
          <Consumer />
        </ActiveSheetProvider>
      </CharacterSheetProvider>,
    );
    expect(screen.getByTestId('name').textContent).toBe('Bridged');
    expect(screen.getByTestId('writable').textContent).toBe('true');
  });
});
