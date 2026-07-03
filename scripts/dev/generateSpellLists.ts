/**
 * @fileoverview Generates the correct spell slug arrays for all spell list
 * files from per-spell metadata. Reads every .metadata.json in the spells
 * directory, groups slugs by vocation list, sorts by level then alphabetically,
 * and writes the updated spells={[...]} array into each spells.list.mdx file.
 *
 * @module scripts/dev/generateSpellLists
 * @version 1.0.0
 * @author Typeir
 * @since 2026-06-15
 */

import { createLogger } from '@/lib/logging/logger';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const log = createLogger({ script: 'generateSpellLists' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SPELLS_DIR = path.join(ROOT, 'src', 'content', 'en', 'spells');
const LISTS_DIR = path.join(ROOT, 'src', 'content', 'en', 'character-creation', 'vocations');

/**
 * Maps spell list names from metadata to their listSource value and the
 * folder containing spells.list.mdx.
 *
 * @typedef {{ source: string, folder: string }} ListInfo
 */
const LIST_MAP: Record<string, { source: string; folder: string }> = {
  Bard:     { source: 'Bard',     folder: 'bard' },
  Pilgrim:   { source: 'Pilgrim',   folder: 'Pilgrim' },
  Druid:    { source: 'Druid',    folder: 'druid' },
  Esper:    { source: 'Esper',    folder: 'esper' },
  Paladin:  { source: 'Paladin',  folder: 'paladin' },
  Ranger:   { source: 'Ranger',   folder: 'ranger' },
  Revenant: { source: 'Revenant', folder: 'revenant' },
  Sorcerer: { source: 'Sorcerer', folder: 'sorcerer' },
  Tinker:   { source: 'Tinker',   folder: 'tinker' },
  Warlock:  { source: 'Warlock',  folder: 'warlock' },
  Wizard:   { source: 'Wizard',   folder: 'wizard' },
};

/**
 * A spell entry extracted from metadata.
 *
 * @property {string} slug - Kebab-case spell slug
 * @property {number} level - Spell level (0 for cantrips)
 */
interface SpellEntry {
  slug: string;
  level: number;
}

/**
 * Metadata list reference from a spell's spellLists array.
 *
 * @property {string} name - Vocation name (e.g. "Pilgrim")
 * @property {string} link - URL to the spell list page
 */
interface ListRef {
  name: string;
  link: string;
}

/**
 * Reads all spell metadata files and groups slugs by vocation list.
 *
 * @returns {Record<string, SpellEntry[]>} Map of list name to spell entries
 */
function scanSpells(): Record<string, SpellEntry[]> {
  const byList: Record<string, SpellEntry[]> = {};
  const entries = readdirSync(SPELLS_DIR, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    if (!entry.name.endsWith('.metadata.json')) continue;
    const raw = readFileSync(path.join(SPELLS_DIR, entry.name), 'utf-8');
    const meta = JSON.parse(raw);
    const slug: string = meta.slug;
    const level: number = meta.level ?? 0;
    const spellLists: ListRef[] = meta.spellLists || [];

    for (const list of spellLists) {
      const name = list.name;
      // Skip specialization-gated entries — spells tied to a
      // specialization (link contains '.specialization') belong to
      // that spec's spell list, not the main vocation spell list.
      if (list.link.includes('.specialization')) continue;
      if (!byList[name]) byList[name] = [];
      byList[name].push({ slug, level });
    }
    count++;
  }

  log.message(`Scanned ${count} spells across ${Object.keys(byList).length} lists`);
  return byList;
}

/**
 * Sorts spells by level (ascending), then alphabetically by slug.
 *
 * @param {SpellEntry[]} spells - Unsorted spell entries
 * @returns {SpellEntry[]} Sorted spell entries
 */
function sortSpells(spells: SpellEntry[]): SpellEntry[] {
  return spells.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.slug.localeCompare(b.slug);
  });
}

/**
 * Formats a sorted spell array into the indented spells={[...]} syntax
 * used in spells.list.mdx files.
 *
 * @param {SpellEntry[]} spells - Sorted spell entries
 * @param {number} indent - Number of spaces for indentation
 * @returns {string} Formatted JSX array
 */
function formatSpellsArray(spells: SpellEntry[], indent: number = 4): string {
  const prefix = ' '.repeat(indent);
  const lines = spells.map((s, i) => {
    const comma = i < spells.length - 1 ? ',' : '';
    return `${prefix}'${s.slug}'${comma}`;
  });
  return lines.join('\n');
}

/**
 * Updates a single spells.list.mdx file with the correct spell array.
 *
 * @param {string} folder - Vocation folder name
 * @param {SpellEntry[]} spells - Sorted spell entries for this list
 * @returns {boolean} Whether the file was modified
 */
function updateListFile(folder: string, spells: SpellEntry[]): boolean {
  const filePath = path.join(LISTS_DIR, folder, 'spells.list.mdx');
  let content: string;

  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    log.warn(`File not found: ${filePath}`);
    return false;
  }

  const newArray = `  spells={[\n${formatSpellsArray(spells)}\n  ]}`;
  const replaced = content.replace(/  spells=\{[\s\S]*?\]\}/, newArray);

  if (replaced !== content) {
    writeFileSync(filePath, replaced, 'utf-8');
    return true;
  }
  return false;
}

/**
 * Entry point. Scans metadata, groups spells, and writes updated list files.
 */
function main(): void {
  const byList = scanSpells();
  let updated = 0;
  let skipped = 0;

  for (const [listName, info] of Object.entries(LIST_MAP)) {
    const spells = byList[listName] || [];
    if (spells.length === 0) {
      log.warn(`No spells found for ${listName} — skipping`);
      skipped++;
      continue;
    }

    const sorted = sortSpells(spells);
    const changed = updateListFile(info.folder, sorted);

    if (changed) {
      log.message(`Updated ${info.folder}/spells.list.mdx (${sorted.length} spells)`);
      updated++;
    } else {
      log.message(`${info.folder}/spells.list.mdx already up to date (${sorted.length} spells)`);
    }
  }

  log.message(`Done. ${updated} updated, ${skipped} skipped.`);
}

main();
