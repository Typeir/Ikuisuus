/**
 * @fileoverview Renders the flashlight-reveal background: an outer reveal
 * div wrapping an aperture div around a pattern field. Sets the
 * --reveal-radius CSS var to {radius}px and toggles opacity and
 * pointer-events via the hidden prop.
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
  className?: string;
  style?: React.CSSProperties;
};

export default React.forwardRef<HTMLDivElement, Props>(
  function DotMatrixBackground(
    { radius = 200, hidden = false, className, style: styleOverride },
    ref,
  ) {
    const style: React.CSSProperties = {
      opacity: hidden ? 0 : 0.5,
      pointerEvents: hidden ? 'none' : 'auto',
    } as React.CSSProperties;
    if (radius != null) {
      (style as any)['--reveal-radius'] = `${radius}px`;
    }
    Object.assign(style, styleOverride);

    return (
      <div
        ref={ref}
        data-flashlight='true'
        className={className ? `${styles.reveal} ${className}` : styles.reveal}
        style={style}
        aria-hidden='true'>
        <div className={styles.aperture} data-flashlight-aperture='true'>
          <div className={styles.field} data-flashlight-field='true' />
        </div>
      </div>
    );
  },
);
