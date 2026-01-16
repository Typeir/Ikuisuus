/**
 * @fileoverview Wikidot Spell Scraper - Automated D&D spell metadata extraction
 * @description Scrapes spell data from dnd5e.wikidot.com spell lists and individual spell pages.
 * Generates a single external.metadata.json file matching the structure produced by
 * generateSpellMetadata.mjs. Includes level, school, casting time, range, components,
 * duration, concentration, ritual detection, and auto-generated tags.
 * 
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires fs
 * @requires path
 * @requires playwright
 * 
 * @example
 * ```bash
 * # Scrape all spells from Wikidot into metadata JSON
 * node scripts/utils/scrapWikidotSpells.js
 * ```
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { JSDOM } = require('jsdom');

const INPUT_HTML = './scripts/utils/wikidotspelllist.html';
const SPELL_LIST_URL = 'http://dnd5e.wikidot.com/spells';
const OUTPUT_FILE = './scripts/core/spells-external.metadata.json';

// Set to true to delete and re-scrape everything
const cleanAll = false;

/**
 * Converts spell name to kebab-case slug.
 * 
 * @param {string} name - Spell display name
 * @returns {string} Kebab-cased slug
 */
const toKebabCase = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Parses casting time string into structured array.
 * Focuses on action economy keywords (bonus action, action, reaction).
 * 
 * @param {string} castingTime - Raw casting time text
 * @returns {string[]} Array of action economy keywords
 */
const parseCastingTimeToArray = (castingTime) => {
  const lower = castingTime.toLowerCase();
  const result = [];
  
  // Priority order: bonus action > action > reaction > time durations > ritual
  if (lower.includes('bonus action')) {
    result.push('bonus action');
  }
  if (lower.includes('action') && !lower.includes('bonus action')) {
    result.push('action');
  }
  if (lower.includes('reaction')) {
    result.push('reaction');
  }
  
  // Time durations
  if (lower.includes('minute')) result.push('minute');
  if (lower.includes('hour')) result.push('hour');
  if (lower.includes('day')) result.push('day');
  
  // Ritual
  if (lower.includes('ritual')) result.push('ritual');
  
  return result.length > 0 ? result : ['action']; // Default to action
};

/**
 * Generates tags from spell metadata following project standards.
 * Mirrors the tagging logic from generateSpellMetadata.mjs
 * 
 * @param {{level: number, school: string, castingTime: string[], range: string, components: string, duration: string, concentration: boolean, verbal: boolean, somatic: boolean, material: boolean, hasRitual: boolean}} metadata - Spell metadata
 * @returns {string[]} Array of tags (e.g., ["level:3", "school:evocation", "component:verbal"])
 */
const generateTags = (metadata) => {
  const tags = [];
  
  // Level tag
  if (metadata.level === 0) {
    tags.push('level:cantrip');
  } else {
    tags.push(`level:${metadata.level}`);
  }
  
  // School tag
  if (metadata.school) {
    tags.push(`school:${metadata.school.toLowerCase()}`);
  }
  
  // Concentration
  if (metadata.concentration) {
    tags.push('mechanic:concentration');
  }
  
  // Ritual casting
  if (metadata.hasRitual) {
    tags.push('mechanic:ritual');
  }
  
  // Components
  if (metadata.verbal) tags.push('component:verbal');
  if (metadata.somatic) tags.push('component:somatic');
  if (metadata.material) tags.push('component:material');
  
  return [...new Set(tags)]; // Remove duplicates
};

/**
 * Extracts spell metadata from table row data and per-spell HTML content.
 * Parses table cells to create metadata object matching generateSpellMetadata.mjs output.
 * 
 * @param {{name: string, school: string, castingTime: string, range: string, duration: string, components: string, level: number}} rowData - Data extracted from table row
 * @param {string} spellHtmlContent - HTML content for THIS SPECIFIC SPELL (not entire page)
 * @returns {{slug: string, title: string, file: string, link: string, level: number, school: string, castingTimeRaw: string, castingTime: string[], range: string, concentration: boolean, duration: string, verbal: boolean, somatic: boolean, material: boolean, materialDescription?: string, hasRitual: boolean, tags: string[]}} Parsed spell metadata
 */
const extractSpellMetadata = (rowData, spellHtmlContent = '') => {
  // Use slug from rowData if available (extracted from href), otherwise derive from name
  const slug = rowData.slug || toKebabCase(rowData.name);
  const wikidotUrl = `http://dnd5e.wikidot.com/spell:${slug}`;
  
  // Use the ritual flag extracted from the table row's casting time cell
  const hasRitual = rowData.hasRitual || false;
  
  const metadata = {
    slug: slug,
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
    hasRitual: hasRitual
  };

  // Parse components
  const components = rowData.components || '';
  metadata.verbal = /\bV\b/i.test(components);
  metadata.somatic = /\bS\b/i.test(components);
  metadata.material = /\bM\b/i.test(components);
  
  // Extract material description from parentheses
  const materialMatch = components.match(/\bM\s*\(([^)]+)\)/i);
  if (materialMatch) {
    metadata.materialDescription = materialMatch[1].trim();
  }

  // Generate tags
  metadata.tags = generateTags(metadata);

  return metadata;
};

// Handle cleanAll
if (cleanAll && fs.existsSync(OUTPUT_FILE)) {
  console.log(`🧹 Deleting existing file: ${OUTPUT_FILE}`);
  fs.unlinkSync(OUTPUT_FILE);
}

/**
 * Loads existing metadata from file, or returns empty array if file doesn't exist.
 * 
 * @returns {Array} Existing metadata array
 */
