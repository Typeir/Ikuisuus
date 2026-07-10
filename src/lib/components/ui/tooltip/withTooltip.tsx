/**
 * @fileoverview withTooltip HOC
 * @module lib/components/ui/tooltip/withTooltip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { ComponentType, ReactNode } from 'react';
import { Tooltip, type TooltipPlacement } from './tooltip';

export function withTooltip<P extends object>(
  WrappedComponent: ComponentType<P>,
): ComponentType<P & { tooltip?: ReactNode; tooltipPlacement?: TooltipPlacement }> {
  const C = ({ tooltip, tooltipPlacement = 'top', ...props }: P & { tooltip?: ReactNode; tooltipPlacement?: TooltipPlacement }) => {
    return <Tooltip content={tooltip} placement={tooltipPlacement}><WrappedComponent {...(props as P)} /></Tooltip>;
  };
  C.displayName = 'WithTooltip(' + (WrappedComponent.displayName || WrappedComponent.name || 'Component') + ')';
  return C;
}
