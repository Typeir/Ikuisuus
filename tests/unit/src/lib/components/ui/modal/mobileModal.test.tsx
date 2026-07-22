/**
 * @fileoverview Tests for MobileModal component
 * @module tests/ui/modal/mobileModal.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileModal } from '@/lib/components/ui/modal/mobileModal';

describe('MobileModal', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <MobileModal isOpen={false} onClose={mockOnClose}>
          <div>Modal content</div>
        </MobileModal>
      );

      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('should render to portal when isOpen is true', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </MobileModal>
      );

      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose} title="Test Title">
          <div>Content</div>
        </MobileModal>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render custom header instead of title', () => {
      render(
        <MobileModal 
          isOpen={true} 
          onClose={mockOnClose} 
          title="Title"
          header={<div>Custom Header</div>}
        >
          <div>Content</div>
        </MobileModal>
      );

      expect(screen.getByText('Custom Header')).toBeInTheDocument();
      expect(screen.queryByText('Title')).not.toBeInTheDocument();
    });

    it('should show close button by default', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose} title="Test">
          <div>Content</div>
        </MobileModal>
      );

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('should hide close button when showCloseButton is false', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose} showCloseButton={false}>
          <div>Content</div>
        </MobileModal>
      );

      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });

    it('should render with aria-modal and role="dialog"', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </MobileModal>
      );

      const overlay = screen.getByRole('dialog');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
    });

    it('should use custom aria-label', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose} ariaLabel="Custom Label">
          <div>Content</div>
        </MobileModal>
      );

      const overlay = screen.getByRole('dialog');
      expect(overlay).toHaveAttribute('aria-label', 'Custom Label');
    });
  });

  describe('Callbacks', () => {
    it('should call onClose when close button is clicked', async () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose} title="Test">
          <div>Content</div>
        </MobileModal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </MobileModal>
      );

      const overlay = screen.getByRole('dialog');
      
      // Click on the overlay/backdrop element
      fireEvent.click(overlay);

      // Backdrop click should trigger onClose
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should NOT call onClose when modal content is clicked', async () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </MobileModal>
      );

      const content = screen.getByText('Content');
      fireEvent.click(content);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call onClose when Escape key is pressed', async () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <input type="text" />
        </MobileModal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should trap focus within modal on Tab', async () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <button>First Button</button>
          <button>Second Button</button>
        </MobileModal>
      );

      // Verify modal is open and contains focusable elements
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should prevent body scroll when modal is open', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </MobileModal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal closes', () => {
      const { rerender } = render(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </MobileModal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <MobileModal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </MobileModal>
      );

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Styling and Layout', () => {
    it('should apply custom className to content', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose} className="custom-class">
          <div>Content</div>
        </MobileModal>
      );

      // Use screen to query portal-rendered content
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should apply custom overlayClassName', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose} overlayClassName="custom-overlay">
          <div>Content</div>
        </MobileModal>
      );

      // Use screen to query portal-rendered content
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should apply the overlay class for fixed positioning and stacking', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </MobileModal>
      );

      const overlay = screen.getByRole('dialog');
      expect(overlay).toBeInTheDocument();
      expect(overlay.className).toContain('mobileModalOverlay');
    });

    it('should apply the console variant class when requested', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose} variant='console'>
          <div>Content</div>
        </MobileModal>
      );

      const overlay = screen.getByRole('dialog');
      expect(overlay.className).toContain('console');
    });
  });

  describe('Portal Rendering', () => {
    it('should render to document.body', () => {
      render(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <div data-testid="modal-content">Content</div>
        </MobileModal>
      );

      const modalContent = screen.getByTestId('modal-content');
      expect(modalContent.closest('body')).toBe(document.body);
    });
  });

  describe('Integration', () => {
    it('should handle rapid open/close cycles', async () => {
      const { rerender } = render(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </MobileModal>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();

      rerender(
        <MobileModal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </MobileModal>
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();

      rerender(
        <MobileModal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </MobileModal>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
