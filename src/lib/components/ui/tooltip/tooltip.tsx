/**
 * @fileoverview Tooltip Component
 * @description Accessible tooltip with hover/focus activation, delay, and placement options.
 * Provides both a wrapper component and a curry-style HOC for easy integration.
 *
 * @module tooltip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import {
  Children,
  ComponentType,
  isValidElement,
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
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
}

/**
 * Calculates absolute tooltip position relative to a trigger element.
 * Adjusts for scroll offsets and flips placement when the tooltip would
 * overflow the viewport.
 *
 * @function calculatePosition
 * @param {DOMRect} triggerRect - Bounding rect of the trigger element
 * @param {DOMRect} tooltipRect - Bounding rect of the tooltip element
 * @param {TooltipPlacement} placement - Desired placement direction
 * @param {number} [offset=8] - Pixel gap between trigger and tooltip
 * @returns {{ x: number; y: number; actualPlacement: TooltipPlacement }} Computed position and resolved placement
 */
function calculatePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: TooltipPlacement,
  offset = 8,
): { x: number; y: number; actualPlacement: TooltipPlacement } {
  const { innerWidth, innerHeight } = window;

  let x = 0;
  let y = 0;
  let actualPlacement = placement;

  switch (placement) {
    case 'top':
      x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      y = triggerRect.top - tooltipRect.height - offset;
      break;
    case 'bottom':
      x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      y = triggerRect.bottom + offset;
      break;
    case 'left':
      x = triggerRect.left - tooltipRect.width - offset;
      y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      break;
    case 'right':
      x = triggerRect.right + offset;
      y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      break;
  }

  const viewportMargin = 8;

  if (placement === 'top' && y < viewportMargin) {
    y = triggerRect.bottom + offset;
    actualPlacement = 'bottom';
  } else if (
    placement === 'bottom' &&
    y + tooltipRect.height > innerHeight - viewportMargin
  ) {
    y = triggerRect.top - tooltipRect.height - offset;
    actualPlacement = 'top';
  } else if (placement === 'left' && x < viewportMargin) {
    x = triggerRect.right + offset;
    actualPlacement = 'right';
  } else if (
    placement === 'right' &&
    x + tooltipRect.width > innerWidth - viewportMargin
  ) {
    x = triggerRect.left - tooltipRect.width - offset;
    actualPlacement = 'left';
  }

  x = Math.max(
    viewportMargin,
    Math.min(x, innerWidth - tooltipRect.width - viewportMargin),
  );

  return { x, y, actualPlacement };
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
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  const [isMounted, setIsMounted] = useState(false);

  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  const tooltipId = id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;

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
  }, [placement]);

  /** Show tooltip after delay */
  const show = useCallback(() => {
    if (disabled) return;

    clearTimeout(hideTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, showDelay);
  }, [disabled, showDelay]);

  /** Hide tooltip after delay */
  const hide = useCallback(() => {
    clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, hideDelay);
  }, [hideDelay]);

  /** Position synchronously on first render to prevent flicker */
  useLayoutEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible, updatePosition]);

  /** Reposition on scroll and resize */
  useEffect(() => {
    if (!isVisible) return;

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, updatePosition]);

  /** Cleanup timeouts on unmount */
  useEffect(() => {
    return () => {
      clearTimeout(showTimeoutRef.current);
      clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  /** Track client-side mounting for SSR compatibility */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !content) {
    return children;
  }

  const child = Children.only(children);
  if (!isValidElement(child)) {
    return children;
  }

  return (
    <>
      <span
        ref={triggerRef as React.RefObject<HTMLSpanElement>}
        onMouseEnter={() => show()}
        onMouseLeave={() => hide()}
        onFocus={() => show()}
        onBlur={() => hide()}
        style={{ display: 'inline-flex' }}
        aria-describedby={isVisible ? tooltipId : undefined}>
        {child}
      </span>
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role='tooltip'
            className={`${styles.tooltip} ${styles[actualPlacement]} ${className}`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              maxWidth,
            }}>
            {content}
            {showArrow && <div className={styles.arrow} />}
          </div>,
          document.body,
        )}
    </>
  );
});

/**
 * HOC-style wrapper for adding tooltips to existing components
 *
 * @example
 * ```tsx
 * const ButtonWithTooltip = withTooltip(Button);
 * <ButtonWithTooltip tooltip="Click to submit" placement="top" onClick={handleClick}>
 *   Submit
 * </ButtonWithTooltip>
 * ```
 */
export function withTooltip<P extends object>(
  WrappedComponent: ComponentType<P>,
): ComponentType<
  P & { tooltip?: ReactNode; tooltipPlacement?: TooltipPlacement }
> {
  const WithTooltipComponent = ({
    tooltip,
    tooltipPlacement = 'top',
    ...props
  }: P & { tooltip?: ReactNode; tooltipPlacement?: TooltipPlacement }) => {
    if (!tooltip) {
      return <WrappedComponent {...(props as P)} />;
    }

    return (
      <Tooltip content={tooltip} placement={tooltipPlacement}>
        <WrappedComponent {...(props as P)} />
      </Tooltip>
    );
  };

  WithTooltipComponent.displayName = `WithTooltip(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithTooltipComponent;
}

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
