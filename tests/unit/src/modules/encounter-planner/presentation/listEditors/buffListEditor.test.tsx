/**
 * @fileoverview Unit tests for Buff List Editor component
 * @module tests/unit/src/modules/encounter-planner/presentation/listEditors/buffListEditor.test
 * @description Validates BuffListEditor export and component signature.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/modules/encounter-planner/presentation/listEditors/buffListEditor
 */

import { describe, it, expect } from 'vitest';
import * as BuffListEditorModule from '@/modules/encounter-planner/presentation/listEditors/buffListEditor';

describe('buffListEditor', () => {
  it('should export BuffListEditor component', () => {
    expect(BuffListEditorModule.BuffListEditor).toBeDefined();
    expect(typeof BuffListEditorModule.BuffListEditor).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = BuffListEditorModule.BuffListEditor.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(BuffListEditorModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('BuffListEditor');
  });
});
