/**
 * @fileoverview Encounter Selector Combobox
 * @description Searchable dropdown for switching between saved encounters.
 * Wraps GenericCombobox and keeps the input label in sync with the active encounter.
 *
 * @module encounterCombobox
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side state and effects
 * @requires @/modules/encounter-planner/domain/encounters/encounter.types Encounter type
 * @requires ./genericCombobox Base combobox component
 *
 * @example
 * ```tsx
 * <EncounterCombobox
 *   encounters={encounters}
 *   currentEncounterId={encounter.id}
 *   onSelect={handleLoadEncounter}
 * />
 * ```
 */

'use client';

import type { Encounter } from '@/modules/encounter-planner/domain/encounters/encounter.types';
import { useEffect, useState } from 'react';
import { ComboboxItem, GenericCombobox } from './genericCombobox';

/**
 * Internal item shape for encounter entries.
 *
 * @interface EncounterItem
 * @property {string} id - Encounter ID (matches Encounter.id)
 * @property {string} searchableText - Encounter name for filtering
 * @property {string} name - Display name
 */
interface EncounterItem extends ComboboxItem {
  name: string;
}

/**
 * Props for EncounterCombobox component.
 *
 * @interface EncounterComboboxProps
 * @property {Encounter[]} encounters - List of saved encounters
 * @property {string} currentEncounterId - ID of the currently active encounter
 * @property {(id: string) => void} onSelect - Callback when an encounter is chosen
 */
interface EncounterComboboxProps {
  encounters: Encounter[];
  currentEncounterId: string;
  onSelect: (id: string) => void;
}

/**
 * Encounter selector combobox. Shows the active encounter name in the input
 * and keeps it in sync when the active encounter changes externally.
 *
 * @component
 * @param {EncounterComboboxProps} props - Component props
 * @param {Encounter[]} props.encounters - All saved encounters
 * @param {string} props.currentEncounterId - Currently active encounter ID
 * @param {(id: string) => void} props.onSelect - Callback with the selected encounter ID
 * @returns {JSX.Element} Rendered encounter combobox
 *
 * @example
 * ```tsx
 * <EncounterCombobox
 *   encounters={encounters}
 *   currentEncounterId={encounter.id}
 *   onSelect={handleLoadEncounter}
 * />
 * ```
 */
export const EncounterCombobox: React.FC<EncounterComboboxProps> = ({
  encounters,
  currentEncounterId,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState(() => {
    return encounters.find((e) => e.id === currentEncounterId)?.name ?? '';
  });

  /** Keep label in sync when the active encounter changes externally (new/delete). */
  useEffect(() => {
    const active = encounters.find((e) => e.id === currentEncounterId);
    setSearchQuery(active?.name ?? '');
  }, [currentEncounterId, encounters]);

  const items: EncounterItem[] = encounters.map((e) => ({
    id: e.id,
    searchableText: e.name,
    name: e.name,
  }));

  return (
    <GenericCombobox
      items={items}
      isLoading={false}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSelect={(item) => {
        setSearchQuery(item.name);
        onSelect(item.id);
      }}
      placeholder='Select encounter'
      noResultsMessage='No encounters found'
      renderItem={(item) => <div>{item.name}</div>}
    />
  );
};
