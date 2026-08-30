/**
 * @fileoverview keywordGraph Unit Tests
 * @description Covers the reverse index built from `produces` / `consumes`, the
 * transitive walk with its cycle guard, and route normalisation across the
 * locale prefix the generator omits.
 *
 * @module tests/unit/src/lib/db/content/keywordGraph
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/db/content/keywordGraph Module under test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const readMetadataFiles = vi.fn();

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles', () => ({
  readMetadataFiles: (...args: unknown[]) => readMetadataFiles(...args),
}));

import {
  clearKeywordGraphCache,
  consumerRoutesFor,
  consumersOf,
  loadKeywordGraph,
  normalizeRoute,
} from '@/lib/db/content/keywordGraph';

/** Producer defining two shards. */
const RULES = {
  file: 'src/content/en/rules/effects.rule.mdx',
  link: '/library/rules/effects',
  produces: ['kw--resist', 'kw--briefly'],
  consumes: [],
};

/** Consumer of one of them. */
const SPELL_A = {
  file: 'src/content/en/spells/a.spell.mdx',
  link: '/library/spells/a',
  produces: [],
  consumes: ['kw--resist'],
};

/** Consumer of the other. */
const SPELL_B = {
  file: 'src/content/en/spells/b.spell.mdx',
  link: '/library/spells/b',
  produces: [],
  consumes: ['kw--briefly'],
};

describe('keywordGraph', () => {
  beforeEach(() => {
    clearKeywordGraphCache();
    readMetadataFiles.mockReset();
  });

  afterEach(() => {
    clearKeywordGraphCache();
  });

  describe('normalizeRoute', () => {
    it('should strip a locale prefix and trailing slash', () => {
      expect(normalizeRoute('/en/library/spells/a/')).toBe('/library/spells/a');
    });

    it('should leave a route that carries no locale', () => {
      expect(normalizeRoute('/library/spells/a')).toBe('/library/spells/a');
    });

    it('should not eat a two-letter path segment that is not a locale prefix', () => {
      expect(normalizeRoute('/library/spells/ab')).toBe('/library/spells/ab');
    });
  });

  describe('loadKeywordGraph', () => {
    it('should index producers, consumers and both route directions', async () => {
      readMetadataFiles.mockResolvedValue([RULES, SPELL_A, SPELL_B]);

      const graph = await loadKeywordGraph('en');

      expect(graph.produces.get(RULES.file)).toEqual([
        'kw--resist',
        'kw--briefly',
      ]);
      expect(graph.consumers.get('kw--resist')).toEqual([SPELL_A.file]);
      expect(graph.links.get(SPELL_A.file)).toBe('/library/spells/a');
      expect(graph.files.get('/library/spells/a')).toBe(SPELL_A.file);
    });

    it('should read the metadata tree once per locale', async () => {
      readMetadataFiles.mockResolvedValue([RULES]);

      await loadKeywordGraph('en');
      await loadKeywordGraph('en');

      expect(readMetadataFiles).toHaveBeenCalledTimes(1);
    });

    it('should skip a record with no file path', async () => {
      readMetadataFiles.mockResolvedValue([
        { link: '/library/orphan', consumes: ['kw--resist'] },
      ]);

      const graph = await loadKeywordGraph('en');

      expect(graph.consumers.size).toBe(0);
    });
  });

  describe('consumersOf', () => {
    it('should collect every page holding a shard the file defines', async () => {
      readMetadataFiles.mockResolvedValue([RULES, SPELL_A, SPELL_B]);

      const graph = await loadKeywordGraph('en');

      expect(consumersOf(graph, RULES.file)).toEqual([
        SPELL_A.file,
        SPELL_B.file,
      ]);
    });

    it('should never return the file it started from', async () => {
      readMetadataFiles.mockResolvedValue([RULES, SPELL_A]);

      const graph = await loadKeywordGraph('en');

      expect(consumersOf(graph, RULES.file)).not.toContain(RULES.file);
    });

    it('should follow a consumer that is itself a producer', async () => {
      const middle = {
        file: 'src/content/en/spells/middle.spell.mdx',
        link: '/library/spells/middle',
        produces: ['kw--middle'],
        consumes: ['kw--resist'],
      };
      const leaf = {
        file: 'src/content/en/spells/leaf.spell.mdx',
        link: '/library/spells/leaf',
        produces: [],
        consumes: ['kw--middle'],
      };
      readMetadataFiles.mockResolvedValue([RULES, middle, leaf]);

      const graph = await loadKeywordGraph('en');

      expect(consumersOf(graph, RULES.file)).toEqual([middle.file, leaf.file]);
    });

    it('should terminate on a cycle', async () => {
      const a = {
        file: 'a.mdx',
        link: '/a',
        produces: ['kw--a'],
        consumes: ['kw--b'],
      };
      const b = {
        file: 'b.mdx',
        link: '/b',
        produces: ['kw--b'],
        consumes: ['kw--a'],
      };
      readMetadataFiles.mockResolvedValue([a, b]);

      const graph = await loadKeywordGraph('en');

      expect(consumersOf(graph, 'a.mdx')).toEqual(['b.mdx']);
    });

    it('should return nothing for a file that produces nothing', async () => {
      readMetadataFiles.mockResolvedValue([RULES, SPELL_A]);

      const graph = await loadKeywordGraph('en');

      expect(consumersOf(graph, SPELL_A.file)).toEqual([]);
    });
  });

  describe('consumerRoutesFor', () => {
    it('should resolve a locale-prefixed route to its consumers', async () => {
      readMetadataFiles.mockResolvedValue([RULES, SPELL_A, SPELL_B]);

      const routes = await consumerRoutesFor(
        'en',
        '/en/library/rules/effects',
      );

      expect(routes).toEqual([
        '/en/library/spells/a',
        '/en/library/spells/b',
      ]);
    });

    it('should return nothing for a route the graph does not know', async () => {
      readMetadataFiles.mockResolvedValue([RULES]);

      expect(await consumerRoutesFor('en', '/en/library/nope')).toEqual([]);
    });
  });
});
