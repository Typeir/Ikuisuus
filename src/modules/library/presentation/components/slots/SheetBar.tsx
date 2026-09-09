/**
 * @fileoverview The row of tabs a sheet is turned by.
 * @description One row, set at whichever end the sheet is read from
 *
 * @module modules/library/presentation/components/slots/SheetBar
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-09
 */

'use client';

import React, { type JSX, type RefObject } from 'react';
import { type Division } from './divisions';
import styles from './sheet.module.scss';

/**
 * Props for the bar.
 *
 * @property {Division[]} pages - The pages it turns between
 * @property {string[]} names - What to print for each page, in order
 * @property {Map<string, string>} labels - Names given in content, by anchor
 * @property {number} active - Index of the page showing
 * @property {boolean} foot - Set at the bottom rather than the top
 * @property {boolean} stuck - Whether it has taken its ground
 * @property {RefObject<HTMLDivElement | null>} innerRef - Handle on the row
 * @property {(index: number) => void} onTurn - Asked for another page
 */
export interface SheetBarProps {
  pages: Division[];
  names: string[];
  labels: Map<string, string>;
  active: number;
  foot: boolean;
  stuck: boolean;
  innerRef: RefObject<HTMLDivElement | null>;
  onTurn: (index: number) => void;
}

/**
 * The row of tabs a sheet is turned by.
 *
 * @param {SheetBarProps} props - Component props
 * @returns {JSX.Element} The row
 */
const SheetBar = ({
  pages,
  names,
  labels,
  active,
  foot,
  stuck,
  innerRef,
  onTurn,
}: SheetBarProps): JSX.Element => (
  <div
    ref={innerRef}
    className={styles.strip}
    data-foot={foot ? 'true' : undefined}
    data-stuck={foot || stuck ? 'true' : undefined}
    role='tablist'>
    {pages.map((entry, index) => (
      <button
        key={entry.anchor}
        type='button'
        role='tab'
        aria-selected={index === active}
        className={styles.tab}
        data-active={index === active ? 'true' : undefined}
        onClick={() => onTurn(index)}>
        {labels.get(entry.anchor) ?? names[index] ?? entry.name}
      </button>
    ))}
  </div>
);

export default SheetBar;
