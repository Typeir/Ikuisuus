/**
 * @fileoverview Abilities Tab Context
 * @description Single source of truth for the Abilities tab. Owns ability CRUD
 * and selected-ability state. Consumes `useSheetEditing()` and `useSheetMutators()`
 * from ActiveSheetContext so consumers never need data/onChange props.
 *
 * @module modules/character-builder/presentation/tabs/abilities/abilitiesContext
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterAbility } from '@/lib/types/character';
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import {
    useActiveSheet,
    useSheetData,
} from '../../../application/context/activeSheetContext';

/**
 * Mutator API exposed to consumers via `useAbilities`.
 *
 * @interface AbilitiesMutators
 * @property {(ability: CharacterAbility) => void} addAbility - Insert a new ability
 * @property {(id: string, patch: Partial<CharacterAbility>) => void} updateAbility - Merge patch into an existing ability
 * @property {(id: string) => void} deleteAbility - Remove an ability by id
 * @property {(ability: CharacterAbility) => void} importAbility - Import from metadata (same as add but marks provenance)
 * @property {(id: string | null) => void} setSelected - Set the currently selected ability id
 */
export interface AbilitiesMutators {
  addAbility: (ability: CharacterAbility) => void;
  updateAbility: (id: string, patch: Partial<CharacterAbility>) => void;
  deleteAbility: (id: string) => void;
  importAbility: (ability: CharacterAbility) => void;
  setSelected: (id: string | null) => void;
}

/**
 * Read-only view exposed by the context value.
 *
 * @interface AbilitiesContextValue
 * @property {CharacterAbility[]} abilities - All abilities on the character
 * @property {string[]} vocationSources - Active vocation titles, for scoping spell import to the character's spell lists
 * @property {boolean} editing - Whether the sheet is in edit mode
 * @property {string | null} selectedId - Currently selected ability id
 * @property {CharacterAbility | null} selected - The selected ability object, or null
 * @property {AbilitiesMutators} mutators - Write API
 */
export interface AbilitiesContextValue {
  abilities: CharacterAbility[];
  vocationSources: string[];
  editing: boolean;
  selectedId: string | null;
  selected: CharacterAbility | null;
  mutators: AbilitiesMutators;
}

const AbilitiesContext = createContext<AbilitiesContextValue | null>(null);

/**
 * Props for the AbilitiesProvider.
 *
 * @interface AbilitiesProviderProps
 * @property {ReactNode} children - Subtree that reads from this context
 */
export interface AbilitiesProviderProps {
  children: ReactNode;
}

/**
 * Provides abilities state and mutators to descendants.
 * Reads/writes `data.abilities` from the active sheet context via `patch`.
 *
 * @component
 * @param {AbilitiesProviderProps} props - Provider props
 * @returns {JSX.Element} Context provider element
 */
export const AbilitiesProvider: React.FC<AbilitiesProviderProps> = ({
  children,
}) => {
  const data = useSheetData();
  const { editing, mutators: sheetMutators } = useActiveSheet();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const abilities = useMemo(
    () => (data.abilities ?? []) as CharacterAbility[],
    [data.abilities],
  );

  const vocationSources = useMemo(
    () =>
      Array.from(
        new Set(
          (data.vocations ?? [])
            .filter((v) => v.slug && v.title)
            .map((v) => v.title),
        ),
      ),
    [data.vocations],
  );

  const selected = useMemo(
    () =>
      selectedId ? (abilities.find((a) => a.id === selectedId) ?? null) : null,
    [abilities, selectedId],
  );

  const setSelected = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const addAbility = useCallback(
    (ability: CharacterAbility) => {
      sheetMutators.patch({ abilities: [...abilities, ability] });
    },
    [abilities, sheetMutators],
  );

  const updateAbility = useCallback(
    (id: string, patch: Partial<CharacterAbility>) => {
      sheetMutators.patch({
        abilities: abilities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      });
    },
    [abilities, sheetMutators],
  );

  const deleteAbility = useCallback(
    (id: string) => {
      sheetMutators.patch({
        abilities: abilities.filter((a) => a.id !== id),
      });
      if (selectedId === id) setSelectedId(null);
    },
    [abilities, selectedId, sheetMutators],
  );

  const importAbility = useCallback(
    (ability: CharacterAbility) => {
      sheetMutators.patch({ abilities: [...abilities, ability] });
    },
    [abilities, sheetMutators],
  );

  const mutators = useMemo<AbilitiesMutators>(
    () => ({
      addAbility,
      updateAbility,
      deleteAbility,
      importAbility,
      setSelected,
    }),
    [addAbility, updateAbility, deleteAbility, importAbility, setSelected],
  );

  const value = useMemo<AbilitiesContextValue>(
    () => ({
      abilities,
      vocationSources,
      editing,
      selectedId,
      selected,
      mutators,
    }),
    [abilities, vocationSources, editing, selectedId, selected, mutators],
  );

  return (
    <AbilitiesContext.Provider value={value}>
      {children}
    </AbilitiesContext.Provider>
  );
};

/**
 * Hook to read abilities state and mutators from context.
 * Throws if used outside an `AbilitiesProvider`.
 *
 * @function useAbilities
 * @returns {AbilitiesContextValue} Abilities state and mutators
 */
export function useAbilities(): AbilitiesContextValue {
  const ctx = useContext(AbilitiesContext);
  if (!ctx) {
    throw new Error('useAbilities must be used within an AbilitiesProvider');
  }
  return ctx;
}
