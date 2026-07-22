/**
 * @fileoverview Flashlight reveal background using the counter-translate
 * architecture: a static pattern field under a transform-driven aperture,
 * so pointer movement costs two composite-only transform updates and zero
 * paint. See dotMatrix.module.scss for the layer breakdown.
 * @module lib/components/dotMatrix/DotMatrixBackground
 * @author Typeir
 * @version 0.2.0
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
        aria-hidden='true'>
        <div className={styles.aperture} data-flashlight-aperture='true'>
          <div className={styles.field} data-flashlight-field='true' />
        </div>
      </div>
    );
  },
);
