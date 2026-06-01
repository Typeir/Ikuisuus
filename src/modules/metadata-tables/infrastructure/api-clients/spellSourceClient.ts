/**
 * @fileoverview Spell Source Service
 * @description API service helpers for spell-table source loading from mixed
 * endpoint and inline data sources.
 *
 * @module lib/services/api/spellSourceService
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import type { FilterExpression } from '@/lib/db/content/filters';
import { postJson } from '@/lib/services/api/jsonClient';

/**
 * Spell metadata shape consumed by spell table.
 *
 * @interface SpellData
 * @property {string} slug - URL-safe spell identifier
 * @property {string} title - Display spell title
 * @property {number} level - Spell level
 * @property {string} school - Spell school
 * @property {string[]} castingTime - Normalized casting time tags
 * @property {string} castingTimeRaw - Raw casting time text
 * @property {string} range - Spell range
 * @property {string} duration - Spell duration text
 * @property {boolean} verbal - Verbal component flag
 * @property {boolean} somatic - Somatic component flag
 * @property {boolean} material - Material component flag
 * @property {string} [materialDescription] - Optional material description
 * @property {boolean} concentration - Concentration flag
 * @property {string} [file] - Source file path; literal `"external"` for SRD spells not native to the Damocles setting
 */
export interface SpellData {
  slug: string;
  title: string;
  level: number;
  school: string;
  castingTime: string[];
  castingTimeRaw: string;
  range: string;
  duration: string;
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  materialDescription?: string;
  concentration: boolean;
  file?: string;
  [key: string]: unknown;
}

/**
 * Spell source configuration.
 *
 * @interface SpellSourceRequest
 * @property {(string | SpellData[])[]} sources - Endpoint URLs or inline spell arrays
 * @property {string} locale - Current locale
 * @property {string[]} [spells] - Optional spell slug filter
 * @property {string} [listSource] - Optional listSource filter
 * @property {FilterExpression[]} [filters] - Optional repository-side filter list
 */
export interface SpellSourceRequest {
  sources: (string | SpellData[])[];
  locale: string;
  spells?: string[];
  listSource?: string;
  filters?: FilterExpression[];
}

/**
 * Fetches spell data from configured sources and de-duplicates by slug.
 *
 * @param {SpellSourceRequest} request - Source request configuration
 * @returns {Promise<SpellData[]>} Unique spell data rows
 */
export async function fetchSpellSources(
  request: SpellSourceRequest,
): Promise<SpellData[]> {
  const { sources, locale, spells, listSource, filters } = request;
  const allSpells: SpellData[] = [];

  for (const source of sources) {
    if (typeof source === 'string') {
      const payload = await postJson<
        {
          locale: string;
          listSource?: string;
          spells?: string[];
          filters?: FilterExpression[];
        },
        SpellData[]
      >(source, {
        locale,
        ...(listSource ? { listSource } : {}),
        ...(!listSource && spells && spells.length > 0 ? { spells } : {}),
        ...(filters && filters.length > 0 ? { filters } : {}),
      });
      allSpells.push(...payload);
    } else {
      allSpells.push(...source);
    }
  }

  return Array.from(
    new Map(allSpells.map((spell) => [spell.slug, spell])).values(),
  );
}
