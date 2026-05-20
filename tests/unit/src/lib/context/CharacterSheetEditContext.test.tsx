/**
 * @fileoverview CharacterSheetEditContext Tests
 * @description Verifies the provider exposes the active draft to consumers
 * and that the consumer hook throws when used outside a provider.
 *
 * @module tests/unit/lib/context/CharacterSheetEditContext
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import {
  CharacterSheetEditProvider,
  useCharacterSheetEdit,
} from '@/lib/context/CharacterSheetEditContext';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/**
 * Test consumer that surfaces context values into the DOM for assertions.
 *
 * @returns {JSX.Element} Rendered context values
 */
function Consumer(): JSX.Element {
  const { data, editing, locale } = useCharacterSheetEdit();
  return (
    <div>
      <span data-testid='name'>{data.name}</span>
      <span data-testid='editing'>{String(editing)}</span>
      <span data-testid='locale'>{locale}</span>
    </div>
  );
}

describe('CharacterSheetEditContext', () => {
  it('exposes data, editing, and locale to consumers', () => {
    const data = { ...createEmptyCharacter(), name: 'Test Name' };
    render(
      <CharacterSheetEditProvider
        data={data}
        editing
        locale='es'
        onChange={vi.fn()}>
        <Consumer />
      </CharacterSheetEditProvider>,
    );
    expect(screen.getByTestId('name').textContent).toBe('Test Name');
    expect(screen.getByTestId('editing').textContent).toBe('true');
    expect(screen.getByTestId('locale').textContent).toBe('es');
  });

  it('throws when the hook is used outside the provider', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      /useCharacterSheetEdit must be used within a CharacterSheetEditProvider/,
    );
    errSpy.mockRestore();
  });
});
