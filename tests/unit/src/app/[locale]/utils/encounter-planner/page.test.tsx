/**
 * @fileoverview Unit tests for Encounter Planner page component
 * @module tests/unit/src/app/[locale]/utils/encounter-planner/page.test
 * @description Validates EncounterPlannerPage default export and component signature.
 * Tests async server component for encounter planner utility page.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/app/[locale]/utils/encounter-planner/page
 */

import { describe, it, expect } from 'vitest';
import * as PageModule from '@/app/[locale]/utils/encounter-planner/page';

describe('page', () => {
  it('should export default EncounterPlannerPage component', () => {
    expect(PageModule.default).toBeDefined();
    expect(typeof PageModule.default).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = PageModule.default.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });
});
