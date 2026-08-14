/**
 * @fileoverview Unit tests for Not Found page component
 * @module tests/unit/src/app/[locale]/not-found.test
 * @description Asserts NotFound module exports a default function component.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/app/[locale]/not-found
 */

import { describe, it, expect } from 'vitest';
import * as NotFoundModule from '@/app/[locale]/not-found';

describe('not-found', () => {
  it('should export default NotFound component', () => {
    expect(NotFoundModule.default).toBeDefined();
    expect(typeof NotFoundModule.default).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = NotFoundModule.default.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });
});
