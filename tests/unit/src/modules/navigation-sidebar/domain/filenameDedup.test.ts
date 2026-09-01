/**
 * @fileoverview Unit tests for domain/filenameDedup
 * @module tests/unit/src/modules/navigation-sidebar/domain/filenameDedup.test
 */

import { deduplicateFilenames } from '@/modules/navigation-sidebar/domain/filenameDedup';
import type { Item } from '@/modules/navigation-sidebar/domain/types';
import { describe, expect, it } from 'vitest';

describe('deduplicateFilenames', () => {
  it('should keep .sheet.mdx when both .sheet.mdx and .mdx exist', () => {
    const items: Item[] = [
      { name: 'Fireball', path: 'spells/fireball.mdx' },
      { name: 'Fireball', path: 'spells/fireball.sheet.mdx' },
    ];

    const deduped = deduplicateFilenames(items);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].path).toBe('spells/fireball.sheet.mdx');
  });

  it('should keep single items unchanged', () => {
    const items: Item[] = [
      { name: 'Fireball', path: 'spells/fireball.sheet.mdx' },
    ];

    const deduped = deduplicateFilenames(items);

    expect(deduped).toEqual(items);
  });

  it('should handle items without duplicates', () => {
    const items: Item[] = [
      { name: 'Fireball', path: 'spells/fireball.sheet.mdx' },
      { name: 'Magic Missile', path: 'spells/magic-missile.sheet.mdx' },
    ];

    const deduped = deduplicateFilenames(items);

    expect(deduped).toHaveLength(2);
  });

  it('should preserve folder structure', () => {
    const items: Item[] = [
      {
        name: 'Spells',
        path: 'spells',
        children: [
          { name: 'Fireball', path: 'spells/fireball.sheet.mdx' },
          { name: 'Magic Missile', path: 'spells/magic-missile.mdx' },
        ],
      },
    ];

    const deduped = deduplicateFilenames(items);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].children).toHaveLength(2);
  });

  it('should handle empty array', () => {
    const deduped = deduplicateFilenames([]);
    expect(deduped).toEqual([]);
  });

  it('should keep both when only one variant exists', () => {
    const items: Item[] = [
      { name: 'Fireball', path: 'spells/fireball.mdx' },
      { name: 'Magic Missile', path: 'spells/magic-missile.sheet.mdx' },
    ];

    const deduped = deduplicateFilenames(items);

    expect(deduped).toHaveLength(2);
  });
});
