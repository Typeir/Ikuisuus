/**
 * @fileoverview Unit tests for the useToolRegistry hook.
 * @description Verifies the hook returns one ToolMenuItem per registry entry, with ids
 * in entry order and hrefs embedding the mocked locale. Uses global vitest mocks.
 *
 * @module tests/unit/src/modules/tools-menu/application/hooks/useToolRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { useToolRegistry } from '@/modules/tools-menu/application/hooks/useToolRegistry';
import { TOOL_REGISTRY } from '@/modules/tools-menu/infrastructure/registry/toolRegistry.config';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useToolRegistry', () => {
  it('returns one item per registry entry', () => {
    const { result } = renderHook(() => useToolRegistry());
    expect(result.current).toHaveLength(TOOL_REGISTRY.length);
  });

  it('each item has a non-empty id', () => {
    const { result } = renderHook(() => useToolRegistry());

    for (const item of result.current) {
      expect(item.id).toBeTruthy();
    }
  });

  it('each item has a non-empty label string (from global useTranslations mock)', () => {
    const { result } = renderHook(() => useToolRegistry());

    for (const item of result.current) {
      expect(item.label).toBeTruthy();
    }
  });

  it('item ids match registry entry ids in order', () => {
    const { result } = renderHook(() => useToolRegistry());
    const ids = result.current.map((item) => item.id);
    expect(ids).toEqual(TOOL_REGISTRY.map((entry) => entry.id));
  });

  it('hrefs embed the locale segment from global useLocale mock', () => {
    const { result } = renderHook(() => useToolRegistry());

    const encounterItem = result.current.find(
      (i) => i.id === 'encounter-creator',
    );
    expect(encounterItem?.href).toBe('/en/utils/encounter-planner');

    const worldSimItem = result.current.find((i) => i.id === 'world-sim');
    expect(worldSimItem?.href).toBe('/en/utils/world-sim');

    const charBuilderItem = result.current.find(
      (i) => i.id === 'character-builder',
    );
    expect(charBuilderItem?.href).toBe('/en/utils/characters');

    const mdxEditorItem = result.current.find((i) => i.id === 'mdx-editor');
    expect(mdxEditorItem?.href).toBe('/en/utils/mdx-editor');
  });
});
