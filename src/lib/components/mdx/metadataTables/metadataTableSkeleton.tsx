/**
 * @fileoverview Metadata Table Skeleton Component
 * @description Skeleton loading state specifically for MetadataTable components.
 * Uses actual styled elements to prevent layout shifts/flashes during loading.
 * 
 * @module MetadataTableSkeleton
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import styles from './metadataTable.module.scss';
import skeletonStyles from '@/lib/components/skeleton/skeleton.module.scss';

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
      {/* Controls Section */}
      <div className={styles.controls}>
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className={styles.searchInput}
              disabled
              value="Search..."
              readOnly
              style={{ color: 'transparent', caretColor: 'transparent' }}
            />
            <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', width: 'calc(100% - 1.5rem)' }}>
              <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '150px', height: '1rem', display: 'inline-block' }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        {filters.length > 0 && (
          <div className={styles.filters}>
            {filters.map((filter, index) => (
              <div key={index} className={styles.filterGroup}>
                <label>
                  <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '80px', height: '0.875rem', display: 'inline-block' }} />
                </label>
                {filter.type === 'range' ? (
                  <div className={styles.rangeFilter}>
                    <div style={{ position: 'relative', width: '80px' }}>
                      <input
                        type="number"
                        className={styles.rangeInput}
                        disabled
                        value="0"
                        readOnly
                        style={{ color: 'transparent', caretColor: 'transparent' }}
                      />
                      <div style={{ position: 'absolute', top: '0.5rem', left: '0.75rem', width: 'calc(100% - 1.5rem)' }}>
                        <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '30px', height: '0.9rem', display: 'inline-block' }} />
                      </div>
                    </div>
                    <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '20px', height: '0.9rem', display: 'inline-block' }} />
                    <div style={{ position: 'relative', width: '80px' }}>
                      <input
                        type="number"
                        className={styles.rangeInput}
                        disabled
                        value="0"
                        readOnly
                        style={{ color: 'transparent', caretColor: 'transparent' }}
                      />
                      <div style={{ position: 'absolute', top: '0.5rem', left: '0.75rem', width: 'calc(100% - 1.5rem)' }}>
                        <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '30px', height: '0.9rem', display: 'inline-block' }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <select
                      className={styles.filterSelect}
                      disabled
                      style={{ color: 'transparent' }}
                    >
                      <option>All</option>
                    </select>
                    <div style={{ position: 'absolute', top: '0.5rem', left: '0.75rem', width: 'calc(100% - 2.5rem)', pointerEvents: 'none' }}>
                      <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '60px', height: '0.9rem', display: 'inline-block' }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Result Count Skeleton */}
      <div className={styles.resultCount}>
        <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '150px', height: '1rem', display: 'inline-block' }} />
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className={styles.sortable}>
                  <div className={styles.headerContent}>
                    <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '80px', height: '1rem', display: 'inline-block' }} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => {
                  // Deterministic width based on row and column (60-90% range)
                  const seed = (rowIndex * columns + colIndex) * 0.12345;
                  const width = 60 + ((seed % 1) * 30);
                  
                  return (
                    <td key={colIndex}>
                      <span 
                        className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} 
                        style={{ 
                          width: `${width}%`, 
                          height: '1rem', 
                          display: 'inline-block' 
                        }} 
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <div style={{ position: 'relative' }}>
          <button className={styles.paginationButton} disabled style={{ color: 'transparent' }}>
            Previous
          </button>
          <div style={{ position: 'absolute', top: '0.5rem', left: '1rem', width: 'calc(100% - 2rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '50px', height: '0.9rem', display: 'inline-block' }} />
          </div>
        </div>
        <div className={styles.pageInfo}>
          <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '120px', height: '0.9rem', display: 'inline-block' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <button className={styles.paginationButton} disabled style={{ color: 'transparent' }}>
            Next
          </button>
          <div style={{ position: 'absolute', top: '0.5rem', left: '1rem', width: 'calc(100% - 2rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '35px', height: '0.9rem', display: 'inline-block' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
