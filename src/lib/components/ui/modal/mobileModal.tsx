/**
 * @fileoverview Generic Mobile Modal Component
 * @description Mobile bottom-sheet modal with focus trap, keyboard navigation,
 * and optional `console` variant. Renders to a portal for z-index stacking.
 *
 * @module lib/components/ui/modal/mobileModal
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { IconButton } from '@/lib/components/ui/iconButton';
import { memo, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './mobileModal.module.scss';
import { useModalA11y } from './useModalA11y';

/**
 * @interface MobileModalProps
 * Mobile modal configuration props.
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
 * Mobile bottom-sheet modal with focus management and keyboard navigation.
 * Renders to document.body via portal.
 *
 * @component
 * @param {MobileModalProps} props - Modal configuration.
 * @returns {JSX.Element | null} Rendered modal or null when closed.
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
  const { overlayRef, contentRef } = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const variantClass = variant === 'console' ? styles.console : '';

  return createPortal(
    <div
      ref={overlayRef}
      className={`${styles.mobileModalOverlay} ${variantClass} ${overlayClassName}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role='dialog'
      aria-modal='true'
      aria-label={ariaLabel}>
      <div
        ref={contentRef}
        tabIndex={-1}
        className={`${styles.mobileModalContent} ${className}`}>
        {(header || title || showCloseButton) && (
          <div className={styles.mobileModalHeader}>
            {header ||
              (title && <h2 className={styles.mobileModalTitle}>{title}</h2>)}
            {showCloseButton && (
              <IconButton
                kind='close'
                label='Close modal'
                onClick={onClose}
                shape={variant === 'console' ? 'square' : 'plain'}
              />
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
