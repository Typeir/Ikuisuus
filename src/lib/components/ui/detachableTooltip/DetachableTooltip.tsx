/**
 * @fileoverview Detachable Tooltip
 * @description A draggable card that opens on hover. It is a card from the
 * first frame — there is no tooltip phase and no promotion, so nothing shifts
 * when it is kept. Leaving the trigger fades it out; leaving with Shift held,
 * or Shift+Enter, pins it.
 *
 * Placement is `useTooltipAnchor`, unchanged from the plain `Tooltip`: the
 * position is written straight to the DOM before paint and the card stays
 * hidden until the first write, so it never appears in a spot it then leaves.
 * The card keeps that anchoring until it is dragged, at which point `useDrag`
 * takes the position it already has.
 *
 * @module lib/components/ui/detachableTooltip/DetachableTooltip
 * @version 5.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import draggableStyles from '@/lib/components/ui/draggable/draggable.module.scss';
import { useDrag } from '@/lib/components/ui/draggable/useDrag';
import { useEscapeDismiss } from '@/lib/components/ui/tooltip/useEscapeDismiss';
import {
  useTooltipAnchor,
  type TooltipPlacement,
} from '@/lib/components/ui/tooltip/useTooltipAnchor';
import { useTooltipVisibility } from '@/lib/components/ui/tooltip/useTooltipVisibility';
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CardChrome } from './CardChrome';
import styles from './detachableTooltip.module.scss';

/**
 * Props for {@link DetachableTooltip}.
 *
 * @interface DetachableTooltipProps
 * @property {ReactNode} content - Card body
 * @property {ReactElement} children - Trigger element; receives the ref and handlers
 * @property {string} [title] - Card title, shown in the handle and used as its accessible name
 * @property {TooltipPlacement} [placement] - Preferred side of the trigger
 * @property {number} [showDelay] - Delay before the card opens, in ms
 * @property {number} [hideDelay] - Delay before the card closes, in ms
 * @property {number} [maxWidth] - Maximum width of the card, in px
 * @property {boolean} [disabled] - When true, the card never opens
 * @property {string} [className] - Extra class for the card
 * @property {string} [panelClassName] - Extra class for the card, applied after `className`
 * @property {string} [id] - Id used for the ARIA relationship
 * @property {string} [closeLabel] - Accessible name for the close control
 */
export interface DetachableTooltipProps {
  content: ReactNode;
  children: ReactElement;
  title?: string;
  placement?: TooltipPlacement;
  showDelay?: number;
  hideDelay?: number;
  maxWidth?: number;
  disabled?: boolean;
  className?: string;
  panelClassName?: string;
  id?: string;
  closeLabel?: string;
}

/**
 * Draggable card that opens on hover and stays when pinned.
 *
 * The trigger is cloned, not wrapped, so no layout box lands in running prose.
 *
 * @param {DetachableTooltipProps} props - Component props
 * @returns {React.ReactElement} The trigger plus the card portal
 *
 * @example
 * ```tsx
 * <DetachableTooltip content={<Definition />} title='Blinded'>
 *   <a href='/rules/conditions#blinded'>blinded</a>
 * </DetachableTooltip>
 * ```
 */
