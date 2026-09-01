/**
 * @fileoverview SectionTrackItem domain type smoke test.
 * @module tests/unit/src/modules/library/domain/sectionTrack.test
 * @author Typeir
 * @version 1.0.0
 * @since 7.0.0
 */

import { describe, it, expect } from 'vitest';
import type { SectionTrackItem } from '@/modules/library/domain/sectionTrack';

describe('SectionTrackItem (domain type)', () => {
  it('should be usable as a type for heading tracking items', () => {
    const item: SectionTrackItem = {
      anchor: 'test-heading',
      level: 2,
      top: 500,
      height: 32,
      label: 'Test Heading',
    };

    expect(item.anchor).toBe('test-heading');
    expect(item.level).toBe(2);
    expect(item.top).toBe(500);
    expect(item.height).toBe(32);
    expect(item.label).toBe('Test Heading');
  });

  it('should accept all valid heading levels', () => {
    const levels: SectionTrackItem['level'][] = [1, 2, 3, 4, 5, 6];
    const items: SectionTrackItem[] = levels.map((level) => ({
      anchor: `h${level}`,
      level,
      top: level * 100,
      height: 24,
      label: `Heading ${level}`,
    }));

    expect(items).toHaveLength(6);
    expect(items[0].level).toBe(1);
    expect(items[5].level).toBe(6);
  });
});
