/**
 * @fileoverview Wikidot Spell List Scraper - Scrapes class spell lists from dnd5e.wikidot.com
 * @description Navigates to dnd5e.wikidot.com/spells:{className}, extracts spell slugs from
 * each level tab's table, and generates a spells.mdx file matching the project's SpellTable
 * component format. Runs against all vanilla D&D 5e spellcasting classes.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires playwright
 * @requires fs
 * @requires path
 *
 * @example
 * ```bash
 * # Scrape all vanilla classes
 * node scripts/utils/scrapWikidotSpellList.mjs
 *
 * # Scrape a single class
 * node scripts/utils/scrapWikidotSpellList.mjs wizard
 * ```
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { createLogger } from '../core/logger.mjs';

const log = createLogger({ script: 'scrapWikidotSpellList' });

/** @type {string} Base URL for wikidot spell list pages */
const BASE_URL = 'https://dnd5e.wikidot.com/spells';

/** @type {string} Base output directory for generated MDX files */
const OUTPUT_BASE = './src/content/en/character-creation/vocations';

/**
 * All vanilla D&D 5e classes that have spell lists on wikidot.
 * @type {string[]}
 */
const VANILLA_CLASSES = [
  'bard',
  'cleric',
  'druid',
  'paladin',
  'ranger',
  'sorcerer',
  'warlock',
  'wizard',
];

/**
 * Spellcasting ability modifier per class, used in the MDX flavor text.
 * @type {Record<string, string>}
 */
const CLASS_ABILITY = {
  bard: 'Charisma',
  cleric: 'Wisdom',
  druid: 'Wisdom',
  paladin: 'Charisma',
  ranger: 'Wisdom',
  sorcerer: 'Charisma',
  warlock: 'Charisma',
  wizard: 'Intelligence',
};

/**
 * Minimum spell level per class (some half-casters start at 1st, not cantrips).
 * @type {Record<string, number>}
 */
const CLASS_MIN_LEVEL = {
  bard: 0,
  cleric: 0,
  druid: 0,
  paladin: 1,
  ranger: 1,
  sorcerer: 0,
  warlock: 0,
  wizard: 0,
};

/**
 * Maximum spell level per class.
 * @type {Record<string, number>}
 */
const CLASS_MAX_LEVEL = {
  bard: 9,
  cleric: 9,
  druid: 9,
  paladin: 5,
  ranger: 5,
  sorcerer: 9,
  warlock: 9,
  wizard: 9,
};

/**
 * Converts a spell name to a kebab-case slug.
 *
 * @param {string} name - Display name of the spell (e.g. "Acid Splash")
 * @returns {string} Kebab-cased slug (e.g. "acid-splash")
 */