const loadExistingMetadata = () => {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.warn(`⚠️  Failed to parse existing metadata: ${err.message}`);
      return [];
    }
  }
  return [];
};

/**
 * Writes metadata array to file immediately after each scrape.
 * 
 * @param {Array} metadata - Current metadata array
 * @returns {void}
 */
const saveMetadata = (metadata) => {
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metadata, null, 2), 'utf8');
};

/**
 * Extracts spell data from HTML (either local file or fetched page).
 * 
 * @param {Document} document - DOM document to parse
 * @returns {Array} Array of spell data objects
 */
const extractSpellsFromDOM = (document) => {
  const tabDivs = document.querySelectorAll('.yui-content > div[id^="wiki-tab-0-"]');
  const allSpells = [];
  
  tabDivs.forEach((tabDiv, tabIndex) => {
    const level = tabIndex; // Tab 0 = cantrips (level 0), Tab 1 = 1st level, etc.
    const rows = tabDiv.querySelectorAll('table.wiki-content-table tbody tr');
    
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 6) return; // Skip header rows
      
      // Extract spell name link and get both name and href
      const nameCell = cells[0].querySelector('a');
      const name = nameCell ? nameCell.textContent.trim() : cells[0].textContent.trim();
      
      // Extract slug directly from href (e.g., "/spell:hand-of-radiance" -> "hand-of-radiance")
      let slug = null;
      if (nameCell && nameCell.getAttribute('href')) {
        const href = nameCell.getAttribute('href');
        slug = href.replace(/^\/spell:/, '');
      }
      
      // Extract school (remove <em> tags)
      const schoolCell = cells[1].querySelector('em');
      const school = schoolCell ? schoolCell.textContent.trim() : cells[1].textContent.trim();
      
      // Extract casting time and check for ritual indicator
      const castingTimeCell = cells[2];
      const castingTimeRaw = castingTimeCell?.textContent.trim() || '';
      const hasRitualInCastingTime = castingTimeCell?.innerHTML.includes('<sup>R</sup>') || false;
      
      allSpells.push({
        name: name,
        slug: slug,
        school: school,
        castingTime: castingTimeRaw,
        range: cells[3]?.textContent.trim() || '',
        duration: cells[4]?.textContent.trim() || '',
        components: cells[5]?.textContent.trim() || '',
        level: level,
        hasRitual: hasRitualInCastingTime
      });
    });
  });
  
  return allSpells.filter((spell) => spell && spell.name && spell.name.length > 0);
};

/**
 * Main scraping orchestrator.
 * Uses local HTML file if available, falls back to fetching from Wikidot.
 * Ritual detection via <sup>R</sup> happens in extractSpellsFromDOM.
 * WRITES TO DISK AFTER EACH SPELL to prevent data loss from IP blocks.
 * 
 * @returns {Promise<void>}
 */
(async () => {
  let spellsData = [];
  
  // Try to use local HTML file first
  if (fs.existsSync(INPUT_HTML)) {
    console.log(`📂 Using local HTML file: ${INPUT_HTML}`);
    const htmlContent = fs.readFileSync(INPUT_HTML, 'utf8');
    const dom = new JSDOM(htmlContent);
    spellsData = extractSpellsFromDOM(dom.window.document);
    console.log(`✨ Found ${spellsData.length} spells in local file\n`);
  } else {
    // Fallback to scraping from website
    console.log(`🌐 Local file not found, fetching from ${SPELL_LIST_URL}`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(SPELL_LIST_URL);
    await page.waitForSelector('.yui-content');

    spellsData = await page.evaluate(() => {
      return extractSpellsFromDOM(document);
    });

    await page.close();
    console.log(`✨ Found ${spellsData.length} spells from website\n`);
  }

  // Load existing metadata to resume from interruptions
  let allMetadata = loadExistingMetadata();
  const existingSlugs = new Set(allMetadata.map(m => m.slug));
  
  console.log(`📦 Loaded ${allMetadata.length} existing entries\n`);

  const processedSpells = new Set();
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const spellData of spellsData) {
    // Skip duplicates in current run
    if (processedSpells.has(spellData.name)) {
      continue;
    }
    processedSpells.add(spellData.name);

    const slug = toKebabCase(spellData.name);
    
    // Skip if already scraped previously
    if (existingSlugs.has(slug)) {
      console.log(`  ⏭️  Skipping (already scraped): ${spellData.name}`);
      skipCount++;
      continue;
    }

    try {
      console.log(`  📜 Processing: ${spellData.name}`);
      
      // Extract metadata from table row data (ritual already detected in extractSpellsFromDOM)
      const metadata = extractSpellMetadata(spellData, '');
      
      // Add to array
      allMetadata.push(metadata);
      existingSlugs.add(metadata.slug);
      
      // SAVE IMMEDIATELY AFTER EACH SPELL
      saveMetadata(allMetadata);
      
      const ritualTag = metadata.hasRitual ? ' [RITUAL]' : '';
      console.log(`    ✅ Saved: Level ${metadata.level} ${metadata.school}${ritualTag} (${allMetadata.length} total)`);
      successCount++;
      
    } catch (err) {
      console.error(`    ❌ Failed to process ${spellData.name}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Successfully scraped: ${successCount} spells`);
  console.log(`⏭️  Skipped (already scraped): ${skipCount} spells`);
  console.log(`❌ Failed: ${errorCount} spells`);
  console.log(`📁 Output file: ${OUTPUT_FILE}`);
  console.log(`📊 Total metadata entries: ${allMetadata.length}`);
  console.log(`${'='.repeat(50)}\n`);
})();
