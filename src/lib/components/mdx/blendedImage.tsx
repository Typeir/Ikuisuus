/**
 * @file blendedImage.tsx
 * @description A custom image component that wraps images in a vignette container with blend mode styling.
 *
 * @module blendedImage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 */

import Image from 'next/image';
import type { ImgHTMLAttributes } from 'react';
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

  return (
    <div
      className={`${styles['vignette-img']} ${styles[mode]}`}
      style={{ '--bg-image': `url(${src})` } as React.CSSProperties}>
      <Image
        src={src || ''}
        alt={alt || ''}
        width={(width as number) || 800}
        height={(height as number) || 600}
        className={className}
      />
    </div>
  );
};

export default BlendedImage;
