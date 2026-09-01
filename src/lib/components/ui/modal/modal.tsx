/**
 * @fileoverview Modal component.
 * @description Renders a modal to document.body via portal with focus management,
 * keyboard navigation, and backdrop.
 *
 * @module lib/components/ui/modal/modal
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { ReactNode, memo } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '@/lib/components/ui/iconButton';
import StaticFlashlight, { type FlashlightCorner } from '@/lib/components/flashlight/StaticFlashlight';
import styles from './modal.module.scss';
import { useModalA11y } from './useModalA11y';

/**
 * @interface ModalProps
 * Modal configuration.
 * @property {boolean} isOpen - Whether modal is visible
 * @property {() => void} onClose - Called when the modal closes (Escape key, backdrop click)
 * @property {ReactNode} children - Modal content
 * @property {string} [title] - Title/header text
 * @property {ReactNode} [header] - Custom header element; takes precedence over title
 * @property {boolean} [showCloseButton=true] - Whether to render the X button
 * @property {string} [ariaLabel] - Accessible label for screen readers
 * @property {string} [className] - Additional CSS classes for modal content
 * @property {string} [bodyClassName] - Additional CSS classes for the scrolling body
 * @property {string} [contentClassName] - Additional CSS classes for the wrapper holding the children
 * @property {string} [overlayClassName] - Additional CSS classes for overlay
 * @property {boolean} [flashlight=true] - Render the reveal layer behind the body
 * @property {FlashlightCorner} [flashlightCorner='bottom-left'] - Corner the reveal sits on
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
  bodyClassName?: string;
  contentClassName?: string;
  overlayClassName?: string;
  flashlight?: boolean;
  flashlightCorner?: FlashlightCorner;
}

/**
 * Modal component with focus management and keyboard navigation.
 * Renders to document.body via portal.
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
  bodyClassName = '',
  contentClassName = '',
  overlayClassName = '',
  flashlight = true,
  flashlightCorner = 'bottom-left',
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
              <IconButton
                kind='close'
                label='Close modal'
                onClick={onClose}
              />
            )}
          </div>
        )}

        <div className={`${styles.body} ${bodyClassName}`}>
          {flashlight && <StaticFlashlight corner={flashlightCorner} />}
          <div className={`${styles.bodyContent} ${contentClassName}`}>{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
});

Modal.displayName = 'Modal';
