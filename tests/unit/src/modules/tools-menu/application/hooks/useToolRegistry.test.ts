/**
 * @fileoverview Unit tests for the useToolRegistry hook.
 * @description Verifies the hook returns one ToolMenuItem per visible registry entry,
 * with ids in entry order and hrefs embedding the mocked locale. `NODE_ENV` is `test`
 * here, so `devOnly` entries are excluded. Uses global vitest mocks.
 *
 * @module tests/unit/src/modules/tools-menu/application/hooks/useToolRegistry.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { useToolRegistry } from '@/modules/tools-menu/application/hooks/useToolRegistry';
import { selectVisibleTools } from '@/modules/tools-menu/infrastructure/registry/toolRegistry.config';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useToolRegistry', () => {
  const visibleEntries = selectVisibleTools(false);

  it('returns one item per visible registry entry', () => {
    const { result } = renderHook(() => useToolRegistry());
    expect(result.current).toHaveLength(visibleEntries.length);
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
    expect(ids).toEqual(visibleEntries.map((entry) => entry.id));
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
