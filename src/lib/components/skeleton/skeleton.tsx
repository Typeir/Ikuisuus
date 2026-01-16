/**
 * @fileoverview Generic Skeleton Loader Component
 * @description SOLID-compliant skeleton component following Single Responsibility
 * and Open/Closed principles. Provides customizable loading placeholders.
 * 
 * @module Skeleton
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import styles from './skeleton.module.scss';

/**
 * Skeleton variant types
 */
export type SkeletonVariant = 'text' | 'title' | 'card' | 'button' | 'circle' | 'rectangle';

/**
 * Skeleton component props
 * 
 * @interface SkeletonProps
 * @property {SkeletonVariant} [variant='text'] - Visual variant of skeleton
 * @property {string} [width] - Custom width (e.g., '100%', '200px')
 * @property {string} [height] - Custom height (e.g., '20px', '3rem')
 * @property {string} [className] - Additional CSS classes
 * @property {number} [count=1] - Number of skeleton elements to render
 */
export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

/**
 * Generic skeleton loader component
 * 
 * @component
 * @param {SkeletonProps} props - Component properties
 * @returns {JSX.Element} Skeleton loading placeholder
 * 
 * @example
 * // Text skeleton
 * <Skeleton variant="text" />
 * 
 * @example
 * // Card skeleton
 * <Skeleton variant="card" width="300px" height="200px" />
 * 
 * @example
 * // Multiple skeletons
 * <Skeleton variant="text" count={3} />
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}: SkeletonProps): JSX.Element {
  const skeletonStyle = {
    ...(width && { width }),
    ...(height && { height }),
  };

  const skeletonClass = `${styles.skeleton} ${styles[variant]} ${className}`.trim();

  if (count === 1) {
    return <div className={skeletonClass} style={skeletonStyle} />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} style={skeletonStyle} />
      ))}
    </>
  );
}

/**
 * Skeleton group for complex layouts
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child skeleton components
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Skeleton group container
 * 
 * @example
 * <SkeletonGroup>
 *   <Skeleton variant="title" />
 *   <Skeleton variant="text" count={3} />
 *   <Skeleton variant="button" />
 * </SkeletonGroup>
 */
export function SkeletonGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return <div className={`${styles.skeletonGroup} ${className}`.trim()}>{children}</div>;
}
