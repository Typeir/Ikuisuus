/**
 * @fileoverview Detachable Tooltip
 * @description One floating surface with two states. Hovering anchors it to the
 * trigger; leaving with Shift held, or Shift+Enter, parks it as a draggable card
 * without unmounting, so the handover never drops a frame.
 *
 * Hover lifecycle, anchoring and Escape come from the shared tooltip primitives;
 * drag comes from `useDrag`, adopted by the surface rather than wrapped round it.
 *
 * @module lib/components/ui/detachableTooltip/DetachableTooltip
 * @version 3.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import draggableStyles from '@/lib/components/ui/draggable/draggable.module.scss';
import { useDrag } from '@/lib/components/ui/draggable/useDrag';
import { calculatePosition } from '@/lib/components/ui/tooltip/calculatePosition';
import tooltipStyles from '@/lib/components/ui/tooltip/tooltip.module.scss';
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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CardChrome } from './CardChrome';
import styles from './detachableTooltip.module.scss';

/** Length of the card's fade-out. Mirrors `detachableTooltip.module.scss`. */
const PANEL_EXIT_DURATION = 180;

/** Length of the glide onto a new call site. Outside this window a drag is instant. */
const PANEL_MOVE_DURATION = 320;

/**
 * Height of the card's chrome. The surface keeps the frame it had as a tooltip,
 * but the handle sits above the body, so the frame is raised by this much to
 * leave the text where it already was. Measured from the first card.
 */
let chromeOffset = 0;

