/**
 * @fileoverview Heirloom Metadata Generator - Specialized parser for magical items and equipment
 * @description Parses `.mdx` files from the heirlooms directory and extracts comprehensive metadata
 * including rarity classification, item types, attunement requirements, weapon properties, 
 * and gameplay mechanics tags. Generates JSON index files for efficient content querying.
 * 
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires fs/promises
 * @requires path
 * @requires ../core/shared-utils.mjs
 * 
 * @example
 * ```bash
 * # Generate heirloom metadata
 * node scripts/generateHeirloomMetadata.mjs
 * ```
 * 
 * @example
 * ```javascript
 * // Programmatic usage
 * import { generateHeirloomMetadata } from './generateHeirloomMetadata.mjs';
 * const metadata = await generateHeirloomMetadata();
 * ```
 */

import { promises as fs } from 'fs';
import path from 'path';
import {  
  TextUtils, 
  ItemData,
  ParsingUtils,
  TaggingUtils,
  MetadataGeneratorUtils
} from '../core/shared-utils.mjs';


/**
 * Parses rarity, attunement requirements, and weapon properties from italic metadata lines
 * 
 * @function parseRarityAndAttunement
 * @param {string[]} lines - Array of file lines to parse (searches first 15 lines)
 * @returns {{
 *   rarity?: string,
 *   requiresAttunement?: boolean,
 *   attunementRequirements?: string,
 *   weaponInfo?: {
 *     weaponType?: string,
 *     hitModifier?: number,
 *     range?: string,
 *     mastery?: string[]
 *   }
 * }} Parsed metadata object containing item properties
 * 
 * @description Analyzes italic lines (wrapped in underscores) to extract:
 * - Item rarity classification (e.g., "Very rare", "Legendary")
 * - Attunement requirements and restrictions
 * - Weapon type and enhancement bonuses
 * - Weapon properties like range, mastery, and special abilities
 * 
 * @example
 * ```javascript
 * const lines = ['# Magic Sword', '_Very rare weapon +2 (requires attunement by a paladin)_'];
 * const result = parseRarityAndAttunement(lines);
 * // { rarity: "very rare", requiresAttunement: true, attunementRequirements: "by a paladin" }
 * ```
 */
function parseRarityAndAttunement(lines, sharedData = null) {
  // Look for italic lines under the item heading, up until the first '---' separator
  const cutoffIndex = lines.findIndex(l => /^\s*---\s*$/.test(l));
  const headerLines = cutoffIndex === -1 ? lines : lines.slice(0, cutoffIndex);

  const italicLines = headerLines
    .filter(l => /^_.*_$/.test(l.trim()))
    .map(l => TextUtils.clean(l.replace(/^_/, '').replace(/_$/, '')));

  let rarity = undefined;
  let requiresAttunement = false;
  let attunementRequirements = undefined;
  let weaponInfo = undefined;

  const rarityKeywords = ItemData.getRarities(sharedData);

  for (const line of italicLines) {
    const lowerLine = line.toLowerCase();

    // Check for rarity
    for (const rarityKeyword of rarityKeywords) {
      if (lowerLine.includes(rarityKeyword)) {
        rarity = rarityKeyword;
        break;
      }
    }

    // Check for attunement
    if (lowerLine.includes('attunement')) {
      requiresAttunement = true;

      // Extract specific attunement requirements
      const attunementMatch = line.match(/requires attunement(?:\s+by\s+(.+?))?(?:\)|$)/i);
      if (attunementMatch && attunementMatch[1]) {
        attunementRequirements = TextUtils.stripMarkdown(attunementMatch[1].trim());
      }
    }

    // Check for weapon info line: "Handgun +3 (Heavy, Ranged 30/90, Loading, Special, Mastery: Slow)"
    // Must have parentheses and not be attunement, rarity, descriptive text, or subtype format
    // Skip if it matches "Type, Subtype (details)" pattern (e.g., "Clothing, cloak (magical)")
    const isSubtypeFormat = /^[^,]+,\s*[^,]+\s*\([^)]+\)\s*$/.test(line);
    if (
      line.includes('(') &&
      !lowerLine.includes('attunement') &&
      !rarityKeywords.some(r => lowerLine.includes(r)) &&
      !/property|applies/i.test(line) &&
      !isSubtypeFormat
    ) {
      const parsed = parseWeaponTitleLine(line, sharedData);
      if (parsed && Object.keys(parsed).length > 0) {
        weaponInfo = parsed;
      }
    }
  }

  return { rarity, requiresAttunement, attunementRequirements, weaponInfo };
}


