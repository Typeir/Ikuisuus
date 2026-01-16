/**
 * ToolsMenu Component Unit Tests
 *
 * @fileoverview Tests for the ToolsMenu component including keyboard navigation,
 * click-outside behavior, and aria attributes.
 */

import { ToolMenuItem, ToolsMenu } from '@/lib/components/toolsMenu/toolsMenu';
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
      />
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
      />
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
      />
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
      />
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
      />
    );

    const button = screen.getByRole('button', { name: /open tools/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    const items = screen.getAllByRole('menuitem');

    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(items[1]).toHaveClass('_selected_fdaa4b');
    });

    await user.keyboard('{ArrowUp}');
    await waitFor(() => {
      expect(items[0]).toHaveClass('_selected_fdaa4b');
    });
  });

  it('should close menu when clicking outside if closeOnClickOutside is enabled', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid='outside'>Outside element</div>
        <ToolsMenu
          items={mockItems}
          trigger={<span>Open Tools</span>}
          onSelect={vi.fn()}
          closeOnClickOutside={true}
        />
      </div>
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

  it('should NOT close menu when clicking outside by default', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid='outside'>Outside element</div>
        <ToolsMenu
          items={mockItems}
          trigger={<span>Open Tools</span>}
          onSelect={vi.fn()}
        />
      </div>
    );

    const button = screen.getByRole('button', { name: /open tools/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('outside'));

    // Menu should remain open since closeOnClickOutside defaults to false
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should have correct aria attributes', async () => {
    const user = userEvent.setup();
    render(
      <ToolsMenu
        items={mockItems}
        trigger={<span>Open Tools</span>}
        onSelect={vi.fn()}
      />
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
      />
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
      />
    );

    const button = screen.getByRole('button', { name: /open tools/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    const items = screen.getAllByRole('menuitem');

    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(items[1]).toHaveClass('_selected_fdaa4b');
    });

    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(items[1]).toHaveClass('_selected_fdaa4b');
    });

    await user.keyboard('{ArrowUp}');
    await waitFor(() => {
      expect(items[0]).toHaveClass('_selected_fdaa4b');
    });
  });
});
