/**
 * @fileoverview Tooltip barrel export tests
 * @description Smoke tests for Tooltip exports
 */

import { describe, it, expect } from 'vitest';
import { Tooltip, withTooltip } from '@/lib/components/ui/tooltip';

describe('Tooltip barrel export', () => {
  it('exports Tooltip component', () => {
    expect(Tooltip).toBeDefined();
    // memo-wrapped components might be objects with $$typeof
    expect(Tooltip).toBeTruthy();
  });

  it('exports withTooltip HOC', () => {
    expect(withTooltip).toBeDefined();
    expect(typeof withTooltip).toBe('function');
  });
});
