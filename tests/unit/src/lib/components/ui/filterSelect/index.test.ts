/**
 * @fileoverview FilterSelect barrel export tests
 * @description Smoke tests for FilterSelect exports
 */

import { describe, it, expect } from 'vitest';
import { FilterSelect } from '@/lib/components/ui/filterSelect';

describe('FilterSelect barrel export', () => {
  it('exports FilterSelect component', () => {
    expect(FilterSelect).toBeDefined();
    // forwardRef components are objects with $$typeof property
    expect(FilterSelect).toBeTruthy();
  });
});
