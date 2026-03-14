/**
 * @fileoverview Shared utilities for metadata generators
 * @description Provides common parsing functions, pre-compiled regex patterns, and shared data
 *
 * @todo: Migrate metadata generators into a shared library that can be used by
 * both the standalone .mjs scripts (build-time) and the built Next.js
 * application (runtime). This would allow the revalidation endpoint and
 * draft system to regenerate metadata on-the-fly without invoking external
 * scripts. Tracked as part of the eventual concurrency system.
 *
 * @version 2.0.0
 * @author Typeir
 */

import { promises as fs, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from './logger.mjs';

/** @type {import('./logger.mjs').Logger} */
const log = createLogger({ module: 'shared-utils' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root constant (go up from scripts/core/ to project root)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/** @type {string|null} Cached metadata backend value */
let _metadataBackend = null;

/**
 * Reads `METADATA_BACKEND` from process.env or `.env.local` with caching.
 * @returns {string} 'pg' or 'fs'
 */
function getMetadataBackend() {
  if (_metadataBackend !== null) return _metadataBackend;
  if (process.env.METADATA_BACKEND) {
    _metadataBackend = process.env.METADATA_BACKEND;
    return _metadataBackend;
  }
  try {
    const envPath = path.join(PROJECT_ROOT, '.env.local');
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      if (key === 'METADATA_BACKEND') {
        _metadataBackend = t
          .slice(eq + 1)
          .trim()
          .replace(/^["']|["']$/g, '');
        return _metadataBackend;
      }
    }
  } catch {
    /* absent — default to fs */
  }
  _metadataBackend = 'fs';
  return _metadataBackend;
}

/** @type {Object} Cached shared data loaded from JSON */
let sharedData = null;

/**
 * Loads shared data from JSON file with caching
 * @async
 * @function loadSharedData
 * @returns {Promise<Object>} The shared data object containing game rules, taxonomies, and patterns
 * @throws {Error} If the shared data file cannot be read or parsed
 */
export async function loadSharedData() {
  if (!sharedData) {
    try {
      const dataPath = path.join(__dirname, 'shared-data.json');
      const rawData = await fs.readFile(dataPath, 'utf8');
      sharedData = JSON.parse(rawData);
    } catch (error) {
      throw new Error(`Failed to load shared data: ${error.message}`);
    }
  }
  return sharedData;
}

/**
 * Game data access functions for easy retrieval of constants
 */
export class GameData {
  /**
   * Gets damage types from shared data with fallback
   * @static
   * @method getDamageTypes
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of damage types
   */
  static getDamageTypes(data = null) {
    if (!data?.gameData?.damageTypes) {
      throw new Error(
        'Missing required gameData.damageTypes in shared data - system cannot function without source of truth',
      );
    }
    return data.gameData.damageTypes;
  }

  /**
   * Gets conditions from shared data with fallback
   * @static
   * @method getConditions
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of conditions
   */
  static getConditions(data = null) {
    if (!data?.gameData?.conditions) {
      throw new Error(
        'Missing required gameData.conditions in shared data - system cannot function without source of truth',
      );
    }
    return data.gameData.conditions;
  }

  /**
   * Gets abilities from shared data with fallback
   * @static
   * @method getAbilities
   * @param {Object} [data=null] - Shared data object
   * @returns {Array<{short: string, long: string}>} Array of ability objects
   */
  static getAbilities(data = null) {
    if (!data?.gameData?.abilities) {
      throw new Error(
        'Missing required gameData.abilities in shared data - system cannot function without source of truth',
      );
    }
    return data.gameData.abilities;
  }

  /**
   * Gets creature sizes from shared data with fallback
   * @static
   * @method getSizes
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of creature sizes
   */
  static getSizes(data = null) {
    if (!data?.gameData?.sizes) {
      throw new Error(
        'Missing required gameData.sizes in shared data - system cannot function without source of truth',
      );
    }
    return data.gameData.sizes;
  }

  /**
   * Gets special senses from shared data with fallback
   * @static
   * @method getSenses
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of special senses
   */
  static getSenses(data = null) {
    if (!data?.gameData?.senses) {
      throw new Error(
        'Missing required gameData.senses in shared data - system cannot function without source of truth',
      );
    }
    return data.gameData.senses;
  }

  /**
   * Gets movement types from shared data
   * @static
   * @method getMovementTypes
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of movement types
   */
  static getMovementTypes(data = null) {
    if (!data?.gameData?.movementTypes) {
      throw new Error(
        'Missing required gameData.movementTypes in shared data - system cannot function without source of truth',
      );
    }
    return data.gameData.movementTypes;
  }

  /**
   * Gets mechanic types from shared data
   * @static
   * @method getMechanicTypes
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of mechanic types
   */
  static getMechanicTypes(data = null) {
    if (!data?.gameData?.mechanicTypes) {
      throw new Error(
        'Missing required gameData.mechanicTypes in shared data - system cannot function without source of truth',
      );
    }
    return data.gameData.mechanicTypes;
  }

  /**
   * Gets creature types from shared data
   * @static
   * @method getCreatureTypes
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of creature types
   */
  static getCreatureTypes(data = null) {
    if (!data?.gameData?.creatureTypes) {
      throw new Error(
        'Missing required gameData.creatureTypes in shared data - system cannot function without source of truth',
      );
    }
    return data.gameData.creatureTypes;
  }
}

/**
 * Item data access functions
 */
export class ItemData {
  /**
   * Gets item rarities from shared data with fallback
   * @static
   * @method getRarities
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of rarities
   */
  static getRarities(data = null) {
    if (!data?.itemData?.rarities) {
      throw new Error(
        'Missing required itemData.rarities in shared data - system cannot function without source of truth',
      );
    }
    return data.itemData.rarities;
  }

  /**
   * Gets item types from shared data with fallback
   * @static
   * @method getItemTypes
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of item types
   */
  static getItemTypes(data = null) {
    if (!data?.itemData?.itemTypes) {
      throw new Error(
        'Missing required itemData.itemTypes in shared data - system cannot function without source of truth',
      );
    }
    return data.itemData.itemTypes;
  }

  /**
   * Gets weapon properties from shared data with fallback
   * @static
   * @method getWeaponProperties
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of weapon properties
   */
  static getWeaponProperties(data = null) {
    if (!data?.itemData?.weaponProperties) {
      throw new Error(
        'Missing required itemData.weaponProperties in shared data - system cannot function without source of truth',
      );
    }
    return data.itemData.weaponProperties;
  }

  /**
   * Gets mastery properties from shared data with fallback
   * @static
   * @method getMasteryProperties
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of mastery properties
   */
  static getMasteryProperties(data = null) {
    if (!data?.itemData?.masteryProperties) {
      throw new Error(
        'Missing required itemData.masteryProperties in shared data - system cannot function without source of truth',
      );
    }
    return data.itemData.masteryProperties;
  }

  /**
   * Gets weapon types from shared data
   * @static
   * @method getWeaponTypes
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of weapon types
   */
  static getWeaponTypes(data = null) {
    return data?.itemData?.weaponTypes || [];
  }

  /**
   * Gets armor types from shared data
   * @static
   * @method getArmorTypes
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of armor types
   */
  static getArmorTypes(data = null) {
    return data?.itemData?.armorTypes || [];
  }

  /**
   * Gets clothing types from shared data
   * @static
   * @method getClothingTypes
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of clothing types
   */
  static getClothingTypes(data = null) {
    return data?.itemData?.clothingTypes || [];
  }

  /**
   * Gets base category types (weapon, armor, clothing) from shared data
   * @static
   * @method getBaseCategoryTypes
   * @param {Object} [data=null] - Shared data object
   * @returns {string[]} Array of base category types
   */
  static getBaseCategoryTypes(data = null) {
    return data?.itemData?.baseCategoryTypes || [];
  }

  /**
   * Detects item type from text using pattern matching
   * @static
   * @method detectItemType
   * @param {string[]} lines - File lines to analyze
   * @param {Object} [data=null] - Shared data object
   * @returns {string | undefined} Detected item type or undefined
   *
   * @description Detects item type using two strategies:
   * 1. Checks italic lines in first 5 lines (e.g., "_Legendary Armor_")
   * 2. Checks "Type:" property declaration (e.g., "- **Type**: Handgun")
   *
   * Also maps specific item subtypes to generic categories:
   * - Weapon names (rapier, rifle, handgun, etc.) → "weapon"
   * - Armor types (plate, chainmail, etc.) → "armor"
   * - Accessories (gauntlet → gloves, hat → helmet, scarf → cloak)
   */
  static detectItemType(lines, data = null) {
    const itemTypes = this.getItemTypes(data);
    const weaponTypes = this.getWeaponTypes(data);
    const armorTypes = this.getArmorTypes(data);
    const clothingTypes = this.getClothingTypes(data);

    // Build dynamic regex patterns from shared data
    const weaponPattern =
      weaponTypes.length > 0
        ? new RegExp(
            `\\b(${weaponTypes.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}|weapon)\\b`,
            'i',
          )
        : /\bweapon\b/i;

    const armorPattern =
      armorTypes.length > 0
        ? new RegExp(
            `\\b(${armorTypes.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}|armor)\\b`,
            'i',
          )
        : /\barmor\b/i;

    const clothingPattern =
      clothingTypes.length > 0
        ? new RegExp(
            `\\b(${clothingTypes.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}|clothing)\\b`,
            'i',
          )
        : /\bclothing\b/i;

    // Strategy 1: Check the italic line immediately after the title (first 5 lines)
    const italicLines = lines
      .slice(0, 5)
      .filter((l) => /^_.*_$/.test(l.trim()))
      .map((l) => l.replace(/^_/, '').replace(/_$/, '').trim().toLowerCase());

    for (const italicLine of italicLines) {
      // Check for base category types first (weapon, armor, clothing)
      // These take priority over specific subtypes
      if (/\bweapon\b/i.test(italicLine)) {
        return 'weapon';
      }
      if (/\barmor\b/i.test(italicLine)) {
        return 'armor';
      }
      if (/\bclothing\b/i.test(italicLine)) {
        return 'clothing';
      }

      // Then check for exact item type matches
      for (const itemType of itemTypes) {
        const escapedType = itemType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedType}\\b`, 'i');
        if (regex.test(italicLine)) {
          return itemType;
        }
      }

      // Check for weapon-specific patterns (subtypes like sword, bow, etc.)
      if (weaponPattern.test(italicLine)) {
        return 'weapon';
      }
    }

    // Strategy 2: Check for explicit "Type:" property declaration
    const typePropertyLine = lines.find((l) =>
      /^-?\s*\*\*Type\*\*\s*:/i.test(l),
    );
    if (typePropertyLine) {
      const typeValue = typePropertyLine
        .replace(/^-?\s*\*\*Type\*\*\s*:/i, '')
        .trim()
        .toLowerCase();

      // First, check for exact item type matches
      for (const itemType of itemTypes) {
        const escapedType = itemType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedType}\\b`, 'i');
        if (regex.test(typeValue)) {
          return itemType;
        }
      }

      // Check for weapon patterns (dynamically built from shared data)
      if (weaponPattern.test(typeValue)) {
        return 'weapon';
      }

      // Check for armor patterns (dynamically built from shared data)
      if (armorPattern.test(typeValue)) {
        return 'armor';
      }

      // Check for clothing patterns (dynamically built from shared data)
      if (clothingPattern.test(typeValue)) {
        return 'clothing';
      }

      // Fallback: extract the first word/phrase from typeValue as a custom type
      // This handles unique item types like "Memory", "Siege Weapon", "Heirloom", etc.
      const customType = typeValue
        .split(/[,(]/)[0] // Take everything before comma or opening parenthesis
        .trim()
        .toLowerCase();

      if (customType) {
        return customType;
      }
    }

    return undefined;
  }
}

/**
 * Pre-compiled regex patterns for performance optimization
 * @type {Map<string, RegExp>}
 */
export class CompiledPatterns {
  /** @private @type {Map<string, RegExp>} */
  #patterns = new Map();

  /** @private @type {Object} */
  #data = null;

  /**
   * Creates a new CompiledPatterns instance
   * @constructor
   * @param {Object} sharedData - The shared data object containing pattern definitions
   */
  constructor(sharedData) {
    this.#data = sharedData;
    this.#compilePatterns();
  }

  /**
   * Compiles all regex patterns for optimal performance
   * @private
   * @method #compilePatterns
   */
  #compilePatterns() {
    const { damageTypes, conditions } = this.#data.gameData;
    const { regexPatterns } = this.#data.patterns;

    // Compile damage type patterns
    for (const damageType of damageTypes) {
      const pattern = new RegExp(`\\\\b${damageType}\\\\s+damage\\\\b`, 'gi');
      this.#patterns.set(`damage:${damageType}`, pattern);
    }

    // Compile condition patterns
    for (const condition of conditions) {
      const pattern = new RegExp(`\\\\b${condition}\\\\b`, 'gi');
      this.#patterns.set(`condition:${condition}`, pattern);
    }

    // Compile ability patterns
    for (const ability of this.#data.gameData.abilities) {
      const pattern = new RegExp(
        `\\\\b${ability.long}\\\\s+(?:saving throw|save)\\\\b`,
        'gi',
      );
      this.#patterns.set(`save:${ability.long}`, pattern);

      const shortPattern = new RegExp(
        `\\\\b${ability.short}\\\\s+(?:saving throw|save)\\\\b`,
        'gi',
      );
      this.#patterns.set(`save:${ability.short}`, pattern);
    }

    // Compile common patterns
    this.#patterns.set(
      'regeneration',
      new RegExp(regexPatterns.regeneration, 'gi'),
    );
    this.#patterns.set(
      'spellcasting',
      new RegExp(regexPatterns.spellcasting, 'gi'),
    );
    this.#patterns.set(
      'movement:flight',
      /\\\\b(fly|flying|flight)\\\\b.*?\\\\d+\\\\s*ft/gi,
    );
    this.#patterns.set('movement:burrow', /\\\\bburrow/gi);
    this.#patterns.set('movement:swim', /\\\\bswim/gi);
    this.#patterns.set('movement:climb', /\\\\bclimb/gi);
    this.#patterns.set('movement:teleport', /\\\\bteleport/gi);
  }

  /**
   * Gets a compiled regex pattern by key
   * @method get
   * @param {string} key - The pattern key (e.g., 'damage:fire', 'condition:prone')
   * @returns {RegExp|undefined} The compiled regex pattern or undefined if not found
   */
  get(key) {
    return this.#patterns.get(key);
  }

  /**
   * Checks if a pattern exists
   * @method has
   * @param {string} key - The pattern key to check
   * @returns {boolean} True if the pattern exists
   */
  has(key) {
    return this.#patterns.has(key);
  }

  /**
   * Gets all available pattern keys
   * @method keys
   * @returns {Iterator<string>} Iterator of pattern keys
   */
  keys() {
    return this.#patterns.keys();
  }

  /**
   * Tests text against multiple patterns and returns matching tags
   * @method extractTags
   * @param {string} text - The text to analyze
   * @param {string[]} categories - Array of tag categories to check
   * @returns {string[]} Array of matching tags
   */
  extractTags(text, categories = []) {
    const matchedTags = new Set();

    for (const [key, pattern] of this.#patterns) {
      if (
        categories.length === 0 ||
        categories.some((cat) => key.startsWith(cat + ':'))
      ) {
        if (pattern.test(text)) {
          matchedTags.add(key);
        }
        // Reset regex lastIndex to avoid issues with global flags
        pattern.lastIndex = 0;
      }
    }

    return Array.from(matchedTags).sort();
  }
}