/**
 * Parses weapon title line for detailed info.
 * Format: "Handgun +3 (Heavy, Ranged 30/90, Loading, Special, Mastery: Slow)"
 * @param {string} line - Italic line with weapon info.
 * @param {Object} [sharedData=null] - Shared data object
 * @returns {{ weaponType?: string, hitModifier?: number, properties?: string[], range?: string, mastery?: string[] } | undefined} Weapon details.
 */
function parseWeaponTitleLine(line, sharedData = null) {
  const info = {};
  
  // Extract weapon type and hit modifier
  // Format: "Handgun +3" or "Large Greatsword +4" or "Sword-Spear +1" or just "Handgun"
  // Extract everything before the opening paren
  const beforeParen = line.match(/^(.+?)\s*\(/i);
  if (beforeParen) {
    const fullText = beforeParen[1].trim();
    // Check for hit modifier at the end
    const modMatch = fullText.match(/^(.+?)\s+\+(\d+)$/);
    if (modMatch) {
      info.weaponType = modMatch[1].trim();
      info.hitModifier = Number(modMatch[2]);
    } else {
      info.weaponType = fullText;
    }
  }
  
  // Extract parenthetical content - handle nested parentheses by taking the outermost match
  const firstParen = line.indexOf('(');
  const lastParen = line.lastIndexOf(')');
  if (firstParen !== -1 && lastParen !== -1 && lastParen > firstParen) {
    const content = line.substring(firstParen + 1, lastParen);
    
    // Split by commas but be careful with nested parentheses
    const parts = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '(') depth++;
      else if (char === ')') depth--;
      else if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    if (current.trim()) parts.push(current.trim());
    
    const properties = [];
    const mastery = [];
    let capturingMastery = false;
    
    for (const part of parts) {
      const trimmed = part.trim();
      
      // Check for mastery start
      const masteryMatch = trimmed.match(/^Mastery:\s*(.+)$/i);
      if (masteryMatch) {
        // Start capturing mastery properties
        capturingMastery = true;
        const firstMastery = masteryMatch[1].trim();
        if (firstMastery) {
          mastery.push(firstMastery.toLowerCase());
        }
        continue;
      }
      
      // If we're capturing mastery, continue until we hit a known keyword
      if (capturingMastery) {
        // Stop capturing if we hit Special, Range, Reach, or other known patterns
        if (/^(Special|Range|Ranged?|Reach)\s*[:(/]/i.test(trimmed)) {
          capturingMastery = false;
          // Process this part normally below
        } else {
          // This is another mastery property
          mastery.push(trimmed.toLowerCase());
          continue;
        }
      }
      
      // Check for range (with or without parentheses)
      const rangeMatch = trimmed.match(/^(?:Ranged?|Range)\s+(\d+\/\d+|\(\d+\s+ft\))$/i);
      if (rangeMatch) {
        info.range = rangeMatch[1].replace(/[()]/g, '').trim();
        continue;
      }
      
      // Check for reach with units
      const reachMatch = trimmed.match(/^Reach\s+\((\d+\s+ft\.?)\)$/i);
      if (reachMatch) {
        info.range = reachMatch[1];
        properties.push('reach');
        continue;
      }
      
      // Check for special properties with details
      const specialMatch = trimmed.match(/^Special:\s*(.+)$/i);
      if (specialMatch) {
        properties.push(`special: ${specialMatch[1].toLowerCase()}`);
        continue;
      }
      
      // Regular property
      properties.push(trimmed.toLowerCase());
    }
    
    if (properties.length > 0) {
      info.properties = properties;
    }
    if (mastery.length > 0) {
      info.mastery = mastery;
    }
  }
  
  return Object.keys(info).length > 0 ? info : undefined;
}

/**
 * Extracts item type from italic metadata lines or Type property.
 * @param {string[]} lines - File lines.
 * @param {Object} [sharedData=null] - Shared data object
 * @returns {string | undefined} Item type.
 */
function parseItemType(lines, sharedData = null) {
  return ItemData.detectItemType(lines, sharedData);
}

/**
 * Parses weapon damage from Properties section.
 * Format: "Damage: 2d10 piercing" or "Damage: 1d8 slashing (1d10 versatile)"
 * @param {Object<string, string>} properties - Parsed properties object.
 * @returns {{ damage?: string, damageType?: string, versatileDamage?: string } | undefined} Weapon damage info.
 */
function parseWeaponDamageFromProperties(properties) {
  if (!properties || !properties.Damage) return undefined;
  
  const damageInfo = {};
  const damageText = properties.Damage;
  
  // Format: "2d10 piercing" or "1d8 slashing (1d10)"
  const damageMatch = damageText.match(/([\dd+]+)\s+(acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder)(?:\s*\(([\dd+]+)\s*(?:versatile)?\))?/i);
  
  if (damageMatch) {
    damageInfo.damage = damageMatch[1];
    damageInfo.damageType = damageMatch[2].toLowerCase();
    
    if (damageMatch[3]) {
      damageInfo.versatileDamage = damageMatch[3];
    }
  }
  
  return Object.keys(damageInfo).length > 0 ? damageInfo : undefined;
}





/**
 * Parses Type property and extracts weapon properties and weapon type.
 * Format: "Handgun (Martial, Light, Loading, Magical, Special: Overheat)"
 * Known properties go to weaponProperties, unknown ones become "unique:propertyname" tags.
 * @param {Object<string, string>} properties - Parsed properties object.
 * @param {Object} [sharedData=null] - Shared data object
 * @returns {{ weaponType?: string, weaponProperties?: string[], uniqueTags?: string[] }} Extracted info.
 */
function parseTypeProperty(properties, sharedData = null) {
  if (!properties || !properties.Type) return {};
  
  const typeText = properties.Type;
  const result = { weaponProperties: [], uniqueTags: [], mastery: [] };
  
  // Extract weapon type before parentheses
  const typeMatch = typeText.match(/^([A-Za-z][A-Za-z\s-]+?)(?:\s*\(|$)/i);
  let baseType = null;
  if (typeMatch) {
    baseType = typeMatch[1].trim();
  }
  
  // Extract parenthetical content
  const parenMatch = typeText.match(/\(([^)]+)\)/i);
  if (parenMatch) {
    const content = parenMatch[1];
    const parts = content.split(/,\s*/);
    
    for (const part of parts) {
      const trimmed = part.trim();
      const lower = trimmed.toLowerCase();
      
      // Check for mastery properties
      const masteryMatch = trimmed.match(/^Mastery:\s*(.+)$/i);
      if (masteryMatch) {
        result.mastery.push(...masteryMatch[1].split(/\s*,\s*/).map(m => m.trim().toLowerCase()));
        continue;
      }
      
      // Check for special properties with details like "Special: Overheat"
      const specialMatch = trimmed.match(/^Special:\s*(.+)$/i);
      if (specialMatch) {
        result.uniqueTags.push(`unique:${specialMatch[1].toLowerCase().replace(/\s+/g, '-')}`);
        continue;
      }
      
      // Check for reach with units (don't add as unique tag)
      if (/^reach\s*\(\d+\s*ft\.?\)$/i.test(trimmed)) {
        result.weaponProperties.push('reach');
        continue;
      }
      
      // Check if it's a known weapon property
      const weaponProperties = ItemData.getWeaponProperties(sharedData);
      if (weaponProperties.includes(lower)) {
        result.weaponProperties.push(lower);
      } else {
        // Unknown property - add as unique tag
        result.uniqueTags.push(`unique:${lower.replace(/\s+/g, '-')}`);
      }
    }
  }
  
  // Determine final weaponType:
  // If baseType is a category (weapon, armor, clothing), use first parenthetical item as subtype
  // Otherwise, use baseType as-is
  const lowerBase = baseType?.toLowerCase();
  const baseCategoryTypes = ItemData.getBaseCategoryTypes(sharedData).map(t => t.toLowerCase());
  if (baseCategoryTypes.includes(lowerBase)) {
    // Extract first item from parentheses as subtype
    if (parenMatch) {
      const firstItem = parenMatch[1].split(',')[0].trim();
      // Only use as weaponType if it's not a weapon property or mastery
      if (firstItem && !/^(Mastery|Special):/i.test(firstItem)) {
        result.weaponType = firstItem;
      }
    }
  } else {
    // For specific types (like "Handgun"), use baseType
    result.weaponType = baseType;
  }
  
  return result;
}

/**
 * Parses a single heirloom file and extracts metadata.
 * @param {string} filePath - Path to `.mdx` file.
 * @param {Object} [sharedData=null] - Shared data object
 * @returns {Promise<object>} Heirloom metadata object.
 */
async function parseHeirloomFile(filePath, sharedData = null) {
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = TextUtils.readLines(raw);
  const baseSlug = TextUtils.filePathToSlug(filePath);
  
  const title = ParsingUtils.parseTitle(lines);
  const { rarity, requiresAttunement, attunementRequirements, weaponInfo } = parseRarityAndAttunement(lines, sharedData);
  const itemType = parseItemType(lines, sharedData);
  const properties = ParsingUtils.parseProperties(raw);
  
  // Parse structured data from Properties section and weapon info line
  const typeInfo = parseTypeProperty(properties, sharedData);
  const weaponDamage = parseWeaponDamageFromProperties(properties);
  const weight = ParsingUtils.parseWeight(properties);
  const rangeFromProps = ParsingUtils.parseRange(properties);
  
  // Consolidate weapon info from both sources (title line and Properties section)
  let weaponType = weaponInfo?.weaponType || typeInfo.weaponType;
  const hitModifier = weaponInfo?.hitModifier;
  const range = weaponInfo?.range || rangeFromProps;
  
  // Extract subtype for non-weapon items (armor, clothing, etc.)
  // Priority: Type property > standalone italic subtype line > comma-separated format
  if (!weaponType) {
    // First, check Type property for explicit format
    if (properties && properties.Type) {
      // Format: "Clothing (Cloak)" -> extract "Cloak"
      const parenMatch = properties.Type.match(/\(([^)]+)\)/);
      if (parenMatch) {
        weaponType = parenMatch[1].split(',')[0].trim();
      }
    }
    
    // If not found, check italic lines
    if (!weaponType) {
      const italicLines = lines
        .slice(0, 10)
        .filter(l => /^_.*_$/.test(l.trim()))
        .map(l => l.replace(/^_/, '').replace(/_$/, '').trim());
      
      // Get known item types for validation
      const itemTypes = ItemData.getItemTypes(sharedData);
      const clothingTypes = ItemData.getClothingTypes(sharedData);
      const armorTypes = ItemData.getArmorTypes(sharedData);
      const allValidTypes = [...itemTypes, ...clothingTypes, ...armorTypes].map(t => t.toLowerCase());
      
      for (const line of italicLines) {
        const lower = line.toLowerCase();
        
        // Skip rarity lines (contains rarity keywords)
        const rarityKeywords = ItemData.getRarities(sharedData);
        if (rarityKeywords.some(r => lower.includes(r))) {
          continue;
        }
        
        // Skip lines with "property" or "applies" (descriptive text, not subtypes)
        if (/property|applies/i.test(line)) {
          continue;
        }
        
        // Check for standalone subtype line (e.g., "_Scroll_", "_Cloak_")
        if (allValidTypes.includes(lower) || clothingTypes.map(t => t.toLowerCase()).includes(lower) || armorTypes.map(t => t.toLowerCase()).includes(lower)) {
          weaponType = line;
          break;
        }
        
        // Check for comma-separated format: "ItemType, Subtype" or "ItemType, Subtype (details)"
        // Only if first part is a valid item type
        const commaMatch = line.match(/^([^,]+),\s*([^,]+)$/);
        if (commaMatch) {
          const firstPart = commaMatch[1].trim().toLowerCase();
          let secondPart = commaMatch[2].trim();
          
          // Only capture second part if first part is a valid item type
          if (allValidTypes.includes(firstPart)) {
            // Strip parenthetical details like "(magical)" from subtype
            const parenMatch = secondPart.match(/^([^(]+)/);
            if (parenMatch) {
              weaponType = parenMatch[1].trim();
            } else {
              weaponType = secondPart;
            }
            break;
          }
        }
      }
    }
  }
  
  // Combine weapon properties from both sources
  const allWeaponProps = new Set();
  if (weaponInfo?.properties) {
    weaponInfo.properties.forEach(p => allWeaponProps.add(p));
  }
  if (typeInfo.weaponProperties) {
    typeInfo.weaponProperties.forEach(p => allWeaponProps.add(p));
  }
  const weaponProperties = allWeaponProps.size > 0 ? Array.from(allWeaponProps).sort() : undefined;
  
  // Combine mastery from both sources
  const allMastery = new Set();
  if (weaponInfo?.mastery) {
    weaponInfo.mastery.forEach(m => allMastery.add(m));
  }
  if (typeInfo.mastery) {
    typeInfo.mastery.forEach(m => allMastery.add(m));
  }
  const mastery = allMastery.size > 0 ? Array.from(allMastery).sort() : undefined;
  
  // Get additional metadata
  const damageTypesDealt = ParsingUtils.parseDamageTypesDealt(raw, sharedData);
  const savingThrowTypes = ParsingUtils.parseSavingThrowTypes(raw, sharedData);
  const charges = ParsingUtils.parseCharges(raw);
  
  // Extract tags using unified tagging system
  const tags = TaggingUtils.extractAllTags(raw, filePath, sharedData, { contentType: 'item' });
  if (typeInfo.uniqueTags) {
    tags.push(...typeInfo.uniqueTags);
  }
  
  // Add item type tag if available
  if (itemType) {
    tags.push(`item:${itemType.toLowerCase().replace(/\s+/g, '-')}`);
  }
  
  // Add rarity tag if available
  if (rarity) {
    tags.push(`rarity:${rarity.toLowerCase().replace(/\s+/g, '-')}`);
  }
  
  // Add weapon type tag if it's a weapon
  if (weaponType) {
    tags.push(`weapon:${weaponType.toLowerCase().replace(/\s+/g, '-')}`);
  }
  
  // Sort tags for consistency
  tags.sort();
  
  // Warnings for missing critical fields
  if (!rarity) {
    console.warn(`⚠️  No rarity found for ${title || baseSlug}`);
  }
  if (!itemType) {
    console.warn(`⚠️  No item type found for ${title || baseSlug}`);
  }
  
  return {
    slug: baseSlug,
    title: title || baseSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    file: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
    link: `/library/items/heirlooms/${baseSlug}`,
    rarity,
    itemType: itemType?.toLowerCase(),
    weaponType: weaponType?.toLowerCase(),
    requiresAttunement,
    attunementRequirements,
    weaponProperties,
    mastery,
    weaponDamage,
    hitModifier,
    range,
    weight,
    damageTypesDealt,
    savingThrowTypes,
    charges,
    tags: tags.length ? Array.from(new Set(tags)).sort() : undefined,
    indexVersion: 1,
  };
}

/**
 * Main execution function with performance monitoring and parallel processing
 * 
 * @async
 * @function main
 * @param {Object} [options] - Optional configuration for testing
 * @param {string} [options.contentDir] - Override content directory (for testing with fixtures)
 * @param {RegExp} [options.filePattern] - Override file pattern (for testing with custom files)
 * @returns {Promise<void>}
 * @throws {Error} If critical failures occur during processing
 * 
 * @description Orchestrates the complete heirloom metadata generation pipeline
 * using the standardized MetadataGeneratorUtils pattern.
 * 
 * @example
 * // Normal usage
 * await main();
 * 
 * // Testing with fixtures
 * await main({ contentDir: 'tests/fixtures/heirlooms', filePattern: /\.mdx$/i });
 */
async function main(options = {}) {
  await MetadataGeneratorUtils.runGenerator({
    name: 'Heirloom Metadata Generator',
    contentType: 'heirlooms',
    filePattern: options.filePattern || /\.mdx$/i,
    parseFile: parseHeirloomFile,
    contentDir: options.contentDir  // Pass through contentDir if provided
  });
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main, parseHeirloomFile };

