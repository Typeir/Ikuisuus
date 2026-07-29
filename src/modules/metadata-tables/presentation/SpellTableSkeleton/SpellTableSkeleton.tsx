/**
 * @fileoverview Spell Table Skeleton Component
 * @description Skeleton loading state for SpellTable with tab navigation.
 * Uses actual styled elements to prevent layout shifts during loading.
 *
 * @module SpellTableSkeleton
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { JSX } from 'react';
import { MetadataTableSkeleton } from '@/lib/components/mdx/metadataTables/metadataTableSkeleton';
import skeletonStyles from '@/lib/components/skeleton/skeleton.module.scss';
import gradientTabStyles from '@/lib/components/ui/gradientTabs/gradientTabs.module.scss';
import styles from '@/modules/metadata-tables/presentation/SpellTable/SpellTable.module.scss';

/**
 * @interface SpellTableSkeletonProps
 * @description Props for SpellTableSkeleton
 * @property {number} [rows=20] - Number of skeleton rows to render in the table body
 * @property {number} [tabCount=13] - Number of level tabs to render in the tab skeleton
 * @property {boolean} [showFilterSkeleton=false] - Whether to render filter controls skeleton above tabs
 */
interface SpellTableSkeletonProps {
  rows?: number;
  tabCount?: number;
  showFilterSkeleton?: boolean;
}

/**
 * SpellTable skeleton loading state with tabs
 *
 * @component
 * @param {SpellTableSkeletonProps} props - Component properties
 * @param {number} [props.rows=20] - Number of skeleton rows to display
 * @param {number} [props.tabCount=13] - Number of tabs to display
 * @param {boolean} [props.showFilterSkeleton=false] - Whether to render filter controls skeleton
 * @returns {JSX.Element} Skeleton spell table with tabs
 *
 * @example
 * <SpellTableSkeleton rows={20} tabCount={13} />
 */
export function SpellTableSkeleton({
  rows = 20,
  tabCount = 13,
  showFilterSkeleton = false,
}: SpellTableSkeletonProps): JSX.Element {
  return (
    <div className={styles.spellTables}>
      {showFilterSkeleton ? (
        <div className={styles.filterControls}>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <span
                  className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`}
                  style={{
                    width: '110px',
                    height: '0.875rem',
                    display: 'inline-block',
                  }}
                />
              </label>
              <div className={styles.filterCheckboxRow}>
                <input
                  type='checkbox'
                  className={styles.filterCheckbox}
                  disabled
                  aria-label='Damocles only loading state'
                />
                <span
                  className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`}
                  style={{
                    width: '40px',
                    height: '0.9rem',
                    display: 'inline-block',
                  }}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <span
                  className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`}
                  style={{
                    width: '60px',
                    height: '0.875rem',
                    display: 'inline-block',
                  }}
                />
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  className={styles.filterComboboxSkeleton}
                  type='button'
                  disabled
                  style={{ color: 'transparent' }}>
                  All
                </button>
                <div
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.75rem',
                    width: 'calc(100% - 2.5rem)',
                    pointerEvents: 'none',
                  }}>
                  <span
                    className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`}
                    style={{
                      width: '70px',
                      height: '0.9rem',
                      display: 'inline-block',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <span
                  className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`}
                  style={{
                    width: '110px',
                    height: '0.875rem',
                    display: 'inline-block',
                  }}
                />
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  className={styles.filterComboboxSkeleton}
                  type='button'
                  disabled
                  style={{ color: 'transparent' }}>
                  All
                </button>
                <div
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.75rem',
                    width: 'calc(100% - 2.5rem)',
                    pointerEvents: 'none',
                  }}>
                  <span
                    className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`}
                    style={{
                      width: '50px',
                      height: '0.9rem',
                      display: 'inline-block',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={gradientTabStyles.gradientContainer}>
        <div className={gradientTabStyles.tabNavWrapper}>
          <div className={gradientTabStyles.tabNav}>
            <div className={gradientTabStyles.tabList}>
              {Array.from({ length: tabCount }).map((_, index) => (
                <div
                  key={index}
                  className={`${gradientTabStyles.tab} ${index === 0 ? gradientTabStyles.active : ''}`}>
                  <button
                    type='button'
                    disabled
                    style={{ position: 'relative' }}>
                    <span style={{ color: 'transparent' }}>Level {index}</span>
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        left: '0.875rem',
                        width: 'calc(100% - 1.75rem)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none',
                      }}>
                      <span
                        className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`}
                        style={{
                          width: '50px',
                          height: '0.875rem',
                          display: 'inline-block',
                        }}
                      />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={gradientTabStyles.tabContent}>
          <MetadataTableSkeleton rows={rows} columns={6} filters={[]} />
        </div>
      </div>
    </div>
  );
}
