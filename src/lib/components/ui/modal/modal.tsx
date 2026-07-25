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

import { ReactNode, memo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './modal.module.scss';
import { useModalA11y } from './useModalA11y';

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
  const { overlayRef, contentRef } = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${overlayClassName}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        className={`${styles.content} ${className}`}
      >
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
                <X size={18} aria-hidden='true' />
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
