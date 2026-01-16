/**
 * @fileoverview Tests for importer barrel exports
 * @module tests/unit/src/lib/components/encounterPlanner/importer/index.test
 * @description Verifies all expected exports from the importer module.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/encounterPlanner/importer
 */

import { describe, expect, it } from 'vitest';

describe('Importer Module Exports', () => {
  it('should export MonsterImporter component', async () => {
    const module = await import('@/lib/components/encounterPlanner/importer');
    expect(module.MonsterImporter).toBeDefined();
    expect(typeof module.MonsterImporter).toBe('function');
  });

  it('should export QuantityPopup component', async () => {
    const module = await import('@/lib/components/encounterPlanner/importer');
    expect(module.QuantityPopup).toBeDefined();
    expect(typeof module.QuantityPopup).toBe('function');
  });

  it('should export MonsterImporterProps type', async () => {
    const module = await import('@/lib/components/encounterPlanner/importer');
    expect(module).toHaveProperty('MonsterImporter');
  });

  it('should export QuantityPopupProps type', async () => {
    const module = await import('@/lib/components/encounterPlanner/importer');
    expect(module).toHaveProperty('QuantityPopup');
  });
});
