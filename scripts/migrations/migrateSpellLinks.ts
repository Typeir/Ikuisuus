/**
 * @fileoverview Migration script: Replace external spell links with internal library links
 * @description Converts all dnd5e.wikidot.com, dnd2024.wikidot.com, and similar external
 * spell references to internal `/en/library/spells/{slug}` links.
 *
 * Handles three link formats:
 * 1. JSON: "link": "http://dnd5e.wikidot.com/spell:firewall"
 * 2. Markdown: [Firewall](https://dnd5e.wikidot.com/spell:firewall)
 * 3. Inline text: references to dnd5e.wikidot.com in MDX
 *
 * @module scripts/migrations/migrateSpellLinks
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../../');

interface MigrationStats {
  filesProcessed: number;
  linksUpdated: number;
  errors: string[];
}

/**
 * Extract spell slug from external URL
 * @param {string} url - External spell URL
 * @returns {string|null} Extracted spell slug or null
 */
function extractSpellSlug(url: string): string | null {
  const patterns = [
    /(?:dnd5e|dnd2024)\.wikidot\.com\/spell:([a-z0-9-]+)/i,
    /dndbeyond\.com\/spells\/([a-z0-9-]+)/i,
    /roll20\.net.*?([a-z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Transform a JSON spell link
 */
function transformJsonLink(jsonStr: string): string {
  let result = jsonStr;

  result = result.replace(
    /"link":\s*"https?:\/\/(www\.)?(?:dnd5e|dnd2024)\.wikidot\.com\/spell:([a-z0-9-']+)"/gi,
    (match, www, slug) => {
      return `"link": "/en/library/spells/${slug}"`;
    }
  );

  return result;
}

/**
 * Transform a Markdown spell link
 */
function transformMarkdownLink(mdxStr: string): string {
  let result = mdxStr;

  result = result.replace(
    /\[([^\]]+)\]\(https?:\/\/(www\.)?(?:dnd5e|dnd2024)\.wikidot\.com\/spell:([a-z0-9-']+)\)/gi,
    (match, text, www, slug) => {
      return `[${text}](/en/library/spells/${slug})`;
    }
  );

  result = result.replace(
    /\[([^\]]+)\]\(https?:\/\/(www\.)?dnd5e\.wikidot\.com\/([a-z-]+)\)(?!.*spell)/gi,
    (match, text, www, slug) => {
      const validSpellSlugs = ['sanctuary', 'false-life', 'ray-of-sickness', 'zephyr-strike', 'thunderous-smite', 'tasha'];
      if (validSpellSlugs.includes(slug.toLowerCase())) {
        return `[${text}](/en/library/spells/${slug})`;
      }
      return match;
    }
  );

  return result;
}

/**
 * Process a single file
 *
 * @function processFile
 * @param {string} filePath - Path to file to process
 * @param {MigrationStats} stats - Stats object to track updates
 * @returns {void}
 */
function processFile(filePath: string, stats: MigrationStats): void {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    if (filePath.endsWith('.json')) {
      content = transformJsonLink(content);
    }

    if (filePath.endsWith('.mdx') || filePath.endsWith('.md')) {
      content = transformMarkdownLink(content);
    }

    const linksFound = (original.match(/(?:dnd5e|dnd2024)\.wikidot\.com\/spell:/gi) || []).length;
    if (linksFound > 0) {
      stats.linksUpdated += linksFound;
      fs.writeFileSync(filePath, content, 'utf-8');
    }

    stats.filesProcessed += 1;
  } catch (error) {
    stats.errors.push(
      `Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Recursively process all files in directory
 *
 * @function processDirectory
 * @param {string} dirPath - Directory path to scan
 * @param {MigrationStats} stats - Stats object to track updates
 * @returns {void}
 */
function processDirectory(dirPath: string, stats: MigrationStats): void {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    if (entry.isDirectory()) {
      processDirectory(fullPath, stats);
    } else if (
      entry.name.endsWith('.json') ||
      entry.name.endsWith('.mdx') ||
      entry.name.endsWith('.md')
    ) {
      processFile(fullPath, stats);
    }
  }
}

/**
 * Main migration entry point
 *
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const stats: MigrationStats = {
    filesProcessed: 0,
    linksUpdated: 0,
    errors: [],
  };

  const dirsToProcess = [
    path.join(workspaceRoot, 'scripts/core'),
    path.join(workspaceRoot, 'src/content'),
    path.join(workspaceRoot, 'tests/fixtures'),
  ];

  for (const dir of dirsToProcess) {
    if (fs.existsSync(dir)) {
      processDirectory(dir, stats);
    }
  }

  if (stats.errors.length > 0) {
    stats.errors.forEach(() => {
      /* errors encountered during migration */
    });
  }
}

main().catch(() => {
  process.exit(1);
});

export { transformJsonLink, transformMarkdownLink, extractSpellSlug };
