/**
 * @fileoverview Temporary shim test for legacy fetchContent re-export.
 * @module tests/unit/src/lib/utils/fetchContent
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { fetchContent } from '@/modules/library/infrastructure/content/fetchContent';
import { describe, expect, it } from 'vitest';

describe('legacy fetchContent shim', () => {
  it('exports a callable function', () => {
    expect(typeof fetchContent).toBe('function');
  });
});
