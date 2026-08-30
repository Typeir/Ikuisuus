/**
 * @fileoverview Tooltip Component
 * @description Accessible tooltip with hover/focus activation, delay, and placement options.
 *
 * @module tooltip
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { HelpGlyph } from '@/lib/components/ui/helpGlyph';
import {
  Children,
  cloneElement,
  isValidElement,
  memo,
  ReactElement,
  ReactNode,
  type CSSProperties,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './tooltip.module.scss';
import { useEscapeDismiss } from './useEscapeDismiss';
import { useTooltipAnchor, type TooltipPlacement } from './useTooltipAnchor';
import { useTooltipVisibility } from './useTooltipVisibility';

export type { TooltipPlacement } from './useTooltipAnchor';

/**
 * @interface TooltipProps
 * Configuration for Tooltip component
 * @property {ReactNode} content - Tooltip content (text or ReactNode)
 * @property {TooltipPlacement} [placement='top'] - Placement preference (will flip if insufficient space)
 * @property {number} [showDelay=200] - Delay before showing tooltip in ms
 * @property {number} [hideDelay=100] - Grace period before the exit starts, in ms.
 * Long enough to cross the gap onto the surface, which holds itself open.
 * @property {number} [maxWidth=300] - Maximum width of tooltip in px
 * @property {boolean} [disabled=false] - Whether tooltip is disabled
 * @property {ReactElement} children - Trigger element (must accept ref and event handlers)
 * @property {string} [className] - Custom class for tooltip content
 * @property {boolean} [showArrow=true] - Whether to show arrow pointing to trigger
 * @property {string} [id] - ID for ARIA relationship
 * @property {boolean} [clickable=false] - When true, adds help icon and enables click handler
 * @property {() => void} [onItemClick] - Callback when trigger is clicked in clickable mode
 * @property {boolean} [showClickIcon=true] - When clickable, whether to show the rhombus `?` glyph (default true)
 * @property {boolean} [inline=false] - When true, attaches handlers directly to child via cloneElement
 *   instead of wrapping in a span. Use for absolutely-positioned triggers.
 * @property {boolean} [forceVisible=false] - When true, tooltip is shown regardless of hover state
 */
export interface TooltipProps {
  content: ReactNode;
  placement?: TooltipPlacement;
  showDelay?: number;
  hideDelay?: number;
  maxWidth?: number;
  disabled?: boolean;
  children: ReactElement;
  className?: string;
  showArrow?: boolean;
  id?: string;
  clickable?: boolean;
  onItemClick?: () => void;
  showClickIcon?: boolean;
  inline?: boolean;
  forceVisible?: boolean;
}

/**
 * Accessible tooltip component with hover/focus activation.
 *
 * @component
 * @param {TooltipProps} props - Configuration for tooltip behavior
 * @property {ReactNode} props.content - Tooltip content to display
 * @property {ReactElement} props.children - Trigger element (must accept ref and event handlers)
 * @example
 * ```tsx
 * <Tooltip content="This is helpful information" placement="top">
 *   <button>Hover me</button>
 * </Tooltip>
 * ```
 */
export const Tooltip = memo(function Tooltip({
  content,
  placement = 'top',
  showDelay = 200,
  hideDelay = 100,
  maxWidth = 250,
  disabled = false,
  children,
  className = '',
  showArrow = true,
  id,
  clickable = false,
  onItemClick,
  showClickIcon = true,
  inline = false,
  forceVisible = false,
}: TooltipProps) {
  const [isMounted, setIsMounted] = useState(false);

  const { showPortal, exiting, show, hide, showNow, hideNow } =
    useTooltipVisibility({
      showDelay,
      hideDelay,
      disabled,
    });

  const {
    triggerRef,
    surfaceRef,
    anchorName,
    actualPlacement,
    anchorId,
    reposition,
  } = useTooltipAnchor(placement, showPortal || forceVisible);

  const tooltipId = id || `tooltip-${anchorId}`;

  /** Track client-side mounting for SSR compatibility */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Escape dismisses the tooltip without moving the pointer, which content
   * shown on hover or focus has to allow (WCAG 2.1 SC 1.4.13). A pinned
   * tooltip is the caller's to close, so it opts out.
   */
  useEscapeDismiss(showPortal && !forceVisible, hideNow);

  /** When forceVisible flips true, show instantly. */
  useEffect(() => {
    if (forceVisible) {
      showNow();
      reposition();
    }
  }, [forceVisible, showNow, reposition]);

  if (!isMounted || !content) {
    return children;
  }

  const child = Children.only(children);
  if (!isValidElement(child)) {
    return children;
  }

  const handleClick = () => {
    if (clickable && onItemClick) {
      onItemClick();
    }
  };

  const surface = (
    <div
      ref={surfaceRef}
      id={tooltipId}
      role='tooltip'
      className={`${styles.tooltip} ${styles[actualPlacement]} ${exiting ? styles.tooltipExiting : ''} ${className}`}
      style={{ maxWidth, positionAnchor: anchorName } as CSSProperties}
      onMouseEnter={show}
      onMouseLeave={hide}>
      {content}
      {showArrow && <div className={styles.arrow} />}
    </div>
  );

  if (inline) {
    const cloned = cloneElement(Children.only(children) as ReactElement<any>, {
      ref: triggerRef,
      style: {
        ...((child.props as { style?: CSSProperties }).style ?? {}),
        anchorName,
      } as CSSProperties,
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide,
      'aria-describedby': showPortal ? tooltipId : undefined,
    });

    return (
      <>
        {cloned}
        {showPortal && createPortal(surface, document.body)}
      </>
    );
  }

  let triggerClassName = '';
  if (clickable) {
    triggerClassName = styles.triggerClickable;
  } else if (showClickIcon) {
    triggerClassName = styles.triggerWithIcon;
  }

  return (
    <>
      <span
        ref={triggerRef as React.RefObject<HTMLSpanElement>}
        onMouseEnter={() => show()}
        onMouseLeave={() => hide()}
        onFocus={() => show()}
        onBlur={() => hide()}
        onClick={handleClick}
        style={{ display: 'inline-flex', anchorName } as CSSProperties}
        className={triggerClassName}
        aria-describedby={showPortal ? tooltipId : undefined}>
        {Children.only(children)}
        {showClickIcon && <HelpGlyph className={styles.clickIcon} />}
      </span>
      {showPortal && createPortal(surface, document.body)}
    </>
  );
});

export { withTooltip } from './withTooltip';

/**
 * Simple wrapper that just applies tooltip to children without modifying props
 *
 * @example
 * ```tsx
 * <WithTooltip content="Helpful info">
 *   <span>ℹ️</span>
 * </WithTooltip>
 * ```
 */
export const WithTooltip = Tooltip;

/**
 * Re-export of Tooltip component as default for convenient imports.
 *
 * @see {@link Tooltip} for configuration options and usage examples
 */
export default Tooltip;
