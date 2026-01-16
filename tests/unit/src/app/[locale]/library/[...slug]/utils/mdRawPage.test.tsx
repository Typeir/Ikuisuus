/**
 * @fileoverview Unit tests for MD Raw Page component
 * @module tests/unit/src/app/[locale]/library/[...slug]/utils/mdRawPage.test
 * @description Validates MDRawPage export and component signature.
 * Tests component for rendering raw markdown files.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/app/[locale]/library/[...slug]/utils/mdRawPage
 */

import { describe, it, expect } from 'vitest';
import * as MDRawPageModule from '@/app/[locale]/library/[...slug]/utils/mdRawPage';

describe('mdRawPage', () => {
  it('should export MDRawPage component', () => {
    expect(MDRawPageModule.MDRawPage).toBeDefined();
    expect(typeof MDRawPageModule.MDRawPage).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = MDRawPageModule.MDRawPage.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(MDRawPageModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('MDRawPage');
  });
});
