/**
 * Heirloom Metadata Bundler
 *
 * @fileoverview Aggregates individual heirloom metadata JSON files into a single
 * bundle for client-side import. Eliminates need for API routes in certain contexts.
 *
 * @module bundleHeirloomMetadata
 * @version 1.0.0
 * @since 1.0.0
 *
 * @requires fs Node.js file system module
 * @requires path Node.js path utilities
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../core/logger.cjs');
const log = createLogger({ script: 'bundleHeirloomMetadata' });

/**
 * Bundles all heirloom metadata JSON files into a single importable JSON file.
 * Reads .metadata.json files from heirlooms directory and combines them.
 *
 * @async
 * @function bundleHeirloomMetadata
 * @returns {Promise<void>} Resolves when bundling is complete
 * @throws {Error} If unable to read source files or write output
 *
 * @description
 * 1. Scans src/content/en/items/heirlooms/ for .metadata.json files
 * 2. Parses and flattens all metadata (handles arrays)
 * 3. Writes combined output to src/lib/data/heirlooms.json
 * 4. Creates output directory if it doesn't exist
 *
 * @example
 * // Run from command line
 * node bundleHeirloomMetadata.js
 * // Output: ✓ Bundled 55 heirlooms to src/lib/data/heirlooms.json
 */
async function bundleHeirloomMetadata() {
  const heirloomsDir = path.join(
    process.cwd(),
    'src',
    'content',
    'en',
    'items',
    'heirlooms',
  );
  const outputFile = path.join(
    process.cwd(),
    'src',
    'lib',
    'data',
    'heirlooms.json',
  );

  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(heirloomsDir);
    const metadataFiles = files.filter((f) => f.endsWith('.metadata.json'));

    const allHeirlooms = metadataFiles
      .map((file) => {
        const content = fs.readFileSync(path.join(heirloomsDir, file), 'utf-8');
        return JSON.parse(content);
      })
      .flat(); // Flatten in case any files contain arrays

    fs.writeFileSync(outputFile, JSON.stringify(allHeirlooms, null, 2));
    log.message('✓ Bundled heirlooms', {
      count: allHeirlooms.length,
      path: outputFile,
    });
  } catch (error) {
    log.error('Error bundling heirloom metadata', {
      error: error.message || String(error),
    });
    process.exit(1);
  }
}

bundleHeirloomMetadata();
