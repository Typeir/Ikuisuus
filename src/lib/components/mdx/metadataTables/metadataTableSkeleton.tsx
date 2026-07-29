/**
 * @fileoverview Metadata Table Skeleton Component
 * @description Skeleton loading state specifically for MetadataTable components.
 * Simple div-based placeholders with shimmer bars — no real form elements.
 *
 * @module MetadataTableSkeleton
 * @version 3.1.0
 * @author Typeir
 * @since 1.0.0
 */

import type { JSX } from 'react';
import sk from '@/lib/components/skeleton/skeleton.module.scss';
import { cn } from '@/lib/utils/classNameMerge';
import styles from './metadataTable.module.scss';

/** @description Reusable skeleton shimmer bar */
const Shimmer = ({ width }: { width: string }) => (
  <span className={cn(sk.skeleton, sk.text, sk.inline)} style={{ width }} />
);

/**
 * MetadataTable skeleton loading state
 *
 * @component
 * @param {Object} props - Component properties
 * @param {number} [props.rows=10] - Number of skeleton rows to display
 * @param {number} [props.columns=5] - Number of skeleton columns to display
 * @param {Array<{label: string, type?: 'select' | 'range'}>} [props.filters] - Filter configurations
 * @returns {JSX.Element} Skeleton table structure
 *
 * @example
 * <MetadataTableSkeleton
 *   rows={15}
 *   columns={7}
 *   filters={[
 *     { label: 'Size', type: 'select' },
 *     { label: 'Type', type: 'select' },
 *     { label: 'CR', type: 'range' }
 *   ]}
 * />
 */
export function MetadataTableSkeleton({
  rows = 10,
  columns = 5,
  filters = [],
}: {
  rows?: number;
  columns?: number;
  filters?: Array<{ label: string; type?: 'select' | 'range' }>;
}): JSX.Element {
  return (
    <div className={styles.metadataTable}>
      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <div className={sk.inputPlaceholder}>
            <Shimmer width='150px' />
          </div>
        </div>

        {filters.length > 0 && (
          <div className={styles.filters}>
            {filters.map((filter, index) => (
              <div key={index} className={styles.filterGroup}>
                <label>
                  <Shimmer width='80px' />
                </label>
                {filter.type === 'range' ? (
                  <RangeFilterSkeleton />
                ) : (
                  <div className={sk.selectPlaceholder}>
                    <Shimmer width='60px' />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.resultCount}>
        <Shimmer width='150px' />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className={styles.sortable}>
                  <div className={styles.headerContent}>
                    <Shimmer width='80px' />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => {
                  const seed = (rowIndex * columns + colIndex) * 0.12345;
                  const width = 60 + (seed % 1) * 30;
                  return (
                    <td key={colIndex}>
                      <Shimmer width={`${width}%`} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <div className={sk.buttonPlaceholder}>
          <Shimmer width='50px' />
        </div>
        <div className={styles.pageInfo}>
          <Shimmer width='120px' />
        </div>
        <div className={sk.buttonPlaceholder}>
          <Shimmer width='35px' />
        </div>
      </div>
    </div>
  );
}

/** @description Skeleton for a range filter (two inputs with separator) */
const RangeFilterSkeleton = () => (
  <div className={styles.rangeFilter}>
    <div className={cn(sk.inputPlaceholder, sk.inputPlaceholderSmall)}>
      <Shimmer width='30px' />
    </div>
    <Shimmer width='20px' />
    <div className={cn(sk.inputPlaceholder, sk.inputPlaceholderSmall)}>
      <Shimmer width='30px' />
    </div>
  </div>
);
