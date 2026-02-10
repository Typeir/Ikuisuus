/**
 * @fileoverview Spell List Sync - Cross-references custom spell files with class spell lists
 * @description Reads all custom spell .mdx files in src/content/en/spells/, extracts the
 * "Spell Lists" section to determine which classes should have each spell, then checks
 * the corresponding class spells.mdx and adds any missing spell slugs.
 *
 * Supports both linked and plain-text spell list references:
 * - `[_Bard Spell List_](/en/library/character-creation/vocations/bard/spells)`
 * - `- Bard Spell List`
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires fs
 * @requires path
 *
 * @example
 * ```bash
 * # Dry run (preview changes without writing)
 * node scripts/utils/syncSpellLists.mjs --dry
 *
 * # Apply changes
 * node scripts/utils/syncSpellLists.mjs
 * ```
 */

import fs from 'fs';
import path from 'path';

/** @type {string} Directory containing custom spell .mdx files */
const SPELLS_DIR = './src/content/en/spells';

/** @type {string} Base directory for class vocation folders */
const VOCATIONS_DIR = './src/content/en/character-creation/vocations';

/**
 * Extracts the class name from a spell list reference line.
 * Handles both linked and plain-text formats.
 *
 * @param {string} line - A line from the Spell Lists section
 * @returns {string|null} Lowercase class name, or null if not matched
 */
function extractClassName(line) {
  /**
   * Match linked format:
   * - [_Bard Spell List_](/en/library/character-creation/vocations/bard/spells)
   */
  const linkMatch = line.match(/\/vocations\/([a-z-]+)\/spells/);
  if (linkMatch) {
    return linkMatch[1];
  }

  /**
   * Match plain-text format:
   * - Bard Spell List
   * - Wizard Spell List
   */
  const plainMatch = line.match(
    /[-*]\s+(?:\[_?)?(\w[\w\s-]*?)\s+Spell\s+List/i,
  );
  if (plainMatch) {
    return plainMatch[1].toLowerCase().replace(/\s+/g, '-');
  }

  return null;
}

/**
 * Parses a spell .mdx file and extracts the class names from its Spell Lists section.
 *
 * @param {string} filePath - Absolute path to the spell .mdx file
 * @returns {{ slug: string, classes: string[] }} Spell slug and array of class names
 */
function parseSpellFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const slug = path.basename(filePath, '.mdx');

  /** Find the "Spell Lists" section */
  const spellListSection = content.split(/####?\s+Spell Lists?\b/i)[1];
  if (!spellListSection) {
    return { slug, classes: [] };
  }

  /** Extract class names from each list item */
  const lines = spellListSection.split('\n');
  const classes = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('-') && !trimmed.startsWith('*')) {
      continue;
    }
    const className = extractClassName(trimmed);
    if (className) {
      classes.push(className);
    }
  }

  return { slug, classes };
}

/**
 * Reads a class spells.mdx file and extracts the current spell slugs from the SpellTable.
 * Handles both double-quoted and single-quoted entries.
 * Only parses entries inside the `spells={[...]}` array, not other props like locale.
 *
 * @param {string} classSpellsPath - Path to the class spells.mdx file
 * @returns {string[]} Array of spell slugs currently in the list
 */
