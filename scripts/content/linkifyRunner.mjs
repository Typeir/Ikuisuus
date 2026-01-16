#!/usr/bin/env node
/**
 * Linkify CLI — applies linkifyMarkdown() to a tree of .md/.mdx files.
 *
 * Usage:
 *   node scripts/linkify-runner.mjs --links scripts/global-links.json --root src/app/content/en/world --write --backup
 *   cat scripts/global-links.json | node scripts/linkify-runner.mjs --root src/app/content/en/world --write
 *
 * Flags:
 *   --links <file>   JSON array [{ "term": "...", "path": "..." }]; if omitted, reads from STDIN
 *   --root <dir>     Root directory to scan (default: src/app/content/en/world)
 *   --ext <list>     Comma-separated extensions (default: .md,.mdx)
 *   --write          Actually write changes (omit for dry-run)
 *   --backup         Write .bak files before overwriting
 */

import { globby } from "globby"; // ✅ default export in globby@14
import { copyFile, readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { linkifyMarkdown } from "./linkifyMarkdown.mjs"; // or ./linkifyMarkdown.js if you use type:module

/** @typedef {{ term: string, path: string }} LinkSpec */

const getArg = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const hasFlag = (name) => process.argv.includes(name);

/** Read specs from a JSON file. */
const readSpecsFromFile = async (file) => {
  const raw = await readFile(file, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Links JSON must be an array.");
  for (const [i, x] of data.entries()) {
    const termValid = typeof x.term === "string" || (Array.isArray(x.term) && x.term.every(t => typeof t === "string"));
    if (!x || !termValid || typeof x.path !== "string") {
      throw new Error(`Bad link spec at index ${i} — expected { term: string | string[], path: string }.`);
    }
  }
  return /** @type {LinkSpec[]} */ (data);
};

/** Read specs from STDIN. */
const readSpecsFromStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) throw new Error("No JSON on STDIN.");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Links JSON must be an array.");
  for (const [i, x] of data.entries()) {
    const termValid = typeof x.term === "string" || (Array.isArray(x.term) && x.term.every(t => typeof t === "string"));
    if (!x || !termValid || typeof x.path !== "string") {
      throw new Error(`Bad link spec at index ${i} — expected { term: string | string[], path: string }.`);
    }
  }
  return /** @type {LinkSpec[]} */ (data);
};

/** Mask fenced/inline code so linkify doesn't touch it. */
const maskCode = (input) => {
  let text = input;
  /** @type {string[]} */
  const masks = [];

  text = text.replace(/```[\s\S]*?```/g, (m) => {
    const id = `__FENCE_MASK_${masks.length}__`;
    masks.push(m);
    return id;
  });

  text = text.replace(/`[^`\n]+`/g, (m) => {
    const id = `__INLINE_MASK_${masks.length}__`;
    masks.push(m);
    return id;
  });

  return { text, masks };
};

/** Restore masked code segments. */
const unmaskCode = (text, masks) =>
  text.replace(/__(FENCE|INLINE)_MASK_(\d+)__/g, (_m, _kind, n) => masks[Number(n)]);

/** Build canonical self URL path (/en/library/world/...) for a given file under root. */
const toSelfPath = (file, normalizedRoot) => {
  const posixFile = file.replace(/\\/g, "/");
  let rel = posixFile.startsWith(normalizedRoot)
    ? posixFile.slice(normalizedRoot.length)
    : posixFile;
  rel = rel.replace(/^\/+/, ""); // drop leading slash(es)
  // strip extension
  let slugPath = rel.replace(/\.mdx?$/i, "");
  // handle .../index.mdx -> ...
  if (/\/index$/i.test(slugPath)) slugPath = slugPath.replace(/\/index$/i, "");
  return `/en/library/world/${slugPath}`.replace(/\/+$/g, "");
};

const main = async () => {
  const linksPath = getArg("--links", null);
  const root = getArg("--root", "src/app/content/en/world"); // ✅ your actual world root
  const extList = getArg("--ext", ".md,.mdx");
  const exts = new Set(extList.split(",").map((s) => s.trim().toLowerCase()));
  const write = hasFlag("--write");
  const backup = hasFlag("--backup");

  /** @type {LinkSpec[]} */
  let specs;
  try {
    specs = linksPath ? await readSpecsFromFile(linksPath) : await readSpecsFromStdin();
  } catch (err) {
    console.error(`[linkify] Failed to load links: ${(err && err.message) || err}`);
    process.exit(1);
  }

  // Glob files (normalize root to forward slashes for Windows)
  const normalizedRoot = root.replace(/\\/g, "/").replace(/\/+$/g, "");
  const patterns = Array.from(exts).map((e) => `${normalizedRoot}/**/*${e}`);
  const files = await globby(patterns, {
    gitignore: true,
    ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/build/**", "**/.vercel/**"],
  });

  if (files.length === 0) {
    console.log("[linkify] No files matched.");
    process.exit(0);
  }

  let touched = 0;

  for (const file of files) {
    const before = await readFile(file, "utf8");

    // Compute the page's canonical URL to avoid self-links
    const selfPath = toSelfPath(file, normalizedRoot);

    // Mask code, linkify with self-skip, then unmask
    const { text: masked, masks } = maskCode(before);
    const afterMasked = linkifyMarkdown(masked, specs, { selfPath }); // ✅ pass selfPath
    const after = unmaskCode(afterMasked, masks);

    if (after !== before) {
      touched++;
      if (write) {
        if (backup) await copyFile(file, `${file}.bak`);
        await writeFile(file, after, "utf8");
        console.log(`✅ UPDATED: ${file}`);
      } else {
        console.log(`\n${"_".repeat(80)}`);
        console.log(`📝 WOULD UPDATE: ${file}`);
        console.log(`${"_".repeat(80)}`);
        
        // Show diff-like output for dry run
        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');
        let changes = 0;
        
        for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
          const beforeLine = beforeLines[i] || '';
          const afterLine = afterLines[i] || '';
          
          if (beforeLine !== afterLine) {
            changes++;
            if (changes <= 10) { // Limit to first 10 changes per file
              console.log(`\n  📍 Line ${i + 1}:`);
              if (beforeLine) console.log(`    ❌ ${beforeLine}`);
              if (afterLine) console.log(`    ✅ ${afterLine}`);
            }
          }
        }
        
        if (changes > 10) {
          console.log(`\n  ⚠️  ... and ${changes - 10} more changes`);
        }
        console.log(`${"_".repeat(80)}\n`);
      }
    }
  }

  console.log(
    `[linkify] ${write ? "Done" : "Dry run"} — ${touched} file(s) ${write ? "updated" : "to update"}.`
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
