/**
 * Backward-compat shim tests for lib/hooks/useCorrectionsAuth.
 *
 * @fileoverview Ensures legacy hook path still exports useCorrectionsAuth.
 * @module tests/unit/lib/hooks/useCorrectionsAuth
 */

import { useCorrectionsAuth } from '@/lib/hooks/useCorrectionsAuth';
import { describe, expect, it } from 'vitest';

describe('useCorrectionsAuth shim', () => {
  it('re-exports useCorrectionsAuth hook', () => {
    expect(typeof useCorrectionsAuth).toBe('function');
  });
});
