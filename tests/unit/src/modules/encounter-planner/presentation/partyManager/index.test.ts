/**
 * @fileoverview Unit tests for Party Manager barrel export
 * @description Verifies the partManager barrel exports the expected components and types.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/modules/encounter-planner/presentation/partyManager
 */

import * as PartyManagerModule from '@/modules/encounter-planner/presentation/partyManager';
import { describe, expect, it } from 'vitest';

describe('partyManager barrel export', () => {
  it('should export PartyManager component', () => {
    expect(PartyManagerModule.PartyManager).toBeDefined();
    expect(typeof PartyManagerModule.PartyManager).toBe('function');
  });
});
