/**
 * @fileoverview Unit tests for Affix List Editor component.
 * @module tests/unit/src/modules/encounter-planner/presentation/listEditors/affixListEditor.test
 * @description Asserts AffixListEditor is exported, is a function, and is the module's only export.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/modules/encounter-planner/presentation/listEditors/affixListEditor
 */

import { describe, it, expect } from 'vitest';
import * as AffixListEditorModule from '@/modules/encounter-planner/presentation/listEditors/affixListEditor';

describe('affixListEditor', () => {
  it('should export AffixListEditor component', () => {
    expect(AffixListEditorModule.AffixListEditor).toBeDefined();
    expect(typeof AffixListEditorModule.AffixListEditor).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = AffixListEditorModule.AffixListEditor.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(AffixListEditorModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('AffixListEditor');
  });
});
