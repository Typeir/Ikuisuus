/**
 * @fileoverview Smoke test for the ToolMenuItem domain type.
 * @description Validates that the ToolMenuItem interface is correctly shaped at runtime.
 * Pure type tests — verifies that objects conforming to the interface satisfy structural checks.
 *
 * @module tests/unit/src/modules/tools-menu/domain/toolMenuItem.types
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { ToolMenuItem } from '@/modules/tools-menu/domain/toolMenuItem.types';
import { describe, expect, it } from 'vitest';

describe('ToolMenuItem type', () => {
  it('accepts a valid ToolMenuItem object', () => {
    const item: ToolMenuItem = {
      id: 'encounter-creator',
      label: 'Encounter Creator',
      href: '/en/utils/encounter-planner',
    };

    expect(item.id).toBe('encounter-creator');
    expect(item.label).toBe('Encounter Creator');
    expect(item.href).toBe('/en/utils/encounter-planner');
  });

  it('all required fields are strings', () => {
    const item: ToolMenuItem = { id: 'x', label: 'X', href: '/x' };

    expect(typeof item.id).toBe('string');
    expect(typeof item.label).toBe('string');
    expect(typeof item.href).toBe('string');
  });
});
