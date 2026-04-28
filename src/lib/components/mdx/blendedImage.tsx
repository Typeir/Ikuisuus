/**
 * @file blendedImage.tsx
 * @description A custom image component that wraps images in a vignette container with blend mode styling.
 *
 * @module blendedImage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @fileoverview Module for src/lib/components/mdx/blendedImage.tsx
 */

import Image from 'next/image';
import type { ImgHTMLAttributes } from 'react';
import React from 'react';
import styles from './blendedImage.module.scss';
/**
 * A custom image component that wraps images in a vignette container with blend mode styling.
 *
 * @param {ImgHTMLAttributes<HTMLImageElement>} props - Standard HTML image attributes
 * @param {string} [mode='square'] - Display mode for the vignette effect
 * @returns {JSX.Element} The wrapped image with vignette styling
 */
const BlendedImage = (
  props: ImgHTMLAttributes<HTMLImageElement>,
  mode = 'square',
) => {
  const { src, alt, width, height, className, ...rest } = props;

  const hasSrc = Boolean(src && String(src).trim());
  const style = hasSrc
    ? ({ '--bg-image': `url(${src})` } as React.CSSProperties)
    : undefined;

  return (
    <div className={`${styles['vignette-img']} ${styles[mode]}`} style={style}>
      {hasSrc ? (
        <Image
          src={src as string}
          alt={alt || ''}
          width={(width as number) || 800}
          height={(height as number) || 600}
          className={className}
        />
      ) : null}
    </div>
  );
};

export default BlendedImage;
