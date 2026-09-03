/**
 * @fileoverview Slot card T10: compile cost.
 * @description Compiles the fixture 50 times through compileStatic and
 * reports median milliseconds and output bytes.
 *
 * @module tests/unit/src/modules/library/slots/slots.cost.test
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-02
 */

import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';
import { describe, expect, it } from 'vitest';
import { compileFixture, renderFixture } from './harness';

/**
 * Report directory for the cost capture.
 */
const REPORT_DIR = path.resolve(process.cwd(), '.ignore/reports/contentv2');

/**
 * Median of a number list.
 *
 * @param {number[]} values - Measured values
 * @returns {number} Median
 */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

describe('T10 compile cost', () => {
  it(
    'compiles the fixture 50x and reports median ms and bytes',
    async () => {
      const timings: number[] = [];
      let bytes = 0;
      let gzipBytes = 0;
      for (let run = 0; run < 50; run++) {
        const started = performance.now();
        await compileFixture();
        timings.push(performance.now() - started);
        if (run === 0) {
          const html = await renderFixture();
          bytes = Buffer.byteLength(html, 'utf8');
          gzipBytes = gzipSync(html).length;
        }
      }
      const report = {
        alfanjon: {
          medianMs: Number(median(timings).toFixed(2)),
          bytes,
          gzipBytes,
        },
      };
      mkdirSync(REPORT_DIR, { recursive: true });
      writeFileSync(
        path.join(REPORT_DIR, 't10-cost.json'),
        JSON.stringify(report, null, 2),
      );
      expect(bytes).toBeGreaterThan(0);
    },
    600000,
  );
});
