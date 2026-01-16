/**
 * Monster Trait Heading Standardizer
 * 
 * @fileoverview Normalizes trait and action headings in monster stat block files.
 * Converts inconsistent markdown formats to standardized H4/H5 headings.
 * 
 * @module standardizeTraitHeadings
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires fs.promises Node.js async file system operations
 * @requires path Node.js path module
 * 
 * @description
 * Processes monster .sheet.mdx files to standardize heading formats:
 * - Converts ### Trait Name → #### Trait Name (in H2 sections)
 * - Converts #### Trait Name → ##### Trait Name (in H3 sections)
 * - Converts **Trait Name.** Description → #### Trait Name + Description block
 * - Tracks section context (Traits, Actions, Reactions, Legendary Actions)
 * - Preserves original content while normalizing structure
 * 
 * @example
 * ```bash
 * node scripts/utils/standardizeTraitHeadings.js
 * ```
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Path to the monsters content directory.
 * @constant {string}
 */
const MONSTERS_DIR = path.join(__dirname, '../src/content/en/monsters');

/**
 * Processes a single monster file to standardize trait headings.
 * 
 * @async
 * @function standardizeFile
 * @param {string} filePath - Absolute path to the .sheet.mdx file
 * @returns {Promise<string>} The processed file content with standardized headings
 * 
 * @description
 * Parses the file line-by-line, tracking section context:
 * - Detects Traits/Actions/Reactions/Legendary Actions sections
 * - Converts ### to #### for H2 sections, #### to ##### for H3 sections
 * - Converts **Bold Name.** patterns to proper heading + content
 * - Exits section tracking when encountering new H2/H3 headings
 */
async function standardizeFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const result = [];
  let inTraitsOrActionsSection = false;
  let sectionLevel = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Track when we're in a Traits, Actions, Reactions, or Legendary Actions section
    if (trimmed.match(/^##\s+(Traits|Actions|Reactions|Legendary Actions|Lair Actions|Battlefield Actions|Legendary Deed: Phase|Bonus Actions)/)) {
      inTraitsOrActionsSection = true;
      sectionLevel = 2;
      result.push(line);
      continue;
    }
    
    // Also track ### level sections for nested stat blocks
    if (trimmed.match(/^###\s+(Traits|Actions|Reactions|Legendary Actions)/)) {
      inTraitsOrActionsSection = true;
      sectionLevel = 3;
      result.push(line);
      continue;
    }
    
    // Exit section when we hit another h2/h3 heading that's not a sub-trait
    if (inTraitsOrActionsSection && trimmed.match(/^##[^#]/)) {
      inTraitsOrActionsSection = false;
      sectionLevel = null;
    }
    
    // Exit nested section when we hit h2 or h3
    if (inTraitsOrActionsSection && sectionLevel === 3 && trimmed.match(/^##/)) {
      inTraitsOrActionsSection = false;
      sectionLevel = null;
    }
    
    if (inTraitsOrActionsSection) {
      // Pattern 1: Convert ### Trait Name to #### Trait Name (for h2 sections)
      // Convert #### to ##### (for h3 sections)
      if (sectionLevel === 2 && trimmed.match(/^###\s+[A-Z]/)) {
        // Convert ### to ####, remove trailing period if present
        const heading = trimmed.replace(/^###\s+/, '').replace(/\.$/, '');
        result.push(`#### ${heading}`);
        continue;
      }
      
      if (sectionLevel === 3 && trimmed.match(/^####\s+[A-Z]/)) {
        // Convert #### to #####, remove trailing period if present
        const heading = trimmed.replace(/^####\s+/, '').replace(/\.$/, '');
        result.push(`##### ${heading}`);
        continue;
      }
      
      // Pattern 2: Convert **Trait Name.** to #### Trait Name (for h2 sections)
      // or ##### for h3 sections
      const boldTraitMatch = trimmed.match(/^\*\*([A-Z][^*]+)\.\*\*\s*(.*)$/);
      if (boldTraitMatch) {
        const traitName = boldTraitMatch[1].trim();
        const restOfLine = boldTraitMatch[2].trim();
        
        if (sectionLevel === 2) {
          result.push(`#### ${traitName}`);
        } else if (sectionLevel === 3) {
          result.push(`##### ${traitName}`);
        }
        
        // Add blank line, then description if it exists
        if (restOfLine) {
          result.push('');
          result.push(restOfLine);
        }
        continue;
      }
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

/**
 * Main entry point - processes all monster sheet files.
 * 
 * @async
 * @function main
 * @returns {Promise<void>}
 * 
 * @description
 * Scans the monsters directory for .sheet.mdx files and processes each:
 * - Reads original content
 * - Applies standardization transformations
 * - Writes back only if content changed
 * - Reports progress and summary statistics
 */
async function main() {
  const files = await fs.readdir(MONSTERS_DIR);
  const sheetFiles = files.filter(f => f.endsWith('.sheet.mdx'));
  
  let processedCount = 0;
  let changedCount = 0;
  
  for (const file of sheetFiles) {
    const filePath = path.join(MONSTERS_DIR, file);
    const original = await fs.readFile(filePath, 'utf-8');
    const updated = await standardizeFile(filePath);
    
    if (original !== updated) {
      await fs.writeFile(filePath, updated, 'utf-8');
      console.log(`✓ Updated: ${file}`);
      changedCount++;
    } else {
      console.log(`  No change: ${file}`);
    }
    processedCount++;
  }
  
  console.log(`\n${changedCount}/${processedCount} files updated`);
}

main().catch(console.error);
