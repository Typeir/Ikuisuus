/**
 * @fileoverview A set of blocks the reader picks from.
 * @description Groups blocks that exclude one another and says how many are
 * taken.
 *
 * @module modules/library/presentation/components/slots/Choice
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

'use client';

import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import styles from './slots.module.scss';

/**
 * Props for the group.
 *
 * @property {string} [pick] - How many are taken, as the page words it; one by default
 * @property {ReactNode} [children] - The blocks picked from
 */
export interface ChoiceProps {
  pick?: string;
  children?: ReactNode;
}

/**
 * Choice group component.
 *
 * @param {ChoiceProps} props - Group props
 * @returns {JSX.Element} The group
 */
const Choice: React.FC<ChoiceProps> = ({ pick, children }) => {
  const t = useTranslations('library');
  const taken = (pick ?? '').trim();

  return (
    <div
      className={styles.choice}
      data-choice={taken === '' ? 'one' : taken}>
      <p className={styles.choiceLead} data-choice-lead>
        {taken === '' ? t('choice.one') : t('choice.pick', { pick: taken })}
      </p>
      {children}
    </div>
  );
};

Choice.displayName = 'Choice';

export default Choice;
