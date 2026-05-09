/**
 * @fileoverview Barrel Export Tests for GradientTabs
 * @description Verifies barrel exports are accessible and correctly typed.
 *
 * @module tests/unit/src/lib/components/ui/gradientTabs/index.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { GradientTabs } from '@/lib/components/ui/gradientTabs';
import { describe, expect, it } from 'vitest';

describe('GradientTabs Barrel Export', () => {
  it('exports GradientTabs component', () => {
    expect(GradientTabs).toBeDefined();
    expect(typeof GradientTabs).toBe('function');
  });

  it('component is a React FC', () => {
    expect(GradientTabs.displayName || GradientTabs.name).toBeDefined();
  });
});
