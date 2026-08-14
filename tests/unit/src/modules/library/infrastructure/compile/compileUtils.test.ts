/**
 * @fileoverview Compile Utils Tests
 * @description Covers the MDX compile helpers and the plugin bundle they load.
 *
 * @module tests/unit/src/modules/library/infrastructure/compile/compileUtils
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 */

import {
  buildMdxOptions,
  importAllAsync,
} from '@/modules/library/infrastructure/compile/compileUtils';
import { describe, expect, it } from 'vitest';

/**
 * Timeout for `importAllAsync`, which loads eight ESM packages in parallel.
 * Exceeds Vitest's default 5s budget for loaded module count.
 */
const MODULE_LOAD_TIMEOUT_MS = 30_000;

describe('compileUtils exports', () => {
  it('exports buildMdxOptions', () => {
    expect(typeof buildMdxOptions).toBe('function');
  });

  it(
    'importAllAsync returns expected properties',
    async () => {
      const mods = await importAllAsync();

      expect(mods).toHaveProperty('evaluate');
      expect(mods).toHaveProperty('remarkGfm');
      expect(mods).toHaveProperty('remarkAspects');
    },
    MODULE_LOAD_TIMEOUT_MS,
  );
});
