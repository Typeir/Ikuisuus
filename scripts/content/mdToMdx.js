/**
 * Markdown to MDX Extension Converter
 * 
 * @fileoverview Converts .md files to .mdx extension for Next.js MDX processing.
 * Part of the pre-initialization build pipeline (Stage 3).
 * 
 * @module mdToMdx
 * @version 1.0.0
 * @since 1.0.0
 * 
 * @requires fs Node.js file system module
 * @requires path Node.js path utilities
 * 
 * @description
 * Recursively scans content directories and renames all .md files to .mdx.
 * Required because Next.js MDX plugin only processes .mdx files.
 * 
 * @example
 * node mdToMdx.js
 * // Output: ✅ Renamed: src/content/en/rules/combat.md → combat.mdx
 */

const fs = require('fs');
const path = require('path');

/**
 * Recursively walks a directory and renames all `.md` files to `.mdx`.
 *
 * @function renameMarkdownToMdx
 * @param {string} dir - The directory to traverse
 * @returns {void}
 * 
 * @description
 * - Only affects files ending in `.md`
 * - Preserves directory structure
 * - Logs each rename to the console
 * - Continues on errors
 * 
 * @example
 * renameMarkdownToMdx('src/content/en');
 */
function renameMarkdownToMdx(dir) {
  /** @type {fs.Dirent[]} */
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      renameMarkdownToMdx(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      /** @type {string} */
      const newPath = fullPath.replace(/\.(md|mdx)$/, '.mdx');

      try {
        fs.renameSync(fullPath, newPath);
        console.log(`✅ Renamed: ${fullPath} → ${newPath}`);
      } catch (err) {
        console.error(`❌ Failed to rename ${fullPath}:`, err);
      }
    }
  }
}

// Start the recursive rename process
['en'].forEach((locale) =>
  renameMarkdownToMdx(path.join(process.cwd(), 'src', 'content', locale))
);
