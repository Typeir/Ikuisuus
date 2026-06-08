/**
 * @fileoverview Unit tests for MD Raw Page component
 * @module tests/unit/src/app/[locale]/library/[...slug]/utils/mdRawPage.test
 * @description Validates MdRawPage export and component signature.
 * Tests component for rendering raw markdown files.
 *
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @/modules/library/presentation/MdRawPage
 */

import * as MdRawPageModule from '@/modules/library/presentation/MdRawPage';
import { describe, expect, it } from 'vitest';

describe('mdRawPage', () => {
  it('should export MdRawPage component', () => {
    expect(MdRawPageModule.MdRawPage).toBeDefined();
    expect(typeof MdRawPageModule.MdRawPage).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = MdRawPageModule.MdRawPage.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(MdRawPageModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('MdRawPage');
  });
});
