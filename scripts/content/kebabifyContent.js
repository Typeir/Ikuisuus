// @ts-check

/**
 * Kebabifies all folders and `.mdx` files in `src/content/` recursively.
 * - Skips ignored folders
 * - Handles renaming safely (depth-first)
 */

const fs = require('fs');
const path = require('path');

/** Folder and file names to ignore */
const IGNORED = new Set([
  '.git',
  '.obsidian',
  'node_modules',
  '.vscode',
  '.DS_Store',
]);

/**
 * Converts a string to kebab-case
 * @param {string} str
 * @returns {string}
 */
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase → camel-case
    .replace(/\s+/g, '-') // spaces → dashes
    .replace(/_+/g, '-') // underscores → dashes
    .replace(/--+/g, '-') // collapse multiple dashes
    .toLowerCase();
}

/**
 * Recursively renames folders and `.mdx` files to kebab-case.
 * @param {string} dir
 */
function kebabifyDirectory(dir) {
  /** @type {fs.Dirent[]} */
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // First pass: handle directories (depth-first)
  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      kebabifyDirectory(fullPath);

      const kebabName = toKebabCase(entry.name);
      if (entry.name !== kebabName) {
        const kebabPath = path.join(dir, kebabName);
        fs.renameSync(fullPath, kebabPath);
        console.log(`📁 Renamed folder: ${entry.name} → ${kebabName}`);
      }
    }
  }

  // Second pass: handle `.mdx` files
  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isFile() && path.extname(entry.name) === '.mdx') {
      const baseName = path.basename(entry.name, '.mdx');
      const kebabName = toKebabCase(baseName);
      const newFile = path.join(dir, `${kebabName}.mdx`);

      if (entry.name !== `${kebabName}.mdx`) {
        fs.renameSync(fullPath, newFile);
        console.log(`📝 Renamed file: ${entry.name} → ${kebabName}.mdx`);
      }
    }
  }
}

// Entry point
console.log('🔁 Kebabifying content folder...\n');

try {
  ['en'].forEach((locale) =>
    kebabifyDirectory(path.join(process.cwd(), 'src', 'content', locale))
  );
  console.log('\n✅ All done.');
} catch (err) {
  console.error('\n✖ Error during kebabification');
  console.error(err);
  process.exit(1);
}
