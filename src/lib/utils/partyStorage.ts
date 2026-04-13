/**
 * @fileoverview Party Storage Utilities
 * @description CRUD operations for saved parties using localStorage.
 * Follows the same pattern as encounterStorage.ts for consistency.
 *
 * @module partyStorage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { EncounterStorage } from '@/lib/enums/encounterPlanner';
import type { SavedParty } from '@/lib/types/party';

/**
 * Retrieve all saved parties from localStorage.
 *
 * @function getSavedParties
 * @returns {SavedParty[]} Array of saved parties, or empty array if none exist
 */
export const getSavedParties = (): SavedParty[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(EncounterStorage.SavedParties);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedParty[];
  } catch {
    return [];
  }
};

/**
 * Save or update a party in localStorage.
 * If a party with the same ID exists, it is replaced. Otherwise appended.
 *
 * @function saveParty
 * @param {SavedParty} party - The party to save
 */
export const saveParty = (party: SavedParty): void => {
  const parties = getSavedParties();
  const index = parties.findIndex((p) => p.id === party.id);
  if (index >= 0) {
    parties[index] = party;
  } else {
    parties.push(party);
  }
  localStorage.setItem(EncounterStorage.SavedParties, JSON.stringify(parties));
};

/**
 * Delete a saved party by ID.
 *
 * @function deleteParty
 * @param {string} id - The ID of the party to delete
 */
export const deleteParty = (id: string): void => {
  const parties = getSavedParties().filter((p) => p.id !== id);
  localStorage.setItem(EncounterStorage.SavedParties, JSON.stringify(parties));
};

/**
 * Retrieve a single saved party by ID.
 *
 * @function getPartyById
 * @param {string} id - The party ID to look up
 * @returns {SavedParty | null} The matching party, or null if not found
 */
export const getPartyById = (id: string): SavedParty | null => {
  return getSavedParties().find((p) => p.id === id) ?? null;
};
