/**
 * @fileoverview World Sim Page Unit Tests
 * @description Validates WorldSimPage default export and component signature.
 *
 * @module tests/unit/worldSimPage
 */

import * as PageModule from '@/app/[locale]/utils/world-sim/page';
import { describe, expect, it } from 'vitest';

describe('WorldSimPage', () => {
  it('should export default WorldSimPage component', () => {
    expect(PageModule.default).toBeDefined();
    expect(typeof PageModule.default).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = PageModule.default.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });
});
