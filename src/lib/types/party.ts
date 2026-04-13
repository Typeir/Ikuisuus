/**
 * @fileoverview Party Types
 * @description TypeScript interfaces for the party management system.
 * Defines the data model for saved parties and individual party members,
 * stored in localStorage for persistence across sessions.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/lib/types/party
 */

/**
 * A single member within a saved party.
 *
 * @interface PartyMember
 * @property {string} id - Unique identifier for this member
 * @property {string} name - Character name displayed in the combat runner
 */
export interface PartyMember {
  id: string;
  name: string;
}

/**
 * A named party of player characters saved to localStorage.
 *
 * @interface SavedParty
 * @property {string} id - Unique identifier for this party
 * @property {string} name - Display name for the party
 * @property {PartyMember[]} members - Ordered list of party members
 */
export interface SavedParty {
  id: string;
  name: string;
  members: PartyMember[];
}
