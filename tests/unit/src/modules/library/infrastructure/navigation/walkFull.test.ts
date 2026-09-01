/**
 * @fileoverview Unit tests for full navigation walker.
 * @module tests/unit/src/modules/library/infrastructure/navigation/walkFull.test
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import type { DirectorySourceAdapter } from '@/lib/db/content/directorySourceAdapter';
import {
    walk,
    walkTree,
} from '@/modules/library/infrastructure/navigation/walkFull';
import { describe, expect, it } from 'vitest';

describe('walkFull', () => {
  it('builds a recursive tree', async () => {
    const adapter: DirectorySourceAdapter = {
      async listEntries(_locale, relativePath) {
        if (!relativePath) {
          return [
            { name: 'spells', isDirectory: true },
            { name: 'main.mdx', isDirectory: false },
          ];
        }

        return [{ name: 'fireball.mdx', isDirectory: false }];
      },
    };

    const result = await walk(adapter, 'en', '', '');

    expect(result.length).toBeGreaterThan(0);
    expect(
      result.find((node) => node.path === 'spells')?.children?.[0].path,
    ).toBe('spells/fireball');

    const aliasResult = await walkTree(adapter, 'en', '', '');
    expect(aliasResult).toEqual(result);
  });
});