/**
 * Common text processing utilities
 * @namespace TextUtils
 */
export class TextUtils {
  /**
   * Removes carriage returns and trims whitespace
   * @static
   * @method clean
   * @param {string} text - Input string to clean
   * @returns {string} Cleaned string
   */
  static clean(text) {
    return (text || '').replace(/\\r/g, '').trim();
  }

  /**
   * Removes markdown formatting like **bold**, _italic_, etc.
   * @static
   * @method stripMarkdown
   * @param {string} text - Input string with markdown
   * @returns {string} String without markdown formatting
   */
  static stripMarkdown(text) {
    if (!text) return text;
    return text
      .replace(/\\*\\*(.+?)\\*\\*/g, '$1') // Remove **bold**
      .replace(/\\*(.+?)\\*/g, '$1') // Remove *italic*
      .replace(/_(.+?)_/g, '$1') // Remove _italic_
      .replace(/`(.+?)`/g, '$1') // Remove `code`
      .trim();
  }

  /**
   * Converts text to kebab-case format
   * @static
   * @method toKebabCase
   * @param {string} text - Input string to convert
   * @returns {string} String in kebab-case format
   */
  static toKebabCase(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Extracts slug from file path by removing extensions
   * @static
   * @method filePathToSlug
   * @param {string} filePath - Path to the file
   * @returns {string} Slug identifier
   */
  static filePathToSlug(filePath) {
    return path
      .basename(filePath)
      .replace(/\.(?:sheet\.)?mdx$/i, '')
      .replace(/\..+$/, '');
  }

  /**
   * Splits lines from raw text content
   * @static
   * @method readLines
   * @param {string} raw - Raw file content
   * @returns {string[]} Array of lines
   */
  static readLines(raw) {
    return raw.split(/\r?\n/);
  }
}

/**
 * Metadata validation and schema utilities
 * @namespace ValidationUtils
 */
export class ValidationUtils {
  /** @private @type {Object} */
  #sharedData;

