/**
 * @fileoverview Integration tests for ToolsMenu with useToolRegistry items.
 * @description Verifies all visible registry tools render as menu items, items have non-empty
 * labels, onSelect receives the ToolMenuItem on click, and the menu closes after selection.
 *
 * @module tests/unit/src/modules/tools-menu/tools-menu-registry
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { ToolsMenu, useToolRegistry } from '@/modules/tools-menu';
import { selectVisibleTools } from '@/modules/tools-menu/infrastructure/registry/toolRegistry.config';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import layoutMessages from '../../../../../messages/en/layout.json';

/**
 * Minimal consumer that wires useToolRegistry into ToolsMenu for integration testing.
 *
 * @param {object} props - Component props
 * @param {(item: import('@/modules/tools-menu').ToolMenuItem) => void} props.onSelect - Select callback
 * @returns {JSX.Element} Rendered ToolsMenu with live hook items
 */
function ToolsMenuConsumer({
  onSelect,
}: {
  onSelect: (item: ReturnType<typeof useToolRegistry>[number]) => void;
}) {
  const items = useToolRegistry();
  return (
    <ToolsMenu items={items} onSelect={onSelect} trigger={<span>Tools</span>} />
  );
}

/**
 * Wrapper providing the layout i18n namespace.
 *
 * @param {object} props - Wrapper props
 * @param {ReactNode} props.children - Children to wrap
 * @returns {JSX.Element} Wrapped children
 */
function wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale='en' messages={{ layout: layoutMessages }}>
      {children}
    </NextIntlClientProvider>
  );
}

describe('ToolsMenu + useToolRegistry integration', () => {
  it('renders all tools from the registry as menu items', async () => {
    const user = userEvent.setup();
    render(<ToolsMenuConsumer onSelect={vi.fn()} />, { wrapper });

    const button = screen.getByRole('button', { name: /tools/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('menuitem')).toHaveLength(
      selectVisibleTools(false).length,
    );
  });

  it('each menu item displays a non-empty label string', async () => {
    const user = userEvent.setup();
    render(<ToolsMenuConsumer onSelect={vi.fn()} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /tools/i }));
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    const items = screen.getAllByRole('menuitem');
    for (const item of items) {
      expect(item.textContent?.trim()).toBeTruthy();
    }
  });

  it('calls onSelect with the correct item when encounter-creator is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ToolsMenuConsumer onSelect={onSelect} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /tools/i }));
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    const encounterItem = screen.getAllByRole('menuitem')[0];
    await user.click(encounterItem);

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'encounter-creator',
          href: '/en/utils/encounter-planner',
        }),
      );
    });
  });

  it('closes the menu after selecting an item', async () => {
    const user = userEvent.setup();
    render(<ToolsMenuConsumer onSelect={vi.fn()} />, { wrapper });

    await user.click(screen.getByRole('button', { name: /tools/i }));
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    const worldSimItem = screen.getAllByRole('menuitem')[1];
    await user.click(worldSimItem);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});
