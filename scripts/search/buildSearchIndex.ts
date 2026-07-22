/* paw:gate:console-log ignore */
/* paw:gate:no-inline-comments ignore */
/**
 * @fileoverview Build-Time Pagefind Search Index
 * @description Orchestrates the hybrid search index build: collects records
 * (prose + metadata) for all configured locales, feeds them into the Pagefind
 * Node API (`createIndex` + `addCustomRecord`), and writes the output to
 * `public/pagefind/{locale}/`.
 *
 * Locale loop is driven by the `LOCALES` constant — add `'es'` or `'fi'` when
 * those locales have enough content to justify indexing.
 *
 * @module scripts/search/buildSearchIndex
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import { collectRecords } from './collectRecords';

/** Locales to index. v1 is en-only; es/fi drop in by adding to this array. */
const LOCALES = ['en'];

/** Output root for the generated Pagefind bundles. */
const OUTPUT_ROOT = path.resolve(process.cwd(), 'public', 'pagefind');

/**
 * Main entry point for build-time search index generation.
 *
 * Steps:
 * 1. Create a fresh Pagefind index.
 * 2. Collect prose+metadata records for each configured locale.
 * 3. Feed records into the index via `addCustomRecord`.
 * 4. Write the compiled index bundle per locale.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const startMs = Date.now();
  console.log(
    `[search:index] Starting build for locales: ${LOCALES.join(', ')}`,
  );

  let totalRecords = 0;

  for (const locale of LOCALES) {
    /** Dynamic import — pagefind is ESM-only with no CJS exports map. */
    const { createIndex } = await import('pagefind');
    const { index } = await createIndex({
      forceLanguage: locale,
    });

    if (!index) {
      console.error(
        `[search:index] Failed to create Pagefind index for locale: ${locale}`,
      );
      continue;
    }

    console.log(`[search:index] Collecting records for locale: ${locale}`);
    const records = await collectRecords(locale);
    totalRecords += records.length;
    console.log(`[search:index] Collected ${records.length} records`);

    for (const record of records) {
      await index.addCustomRecord({
        url: record.url,
        content: record.content,
        language: record.language,
        meta: record.meta,
        filters: record.filters,
      });
    }

    const outputPath = path.join(OUTPUT_ROOT, locale);
    console.log(`[search:index] Writing index to: ${outputPath}`);
    await index.writeFiles({ outputPath });

    /* Post-process: replace import.meta.url in pagefind.js so it runs as a
       classic <script> tag. Pagefind uses import.meta.url to resolve its
       Web Worker path. Hard-code the worker URL for our deployment. */
    const pagefindJs = path.join(outputPath, 'pagefind.js');
    const raw = await fs.readFile(pagefindJs, 'utf-8');
    const patched = raw.replace(
      /import\.meta\.url/g,
      JSON.stringify(`/pagefind/${locale}/pagefind.js`),
    );
    if (patched !== raw) {
      await fs.writeFile(pagefindJs, patched, 'utf-8');
      console.log(`[search:index] Patched import.meta.url in pagefind.js`);
    }
  }

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log(
    `[search:index] Done — indexed ${totalRecords} records across ${LOCALES.length} locale(s) in ${elapsed}s`,
  );
}

main().catch((error) => {
  console.error('[search:index] Fatal error:', error);
  process.exit(1);
});
