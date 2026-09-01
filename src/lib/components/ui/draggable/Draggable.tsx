/**
 * @fileoverview Draggable Container — Generic Moveable & Resizable Wrapper
 *
 * @module lib/components/ui/draggable/Draggable
 * @author Typeir
 * @version 2.0.0
 * @since 2.0.0
 */

'use client';

import { IconButton } from '@/lib/components/ui/iconButton';
import { cn } from '@/lib/utils/classNameMerge';
import { useRef, type CSSProperties, type ReactNode } from 'react';
import styles from './draggable.module.scss';
import {
  useDrag,
  type PositionFromBounds,
  type PositionValue,
} from './useDrag';

/**
 * Props for the Draggable component.
 *
 * @interface DraggableProps
 * @property {ReactNode} children - Content rendered inside the draggable container
 * @property {string} [handleLabel] - Optional text label shown in the drag handle bar
 * @property {string} [className] - Additional CSS class for the outer container
 * @property {CSSProperties} [style] - Additional inline styles for the outer container
 * @property {CSSProperties['width']} [defaultWidth] - Default width in CSS syntax; overridden by user resize
 * @property {CSSProperties['height']} [defaultHeight] - Default height in CSS syntax; overridden by user resize
 * @property {PositionValue | PositionFromBounds} [initialPosition] - Starting position; static coordinates or a function receiving parent bounds. New static coordinates after mount move the container; an unchanged value is ignored
 * @property {React.RefObject<HTMLElement | null>} [boundsRef] - Ref to the bounding container element
 * @property {string} [testId] - data-testid for testing
 * @property {boolean} [resizable] - Whether the container can be resized via a corner handle
 * @property {Function} [onClose] - Callback when the close button is clicked; shows close button when provided
 * @property {string} [closeLabel] - Accessible name for the close button
 * @property {string} [role] - ARIA role for the container, e.g. `region` for a named floating panel
 * @property {string} [ariaLabel] - Accessible name for the container; pair with `role`
 */
interface DraggableProps {
  children: ReactNode;
  handleLabel?: string;
  className?: string;
  style?: CSSProperties;
  defaultWidth?: CSSProperties['width'];
  defaultHeight?: CSSProperties['height'];
  initialPosition?: PositionValue | PositionFromBounds;
  boundsRef?: React.RefObject<HTMLElement | null>;
  testId?: string;
  resizable?: boolean;
  onClose?: () => void;
  closeLabel?: string;
  role?: string;
  ariaLabel?: string;
}

/**
 * Draggable container with pointer-event drag, optional resize, and bounds clamping.
 *
 * @param {DraggableProps} props - Component props
 * @param {ReactNode} props.children - Content rendered inside the draggable container
 * @param {string} [props.handleLabel] - Optional text label shown in the drag handle bar
 * @param {string} [props.className] - Additional CSS class for the outer container
 * @param {CSSProperties} [props.style] - Additional inline styles for the outer container
 * @param {CSSProperties['width']} [props.defaultWidth] - Default width in CSS syntax
 * @param {CSSProperties['height']} [props.defaultHeight] - Default height in CSS syntax
 * @param {PositionValue | PositionFromBounds} [props.initialPosition={ x: 0, y: 0 }] - Starting position
 * @param {React.RefObject<HTMLElement | null>} [props.boundsRef] - Ref to the bounding container element
 * @param {string} [props.testId] - data-testid for testing
 * @param {boolean} [props.resizable=false] - Whether the container can be resized via a corner handle
 * @param {() => void} [props.onClose] - Callback when the close button is clicked
 * @param {string} [props.closeLabel='Close panel'] - Accessible name for the close button
 * @param {string} [props.role] - ARIA role for the container
 * @param {string} [props.ariaLabel] - Accessible name for the container
 * @returns {React.ReactElement} The draggable container
 *
 * @example
 * ```tsx
 * <Draggable handleLabel="Preview" initialPosition={{ x: 100, y: 50 }} resizable>
 *   <iframe src="/en/embed/world/ordovica" />
 * </Draggable>
 * ```
 */
export function Draggable({
  children,
  handleLabel,
  className,
  style,
  defaultWidth,
  defaultHeight,
  initialPosition = { x: 0, y: 0 },
  boundsRef,
  testId,
  resizable = false,
  onClose,
  closeLabel = 'Close panel',
  role,
  ariaLabel,
}: DraggableProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    position,
    size,
    isDragging,
    isResizing,
    dragHandleProps,
    resizeHandleProps,
  } = useDrag({ containerRef, initialPosition, boundsRef });

  const containerClass = cn(
    styles.draggable,
    isDragging ? styles.isDragging : '',
    isResizing ? styles.isResizing : '',
    className ?? '',
  );

  /** User resize overrides the default dimensions and any passed style. */
  const containerStyle: CSSProperties = {
    left: position.x,
    top: position.y,
    ...(defaultWidth != null ? { width: defaultWidth } : {}),
    ...(defaultHeight != null ? { height: defaultHeight } : {}),
    ...style,
    ...(size ? { width: size.width, height: size.height } : {}),
  };

  return (
    <div
      ref={containerRef}
      className={containerClass}
      style={containerStyle}
      role={role}
      aria-label={ariaLabel}
      data-testid={testId}>
      <div
        className={styles.dragHandle}
        {...dragHandleProps}
        role='separator'
        aria-orientation='horizontal'
        aria-label={handleLabel ?? 'Drag handle'}>
        <span className={styles.dragGrip} aria-hidden='true' />
        {handleLabel && <span className={styles.dragLabel}>{handleLabel}</span>}
        {onClose && (
          <IconButton kind='close' label={closeLabel} onClick={onClose} />
        )}
      </div>
      <div className={styles.dragContent}>{children}</div>
      {resizable && (
        <div
          className={styles.resizeHandle}
          {...resizeHandleProps}
          role='separator'
          aria-orientation='vertical'
          aria-label='Resize handle'
          data-testid={testId ? `${testId}-resize` : undefined}
        />
      )}
    </div>
  );
}

export {
  useDrag,
  type PositionFromBounds,
  type PositionValue,
} from './useDrag';
