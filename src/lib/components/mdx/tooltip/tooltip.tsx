/**
 * @fileoverview Module for src/lib/components/mdx/tooltip/tooltip.tsx
 * @module src/lib/components/mdx/tooltip/tooltip
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
'use client';

/**
 * @fileoverview Tooltip MDX Component
 * @description A compact inline tooltip for dense table content in MDX files.
 *
 * @module Tooltip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CircleHelp } from 'lucide-react';
import React, { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './tooltip.module.scss';

/**
 * Props for the Tooltip component.
 *
 * @property {ReactNode} children - Two children: trigger content first, tooltip content second
 */
export interface TooltipProps {
  children: ReactNode;
}

/**
 * Absolute viewport coordinates for tooltip placement.
 *
 * @property {number} top - Viewport Y coordinate
 * @property {number} left - Viewport X coordinate
 * @property {boolean} above - Whether tooltip is rendered above trigger
 */
interface TooltipPosition {
  top: number;
  left: number;
  above: boolean;
}

/**
 * Calculates viewport-safe tooltip coordinates for the current trigger rectangle.
 *
 * @param {DOMRect} triggerRect - Trigger rectangle from getBoundingClientRect
 * @param {DOMRect} bubbleRect - Tooltip bubble rectangle from getBoundingClientRect
 * @returns {TooltipPosition} Placement coordinates and orientation
 */
function calculatePosition(
  triggerRect: DOMRect,
  bubbleRect: DOMRect,
): TooltipPosition {
  const offset = 8;
  const edgePadding = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const centeredLeft = triggerRect.left + triggerRect.width / 2;
  const maxLeft = viewportWidth - bubbleRect.width / 2 - edgePadding;
  const minLeft = bubbleRect.width / 2 + edgePadding;
  const left = Math.max(minLeft, Math.min(centeredLeft, maxLeft));

  const fitsAbove = triggerRect.top >= bubbleRect.height + offset + edgePadding;
  const top = fitsAbove
    ? triggerRect.top - offset
    : Math.min(
        viewportHeight - edgePadding,
        triggerRect.bottom + bubbleRect.height + offset,
      );

  return {
    top,
    left,
    above: fitsAbove,
  };
}

/**
 * @component Tooltip
 * @description Renders an inline label with an accessible hover/focus tooltip.
 *
 * @param {TooltipProps} props - Tooltip component props
 * @param {ReactNode} props.children - Trigger and tooltip content in order
 * @returns {JSX.Element} Tooltip trigger and floating content
 */
const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );
  const content = React.Children.toArray(children).filter((node) => {
    if (typeof node === 'string') {
      return node.trim().length > 0;
    }

    return true;
  });

  const triggerNode = content[0];
  const bubbleNode = content[1];

  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current || !bubbleRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const bubbleRect = bubbleRef.current.getBoundingClientRect();
      setPosition(calculatePosition(triggerRect, bubbleRect));
    };

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  if (!triggerNode || !bubbleNode) {
    return <span className={styles.wrapper}>{children}</span>;
  }

  return (
    <span className={styles.wrapper}>
      <span
        ref={triggerRef}
        className={styles.trigger}
        tabIndex={0}
        aria-describedby={tooltipId}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}>
        <span>{triggerNode}</span>
        <CircleHelp className={styles.icon} size={12} aria-hidden='true' />
      </span>
      {portalContainer &&
        createPortal(
          <span
            ref={bubbleRef}
            id={tooltipId}
            role='tooltip'
            className={styles.bubble}
            data-open={isOpen ? 'true' : 'false'}
            data-side={position?.above ? 'top' : 'bottom'}
            style={
              position
                ? {
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                  }
                : undefined
            }>
            {bubbleNode}
          </span>,
          portalContainer,
        )}
    </span>
  );
};

export default Tooltip;
