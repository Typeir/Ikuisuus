/**
 * @fileoverview Parked Card Chrome
 * @description The handle, title, close control and resize corner a parked card
 * wears. Split out so the surface component stays about its two states rather
 * than about markup.
 *
 * @module lib/components/ui/detachableTooltip/CardChrome
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import draggableStyles from '@/lib/components/ui/draggable/draggable.module.scss';
import type { HandleProps } from '@/lib/components/ui/draggable/useDrag';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './detachableTooltip.module.scss';

/**
 * Props for {@link CardChrome}.
 *
 * @interface CardChromeProps
 * @property {ReactNode} children - Card body
 * @property {HandleProps} dragHandleProps - Pointer handlers for the handle
 * @property {HandleProps} resizeHandleProps - Pointer handlers for the corner
 * @property {() => void} onClose - Closes the card
 * @property {string} [title] - Card title, also the handle's accessible name
 * @property {string} [closeLabel] - Accessible name for the close control
 */
export interface CardChromeProps {
  children: ReactNode;
  dragHandleProps: HandleProps;
  resizeHandleProps: HandleProps;
  onClose: () => void;
  title?: string;
  closeLabel?: string;
}

/**
 * Renders a parked card's chrome around its body.
 *
 * @param {CardChromeProps} props - Component props
 * @returns {React.ReactElement} Handle, body and resize corner
 */
export function CardChrome({
  children,
  dragHandleProps,
  resizeHandleProps,
  onClose,
  title,
  closeLabel,
}: CardChromeProps): React.ReactElement {
  return (
    <>
      <div
        className={draggableStyles.dragHandle}
        {...dragHandleProps}
        role='separator'
        aria-orientation='horizontal'
        aria-label={title ?? 'Drag handle'}>
        <span className={draggableStyles.dragGrip} aria-hidden='true' />
        {title && <span className={draggableStyles.dragLabel}>{title}</span>}
        <button
          className={draggableStyles.closeButton}
          onClick={onClose}
          type='button'
          aria-label={closeLabel ?? 'Close panel'}>
          <X size={16} aria-hidden='true' />
        </button>
      </div>
      <div className={styles.panelBody}>{children}</div>
      <div
        className={draggableStyles.resizeHandle}
        {...resizeHandleProps}
        role='separator'
        aria-orientation='vertical'
        aria-label='Resize handle'
      />
    </>
  );
}

export default CardChrome;
