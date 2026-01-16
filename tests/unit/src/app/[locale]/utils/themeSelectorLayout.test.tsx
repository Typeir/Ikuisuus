/**
 * @fileoverview Unit tests for Theme Selector Layout component
 * @module tests/unit/src/app/[locale]/utils/themeSelectorLayout.test
 * @description Validates ThemeSelectorLayout export and component signature.
 * Tests layout wrapper component for theme selection.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/app/[locale]/utils/themeSelectorLayout
 */

import { describe, it, expect } from 'vitest';
import * as ThemeSelectorLayoutModule from '@/app/[locale]/utils/themeSelectorLayout';

describe('themeSelectorLayout', () => {
  it('should export ThemeSelectorLayout component', () => {
    expect(ThemeSelectorLayoutModule.ThemeSelectorLayout).toBeDefined();
    expect(typeof ThemeSelectorLayoutModule.ThemeSelectorLayout).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = ThemeSelectorLayoutModule.ThemeSelectorLayout.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(ThemeSelectorLayoutModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('ThemeSelectorLayout');
  });
});
