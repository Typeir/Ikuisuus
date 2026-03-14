/**
 * Spell Metadata Generator
 *
 * @fileoverview Specialized parser for D&D spell entries in MDX format.
 * Extracts structured metadata including spell level, school of magic, casting time,
 * range, components, duration, concentration requirements, and gameplay mechanics tags.
 *
 * @module generateSpellMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires fs.promises File system operations for reading spell files
 * @requires path Path utilities for file manipulation
 * @requires ../core/shared-utils.mjs Performance monitoring and utility functions
 * @requires ../core/shared-data.json Centralized game data and validation patterns
 *
 * @example
 * // Run the spell metadata generator
 * node generateSpellMetadata.mjs
 *
 * // Expected output: Creates .metadata.json files alongside spell .mdx files
 * // with structured data for search, filtering, and display
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../core/logger.mjs';
import {
  GameData,
  MetadataGeneratorUtils,
  ParsingUtils,
  TextUtils,
} from '../core/shared-utils.mjs';

const log = createLogger({ module: 'SpellMetadataGenerator' });

/**
 * Parses spell level and school from italic metadata line
 *
 * @function parseSpellHeader
 * @param {string[]} lines - Array of document lines to search
 * @param {Object} sharedData - Shared game data containing spell schools
 * @returns {{ level?: number, school?: string, quality?: string }} Parsed spell header metadata
 *
 * @description Locates and parses the spell's italic metadata line which follows
 * the D&D 5e format: `_Xth-Level [Quality] School_` or `_Cantrip_`
 *
 * Expected formats:
 * - `_3rd-Level Evocation_`
 * - `_10th-Level Legendary Divination_`
 * - `_Cantrip_`
 * - `_1st-Level Abjuration_`
 *
 * @example
 * // Input: ["_3rd-Level Evocation_"]
 * parseSpellHeader(lines, data) // Returns: { level: 3, school: "Evocation" }
 *
 * // Input: ["_10th-Level Legendary Divination_"]
 * parseSpellHeader(lines, data) // Returns: { level: 10, school: "Divination", quality: "Legendary" }
 *
 * // Input: ["_Cantrip_"]
 * parseSpellHeader(lines, data) // Returns: { level: 0, school: undefined }
 */
function parseSpellHeader(lines, sharedData) {
  const schools = sharedData?.spellData?.schools || [
    'Abjuration',
    'Conjuration',
    'Divination',
    'Enchantment',
    'Evocation',
    'Illusion',
    'Necromancy',
    'Transmutation',
  ];

  const qualities = sharedData?.spellData?.qualities || [
    'Legendary',
    'Epic',
    'Mythic',
    'Ancient',
  ];

  // Find italic line in blockquote that contains spell level/school
  // Support both underscore (_text_) and asterisk (*text*) italic syntax
  // Exclude bold text (**text__ or __text__) by checking line doesn't contain double delimiters
  const italicPattern = /^>\s*[*_](.+?)[*_]\s*$/;
  const italicLine = lines.find((l) => {
    if (!italicPattern.test(l)) return false;
    // Exclude lines with bold markers (**or__)
    if (l.includes('**') || l.includes('__')) return false;
    return true;
  });

  if (!italicLine) {
    return {};
  }

  const match = italicLine.match(italicPattern);
  if (!match) return {};

  const content = TextUtils.clean(match[1]);
  const lowerContent = content.toLowerCase();

  // Check for cantrip (format: "[School] Cantrip" or just "Cantrip")
  if (lowerContent.includes('cantrip')) {
    const result = { level: 0 };

    // Extract school from "[School] Cantrip" format
    const normalizedContent = content.toLowerCase();
    for (const sch of schools) {
      if (normalizedContent.includes(sch.toLowerCase())) {
        result.school = sch; // Store with canonical capitalization
        break;
      }
    }

    return result;
  }

  // Parse level (e.g., "3rd-Level", "10th-Level")
  const levelMatch = content.match(/^(\d+)(?:st|nd|rd|th)-Level/i);
  if (!levelMatch) return {};

  const level = parseInt(levelMatch[1], 10);

  // Extract remaining text after level
  const remainder = content.slice(levelMatch[0].length).trim();

  // Check for quality keyword
  let quality = undefined;
  let schoolText = remainder;

  for (const qual of qualities) {
    if (remainder.toLowerCase().startsWith(qual.toLowerCase())) {
      quality = qual;
      schoolText = remainder.slice(qual.length).trim();
      break;
    }
  }

  // Check for school keyword (case-insensitive)
  let school = undefined;
  const normalizedSchoolText = schoolText.toLowerCase();
  for (const sch of schools) {
    if (normalizedSchoolText.includes(sch.toLowerCase())) {
      school = sch; // Store with canonical capitalization
      break;
    }
  }

  return { level, school, quality };
}

