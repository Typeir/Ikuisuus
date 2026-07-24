/**
 * @fileoverview Feature Card Component
 * @description Generic toggleable card for feature lists (feats, boons).
 * Renders a row with a toggle button (select/deselect), an open-source button
 * that focuses the shard for the right detail panel, an expand chevron for
 * inline prose, and an optional badge. Focusing the shard is an explicit action
 * via the open-source button — never a side effect of toggling or expanding.
 *
 * @module lib/components/characterSheet/builder/featureCard
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { ChevronDown, ChevronRight, SquareArrowOutUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import type { ContentShardType } from '../shards/contentShardPanel';
import expandStyles from './boonExpand.module.scss';
import { ContentExpandBody } from './contentExpandBody';

/**
 * Props for the FeatureCard component.
 *
 * @interface FeatureCardProps
 * @property {string} label - Feature name displayed on the toggle button
 * @property {ReactNode} [badge] - Optional badge content (BP cost, prereq, etc.)
 * @property {boolean} selected - Whether the feature is currently selected
 * @property {boolean} expanded - Whether the inline prose body is expanded
 * @property {boolean} [readOnly] - When true, toggle is disabled
 * @property {() => void} onToggle - Called when the toggle button is clicked
 * @property {() => void} onExpand - Called when the expand chevron is clicked
 * @property {() => void} [onFocus] - Called when the open-source button is clicked, to focus the shard for the detail panel
 * @property {ContentShardType} contentType - API path segment for the shard route
 * @property {string} contentSlug - Slug of the parent content item
 * @property {string} contentKey - Heading key to fetch within the content item
 * @property {string} [cachedText] - Optional pre-fetched body text
 * @property {string} bodyId - DOM id for aria-controls
 * @property {string} expandLabel - Accessible label for the expand button
 * @property {string} [openLabel] - Accessible label for the open-source button (only used when `onFocus` is provided)
 * @property {ReactNode} [subOptions] - Optional sub-option selector rendered beneath the card row
 */
export interface FeatureCardProps {
  label: string;
  badge?: ReactNode;
  selected: boolean;
  expanded: boolean;
  readOnly?: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onFocus?: () => void;
  contentType: ContentShardType;
  contentSlug: string;
  contentKey: string;
  cachedText?: string;
  bodyId: string;
  expandLabel: string;
  openLabel?: string;
  subOptions?: ReactNode;
}

/**
 * Generic feature card used by picker lists (FeatPicker, BoonPicker).
 * The open-source button focuses the shard for the right detail panel; the
 * toggle selects/deselects and the chevron expands inline prose — neither
 * focuses the shard. The inline expand body fetches prose lazily on first
 * expand.
 *
 * @component
 * @param {FeatureCardProps} props - Component props
 * @param {string} props.label - Feature name shown on the toggle button
 * @param {ReactNode} [props.badge] - Optional badge content (BP cost, prereq)
 * @param {boolean} props.selected - Whether the feature is selected
 * @param {boolean} props.expanded - Whether the inline prose body is expanded
 * @param {boolean} [props.readOnly=false] - When true, the toggle is disabled
 * @param {Function} props.onToggle - Select/deselect the feature
 * @param {Function} props.onExpand - Toggle the inline prose body
 * @param {Function} [props.onFocus] - Focus the shard for the detail panel
 * @param {ContentShardType} props.contentType - API path segment for the shard route
 * @param {string} props.contentSlug - Slug of the parent content item
 * @param {string} props.contentKey - Heading key to fetch within the content item
 * @param {string} [props.cachedText] - Optional pre-fetched body text
 * @param {string} props.bodyId - DOM id for aria-controls
 * @param {string} props.expandLabel - Accessible label for the expand button
 * @param {string} [props.openLabel] - Accessible label for the open-source button
 * @param {ReactNode} [props.subOptions] - Optional sub-option selector rendered beneath the card row
 * @returns {JSX.Element} Rendered feature card
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  label,
  badge,
  selected,
  expanded,
  readOnly = false,
  onToggle,
  onExpand,
  onFocus,
  contentType,
  contentSlug,
  contentKey,
  cachedText,
  bodyId,
  expandLabel,
  openLabel,
  subOptions,
}) => {
  const Chevron = expanded ? ChevronDown : ChevronRight;

  const handleToggle = () => {
    if (readOnly) return;
    onToggle();
  };

  const handleExpand = () => {
    onExpand();
  };

  return (
    <li className={`${styles.boonCard} ${selected ? styles.boonSelected : ''}`}>
      <div className={expandStyles.boonRow}>
        <button
          type='button'
          className={styles.boonToggleBtn}
          onClick={handleToggle}
          aria-disabled={readOnly}
          aria-pressed={selected}>
          <span className={styles.boonName}>{label}</span>
          {badge && <span className={styles.boonBpBadge}>{badge}</span>}
        </button>
        <div className={expandStyles.boonActions}>
          {onFocus && (
            <button
              type='button'
              className={expandStyles.boonExpandBtn}
              onClick={onFocus}
              aria-label={openLabel}>
              <SquareArrowOutUpRight size={14} aria-hidden='true' />
            </button>
          )}
          <button
            type='button'
            className={expandStyles.boonExpandBtn}
            onClick={handleExpand}
            aria-expanded={expanded}
            aria-controls={bodyId}
            aria-label={expandLabel}>
            <Chevron size={14} aria-hidden='true' />
          </button>
        </div>
      </div>
      {subOptions}
      {expanded && (
        <ContentExpandBody
          contentType={contentType}
          contentSlug={contentSlug}
          contentKey={contentKey}
          cachedText={cachedText}
          id={bodyId}
        />
      )}
    </li>
  );
};
