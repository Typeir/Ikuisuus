/**
 * @fileoverview Summary Bar — Collapsed identity summary button.
 * Renders bloodline + vocation summary in a toggle button.
 *
 * @module modules/character-builder/presentation/builder/summaryBar
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import type { VocationEntry } from '@/lib/types/character';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import styles from './vocationSelector.module.scss';

/**
 * Props for `<SummaryBar>`.
 *
 * @interface SummaryBarProps
 * @property {boolean} collapsed - Whether the selector panel is collapsed
 * @property {() => void} onToggle - Toggle collapsed state
 * @property {string} bloodlineTitle - Active bloodline display name
 * @property {VocationEntry[]} vocations - Current vocation entries
 */
export interface SummaryBarProps {
  collapsed: boolean;
  onToggle: () => void;
  bloodlineTitle: string;
  vocations: VocationEntry[];
}

/**
 * Collapsed identity summary with bloodline + vocations.
 *
 * @component
 * @param {SummaryBarProps} props - Component props
 * @param {boolean} props.collapsed - Whether the selector panel is collapsed
 * @param {() => void} props.onToggle - Toggle collapsed state
 * @param {string} props.bloodlineTitle - Active bloodline display name
 * @param {VocationEntry[]} props.vocations - Current vocation entries
 * @returns {JSX.Element} Rendered summary button
 */
export const SummaryBar: React.FC<SummaryBarProps> = ({
  collapsed,
  onToggle,
  bloodlineTitle,
  vocations,
}) => {
  const t = useTranslations('characterSheet');

  const vocationSummary =
    vocations.length > 0
      ? vocations
          .map(
            (v) =>
              `${v.title || '—'}${v.specializationTitle ? ` / ${v.specializationTitle}` : ''} Lv.${v.level}`,
          )
          .join(' · ')
      : '—';

  return (
    <button
      type='button'
      className={styles.identitySummary}
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={t('ariaIdentitySummary')}>
      <ChevronRight
        size={14}
        aria-hidden='true'
        className={`${styles.summaryChevron} ${collapsed ? '' : styles.summaryChevronOpen}`}
      />
      <span className={styles.summaryLabel}>{t('colBloodline')}</span>
      <span className={styles.summaryValue}>{bloodlineTitle || '—'}</span>
      <span className={styles.summaryDivider} aria-hidden='true' />
      <span className={styles.summaryLabel}>{t('colVocation')}</span>
      <span className={styles.summaryValue}>{vocationSummary}</span>
    </button>
  );
};
