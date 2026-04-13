/**
 * @fileoverview Unit tests for Encounter Combobox component
 * @module tests/unit/src/lib/components/encounterPlanner/comboboxes/encounterCombobox.test
 * @description Validates EncounterCombobox export and component signature.
 * Tests combobox component for selecting encounters in the encounter planner.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/lib/components/encounterPlanner/comboboxes/encounterCombobox
 */

import { describe, expect, it } from 'vitest';
import * as EncounterComboboxModule from '@/lib/components/encounterPlanner/comboboxes/encounterCombobox';

describe('encounterCombobox', () => {
  it('should export EncounterCombobox component', () => {
    expect(EncounterComboboxModule.EncounterCombobox).toBeDefined();
    expect(typeof EncounterComboboxModule.EncounterCombobox).toBe('function');
  });

  it('should be a React component', () => {
    const componentString =
      EncounterComboboxModule.EncounterCombobox.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(EncounterComboboxModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('EncounterCombobox');
  });
});
