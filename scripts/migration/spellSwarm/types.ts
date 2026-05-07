/**
 * @fileoverview Shared type definitions for the spell swarm migration module.
 *
 * @module scripts/migration/spellSwarm/types
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Tracks which spell slugs have already been processed across cron cycles.
 *
 * @property {string[]} processedSlugs - Slugs whose commits have been pushed.
 */
export interface SwarmState {
  processedSlugs: string[];
}

/**
 * A single spell entry from spells-external.metadata.json.
 *
 * @property {string} slug - Kebab-case file slug (e.g. "acid-splash").
 * @property {string} title - Display name of the spell.
 * @property {number} level - Spell level (0 = cantrip).
 * @property {string} school - Spell school (e.g. "Conjuration").
 * @property {string} castingTimeRaw - Raw casting time string (e.g. "1 Action").
 * @property {string} range - Range string (e.g. "60 Feet").
 * @property {boolean} concentration - Whether the spell requires concentration.
 * @property {string} duration - Duration string (e.g. "Instantaneous").
 * @property {boolean} verbal - Whether the spell has a verbal component.
 * @property {boolean} somatic - Whether the spell has a somatic component.
 * @property {boolean} material - Whether the spell has a material component.
 * @property {boolean} hasRitual - Whether the spell can be cast as a ritual.
 * @property {Array<{ name: string; link: string }>} spellLists - Vocation spell list references.
 */
export interface SpellEntry {
  slug: string;
  title: string;
  level: number;
  school: string;
  castingTimeRaw: string;
  range: string;
  concentration: boolean;
  duration: string;
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  hasRitual: boolean;
  spellLists: Array<{ name: string; link: string }>;
}

/**
 * Structured output produced by the GPT-4.1 reproduction agent for a single spell.
 *
 * @property {string} mdxContent - Full MDX file content ready to write to disk.
 */
export interface AgentResult {
  mdxContent: string;
}
