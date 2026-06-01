/**
 * @fileoverview Tests for importer barrel exports
 * @module tests/unit/src/lib/components/encounterPlanner/importer/index.test
 * @description Verifies all expected exports from the importer module.
 *
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @/modules/encounter-planner/importer
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const BARREL_PATH = path.resolve(
  process.cwd(),
  'src/lib/components/encounterPlanner/importer/index.ts',
);

function readBarrelFile(): string {
  return fs.readFileSync(BARREL_PATH, 'utf-8');
}

describe('Importer Module Exports', () => {
  it('should export MonsterImporter component', () => {
    const content = readBarrelFile();
    expect(content).toContain(
      "export { MonsterImporter } from './monsterImporter';",
    );
  });

  it('should export QuantityPopup component', () => {
    const content = readBarrelFile();
    expect(content).toContain(
      "export { QuantityPopup } from './quantityPopup';",
    );
  });

  it('should export MonsterImporterProps type', () => {
    const content = readBarrelFile();
    expect(content).toContain(
      "export type { MonsterImporterProps } from './monsterImporter';",
    );
  });

  it('should export QuantityPopupProps type', () => {
    const content = readBarrelFile();
    expect(content).toContain(
      "export type { QuantityPopupProps } from './quantityPopup';",
    );
  });
});
