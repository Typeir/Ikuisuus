/**
 * @fileoverview Spell List Sync - Cross-references custom spell files with class spell lists
 * @description Reads all custom spell .mdx files in src/content/en/spells/, extracts the
 * "Spell Lists" section to determine which classes should have each spell, then checks
 * the corresponding class spells.mdx and adds any missing spell slugs.
 *
 * @version 1.0.0
 * @since 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/utils/syncSpellLists.ts --dry
 * npx tsx scripts/utils/syncSpellLists.ts
 * ```
 */

import fs from 'fs';
import path from 'path';
import { createLogger } from '@/lib/logging/logger';

const log = createLogger({ script: 'syncSpellLists' });

/** Directory containing custom spell .mdx files */
const SPELLS_DIR = './src/content/en/spells';

/** Base directory for class vocation folders */
const VOCATIONS_DIR = './src/content/en/character-creation/vocations';

/**
 * Extracts the class name from a spell list reference line.
 *
 * @param line - A line from the Spell Lists section
 * @returns Lowercase class name, or null if not matched
 */
function extractClassName(line: string): string | null {
  const linkMatch = line.match(/\/vocations\/([a-z-]+)\/spells/);
  if (linkMatch) {
    return linkMatch[1];
  }

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
 * @param filePath - Absolute path to the spell .mdx file
 * @returns Spell slug and array of class names
 */
function parseSpellFile(filePath: string): { slug: string; classes: string[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const slug = path.basename(filePath, '.mdx');

  const spellListSection = content.split(/####?\s+Spell Lists?\b/i)[1];
  if (!spellListSection) {
    return { slug, classes: [] };
  }

  const lines = spellListSection.split('\n');
  const classes: string[] = [];

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
 *
 * @param classSpellsPath - Path to the class spells.mdx file
 * @returns Array of spell slugs currently in the list
 */
function readClassSpells(classSpellsPath: string): string[] {
  const content = fs.readFileSync(classSpellsPath, 'utf-8');

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
 *
 * @param classSpellsPath - Path to the class spells.mdx file
 * @param allSlugs - Complete array of spell slugs
 */
function rewriteClassSpellFile(classSpellsPath: string, allSlugs: string[]): void {
  const content = fs.readFileSync(classSpellsPath, 'utf-8');

  const spellsOpenIdx = content.indexOf('spells={[');
  if (spellsOpenIdx === -1) {
    log.error(`   ❌ Could not find spells={[ in ${classSpellsPath}`);
    return;
  }

  const header = content.substring(0, spellsOpenIdx);
  const spellEntries = allSlugs.map((s) => `  "${s}",`).join('\n');

  const rebuilt = `${header}spells={[\n${spellEntries}\n]}/>\n`;
  fs.writeFileSync(classSpellsPath, rebuilt, 'utf-8');
}

/**
 * Main entry point. Scans all custom spell files, cross-references with class
 * spell lists, and adds missing entries.
 */
function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const normalize = args.includes('--normalize');

  if (dryRun) {
    log.message('🔍 DRY RUN — no files will be modified.\n');
  }

  if (normalize) {
    log.message(
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
        log.message(`  ⚠️ ${className}: no spells found, skipping`);
        continue;
      }
      if (!dryRun) {
        rewriteClassSpellFile(classSpellsPath, slugs);
      }
      log.message(`  ✅ ${className}: ${slugs.length} spells normalized`);
    }
    log.message(
      dryRun ? '\n🔍 Dry run complete.' : '\n✅ Normalization complete!',
    );
    return;
  }

  const spellFiles = fs
    .readdirSync(SPELLS_DIR)
    .filter((f) => f.endsWith('.mdx') && f !== 'main.mdx')
    .map((f) => path.join(SPELLS_DIR, f));

  log.message(`📚 Found ${spellFiles.length} custom spell files.\n`);

  const additions: Record<string, string[]> = {};
  const classSpellsCache: Record<string, string[]> = {};
  const noListSection: string[] = [];
  const missingClassFiles = new Set<string>();

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

      if (!classSpellsCache[className]) {
        classSpellsCache[className] = readClassSpells(classSpellsPath);
      }

      if (!classSpellsCache[className].includes(slug)) {
        if (!additions[className]) {
          additions[className] = [];
        }
        additions[className].push(slug);
        classSpellsCache[className].push(slug);
      }
    }
  }

  const classNames = Object.keys(additions).sort();

  if (classNames.length === 0) {
    log.message('✅ All spell lists are in sync. No changes needed.');
  } else {
    for (const className of classNames) {
      const slugs = additions[className].sort();
      log.message(`📝 ${className} — adding ${slugs.length} spell(s):`);
      for (const slug of slugs) {
        log.message(`   + ${slug}`);
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
        log.message(`   ✅ Written to ${classSpellsPath}`);
      }
      log.message('');
    }
  }

  if (noListSection.length > 0) {
    log.message(
      `\n⚠️  ${noListSection.length} spell(s) have no "Spell Lists" section:`,
    );
    for (const slug of noListSection.sort()) {
      log.message(`   - ${slug}`);
    }
  }

  if (missingClassFiles.size > 0) {
    log.message(
      `\n⚠️  ${missingClassFiles.size} class(es) referenced but have no spells.mdx:`,
    );
    for (const cls of [...missingClassFiles].sort()) {
      log.message(`   - ${cls}`);
    }
  }

  log.message(dryRun ? '\n🔍 Dry run complete.' : '\n✅ Sync complete!');
}

main();
