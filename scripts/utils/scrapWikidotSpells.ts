/**
 * @fileoverview Wikidot Spell Scraper - Automated D&D spell metadata extraction
 * @description Scrapes spell data from dnd5e.wikidot.com spell lists and individual spell pages.
 * Generates a single external.metadata.json file matching the structure produced by
 * generateSpellMetadata.
 *
 * @version 1.1.0
 * @since 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/utils/scrapWikidotSpells.ts
 * ```
 */

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { createLogger } from '@/lib/logging/logger';

const log = createLogger({ script: 'scrapWikidotSpells' });

const INPUT_HTML = './scripts/utils/wikidotspelllist.html';
const OUTPUT_FILE = './scripts/core/spells-external.metadata.json';

const cleanAll = false;

/** Raw spell data extracted from a table row */
interface SpellRowData {
  /** Spell display name */
  name: string;
  /** Slug derived from href */
  slug: string | null;
  /** School of magic */
  school: string;
  /** Raw casting time text */
  castingTime: string;
  /** Range text */
  range: string;
  /** Duration text */
  duration: string;
  /** Components text (V, S, M) */
  components: string;
  /** Spell level (0 = cantrip) */
  level: number;
  /** Whether the spell has a ritual tag */
  hasRitual: boolean;
}

/** Processed spell metadata */
interface SpellMetadata {
  /** Kebab-case slug */
  slug: string;
  /** Display title */
  title: string;
  /** Source file */
  file: string;
  /** URL link */
  link: string;
  /** Spell level */
  level: number;
  /** School of magic */
  school: string;
  /** Raw casting time string */
  castingTimeRaw: string;
  /** Parsed casting time keywords */
  castingTime: string[];
  /** Range text */
  range: string;
  /** Requires concentration */
  concentration: boolean;
  /** Duration text */
  duration: string;
  /** Has verbal component */
  verbal: boolean;
  /** Has somatic component */
  somatic: boolean;
  /** Has material component */
  material: boolean;
  /** Material component description */
  materialDescription?: string;
  /** Has ritual casting option */
  hasRitual: boolean;
  /** Generated tags */
  tags: string[];
}

/**
 * Converts spell name to kebab-case slug.
 *
 * @param name - Spell display name
 * @returns Kebab-cased slug
 */
const toKebabCase = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Parses casting time string into structured array.
 *
 * @param castingTime - Raw casting time text
 * @returns Array of action economy keywords
 */
const parseCastingTimeToArray = (castingTime: string): string[] => {
  const lower = castingTime.toLowerCase();
  const result: string[] = [];

  if (lower.includes('bonus action')) {
    result.push('bonus action');
  }
  if (lower.includes('action') && !lower.includes('bonus action')) {
    result.push('action');
  }
  if (lower.includes('reaction')) {
    result.push('reaction');
  }
  if (lower.includes('minute')) result.push('minute');
  if (lower.includes('hour')) result.push('hour');
  if (lower.includes('day')) result.push('day');
  if (lower.includes('ritual')) result.push('ritual');

  return result.length > 0 ? result : ['action'];
};

/**
 * Generates tags from spell metadata following project standards.
 *
 * @param metadata - Partial spell metadata
 * @returns Array of tags
 */
const generateTags = (metadata: {
  level: number;
  school: string;
  concentration: boolean;
  hasRitual: boolean;
  verbal: boolean;
  somatic: boolean;
  material: boolean;
}): string[] => {
  const tags: string[] = [];

  if (metadata.level === 0) {
    tags.push('level:cantrip');
  } else {
    tags.push(`level:${metadata.level}`);
  }

  if (metadata.school) {
    tags.push(`school:${metadata.school.toLowerCase()}`);
  }

  if (metadata.concentration) {
    tags.push('mechanic:concentration');
  }

  if (metadata.hasRitual) {
    tags.push('mechanic:ritual');
  }

  if (metadata.verbal) tags.push('component:verbal');
  if (metadata.somatic) tags.push('component:somatic');
  if (metadata.material) tags.push('component:material');

  return [...new Set(tags)];
};

/**
 * Extracts spell metadata from table row data.
 *
 * @param rowData - Data extracted from table row
 * @returns Parsed spell metadata
 */
const extractSpellMetadata = (rowData: SpellRowData): SpellMetadata => {
  const slug = rowData.slug || toKebabCase(rowData.name);
  const wikidotUrl = `http://dnd5e.wikidot.com/spell:${slug}`;

  const hasRitual = rowData.hasRitual || false;

  const metadata: SpellMetadata = {
    slug,
    title: rowData.name,
    file: 'external',
    link: wikidotUrl,
    level: rowData.level || 0,
    school: rowData.school || '',
    castingTimeRaw: rowData.castingTime || '',
    castingTime: parseCastingTimeToArray(rowData.castingTime || ''),
    range: rowData.range || '',
    concentration: /concentration/i.test(rowData.duration || ''),
    duration: rowData.duration || '',
    verbal: false,
    somatic: false,
    material: false,
    hasRitual,
    tags: [],
  };

  const components = rowData.components || '';
  metadata.verbal = /\bV\b/i.test(components);
  metadata.somatic = /\bS\b/i.test(components);
  metadata.material = /\bM\b/i.test(components);

  const materialMatch = components.match(/\bM\s*\(([^)]+)\)/i);
  if (materialMatch) {
    metadata.materialDescription = materialMatch[1].trim();
  }

  metadata.tags = generateTags(metadata);

  return metadata;
};

