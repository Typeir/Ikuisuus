/**
 * @fileoverview useIsPathExpanded Tests
 * @description Covers the per-path read and its re-render isolation: a
 * dispatch on one path leaves subscribers of other paths untouched.
 *
 * @module tests/unit/src/modules/navigation-sidebar/application/hooks/useIsPathExpanded
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering and queries
 * @requires @/modules/navigation-sidebar/application/hooks/useIsPathExpanded Module under test
 */

import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import { useIsPathExpanded } from '@/modules/navigation-sidebar/application/hooks/useIsPathExpanded';
import { useSidebarExpansionDispatch } from '@/modules/navigation-sidebar/application/hooks/useSidebarExpansion';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Render-counting probe for one path.
 *
 * @param {{ path: string; renders: Record<string, number> }} props - Path and shared render tally
 * @returns {React.ReactElement} A span reporting the expanded state
 */
function PathProbe({
  path,
  renders,
}: {
  path: string;
  renders: Record<string, number>;
}) {
  renders[path] = (renders[path] ?? 0) + 1;
  const expanded = useIsPathExpanded(path);
  return createElement(
    'span',
    { 'data-testid': path },
    expanded ? 'expanded' : 'collapsed',
  );
}

/**
 * Button that expands one path through the dispatch-only hook.
 *
 * @param {{ path: string }} props - Path to expand
 * @returns {React.ReactElement} A button
 */
function Expander({ path }: { path: string }) {
  const { setExpanded } = useSidebarExpansionDispatch();
  return createElement(
    'button',
    { onClick: () => setExpanded(path, true) },
    `expand ${path}`,
  );
}

describe('useIsPathExpanded', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('reports expansion for its own path and re-renders only that subscriber', async () => {
    const user = userEvent.setup();
    const renders: Record<string, number> = {};

    render(
      createElement(
        PersistentUiProvider,
        { initialExpandedPaths: [] },
        createElement(PathProbe, { path: 'spells', renders }),
        createElement(PathProbe, { path: 'monsters', renders }),
        createElement(Expander, { path: 'spells' }),
      ),
    );

    expect(screen.getByTestId('spells')).toHaveTextContent('collapsed');
    expect(screen.getByTestId('monsters')).toHaveTextContent('collapsed');
    expect(renders).toEqual({ spells: 1, monsters: 1 });

    await user.click(screen.getByText('expand spells'));

    expect(screen.getByTestId('spells')).toHaveTextContent('expanded');
    expect(screen.getByTestId('monsters')).toHaveTextContent('collapsed');
    expect(renders.spells).toBe(2);
    expect(renders.monsters).toBe(1);
  });

  it('throws outside a PersistentUiProvider', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() =>
      render(createElement(PathProbe, { path: 'spells', renders: {} })),
    ).toThrow('usePersistentUiSelector must be used within a PersistentUiProvider');

    consoleError.mockRestore();
  });
});
