/**
 * @file parallaxBackdrop.tsx
 * @description
 * Fixed, uninteractable, full-viewport parallax background component.
 * Renders an image as a background layer that shifts vertically with scroll.
 *
 * @module parallaxBackdrop
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @fileoverview Module for src/lib/components/mdx/parallaxBackdrop/parallaxBackdrop.tsx
 */

'use client';

import Image from 'next/image';
import React, { useEffect, useMemo, useRef } from 'react';
import styles from './ParallaxBackdrop.module.scss';

/**
 * @interface ParallaxBackdropProps
 * @description
 * Props for {@link ParallaxBackdrop}.
 *
 * @property {string} src - The source URL of the backdrop image.
 * @property {string} [alt] - Alternative text for the image (if not aria-hidden).
 * @property {number} [intensity=0.05] - Parallax intensity factor (higher = more movement).
 * @property {number} [maxShiftPx=48] - Maximum vertical shift in pixels.
 * @property {number} [opacity=1] - Opacity of the backdrop image (0 to 1).
 * @property {number} [blurPx=0] - CSS blur radius in pixels.
 * @property {number} [zIndex] - Explicit CSS z-index override. When omitted, stacking
 * is controlled by the stylesheet via `var(--embed-z-index, -1)`.
 * @property {boolean} [ariaHidden=true] - Whether to hide the image from assistive tech.
 * @property {string} [className] - Additional CSS classes for the container div.
 */
export interface ParallaxBackdropProps {
  src: string;
  alt?: string;
  intensity?: number;
  maxShiftPx?: number;
  opacity?: number;
  blurPx?: number;
  zIndex?: number;
  ariaHidden?: boolean;
  className?: string;
}

/**
 * @function ParallaxBackdrop
 * @description
 * Renders a fixed, full-viewport image behind all content, shifted vertically
 * by scroll position and clamped to {@link ParallaxBackdropProps.maxShiftPx}.
 * Non-interactive (`pointer-events: none`), out of document flow, covering the
 * viewport (100vw / 100vh). Scroll updates are throttled via
 * `requestAnimationFrame`.
 *
 * @param {ParallaxBackdropProps} props
 * @param {string} props.src - The source URL of the backdrop image.
 * @param {string} [props.alt=""] - Alternative text for the image (if not aria-hidden).
 * @param {number} [props.intensity=0.05] - Parallax intensity factor (higher = more movement).
 * @param {number} [props.maxShiftPx=48] - Maximum vertical shift in pixels.
 * @param {number} [props.opacity=1] - Opacity of the backdrop image (0 to 1).
 * @param {number} [props.blurPx=0] - CSS blur radius in pixels.
 * @param {number} [props.zIndex] - Explicit CSS z-index override. Defaults to the
 * stylesheet's `var(--embed-z-index, -1)` when omitted.
 * @param {boolean} [props.ariaHidden=true] - Whether to hide the image from assistive tech.
 * @param {string} [props.className] - Additional CSS classes for the container div.
 *
 * @returns {JSX.Element} The ParallaxBackdrop component.
 *
 * @example
 * <ParallaxBackdrop
 *   src="/images/fog.webp"
 *   intensity={0.04}
 *   opacity={0.7}
 * />
 */
export const ParallaxBackdrop: React.FC<ParallaxBackdropProps> = ({
  src,
  alt = '',
  intensity = 0.1,
  maxShiftPx = Infinity,
  opacity = 1,
  blurPx = 0,
  zIndex,
  ariaHidden = true,
  className,
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const clamp = useMemo(
    () => (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value)),
    [],
  );

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const update = () => {
      const scrollY = window.scrollY || 0;
      const shift = clamp(-scrollY * intensity, -maxShiftPx, maxShiftPx);
      img.style.transform = `translate3d(0, ${shift}px, 0) scale(1.06)`;
      rafRef.current = null;
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [clamp, intensity, maxShiftPx]);

  return (
    <div
      aria-hidden={ariaHidden}
      className={`${styles.backdrop} ${className ?? ''}`}
      style={{
        opacity,
        zIndex,
      }}>
      <Image
        className={styles.image}
        ref={imgRef}
        src={src}
        alt={ariaHidden ? '' : alt}
        style={{ filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined }}
        unoptimized={true}
        priority
        fill
        draggable={false}
      />
    </div>
  );
};

export default ParallaxBackdrop;
