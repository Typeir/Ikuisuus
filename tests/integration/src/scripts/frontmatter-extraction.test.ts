/**
 * Frontmatter Isolation Integration Tests
 *
 * @fileoverview Guards the shared frontmatter handling used by every metadata
 * generator: YAML fields must never reach extracted metadata, and blanking the
 * block must leave source line numbers intact so recorded line ranges keep
 * resolving against the original `.mdx`.
 *
 * @module tests/integration/frontmatter-extraction
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 *
 * @requires vitest Testing framework
 * @requires @scripts/metadata/generateTrinketMetadata Trinket metadata generator
 *
 * @example
 * // Run these tests
 * npm run test:file tests/integration/src/scripts/frontmatter-extraction.test.ts
 */

import { parseTrinketFile } from '@scripts/metadata/generateTrinketMetadata';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  blankFrontmatter,
  loadSharedData,
  parseDescription,
  parseTitle,
} from '../../../../scripts/metadata';

/**
 * Fixture carrying a `source` / `contentType` frontmatter block.
 * @constant {string}
 */
const TRINKET_FIXTURE = path.resolve(
  process.cwd(),
  'tests/fixtures/trinkets/frontmatter-trinket.mdx',
);

/**
 * MDX sample used for the pure line-fidelity assertions.
 * @constant {string}
 */
const SAMPLE = [
  '---',
  'source: Ikuisuus',
  'contentType: trinkets',
  '---',
  '',
  '# Signal Whistle',
  '',
  'A carved bone whistle.',
  '',
  '---',
  '',
  'Trailing prose.',
].join('\n');

/**
 * Shared data loaded once before all tests
 * @type {Object}
 */
let sharedData: unknown;

describe('Frontmatter isolation', () => {
  beforeAll(async () => {
    sharedData = await loadSharedData();
  });

  describe('blankFrontmatter', () => {
    it('empties the frontmatter block without moving any line', () => {
      const blanked = blankFrontmatter(SAMPLE);
      const before = SAMPLE.split('\n');
      const after = blanked.split('\n');

      expect(after).toHaveLength(before.length);
      expect(after.slice(0, 4)).toEqual(['', '', '', '']);
      expect(after[5]).toBe('# Signal Whistle');
      expect(blanked).not.toContain('source:');
      expect(blanked).not.toContain('contentType:');
    });

    it('leaves content without frontmatter untouched', () => {
      const body = '# Title\n\nProse.\n';

      expect(blankFrontmatter(body)).toBe(body);
    });

    it('keeps a thematic break below the body', () => {
      expect(blankFrontmatter(SAMPLE).split('\n')[9]).toBe('---');
    });
  });

  describe('shared parsers on raw file content', () => {
    it('reads the title from below the frontmatter', () => {
      expect(parseTitle(SAMPLE.split('\n'))).toBe('Signal Whistle');
    });

    it('describes the prose rather than the YAML fields', () => {
      const description = parseDescription(SAMPLE);

      expect(description).toBe('A carved bone whistle.');
    });
  });

  describe('trinket generator', () => {
    it('extracts the item type from below the title', async () => {
      const result = (await parseTrinketFile(
        TRINKET_FIXTURE,
        sharedData,
      )) as Record<string, unknown>;

      expect(result.itemType).toBe('Adventuring Gear');
    });

    it('extracts prose as the description', async () => {
      const result = (await parseTrinketFile(
        TRINKET_FIXTURE,
        sharedData,
      )) as Record<string, unknown>;

      expect(result.description).toContain('carved bone whistle');
      expect(String(result.description)).not.toContain('contentType');
    });

    it('leaks no frontmatter field into any value', async () => {
      const result = (await parseTrinketFile(
        TRINKET_FIXTURE,
        sharedData,
      )) as Record<string, unknown>;

      expect(JSON.stringify(result)).not.toContain('source: Ikuisuus');
    });
  });
});
