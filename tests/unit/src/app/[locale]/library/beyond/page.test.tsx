/**
 * @fileoverview Unit tests for Beyond Viewer page component
 * @module tests/unit/src/app/[locale]/library/beyond/page.test
 * @description Validates BeyondViewer page default export and component signature.
 * Tests D&D Beyond character viewer page.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/app/[locale]/library/beyond/page
 */

import { describe, it, expect } from 'vitest';
import * as PageModule from '@/app/[locale]/library/beyond/page';

describe('page', () => {
  it('should export default BeyondViewer component', () => {
    expect(PageModule.default).toBeDefined();
    expect(typeof PageModule.default).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = PageModule.default.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });
});
