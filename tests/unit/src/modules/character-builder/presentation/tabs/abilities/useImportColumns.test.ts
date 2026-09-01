/**
 * @fileoverview useImportColumns tests
 * @description Verifies the hook returns a non-empty MetadataTable column config
 * for each import tab.
 *
 * @module tests/unit/src/modules/character-builder/presentation/tabs/abilities/useImportColumns.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { useImportColumns } from '@/modules/character-builder/presentation/tabs/abilities/useImportColumns';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('useImportColumns', () => {
  it('returns a non-empty column config for every import tab', () => {
    const { result } = renderHook(() => useImportColumns());
    expect(Object.keys(result.current)).toEqual([
      'spells',
      'heirlooms',
      'trinkets',
      'feats',
    ]);
    for (const cols of Object.values(result.current)) {
      expect(Array.isArray(cols)).toBe(true);
      expect(cols.length).toBeGreaterThan(0);
      expect(cols[0]).toHaveProperty('key');
      expect(cols[0]).toHaveProperty('label');
    }
  });
});