/**
 * Parses spell components from stat block
 *
 * @function parseComponents
 * @param {string[]} lines - Array of document lines
 * @returns {{ verbal?: boolean, somatic?: boolean, material?: boolean, materialDescription?: string }} Component requirements
 *
 * @description Extracts V (verbal), S (somatic), and M (material) components.
 * Material components may include descriptions in parentheses.
 *
 * @example
 * // "**Components**: V, S, M (a diamond worth 1000gp)"
 * parseComponents(lines)
 * // Returns: { verbal: true, somatic: true, material: true, materialDescription: "a diamond worth 1000gp" }
 */
function parseComponents(lines) {
  const componentLine = lines.find((l) => /^>\s*\*\*Components\*\*:/i.test(l));
  if (!componentLine) return {};

  const content = componentLine
    .replace(/^>\s*\*\*Components\*\*:\s*/i, '')
    .trim();

  const result = {
    verbal: /\bV\b/i.test(content),
    somatic: /\bS\b/i.test(content),
    material: /\bM\b/i.test(content),
  };

  // Extract material description from parentheses
  const materialMatch = content.match(/\bM\s*\(([^)]+)\)/i);
  if (materialMatch) {
    result.materialDescription = TextUtils.clean(materialMatch[1]);
  }

  return result;
}

/**
 * Parses casting time, range, and duration from stat block
 *
 * @function parseSpellProperties
 * @param {string[]} lines - Array of document lines
 * @returns {{ castingTime?: string[], castingTimeRaw?: string, range?: string, duration?: string, concentration?: boolean }} Spell properties
 *
 * @description Extracts casting mechanics from stat block lines.
 * Detects concentration requirement in duration field.
 * Parses casting time into structured array focusing on action economy keywords.
 *
 * Recognized casting time formats:
 * - "1 action" → ["action"]
 * - "1 bonus action" → ["bonus action"]
 * - "reaction" → ["reaction"]
 * - "1 action or reaction" → ["action", "reaction"]
 * - "10 minutes" → ["10 minutes"]
 * - "1 hour (ritual)" → ["1 hour", "ritual"]
 *
 * @example
 * // "**Casting Time**: 1 action"
 * // "**Range**: 60 feet"
 * // "**Duration**: Concentration, up to 1 minute"
 * parseSpellProperties(lines)
 * // Returns: { castingTime: ["action"], castingTimeRaw: "1 action", range: "60 feet", duration: "up to 1 minute", concentration: true }
 *
 * @example
 * // "**Casting Time**: 1 action or reaction (trigger: ...)"
 * parseSpellProperties(lines)
 * // Returns: { castingTime: ["action", "reaction"], castingTimeRaw: "1 action or reaction (trigger: ...)", ... }
 */
function parseSpellProperties(lines) {
  const result = {};

  // Casting Time
  const castingTimeLine = lines.find((l) =>
    /^>\s*\*\*Casting Time\*\*:/i.test(l),
  );
  if (castingTimeLine) {
    const rawCastingTime = TextUtils.clean(
      castingTimeLine.replace(/^>\s*\*\*Casting Time\*\*:\s*/i, ''),
    );

    result.castingTimeRaw = rawCastingTime;
    result.castingTime = parseCastingTimeToArray(rawCastingTime);
  }

  // Range
  const rangeLine = lines.find((l) => /^>\s*\*\*Range\*\*:/i.test(l));
  if (rangeLine) {
    result.range = TextUtils.clean(
      rangeLine.replace(/^>\s*\*\*Range\*\*:\s*/i, ''),
    );
  }

  // Duration (check for Concentration)
  const durationLine = lines.find((l) => /^>\s*\*\*Duration\*\*:/i.test(l));
  if (durationLine) {
    const durationText = TextUtils.clean(
      durationLine.replace(/^>\s*\*\*Duration\*\*:\s*/i, ''),
    );

    result.concentration = /\bconcentration\b/i.test(durationText);

    // Remove "Concentration, " prefix if present
    result.duration = durationText.replace(/^concentration,\s*/i, '').trim();
  }

  return result;
}

