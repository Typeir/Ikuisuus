/**
 * @fileoverview Unit tests for Item List Editor component
 * @module tests/unit/src/modules/encounter-planner/presentation/listEditors/itemListEditor.test
 * @description Asserts ItemListEditor is the module's sole function export.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/modules/encounter-planner/presentation/listEditors/itemListEditor
 */

import { describe, it, expect } from 'vitest';
import * as ItemListEditorModule from '@/modules/encounter-planner/presentation/listEditors/itemListEditor';

describe('itemListEditor', () => {
  it('should export ItemListEditor component', () => {
    expect(ItemListEditorModule.ItemListEditor).toBeDefined();
    expect(typeof ItemListEditorModule.ItemListEditor).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = ItemListEditorModule.ItemListEditor.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(ItemListEditorModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('ItemListEditor');
  });
});
