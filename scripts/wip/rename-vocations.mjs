#!/usr/bin/env node

/**
 * @fileoverview Vocation Rename: Barbarian→Berserker, Fighter→Warrior, Cleric→Pilgrim.
 * Also: Path of the Berserker → Path of Frenzy.
 * Single-pass, ordered rules, no split files needed — this one's simple.
 *
 * Usage: node scripts/wip/rename-vocations.mjs [--dry-run] [scanDir]
 *
 * @module scripts/wip/rename-vocations
 * @version 1.0.0
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

// ─── Rules (longest/most specific first) ────────────────────────────────────

const RULES = [
  // Special case: Path of the Berserker → Path of Frenzy
  {
    pattern: /\bPath of the Berserker\b/g,
    replacement: 'Path of Frenzy',
    label: 'Path of the Berserker → Path of Frenzy',
  },
  {
    pattern: /\bpath of the berserker\b/gi,
    replacement: 'Path of Frenzy',
    label: 'path of the berserker → Path of Frenzy',
  },

  // Spell list references (before standalone word replacements)
  {
    pattern: /\bBarbarian spell list\b/gi,
    replacement: 'Berserker spell list',
    label: 'Barbarian spell list → Berserker',
  },
  {
    pattern: /\bFighter spell list\b/gi,
    replacement: 'Warrior spell list',
    label: 'Fighter spell list → Warrior',
  },
  {
    pattern: /\bCleric spell list\b/gi,
    replacement: 'Pilgrim spell list',
    label: 'Cleric spell list → Pilgrim',
  },

  // Possessives
  {
    pattern: /\bBarbarian's\b/g,
    replacement: "Berserker's",
    label: "Barbarian's → Berserker's",
  },
  {
    pattern: /\bFighter's\b/g,
    replacement: "Warrior's",
    label: "Fighter's → Warrior's",
  },
  {
    pattern: /\bCleric's\b/g,
    replacement: "Pilgrim's",
    label: "Cleric's → Pilgrim's",
  },

  // Standalone vocation names (case-insensitive catch-all)
  { pattern: /\bBarbarian\b/g, replacement: 'Berserker', label: 'Barbarian → Berserker' },
  { pattern: /\bbarbarian\b/gi, replacement: 'Berserker', label: 'barbarian → Berserker' },
  { pattern: /\bFighter\b/g, replacement: 'Warrior', label: 'Fighter → Warrior' },
  { pattern: /\bfighter\b/gi, replacement: 'Warrior', label: 'fighter → Warrior' },
  { pattern: /\bCleric\b/g, replacement: 'Pilgrim', label: 'Cleric → Pilgrim' },
  { pattern: /\bcleric\b/gi, replacement: 'Pilgrim', label: 'cleric → Pilgrim' },
];

// ─── Core Logic ──────────────────────────────────────────────────────────────

function applyRulesToLine(line, lineIndex, filePath) {
  const changes = [];
  let result = line;
  for (const rule of RULES) {
    if (rule.pattern instanceof RegExp) rule.pattern.lastIndex = 0;
    result = result.replace(rule.pattern, (...args) => {
      const match = args[0];
      let actual;
      if (typeof rule.replacement === 'function') {
        actual = rule.replacement(...args);
      } else {
        actual = match.replace(
          new RegExp(rule.pattern.source, rule.pattern.flags),
          rule.replacement,
        );
      }
      if (match !== actual) {
        changes.push({ file: filePath, line: lineIndex + 1, old: match, new: actual, rule: rule.label });
      }
      return actual;
    });
    if (rule.pattern instanceof RegExp) rule.pattern.lastIndex = 0;
  }
  return { line: result, changes };
}

function applyRules(content, filePath) {
  const lines = content.split('\n');
  const allChanges = [];
  const resultLines = [];
  for (let i = 0; i < lines.length; i++) {
    const { line, changes } = applyRulesToLine(lines[i], i, filePath);
    resultLines.push(line);
    allChanges.push(...changes);
  }
  return { changed: allChanges.length > 0, content: resultLines.join('\n'), changes: allChanges };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set(['node_modules', '.next', 'temp', '.git', '.paw', 'rename-tier-bonus.fixtures']);
const PROCESS_EXTENSIONS = new Set(['.mdx', '.ts', '.tsx', '.json', '.mjs', '.md', '.js']);

async function collectFiles(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        results.push(...(await collectFiles(full)));
      }
    } else if (entry.isFile()) {
      if (PROCESS_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        results.push(full);
      }
    }
  }
  return results;
}

async function run(dryRun, scanDir, logFile) {
  const cwd = resolve(scanDir);
  const allChanges = [];
  console.log(`Scanning: ${cwd}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);
  const files = await collectFiles(cwd);
  console.log(`Found ${files.length} files to process.\n`);
  for (const filePath of files) {
    const rel = relative(cwd, filePath);
    try {
      const original = await readFile(filePath, 'utf-8');
      const result = applyRules(original, rel);
      if (result.changed) {
        console.log(`  MODIFIED: ${rel} (${result.changes.length} change(s))`);
        for (const c of result.changes) {
          console.log(`    L${c.line}: "${c.old}" → "${c.new}"`);
        }
        allChanges.push(...result.changes);
        if (!dryRun) await writeFile(filePath, result.content, 'utf-8');
      }
    } catch (err) {
      console.error(`  ERROR: ${rel}: ${err.message}`);
    }
  }
  console.log(`\nTotal: ${allChanges.length} changes in ${new Set(allChanges.map((c) => c.file)).size} files.`);
  await writeFile(logFile, JSON.stringify(allChanges, null, 2), 'utf-8');
  console.log(`Log: ${logFile}`);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const scanDir = args.find((a) => !a.startsWith('--')) || '.';

run(dryRun, scanDir, '.ignore/reports/vocation-rename-log.json')
  .then(() => { console.log('\nDone.'); process.exit(0); })
  .catch((err) => { console.error('Fatal:', err); process.exit(1); });
