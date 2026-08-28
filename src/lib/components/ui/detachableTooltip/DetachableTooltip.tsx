/**
 * @fileoverview Detachable Tooltip
 * @description A hover tooltip that can be left behind. Leaving the trigger
 * with Shift held promotes the floating surface into a {@link Draggable} panel
 * pinned where the tooltip stood, closable through the panel's own controls.
 *
 * Hover behaviour is not reimplemented here: the open/close lifecycle comes
 * from `useTooltipVisibility` and the anchoring from `useTooltipAnchor`, the
 * same primitives the plain `Tooltip` runs on.
 *
 * @module lib/components/ui/detachableTooltip/DetachableTooltip
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { Draggable } from '@/lib/components/ui/draggable/Draggable';
import tooltipStyles from '@/lib/components/ui/tooltip/tooltip.module.scss';
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
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './detachableTooltip.module.scss';

/**
 * Width used for a detached panel when the hover surface could not be measured.
 *
 * @constant
 */
const FALLBACK_PANEL_WIDTH = 320;

/**
 * Where a detached panel opens, in viewport coordinates.
 *
 * @interface DetachedFrame
 * @property {number} x - Left offset
 * @property {number} y - Top offset
 * @property {number} width - Width inherited from the hover surface
 */
interface DetachedFrame {
  x: number;
  y: number;
  width: number;
}

/**
 * Props for {@link DetachableTooltip}.
 *
 * @interface DetachableTooltipProps
 * @property {ReactNode} content - Body rendered in the tooltip and in the detached panel
 * @property {ReactElement} children - Trigger element; receives the anchor ref and hover handlers
 * @property {string} [title] - Label shown in the detached panel's drag handle
 * @property {TooltipPlacement} [placement] - Preferred placement of the hover surface
 * @property {number} [showDelay] - Delay before the tooltip opens, in ms
 * @property {number} [hideDelay] - Delay before the tooltip closes, in ms
 * @property {number} [maxWidth] - Maximum width of the hover surface, in px
 * @property {boolean} [disabled] - When true, neither hover nor detach happens
 * @property {string} [className] - Extra class for the hover surface
 * @property {string} [panelClassName] - Extra class for the detached panel
 * @property {string} [id] - Id used for the ARIA relationship
 * @property {string} [closeLabel] - Accessible name for the panel's close control
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
 * Hover tooltip that survives the pointer leaving when Shift is held.
 *
 * The trigger is cloned rather than wrapped, so the component adds no layout
 * box to running prose.
 *
 * @param {DetachableTooltipProps} props - Component props
 * @returns {React.ReactElement} The trigger, plus the tooltip and panel portals
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
  const [detached, setDetached] = useState<DetachedFrame | null>(null);

  const { showPortal, exiting, show, hide, hideNow } = useTooltipVisibility({
    showDelay,
    hideDelay,
    disabled,
  });

  const { triggerRef, surfaceRef, anchorName, actualPlacement, anchorId } =
    useTooltipAnchor(placement, showPortal);

  const tooltipId = id || `detachable-${anchorId}`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Freezes the hover surface's current rect and hands it to a panel. Reading
   * the rect before the surface unmounts is what makes the panel appear exactly
   * where the tooltip stood.
   *
   * @returns {boolean} Whether a panel was opened
   */
  const detach = useCallback((): boolean => {
    const surface = surfaceRef.current;
    if (!surface) return false;

    const rect = surface.getBoundingClientRect();
    setDetached({
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width) || FALLBACK_PANEL_WIDTH,
    });
    hideNow();
    return true;
  }, [hideNow, surfaceRef]);

  /**
   * Closes the tooltip, promoting it to a panel when Shift is held.
   *
   * @param {ReactMouseEvent} event - Pointer leave event from the trigger
   */
  const handleLeave = useCallback(
    (event: ReactMouseEvent) => {
      if (event.shiftKey && showPortal && detach()) return;
      hide();
    },
    [detach, hide, showPortal],
  );

  /** Drops the panel. */
  const handleClose = useCallback(() => setDetached(null), []);

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
    onBlur: hide,
    'aria-describedby': showPortal ? tooltipId : undefined,
  });

  return (
    <>
      {trigger}
      {showPortal &&
        createPortal(
          <div
            ref={surfaceRef}
            id={tooltipId}
            role='tooltip'
            className={`${tooltipStyles.tooltip} ${tooltipStyles[actualPlacement]} ${exiting ? tooltipStyles.tooltipExiting : ''} ${className}`}
            style={{ maxWidth, positionAnchor: anchorName } as CSSProperties}>
            {content}
          </div>,
          document.body,
        )}
      {detached &&
        createPortal(
          <div className={styles.layer}>
            <Draggable
              className={`${styles.panel} ${panelClassName}`}
              handleLabel={title}
              initialPosition={{ x: detached.x, y: detached.y }}
              defaultWidth={detached.width}
              onClose={handleClose}
              closeLabel={closeLabel}
              resizable>
              <div className={styles.panelBody}>{content}</div>
            </Draggable>
          </div>,
          document.body,
        )}
    </>
  );
}

export default DetachableTooltip;
