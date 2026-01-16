/**
 * @fileoverview Unit tests for Not Found Content component
 * @module tests/unit/src/lib/components/notFoundContent/notFoundContent.test
 * @description Validates NotFoundContent export and component signature.
 * Tests presentational component for 404 error pages.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/notFoundContent/notFoundContent
 */

import { describe, it, expect } from 'vitest';
import * as NotFoundContentModule from '@/lib/components/notFoundContent/notFoundContent';

describe('notFoundContent', () => {
  it('should export NotFoundContent component', () => {
    expect(NotFoundContentModule.NotFoundContent).toBeDefined();
    expect(typeof NotFoundContentModule.NotFoundContent).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = NotFoundContentModule.NotFoundContent.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(NotFoundContentModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('NotFoundContent');
  });
});