  /**
   * Creates a new ValidationUtils instance
   * @constructor
   * @param {Object} sharedData - The shared data object
   */
  constructor(sharedData) {
    this.#sharedData = sharedData;
  }

  /**
   * Validates a tag against known categories
   * @method validateTag
   * @param {string} tag - The tag to validate (e.g., 'damage:fire')
   * @returns {boolean} True if the tag is valid
   */
  validateTag(tag) {
    const [category, value] = tag.split(':');
    const validCategories = this.#sharedData.taxonomies.tagCategories;

    if (!validCategories.includes(category)) {
      return false;
    }

    // Additional validation based on category
    switch (category) {
      case 'damage':
        return this.#sharedData.gameData.damageTypes.includes(value);
      case 'condition':
        return this.#sharedData.gameData.conditions.includes(value);
      case 'creature':
        return this.#sharedData.gameData.creatureTypes.includes(value);
      case 'size':
        return this.#sharedData.gameData.sizes.includes(value);
      case 'faction':
        return this.#sharedData.worldData.factions.includes(value);
      case 'location':
        return this.#sharedData.worldData.locations.includes(value);
      default:
        return true; // Allow other categories without strict validation
    }
  }

  /**
   * Determines rarity tag based on challenge rating
   * @method getRarityFromCR
   * @param {number|string} challengeRating - The creature's challenge rating
   * @returns {string} The appropriate rarity tag
   */
  getRarityFromCR(challengeRating) {
    const crValue =
      typeof challengeRating === 'string'
        ? parseFloat(challengeRating)
        : challengeRating;
    const thresholds = this.#sharedData.taxonomies.rarityThresholds;

    for (const threshold of thresholds) {
      if (crValue >= threshold.minCR) {
        return threshold.tag;
      }
    }

    return 'rarity:common';
  }