if (cleanAll && fs.existsSync(OUTPUT_FILE)) {
  log.message('🧹 Deleting existing file', { path: OUTPUT_FILE });
  fs.unlinkSync(OUTPUT_FILE);
}

/**
 * Loads existing metadata from file, or returns empty array.
 *
 * @returns Existing metadata array
 */
const loadExistingMetadata = (): SpellMetadata[] => {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
      return JSON.parse(content);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.warning('⚠️  Failed to parse existing metadata', { error: msg });
      return [];
    }
  }
  return [];
};

/**
 * Writes metadata array to file.
 *
 * @param metadata - Current metadata array
 */
const saveMetadata = (metadata: SpellMetadata[]): void => {
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metadata, null, 2), 'utf8');
};

/**
 * Extracts spell data from HTML DOM.
 *
 * @param document - DOM document to parse
 * @returns Array of spell data objects
 */
const extractSpellsFromDOM = (document: Document): SpellRowData[] => {
  const tabDivs = document.querySelectorAll(
    '.yui-content > div[id^="wiki-tab-0-"]',
  );
  const allSpells: SpellRowData[] = [];

  tabDivs.forEach((tabDiv, tabIndex) => {
    const level = tabIndex;
    const rows = tabDiv.querySelectorAll('table.wiki-content-table tbody tr');

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 6) return;

      const nameCell = cells[0].querySelector('a');
      const name = nameCell
        ? nameCell.textContent?.trim() ?? ''
        : cells[0].textContent?.trim() ?? '';

      let slug: string | null = null;
      if (nameCell && nameCell.getAttribute('href')) {
        const href = nameCell.getAttribute('href')!;
        slug = href.replace(/^\/spell:/, '');
      }

      const schoolCell = cells[1].querySelector('em');
      const school = schoolCell
        ? schoolCell.textContent?.trim() ?? ''
        : cells[1].textContent?.trim() ?? '';

      const castingTimeCell = cells[2];
      const castingTimeRaw = castingTimeCell?.textContent?.trim() ?? '';
      const hasRitualInCastingTime =
        castingTimeCell?.innerHTML.includes('<sup>R</sup>') || false;

      allSpells.push({
        name,
        slug,
        school,
        castingTime: castingTimeRaw,
        range: cells[3]?.textContent?.trim() ?? '',
        duration: cells[4]?.textContent?.trim() ?? '',
        components: cells[5]?.textContent?.trim() ?? '',
        level,
        hasRitual: hasRitualInCastingTime,
      });
    });
  });

  return allSpells.filter(
    (spell) => spell && spell.name && spell.name.length > 0,
  );
};

/**
 * Main scraping orchestrator.
 */
(async () => {
  let spellsData: SpellRowData[] = [];

  if (fs.existsSync(INPUT_HTML)) {
    log.message('📂 Using local HTML file', { path: INPUT_HTML });
    const htmlContent = fs.readFileSync(INPUT_HTML, 'utf8');
    const dom = new JSDOM(htmlContent);
    spellsData = extractSpellsFromDOM(dom.window.document);
    log.message('✨ Found spells in local file', { count: spellsData.length });
  } else {
    log.error('🌐 Local HTML file not found. Place wikidotspelllist.html in scripts/utils/');
    process.exit(1);
  }

  let allMetadata = loadExistingMetadata();
  const existingSlugs = new Set(allMetadata.map((m) => m.slug));

  log.message('📦 Loaded existing entries', { count: allMetadata.length });

  const processedSpells = new Set<string>();
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const spellData of spellsData) {
    if (processedSpells.has(spellData.name)) {
      continue;
    }
    processedSpells.add(spellData.name);

    const slug = toKebabCase(spellData.name);

    if (existingSlugs.has(slug)) {
      log.message('⏭️  Skipping (already scraped)', { spell: spellData.name });
      skipCount++;
      continue;
    }

    try {
      log.message('📜 Processing', { spell: spellData.name });

      const metadata = extractSpellMetadata(spellData);

      allMetadata.push(metadata);
      existingSlugs.add(metadata.slug);

      saveMetadata(allMetadata);

      log.message('✅ Saved spell', {
        level: metadata.level,
        school: metadata.school,
        ritual: metadata.hasRitual,
        total: allMetadata.length,
      });
      successCount++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('❌ Failed to process', {
        spell: spellData.name,
        error: msg,
      });
      errorCount++;
    }
  }

  log.message('Scraping complete', {
    success: successCount,
    skipped: skipCount,
    failed: errorCount,
    outputFile: OUTPUT_FILE,
    totalEntries: allMetadata.length,
  });
})();
