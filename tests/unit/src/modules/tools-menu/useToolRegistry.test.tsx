/**
 * @fileoverview Unit tests for the useToolRegistry hook.
 * @description Verifies that the hook resolves the visible registry entries into
 * locale-aware ToolMenuItem objects and guards against missing i18n keys. `NODE_ENV`
 * is `test` here, so `devOnly` entries are excluded.
 *
 * @module tests/unit/src/modules/tools-menu/useToolRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { useToolRegistry } from '@/modules/tools-menu/application/hooks/useToolRegistry';
import { selectVisibleTools } from '@/modules/tools-menu/infrastructure/registry/toolRegistry.config';
import { renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import layoutMessages from '../../../../../messages/en/layout.json';

/**
 * Wrapper that supplies the `layout` namespace used by `useToolRegistry`.
 *
 * @param {object} props - Wrapper props
 * @param {ReactNode} props.children - Children to render inside the provider
 * @returns {JSX.Element} The wrapped children
 */
function wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale='en' messages={{ layout: layoutMessages }}>
      {children}
    </NextIntlClientProvider>
  );
}

describe('useToolRegistry', () => {
  const visibleEntries = selectVisibleTools(false);

  it('returns one item per visible registry entry', () => {
    const { result } = renderHook(() => useToolRegistry(), { wrapper });
    expect(result.current).toHaveLength(visibleEntries.length);
  });

  it('each item has id, non-empty label, and locale-prefixed href', () => {
    const { result } = renderHook(() => useToolRegistry(), { wrapper });

    for (const item of result.current) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.href).toMatch(/^\/en\//);
    }
  });

  it('item ids match registry entry ids in order', () => {
    const { result } = renderHook(() => useToolRegistry(), { wrapper });
    const ids = result.current.map((item) => item.id);
    expect(ids).toEqual(visibleEntries.map((entry) => entry.id));
  });

  it('hrefs embed the locale segment correctly', () => {
    const { result } = renderHook(() => useToolRegistry(), { wrapper });

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

  it('omits the dev-only labs entry outside development', () => {
    const { result } = renderHook(() => useToolRegistry(), { wrapper });
    expect(result.current.find((i) => i.id === 'labs')).toBeUndefined();
  });

  it('labels are resolved strings (mocked to return label keys)', () => {
    const { result } = renderHook(() => useToolRegistry(), { wrapper });

    const encounterItem = result.current.find(
      (i) => i.id === 'encounter-creator',
    );
    expect(encounterItem?.label).toBe('tools.encounterCreator');

    const worldSimItem = result.current.find((i) => i.id === 'world-sim');
    expect(worldSimItem?.label).toBe('tools.worldSim');
  });
});
