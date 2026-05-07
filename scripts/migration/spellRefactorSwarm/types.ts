/**
 * @fileoverview Shared type definitions for the spell refactor swarm.
 * Tracks which spell files have been processed and defines the agent output contract.
 *
 * @module scripts/migration/spellRefactorSwarm/types
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Persistent state tracking which spell slugs have already been refactored.
 *
 * @property {string[]} processedSlugs - Slugs whose refactors have been committed.
 */
export interface RefactorSwarmState {
  processedSlugs: string[];
}

/**
 * A spell file awaiting lore-description generation.
 *
 * @property {string} slug - Kebab-case file slug (e.g. "acid-splash").
 * @property {string} filePath - Absolute path to the MDX file.
 * @property {string} rawContent - Current file contents read from disk.
 */
export interface SpellRefactorEntry {
  slug: string;
  filePath: string;
  rawContent: string;
}

/**
 * Parsed components of an SRD spell MDX file.
 *
 * @property {string} frontmatter - Raw YAML frontmatter block (without delimiters).
 * @property {string} title - The H1 title line value.
 * @property {string} postH1Text - The paragraph(s) between the H1 and the `---` separator.
 * @property {string} blockquoteHeader - The stat-block header lines (Title, level, components, etc.).
 * @property {string} blockquoteBody - The narrative body of the blockquote (after the blank line).
 * @property {number} spellLevel - Spell level (0 = cantrip, 1–9 for leveled spells).
 * @property {string | null} atHigherLevels - The "At Higher Levels" paragraph if present.
 * @property {string | null} spellListsSection - The "#### Spell Lists" section if present.
 */
export interface ParsedSpell {
  frontmatter: string;
  title: string;
  postH1Text: string;
  blockquoteHeader: string;
  blockquoteBody: string;
  spellLevel: number;
  atHigherLevels: string | null;
  spellListsSection: string | null;
}

/**
 * Structured output returned by the GPT-4.1 lore-generation agent.
 *
 * @property {string} loreDescription - The generated 2–3 sentence Damocles-flavored
 *   lore description to replace the post-H1 rules text.
 * @property {boolean} prependToBlockquote - Whether the original post-H1 text should
 *   be prepended to the blockquote body (true when not already present there).
 */
export interface AgentResult {
  loreDescription: string;
  prependToBlockquote: boolean;
}
