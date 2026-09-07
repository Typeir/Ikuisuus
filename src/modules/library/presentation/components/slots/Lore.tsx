/**
 * @fileoverview A run of prose that carries no mechanics.
 * @description Marks colour, illustration, and restatement — the "such as a
 * red-haired dwarf wearing a pointed hat" of a spell — so a reader scanning
 * for rules can skip it.
 *
 * @module modules/library/presentation/components/slots/Lore
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

'use client';

import React, { type ReactNode } from 'react';
import styles from './slots.module.scss';

/**
 * Props for the mark.
 *
 * @property {ReactNode} [children] - The prose that carries no mechanics
 */
export interface LoreProps {
  children?: ReactNode;
}

/**
 * Lore mark component.
 *
 * @param {LoreProps} props - Mark props
 * @returns {JSX.Element} The marked run
 */
const Lore: React.FC<LoreProps> = ({ children }) => (
  <span className={styles.lore} data-lore>
    {children}
  </span>
);

Lore.displayName = 'Lore';

export default Lore;
