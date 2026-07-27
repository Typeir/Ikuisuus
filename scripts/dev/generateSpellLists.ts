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
import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const log = createLogger({ script: 'generateSpellLists' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

/**
 * Spell sidecar directory. In pg backend mode the generators write to
 * `.meta/en/spells`; fall back to the source-adjacent location otherwise.
 */
const SPELLS_DIR = existsSync(path.join(ROOT, '.meta', 'en', 'spells'))
  ? path.join(ROOT, '.meta', 'en', 'spells')
  : path.join(ROOT, 'src', 'content', 'en', 'spells');
const LISTS_DIR = path.join(
  ROOT,
  'src',
  'content',
  'en',
  'character-creation',
  'vocations',
);

/**
 * Maps vocation spell list names from metadata to their listSource value and
 * the folder containing spells.list.mdx.
 *
 * @typedef {{ source: string, folder: string }} ListInfo
 */
const LIST_MAP: Record<string, { source: string; folder: string }> = {
  Bard: { source: 'Bard', folder: 'bard' },
  Pilgrim: { source: 'Pilgrim', folder: 'Pilgrim' },
  Druid: { source: 'Druid', folder: 'druid' },
  Esper: { source: 'Esper', folder: 'esper' },
  Paladin: { source: 'Paladin', folder: 'paladin' },
  Strider: { source: 'Strider', folder: 'strider' },
  Revenant: { source: 'Revenant', folder: 'revenant' },
  Scion: { source: 'Scion', folder: 'scion' },
  Tinker: { source: 'Tinker', folder: 'tinker' },
  Villein: { source: 'Villein', folder: 'villein' },
  Wizard: { source: 'Wizard', folder: 'wizard' },
};

/**
 * Maps specialization-owned spell list names to the specialization file that
 * embeds their SpellTable. Specialization lists live inside the main
 * specialization MDX file rather than a standalone spells.list.mdx.
 *
 * @typedef {{ folder: string, file: string }} SpecListInfo
 */
const SPEC_LIST_MAP: Record<string, { folder: string; file: string }> = {
  'Want of Knowledge': {
    folder: 'berserker',
    file: 'want-of-knowledge.specialization.mdx',
  },
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
 * Reads all spell metadata files and groups slugs by list. Vocation lists and
 * specialization-owned lists (link targets a `.specialization` page) are
 * grouped separately, since they are written to different file shapes.
 *
 * @returns {{ byList: Record<string, SpellEntry[]>, bySpecList: Record<string, SpellEntry[]> }} Vocation and specialization list groupings
 */
function scanSpells(): {
  byList: Record<string, SpellEntry[]>;
  bySpecList: Record<string, SpellEntry[]>;
} {
  const byList: Record<string, SpellEntry[]> = {};
  const bySpecList: Record<string, SpellEntry[]> = {};
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
      const target = list.link.includes('.specialization')
        ? bySpecList
        : byList;
      if (!target[name]) target[name] = [];
      target[name].push({ slug, level });
    }
    count++;
  }

  const listCount =
    Object.keys(byList).length + Object.keys(bySpecList).length;
  log.message(`Scanned ${count} spells across ${listCount} lists`);
  return { byList, bySpecList };
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
 * Replaces the spells={[...]} array in the file at the given path. The file
 * must contain exactly one SpellTable spells array.
 *
 * @param {string} filePath - Absolute path to the MDX file holding the array
 * @param {SpellEntry[]} spells - Sorted spell entries for this list
 * @returns {boolean} Whether the file was modified
 */
function updateListFile(filePath: string, spells: SpellEntry[]): boolean {
  let content: string;

  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    log.warning(`File not found: ${filePath}`);
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
 * Sorts a list's entries and writes them into the target file, logging the
 * outcome under the given display name.
 *
 * @param {string} displayName - Path-like label used in log lines
 * @param {string} filePath - Absolute path to the MDX file holding the array
 * @param {SpellEntry[]} spells - Unsorted spell entries for this list
 * @returns {boolean} Whether the file was modified
 */
function writeList(
  displayName: string,
  filePath: string,
  spells: SpellEntry[],
): boolean {
  const sorted = sortSpells(spells);
  const changed = updateListFile(filePath, sorted);

  if (changed) {
    log.message(`Updated ${displayName} (${sorted.length} spells)`);
  } else {
    log.message(`${displayName} already up to date (${sorted.length} spells)`);
  }
  return changed;
}

/**
 * Entry point. Scans metadata, groups spells, and writes updated arrays into
 * vocation spells.list.mdx files and specialization MDX files.
 */
function main(): void {
  const { byList, bySpecList } = scanSpells();
  let updated = 0;
  let skipped = 0;

  for (const [listName, info] of Object.entries(LIST_MAP)) {
    const spells = byList[listName] || [];
    if (spells.length === 0) {
      log.warning(`No spells found for ${listName} — skipping`);
      skipped++;
      continue;
    }

    const filePath = path.join(LISTS_DIR, info.folder, 'spells.list.mdx');
    if (writeList(`${info.folder}/spells.list.mdx`, filePath, spells)) {
      updated++;
    }
  }

  for (const [listName, info] of Object.entries(SPEC_LIST_MAP)) {
    const spells = bySpecList[listName] || [];
    if (spells.length === 0) {
      log.warning(`No spells found for ${listName} — skipping`);
      skipped++;
      continue;
    }

    const filePath = path.join(LISTS_DIR, info.folder, info.file);
    if (writeList(`${info.folder}/${info.file}`, filePath, spells)) {
      updated++;
    }
  }

  log.message(`Done. ${updated} updated, ${skipped} skipped.`);
}

main();
