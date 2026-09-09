/**
 * @fileoverview Turns one division of a sheet into a disclosure.
 * @description The fold is taken at the division and the heading itself becomes
 * the control
 *
 * @module modules/library/presentation/components/slots/foldDivision
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

'use client';

import Icon from '@/lib/components/icon/icon';
import React, { type ReactNode } from 'react';
import type { Division, DivisionProps } from './divisions';
import styles from './fold.module.scss';

/**
 * The disclosure a heading opens.
 *
 * @param {ReactNode} heading - Heading that becomes the control
 * @param {ReactNode} body - What the heading opens onto
 * @param {boolean} closed - Whether it starts folded
 * @returns {ReactNode} The disclosure
 */
export function disclosure(
  heading: ReactNode,
  body: ReactNode,
  closed: boolean,
): ReactNode {
  return (
    <details className={styles.fold} open={!closed}>
      <summary className={styles.summary}>
        {heading}
        <Icon type='arrow' className={styles.arrow} aria-hidden='true' />
      </summary>
      <div className={styles.body}>{body}</div>
    </details>
  );
}

/**
 * Rebuilds one division as a disclosure.
 *
 * @param {Division} division - The division to fold
 * @param {ReactNode} body - The division's body, already walked
 * @param {boolean} closed - Whether it starts folded
 * @returns {ReactNode} The disclosure
 */
export function foldDivision(
  division: Division,
  body: ReactNode,
  closed: boolean,
): ReactNode {
  const control = disclosure(division.heading, body, closed);

  /* A division that arrived wrapped keeps its own section, so the styling that
     keys on it still applies; a bare one is given the wrapper it lacked. */
  if (division.section) {
    return React.cloneElement(
      division.section,
      { ...division.section.props, 'data-folded': 'true' } as DivisionProps,
      control,
    );
  }

  return (
    <section
      data-anchor={division.anchor}
      data-heading-level={division.rank}
      data-folded='true'>
      {control}
    </section>
  );
}
