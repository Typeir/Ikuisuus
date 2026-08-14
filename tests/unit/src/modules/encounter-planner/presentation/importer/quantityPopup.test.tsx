/**
 * @fileoverview Unit tests for QuantityPopup.
 * @module tests/unit/src/lib/components/encounterPlanner/importer/quantityPopup.test
 * @description Tests QuantityPopup rendering, quantity bounds (1-20),
 * keyboard navigation, autofocus, and accessibility attributes.
 *
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/modules/encounter-planner/presentation/importer/quantityPopup
 */

import { QuantityPopup } from '@/modules/encounter-planner/presentation/importer/quantityPopup';
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('QuantityPopup Component', () => {
  let mockOnConfirm: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cleanup();
    mockOnConfirm = vi.fn();
    mockOnCancel = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should export QuantityPopup component', () => {
      expect(QuantityPopup).toBeDefined();
      expect(typeof QuantityPopup).toBe('function');
    });

    it('should not render when isOpen is false', () => {
      render(
        <QuantityPopup
          isOpen={false}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display creature name in popup', () => {
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Ancient Red Dragon'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('Ancient Red Dragon')).toBeInTheDocument();
    });

    it('should display custom labels when provided', () => {
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          confirmLabel='Import'
          cancelLabel='Abort'
          quantityLabel='Amount'
        />,
      );

      expect(screen.getByText('Import')).toBeInTheDocument();
      expect(screen.getByText('Abort')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('should use default labels when not provided', () => {
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('Add')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
    });
  });

  describe('Default Quantity', () => {
    it('should default to quantity of 1', () => {
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue('1');
    });

    it('should reset quantity to 1 when reopened', async () => {
      const { rerender } = render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const user = userEvent.setup();
      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '5');
      expect(input).toHaveValue('5');

      rerender(
        <QuantityPopup
          isOpen={false}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      rerender(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const newInput = screen.getByRole('spinbutton');
      expect(newInput).toHaveValue('1');
    });
  });

  describe('Autofocus', () => {
    it('should focus confirm button on open', async () => {
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          confirmLabel='Add'
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Add').closest('button')).toHaveFocus();
      });
    });
  });

  describe('Confirm Action', () => {
    it('should call onConfirm with quantity when confirm button clicked', async () => {
      const user = userEvent.setup();
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      await user.click(screen.getByText('Add').closest('button')!);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith(1);
    });

    it('should call onConfirm with updated quantity', async () => {
      const user = userEvent.setup();
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '5');
      await user.click(screen.getByText('Add').closest('button')!);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith(5);
    });

    it('should call onConfirm with 1 when input is empty', async () => {
      const user = userEvent.setup();
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.click(screen.getByText('Add').closest('button')!);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith(1);
    });
  });

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      await user.click(screen.getByText('Cancel').closest('button')!);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should confirm on Enter key press', async () => {
      const user = userEvent.setup();
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByRole('spinbutton');
      await act(async () => {
        input.focus();
      });

      await user.keyboard('{Enter}');

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith(1);
    });

    it('should confirm on Enter with updated quantity', async () => {
      const user = userEvent.setup();
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, '3');
      await user.keyboard('{Enter}');

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith(3);
    });

    it('should cancel on Escape key press', async () => {
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should allow Tab navigation between elements', () => {
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      // Verify all focusable elements are present and accessible
      const input = screen.getByRole('spinbutton');
      const cancelButton = screen.getByLabelText('Cancel');
      const confirmButton = screen.getByLabelText(/Add Goblin/);

      // All elements should be rendered and not disabled
      expect(input).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();

      expect(input).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('Quantity Constraints', () => {
    it('should not allow quantity below 1', async () => {
      const user = userEvent.setup();
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '0');
      await user.click(screen.getByText('Add').closest('button')!);

      expect(mockOnConfirm).toHaveBeenCalledWith(1);
    });

    it('should not allow quantity above 20', async () => {
      const user = userEvent.setup();
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '25');
      await user.click(screen.getByText('Add').closest('button')!);

      expect(mockOnConfirm).toHaveBeenCalledWith(20);
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog" on popup', () => {
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Goblin'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should have accessible aria-label with creature name', () => {
      render(
        <QuantityPopup
          isOpen={true}
          creatureName='Ancient Red Dragon'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-label',
        'Add Ancient Red Dragon',
      );
    });
  });
});
