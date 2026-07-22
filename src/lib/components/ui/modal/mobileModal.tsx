/**
 * @fileoverview Generic Mobile Modal Component
 * @description Reusable mobile-optimized bottom-sheet modal with focus trap,
 * keyboard navigation, and an optional `console` skin matching the site's
 * terminal aesthetic. Renders to portal for proper z-index stacking.
 *
 * @module ui/modal/mobileModal
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { X } from 'lucide-react';
import { memo, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './mobileModal.module.scss';

/**
 * @interface MobileModalProps
 * Configuration for generic mobile modal
 * @property {boolean} isOpen - Whether modal is visible
 * @property {() => void} onClose - Callback when modal should close (Escape key, backdrop click)
 * @property {ReactNode} children - Modal content
 * @property {string} [title] - Optional modal title/header text
 * @property {ReactNode} [header] - Optional custom header element (takes precedence over title)
 * @property {boolean} [showCloseButton=true] - Whether to show X button
 * @property {'default' | 'console'} [variant='default'] - Visual skin; `console` renders square shoulders, surface border, and a small-caps terminal label
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
  variant?: 'default' | 'console';
  ariaLabel?: string;
  className?: string;
  overlayClassName?: string;
}

/**
 * Generic mobile bottom-sheet modal with focus management and keyboard
 * navigation. Renders to document.body via portal for proper modal stacking.
 *
 * @component
 * @param {MobileModalProps} props - Modal configuration
 * @returns {JSX.Element | null} Rendered modal or null when closed
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <MobileModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Select an option"
 *   variant="console"
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
  variant = 'default',
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
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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

  const variantClass = variant === 'console' ? styles.console : '';

  return createPortal(
    <div
      className={`${styles.mobileModalOverlay} ${variantClass} ${overlayClassName}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role='dialog'
      aria-modal='true'
      aria-label={ariaLabel}>
      <div
        ref={modalRef}
        className={`${styles.mobileModalContent} ${className}`}>
        {(header || title || showCloseButton) && (
          <div className={styles.mobileModalHeader}>
            {header ||
              (title && <h2 className={styles.mobileModalTitle}>{title}</h2>)}
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label='Close modal'
                type='button'
                className={styles.mobileModalClose}>
                <X size={24} aria-hidden='true' />
              </button>
            )}
          </div>
        )}

        <div className={styles.mobileModalBody}>{children}</div>
      </div>
    </div>,
    document.body,
  );
});

MobileModal.displayName = 'MobileModal';
