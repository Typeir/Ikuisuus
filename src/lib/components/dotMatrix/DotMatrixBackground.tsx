/**
 * @fileoverview Minimal flat-color background with flashlight reveal mask
 * @module lib/components/dotMatrix/DotMatrixBackground
 * @author Typeir
 * @version 0.1.0
 * @since 1
 */

import React from 'react';
import styles from './dotMatrix.module.scss';

type Props = {
  radius?: number; // pixels
};

export default function DotMatrixBackground({ radius = 200 }: Props) {
  const style: React.CSSProperties = {} as React.CSSProperties;
  if (radius != null) {
    (style as any)['--reveal-radius'] = `${radius}px`;
  }

  return (
    <div
      data-flashlight='true'
      className={styles.reveal}
      style={style}
      aria-hidden='true'
    />
  );
}
