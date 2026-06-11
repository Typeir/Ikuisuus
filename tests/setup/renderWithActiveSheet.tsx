/**
 * @fileoverview Active Sheet Render Helper
 * @description Test utility for rendering components that consume the active
 *              sheet context. Wraps the tree in both the outer roster provider
 *              and the inner `ActiveSheetProvider`, and can flip into edit
 *              mode before assertions run.
 *
 * @module tests/setup/renderWithActiveSheet
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CharacterSheetProvider } from '@/lib/context/CharacterSheetContext';
import type { CharacterSheet } from '@/lib/types/character';
import {
  ActiveSheetProvider,
  useActiveSheet,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

/**
 * Options accepted by `renderWithActiveSheet`.
 *
 * @interface RenderWithActiveSheetOptions
 * @property {Partial<CharacterSheet>} [character] - Character overrides applied on top of `createEmptyCharacter()`
 * @property {boolean} [editing] - When true, enters edit mode after mount
 */
export interface RenderWithActiveSheetOptions {
  character?: Partial<CharacterSheet>;
  editing?: boolean;
}

/**
 * Internal helper that flips the context into edit mode after mount.
 *
 * @component
 * @returns {null} Renders nothing
 */
const EditModeToggle: React.FC = () => {
  const { mutators } = useActiveSheet();
  useEffect(() => {
    mutators.beginEdit();
  }, [mutators]);
  return null;
};

/**
 * Render `ui` inside the full active-sheet provider stack used by the app.
 *
 * @function renderWithActiveSheet
 * @param {ReactElement} ui - Component tree under test
 * @param {RenderWithActiveSheetOptions} [options] - Seed character + editing flag
 * @returns {RenderResult} React Testing Library result
 */
export const renderWithActiveSheet = (
  ui: ReactElement,
  options: RenderWithActiveSheetOptions = {},
): RenderResult => {
  const character: CharacterSheet = {
    ...createEmptyCharacter(),
    ...(options.character ?? {}),
  };
  return render(
    <CharacterSheetProvider>
      <ActiveSheetProvider character={character}>
        {options.editing ? <EditModeToggle /> : null}
        {ui}
      </ActiveSheetProvider>
    </CharacterSheetProvider>,
  );
};
