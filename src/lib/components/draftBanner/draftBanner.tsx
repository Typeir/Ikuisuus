/**
 * @fileoverview Draft Banner Component
 * @description Client-side component that displays a visually distinct indicator
 * when the user is viewing draft content. Shows the "DRAFT" badge and metadata
 * timestamps (created_at and updated_at).
 *
 * @module lib/components/draftBanner/draftBanner
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import styles from './draftBanner.module.scss';

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
 * Formats an ISO 8601 date string into a human-readable locale string.
 *
 * @param {string} iso - ISO 8601 timestamp
 * @returns {string} Formatted date string
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
const DraftBanner: React.FC<DraftBannerProps> = ({ createdAt, updatedAt }) => (
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

export default DraftBanner;
