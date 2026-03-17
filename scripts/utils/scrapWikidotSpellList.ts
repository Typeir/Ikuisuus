/**
 * @fileoverview Wikidot Spell List Scraper - Scrapes class spell lists from dnd5e.wikidot.com
 * @description Navigates to dnd5e.wikidot.com/spells:{className}, extracts spell slugs from
 * each level tab's table, and generates a spells.mdx file matching the project's SpellTable
 * component format.
 *
 * @version 1.0.0
 * @since 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/utils/scrapWikidotSpellList.ts wizard
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';
import { chromium, type Page } from 'playwright';

const log = createLogger({ script: 'scrapWikidotSpellList' });

/** Base URL for wikidot spell list pages */
const BASE_URL = 'https://dnd5e.wikidot.com/spells';

/** Base output directory for generated MDX files */
const OUTPUT_BASE = './src/content/en/character-creation/vocations';

/** All vanilla D&D 5e classes that have spell lists on wikidot. */
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

/** Spellcasting ability modifier per class */
const CLASS_ABILITY: Record<string, string> = {
  bard: 'Charisma',
  cleric: 'Wisdom',
  druid: 'Wisdom',
  paladin: 'Charisma',
  ranger: 'Wisdom',
  sorcerer: 'Charisma',
  warlock: 'Charisma',
  wizard: 'Intelligence',
};

/** Minimum spell level per class */
const CLASS_MIN_LEVEL: Record<string, number> = {
  bard: 0,
  cleric: 0,
  druid: 0,
  paladin: 1,
  ranger: 1,
  sorcerer: 0,
  warlock: 0,
  wizard: 0,
};

/** Maximum spell level per class */
const CLASS_MAX_LEVEL: Record<string, number> = {
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
 * @param name - Display name of the spell
 * @returns Kebab-cased slug
 */
const toKebabCase = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Capitalizes the first letter of a string.
 *
 * @param str - Input string
 * @returns Capitalized string
 */
const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

/** Maximum number of retry attempts per class page */
const MAX_RETRIES = 3;

/**
 * Scrapes spell names from a single class spell list page on wikidot.
 *
 * @param page - Playwright page instance
 * @param className - Class name (e.g. "wizard")
 * @param attempt - Current attempt number
 * @returns Array of kebab-cased spell slugs
 */
async function scrapeClassSpells(
  page: Page,
  className: string,
  attempt = 1,
): Promise<string[]> {
  const url = `${BASE_URL}:${className}`;
  log.message(
    `\n📖 Navigating to ${url}${attempt > 1 ? ` (attempt ${attempt}/${MAX_RETRIES})` : ''}`,
  );

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

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

  const tabs = await page.$$('.yui-navset .yui-nav li a');
  log.message(`  Found ${tabs.length} spell level tabs`);

  const allSpells: string[] = [];

  for (let i = 0; i < tabs.length; i++) {
    const tabButtons = await page.$$('.yui-navset .yui-nav li a');
    await tabButtons[i].click();
    await page.waitForTimeout(500);

    const activePanel = await page.$(
      '.yui-navset .yui-content > div:not([style*="display: none"])',
    );

    if (!activePanel) {
      log.message(`  ⚠️ No active panel for tab ${i}`);
      continue;
    }

    const spellNames = await activePanel.$$eval(
      'table tr td:first-child a',
      (anchors) => anchors.map((a) => a.textContent?.trim() ?? ''),
    );

    const slugs = spellNames.map(toKebabCase).filter((s) => s.length > 0);
    log.message(`  Tab ${i}: ${slugs.length} spells`);
    allSpells.push(...slugs);
  }

  return allSpells;
}

/**
 * Generates the MDX file content for a class spell list.
 *
 * @param className - Class name
 * @param spells - Array of kebab-cased spell slugs
 * @returns Complete MDX file content
 */
function generateMdx(className: string, spells: string[]): string {
  const displayName = capitalize(className);
  const ability = CLASS_ABILITY[className] || 'Charisma';
  const minLevel = CLASS_MIN_LEVEL[className] ?? 0;
  const maxLevel = CLASS_MAX_LEVEL[className] ?? 9;

  const levels: number[] = [];
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
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const classesToScrape =
    args.length > 0 ? args.map((a) => a.toLowerCase()) : VANILLA_CLASSES;

  log.message('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const summary: Record<string, number> = {};

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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      log.error(`  ❌ Failed to scrape ${className}`, { error: msg });
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

main().catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  log.error('❌ Fatal error', { error: msg });
  process.exit(1);
});
