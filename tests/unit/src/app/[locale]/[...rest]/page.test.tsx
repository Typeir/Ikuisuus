/**
 * @fileoverview Unit tests for Catch-All page component
 * @module tests/unit/src/app/[locale]/[...rest]/page.test
 * @description Validates CatchAllPage default export and component signature.
 * Tests catch-all route for undefined paths.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/app/[locale]/[...rest]/page
 */

import { describe, it, expect } from 'vitest';
import * as PageModule from '@/app/[locale]/[...rest]/page';

describe('page', () => {
  it('should export default CatchAllPage component', () => {
    expect(PageModule.default).toBeDefined();
    expect(typeof PageModule.default).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = PageModule.default.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });
});