/**
 * Props for {@link DetachableTooltip}.
 *
 * @interface DetachableTooltipProps
 * @property {ReactNode} content - Body rendered in both states
 * @property {ReactElement} children - Trigger element; receives the anchor ref and handlers
 * @property {string} [title] - Card title, shown in the handle and used as its accessible name
 * @property {TooltipPlacement} [placement] - Preferred placement while hovering
 * @property {number} [showDelay] - Delay before the tooltip opens, in ms
 * @property {number} [hideDelay] - Delay before the tooltip closes, in ms
 * @property {number} [maxWidth] - Maximum width while hovering, in px
 * @property {boolean} [disabled] - When true, neither hover nor park happens
 * @property {string} [className] - Extra class for the surface while hovering
 * @property {string} [panelClassName] - Extra class for the surface while parked
 * @property {string} [id] - Id used for the ARIA relationship
 * @property {string} [closeLabel] - Accessible name for the card's close control
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
 * Hover surface that becomes a draggable card in place.
 *
 * The trigger is cloned, not wrapped, so no layout box lands in running prose.
 *
 * @param {DetachableTooltipProps} props - Component props
 * @returns {React.ReactElement} The trigger plus the floating surface
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
  const [parked, setParked] = useState(false);
  const [closing, setClosing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [frame, setFrame] = useState({ x: 0, y: 0, width: 0 });

  const layerRef = useRef<HTMLDivElement>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { showPortal, exiting, show, hide, hideNow } = useTooltipVisibility({
    showDelay,
    hideDelay,
    disabled,
  });

  const { triggerRef, surfaceRef, anchorName, actualPlacement, anchorId } =
    useTooltipAnchor(placement, showPortal && !parked);

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

  const tooltipId = id || `detachable-${anchorId}`;
  const visible = showPortal || parked;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(exitTimer.current);
      clearTimeout(moveTimer.current);
    },
    [],
  );

  /**
   * Freezes the surface where it stands and switches it to the parked state.
   * The element is not replaced, so nothing unmounts and nothing fades in.
   *
   * @returns {boolean} Whether the surface parked
   */
  const park = useCallback((): boolean => {
    const surface = surfaceRef.current;
    if (!surface) return false;

    const rect = surface.getBoundingClientRect();
    clearTimeout(exitTimer.current);
    setClosing(false);
    setFrame({
      x: Math.round(rect.left),
      y: Math.round(rect.top) - chromeOffset,
      width: Math.round(rect.width),
    });
    setParked(true);
    hideNow();
    return true;
  }, [hideNow, surfaceRef]);

  /**
   * Glides a parked card to where a tooltip on this trigger would sit.
   *
   * @returns {boolean} Whether a glide started
   */
  const glideToTrigger = useCallback((): boolean => {
    const trigger = triggerRef.current;
    const surface = surfaceRef.current;
    if (!trigger || !surface) return false;

    const { x, y } = calculatePosition(
      trigger.getBoundingClientRect(),
      surface.getBoundingClientRect(),
      placement,
    );

    clearTimeout(moveTimer.current);
    setMoving(true);
    moveTimer.current = setTimeout(() => setMoving(false), PANEL_MOVE_DURATION);
    setFrame((current) => ({ ...current, x: Math.round(x), y: Math.round(y) }));
    return true;
  }, [placement, surfaceRef, triggerRef]);

  /**
   * Closes the tooltip, parking it when Shift is held.
   *
   * @param {ReactMouseEvent} event - Pointer leave event from the trigger
   */
  const handleLeave = useCallback(
    (event: ReactMouseEvent) => {
      if (event.shiftKey) {
        if (parked && glideToTrigger()) return;
        if (showPortal && park()) return;
      }
      hide();
    },
    [glideToTrigger, hide, park, parked, showPortal],
  );

  /**
   * Parks or glides from the keyboard, mirroring the pointer gesture.
   *
   * @param {ReactKeyboardEvent} event - Key event from the trigger
   */
  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (event.key !== 'Enter' || !event.shiftKey || disabled) return;

      event.preventDefault();
      if (parked) {
        glideToTrigger();
        return;
      }
      if (showPortal) park();
    },
    [disabled, glideToTrigger, park, parked, showPortal],
  );

  /** Fades the card out, then drops it. */
  const handleClose = useCallback(() => {
    setClosing(true);
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => {
      setParked(false);
      setClosing(false);
    }, PANEL_EXIT_DURATION);
  }, []);

  /**
   * Clears the anchoring transform and corrects the chrome offset, both before
   * paint, so the surface never shows a frame at the anchored position.
   */
  useLayoutEffect(() => {
    if (!parked) return;

    const surface = surfaceRef.current;
    if (surface) surface.style.transform = '';

    const handle = layerRef.current?.querySelector(
      '[role="separator"][aria-orientation="horizontal"]',
    );
    const height = handle
      ? Math.round(handle.getBoundingClientRect().height)
      : 0;

    if (height && height !== chromeOffset) {
      const delta = height - chromeOffset;
      chromeOffset = height;
      setFrame((current) => ({ ...current, y: current.y - delta }));
    }
  }, [parked, surfaceRef]);

  useEscapeDismiss(showPortal && !parked, hideNow);
  useEscapeDismiss(parked && !closing, handleClose);

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
    onMouseEnter: parked ? undefined : show,
    onMouseLeave: handleLeave,
    onFocus: parked ? undefined : show,
    onBlur: hide,
    onKeyDown: handleKeyDown,
    'aria-describedby': showPortal && !parked ? tooltipId : undefined,
  });

  const surfaceClass = parked
    ? [
        styles.panel,
        moving ? styles.moving : '',
        closing ? styles.closing : '',
        isDragging ? draggableStyles.isDragging : '',
        panelClassName,
      ]
        .filter(Boolean)
        .join(' ')
    : `${tooltipStyles.tooltip} ${tooltipStyles[actualPlacement]} ${exiting ? tooltipStyles.tooltipExiting : ''} ${className}`;

  const surfaceStyle: CSSProperties = parked
    ? {
        left: position.x,
        top: position.y,
        width: size?.width ?? frame.width,
        ...(size ? { height: size.height } : {}),
      }
    : ({ maxWidth, positionAnchor: anchorName } as CSSProperties);

  return (
    <>
      {trigger}
      {visible &&
        createPortal(
          <div className={styles.layer} ref={layerRef}>
            <div
              ref={surfaceRef}
              id={parked ? undefined : tooltipId}
              role={parked ? 'region' : 'tooltip'}
              aria-label={parked ? title : undefined}
              className={surfaceClass}
              style={surfaceStyle}>
              {parked ? (
                <CardChrome
                  dragHandleProps={dragHandleProps}
                  resizeHandleProps={resizeHandleProps}
                  onClose={handleClose}
                  title={title}
                  closeLabel={closeLabel}>
                  {content}
                </CardChrome>
              ) : (
                <div>{content}</div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default DetachableTooltip;
