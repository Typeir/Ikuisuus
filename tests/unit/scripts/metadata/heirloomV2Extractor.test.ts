/**
 * @fileoverview Slot card T6: extractor golden.
 * @description Asserts parseHeirloomV2 deep-equals the golden shape for the
 * fixture (attribute spelling), reads the element spelling, and records what
 * the current parseHeirloomSource returns.
 *
 * @module tests/unit/scripts/metadata/heirloomV2Extractor.test
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-02
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  parseHeirloomSource,
  parseHeirloomV2,
} from '@scripts/metadata/generateHeirloomMetadata';
import { loadSharedData } from '@scripts/metadata';

/**
 * Fixture directory.
 */
const FIXTURES = path.resolve(process.cwd(), 'tests/fixtures/slots');

/**
 * Fixture file.
 */
const FIXTURE = path.join(FIXTURES, 'alfanjon.mdx');

/**
 * Report directory for the before/after capture.
 */
const REPORT_DIR = path.resolve(process.cwd(), '.ignore/reports/contentv2');

/**
 * Shared game data, loaded once.
 */
let sharedData: unknown;

beforeAll(async () => {
  sharedData = await loadSharedData();
});

/**
 * Reads the golden shape.
 *
 * @returns {object} Golden JSON
 */
function golden(): object {
  return JSON.parse(
    readFileSync(path.join(FIXTURES, 'alfanjon.golden.json'), 'utf8'),
  ) as object;
}

describe('parseHeirloomV2', () => {
  it('extracts the golden shape from the attribute spelling', () => {
    expect(parseHeirloomV2(readFileSync(FIXTURE, 'utf8'))).toEqual(golden());
  });

  it('reads header and feature slots in the element spelling', () => {
    const source = [
      '<Heirloom>',
      '',
      '<Rarity>Very rare</Rarity>',
      '<Attunement>required</Attunement>',
      '<Mastery>Slow; Quick</Mastery>',
      '',
      '<Feature>',
      '',
      '#### Probe <span>Tag</span>',
      '',
      '<Cost>1 Minor Action</Cost>',
      '<Targets>you</Targets>',
      '',
      'Prose.',
      '',
      '</Feature>',
      '',
      '</Heirloom>',
      '',
    ].join('\n');
    expect(parseHeirloomV2(source)).toEqual({
      rarity: 'very rare',
      attunement: 'required',
      mastery: ['slow', 'quick'],
      features: [
        {
          name: 'Probe',
          kind: 'feature',
          tag: 'Tag',
          cost: '1 Minor Action',
          targets: 'you',
        },
      ],
    });
  });

  it('returns an empty shape when no Heirloom element is present', () => {
    expect(parseHeirloomV2('# Plain article\n\nProse only.\n')).toEqual({
      rarity: '',
      features: [],
    });
  });

  it('captures the current parser before/after for the report', () => {
    const source = readFileSync(FIXTURE, 'utf8');
    const before = parseHeirloomSource(source, FIXTURE, sharedData as never);
    const after = parseHeirloomV2(source);
    mkdirSync(REPORT_DIR, { recursive: true });
    writeFileSync(
      path.join(REPORT_DIR, 't6-before-after.json'),
      JSON.stringify({ before, after }, null, 2),
    );
    expect(before).toBeTruthy();
  });
});
