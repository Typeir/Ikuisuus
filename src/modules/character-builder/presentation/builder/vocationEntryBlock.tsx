/**
 * @fileoverview Vocation Entry Block Component
 * @description Single-row editor for one {@link VocationEntry} (vocation picker,
 * specialization picker, and level spinner with {@link NumericInput}). Each block
 * manages its own async loading state via `asyncLoading` so multiclassing entries
 * remain fully independent. Skeleton placeholders replace selector inputs in-place
 * while metadata or feature shards are loading.
 *
 * @module lib/components/characterSheet/vocationEntryBlock
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Skeleton } from '@/lib/components/skeleton/skeleton';
import { FilterSelect } from '@/lib/components/ui/filterSelect';
import { NumericInput } from '@/lib/components/ui/numericInput';
import type { VocationEntry } from '@/lib/types/character';
import type { SpecOption, VocationOption } from '@/lib/types/vocations';
import { VocationProficiencySummary } from './vocationProficiencySummary';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import styles from './vocationSelector.module.scss';

/**
 * Converts a slug/title pair to a FilterSelect option.
 *
 * @function toOpt
 * @param {{ slug: string; title: string }} item - Source item
 * @returns {{ value: string; label: string }} Option object
 */
function toOpt(item: { slug: string; title: string }): {
  value: string;
  label: string;
} {
  return { value: item.slug, label: item.title };
}

/**
 * Props for the VocationEntryBlock component.
 *
 * @interface VocationEntryBlockProps
 * @property {VocationEntry} entry - The vocation entry to display/edit
 * @property {number} index - Zero-based position in the vocations array
 * @property {boolean} isOnlyEntry - True when this is the sole vocation row (hides remove button and index suffix)
 * @property {VocationOption[]} vocOptions - Available vocations for the picker
 * @property {SpecOption[]} specs - All specializations (filtered by parent vocation internally)
 * @property {boolean} [metaLoading=false] - When true and entry has a slug, shows skeleton placeholders while global metadata loads
 * @property {(index: number, slug: string) => Promise<void> | void} onVocationChange - Fired when vocation selection changes; may return a Promise that resolves when features are loaded
 * @property {(index: number, slug: string) => Promise<void> | void} onSpecChange - Fired when specialization selection changes; may return a Promise that resolves when features are loaded
 * @property {(index: number, value: number) => void} onLevelChange - Fired when level changes
 * @property {(index: number) => void} onRemove - Fired when the remove button is clicked
 */
export interface VocationEntryBlockProps {
  entry: VocationEntry;
  index: number;
  isOnlyEntry: boolean;
  vocOptions: VocationOption[];
  specs: SpecOption[];
  metaLoading?: boolean;
  onVocationChange: (index: number, slug: string) => Promise<void> | void;
  onSpecChange: (index: number, slug: string) => Promise<void> | void;
  onLevelChange: (index: number, value: number) => void;
  onRemove: (index: number) => void;
}

/**
 * Single vocation entry row for the VocationSelector edit panel.
 * Manages its own async loading state so multiclassing entries are fully
 * independent. Skeleton placeholders appear in-place of the selector inputs
 * while loading — no extra elements are injected outside the row layout.
 *
 * @component
 * @param {VocationEntryBlockProps} props - Component props
 * @param {VocationEntry} props.entry - The vocation entry to display/edit
 * @param {number} props.index - Zero-based position in the vocations array
 * @param {boolean} props.isOnlyEntry - True when this is the sole vocation row
 * @param {VocationOption[]} props.vocOptions - Available vocations for the picker
 * @param {SpecOption[]} props.specs - All specializations (filtered internally)
 * @param {boolean} [props.metaLoading=false] - Shows skeletons for existing entries while metadata loads
 * @param {(index: number, slug: string) => Promise<void> | void} props.onVocationChange - Vocation change callback
 * @param {(index: number, slug: string) => Promise<void> | void} props.onSpecChange - Specialization change callback
 * @param {(index: number, value: number) => void} props.onLevelChange - Level change callback
 * @param {(index: number) => void} props.onRemove - Remove callback
 * @returns {JSX.Element} Rendered entry block
 */
