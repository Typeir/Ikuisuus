/**
 * @fileoverview Boons section of a bloodline.
 * @description Wraps the boons and states the budget they are bought from, as
 * a tag on the section's own heading, the way a feature heading carries its
 * cost. Every bloodline grants the same budget, so a page writes `points` only
 * when it departs from it.
 *
 * @module modules/library/presentation/components/slots/Boons
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

'use client';

import { DEFAULT_BOON_POINTS } from '@/modules/library/domain/bloodlineSlots';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import { isHeadingNode } from '../headingParts';
import styles from './slots.module.scss';

/**
 * Props for the section.
 *
 * @property {string | number} [points] - Budget, when it is not the default
 * @property {ReactNode} [children] - The section's heading and boons
 */
export interface BoonsProps {
  points?: string | number;
  children?: ReactNode;
}

/**
 * Boons section component.
 *
 * @param {BoonsProps} props - Section props
 * @returns {JSX.Element} The section
 */
const Boons: React.FC<BoonsProps> = ({ points, children }) => {
  const t = useTranslations('library');
  const declared = Number(points);
  const budget =
    Number.isFinite(declared) && declared > 0 ? declared : DEFAULT_BOON_POINTS;

  let tagged = false;
  const nodes = React.Children.toArray(children).map((node) => {
    if (tagged || !isHeadingNode(node)) return node;
    tagged = true;
    const element = node as React.ReactElement<{ children?: ReactNode }>;
    return React.cloneElement(
      element,
      undefined,
      element.props.children,
      <span key='budget' className={styles.tag} data-boon-budget={String(budget)}>
        {t('bloodline.boonBudget', { points: String(budget) })}
      </span>,
    );
  });

  return <section data-boons='true'>{nodes}</section>;
};

Boons.displayName = 'Boons';

export default Boons;
