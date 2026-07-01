/**
 * Scrapes every .mdx file under src/content/en/ and scaffolds them into a single
 * compressed file at .ignore/Ikuisuus-compressed.mdx.
 *
 * Each file's section is headed by its content slug (filesystem path relative to
 * src/content/en/, minus multi-extensions like .sheet.mdx / .heirloom.mdx / .lore.mdx).
 *
 * Usage: node .github/scripts/scaffold-compressed.mjs
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..', '..');
const CONTENT_ROOT = join(ROOT, 'src', 'content', 'en');
const OUTPUT = join(ROOT, '.ignore', 'Ikuisuus-compressed.mdx');

/**
 * Multi-extensions that should be stripped for the slug.
 * Order matters: check longer patterns first.
 */
const MULTI_EXTS = [
    '.specialization.mdx',
    '.bloodline.mdx',
    '.heirloom.mdx',
    '.trinket.mdx',
    '.sheet.mdx',
    '.lore.mdx',
    '.mdx',
];

/**
 * Derive the content slug from a file's absolute path.
 * Strips the content root prefix and any known multi-extension.
 * @param {string} absPath
 * @returns {string}
 */
function slugFromPath(absPath) {
    const rel = relative(CONTENT_ROOT, absPath).replaceAll('\\', '/');
    for (const ext of MULTI_EXTS) {
        if (rel.endsWith(ext)) {
            return rel.slice(0, -ext.length);
        }
    }
    // Fallback: strip last extension
    const lastDot = rel.lastIndexOf('.');
    return lastDot > 0 ? rel.slice(0, lastDot) : rel;
}

/**
 * Recursively collect all .mdx file paths.
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function collectMdx(dir) {
    /** @type {string[]} */
    const results = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...(await collectMdx(full)));
        } else if (entry.name.endsWith('.mdx')) {
            results.push(full);
        }
    }
    return results;
}

async function main() {
    console.log('🔎 Collecting .mdx files...');
    const files = await collectMdx(CONTENT_ROOT);
    files.sort(); // deterministic order

    console.log(`   Found ${files.length} files`);

    /** @type {string[]} */
    const sections = [];

    for (const file of files) {
        const slug = slugFromPath(file);
        const raw = await readFile(file, 'utf-8');

        // Trim trailing whitespace per line but keep content intact
        const body = raw.trimEnd();

        sections.push(`---\n## ${slug}\n---\n\n${body}\n`);
    }

    const output = sections.join('\n');

    await writeFile(OUTPUT, output, 'utf-8');
    console.log(`✅ Written ${files.length} sections → ${relative(ROOT, OUTPUT)}`);
    console.log(`   ${(Buffer.byteLength(output) / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
    console.error('❌', err);
    process.exit(1);
});
