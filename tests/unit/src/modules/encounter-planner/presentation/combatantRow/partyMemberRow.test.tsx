/**
 * @fileoverview Unit tests for PartyMemberRow component
 * @description Tests the thin party member row sub-component.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/modules/encounter-planner/presentation/combatantRow/partyMemberRow
 */

import { PartyMemberRow } from '@/modules/encounter-planner/presentation/combatantRow/partyMemberRow';
import { describe, expect, it } from 'vitest';

describe('PartyMemberRow', () => {
  it('should export PartyMemberRow component', () => {
    expect(PartyMemberRow).toBeDefined();
    expect(typeof PartyMemberRow).toBe('function');
  });
});
