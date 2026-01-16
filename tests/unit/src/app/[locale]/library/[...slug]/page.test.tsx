/**
 * @fileoverview Unit tests for Dynamic Content page component
 * @module tests/unit/src/app/[locale]/library/[...slug]/page.test
 * @description Validates dynamic content Page default export and utility functions.
 * Tests async server component for MDX content rendering.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/app/[locale]/library/[...slug]/page
 */

import { describe, it, expect } from 'vitest';
import * as PageModule from '@/app/[locale]/library/[...slug]/page';

describe('page', () => {
  it('should export default Page component', () => {
    expect(PageModule.default).toBeDefined();
    expect(typeof PageModule.default).toBe('function');
  });

  it('should export generateStaticParams function', () => {
    expect(PageModule.generateStaticParams).toBeDefined();
    expect(typeof PageModule.generateStaticParams).toBe('function');
  });

  it('should export dynamic constant', () => {
    expect(PageModule.dynamic).toBeDefined();
    expect(PageModule.dynamic).toBe('force-static');
  });
});
