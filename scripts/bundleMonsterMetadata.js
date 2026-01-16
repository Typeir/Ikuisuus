/**
 * Monster Metadata Bundler
 * 
 * @fileoverview Aggregates individual monster metadata JSON files into a single
 * bundle for client-side import. Flattens multi-stat-block files.
 * 
 * @module bundleMonsterMetadata
 * @version 1.0.0
 * @since 1.0.0
 * 
 * @requires fs Node.js file system module
 * @requires path Node.js path utilities
 */

const fs = require('fs');
const path = require('path');

/**
 * Bundles all monster metadata JSON files into a single importable JSON file.
 * Reads .metadata.json files from monsters directory and combines them.
 * 
 * @async
 * @function bundleMonsterMetadata
 * @returns {Promise<void>} Resolves when bundling is complete
 * @throws {Error} If unable to read source files or write output
 * 
 * @description
 * 1. Scans src/content/en/monsters/ for .metadata.json files
 * 2. Parses and flattens all metadata (handles multi-stat-block arrays)
 * 3. Writes combined output to src/lib/data/monsters.json
 * 4. Creates output directory if it doesn't exist
 * 
 * Note: Monster metadata files can contain arrays of stat blocks.
 * This function flattens them into a single array.
 * 
 * @example
 * // Run from command line
 * node bundleMonsterMetadata.js
 * // Output: ✓ Bundled 77 monsters to src/lib/data/monsters.json
 */
async function bundleMonsterMetadata() {
  const monstersDir = path.join(process.cwd(), 'src', 'content', 'en', 'monsters');
  const outputFile = path.join(process.cwd(), 'src', 'lib', 'data', 'monsters.json');
  
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(monstersDir);
    const metadataFiles = files.filter(f => f.endsWith('.metadata.json'));

    const allMonsters = metadataFiles.map(file => {
      const content = fs.readFileSync(path.join(monstersDir, file), 'utf-8');
      return JSON.parse(content);
    }).flat(); // Flatten in case any files contain arrays

    fs.writeFileSync(outputFile, JSON.stringify(allMonsters, null, 2));
    console.log(`✓ Bundled ${allMonsters.length} monsters to ${outputFile}`);
  } catch (error) {
    console.error('Error bundling monster metadata:', error);
    process.exit(1);
  }
}

bundleMonsterMetadata();