  /**
   * Validates metadata structure against expected schema
   * @method validateMetadata
   * @param {Object} metadata - The metadata object to validate
   * @param {string} type - The type of metadata ('monster' or 'heirloom')
   * @returns {{valid: boolean, errors: string[]}} Validation result
   */
  validateMetadata(metadata, type) {
    const errors = [];

    // Common validations
    if (!metadata.slug || typeof metadata.slug !== 'string') {
      errors.push('Missing or invalid slug');
    }

    if (!metadata.title || typeof metadata.title !== 'string') {
      errors.push('Missing or invalid title');
    }

    if (metadata.tags && !Array.isArray(metadata.tags)) {
      errors.push('Tags must be an array');
    }

    // Validate individual tags
    if (metadata.tags) {
      for (const tag of metadata.tags) {
        if (!this.validateTag(tag)) {
          errors.push(`Invalid tag: ${tag}`);
        }
      }
    }

    // Type-specific validations
    if (type === 'monster') {
      if (!metadata.creatureType) {
        errors.push('Missing creature type');
      }
      if (metadata.cr === undefined) {
        errors.push('Missing challenge rating');
      }
    } else if (type === 'heirloom') {
      if (!metadata.rarity) {
        errors.push('Missing rarity');
      }
      if (!metadata.itemType) {
        errors.push('Missing item type');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * File processing utilities with error handling
 * @namespace FileUtils
 */
export class FileUtils {
  /**
   * Safely reads and parses a file with error handling
   * @static
   * @async
   * @method safeReadFile
   * @param {string} filePath - Path to the file to read
   * @param {string} [encoding='utf8'] - File encoding
   * @returns {Promise<string|null>} File content or null if error
   */
  static async safeReadFile(filePath, encoding = 'utf8') {
    try {
      return await fs.readFile(filePath, encoding);
    } catch (error) {
      log.error(`Error reading file ${filePath}`, { error: error.message });
      return null;
    }
  }

  /**
   * Safely writes a file with error handling
   * @static
   * @async
   * @method safeWriteFile
   * @param {string} filePath - Path to write the file
   * @param {string} content - Content to write
   * @param {string} [encoding='utf8'] - File encoding
   * @returns {Promise<boolean>} True if successful, false if error
   */
  static async safeWriteFile(filePath, content, encoding = 'utf8') {
    try {
      await fs.writeFile(filePath, content, encoding);
      return true;
    } catch (error) {
      log.error(`Error writing file ${filePath}`, { error: error.message });
      return false;
    }
  }

  /**
   * Gets all files matching a pattern in a directory, excluding main.mdx files
   * @static
   * @async
   * @method getMatchingFiles
   * @param {string} directory - Directory to search
   * @param {RegExp} pattern - Pattern to match filenames against
   * @returns {Promise<string[]>} Array of matching file paths (excludes main.mdx)
   */
  static async getMatchingFiles(directory, pattern) {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      return entries
        .filter(
          (entry) =>
            entry.isFile() &&
            pattern.test(entry.name) &&
            entry.name !== 'main.mdx',
        )
        .map((entry) => path.join(directory, entry.name));
    } catch (error) {
      log.error(`Error reading directory ${directory}`, {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Ensures a directory exists, creating it if necessary
   * @static
   * @async
   * @method ensureDirectory
   * @param {string} dirPath - Path to the directory
   * @returns {Promise<boolean>} True if directory exists or was created
   */
  static async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      log.error(`Error creating directory ${dirPath}`, {
        error: error.message,
      });
      return false;
    }
  }
}

/**
 * Performance monitoring utilities
 * @namespace PerformanceUtils
 */
export class PerformanceUtils {
  /** @private @type {Map<string, number>} */
  static #timers = new Map();

  /** @private @type {Map<string, {heapUsed: number, external: number}>} */
  static #memorySnapshots = new Map();

  /**
   * Starts a performance timer
   * @static
   * @method startTimer
   * @param {string} label - Timer label
   */
  static startTimer(label) {
    this.#timers.set(label, performance.now());
    this.#memorySnapshots.set(label, {
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external,
    });
  }

  /**
   * Ends a performance timer and logs results
   * @static
   * @method endTimer
   * @param {string} label - Timer label
   * @returns {number} Elapsed time in milliseconds
   */
  static endTimer(label) {
    const startTime = this.#timers.get(label);
    const startMemory = this.#memorySnapshots.get(label);

    if (!startTime || !startMemory) {
      log.warning(`Timer '${label}' was not started`);
      return 0;
    }

    const elapsed = performance.now() - startTime;
    const currentMemory = process.memoryUsage();
    const memoryDelta = {
      heapUsed: currentMemory.heapUsed - startMemory.heapUsed,
      external: currentMemory.external - startMemory.external,
    };

    log.message(
      `⏱️  ${label}: ${elapsed.toFixed(2)}ms (heap: ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB)`,
    );

    this.#timers.delete(label);
    this.#memorySnapshots.delete(label);

    return elapsed;
  }
}

/**
 * Common parsing utilities for extracting structured data from MDX content
 */
export class ParsingUtils {
  /**
   * Extracts the title from the first H1 heading
   * @static
   * @method parseTitle
   * @param {string[]} lines - Array of file lines
   * @returns {string} Clean title without markdown formatting
   */
  static parseTitle(lines) {
    const h1 = lines.find((l) => /^#\s+/.test(l));
    return h1 ? TextUtils.clean(h1.replace(/^#\s+/, '')) : '';
  }

  /**
   * Parses properties from bullet list sections
   * @static
   * @method parseProperties
   * @param {string} text - Full text content
   * @returns {Object<string, string> | undefined} Map of property names to values
   */
  static parseProperties(text) {
    const properties = {};

    // Look for Properties sections
    const propertiesMatch = text.match(
      /##\s+(Item\s+|Weapon\s+|Armor\s+)?Properties\s*\n([\s\S]*?)(?=\n##|\n---|\n$)/i,
    );
    if (!propertiesMatch) return undefined;

    const propertiesSection = propertiesMatch[2];

    // Extract bullet points with property: value format
    // Handle both "**Type**: Value" and "**Type:** Value"
    const bulletPattern = /^[-*]\s+\*\*(.+?)(?::)?\*\*\s*:?\s*(.+?)\s*$/gm;
    let match;
    while ((match = bulletPattern.exec(propertiesSection)) !== null) {
      const key = TextUtils.stripMarkdown(match[1].trim());
      const value = TextUtils.stripMarkdown(match[2].trim());
      properties[key] = value;
    }

    return Object.keys(properties).length > 0 ? properties : undefined;
  }

  /**
   * Parses weight from properties object
   * @static
   * @method parseWeight
   * @param {Object<string, string>} properties - Parsed properties object
   * @returns {string | undefined} Weight value
   */
  static parseWeight(properties) {
    if (!properties || !properties.Weight) return undefined;

    const weightText = properties.Weight;
    const weightMatch = weightText.match(/([\d.]+)\s*lbs?\.?/i);
    if (weightMatch) {
      return `${weightMatch[1]} lb${weightMatch[1] !== '1' ? 's' : ''}`;
    }

    return undefined;
  }

  /**
   * Parses range from properties object
   * @static
   * @method parseRange
   * @param {Object<string, string>} properties - Parsed properties object
   * @returns {string | undefined} Range value
   */
  static parseRange(properties) {
    if (!properties || !properties.Range) {
      if (properties && properties.Reach) {
        return properties.Reach;
      }
      return undefined;
    }
    return properties.Range;
  }

  /**
   * Parses comma-separated number format (e.g., "1,650" -> 1650)
   * @static
   * @method parseNumericValue
   * @param {string} value - String potentially containing commas
   * @returns {number | undefined} Parsed number or undefined
   */
  static parseNumericValue(value) {
    if (!value) return undefined;
    const cleaned = String(value).replace(/,/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Extracts charges information from content
   * @static
   * @method parseCharges
   * @param {string} text - Full text content
   * @returns {{ initial?: string, recharge?: string, depletes?: boolean } | undefined} Charges info
   */
  static parseCharges(text) {
    const chargesInfo = {};

    // Look for initial charges
    const initialMatch = text.match(
      /holds?\s+(?:up to\s+)?(\d+d\d+|\d+)\s+charges/i,
    );
    if (initialMatch) {
      chargesInfo.initial = initialMatch[1];
    }

    // Look for recharge information
    const rechargeMatch = text.match(
      /(?:regain|recover)(?:ing|s)?\s+(\d+\s*\+\s*\d+d\d+|\d+d\d+|\d+)\s+charges?\s+(?:at|each)\s+(\w+)/i,
    );
    if (rechargeMatch) {
      chargesInfo.recharge = `${rechargeMatch[1]} at ${rechargeMatch[2]}`;
    }

    // Check if item becomes inert when depleted
    if (/becomes?\s+inert|cannot be recharged|burns? away/i.test(text)) {
      chargesInfo.depletes = true;
    }

    return Object.keys(chargesInfo).length > 0 ? chargesInfo : undefined;
  }

  /**
   * Parses damage types that an item deals
   * @static
   * @method parseDamageTypesDealt
   * @param {string} text - Full text content
   * @param {Object} [data=null] - Shared data object
   * @returns {string[] | undefined} Array of damage types dealt
   */
  static parseDamageTypesDealt(text, data = null) {
    const damageTypes = new Set();
    const damageKeywords = GameData.getDamageTypes(data);

    for (const type of damageKeywords) {
      const dealPattern = new RegExp(
        `(?:deals?|additional|extra)\\s+(?:\\d+d\\d+|\\d+)\\s+${type}\\s+damage`,
        'i',
      );
      if (dealPattern.test(text)) {
        damageTypes.add(type);
      }
    }

    return damageTypes.size > 0 ? Array.from(damageTypes).sort() : undefined;
  }

  /**
   * Parses saving throw types that an item enforces
   * @static
   * @method parseSavingThrowTypes
   * @param {string} text - Full text content
   * @param {Object} [data=null] - Shared data object
   * @returns {string[] | undefined} Array of saving throw ability types
   */
  static parseSavingThrowTypes(text, data = null) {
    const saveTypes = new Set();
    const abilities = GameData.getAbilities(data);

    const abilityNames = abilities.flatMap((a) => [a.long, a.short]);
    const pattern = new RegExp(
      `\\b(${abilityNames.join('|')})\\s+(saving throw|save)`,
      'gi',
    );
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const matchedAbility = match[1].toLowerCase();
      const ability = abilities.find(
        (a) =>
          a.long.toLowerCase() === matchedAbility ||
          a.short.toLowerCase() === matchedAbility,
      );
      if (ability) {
        const fullAbility =
          ability.long.charAt(0).toUpperCase() + ability.long.slice(1);
        saveTypes.add(fullAbility);
      }
    }

    return saveTypes.size > 0 ? Array.from(saveTypes).sort() : undefined;
  }

  /**
   * Parses markdown bullet points with key-value format
   * @static
   * @method parseKeyBullets
   * @param {string} text - Text content to parse
   * @returns {Object<string, string>} Map of keys to values
   * @example
   * // Input: "- **Armor Class**: 15\n- **Hit Points**: 100"
   * // Output: { "Armor Class": "15", "Hit Points": "100" }
   */
  static parseKeyBullets(text) {
    const map = {};
    const re = /^-\s*\*\*([^*]+)\*\*\s*:\s*(.+?)\s*$/gim;
    let m;
    while ((m = re.exec(text)) !== null) {
      map[m[1].trim()] = m[2].trim();
    }
    return map;
  }

  /**
   * Splits comma/semicolon-delimited list into array
   * @static
   * @method splitList
   * @param {string} raw - Raw list string
   * @returns {string[]} Array of list items with markdown stripped
   * @example
   * // Input: "fire, cold, lightning"
   * // Output: ["fire", "cold", "lightning"]
   */
  static splitList(raw) {
    if (!raw || raw === '—' || raw.toLowerCase() === 'none') return [];
    return raw
      .split(/[,;]/)
      .map((s) => TextUtils.stripMarkdown(s.trim()))
      .filter(Boolean);
  }

  /**
   * Splits list with special grouping pattern support
   * @static
   * @method splitListWithGrouping
   * @param {string} raw - Raw list string
   * @param {RegExp} groupPattern - Pattern to match for grouped entries
   * @returns {string[]} Array with grouped entry first, then remaining items
   * @example
   * // Input: "bludgeoning, piercing, and slashing from nonmagical attacks; fire"
   * // Pattern: /bludgeoning,?\s+piercing,?\s+and\s+slashing\s+from\s+nonmagical\s+[^;,]+/i
   * // Output: ["bludgeoning, piercing, and slashing from nonmagical attacks", "fire"]
   */
  static splitListWithGrouping(raw, groupPattern) {
    if (!raw || raw === '—' || raw.toLowerCase() === 'none') return [];

    const match = raw.match(groupPattern);

    if (match) {
      // Extract the full grouped phrase
      const grouped = TextUtils.stripMarkdown(match[0].trim());
      const remainder = raw.replace(groupPattern, '').trim();

      // Split remainder by comma or semicolon
      const others = remainder
        .split(/[,;]/)
        .map((s) => TextUtils.stripMarkdown(s.trim()))
        .filter(Boolean)
        .filter((s) => s !== 'and');

      // Return grouped phrase first, then others
      return [grouped, ...others];
    }

    // Normal split by comma or semicolon
    return raw
      .split(/[,;]/)
      .map((s) => TextUtils.stripMarkdown(s.trim()))
      .filter(Boolean);
  }
}

/**
 * Unified tagging utilities for extracting gameplay mechanics, lore, and organizational tags from content
 *
 * @class TaggingUtils
 * @description Centralized tagging system that combines mechanics-based tagging (damage types, conditions,
 * abilities) with organizational and lore-based tagging (factions, locations, categories). Used by both
 * specialized generators (monsters, heirlooms) and the generic orchestrator for consistent tag extraction.
 *
 * @example
 * ```javascript
 * const tags = TaggingUtils.extractAllTags(content, filePath, sharedData);
 * // Returns: ['damage:fire', 'mechanic:legendary-actions', 'faction:hiisi', 'category:monsters', 'locale:en']
 * ```
 */
export class TaggingUtils {
  /**
   * Extract damage type tags from content
   * @param {string} text - Content to analyze
   * @param {Object} sharedData - Shared game data
   * @returns {string[]} Array of damage tags (e.g., ['damage:fire', 'damage:cold'])
   */
  static extractDamageTags(text, sharedData) {
    const tags = [];
    const damageTypes = GameData.getDamageTypes(sharedData);

    for (const type of damageTypes) {
      if (new RegExp(`\\b${type}\\s+damage\\b`, 'gi').test(text)) {
        tags.push(`damage:${type}`);
      }
    }

    return tags;
  }

  /**
   * Extract condition tags from content
   * @param {string} text - Content to analyze
   * @param {Object} sharedData - Shared game data
   * @returns {string[]} Array of condition tags (e.g., ['condition:frightened', 'condition:paralyzed'])
   */
  static extractConditionTags(text, sharedData) {
    const tags = [];
    const conditions = GameData.getConditions(sharedData);

    for (const condition of conditions) {
      if (new RegExp(`\\b${condition}\\b`, 'gi').test(text)) {
        tags.push(`condition:${condition}`);
      }
    }

    return tags;
  }

  /**
   * Extract ability save tags from content
   * @param {string} text - Content to analyze
   * @param {Object} sharedData - Shared game data
   * @returns {string[]} Array of save tags (e.g., ['mechanic:dexterity-save', 'mechanic:wisdom-save'])
   */
  static extractAbilitySaveTags(text, sharedData) {
    const tags = [];
    const abilities = GameData.getAbilities(sharedData);
    const abilityNames = abilities.flatMap((a) => [a.long, a.short]);
    const pattern = new RegExp(
      `\\b(${abilityNames.join('|')})\\s+(saving throw|save)`,
      'gi',
    );

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const matchedAbility = match[1].toLowerCase();
      const ability = abilities.find(
        (a) =>
          a.long.toLowerCase() === matchedAbility ||
          a.short.toLowerCase() === matchedAbility,
      );
      if (ability) {
        tags.push(`mechanic:${ability.long}-save`);
      }
    }

    return tags;
  }

  /**
   * Extract movement type tags from content
   * @param {string} text - Content to analyze
   * @param {Object} sharedData - Shared game data
   * @param {boolean} requireMeasurement - For flight, require feet measurement (default: false)
   * @returns {string[]} Array of movement tags (e.g., ['movement:flight', 'movement:teleportation'])
   */
  static extractMovementTags(text, sharedData, requireMeasurement = false) {
    const tags = [];
    const movementTypes = GameData.getMovementTypes(sharedData);
    const movementPatterns = {
      flight: /\b(fly|flying|flight)\b/i,
      burrowing: /\bburrow/i,
      swimming: /\bswim/i,
      climbing: /\bclimb/i,
      teleportation: /\bteleport/i,
      enhanced: /\bmovement\s+speed/i,
    };

    for (const movement of movementTypes) {
      if (movementPatterns[movement] && movementPatterns[movement].test(text)) {
        // Special case for flight - optionally require feet measurement
        if (
          movement === 'flight' &&
          requireMeasurement &&
          !/\d+\s*ft/i.test(text)
        )
          continue;
        tags.push(`movement:${movement}`);
      }
    }

    return tags;
  }

  /**
   * Extract mechanic tags specific to monsters (legendary deeds, multiattack, etc.)
   * @param {string} text - Content to analyze
   * @returns {string[]} Array of mechanic tags
   */
  static extractMonsterMechanicTags(text) {
    const tags = [];

    // Action types
    if (/\b(Legendary Deed: act?|Legendary Deed: resist)\b/i.test(text))
      tags.push('mechanic:legendary-deed');
    if (/\bLegendary Deed: resist?\b/i.test(text)) tags.push('mechanic:resist');
    if (/\bLegendary Deed: lair?\b/i.test(text)) tags.push('mechanic:lair');
    if (/\bLegendary Deed: Stratagem?\b/i.test(text))
      tags.push('mechanic:stratagem');
    if (/\bLegendary Deed: Phase?\b/i.test(text))
      tags.push('mechanic:phase-actions');
    if (/\bmultiattack\b/i.test(text)) tags.push('mechanic:multiattack');
    if (/\breactions?\b/i.test(text)) tags.push('mechanic:reactions');
    if (/\bbonus actions?\b/i.test(text)) tags.push('mechanic:bonus-actions');

    // Regeneration and healing
    if (/\bregenerat(e|ion)\b/i.test(text)) tags.push('mechanic:regeneration');
    if (/\b(regains?|recover)\s+\d+\s+(hit points?|hp)\b/i.test(text))
      tags.push('mechanic:regeneration');

    // Spellcasting
    if (/\b(spellcasting|cantrips?|spell slots?)\b/i.test(text))
      tags.push('mechanic:spellcasting');
    if (/\b(innate spellcasting)\b/i.test(text))
      tags.push('mechanic:innate-spellcasting');

    // Special abilities
    if (/\b(magic resistance)\b/i.test(text))
      tags.push('mechanic:magic-resistance');
    if (/\b(magic weapons?)\b/i.test(text)) tags.push('mechanic:magic-weapons');
    if (/\b(pack tactics)\b/i.test(text)) tags.push('mechanic:pack-tactics');
    if (/\b(sneak attack)\b/i.test(text)) tags.push('mechanic:sneak-attack');
    if (/\b(aura)\b/i.test(text)) tags.push('mechanic:aura');
    if (/\b(summon|summoning)\b/i.test(text)) tags.push('mechanic:summoning');
    if (/\b(shapechange|polymorph)\b/i.test(text))
      tags.push('mechanic:shapeshifting');

    // Vulnerabilities/resistances/immunities
    if (/\b(resistant|resistance)\b/i.test(text))
      tags.push('mechanic:damage-resistance');
    if (/\b(immune|immunity)\b/i.test(text))
      tags.push('mechanic:damage-immunity');
    if (/\b(vulnerable|vulnerability)\b/i.test(text))
      tags.push('mechanic:damage-vulnerability');

    return tags;
  }

  /**
   * Extract mechanic tags specific to items (attack bonuses, charges, etc.)
   * @param {string} text - Content to analyze
   * @returns {string[]} Array of mechanic tags
   */
  static extractItemMechanicTags(text) {
    const tags = [];

    // Attack modifiers
    if (/\+\d+\s+(?:to\s+)?(?:attack|hit)/i.test(text))
      tags.push('mechanic:attack-bonus');
    if (/\+\d+\s+(?:to\s+)?(?:damage|AC)/i.test(text))
      tags.push('mechanic:damage-bonus');
    if (/\+\d+\s+(?:to\s+|bonus\s+to\s+)?AC/i.test(text))
      tags.push('mechanic:ac-bonus');
    if (/\+\d+\s+(?:to\s+|bonus\s+to\s+)?saving throws?/i.test(text))
      tags.push('mechanic:saving-throw-bonus');

    // Advantage/disadvantage and combat mechanics
    if (/\b(advantage|disadvantage)\b/i.test(text))
      tags.push('mechanic:advantage-disadvantage');
    if (/\bcritical(?:\s+hit)?/i.test(text))
      tags.push('mechanic:critical-hits');
    if (/\breaction\b/i.test(text)) tags.push('mechanic:reaction');
    if (/\bbonus action\b/i.test(text)) tags.push('mechanic:bonus-action');
    if (/\bopportunity attack/i.test(text))
      tags.push('mechanic:opportunity-attacks');
    if (/does\s+not\s+provoke\s+opportunity\s+attacks?/i.test(text))
      tags.push('mechanic:no-opportunity-attacks');

    // Damage resistances/immunities/vulnerabilities
    if (/\bresistance\s+to/i.test(text))
      tags.push('mechanic:damage-resistance');
    if (/\bimmun(?:e|ity)\s+to/i.test(text))
      tags.push('mechanic:damage-immunity');
    if (/\bvulnerab(?:le|ility)\s+to/i.test(text))
      tags.push('mechanic:damage-vulnerability');

    // Spellcasting and usage mechanics
    if (/\bcasts?\s+\[?_?[A-Z][a-z]+|spell/i.test(text))
      tags.push('mechanic:spellcasting');
    if (/\bcantrips?\b/i.test(text)) tags.push('mechanic:cantrips');
    if (/\bcharges?\b/i.test(text)) tags.push('mechanic:charges');
    if (/\b\d+\/(?:short|long)\s+rest/i.test(text))
      tags.push('mechanic:limited-uses');
    if (/\brecharge\s+\d+/i.test(text)) tags.push('mechanic:recharge');
    if (/\breroll/i.test(text)) tags.push('mechanic:reroll');

    // Special item properties
    if (
      /\bconsumable\b/i.test(text) ||
      /burns? away|destroyed|inert/i.test(text)
    )
      tags.push('property:consumable');
    if (/\battunement\b/i.test(text)) tags.push('property:attunement-required');
    if (/\bproficiency\b/i.test(text))
      tags.push('property:proficiency-required');

    return tags;
  }

  /**
   * Extract lore tags (factions, locations) from content
   * @param {string} text - Content to analyze
   * @param {string[]} factions - List of faction names to search for
   * @param {string[]} locations - List of location names to search for
   * @returns {string[]} Array of lore tags (e.g., ['faction:hiisi', 'location:damocles'])
   */
  static extractLoreTags(text, factions, locations) {
    const tags = [];

    // Factions
    for (const faction of factions) {
      if (new RegExp(`\\b${faction}\\b`, 'i').test(text)) {
        tags.push(`faction:${faction.toLowerCase()}`);
      }
    }

    // Locations
    for (const location of locations) {
      if (new RegExp(`\\b${location}\\b`, 'i').test(text)) {
        tags.push(`location:${location.toLowerCase()}`);
      }
    }

    return tags;
  }

  /**
   * Extract organizational tags from file path (category, locale, source)
   * @param {string} filePath - Absolute path to content file
   * @param {string} projectRoot - Root directory of the project
   * @returns {string[]} Array of organizational tags (e.g., ['category:monsters', 'locale:en', 'source:official'])
   */
  static extractOrganizationalTags(filePath, projectRoot = process.cwd()) {
    const tags = [];
    // Use simple string splitting instead of path module
    const relativePath = filePath
      .replace(projectRoot, '')
      .replace(/^[/\\]+/, '');
    const pathParts = relativePath.split(/[/\\]/);

    // Content hierarchy tags
    if (pathParts.includes('monsters')) tags.push('category:monsters');
    if (pathParts.includes('items')) tags.push('category:items');
    if (pathParts.includes('heirlooms')) tags.push('category:heirlooms');
    if (pathParts.includes('character-creation'))
      tags.push('category:character-creation');
    if (pathParts.includes('vocations')) tags.push('category:vocations');
    if (pathParts.includes('spells')) tags.push('category:spells');
    if (pathParts.includes('world')) tags.push('category:world');
    if (pathParts.includes('rules')) tags.push('category:rules');

    // Language/locale tags
    if (pathParts.includes('en')) tags.push('locale:en');
    if (pathParts.includes('es')) tags.push('locale:es');
    if (pathParts.includes('fi')) tags.push('locale:fi');

    // Source tags
    tags.push('source:official');

    return tags;
  }

  /**
   * Extract content type tags from file path and content structure
   * @param {string} filePath - Absolute path to content file
   * @param {string} content - File content
   * @returns {string[]} Array of content type tags (e.g., ['content:sheet', 'content:statblock'])
   */
  static extractContentTypeTags(filePath, content) {
    const tags = [];

    // File extension based tags
    if (filePath.includes('.sheet.mdx')) {
      tags.push('sheet', 'statblock');
    } else if (filePath.endsWith('.mdx')) {
      tags.push('content');
    }

    // Content pattern based tags
    if (content.includes('**Armor Class**')) tags.push('statblock', 'creature');
    if (content.includes('**Challenge Rating**'))
      tags.push('monster', 'encounter');
    if (
      content.includes('_Spell level_') ||
      content.includes('**Casting Time**')
    )
      tags.push('spell');
    if (
      content.includes('**Rarity**') ||
      content.includes('_weapon_') ||
      content.includes('_armor_')
    ) {
      tags.push('item', 'equipment');
    }
    if (
      content.includes('**Class Features**') ||
      content.includes('**Subclass**')
    )
      tags.push('class');

    return tags.map((tag) => `content:${tag}`);
  }

  /**
   * Extract all tags from content - unified entry point
   * @param {string} content - File content to analyze
   * @param {string} filePath - Absolute path to file
   * @param {Object} sharedData - Shared game data
   * @param {Object} options - Additional options
   * @param {string} options.contentType - Type of content ('monster', 'item', 'generic')
   * @param {string[]} options.factions - Custom faction list
   * @param {string[]} options.locations - Custom location list
   * @param {boolean} options.requireFlightMeasurement - Require feet measurement for flight tag
   * @returns {string[]} Sorted array of all extracted tags
   */
  static extractAllTags(content, filePath, sharedData, options = {}) {
    const {
      contentType = 'generic',
      factions = [],
      locations = [],
      requireFlightMeasurement = false,
    } = options;

    const allTags = [];

    // Core mechanic tags (common to all content types)
    allTags.push(...this.extractDamageTags(content, sharedData));
    allTags.push(...this.extractConditionTags(content, sharedData));
    allTags.push(...this.extractAbilitySaveTags(content, sharedData));
    allTags.push(
      ...this.extractMovementTags(
        content,
        sharedData,
        requireFlightMeasurement,
      ),
    );

    // Content-specific mechanic tags
    if (contentType === 'monster') {
      allTags.push(...this.extractMonsterMechanicTags(content));
    } else if (contentType === 'item') {
      allTags.push(...this.extractItemMechanicTags(content));
    } else {
      // Generic: include both
      allTags.push(...this.extractMonsterMechanicTags(content));
      allTags.push(...this.extractItemMechanicTags(content));
    }

    // Lore tags (if provided)
    if (factions.length > 0 || locations.length > 0) {
      allTags.push(...this.extractLoreTags(content, factions, locations));
    }

    // Organizational tags
    allTags.push(...this.extractOrganizationalTags(filePath, process.cwd()));

    // Content type tags
    allTags.push(...this.extractContentTypeTags(filePath, content));

    // Deduplicate and sort
    return [...new Set(allTags)].sort();
  }
}

/**
 * Utilities for standardized metadata generator patterns
 */
export class MetadataGeneratorUtils {
  /**
   * Returns the resolved metadata backend ('pg' or 'fs').
   * Reads METADATA_BACKEND from process.env, then .env.local, defaulting to 'fs'.
   * @static
   * @returns {string} 'pg' or 'fs'
   */
  static getBackend() {
    return getMetadataBackend();
  }

  /**
   * Gets content directory for a specific type
   * @static
   * @param {string} contentType - Type of content: 'monsters', 'heirlooms', 'spells'
   * @returns {string} Absolute path to content directory
   */
  static getContentDirectory(contentType) {
    const contentPaths = {
      monsters: ['src', 'content', 'en', 'monsters'],
      heirlooms: ['src', 'content', 'en', 'items', 'heirlooms'],
      spells: ['src', 'content', 'en', 'spells'],
      trinkets: ['src', 'content', 'en', 'items', 'trinkets'],
    };

    if (!contentPaths[contentType]) {
      throw new Error(
        `Unknown content type: ${contentType}. Valid types: ${Object.keys(contentPaths).join(', ')}`,
      );
    }

    return path.resolve(PROJECT_ROOT, ...contentPaths[contentType]);
  }

  /**
   * Maps content type to its subdirectory under `.meta/{locale}/`.
   * @static
   * @param {string} contentType - 'monsters', 'heirlooms', 'spells', 'trinkets'
   * @returns {string} Subdirectory name (e.g. 'monsters', 'items/heirlooms')
   */
  static getMetaSubdir(contentType) {
    const subdirs = {
      monsters: 'monsters',
      heirlooms: path.join('items', 'heirlooms'),
      spells: 'spells',
      trinkets: path.join('items', 'trinkets'),
    };
    return subdirs[contentType] || contentType;
  }

  /**
   * Resolves the output path for a `.metadata.json` file.
   * In `pg` mode, outputs to `.meta/{locale}/{subdir}/` instead of alongside source.
   * @static
   * @param {string} sourceFilePath - Original source file path (e.g. src/content/en/monsters/foo.sheet.mdx)
   * @param {RegExp} filePattern - Pattern to replace with `.metadata.json`
   * @param {string} contentType - Content type key
   * @param {string} backend - 'pg' or 'fs'
   * @param {string} locale - Locale code
   * @returns {string} Absolute path for the metadata file
   */
  static getMetadataOutputPath(
    sourceFilePath,
    filePattern,
    contentType,
    backend,
    locale,
  ) {
    if (backend !== 'pg') {
      return sourceFilePath.replace(filePattern, '.metadata.json');
    }
    const baseName = path
      .basename(sourceFilePath)
      .replace(filePattern, '.metadata.json');
    const subdir = this.getMetaSubdir(contentType);
    return path.join(PROJECT_ROOT, '.meta', locale, subdir, baseName);
  }

  /**
   * Orchestrates metadata generation with standardized pattern
   * @static
   * @async
   * @param {Object} config - Generator configuration
   * @param {string} config.name - Display name for the generator
   * @param {string} config.contentType - Content type ('monsters', 'heirlooms', 'spells')
   * @param {RegExp} config.filePattern - Regex pattern for matching files
   * @param {Function} config.parseFile - Async function to parse a single file
   * @param {Function} [config.processResult] - Optional function to process parse result (for arrays)
   * @param {string} [config.contentDir] - Optional content directory override (for testing with fixtures)
   * @param {object} [config.storage] - Optional storage adapter with `upsert(category, locale, slug, data)` method
   * @param {string} [config.locale] - Locale for storage persistence (defaults to 'en')
   * @returns {Promise<void>}
   */
  static async runGenerator(config) {
    const {
      name,
      contentType,
      filePattern,
      parseFile,
      processResult = null,
      contentDir = null,
      storage = null,
      locale = 'en',
    } = config;

    const timerKey = `${contentType}-metadata-generation`;
    PerformanceUtils.startTimer(timerKey);

    try {
      log.message(`Scanning for ${contentType} files`);
      if (storage) {
        log.message(`Database persistence enabled for ${contentType}`);
      }

      // Load shared data - required for system to function
      const sharedData = await loadSharedData();
      log.message('Loaded shared data for optimized processing');

      // Use provided contentDir or get default from contentType
      const resolvedContentDir =
        contentDir || this.getContentDirectory(contentType);
      const files = await FileUtils.getMatchingFiles(
        resolvedContentDir,
        filePattern,
      );
      log.message(`Found ${files.length} ${contentType} files`);

      if (files.length === 0) {
        log.message(`No ${contentType} files found to process`);
        return;
      }

      // Process files with enhanced error tracking
      const results = await Promise.allSettled(
        files.map(async (filePath) => {
          try {
            const parseResult = await parseFile(filePath, sharedData);

            // Allow custom processing (e.g., counting stat blocks in arrays)
            const processed = processResult
              ? processResult(parseResult)
              : { metadata: parseResult };

            // Resolve output path — in pg mode, write to .meta/ instead of alongside source
            const backend = getMetadataBackend();
            const metadataFilePath = this.getMetadataOutputPath(
              filePath,
              filePattern,
              contentType,
              backend,
              locale,
            );

            // Ensure target directory exists (critical for .meta/ which won't pre-exist)
            await FileUtils.ensureDirectory(path.dirname(metadataFilePath));

            const success = await FileUtils.safeWriteFile(
              metadataFilePath,
              JSON.stringify(processed.metadata, null, 2),
            );

            if (!success) {
              throw new Error(
                `Failed to write metadata file: ${metadataFilePath}`,
              );
            }

            // Persist to storage adapter if configured (non-blocking — sidecar is primary)
            if (storage && processed.metadata) {
              const records = Array.isArray(processed.metadata)
                ? processed.metadata
                : [processed.metadata];
              for (const record of records) {
                if (record?.slug) {
                  try {
                    await storage.upsert(
                      contentType,
                      locale,
                      record.slug,
                      record,
                    );
                  } catch (storageErr) {
                    log.warning(`DB upsert failed for ${record.slug}`, {
                      error: storageErr.message,
                    });
                  }
                }
              }
            }

            return {
              filePath,
              success: true,
              ...processed,
            };
          } catch (error) {
            return { filePath, success: false, error: error.message };
          }
        }),
      );

      // Analyze results and report statistics
      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success,
      );
      const failed = results.filter(
        (r) =>
          r.status === 'rejected' ||
          (r.status === 'fulfilled' && !r.value.success),
      );

      // Custom stats display
      let statsMessage = `✅ Successfully parsed ${successful.length} files`;
      if (processResult && successful.length > 0) {
        const totalItems = successful.reduce((sum, result) => {
          return sum + (result.value.count || 1);
        }, 0);
        statsMessage += ` → ${totalItems} items`;
      }

      log.message(statsMessage);
      const outputLocation =
        getMetadataBackend() === 'pg' ? '.meta/' : 'alongside source';
      log.message(
        `Wrote ${successful.length} metadata files (${outputLocation})`,
      );

      if (failed.length > 0) {
        log.warning(`${failed.length} processing errors encountered`);
        failed.forEach((failure) => {
          const fileName =
            failure.status === 'fulfilled'
              ? path.basename(failure.value.filePath)
              : 'Unknown file';
          const error =
            failure.status === 'fulfilled'
              ? failure.value.error
              : failure.reason?.message || 'Unknown error';
          log.error(`${fileName}: ${error}`);
        });
      }

      // Performance summary
      const elapsed = PerformanceUtils.endTimer(timerKey);
      const avgTime =
        successful.length > 0 ? (elapsed / successful.length).toFixed(2) : 0;
      log.message(`Average processing time: ${avgTime}ms per file`);

      if (storage) {
        log.message(
          `Persisted ${contentType} records to database alongside sidecar files`,
        );
      }
    } catch (error) {
      log.error(`Fatal error in ${name}`, {
        error: error.message,
        stack: error.stack,
      });
      process.exitCode = 1;
    }
  }

  /**
   * Wraps a generator main function with CLI `--persist` flag handling.
   * Creates a storage adapter from `DATABASE_URL` when the flag is present,
   * passes it as `options.storage`, and closes it when done.
   *
   * @static
   * @async
   * @param {Function} mainFn - Generator main function `(options) => Promise<void>`
   * @returns {Promise<void>}
   *
   * @example
   * if (import.meta.url === `file://${process.argv[1]}`) {
   *   MetadataGeneratorUtils.runWithCli(main).catch(err => { process.exit(1); });
   * }
   */
  static async runWithCli(mainFn) {
    let storage = null;
    try {
      if (process.argv.includes('--persist')) {
        const { createStorageFromEnv } = await import('./metadataStorage.mjs');
        storage = await createStorageFromEnv();
        log.message('--persist flag detected, database storage enabled');
      }
      await mainFn({ storage });
    } finally {
      if (storage) await storage.close();
    }
  }
}
