/**
 * @fileoverview Fixed-position flashlight reveal, scoped to its container.
 * @description Renders the same reveal layer as {@link FlashlightLayer} with
 * the aperture parked at one corner instead of following the pointer. The
 * pattern, mask, glow and scanlines come from the shared stylesheet, so the
 * two stay identical by construction rather than by matching values.
 *
 * @module lib/components/flashlight/StaticFlashlight
 * @author Typeir
 * @version 1.0.0
 * @since 9.0.0
 */

'use client';

import DotMatrixBackground from '@/lib/components/dotMatrix/DotMatrixBackground';
import dotStyles from '@/lib/components/dotMatrix/dotMatrix.module.scss';
import React from 'react';

/**
 * Corner the aperture is parked on.
 *
 * @typedef {'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'} FlashlightCorner
 */
export type FlashlightCorner =
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right';

/**
 * Props for {@link StaticFlashlight}.
 *
 * @interface StaticFlashlightProps
 * @property {number} [coverage=0.5] - Fraction of the container the lit disc should cover
 * @property {number} [radius] - Explicit radius in px; overrides `coverage`
 * @property {FlashlightCorner} [corner='bottom-left'] - Corner the aperture sits on
 */
export interface StaticFlashlightProps {
  coverage?: number;
  radius?: number;
  corner?: FlashlightCorner;
}

/**
 * Radius whose quarter-disc covers `coverage` of a `width` x `height` box.
 *
 * The aperture sits on the bottom-left corner, so one quadrant of the circle
 * falls inside the container: `pi * r^2 / 4 = coverage * w * h`.
 *
 * @function cornerRadiusForCoverage
 * @param {number} width - Container width in px
 * @param {number} height - Container height in px
 * @param {number} coverage - Target fraction of the container area
 * @returns {number} Radius in px
 */
export function cornerRadiusForCoverage(
  width: number,
  height: number,
  coverage: number,
): number {
  return Math.sqrt((4 * coverage * width * height) / Math.PI);
}

/**
 * Renders a reveal layer parked at the container's bottom-left corner.
 *
 * @component
 * @param {StaticFlashlightProps} props - Component props
 * @param {number} [props.coverage=0.5] - Fraction of the container the lit disc covers
 * @param {number} [props.radius] - Explicit radius in px; overrides `coverage`
 * @returns {React.ReactElement} The scoped reveal layer
 */
export default function StaticFlashlight({
  coverage = 0.5,
  radius,
  corner = 'bottom-left',
}: StaticFlashlightProps): React.ReactElement {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [box, setBox] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const resolvedRadius =
    radius ?? cornerRadiusForCoverage(box.width, box.height, coverage);
  const x = corner.endsWith('right') ? box.width : 0;
  const y = corner.startsWith('bottom') ? box.height : 0;

  return (
    <DotMatrixBackground
      ref={ref}
      className={dotStyles.scoped}
      radius={resolvedRadius}
      hidden={resolvedRadius <= 0}
      style={
        {
          '--mouse-px': `${x}px`,
          '--mouse-py': `${y}px`,
        } as React.CSSProperties
      }
    />
  );
}