/**
 * Parses casting time string into structured array of action types
 *
 * @function parseCastingTimeToArray
 * @param {string} rawCastingTime - Raw casting time text from spell
 * @returns {string[]} Array of casting time components
 *
 * @description Extracts D&D 5e action economy keywords and time durations.
 * Handles compound casting times (e.g., "1 action or reaction").
 *
 * Priority keywords (in order):
 * 1. "bonus action"
 * 2. "action"
 * 3. "reaction"
 * 4. "minute(s)", "hour(s)", "round(s)", etc.
 * 5. "ritual"
 *
 * @example
 * parseCastingTimeToArray("1 action")
 * // Returns: ["action"]
 *
 * parseCastingTimeToArray("1 action or reaction (trigger: ...)")
 * // Returns: ["action", "reaction"]
 *
 * parseCastingTimeToArray("10 minutes (ritual)")
 * // Returns: ["10 minutes", "ritual"]
 *
 * parseCastingTimeToArray("Reaction, which you take when...")
 * // Returns: ["reaction"]
 */
function parseCastingTimeToArray(rawCastingTime) {
  if (!rawCastingTime) return [];

  const castingTimes = [];
  const lowerText = rawCastingTime.toLowerCase();

  // Check for bonus action (must check before "action" to avoid false positive)
  if (/\bbonus\s+action\b/i.test(lowerText)) {
    castingTimes.push('bonus action');
  }

  // Check for action (but not bonus action)
  if (
    /\b(?<!bonus\s)action\b/i.test(lowerText) &&
    !castingTimes.includes('bonus action')
  ) {
    castingTimes.push('action');
  }

  // Check for reaction
  if (/\breaction\b/i.test(lowerText)) {
    castingTimes.push('reaction');
  }

  // Check for time durations (minutes, hours, rounds, etc.)
  const timeMatch = rawCastingTime.match(
    /(\d+\s*(?:minute|min|hour|hr|round|day)s?)/i,
  );
  if (timeMatch) {
    castingTimes.push(timeMatch[1].toLowerCase());
  }

  // Check for ritual
  if (/\britual\b/i.test(lowerText)) {
    castingTimes.push('ritual');
  }

  // If nothing matched, return the raw text as a single-element array
  if (castingTimes.length === 0) {
    castingTimes.push(rawCastingTime);
  }

  return castingTimes;
}

/**
 * Generates gameplay tags from spell content
 *
 * @function generateSpellTags
 * @param {string} fullText - Complete spell description text
 * @param {Object} metadata - Parsed spell metadata
 * @param {Object} sharedData - Shared game data
 * @returns {string[]} Array of gameplay tags
 *
 * @description Extracts tags for damage types, conditions, mechanics, and other gameplay elements.
 * Tags follow the format: `type:value` (e.g., `damage:fire`, `school:evocation`, `level:3`)
 *
 * @example
 * generateSpellTags(text, { level: 3, school: "Evocation" }, data)
 * // Returns: ["level:3", "school:evocation", "damage:fire", "mechanic:area"]
 */
