/**
 * @fileoverview How a spell grows, when it grows by something other than a slot.
 * @description A cantrip strengthens at character levels rather than by being
 * cast from a higher slot
 *
 * @module modules/library/presentation/components/slots/Scaling
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

'use client';

import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import styles from './slots.module.scss';

/**
 * Props for the block.
 *
 * @property {ReactNode} [children] - The scaling prose
 */
export interface ScalingProps {
  children?: ReactNode;
}

/**
 * Scaling block component.
 *
 * @param {ScalingProps} props - Block props
 * @returns {JSX.Element} The block
 */
const Scaling: React.FC<ScalingProps> = ({ children }) => {
  const t = useTranslations('library');

  return (
    <section className={styles.tail} data-scaling>
      <p className={styles.overcastLabel} data-scaling-label>
        {t('scaling.heading')}
      </p>
      {children}
    </section>
  );
};

Scaling.displayName = 'Scaling';

export default Scaling;
