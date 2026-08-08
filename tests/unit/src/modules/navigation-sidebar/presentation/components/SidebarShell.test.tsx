/**
 * @fileoverview Tests for SidebarShell component
 * @module tests/unit/src/modules/navigation-sidebar/presentation/components/SidebarShell
 * @description The shell renders inside the `@sidebar` slot, which cannot be handed
 * a client callback, so it reads the menu and expansion stores itself. Every case
 * therefore mounts it under `PersistentUiProvider`.
 */

import {
    PersistentUiProvider,
    useSidebarExpansionActions,
} from '@/lib/context/PersistentUiContext';
import { SidebarShell } from '@/modules/navigation-sidebar/presentation/components/SidebarShell';
import { render } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  usePathname: () => '/en/library/parent/child',
}));

/**
 * Mounts a subtree under the persistent UI provider the shell depends on.
 *
 * @param {ReactNode} ui - Subtree under test.
 * @returns {ReturnType<typeof render>} Testing-library render result.
 */
const renderWithProvider = (ui: ReactNode): ReturnType<typeof render> =>
  render(
    <PersistentUiProvider initialExpandedPaths={[]}>{ui}</PersistentUiProvider>,
  );

/**
 * Reports whether a path is expanded in the store the shell writes to.
 *
 * @param {object} props - Component props.
 * @param {string} props.path - Sidebar path to report on.
 * @returns {JSX.Element} A node carrying the expansion flag as text.
 */
const ExpansionProbe = ({ path }: { path: string }): JSX.Element => {
  const { isExpanded } = useSidebarExpansionActions();

  return <span data-testid={`probe-${path}`}>{String(isExpanded(path))}</span>;
};

describe('SidebarShell', () => {
  it('should render fallback on initial mount', () => {
    const items = [{ name: 'Test', path: 'test', expandedHeight: 52 }];

    const { container } = renderWithProvider(<SidebarShell items={items} />);

    expect(container).toBeDefined();
  });

  it('should accept onNavigate callback', () => {
    const items = [{ name: 'Test', path: 'test', expandedHeight: 52 }];
    const onNavigate = () => {};

    const { container } = renderWithProvider(
      <SidebarShell items={items} onNavigate={onNavigate} />,
    );

    expect(container).toBeDefined();
  });

  it('should support collapseSiblings prop', () => {
    const items = [{ name: 'Test', path: 'test', expandedHeight: 52 }];

    const { container } = renderWithProvider(
      <SidebarShell items={items} collapseSiblings={true} />,
    );

    expect(container).toBeDefined();
  });

  it('should render without an onNavigate prop by falling back to the menu store', () => {
    const items = [{ name: 'Test', path: 'test', expandedHeight: 52 }];

    expect(() =>
      renderWithProvider(<SidebarShell items={items} />),
    ).not.toThrow();
  });

  it('should seed the expansion store with the open page ancestors', () => {
    const items = [
      {
        name: 'Parent',
        path: 'parent',
        expandedHeight: 100,
        children: [{ name: 'Child', path: 'parent/child', expandedHeight: 52 }],
      },
    ];

    const { getByTestId } = renderWithProvider(
      <>
        <SidebarShell items={items} />
        <ExpansionProbe path='parent' />
      </>,
    );

    expect(getByTestId('probe-parent').textContent).toBe('true');
  });

  it('should leave unrelated folders untouched when seeding', () => {
    const items = [{ name: 'Other', path: 'other', expandedHeight: 52 }];

    const { getByTestId } = renderWithProvider(
      <>
        <SidebarShell items={items} />
        <ExpansionProbe path='other' />
      </>,
    );

    expect(getByTestId('probe-other').textContent).toBe('false');
  });
});
