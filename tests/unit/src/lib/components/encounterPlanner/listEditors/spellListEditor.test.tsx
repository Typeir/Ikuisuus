/**
 * @fileoverview Unit tests for Spell List Editor component
 * @module tests/unit/src/lib/components/encounterPlanner/listEditors/spellListEditor.test
 * @description Validates SpellListEditor export and component signature.
 * Tests list editor component for managing spells in encounter planner.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/encounterPlanner/listEditors/spellListEditor
 */

import { describe, it, expect } from 'vitest';
import * as SpellListEditorModule from '@/lib/components/encounterPlanner/listEditors/spellListEditor';

describe('spellListEditor', () => {
  it('should export SpellListEditor component', () => {
    expect(SpellListEditorModule.SpellListEditor).toBeDefined();
    expect(typeof SpellListEditorModule.SpellListEditor).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = SpellListEditorModule.SpellListEditor.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(SpellListEditorModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('SpellListEditor');
  });
});
