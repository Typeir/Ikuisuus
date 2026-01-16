/**
 * @fileoverview Generic Modal Component
 * @description Reusable desktop modal with focus trap, keyboard navigation,
 * and backdrop. Renders to portal for proper z-index stacking. Centered on screen.
 *
 * @module ui/modal/modal
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useEffect, useRef, ReactNode, memo } from 'react';
import { createPortal } from 'react-dom';
import styles from './modal.module.scss';

/**
 * @interface ModalProps
 * Configuration for generic modal
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
export interface ModalProps {
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
 * Generic modal component with focus management and keyboard navigation.
 * Renders to document.body via portal for proper modal stacking.
 *
 * @component
 * @param {ModalProps} props - Modal configuration
 * @property {() => void} props.onClose - Callback when modal should close
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 * >
 *   <div>Modal content here</div>
 * </Modal>
 * ```
 */
export const Modal = memo(function Modal({
  isOpen,
  onClose,
  children,
  title,
  header,
  showCloseButton = true,
  ariaLabel,
  className = '',
  overlayClassName = '',
}: ModalProps) {
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
      className={`${styles.overlay} ${overlayClassName}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div ref={modalRef} className={`${styles.content} ${className}`}>
        {(header || title || showCloseButton) && (
          <div className={styles.header}>
            {header || (title && <h2 className={styles.title}>{title}</h2>)}
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                type="button"
                className={styles.closeButton}
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
});

Modal.displayName = 'Modal';
