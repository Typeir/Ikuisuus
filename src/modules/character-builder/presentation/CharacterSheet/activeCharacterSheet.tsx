/**
 * @fileoverview Active Character Sheet Wrapper
 * @description Renders the full character sheet for the active character.
 * Returns null when no character is selected.
 *
 * @module lib/components/characterSheet/activeCharacterSheet
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useActiveCharacter } from '@/lib/context/CharacterSheetContext';
import { CharacterSheet } from './characterSheet';

/**
 * Wrapper that reads the active character from context.
 * Renders null when no character is selected.
 *
 * @component
 * @returns {JSX.Element | null} Rendered active character sheet or null
 */
export const ActiveCharacterSheet: React.FC = () => {
  const character = useActiveCharacter();
  if (!character) return null;
  return <CharacterSheet character={character} />;
};