export function DetachableTooltip({
  content,
  children,
  title,
  placement = 'top',
  showDelay = 200,
  hideDelay = 0,
  maxWidth = 250,
  disabled = false,
  className = '',
  panelClassName = '',
  id,
  closeLabel,
}: DetachableTooltipProps): React.ReactElement {
  const [isMounted, setIsMounted] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [moved, setMoved] = useState(false);
  const [frame, setFrame] = useState({ x: 0, y: 0 });

  const layerRef = useRef<HTMLDivElement>(null);

  const { showPortal, exiting, show, hide, hideNow } = useTooltipVisibility({
    showDelay,
    hideDelay,
    disabled,
  });

  const { triggerRef, surfaceRef, anchorName, actualPlacement, anchorId } =
    useTooltipAnchor(placement, showPortal && !moved);

  const initialPosition = useMemo(
    () => ({ x: frame.x, y: frame.y }),
    [frame.x, frame.y],
  );
  const { position, size, isDragging, dragHandleProps, resizeHandleProps } =
    useDrag({
      containerRef: surfaceRef,
      initialPosition,
      boundsRef: layerRef,
    });

  const cardId = id || `card-${anchorId}`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /** Closes the card and forgets both that it was pinned and that it was moved. */
  const close = useCallback(() => {
    setPinned(false);
    setMoved(false);
    hideNow();
  }, [hideNow]);

  /**
   * Leaves the trigger: pins when Shift is held, otherwise starts the fade.
   *
   * @param {ReactMouseEvent} event - Pointer leave event
   */
  const handleLeave = useCallback(
    (event: ReactMouseEvent) => {
      if (event.shiftKey && showPortal) {
        setPinned(true);
        return;
      }
      if (!pinned) hide();
    },
    [hide, pinned, showPortal],
  );

  /**
   * Pins from the keyboard, mirroring the pointer gesture.
   *
   * @param {ReactKeyboardEvent} event - Key event from the trigger
   */
  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (event.key !== 'Enter' || !event.shiftKey || disabled) return;

      event.preventDefault();
      if (showPortal) setPinned(true);
    },
    [disabled, showPortal],
  );

  /**
   * Starting a drag keeps the card and takes it off the anchor.
   *
   * @param {ReactPointerEvent} event - Pointer event from the handle
   */
  const handleDragStart = useCallback(
    (event: ReactPointerEvent) => {
      const surface = surfaceRef.current;
      const layer = layerRef.current;
      if (!surface || !layer) return;

      const rect = surface.getBoundingClientRect();
      const bounds = layer.getBoundingClientRect();

      setPinned(true);
      setMoved(true);
      setFrame({
        x: Math.round(rect.left - bounds.left),
        y: Math.round(rect.top - bounds.top),
      });
      surface.style.transform = '';

      dragHandleProps.onPointerDown(event);
    },
    [dragHandleProps, surfaceRef],
  );

  useEscapeDismiss(showPortal, close);

  const child = isValidElement(children) ? Children.only(children) : null;

  if (!isMounted || !content || !child) {
    return children;
  }

  const trigger = cloneElement(child as ReactElement<any>, {
    ref: triggerRef,
    style: {
      ...((child.props as { style?: CSSProperties }).style ?? {}),
      anchorName,
    } as CSSProperties,
    onMouseEnter: show,
    onMouseLeave: handleLeave,
    onFocus: show,
    onBlur: () => {
      if (!pinned) hide();
    },
    onKeyDown: handleKeyDown,
    'aria-describedby': showPortal ? cardId : undefined,
  });

  const cardClass = [
    styles.panel,
    moved ? styles.moved : styles.anchored,
    moved ? '' : styles[actualPlacement],
    exiting ? styles.closing : '',
    isDragging ? draggableStyles.isDragging : '',
    className,
    panelClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const cardStyle: CSSProperties = moved
    ? {
        left: position.x,
        top: position.y,
        /* The opening cap stops applying once the reader sets a width, or the
           card could never be resized wider than it opened. */
        maxWidth,
      }
    : ({
        maxWidth,
        positionAnchor: anchorName,
      } as CSSProperties);

  return (
    <>
      {trigger}
      {showPortal &&
        createPortal(
          <div className={styles.layer} ref={layerRef}>
            <div
              ref={surfaceRef}
              id={cardId}
              role='region'
              aria-label={title}
              className={cardClass}
              style={cardStyle}
              onMouseEnter={show}
              onMouseLeave={() => {
                if (!pinned) hide();
              }}>
              <CardChrome
                dragHandleProps={{
                  ...dragHandleProps,
                  onPointerDown: handleDragStart,
                }}
                resizeHandleProps={resizeHandleProps}
                onClose={close}
                title={title}
                closeLabel={closeLabel}>
                {content}
              </CardChrome>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default DetachableTooltip;
