/**
 * @fileoverview Quantity Popup Component
 * @description Modal dialog for selecting quantity when importing creatures.
 * Features keyboard navigation (Enter confirms, Escape cancels), autofocus on confirm button,
 * and accessible labeling. Renders as centered modal overlay.
 *
 * @module quantityPopup
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react
 * @requires @/lib/components/ui/numericInput
 * @requires @/lib/components/ui/modal
 *
 * @example
 * ```tsx
 * <QuantityPopup
 *   isOpen={showPopup}
 *   creatureName="Ancient Red Dragon"
 *   onConfirm={(qty) => addCreatures(qty)}
 *   onCancel={() => setShowPopup(false)}
 * />
 * ```
 */

'use client';

import { Modal, NumericInput } from '@/lib/components/ui';
import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './quantityPopup.module.scss';
import btn from '@/styles/buttons.module.scss';

/**
 * Maximum allowed quantity for creature import.
 * Prevents performance issues from adding too many creatures at once.
 *
 * @constant
 * @type {number}
 */
const MAX_QUANTITY = 20;

/**
 * Default quantity value when popup opens.
 *
 * @constant
 * @type {number}
 */
const DEFAULT_QUANTITY = 1;

/**
 * Props for QuantityPopup component
 *
 * @interface QuantityPopupProps
 * @property {boolean} isOpen - Whether the popup is visible
 * @property {string} creatureName - Name of creature being added (for display)
 * @property {(quantity: number) => void} onConfirm - Called with selected quantity on confirm
 * @property {() => void} onCancel - Called when popup is cancelled
 * @property {string} [confirmLabel="Add"] - Label for confirm button
 * @property {string} [cancelLabel="Cancel"] - Label for cancel button
 * @property {string} [quantityLabel="Quantity"] - Label for quantity input
 */
export interface QuantityPopupProps {
  isOpen: boolean;
  creatureName: string;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  quantityLabel?: string;
}

/**
 * Modal dialog for selecting creature import quantity.
 * Autofocuses confirm button on open for quick single-click addition.
 * Supports keyboard navigation: Enter confirms, Escape cancels.
 *
 * @component
 * @param {QuantityPopupProps} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {string} props.creatureName - Name of the creature being imported
 * @param {(quantity: number) => void} props.onConfirm - Callback with selected quantity
 * @param {() => void} props.onCancel - Callback when modal is cancelled
 * @param {string} [props.confirmLabel='Confirm'] - Label for the confirm button
 * @param {string} [props.cancelLabel='Cancel'] - Label for the cancel button
 * @param {string} [props.quantityLabel='Quantity'] - Label for the quantity input
 * @returns {JSX.Element | null} Rendered modal or null when closed
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
 *
 * <QuantityPopup
 *   isOpen={isOpen}
 *   creatureName="Goblin"
 *   onConfirm={(qty) => {
 *     addCreatures(selectedSlug, qty);
 *     setIsOpen(false);
 *   }}
 *   onCancel={() => setIsOpen(false)}
 * />
 * ```
 */
export const QuantityPopup: React.FC<QuantityPopupProps> = ({
  isOpen,
  creatureName,
  onConfirm,
  onCancel,
  confirmLabel = 'Add',
  cancelLabel = 'Cancel',
  quantityLabel = 'Quantity',
}) => {
  const [quantity, setQuantity] = useState<number | undefined>(
    DEFAULT_QUANTITY,
  );
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity(DEFAULT_QUANTITY);
      requestAnimationFrame(() => {
        confirmButtonRef.current?.focus();
      });
    }
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    const finalQuantity = getValidQuantity(quantity);
    onConfirm(finalQuantity);
  }, [quantity, onConfirm]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleConfirm();
      }
    },
    [handleConfirm],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={creatureName}
      showCloseButton={false}
      ariaLabel={`Add ${creatureName}`}
      className={styles.quantityModal}>
      <div className={styles.content} onKeyDown={handleKeyDown}>
        <label className={styles.label} htmlFor='quantity-input'>
          {quantityLabel}
        </label>
        <NumericInput
          id='quantity-input'
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={MAX_QUANTITY}
          ariaLabel={`${quantityLabel} of ${creatureName} to add`}
          size='md'
        />

        <div className={styles.actions}>
          <button
            type='button'
            className={`${btn.neutral} ${styles.action}`}
            onClick={onCancel}
            aria-label={cancelLabel}>
            <span className={styles.buttonIcon} aria-hidden='true'>
              <X size={14} />
            </span>
            <span className={styles.buttonText}>{cancelLabel}</span>
          </button>

          <button
            ref={confirmButtonRef}
            type='button'
            className={styles.action}
            onClick={handleConfirm}
            aria-label={`${confirmLabel} ${getValidQuantity(quantity)} ${creatureName}`}>
            <span className={styles.buttonIcon} aria-hidden='true'>
              <Check size={14} />
            </span>
            <span className={styles.buttonText}>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Validates and normalizes quantity value to ensure it's within bounds.
 * Returns DEFAULT_QUANTITY for invalid values (undefined, NaN, out of range).
 *
 * @function getValidQuantity
 * @param {number | undefined} value - Raw quantity value
 * @returns {number} Valid quantity between 1 and MAX_QUANTITY
 */
function getValidQuantity(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_QUANTITY;
  }
  return Math.max(1, Math.min(MAX_QUANTITY, Math.floor(value)));
}

QuantityPopup.displayName = 'QuantityPopup';
