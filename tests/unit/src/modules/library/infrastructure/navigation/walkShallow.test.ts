/**
 * @fileoverview Unit tests for shallow navigation walker.
 * @module tests/unit/src/modules/library/infrastructure/navigation/walkShallow
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import type { DirectorySourceAdapter } from '@/lib/db/content/directorySourceAdapter';
import {
    SHALLOW_WALK_DEPTH,
    shallowWalk,
} from '@/modules/library/infrastructure/navigation/walkShallow';
import { describe, expect, it } from 'vitest';

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
});
