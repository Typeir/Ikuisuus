/**
 * @fileoverview Character Entity Context
 * @description The single source of truth for character data across the whole
 * module. Holds the canonical {@link CharacterEntity} JSON of the character
 * currently on screen — always the flat entity document, never a wrapper,
 * class instance, or self-referencing structure — so consumers can serialize,
 * diff, or derive from it directly.
 *
 * This is the only context that holds character data. Mounted in two ways:
 * - `ActiveSheetProvider` mounts it around the sheet, feeding it the display
 *   entity (draft while editing, saved snapshot otherwise) plus a writable
 *   patcher. The sheet context itself carries no character data — it owns
 *   only session state (edit mode, active tab, mutators), so there is exactly
 *   one read path for the entity inside the sheet.
 * - Any host may mount `CharacterEntityProvider` directly to expose a
 *   read-only entity with no sheet session at all (e.g. the globally selected
 *   character while browsing the wiki).
 *
 * @module modules/character-builder/application/context/characterEntityContext
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterEntity } from '@/modules/character-builder/domain/character/characterEntity';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Context payload: the entity plus an optional patcher.
 *
 * @interface CharacterEntityContextValue
 * @property {CharacterEntity} entity - The canonical character JSON
 * @property {((partial: Partial<CharacterEntity>) => void) | null} patchEntity - Merges a partial patch into the entity; `null` when the host is read-only. Inside the sheet this is the same function reference as `useSheetMutators().patch`, so both write paths land on one reducer
 */
export interface CharacterEntityContextValue {
  entity: CharacterEntity;
  patchEntity: ((partial: Partial<CharacterEntity>) => void) | null;
}

const CharacterEntityContext =
  createContext<CharacterEntityContextValue | null>(null);

/**
 * Props for CharacterEntityProvider.
 *
 * @interface CharacterEntityProviderProps
 * @property {CharacterEntity} entity - Entity to expose
 * @property {(partial: Partial<CharacterEntity>) => void} [patchEntity] - Optional write API; omit for read-only hosts
 * @property {ReactNode} children - Subtree that reads from this context
 */
export interface CharacterEntityProviderProps {
  entity: CharacterEntity;
  patchEntity?: (partial: Partial<CharacterEntity>) => void;
  children: ReactNode;
}

/**
 * Provides the character entity JSON to descendants.
 *
 * @component
 * @param {CharacterEntityProviderProps} props - Provider props
 * @returns {JSX.Element} Context provider element
 */
export const CharacterEntityProvider: React.FC<
  CharacterEntityProviderProps
> = ({ entity, patchEntity, children }) => {
  const value = useMemo<CharacterEntityContextValue>(
    () => ({ entity, patchEntity: patchEntity ?? null }),
    [entity, patchEntity],
  );
  return (
    <CharacterEntityContext.Provider value={value}>
      {children}
    </CharacterEntityContext.Provider>
  );
};

/**
 * Read the full entity context. Throws outside a provider.
 *
 * @function useCharacterEntityContext
 * @returns {CharacterEntityContextValue} Entity + patcher
 * @throws {Error} When called outside a CharacterEntityProvider
 */
export const useCharacterEntityContext = (): CharacterEntityContextValue => {
  const ctx = useContext(CharacterEntityContext);
  if (!ctx) {
    throw new Error(
      'useCharacterEntityContext must be used inside a CharacterEntityProvider — ActiveSheetProvider mounts one for the character sheet',
    );
  }
  return ctx;
};

/**
 * Read the canonical character entity JSON.
 *
 * @function useCharacterEntity
 * @returns {CharacterEntity} The current entity
 */
export const useCharacterEntity = (): CharacterEntity =>
  useCharacterEntityContext().entity;

/**
 * Read a single top-level field from the entity.
 *
 * @function useCharacterEntityField
 * @param {K} key - Field key
 * @returns {CharacterEntity[K]} Current field value
 * @template {keyof CharacterEntity} K
 */
export const useCharacterEntityField = <K extends keyof CharacterEntity>(
  key: K,
): CharacterEntity[K] => useCharacterEntityContext().entity[key];