function generateSpellTags(fullText, metadata, sharedData) {
  const tags = [];
  const lowerText = fullText.toLowerCase();

  // Level tag
  if (metadata.level !== undefined) {
    if (metadata.level === 0) {
      tags.push('level:cantrip');
    } else {
      tags.push(`level:${metadata.level}`);
    }
  }

  // School tag
  if (metadata.school) {
    tags.push(`school:${metadata.school.toLowerCase()}`);
  }

  // Quality tag (Legendary, Epic, etc.)
  if (metadata.quality) {
    tags.push(`quality:${metadata.quality.toLowerCase()}`);
  }

  // Concentration tag
  if (metadata.concentration) {
    tags.push('mechanic:concentration');
  }

  // Component tags
  if (metadata.verbal) tags.push('component:verbal');
  if (metadata.somatic) tags.push('component:somatic');
  if (metadata.material) tags.push('component:material');

  // Damage type tags
  const damageTypes = GameData.getDamageTypes(sharedData);
  for (const damageType of damageTypes) {
    if (lowerText.includes(damageType.toLowerCase())) {
      tags.push(`damage:${damageType.toLowerCase()}`);
    }
  }

  // Condition tags
  const conditions = GameData.getConditions(sharedData);
  for (const condition of conditions) {
    if (lowerText.includes(condition.toLowerCase())) {
      tags.push(`condition:${condition.toLowerCase()}`);
    }
  }

  // Mechanic tags
  const mechanics = GameData.getMechanicTypes(sharedData);
  for (const mechanic of mechanics) {
    const mechanicLower = mechanic.toLowerCase();
    if (lowerText.includes(mechanicLower)) {
      tags.push(`mechanic:${mechanicLower}`);
    }
  }

  // Ritual casting
  if (/\britual\b/i.test(fullText)) {
    tags.push('mechanic:ritual');
  }

  // Area of effect keywords
  if (/\b(sphere|cube|cone|line|cylinder|radius)\b/i.test(fullText)) {
    tags.push('mechanic:area-of-effect');
  }

  // Saving throw types
  const abilities = GameData.getAbilities(sharedData);
  for (const ability of abilities) {
    const savePattern = new RegExp(
      `\\b${ability.long}\\s+saving\\s+throw\\b`,
      'i',
    );
    if (savePattern.test(fullText)) {
      tags.push(`save:${ability.short.toLowerCase()}`);
    }
  }

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Parses spell lists section from MDX content
 *
 * @function parseSpellLists
 * @param {string} content - Full MDX file content
 * @returns {Array<{name: string, link: string}>} Array of spell list objects
 *
 * @description Extracts spell list references from the "Spell Lists" section.
 * Expected format:
 * #### Spell Lists
 * This spell appears on the following spell lists:
 * - [_Revenant Spell List_](/en/library/character-creation/vocations/revenant/spells.hidden.mdx)
 *
 * @example
 * parseSpellLists(content)
 * // Returns: [{ name: "Revenant", link: "/en/library/character-creation/vocations/revenant/spells.hidden.mdx" }]
 */
function parseSpellLists(content) {
  const spellLists = [];

  // Find the Spell Lists section (match until next heading or end of file)
  const spellListsMatch = content.match(
    /####\s*Spell Lists\s*([\s\S]*?)(?=\n#|$)/i,
  );
  if (!spellListsMatch) return spellLists;

  const spellListsSection = spellListsMatch[1];

  // Extract all markdown links from the section
  // Format: [_Revenant Spell List_](/path/to/link) or [Revenant](/path)
  const linkPattern = /\[_?([^_\]]+?)(?:\s+Spell List)?_?\]\(([^)]+)\)/gi;
  let match;

  while ((match = linkPattern.exec(spellListsSection)) !== null) {
    const rawName = TextUtils.clean(match[1]);
    const link = TextUtils.clean(match[2]);

    // Clean up name - remove "Spell List" suffix if present
    const name = rawName.replace(/\s+Spell List$/i, '').trim();

    spellLists.push({
      name: name,
      link: link,
    });
  }

  return spellLists;
}

/**
 * Parses a single spell MDX file and extracts metadata
 *
 * @async
 * @function parseSpellFile
 * @param {string} filePath - Absolute path to spell .mdx file
 * @param {Object} sharedData - Shared game data
 * @returns {Promise<Object>} Parsed spell metadata object
 *
 * @description Main parsing orchestrator that:
 * 1. Reads file content
 * 2. Extracts title and header information
 * 3. Parses spell properties (casting time, range, duration)
 * 4. Extracts components
 * 5. Generates gameplay tags
 * 6. Returns structured metadata
 *
 * @example
 * const metadata = await parseSpellFile('/path/to/fireball.mdx', sharedData);
 * // Returns: { slug: "fireball", title: "Fireball", level: 3, school: "Evocation", ... }
 */
