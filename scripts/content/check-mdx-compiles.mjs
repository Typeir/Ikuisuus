/**
 * @fileoverview Compiles every content MDX file and reports the ones that fail.
 * @description The format gate reads structure, and the metadata generators read
 * text, so both pass on a file the MDX compiler rejects — an unclosed block
 *
 * @module scripts/content/check-mdx-compiles
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-07
 */

import { compile } from '@mdx-js/mdx';
import { readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { glob } from 'node:fs/promises';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

const ROOT = resolve(import.meta.dirname, '../..');
const CONTENT = resolve(ROOT, 'src/content');

/**
 * The parse-affecting half of the site's remark chain.
 *
 * @description Only plugins that change how a file parses matter here
 */
const PLUGINS = [remarkGfm, remarkMath];

/**
 * Compiles one file and returns its failure, if any.
 *
 * @param {string} file - Absolute path to the MDX file
 * @returns {Promise<{file: string, line: number|null, message: string} | null>}
 * The failure, or null when the file compiles
 */
async function failureOf(file) {
  const source = await readFile(file, 'utf8');
  try {
    await compile(source, { remarkPlugins: PLUGINS, jsx: true });
    return null;
  } catch (error) {
    return {
      file: relative(ROOT, file).replaceAll('\\', '/'),
      line: error.line ?? null,
      message: String(error.reason ?? error.message ?? error).split('\n')[0],
    };
  }
}

/**
 * Compiles the corpus and reports what fails.
 *
 * @returns {Promise<void>} Resolves once the report is written
 */
async function main() {
  const asJson = process.argv.includes('--json');
  const files = [];
  for await (const entry of glob('**/*.mdx', { cwd: CONTENT })) {
    files.push(resolve(CONTENT, entry));
  }
  files.sort();

  const failures = [];
  for (const file of files) {
    const failure = await failureOf(file);
    if (failure) failures.push(failure);
  }

  if (asJson) {
    process.stdout.write(
      JSON.stringify({ checked: files.length, failures }, null, 2) + '\n',
    );
  } else {
    for (const failure of failures) {
      process.stdout.write(
        `${failure.file}${failure.line ? `:${failure.line}` : ''}\n  ${failure.message}\n`,
      );
    }
    process.stdout.write(
      `\n${files.length} files checked, ${failures.length} fail to compile\n`,
    );
  }
  process.exitCode = failures.length > 0 ? 1 : 0;
}

await main();
