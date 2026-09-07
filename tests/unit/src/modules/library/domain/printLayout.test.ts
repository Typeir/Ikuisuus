/**
 * @fileoverview printLayout Tests
 * @module tests/unit/src/modules/library/domain/printLayout.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import {
  DEFAULT_PRINT_COLUMNS,
  MAX_PRINT_COLUMNS,
  printColumnsOf,
} from '@/modules/library/domain/printLayout';
import { describe, expect, it } from 'vitest';

describe('printColumnsOf', () => {
  it('should default to a single column when nothing is declared', () => {
    expect(printColumnsOf({})).toBe(DEFAULT_PRINT_COLUMNS);
    expect(printColumnsOf(undefined)).toBe(DEFAULT_PRINT_COLUMNS);
  });

  it('should return the declared count', () => {
    expect(printColumnsOf({ printColumns: 2 })).toBe(2);
    expect(printColumnsOf({ printColumns: 3 })).toBe(3);
  });

  it('should read a count written as a string', () => {
    expect(printColumnsOf({ printColumns: '2' })).toBe(2);
  });

  it('should fall back for a value that is not a whole number', () => {
    expect(printColumnsOf({ printColumns: 'wide' })).toBe(
      DEFAULT_PRINT_COLUMNS,
    );
    expect(printColumnsOf({ printColumns: true })).toBe(DEFAULT_PRINT_COLUMNS);
    expect(printColumnsOf({ printColumns: 1.5 })).toBe(DEFAULT_PRINT_COLUMNS);
    expect(printColumnsOf({ printColumns: null })).toBe(DEFAULT_PRINT_COLUMNS);
  });

  it('should clamp a count outside the supported range', () => {
    expect(printColumnsOf({ printColumns: 0 })).toBe(DEFAULT_PRINT_COLUMNS);
    expect(printColumnsOf({ printColumns: -4 })).toBe(DEFAULT_PRINT_COLUMNS);
    expect(printColumnsOf({ printColumns: 12 })).toBe(MAX_PRINT_COLUMNS);
  });
});