async function parseSpellFile(filePath, sharedData) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');

  const slug = TextUtils.filePathToSlug(filePath);
  const title = ParsingUtils.parseTitle(lines);

  // Parse spell header (level, school, quality)
  const headerData = parseSpellHeader(lines, sharedData);

  // Parse spell properties (casting time, range, duration, concentration)
  const properties = parseSpellProperties(lines);

  // Parse components
  const components = parseComponents(lines);

  // Parse spell lists
  const spellLists = parseSpellLists(content);

  // Generate tags
  const tags = generateSpellTags(
    content,
    { ...headerData, ...properties, ...components },
    sharedData,
  );

  // Generate relative file path and wiki link
  const relativePath = path
    .relative(process.cwd(), filePath)
    .replace(/\\/g, '/');
  const wikiUrl = `/library/spells/${slug}`;

  // Build metadata object
  const metadata = {
    slug,
    title,
    file: relativePath,
    link: wikiUrl,
    ...headerData,
    ...properties,
    ...components,
    tags,
  };

  // Add spell lists if any were found
  if (spellLists.length > 0) {
    metadata.spellLists = spellLists;
  }

  return metadata;
}

/**
 * Main generator function that processes all spell files and creates metadata
 *
 * @async
 * @function generateSpellMetadata
 * @param {Object} [options] - Optional configuration for testing
 * @param {string} [options.contentDir] - Override content directory (for testing with fixtures)
 * @param {RegExp} [options.filePattern] - Override file pattern (for testing with custom files)
 * @returns {Promise<void>}
 * @throws {Error} If critical failures occur during processing
 *
 * @description Orchestrates the complete spell metadata generation pipeline.
 * Processes both local spell files and external spell metadata.
 *
 * @example
 * // Normal usage
 * await generateSpellMetadata();
 *
 * // Testing with fixtures
 * await generateSpellMetadata({ contentDir: 'tests/fixtures/spells', filePattern: /\.mdx$/i });
 */
async function generateSpellMetadata(options = {}) {
  // First, run the standard metadata generator for .mdx files
  await MetadataGeneratorUtils.runGenerator({
    name: 'Spell Metadata Generator',
    contentType: 'spells',
    filePattern: options.filePattern || /\.mdx$/i,
    parseFile: parseSpellFile,
    contentDir: options.contentDir,
    storage: options.storage,
  });

  // Then, check for external spell metadata and copy it as a single file
  const externalMetadataPath = path.join(
    process.cwd(),
    'scripts',
    'core',
    'spells-external.metadata.json',
  );

  try {
    const stats = await fs.stat(externalMetadataPath);
    if (stats.isFile()) {
      log.message('Found external spell metadata', {
        path: externalMetadataPath,
      });

      // Read external metadata
      const externalContent = await fs.readFile(externalMetadataPath, 'utf8');
      const externalSpells = JSON.parse(externalContent);

      // Determine output folder based on METADATA_BACKEND (use shared resolver
      // so .env.local is respected — same logic as runGenerator)
      const backend = MetadataGeneratorUtils.getBackend();
      let destinationFolder;
      if (backend === 'pg') {
        destinationFolder = path.join(process.cwd(), '.meta', 'en', 'spells');
      } else {
        destinationFolder = path.join(
          process.cwd(),
          'src',
          'content',
          'en',
          'spells',
        );
      }
      await fs.mkdir(destinationFolder, { recursive: true });

      // Copy the entire external metadata file as-is
      const destinationPath = path.join(
        destinationFolder,
        'spells-external.metadata.json',
      );
      await fs.writeFile(
        destinationPath,
        JSON.stringify(externalSpells, null, 2),
        'utf8',
      );

      log.message('Copied external spell metadata', {
        spellCount: externalSpells.length,
        destination: destinationPath,
      });

      // Persist external spells to database if storage is configured
      if (options.storage && Array.isArray(externalSpells)) {
        let persisted = 0;
        for (const spell of externalSpells) {
          if (spell?.slug) {
            try {
              await options.storage.upsert('spells', 'en', spell.slug, spell);
              persisted++;
            } catch (storageErr) {
              log.warning(`DB upsert failed for external spell ${spell.slug}`, {
                error: storageErr.message,
              });
            }
          }
        }
        log.message('Persisted external spells to database', {
          count: persisted,
        });
      }
    }
  } catch (err) {
    // External metadata file doesn't exist, that's okay
    if (err.code !== 'ENOENT') {
      log.warning('Error checking for external spell metadata', {
        error: err.message,
      });
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  MetadataGeneratorUtils.runWithCli(generateSpellMetadata).catch((error) => {
    log.error('Fatal error during spell metadata generation', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
}

export { generateSpellMetadata, generateSpellMetadata as main, parseSpellFile };

