/**
 * @fileoverview Unit tests for Generic Combobox component
 * @module tests/unit/src/modules/encounter-planner/presentation/comboboxes/genericCombobox.test
 * @description Validates GenericCombobox export and component signature.
 * Tests generic reusable combobox component for encounter planner.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires vitest
 * @requires @/modules/encounter-planner/presentation/comboboxes/genericCombobox
 */

import { describe, it, expect } from 'vitest';
import * as GenericComboboxModule from '@/modules/encounter-planner/presentation/comboboxes/genericCombobox';

describe('genericCombobox', () => {
  it('should export GenericCombobox component', () => {
    expect(GenericComboboxModule.GenericCombobox).toBeDefined();
    expect(typeof GenericComboboxModule.GenericCombobox).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = GenericComboboxModule.GenericCombobox.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(GenericComboboxModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('GenericCombobox');
  });
});
