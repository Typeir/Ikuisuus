#!/usr/bin/env npx tsx --tsconfig tsconfig.scripts.json
/**
 * Linkify CLI — applies linkifyMarkdown() to a tree of .md/.mdx files.
 *
 * @fileoverview CLI runner for the markdown linkifier.
 *
 * @module linkifyRunner
 * @version 1.0.0
 * @since 1.0.0
 *
 * Usage:
 *   npx tsx scripts/content/linkifyRunner.ts --links scripts/core/links.json --root src/content/en/world --write --backup
 *
 * Flags:
 *   --links file   JSON array of link specs; if omitted, reads from STDIN
 *   --root dir     Root directory to scan (default: src/content/en/world)
 *   --ext list     Comma-separated extensions (default: .md,.mdx)
 *   --write        Actually write changes (omit for dry-run)
 *   --backup       Write .bak files before overwriting
 */

import { createLogger } from '@/lib/logging/logger';
import fg from 'fast-glob';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { linkifyMarkdown } from './linkifyMarkdown';

const log = createLogger({ script: 'linkifyRunner' });

/** Link specification entry */
interface LinkSpec {
  /** Term or array of terms to link */
  term: string | string[];
  /** Target URL path */
  path: string;
}

const getArg = (
  name: string,
  fallback: string | null = null,
): string | null => {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const hasFlag = (name: string): boolean => process.argv.includes(name);

/** Read specs from a JSON file. */
const readSpecsFromFile = async (file: string): Promise<LinkSpec[]> => {
  const raw = await readFile(file, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('Links JSON must be an array.');
  for (const [i, x] of data.entries()) {
    const termValid =
      typeof x.term === 'string' ||
      (Array.isArray(x.term) &&
        x.term.every((t: unknown) => typeof t === 'string'));
    if (!x || !termValid || typeof x.path !== 'string') {
      throw new Error(
        `Bad link spec at index ${i} — expected { term: string | string[], path: string }.`,
      );
    }
  }
  return data as LinkSpec[];
};

/** Read specs from STDIN. */
const readSpecsFromStdin = async (): Promise<LinkSpec[]> => {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) throw new Error('No JSON on STDIN.');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('Links JSON must be an array.');
  for (const [i, x] of data.entries()) {
    const termValid =
      typeof x.term === 'string' ||
      (Array.isArray(x.term) &&
        x.term.every((t: unknown) => typeof t === 'string'));
    if (!x || !termValid || typeof x.path !== 'string') {
      throw new Error(
        `Bad link spec at index ${i} — expected { term: string | string[], path: string }.`,
      );
    }
  }
  return data as LinkSpec[];
};

/** Mask fenced/inline code so linkify doesn't touch it. */
const maskCode = (input: string): { text: string; masks: string[] } => {
  let text = input;
  const masks: string[] = [];

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
const unmaskCode = (text: string, masks: string[]): string =>
  text.replace(
    /__(FENCE|INLINE)_MASK_(\d+)__/g,
    (_m, _kind, n) => masks[Number(n)],
  );

/** Build canonical self URL path (/en/library/world/...) for a given file under root. */
const toSelfPath = (file: string, normalizedRoot: string): string => {
  const posixFile = file.replace(/\\/g, '/');
  let rel = posixFile.startsWith(normalizedRoot)
    ? posixFile.slice(normalizedRoot.length)
    : posixFile;
  rel = rel.replace(/^\/+/, '');
  let slugPath = rel.replace(/\.mdx?$/i, '');
  if (/\/index$/i.test(slugPath)) slugPath = slugPath.replace(/\/index$/i, '');
  return `/en/library/world/${slugPath}`.replace(/\/+$/g, '');
};

const main = async (): Promise<void> => {
  const linksPath = getArg('--links', null);
  const root = getArg('--root', 'src/app/content/en/world')!;
  const extList = getArg('--ext', '.md,.mdx')!;
  const exts = new Set(extList.split(',').map((s) => s.trim().toLowerCase()));
  const write = hasFlag('--write');
  const backup = hasFlag('--backup');

  let specs: LinkSpec[];
  try {
    specs = linksPath
      ? await readSpecsFromFile(linksPath)
      : await readSpecsFromStdin();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('[linkify] Failed to load links', { error: message });
    process.exit(1);
  }

  const normalizedRoot = root.replace(/\\/g, '/').replace(/\/+$/g, '');
  const patterns = Array.from(exts).map((e) => `${normalizedRoot}/**/*${e}`);
  const files = await fg(patterns, {
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.vercel/**',
    ],
  });

  if (files.length === 0) {
    log.message('[linkify] No files matched.');
    process.exit(0);
  }

  let touched = 0;

  for (const file of files) {
    const before = await readFile(file, 'utf8');

    const selfPath = toSelfPath(file, normalizedRoot);

    const { text: masked, masks } = maskCode(before);
    const afterMasked = linkifyMarkdown(masked, specs, { selfPath });
    const after = unmaskCode(afterMasked, masks);

    if (after !== before) {
      touched++;
      if (write) {
        if (backup) await copyFile(file, `${file}.bak`);
        await writeFile(file, after, 'utf8');
        log.message(`✅ UPDATED: ${file}`);
      } else {
        log.message(`\n${'_'.repeat(80)}`);
        log.message(`📝 WOULD UPDATE: ${file}`);
        log.message(`${'_'.repeat(80)}`);

        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');
        let changes = 0;

        for (
          let i = 0;
          i < Math.max(beforeLines.length, afterLines.length);
          i++
        ) {
          const beforeLine = beforeLines[i] || '';
          const afterLine = afterLines[i] || '';

          if (beforeLine !== afterLine) {
            changes++;
            if (changes <= 10) {
              log.message(`\n  📍 Line ${i + 1}:`);
              if (beforeLine) log.message(`    ❌ ${beforeLine}`);
              if (afterLine) log.message(`    ✅ ${afterLine}`);
            }
          }
        }

        if (changes > 10) {
          log.message(`\n  ⚠️  ... and ${changes - 10} more changes`);
        }
        log.message(`${'_'.repeat(80)}\n`);
      }
    }
  }

  log.message(
    `[linkify] ${write ? 'Done' : 'Dry run'} — ${touched} file(s) ${write ? 'updated' : 'to update'}.`,
  );
};

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  log.error('Fatal error in linkifyRunner', { error: message });
  process.exit(1);
});
