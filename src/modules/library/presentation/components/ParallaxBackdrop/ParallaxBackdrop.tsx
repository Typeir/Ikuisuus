/**
 * @fileoverview Fixed full-viewport image that drifts with scroll.
 *
 * @module modules/library/presentation/components/ParallaxBackdrop/ParallaxBackdrop
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import Image from 'next/image';
import { useViewportSignal } from '@/lib/hooks/motion';
import React, { useRef } from 'react';
import styles from './ParallaxBackdrop.module.scss';

/**
 * Image scale, keep equal to the `.image` scale in the stylesheet.
 *
 * @constant SCALE
 * @type {number}
 */
const SCALE = 1.06;

/**
 * Fraction of the viewport height the scale leaves past each edge.
 *
 * @constant OVERSCAN
 * @type {number}
 */
const OVERSCAN = (SCALE - 1) / 2;

/**
 * Clamps a value to [min, max].
 *
 * @function clamp
 * @param {number} value - Input.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number} The bounded value.
 */
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Props for {@link ParallaxBackdrop}.
 *
 * @interface ParallaxBackdropProps
 * @property {string} src - Image URL.
 * @property {string} [alt] - Alt text, used only when ariaHidden is false.
 * @property {number} [intensity=0.1] - Pixels of shift per pixel scrolled.
 * @property {number} [maxShiftPx] - Shift clamp in px, defaults to the overscan.
 * @property {number} [opacity=1] - Image opacity in [0, 1].
 * @property {number} [zIndex] - CSS z-index override for the container.
 * @property {boolean} [ariaHidden=true] - Hides the image from assistive tech.
 * @property {string} [className] - Extra classes for the container.
 */
export interface ParallaxBackdropProps {
  src: string;
  alt?: string;
  intensity?: number;
  maxShiftPx?: number;
  opacity?: number;
  zIndex?: number;
  ariaHidden?: boolean;
  className?: string;
}

/**
 * Fixed full-viewport image behind the content, shifted by scroll within the overscan.
 *
 * @component
 * @param {ParallaxBackdropProps} props - Component props.
 * @param {string} props.src - Image URL.
 * @param {string} [props.alt=''] - Alt text, used only when ariaHidden is false.
 * @param {number} [props.intensity=0.1] - Pixels of shift per pixel scrolled.
 * @param {number} [props.maxShiftPx] - Shift clamp in px, defaults to the overscan.
 * @param {number} [props.opacity=1] - Image opacity in [0, 1].
 * @param {number} [props.zIndex] - CSS z-index override for the container.
 * @param {boolean} [props.ariaHidden=true] - Hides the image from assistive tech.
 * @param {string} [props.className] - Extra classes for the container.
 * @returns {JSX.Element} The backdrop.
 *
 * @example
 * <ParallaxBackdrop src="/library/images/fog.webp" opacity={0.15} />
 */
export const ParallaxBackdrop: React.FC<ParallaxBackdropProps> = ({
  src,
  alt = '',
  intensity = 0.1,
  maxShiftPx,
  opacity = 1,
  zIndex,
  ariaHidden = true,
  className,
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lastShift = useRef<number | null>(null);

  useViewportSignal(() => {
    const img = imgRef.current;
    if (!img) return;
    const limit = maxShiftPx ?? Math.floor(window.innerHeight * OVERSCAN);
    const shift =
      Math.round(clamp(-window.scrollY * intensity, -limit, limit) * 10) / 10;
    if (shift === lastShift.current) return;
    lastShift.current = shift;
    img.style.transform = `translate3d(0, ${shift}px, 0) scale(${SCALE})`;
  });

  return (
    <div
      aria-hidden={ariaHidden}
      className={`${styles.backdrop} ${className ?? ''}`}
      style={{ '--backdrop-opacity': opacity, zIndex } as React.CSSProperties}>
      <Image
        className={styles.image}
        ref={imgRef}
        src={src}
        alt={ariaHidden ? '' : alt}
        sizes='100vw'
        fetchPriority='low'
        fill
        draggable={false}
      />
    </div>
  );
};

export default ParallaxBackdrop;
