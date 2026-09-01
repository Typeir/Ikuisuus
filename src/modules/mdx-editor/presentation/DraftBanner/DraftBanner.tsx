/**
 * @fileoverview Draft Banner Component
 * @description Client-side banner showing the "DRAFT" badge and the created_at
 * and updated_at timestamps for draft content.
 *
 * @module modules/mdx-editor/presentation/DraftBanner/DraftBanner
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import styles from './DraftBanner.module.scss';

/**
 * Props for the DraftBanner component.
 *
 * @param {string} props.createdAt - ISO 8601 creation timestamp
 * @param {string} props.updatedAt - ISO 8601 last-update timestamp
 */
interface DraftBannerProps {
  /** @property {string} createdAt - ISO 8601 creation timestamp */
  createdAt: string;
  /** @property {string} updatedAt - ISO 8601 last-update timestamp */
  updatedAt: string;
}

/**
 * Formats an ISO 8601 date string via toLocaleString.
 *
 * @param {string} iso - ISO 8601 timestamp
 * @returns {string} Locale-formatted date string, or iso on parse failure
 */
const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

/**
 * Renders a banner indicating the page is showing draft content.
 * Includes a "DRAFT" badge and created/updated metadata.
 *
 * @param {DraftBannerProps} props - Component props
 * @param {string} props.createdAt - ISO 8601 creation timestamp
 * @param {string} props.updatedAt - ISO 8601 last-update timestamp
 * @returns {JSX.Element} Draft indicator banner
 */
export const DraftBanner: React.FC<DraftBannerProps> = ({
  createdAt,
  updatedAt,
}) => (
  <div className={styles.draftBanner} role='status' aria-label='Draft content'>
    <span className={styles.badge}>Draft</span>
    <div className={styles.meta}>
      <span>
        <span className={styles.metaLabel}>Created:</span>{' '}
        {formatDate(createdAt)}
      </span>
      <span>
        <span className={styles.metaLabel}>Updated:</span>{' '}
        {formatDate(updatedAt)}
      </span>
    </div>
  </div>
);
