/**
 * @fileoverview Tooltip MDX Component
 * @description MDX-friendly wrapper around the UI Tooltip component.
 * Maintains two-children API (trigger, content) for seamless MDX usage.
 *
 * @module lib/components/mdx/tooltip/tooltip
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Tooltip as UITooltip } from '@/lib/components/ui/tooltip';
import React, { ReactNode } from 'react';

/**
 * Props for the Tooltip MDX component.
 *
 * @interface TooltipProps
 * @property {ReactNode} children - Two children: trigger content first, tooltip content second
 */
export interface TooltipProps {
  children: ReactNode;
}

/**
 * Tooltip component for MDX content.
 * Accepts two children: trigger element and tooltip content.
 * Always displays with arrow and icon by default.
 *
 * @component
 * @param {TooltipProps} props - Component props
 * @param {ReactNode} props.children - Trigger and tooltip content in order
 * @returns {JSX.Element} Tooltip trigger and floating content
 *
 * @example
 * ```tsx
 * <Tooltip>
 *   <span>Hover me</span>
 *   <span>This is the tooltip content</span>
 * </Tooltip>
 * ```
 */
const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  const content = React.Children.toArray(children).filter((node) => {
    if (typeof node === 'string') {
      return node.trim().length > 0;
    }

    return true;
  });

  const triggerNode = content[0];
  const tooltipContent = content[1];

  if (!triggerNode || !tooltipContent) {
    return <span>{children}</span>;
  }

  return (
    <UITooltip
      content={tooltipContent}
      placement='top'
      showArrow
      showClickIcon={true}
      clickable={true}>
      <span>{triggerNode}</span>
    </UITooltip>
  );
};

export default Tooltip;
