/**
 * @fileoverview Virtualized Import List
 * @description Renders a virtualized list for the abilities import panel
 * using the shared VirtualList atom. Caps at 30 visible rows, 24px each.
 * Styles verbatim-match the sidebar: accent color, underline hover, slide transform.
 *
 * @module lib/components/characterSheet/tabs/abilities/VirtualizedImportList
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { VirtualList } from '@/lib/components/ui/virtualList/virtualList';
import { useTranslations } from 'next-intl';
import styles from './abilities.module.scss';

/** Match sidebar compactness. */
const ROW_HEIGHT = 24;
const MAX_VISIBLE = 20;

export interface VirtualizedImportListProps {
  items: Array<{ title: string; slug: string }>;
  onImport: (item: { title: string; slug: string }) => void;
  /** Unused but kept for API compatibility. */
  activeTab?: string;
}

export const VirtualizedImportList: React.FC<VirtualizedImportListProps> = ({
  items,
  onImport,
}) => {
  const t = useTranslations('characterSheet');

  return (
    <VirtualList
      items={items}
      rowHeight={ROW_HEIGHT}
      maxHeight={MAX_VISIBLE * ROW_HEIGHT}
      className={styles.importList}
      renderRow={(item) => (
        <button
          type='button'
          className={styles.importItem}
          onClick={() => onImport(item)}
          aria-label={t('abilityImportItemAria', { title: item.title })}>
          {item.title}
        </button>
      )}
    />
  );
};
