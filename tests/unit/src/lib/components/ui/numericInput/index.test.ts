/**
 * @fileoverview NumericInput barrel export tests
 * @description Smoke tests for NumericInput exports
 */

import { describe, it, expect } from 'vitest';
import { NumericInput } from '@/lib/components/ui/numericInput';

describe('NumericInput barrel export', () => {
  it('exports NumericInput component', () => {
    expect(NumericInput).toBeDefined();
    // forwardRef components are objects with $$typeof property
    expect(NumericInput).toBeTruthy();
  });
});
