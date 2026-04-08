/**
 * @fileoverview Shared prop types for spell table components.
 * @module src/lib/components/mdx/spellTable/spellTable.types
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import type { SpellData } from '@/lib/services/api/spellSourceService';

/**
 * Shared configuration props consumed by both SpellTable and FilteredSpellTable.
 *
 * @interface SpellTablesProps
 * @property {(string | SpellData[])[]} sources - API endpoint URLs or inline spell data arrays
 * @property {string} [locale="en"] - Locale for API requests and display
 * @property {number[]} [levels] - Spell levels to display as tabs
 * @property {Record<number, string>} [levelLabels] - Custom labels for spell level tabs
 * @property {string} [basePath="spells"] - Base path for spell detail links
 * @property {boolean} [showAllTab=false] - Whether to prepend an "All" tab
 * @property {string[]} [spells] - Optional slug allow-list; restricts fetched spells
 * @property {string} [listSource] - Vocation name for pg spell_lists backend; takes priority over spells
 */
export interface SpellTablesProps {
  sources: (string | SpellData[])[];
  locale?: string;
  levels?: number[];
  levelLabels?: Record<number, string>;
  basePath?: string;
  showAllTab?: boolean;
  spells?: string[];
  listSource?: string;
}
