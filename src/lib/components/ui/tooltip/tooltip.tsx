/**
 * @fileoverview Tooltip Component
 * @description Accessible tooltip with hover/focus activation, delay, and placement options.
 *
 * @module tooltip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { CircleHelp } from 'lucide-react';
import {
  Children,
  cloneElement,
  isValidElement,
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { calculatePosition } from './calculatePosition';
import styles from './tooltip.module.scss';

/**
 * Allowed tooltip placement values relative to the trigger element.
 * The tooltip will auto-flip to the opposite placement if there is
 * insufficient viewport space.
 *
 * @typedef {'top' | 'bottom' | 'left' | 'right'} TooltipPlacement
 */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * @interface TooltipProps
 * Configuration for Tooltip component
 * @property {ReactNode} content - Tooltip content (text or ReactNode)
 * @property {TooltipPlacement} [placement='top'] - Placement preference (will flip if insufficient space)
 * @property {number} [showDelay=0] - Delay before showing tooltip in ms
 * @property {number} [hideDelay=100] - Delay before hiding tooltip in ms
 * @property {number} [maxWidth=300] - Maximum width of tooltip in px
 * @property {boolean} [disabled=false] - Whether tooltip is disabled
 * @property {ReactElement} children - Trigger element (must accept ref and event handlers)
 * @property {string} [className] - Custom class for tooltip content
 * @property {boolean} [showArrow=true] - Whether to show arrow pointing to trigger
 * @property {string} [id] - ID for ARIA relationship
 * @property {boolean} [clickable=false] - When true, adds help icon and enables click handler
 * @property {() => void} [onItemClick] - Callback when trigger is clicked in clickable mode
 * @property {boolean} [showClickIcon=true] - When clickable, whether to show CircleHelp icon (default true)
 * @property {boolean} [inline=false] - When true, attaches handlers directly to child via cloneElement
 *   instead of wrapping in a span. Use for absolutely-positioned triggers.
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
  /** When true, tooltip is shown regardless of hover state. */
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
  hideDelay = 0,
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
  const [isVisible, setIsVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  const [isMounted, setIsMounted] = useState(false);

  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const exitingRef = useRef(false);
  const exitTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const positionedRef = useRef(false);

  /** Duration of the CSS exit animation — must match SCSS. */
  const EXIT_DURATION = 150;

  const reactId = useId();
  const tooltipId = id || `tooltip-${reactId}`;

  /** Recalculate tooltip position based on trigger element */
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    const {
      x,
      y,
      actualPlacement: newPlacement,
    } = calculatePosition(triggerRect, tooltipRect, placement);

    setPosition({ x, y });
    setActualPlacement(newPlacement);
    positionedRef.current = true;
  }, [placement]);

  /** Show tooltip after delay. Cancels any in-progress exit. */
  const show = useCallback(() => {
    if (disabled) return;

    clearTimeout(hideTimeoutRef.current);
    if (exitingRef.current) {
      clearTimeout(exitTimerRef.current);
      setExiting(false);
      exitingRef.current = false;
      return;
    }
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, showDelay);
  }, [disabled, showDelay]);

  /** Hide tooltip after delay, with exit animation before unmount. */
  const hide = useCallback(() => {
    clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setExiting(true);
      exitingRef.current = true;
    }, hideDelay);
  }, [hideDelay]);

  /** When exit animation completes, actually unmount the tooltip. */
  useEffect(() => {
    if (exiting) {
      exitTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setExiting(false);
        exitingRef.current = false;
        positionedRef.current = false;
      }, EXIT_DURATION);
      return () => clearTimeout(exitTimerRef.current);
    }
  }, [exiting]);

  /** Position synchronously on first render to prevent flicker */
  useLayoutEffect(() => {
    if (isVisible || forceVisible) {
      updatePosition();
    }
  }, [isVisible, forceVisible, updatePosition]);

  /** Reposition on scroll and resize */
  useEffect(() => {
    if (!isVisible && !forceVisible && !exiting) return;

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, forceVisible, exiting, updatePosition]);

  /** Cleanup timeouts on unmount */
  useEffect(() => {
    return () => {
      clearTimeout(showTimeoutRef.current);
      clearTimeout(hideTimeoutRef.current);
      clearTimeout(exitTimerRef.current);
    };
  }, []);

  /** Track client-side mounting for SSR compatibility */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /** When forceVisible flips true, show instantly. When false, trigger exit. */
  useEffect(() => {
    if (forceVisible) {
      clearTimeout(hideTimeoutRef.current);
      if (exitingRef.current) {
        clearTimeout(exitTimerRef.current);
        setExiting(false);
        exitingRef.current = false;
      }
      setIsVisible(true);
      positionedRef.current = false;
    }
  }, [forceVisible]);

  const showPortal = isVisible || exiting;

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

  if (inline) {
    const cloned = cloneElement(Children.only(children) as ReactElement<any>, {
      ref: triggerRef,
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide,
      'aria-describedby': showPortal ? tooltipId : undefined,
    });

    return (
      <>
        {cloned}
        {showPortal &&
          createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role='tooltip'
              className={`${styles.tooltip} ${styles[actualPlacement]} ${exiting ? styles.tooltipExiting : ''} ${className}`}
              style={{
                left: position.x,
                top: position.y,
                maxWidth,
                visibility: positionedRef.current ? 'visible' : 'hidden',
                opacity: position ? undefined : 0,
              }}>
              {content}
              {showArrow && <div className={styles.arrow} />}
            </div>,
            document.body,
          )}
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
        style={{ display: 'inline-flex' }}
        className={triggerClassName}
        aria-describedby={showPortal ? tooltipId : undefined}>
        {Children.only(children)}
        {showClickIcon && (
          <CircleHelp
            size={14}
            className={styles.clickIcon}
            aria-hidden='true'
          />
        )}
      </span>
      {showPortal &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role='tooltip'
            className={`${styles.tooltip} ${styles[actualPlacement]} ${exiting ? styles.tooltipExiting : ''} ${className}`}
            style={{
              left: position.x,
              top: position.y,
              maxWidth,
              visibility: positionedRef.current ? 'visible' : 'hidden',
              opacity: position ? undefined : 0,
            }}>
            {content}
            {showArrow && <div className={styles.arrow} />}
          </div>,
          document.body,
        )}
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
