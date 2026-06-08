/**
 * @fileoverview Gate-coverage unit test for CompileOptions types.
 * @module tests/unit/src/modules/library/domain/compileOptions
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import type { CompileOptions } from '@/modules/library/domain/compileOptions';
import { describe, expect, it } from 'vitest';

describe('CompileOptions', () => {
  it('supports source and optional compile flags', () => {
    const options: CompileOptions = {
      source: '# Test',
      parseFrontmatter: false,
    };

    expect(options.source).toBe('# Test');
    expect(options.parseFrontmatter).toBe(false);
  });
});