export const VocationEntryBlock: React.FC<VocationEntryBlockProps> = ({
  entry,
  index,
  isOnlyEntry,
  vocOptions,
  specs,
  metaLoading = false,
  onVocationChange,
  onSpecChange,
  onLevelChange,
  onRemove,
}) => {
  const t = useTranslations('characterSheet');
  const [asyncLoading, setAsyncLoading] = useState(false);

  const filteredSpecs = entry.slug
    ? specs.filter((s) => s.vocation === entry.slug)
    : [];

  const selectedVocation = entry.slug
    ? vocOptions.find((v) => v.slug === entry.slug)
    : undefined;

  const showSkeleton = metaLoading && !!entry.slug;
  const isAsyncLoading = asyncLoading && !showSkeleton;

  const handleVocChange = async (slug: string) => {
    setAsyncLoading(true);
    try {
      await onVocationChange(index, slug);
    } finally {
      setAsyncLoading(false);
    }
  };

  const handleSpecChange = async (slug: string) => {
    setAsyncLoading(true);
    try {
      await onSpecChange(index, slug);
    } finally {
      setAsyncLoading(false);
    }
  };

  const blockClassName = [
    styles.vocationEntryBlock,
    isOnlyEntry ? styles.vocationEntryBlockSingle : '',
    isAsyncLoading ? styles.vocationEntryBlockLoading : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={blockClassName}>
      <div className={styles.selectorRow}>
        <span className={styles.selectorLabel}>
          {t('colVocation')}
          {!isOnlyEntry ? ` ${index + 1}` : ''}
        </span>
        <div className={styles.selectorInput}>
          {showSkeleton ? (
            <Skeleton variant='button' height='26px' />
          ) : (
            <FilterSelect
              id={`vocation-select-${index}`}
              value={entry.slug}
              options={vocOptions.map(toOpt)}
              onChange={handleVocChange}
              placeholder={t('selectVocation')}
              searchable
              size='sm'
              ariaLabel={t('colVocation')}
            />
          )}
        </div>
        <span className={styles.levelDivider} aria-hidden='true' />
        <span className={styles.levelLabel}>{t('levelAbbrev')}</span>
        {showSkeleton ? (
          <Skeleton variant='button' height='26px' width='3.5rem' />
        ) : (
          <NumericInput
            value={entry.level}
            min={1}
            max={30}
            size='sm'
            className={styles.levelInput}
            ariaLabel={t('ariaVocationLevel')}
            onChange={(v) => onLevelChange(index, v ?? 1)}
          />
        )}
        {!isOnlyEntry && (
          <button
            type='button'
            className={styles.removeBtn}
            aria-label={t('ariaRemoveVocation')}
            disabled={showSkeleton || isAsyncLoading}
            onClick={() => onRemove(index)}>
            ✕
          </button>
        )}
      </div>
      <div className={styles.selectorRow}>
        <span className={styles.selectorLabel}>{t('colSpecialization')}</span>
        <div className={styles.selectorInput}>
          {showSkeleton ? (
            <Skeleton variant='button' height='26px' width='100%' />
          ) : (
            <FilterSelect
              id={`spec-select-${index}`}
              value={entry.specializationSlug ?? ''}
              options={filteredSpecs.map(toOpt)}
              onChange={handleSpecChange}
              placeholder={t('selectSpecialization')}
              searchable
              size='sm'
              disabled={!entry.slug}
              ariaLabel={`${t('colSpecialization')} ${index + 1}`}
            />
          )}
        </div>
      </div>
      {!showSkeleton && <VocationProficiencySummary vocation={selectedVocation} />}
    </div>
  );
};
