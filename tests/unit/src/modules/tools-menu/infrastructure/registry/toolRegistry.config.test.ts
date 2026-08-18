/**
 * @fileoverview Unit tests for tool registry visibility filtering.
 * @description Verifies `selectVisibleTools` keeps declaration order, drops `devOnly`
 * entries outside development, and that the labs entry points at `/labs/dev`.
 *
 * @module tests/unit/src/modules/tools-menu/infrastructure/registry/toolRegistry.config
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  selectVisibleTools,
  TOOL_REGISTRY,
} from '@/modules/tools-menu/infrastructure/registry/toolRegistry.config';
import { describe, expect, it } from 'vitest';

describe('selectVisibleTools', () => {
  it('returns every entry in development', () => {
    expect(selectVisibleTools(true)).toEqual(TOOL_REGISTRY);
  });

  it('drops devOnly entries outside development', () => {
    const visible = selectVisibleTools(false);
    expect(visible.every((entry) => !entry.devOnly)).toBe(true);
    expect(visible).toHaveLength(
      TOOL_REGISTRY.filter((entry) => !entry.devOnly).length,
    );
  });

  it('preserves declaration order of the surviving entries', () => {
    const visibleIds = selectVisibleTools(false).map((entry) => entry.id);
    const expectedIds = TOOL_REGISTRY.filter((entry) => !entry.devOnly).map(
      (entry) => entry.id,
    );
    expect(visibleIds).toEqual(expectedIds);
  });

  it('exposes labs only in development', () => {
    expect(selectVisibleTools(true).some((e) => e.id === 'labs')).toBe(true);
    expect(selectVisibleTools(false).some((e) => e.id === 'labs')).toBe(false);
  });

  it('builds the locale-prefixed labs href', () => {
    const labs = TOOL_REGISTRY.find((entry) => entry.id === 'labs');
    expect(labs?.devOnly).toBe(true);
    expect(labs?.hrefBuilder('en')).toBe('/en/labs/dev');
    expect(labs?.hrefBuilder('fi')).toBe('/fi/labs/dev');
  });

  it('every entry has a label key in the tools namespace', () => {
    for (const entry of TOOL_REGISTRY) {
      expect(entry.labelKey.startsWith('tools.')).toBe(true);
    }
  });
});
