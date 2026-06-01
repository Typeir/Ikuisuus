/**
 * Backward-compat shim tests for lib/hooks/useCorrectionsToken.
 *
 * @fileoverview Ensures legacy hook path still exports token helpers.
 * @module tests/unit/lib/hooks/useCorrectionsToken
 */

import {
    useCorrectionsTokenActions,
    useCorrectionsTokenState,
} from '@/lib/hooks/useCorrectionsToken';
import { describe, expect, it } from 'vitest';

describe('useCorrectionsToken shim', () => {
  it('re-exports token hooks', () => {
    expect(typeof useCorrectionsTokenActions).toBe('function');
    expect(typeof useCorrectionsTokenState).toBe('function');
  });
});
