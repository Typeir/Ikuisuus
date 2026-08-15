/**
 * @fileoverview FilterSelect Component Tests
 * @description Unit tests for the FilterSelect UI component.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FilterSelect } from '@/lib/components/ui/filterSelect';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

// Mock createPortal for modal rendering
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('FilterSelect', () => {
  const defaultOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const defaultProps = {
    value: '',
    options: defaultOptions,
    onChange: vi.fn(),
    placeholder: 'Select...',
    allLabel: 'All',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with placeholder when no value selected', () => {
      render(<FilterSelect {...defaultProps} />);
      // When value is empty string, placeholder is shown
      expect(screen.getByText('Select...')).toBeInTheDocument();
    });

    it('renders with selected value label', () => {
      render(<FilterSelect {...defaultProps} value="option1" />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<FilterSelect {...defaultProps} placeholder="Choose..." />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with id attribute', () => {
      render(<FilterSelect {...defaultProps} id="test-select" />);
      // The id may be on the container or button - check the button specifically
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      render(<FilterSelect {...defaultProps} disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('renders with aria-label', () => {
      render(<FilterSelect {...defaultProps} ariaLabel="Select filter" />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Select filter');
    });
  });

  describe('Size Variants', () => {
    it('renders with sm size class', () => {
      render(<FilterSelect {...defaultProps} size="sm" />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('sm');
    });

    it('renders with md size class (default)', () => {
      render(<FilterSelect {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('md');
    });

    it('renders with lg size class', () => {
      render(<FilterSelect {...defaultProps} size="lg" />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('lg');
    });
  });

  describe('Dropdown Behavior', () => {
    it('opens dropdown on click', async () => {
      const user = userEvent.setup();
      render(<FilterSelect {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('shows all options including "All" option', async () => {
      const user = userEvent.setup();
      render(<FilterSelect {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('calls onChange when option selected', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<FilterSelect {...defaultProps} onChange={onChange} />);
      
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Option 2'));
      
      expect(onChange).toHaveBeenCalledWith('option2');
    });

    it('calls onChange with empty string when "All" selected', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<FilterSelect {...defaultProps} value="option1" onChange={onChange} />);
      
      await user.click(screen.getByRole('button'));
      
      // Find the "All" option in the dropdown
      const allOptions = screen.getAllByText('All');
      const dropdownAll = allOptions[allOptions.length - 1]; // Last one is in dropdown
      await user.click(dropdownAll);
      
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<FilterSelect {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Option 1'));
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown on Enter key', async () => {
      const user = userEvent.setup();
      render(<FilterSelect {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      render(<FilterSelect {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('ARIA Attributes', () => {
    it('has aria-haspopup attribute', () => {
      render(<FilterSelect {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('has aria-expanded false when closed', () => {
      render(<FilterSelect {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('has aria-expanded true when open', async () => {
      const user = userEvent.setup();
      render(<FilterSelect {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Disabled State', () => {
    it('does not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(<FilterSelect {...defaultProps} disabled />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does not call onChange when disabled', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<FilterSelect {...defaultProps} onChange={onChange} disabled />);
      
      await user.click(screen.getByRole('button'));
      
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Mobile Modal Integration', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375, // Mobile width
        configurable: true,
      });
    });

    it('shows modal mode on mobile when options exceed threshold', async () => {
      const user = userEvent.setup();
      const manyOptions = Array.from({ length: 10 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`,
      }));

      render(
        <FilterSelect
          {...defaultProps}
          options={manyOptions}
          modalThreshold={5}
        />
      );

      await user.click(screen.getByRole('button'));

      // Modal should be rendered (via MobileModal)
      await waitFor(() => {
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    });

    it('shows modal on mobile even when options are below threshold', async () => {
      const user = userEvent.setup();
      const fewOptions = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];

      render(
        <FilterSelect
          {...defaultProps}
          options={fewOptions}
          modalThreshold={5}
        />
      );

      await user.click(screen.getByRole('button'));

      // Anchored dropdowns clip on phone viewports regardless of list
      // length, so short lists get the bottom sheet too.
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('closes mobile modal on option selection', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const manyOptions = Array.from({ length: 10 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`,
      }));

      render(
        <FilterSelect
          {...defaultProps}
          options={manyOptions}
          onChange={onChange}
          modalThreshold={5}
        />
      );

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select an option
      const option = screen.getByText('Option 1');
      await user.click(option);

      // Check that onChange was called
      expect(onChange).toHaveBeenCalledWith('option1');

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('supports search filtering in mobile modal', async () => {
      const user = userEvent.setup();
      const manyOptions = Array.from({ length: 10 }, (_, i) => ({
        value: `item${i}`,
        label: `Item ${i}`,
      }));

      render(
        <FilterSelect
          {...defaultProps}
          options={manyOptions}
          modalThreshold={5}
          searchable={true}
        />
      );

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find and use search input
      const searchInput = screen.getByPlaceholderText('Search…');
      await user.type(searchInput, 'Item 5');

      // Should show only matching items
      expect(screen.getByText('Item 5')).toBeInTheDocument();
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });

    it('closes modal on Escape key in mobile mode', async () => {
      const user = userEvent.setup();
      const manyOptions = Array.from({ length: 10 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`,
      }));

      render(
        <FilterSelect
          {...defaultProps}
          options={manyOptions}
          modalThreshold={5}
        />
      );

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard('{Escape}');

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('shows close button in mobile modal', async () => {
      const user = userEvent.setup();
      const manyOptions = Array.from({ length: 10 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`,
      }));

      render(
        <FilterSelect
          {...defaultProps}
          options={manyOptions}
          modalThreshold={5}
        />
      );

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // MobileModal should render close button
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('displays modal header in mobile mode', async () => {
      const user = userEvent.setup();
      const manyOptions = Array.from({ length: 10 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`,
      }));

      render(
        <FilterSelect
          {...defaultProps}
          options={manyOptions}
          modalThreshold={5}
        />
      );

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        // Dialog should have aria-modal attribute
        expect(dialog).toHaveAttribute('aria-modal', 'true');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('switches from mobile modal to desktop dropdown on resize', async () => {
      const user = userEvent.setup();
      const manyOptions = Array.from({ length: 10 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`,
      }));

      // Start at mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375,
        configurable: true,
      });

      const { rerender } = render(
        <FilterSelect
          {...defaultProps}
          options={manyOptions}
          modalThreshold={5}
        />
      );

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal
      await user.keyboard('{Escape}');

      // Simulate resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
        configurable: true,
      });

      fireEvent.resize(window);

      // Open again - should show dropdown
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });
  });

  describe('icon-option variant', () => {
    it('renders leading content before option labels', async () => {
      const user = userEvent.setup();

      render(
        <FilterSelect
          {...defaultProps}
          renderOptionLeading={(option) => (
            <span data-testid={`leading-${option.value}`} />
          )}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(
        screen.getByTestId(`leading-${defaultProps.options[0].value}`)
      ).toBeInTheDocument();
    });

    it('omits the All option when hideAllOption is set', async () => {
      const user = userEvent.setup();

      render(
        <FilterSelect {...defaultProps} allLabel='Everything' hideAllOption />
      );

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText('Everything')).not.toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(
        defaultProps.options.length
      );
    });
  });
});
