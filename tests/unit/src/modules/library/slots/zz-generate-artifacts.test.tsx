/**
 * @fileoverview Writes the rendered content-v2 fixtures to disk for review.
 * @description Temporary generator; delete once the artifacts are published.
 *
 * @module tests/unit/src/modules/library/slots/zz-generate-artifacts.test
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-04
 */

import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { renderNamed } from './harness';

const OUT = path.resolve(process.cwd(), '.ignore/contentv2/rendered');

const FIXTURES = [
  'alfanjon.mdx',
  'spell.mdx',
  'spell-overcast.mdx',
  'trinket.mdx',
  'monster.mdx',
  'vocation.mdx',
  'feat.mdx',
];

describe('artifact generation', () => {
  it('writes rendered markup for every fixture', async () => {
    mkdirSync(OUT, { recursive: true });
    for (const fixture of FIXTURES) {
      const html = await renderNamed(fixture);
      writeFileSync(
        path.join(OUT, fixture.replace('.mdx', '.html')),
        html,
        'utf8',
      );
      expect(html.length).toBeGreaterThan(200);
    }
  });
});
