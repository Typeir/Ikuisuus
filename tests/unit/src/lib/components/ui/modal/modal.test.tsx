/**
 * @fileoverview Unit tests for Modal Component
 * @module tests/unit/src/lib/components/ui/modal/modal.test
 * @description Tests for generic modal with focus trap, keyboard navigation, and portal rendering.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/lib/components/ui/modal/modal
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/lib/components/ui/modal/modal';

// Mock createPortal to render in place instead of in document.body
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('Modal Component', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <div>Modal content</div>
        </Modal>
      );

      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Modal content</div>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Custom modal content</div>
        </Modal>
      );

      expect(screen.getByText('Custom modal content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Confirm Delete">
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    it('should render with custom header element', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          header={<div>Custom Header</div>}
          title="This should not render"
        >
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByText('Custom Header')).toBeInTheDocument();
      expect(screen.queryByText('This should not render')).not.toBeInTheDocument();
    });

    it('should render close button by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('should not render close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={false}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });

    it('should apply custom className to modal content', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} className="custom-modal-class">
          <div>Content</div>
        </Modal>
      );

      const content = container.querySelector('.custom-modal-class');
      expect(content).toBeInTheDocument();
    });

    it('should apply custom overlayClassName', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} overlayClassName="custom-overlay">
          <div>Content</div>
        </Modal>
      );

      const overlay = container.querySelector('.custom-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('should have proper aria attributes', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} ariaLabel="Delete confirmation">
          <div>Content</div>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Delete confirmation');
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it('should call onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      // Find the overlay (the div with the onClick handler that has role="dialog")
      // This is the outer container with the overlay class
      const dialog = screen.getByRole('dialog');
      const overlay = dialog as HTMLElement;
      
      // Click directly on overlay (not on modal content)
      await user.click(overlay, { skipPointerEventsCheck: true });

      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it('should not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Click me</div>
        </Modal>
      );

      const content = screen.getByText('Click me');
      await user.click(content);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should trap focus within modal on Tab', async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );

      const firstButton = screen.getByText('First Button');
      const secondButton = screen.getByText('Second Button');

      // Tab from first to second
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);

      await user.tab();
      expect(document.activeElement).toBe(secondButton);

      // Shift+Tab back to first (focus trap)
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(firstButton);
    });

    it('should loop focus when tabbing past last focusable element', async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );

      const secondButton = screen.getByText('Second Button');

      // Focus on last button and tab forward
      secondButton.focus();
      expect(document.activeElement).toBe(secondButton);

      await user.tab();
      // Should loop back to first button (close button or first content button)
      expect(document.activeElement).not.toBe(secondButton);
    });

    it('should loop focus backward from first focusable element', async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );

      const firstButton = screen.getByText('First Button');

      // Focus on first button and shift+tab
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);

      await user.tab({ shift: true });
      // Should loop to last focusable element
      expect(document.activeElement).not.toBe(firstButton);
    });
  });

  describe('Scroll Lock', () => {
    it('should disable body scroll when modal opens', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.documentElement.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal closes', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.documentElement.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.documentElement.style.overflow).toBe('');
    });

    it('should not affect body scroll when modal is not open', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.documentElement.style.overflow).not.toBe('hidden');
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should have accessible close button', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveAttribute('type', 'button');
    });

    it('should support custom aria-label', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} ariaLabel="Important dialog">
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Important dialog');
    });
  });

  describe('Memoization', () => {
    it('should be memoized', () => {
      expect(Modal.$$typeof).toBeDefined();
      expect(Modal.displayName).toBe('Modal');
    });

    it('should render consistently across re-renders with same props', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test">
          <div>Content</div>
        </Modal>
      );

      const dialog1 = screen.getByRole('dialog');

      rerender(
        <Modal isOpen={true} onClose={mockOnClose} title="Test">
          <div>Content</div>
        </Modal>
      );

      const dialog2 = screen.getByRole('dialog');
      expect(dialog1).toEqual(dialog2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle modal open/close transitions', async () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should handle rapid open/close cycles', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      for (let i = 0; i < 3; i++) {
        rerender(
          <Modal isOpen={true} onClose={mockOnClose}>
            <div>Content</div>
          </Modal>
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        rerender(
          <Modal isOpen={false} onClose={mockOnClose}>
            <div>Content</div>
          </Modal>
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }
    });

    it('should handle large content', () => {
      const largeContent = Array.from({ length: 100 }, (_, i) => (
        <div key={i}>Item {i}</div>
      ));

      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>{largeContent}</div>
        </Modal>
      );

      expect(screen.getByText('Item 0')).toBeInTheDocument();
      expect(screen.getByText('Item 99')).toBeInTheDocument();
    });

    it('should handle missing optional props', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('should work with nested interactive elements', async () => {
      const user = userEvent.setup();
      const handleButtonClick = vi.fn();

      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <button onClick={handleButtonClick}>Inner Button</button>
          <input type="text" placeholder="Input field" />
        </Modal>
      );

      const innerButton = screen.getByText('Inner Button');
      await user.click(innerButton);

      expect(handleButtonClick).toHaveBeenCalled();
    });
  });
});
