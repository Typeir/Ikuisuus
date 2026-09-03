/**
 * @fileoverview Slot card T9 snapshot generator.
 * @description Writes a static HTML snapshot of the fixture into the report
 * directory.
 *
 * @module tests/unit/src/modules/library/slots/slots.snapshots.test
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-02
 */

import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { renderFixture } from './harness';

/**
 * Report snapshot directory.
 */
const SNAPSHOT_DIR = path.resolve(
  process.cwd(),
  '.ignore/reports/contentv2/snapshots',
);

describe('T9 print snapshot', () => {
  it(
    'writes the fixture snapshot',
    async () => {
      mkdirSync(SNAPSHOT_DIR, { recursive: true });
      const html = await renderFixture();
      const wrapped = `<!doctype html>\n<html><head><meta charset="utf-8"><title>alfanjon</title><style>body{font-family:sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;}[data-slot-label]{font-weight:700;margin-right:.5rem;}[data-slot]{display:inline-flex;margin-right:1rem;}[data-slot-grid]{display:flex;flex-wrap:wrap;gap:.25rem 1.5rem;margin:.5rem 0;}article{margin:.75rem 0;}</style></head><body>${html}</body></html>`;
      writeFileSync(path.join(SNAPSHOT_DIR, 'alfanjon.html'), wrapped);
      expect(html.length).toBeGreaterThan(0);
    },
    300000,
  );
});