const toKebabCase = (name) => {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Maximum number of retry attempts per class page.
 * @type {number}
 */
const MAX_RETRIES = 3;

/**
 * Scrapes spell names from a single class spell list page on wikidot.
 * Clicks through each tab in the .yui-navset (wiki-tabview) to reveal all level tables,
 * then extracts the first-column link text from each table row.
 * Retries up to MAX_RETRIES times on failure.
 *
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {string} className - Class name (e.g. "wizard")
 * @param {number} [attempt=1] - Current attempt number
 * @returns {Promise<string[]>} Array of kebab-cased spell slugs, in level order
 */
async function scrapeClassSpells(page, className, attempt = 1) {
  const url = `${BASE_URL}:${className}`;
  log.message(
    `\n📖 Navigating to ${url}${attempt > 1 ? ` (attempt ${attempt}/${MAX_RETRIES})` : ''}`,
  );

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  /** Wait for the tab container to be present */
  try {
    await page.waitForSelector('.yui-navset', { timeout: 15000 });
  } catch {
    if (attempt < MAX_RETRIES) {
      log.message(`  ⚠️ Tab container not found, retrying...`);
      await page.waitForTimeout(2000);
      return scrapeClassSpells(page, className, attempt + 1);
    }
    throw new Error(
      `Tab container .yui-navset not found after ${MAX_RETRIES} attempts`,
    );
  }

  /** Get all tab buttons */
  const tabs = await page.$$('.yui-navset .yui-nav li a');
  log.message(`  Found ${tabs.length} spell level tabs`);

  /** @type {string[]} All spell slugs across all levels */
  const allSpells = [];

  for (let i = 0; i < tabs.length; i++) {
    /** Click the tab to reveal its content */
    const tabButtons = await page.$$('.yui-navset .yui-nav li a');
    await tabButtons[i].click();

    /** Brief pause for tab content to render */
    await page.waitForTimeout(500);

    /** Get all visible tab content panels */
    const activePanel = await page.$(
      '.yui-navset .yui-content > div:not([style*="display: none"])',
    );

    if (!activePanel) {
      log.message(`  ⚠️ No active panel for tab ${i}`);
      continue;
    }

    /**
     * Extract spell names from the first column links in the table.
     * Each row's first cell contains an anchor with the spell name as text.
     */
    const spellNames = await activePanel.$$eval(
      'table tr td:first-child a',
      (anchors) => anchors.map((a) => a.textContent.trim()),
    );

    const slugs = spellNames.map(toKebabCase).filter((s) => s.length > 0);
    log.message(`  Tab ${i}: ${slugs.length} spells`);
    allSpells.push(...slugs);
  }

  return allSpells;
}

/**
 * Generates the MDX file content for a class spell list, matching the project's
 * SpellTable component format.
 *
 * @param {string} className - Class name (e.g. "wizard")
 * @param {string[]} spells - Array of kebab-cased spell slugs
 * @returns {string} Complete MDX file content
 */
function generateMdx(className, spells) {
  const displayName = capitalize(className);
  const ability = CLASS_ABILITY[className] || 'Charisma';
  const minLevel = CLASS_MIN_LEVEL[className] ?? 0;
  const maxLevel = CLASS_MAX_LEVEL[className] ?? 9;

  const levels = [];
  for (let i = minLevel; i <= maxLevel; i++) {
    levels.push(i);
  }

  const spellEntries = spells.map((s) => `  "${s}",`).join('\n');

  return `# ${displayName} Spell List

The following spells are available to ${displayName}s. As a ${displayName}, you learn spells from this list as you gain levels. Your spell save DC and spell attack bonus use your ${ability} modifier.

## Spell List by Level

<SpellTable sources={["/api/spells"]} locale="en" levels={[${levels.join(', ')}]} spells={[
${spellEntries}
]}/>
`;
}

/**
 * Main entry point. Launches a browser, scrapes spell lists for all specified classes,
 * and writes MDX files to the output directory.
 *
 * @returns {Promise<void>}
 */
async function main() {
  /** Determine which classes to scrape from CLI args or default to all */
  const args = process.argv.slice(2);
  const classesToScrape =
    args.length > 0 ? args.map((a) => a.toLowerCase()) : VANILLA_CLASSES;

  log.message('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  /** @type {Record<string, number>} Summary of spells scraped per class */
  const summary = {};

  for (const className of classesToScrape) {
    try {
      const spells = await scrapeClassSpells(page, className);
      const mdx = generateMdx(className, spells);

      const outputDir = path.join(OUTPUT_BASE, className);
      fs.mkdirSync(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, 'spells.mdx');
      fs.writeFileSync(outputPath, mdx, 'utf-8');

      summary[className] = spells.length;
      log.message(
        `  ✅ ${capitalize(className)}: ${spells.length} spells → ${outputPath}`,
      );
    } catch (error) {
      log.error(`  ❌ Failed to scrape ${className}`, { error: error.message });
      summary[className] = -1;
    }
  }

  await browser.close();

  log.message('\n📊 Summary:');
  for (const [cls, count] of Object.entries(summary)) {
    const status = count >= 0 ? `${count} spells` : 'FAILED';
    log.message(`  ${capitalize(cls)}: ${status}`);
  }
  log.message('\n✅ Done!');
}

main().catch((error) => {
  log.error('❌ Fatal error', { error: error.message || String(error) });
  process.exit(1);
});
