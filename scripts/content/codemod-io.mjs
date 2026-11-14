/**
 * @fileoverview Shared dry-run and apply plumbing for content codemods.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Splits text into lines and their separators so a rejoin is byte-exact.
 *
 * @param {string} text - Source text.
 * @returns {string[]} Even indexes hold lines, odd indexes hold separators.
 */
export function splitKeepingEol(text) {
  return text.split(/(\r?\n)/);
}

/**
 * Maps every line of a text through a transform, keeping separators.
 *
 * @param {string} text - Source text.
 * @param {(line: string, index: number) => string} transform - Line mapper, index counts lines from 1.
 * @returns {string} Rewritten text.
 */
export function mapLines(text, transform) {
  const parts = splitKeepingEol(text);
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = transform(parts[i], i / 2 + 1);
  }
  return parts.join('');
}

/**
 * Detects the line ending a text uses.
 *
 * @param {string} text - Source text.
 * @returns {string} `\r\n` or `\n`.
 */
export function eolOf(text) {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

/**
 * Builds a unified diff between two texts with git.
 *
 * @param {string} path - Repo-relative path shown in the diff headers.
 * @param {string} before - Original text.
 * @param {string} after - Rewritten text.
 * @returns {string} Unified diff, empty when the texts match.
 */
export function unifiedDiff(path, before, after) {
  if (before === after) {
    return '';
  }
  const dir = mkdtempSync(join(tmpdir(), 'codemod-'));
  try {
    const left = join(dir, 'a');
    const right = join(dir, 'b');
    writeFileSync(left, before.replace(/\r\n/g, '\n'));
    writeFileSync(right, after.replace(/\r\n/g, '\n'));
    const result = spawnSync(
      'git',
      ['-c', 'core.autocrlf=false', 'diff', '--no-index', '--no-color', '-U1', left, right],
      { encoding: 'utf8' },
    );
    const body = result.stdout.split('\n');
    const start = body.findIndex((line) => line.startsWith('@@'));
    return [`--- a/${path}`, `+++ b/${path}`, ...body.slice(start)].join('\n').trimEnd();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Reads the `--apply` and `--out <file>` flags from argv.
 *
 * @param {string[]} argv - Process arguments after the script path.
 * @returns {{ apply: boolean, out: string | null }} Parsed flags.
 */
export function parseFlags(argv) {
  const outIndex = argv.indexOf('--out');
  return {
    apply: argv.includes('--apply'),
    out: outIndex >= 0 ? (argv[outIndex + 1] ?? null) : null,
  };
}

/**
 * Prints or writes a codemod's edits, then applies them when asked.
 *
 * @param {string} name - Codemod name for the header.
 * @param {Array<{ path: string, before: string, after: string }>} edits - Proposed file rewrites.
 * @param {{ apply: boolean, out: string | null }} flags - Run flags.
 * @param {string[]} [notes] - Extra report lines printed after the diff.
 * @returns {string} The full dry-run text.
 */
export function emit(name, edits, flags, notes = []) {
  const changed = edits.filter((edit) => edit.before !== edit.after);
  const diff = changed.map((edit) => unifiedDiff(edit.path, edit.before, edit.after)).join('\n');
  const header = `# ${name}: ${flags.apply ? 'APPLY' : 'DRY RUN'}, ${changed.length} file(s) changed`;
  const text = [header, '', diff, '', ...notes].join('\n');
  if (flags.out) {
    writeFileSync(flags.out, text);
  } else {
    process.stdout.write(`${text}\n`);
  }
  if (flags.apply) {
    for (const edit of changed) {
      writeFileSync(edit.path, edit.after);
    }
  }
  return text;
}

/**
 * Reads a UTF-8 file.
 *
 * @param {string} path - File path.
 * @returns {string} File text.
 */
export function readText(path) {
  return readFileSync(path, 'utf8');
}
