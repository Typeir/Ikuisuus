/**
 * @fileoverview Tooltip position calculation utility.
 * Computes absolute screen-space coordinates for a tooltip relative to
 * a trigger element, with viewport-aware flip logic.
 *
 * @module lib/components/ui/tooltip/calculatePosition
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * Placement relative to the trigger. Flips to the opposite side when short of room.
 *
 * @typedef {'top' | 'bottom' | 'left' | 'right'} TooltipPlacement
 */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export function calculatePosition(
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
