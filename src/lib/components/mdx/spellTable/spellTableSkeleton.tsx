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

import { MetadataTableSkeleton } from '../metadataTables/metadataTableSkeleton';
import styles from './spellTable.module.scss';
import skeletonStyles from '@/lib/components/skeleton/skeleton.module.scss';

/**
 * SpellTable skeleton loading state with tabs
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {number} [props.rows=20] - Number of skeleton rows to display
 * @param {number} [props.tabCount=13] - Number of tabs to display
 * @returns {JSX.Element} Skeleton spell table with tabs
 * 
 * @example
 * <SpellTableSkeleton rows={20} tabCount={13} />
 */
export function SpellTableSkeleton({
  rows = 20,
  tabCount = 13,
}: {
  rows?: number;
  tabCount?: number;
}): JSX.Element {
  return (
    <div className={styles.spellTables}>
      <div className={styles.gradientContainer}>
        <div className={styles.tabNavWrapper}>
          <div className={styles.tabNav}>
            <div className={styles.tabList}>
              {Array.from({ length: tabCount }).map((_, index) => (
                <div
                  key={index}
                  className={`${styles.tab} ${index === 0 ? styles.active : ''}`}
                >
                  <button type="button" disabled style={{ position: 'relative' }}>
                    <span style={{ color: 'transparent' }}>Level {index}</span>
                    <div style={{ position: 'absolute', top: '0.5rem', left: '0.875rem', width: 'calc(100% - 1.75rem)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <span className={`${skeletonStyles.skeleton} ${skeletonStyles.text}`} style={{ width: '50px', height: '0.875rem', display: 'inline-block' }} />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.tabContent}>
          <MetadataTableSkeleton 
            rows={rows} 
            columns={6}
            filters={[]}
          />
        </div>
      </div>
    </div>
  );
}
