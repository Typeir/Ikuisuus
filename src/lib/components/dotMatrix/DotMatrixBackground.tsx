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
  radius?: number;
  hidden?: boolean;
};

export default React.forwardRef<HTMLDivElement, Props>(
  function DotMatrixBackground({ radius = 200, hidden = false }, ref) {
    const style: React.CSSProperties = {
      opacity: hidden ? 0 : 0.5,
      pointerEvents: hidden ? 'none' : 'auto',
    } as React.CSSProperties;
    if (radius != null) {
      (style as any)['--reveal-radius'] = `${radius}px`;
    }

    return (
      <div
        ref={ref}
        data-flashlight='true'
        className={styles.reveal}
        style={style}
        aria-hidden='true'
      />
    );
  },
);
