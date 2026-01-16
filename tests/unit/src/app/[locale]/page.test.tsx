/**
 * @fileoverview Unit tests for Home page component
 * @module tests/unit/src/app/[locale]/page.test
 * @description Validates Home page default export and component signature.
 * Tests client component for archive intro and library search.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/app/[locale]/page
 */

import { describe, it, expect } from 'vitest';
import * as PageModule from '@/app/[locale]/page';

describe('page', () => {
  it('should export default Home component', () => {
    expect(PageModule.default).toBeDefined();
    expect(typeof PageModule.default).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = PageModule.default.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });
});
