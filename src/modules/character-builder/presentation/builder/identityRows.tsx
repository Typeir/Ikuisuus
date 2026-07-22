/**
 * @fileoverview Identity Rows — Bloodline + Vocation pill display
 * @description Read-only identity pills shown in view mode and collapsed
 * edit mode. Extracted from {@link VocationSelector} to satisfy file-length
 * gate (max 250 code lines).
 *
 * @module modules/character-builder/presentation/builder/identityRows
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { Chip } from '@/lib/components/ui/chip';
import type { VocationEntry } from '@/lib/types/character';
import { usePagePreview } from '@/modules/character-builder/presentation/PagePreview/pagePreviewProvider';
import { useTranslations } from 'next-intl';
import styles from './vocationSelector.module.scss';

/**
 * Props for `<IdentityRows>`.
 *
 * @interface IdentityRowsProps
 * @property {string | null} bloodlineSlug - Active bloodline slug
 * @property {string} bloodlineTitle - Active bloodline display name
 * @property {VocationEntry[]} vocations - Current vocation entries
 */
export interface IdentityRowsProps {
  bloodlineSlug: string | null;
  bloodlineTitle: string;
  vocations: VocationEntry[];
}

/**
 * Bloodline chip + vocation pill group.
 *
 * @component
 * @param {IdentityRowsProps} props - Component props
 * @returns {JSX.Element} Rendered identity rows
 */
export const IdentityRows: React.FC<IdentityRowsProps> = ({
  bloodlineSlug,
  bloodlineTitle,
  vocations,
}) => {
  const t = useTranslations('characterSheet');
  const preview = usePagePreview();

  return (
    <>
      <div className={styles.identityRow}>
        <span className={styles.identityLabel}>{t('colBloodline')}</span>
        {bloodlineTitle ? (
          <Chip
            variant='neutral'
            label={bloodlineTitle}
            onInfo={
              bloodlineSlug
                ? () =>
                    preview.open({
                      kind: 'bloodlines',
                      slug: bloodlineSlug,
                      title: bloodlineTitle,
                    })
                : undefined
            }
          />
        ) : (
          <span className={styles.identityEmpty}>—</span>
        )}
      </div>
      <div className={styles.identityRow}>
        <span className={styles.identityLabel}>{t('colVocation')}</span>
        {vocations.length > 0 ? (
          <div className={styles.pillGroup}>
            {vocations.map((v, i) =>
              v.slug ? (
                <Chip
                  key={`${i}::${v.slug}`}
                  variant='neutral'
                  label={`${v.title}${v.specializationTitle ? ` / ${v.specializationTitle}` : ''} Lv.${v.level}`}
                  onInfo={() =>
                    preview.open({
                      kind: 'vocations',
                      slug: v.slug,
                      title: v.title,
                    })
                  }
                />
              ) : (
                <span key={`${i}::empty`} className={styles.identityPill}>
                  — Lv.{v.level}
                </span>
              ),
            )}
          </div>
        ) : (
          <span className={styles.identityEmpty}>—</span>
        )}
      </div>
    </>
  );
};