function readClassSpells(classSpellsPath) {
  const content = fs.readFileSync(classSpellsPath, 'utf-8');

  /** Extract only the spells={[...]} array content */
  const spellsMatch = content.match(/spells=\{?\[([^\]]*)\]/s);
  if (!spellsMatch) {
    return [];
  }

  const spellsBlock = spellsMatch[1];
  const matches = spellsBlock.match(/["']([a-z0-9-]+)["']/g);
  if (!matches) {
    return [];
  }
  return matches.map((m) => m.replace(/["']/g, ''));
}

/**
 * Rewrites a class spells.mdx file with the full list of spell slugs.
 * Parses the file structure (header text + SpellTable props), replaces the
 * spells array entirely, and writes it back with consistent formatting.
 *
 * @param {string} classSpellsPath - Path to the class spells.mdx file
 * @param {string[]} allSlugs - Complete array of spell slugs (existing + new)
 */
function rewriteClassSpellFile(classSpellsPath, allSlugs) {
  const content = fs.readFileSync(classSpellsPath, 'utf-8');

  /**
   * Split the file at the spells array opening.
   * Everything before `spells={[` is preserved as-is.
   */
  const spellsOpenIdx = content.indexOf('spells={[');
  if (spellsOpenIdx === -1) {
    console.error(`   ❌ Could not find spells={[ in ${classSpellsPath}`);
    return;
  }

  const header = content.substring(0, spellsOpenIdx);
  const spellEntries = allSlugs.map((s) => `  "${s}",`).join('\n');

  const rebuilt = `${header}spells={[\n${spellEntries}\n]}/>\n`;
  fs.writeFileSync(
    rebuilt.trimStart() === rebuilt ? classSpellsPath : classSpellsPath,
    rebuilt,
    'utf-8',
  );
}

/**
 * Main entry point. Scans all custom spell files, cross-references with class
 * spell lists, and adds missing entries.
 *
 * @returns {void}
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const normalize = args.includes('--normalize');

  if (dryRun) {
    console.log('🔍 DRY RUN — no files will be modified.\n');
  }

  /** Normalize mode: rewrite all class spell files with consistent formatting */
  if (normalize) {
    console.log(
      '🔧 NORMALIZE — rewriting all class spell files with consistent formatting.\n',
    );
    const vocDirs = fs
      .readdirSync(VOCATIONS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const className of vocDirs) {
      const classSpellsPath = path.join(VOCATIONS_DIR, className, 'spells.mdx');
      if (!fs.existsSync(classSpellsPath)) {
        continue;
      }
      const slugs = readClassSpells(classSpellsPath);
      if (slugs.length === 0) {
        console.log(`  ⚠️ ${className}: no spells found, skipping`);
        continue;
      }
      if (!dryRun) {
        rewriteClassSpellFile(classSpellsPath, slugs);
      }
      console.log(`  ✅ ${className}: ${slugs.length} spells normalized`);
    }
    console.log(
      dryRun ? '\n🔍 Dry run complete.' : '\n✅ Normalization complete!',
    );
    return;
  }

  /** Get all custom spell .mdx files (exclude main.mdx and metadata) */
  const spellFiles = fs
    .readdirSync(SPELLS_DIR)
    .filter((f) => f.endsWith('.mdx') && f !== 'main.mdx')
    .map((f) => path.join(SPELLS_DIR, f));

  console.log(`📚 Found ${spellFiles.length} custom spell files.\n`);

  /** @type {Record<string, string[]>} Map of className → slugs to add */
  const additions = {};

  /** @type {Record<string, string[]>} Cache of className → existing slugs */
  const classSpellsCache = {};

  /** @type {string[]} Spells with no Spell Lists section */
  const noListSection = [];

  /** @type {string[]} Classes referenced but with no spells.mdx file */
  const missingClassFiles = new Set();

  for (const spellFile of spellFiles) {
    const { slug, classes } = parseSpellFile(spellFile);

    if (classes.length === 0) {
      noListSection.push(slug);
      continue;
    }

    for (const className of classes) {
      const classSpellsPath = path.join(VOCATIONS_DIR, className, 'spells.mdx');

      if (!fs.existsSync(classSpellsPath)) {
        missingClassFiles.add(className);
        continue;
      }

      /** Load and cache class spell list */
      if (!classSpellsCache[className]) {
        classSpellsCache[className] = readClassSpells(classSpellsPath);
      }

      /** Check if spell is already in the list */
      if (!classSpellsCache[className].includes(slug)) {
        if (!additions[className]) {
          additions[className] = [];
        }
        additions[className].push(slug);
        classSpellsCache[className].push(slug);
      }
    }
  }

  /** Report and apply additions */
  const classNames = Object.keys(additions).sort();

  if (classNames.length === 0) {
    console.log('✅ All spell lists are in sync. No changes needed.');
  } else {
    for (const className of classNames) {
      const slugs = additions[className].sort();
      console.log(`📝 ${className} — adding ${slugs.length} spell(s):`);
      for (const slug of slugs) {
        console.log(`   + ${slug}`);
      }

      if (!dryRun) {
        const classSpellsPath = path.join(
          VOCATIONS_DIR,
          className,
          'spells.mdx',
        );
        const existingSlugs = readClassSpells(classSpellsPath);
        const allSlugs = [...existingSlugs, ...slugs];
        rewriteClassSpellFile(classSpellsPath, allSlugs);
        console.log(`   ✅ Written to ${classSpellsPath}`);
      }
      console.log('');
    }
  }

  /** Report warnings */
  if (noListSection.length > 0) {
    console.log(
      `\n⚠️  ${noListSection.length} spell(s) have no "Spell Lists" section:`,
    );
    for (const slug of noListSection.sort()) {
      console.log(`   - ${slug}`);
    }
  }

  if (missingClassFiles.size > 0) {
    console.log(
      `\n⚠️  ${missingClassFiles.size} class(es) referenced but have no spells.mdx:`,
    );
    for (const cls of [...missingClassFiles].sort()) {
      console.log(`   - ${cls}`);
    }
  }

  console.log(dryRun ? '\n🔍 Dry run complete.' : '\n✅ Sync complete!');
}

main();
