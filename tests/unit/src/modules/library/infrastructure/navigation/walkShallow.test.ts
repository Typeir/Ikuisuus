/**
 * @fileoverview Unit tests for shallow navigation walker.
 * @module tests/unit/src/modules/library/infrastructure/navigation/walkShallow.test
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import type { DirectorySourceAdapter } from '@/lib/db/content/directorySourceAdapter';
import {
    SHALLOW_WALK_DEPTH,
    STUB_CHILD_THRESHOLD,
    shallowWalk,
} from '@/modules/library/infrastructure/navigation/walkShallow';
import { describe, expect, it } from 'vitest';

/**
 * Builds an adapter whose root holds one directory of `fileCount` markdown files.
 *
 * @param {number} fileCount - Number of markdown files inside `spells`.
 * @returns {DirectorySourceAdapter} Adapter over the synthetic tree.
 */
const makeFlatAdapter = (fileCount: number): DirectorySourceAdapter => ({
  async listEntries(_locale, relativePath) {
    if (!relativePath) {
      return [{ name: 'spells', isDirectory: true }];
    }

    if (relativePath === 'spells') {
      return Array.from({ length: fileCount }, (_, index) => ({
        name: `spell-${index}.mdx`,
        isDirectory: false,
      }));
    }

    return [];
  },
});

describe('walkShallow', () => {
  it('returns stubs at max depth', async () => {
    const adapter: DirectorySourceAdapter = {
      async listEntries(_locale, relativePath) {
        if (!relativePath) {
          return [{ name: 'spells', isDirectory: true }];
        }

        if (relativePath === 'spells') {
          return [{ name: 'evocation', isDirectory: true }];
        }

        return [{ name: 'fireball.mdx', isDirectory: false }];
      },
    };

    const result = await shallowWalk(adapter, 'en', '', '', 1);

    expect(result[0].path).toBe('spells');
    expect(result[0].isStub).toBe(true);
    expect(SHALLOW_WALK_DEPTH).toBe(2);
  });

  it('exports STUB_CHILD_THRESHOLD as 50', () => {
    expect(STUB_CHILD_THRESHOLD).toBe(50);
  });

  it('stubs a directory wider than the threshold before the depth cap', async () => {
    const adapter = makeFlatAdapter(STUB_CHILD_THRESHOLD + 1);

    const result = await shallowWalk(adapter, 'en', '', '', SHALLOW_WALK_DEPTH);

    expect(result[0].isStub).toBe(true);
    expect(result[0].children).toEqual([]);
    expect(result[0].childCount).toBe(STUB_CHILD_THRESHOLD + 1);
  });

  it('expands a directory at the threshold inline', async () => {
    const adapter = makeFlatAdapter(STUB_CHILD_THRESHOLD);

    const result = await shallowWalk(adapter, 'en', '', '', SHALLOW_WALK_DEPTH);

    expect(result[0].isStub).toBeUndefined();
    expect(result[0].children).toHaveLength(STUB_CHILD_THRESHOLD);
  });

  it('stubs every wide directory it meets', async () => {
    const adapter: DirectorySourceAdapter = {
      async listEntries(_locale, relativePath) {
        if (!relativePath) {
          return [
            { name: 'monsters', isDirectory: true },
            { name: 'spells', isDirectory: true },
          ];
        }

        return Array.from({ length: STUB_CHILD_THRESHOLD + 1 }, (_, index) => ({
          name: `${relativePath}-${index}.mdx`,
          isDirectory: false,
        }));
      },
    };

    const result = await shallowWalk(adapter, 'en', '', '', SHALLOW_WALK_DEPTH);

    expect(result.find((node) => node.path === 'monsters')?.isStub).toBe(true);
    expect(result.find((node) => node.path === 'spells')?.isStub).toBe(true);
  });

  it('still returns children when a wide directory is walked directly', async () => {
    const adapter = makeFlatAdapter(STUB_CHILD_THRESHOLD + 1);

    const result = await shallowWalk(
      adapter,
      'en',
      'spells',
      'spells',
      SHALLOW_WALK_DEPTH,
    );

    expect(result).toHaveLength(STUB_CHILD_THRESHOLD + 1);
    expect(result[0].isStub).toBeUndefined();
  });

  it('points a stub at its own route when the folder has a named index', async () => {
    const adapter: DirectorySourceAdapter = {
      async listEntries(_locale, relativePath) {
        if (relativePath === 'vocations') {
          return [{ name: 'paladin', isDirectory: true }];
        }
        if (relativePath === 'vocations/paladin') {
          return [
            { name: 'paladin.vocation.mdx', isDirectory: false },
            { name: 'spells.list.mdx', isDirectory: false },
          ];
        }
        return [];
      },
    };

    const result = await shallowWalk(adapter, 'en', 'vocations', 'vocations', 1);

    expect(result[0]).toMatchObject({
      path: 'vocations/paladin',
      isStub: true,
      mainPath: 'vocations/paladin',
    });
  });

  it('points a stub at its own route when the folder has a main index', async () => {
    const adapter: DirectorySourceAdapter = {
      async listEntries(_locale, relativePath) {
        if (!relativePath) return [{ name: 'rules', isDirectory: true }];
        if (relativePath === 'rules') {
          return [{ name: 'main.mdx', isDirectory: false }];
        }
        return [];
      },
    };

    const result = await shallowWalk(adapter, 'en', '', '', 1);

    expect(result[0]).toMatchObject({ path: 'rules', isStub: true, mainPath: 'rules' });
  });

  it('leaves a stub without an index unlinked', async () => {
    const adapter: DirectorySourceAdapter = {
      async listEntries(_locale, relativePath) {
        if (!relativePath) return [{ name: 'spells', isDirectory: true }];
        if (relativePath === 'spells') {
          return [{ name: 'bane.spell.mdx', isDirectory: false }];
        }
        return [];
      },
    };

    const result = await shallowWalk(adapter, 'en', '', '', 1);

    expect(result[0].mainPath).toBeUndefined();
  });
});
