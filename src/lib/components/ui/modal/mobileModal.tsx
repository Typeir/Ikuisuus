/**
 * @fileoverview Generic Mobile Modal Component
 * @description Reusable mobile-optimized modal with focus trap, keyboard navigation,
 * and optional search input. Renders to portal for proper z-index stacking.
 *
 * @module ui/modal/mobileModal
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useEffect, useRef, ReactNode, memo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * @interface MobileModalProps
 * Configuration for generic mobile modal
 * @property {boolean} isOpen - Whether modal is visible
 * @property {() => void} onClose - Callback when modal should close (Escape key, backdrop click)
 * @property {ReactNode} children - Modal content
 * @property {string} [title] - Optional modal title/header text
 * @property {ReactNode} [header] - Optional custom header element (takes precedence over title)
 * @property {boolean} [showCloseButton=true] - Whether to show X button
 * @property {string} [ariaLabel] - Accessible label for screen readers
 * @property {string} [className] - Additional CSS classes for modal content
 * @property {string} [overlayClassName] - Additional CSS classes for overlay
 */
export interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  header?: ReactNode;
  showCloseButton?: boolean;
  ariaLabel?: string;
  className?: string;
  overlayClassName?: string;
}

/**
 * Generic mobile modal component with focus management and keyboard navigation.
 * Renders to document.body via portal for proper modal stacking.
 *
 * @component
 * @param {MobileModalProps} props - Modal configuration
 * @property {() => void} props.onClose - Callback when modal should close
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <MobileModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Select an option"
 * >
 *   <div>Modal content here</div>
 * </MobileModal>
 * ```
 */
export const MobileModal = memo(function MobileModal({
  isOpen,
  onClose,
  children,
  title,
  header,
  showCloseButton = true,
  ariaLabel,
  className = '',
  overlayClassName = '',
}: MobileModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  /**
   * Focus trap: loops tab navigation within modal and handles Escape key.
   * Prevents body scroll while modal is open.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`mobileModalOverlay ${overlayClassName}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgb(var(--color-overlay))',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 1000,
      }}
    >
      <div
        ref={modalRef}
        className={`mobileModalContent ${className}`}
        style={{
          width: '100%',
          maxHeight: '90vh',
          backgroundColor: 'var(--color-bg)',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -2px 10px rgb(var(--color-shadow))',
        }}
      >
        {(header || title || showCloseButton) && (
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {header || (title && <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--color-text)' }}>{title}</h2>)}
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <X size={24} aria-hidden='true' />
              </button>
            )}
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
});

MobileModal.displayName = 'MobileModal';
