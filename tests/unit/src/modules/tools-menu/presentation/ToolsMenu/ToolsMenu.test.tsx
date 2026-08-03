/**
 * ToolsMenu Component Unit Tests
 *
 * @fileoverview Tests for the ToolsMenu component including keyboard navigation,
 * click-outside behavior, and aria attributes.
 *
 * @module tests/unit/src/modules/tools-menu/ToolsMenu
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { ToolMenuItem } from '@/modules/tools-menu/domain/toolMenuItem.types';
import { ToolsMenu } from '@/modules/tools-menu/presentation/ToolsMenu/ToolsMenu';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ToolsMenu', () => {
  const mockItems = [
    { id: '1', label: 'Tool 1', href: '/tool-1' },
    { id: '2', label: 'Tool 2', href: '/tool-2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render trigger button', () => {
    const mockOnSelect = vi.fn();
    render(
      <ToolsMenu
        items={mockItems}
        trigger={<span>Open Tools</span>}
        onSelect={mockOnSelect}
      />,
    );

    expect(screen.getByText('Open Tools')).toBeInTheDocument();
  });

  it('should toggle menu on trigger click', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();
    render(
      <ToolsMenu
        items={mockItems}
        trigger={<span>Open Tools</span>}
        onSelect={mockOnSelect}
      />,
    );

    const button = screen.getByRole('button', { name: /open tools/i });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(button);
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    await user.click(button);
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('should render menu items when open', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();
    render(
      <ToolsMenu
        items={mockItems}
        trigger={<span>Open Tools</span>}
        onSelect={mockOnSelect}
      />,
    );

    const button = screen.getByRole('button', { name: /open tools/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Tool 1')).toBeInTheDocument();
      expect(screen.getByText('Tool 2')).toBeInTheDocument();
    });
  });

  it('should close menu on Escape key', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();
    render(
      <ToolsMenu
        items={mockItems}
        trigger={<span>Open Tools</span>}
        onSelect={mockOnSelect}
      />,
    );

    const button = screen.getByRole('button', { name: /open tools/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('should navigate items with ArrowDown and ArrowUp', async () => {
    const user = userEvent.setup();
    render(
      <ToolsMenu
        items={mockItems}
        trigger={<span>Open Tools</span>}
        onSelect={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: /open tools/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    const items = screen.getAllByRole('menuitem');

    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(items[1].className).toMatch(/_selected_/);
    });

    await user.keyboard('{ArrowUp}');
    await waitFor(() => {
      expect(items[0].className).toMatch(/_selected_/);
    });
  });

  it('should close menu when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid='outside'>Outside element</div>
        <ToolsMenu
          items={mockItems}
          trigger={<span>Open Tools</span>}
          onSelect={vi.fn()}
        />
      </div>,
    );

    const button = screen.getByRole('button', { name: /open tools/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    /**
     * Renders the menu already open and returns the trigger.
     *
     * @returns {Promise<HTMLElement>} The trigger button
     */
    async function openMenu(
      user: ReturnType<typeof userEvent.setup>,
      items: ToolMenuItem[] = mockItems,
      onSelect = vi.fn(),
    ): Promise<HTMLElement> {
      render(
        <ToolsMenu
          items={items}
          trigger={<span>Open Tools</span>}
          onSelect={onSelect}
        />,
      );
      const button = screen.getByRole('button', { name: /open tools/i });
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      return button;
    }

    it('should move focus into the menu when opened', async () => {
      const user = userEvent.setup();
      await openMenu(user);

      await waitFor(() => {
        expect(screen.getAllByRole('menuitem')[0]).toHaveFocus();
      });
    });

    it('should return focus to the trigger on Escape', async () => {
      const user = userEvent.setup();
      const button = await openMenu(user);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(button).toHaveFocus();
      });
    });

    it('should close when focus leaves via Tab', async () => {
      const user = userEvent.setup();
      await openMenu(user);

      await user.tab();

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should wrap from last item to first with ArrowDown', async () => {
      const user = userEvent.setup();
      await openMenu(user);
      const items = screen.getAllByRole('menuitem');

      await user.keyboard('{ArrowDown}{ArrowDown}');

      await waitFor(() => {
        expect(items[0]).toHaveFocus();
      });
    });

    it('should wrap from first item to last with ArrowUp', async () => {
      const user = userEvent.setup();
      await openMenu(user);
      const items = screen.getAllByRole('menuitem');

      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(items[items.length - 1]).toHaveFocus();
      });
    });

    it('should jump to the last item with End and back with Home', async () => {
      const user = userEvent.setup();
      await openMenu(user);
      const items = screen.getAllByRole('menuitem');

      await user.keyboard('{End}');
      await waitFor(() => {
        expect(items[items.length - 1]).toHaveFocus();
      });

      await user.keyboard('{Home}');
      await waitFor(() => {
        expect(items[0]).toHaveFocus();
      });
    });

    it('should open at the last item when the trigger receives ArrowUp', async () => {
      const user = userEvent.setup();
      render(
        <ToolsMenu
          items={mockItems}
          trigger={<span>Open Tools</span>}
          onSelect={vi.fn()}
        />,
      );

      screen.getByRole('button', { name: /open tools/i }).focus();
      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        const items = screen.getAllByRole('menuitem');
        expect(items[items.length - 1]).toHaveFocus();
      });
    });

    it('should expose only the active item in the tab order', async () => {
      const user = userEvent.setup();
      await openMenu(user);
      const items = screen.getAllByRole('menuitem');

      expect(items[0]).toHaveAttribute('tabindex', '0');
      expect(items[1]).toHaveAttribute('tabindex', '-1');
    });

    it('should point the trigger at the menu it controls', async () => {
      const user = userEvent.setup();
      const button = await openMenu(user);

      const menu = screen.getByRole('menu');
      expect(button).toHaveAttribute('aria-controls', menu.id);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(menu).toHaveAttribute('aria-labelledby', button.id);
    });

    it('should return focus to the trigger after selecting an item', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const button = await openMenu(user, mockItems, onSelect);

      await user.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalledWith(mockItems[0]);
      await waitFor(() => {
        expect(button).toHaveFocus();
      });
    });
  });

  it('should have correct aria attributes', async () => {
    const user = userEvent.setup();
    render(
      <ToolsMenu
        items={mockItems}
        trigger={<span>Open Tools</span>}
        onSelect={vi.fn()}
      />,
    );

    const trigger = screen.getByRole('button', { name: /open tools/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    await user.click(trigger);

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  it('should activate item on Enter key', async () => {
    const user = userEvent.setup();
    let selectedItem: ToolMenuItem | null = null;

    render(
      <ToolsMenu
        items={mockItems}
        trigger={<span>Open Tools</span>}
        onSelect={(item) => {
          selectedItem = item;
        }}
      />,
    );

    const button = screen.getByRole('button', { name: /open tools/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    expect((selectedItem as ToolMenuItem | null)?.label).toBe('Tool 1');
  });

  it('should wrap focus at menu boundaries', async () => {
    const user = userEvent.setup();
    render(
      <ToolsMenu
        items={mockItems}
        trigger={<span>Open Tools</span>}
        onSelect={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: /open tools/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    const items = screen.getAllByRole('menuitem');

    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(items[1].className).toMatch(/_selected_/);
    });

    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(items[0].className).toMatch(/_selected_/);
    });

    await user.keyboard('{ArrowUp}');
    await waitFor(() => {
      expect(items[1].className).toMatch(/_selected_/);
    });
  });
});
