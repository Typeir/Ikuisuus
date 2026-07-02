/**
 * @fileoverview Feature Card Component
 * @description Generic toggleable card for feature lists (feats, boons).
 * Renders a row with a toggle button (select/deselect), an expand chevron
 * for inline prose, and an optional badge. Any click on the card sets the
 * focused shard for the right detail panel.
 *
 * @module lib/components/characterSheet/builder/featureCard
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
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
 * @property {() => void} [onFocus] - Called on any card interaction (toggle or expand) to set the focused shard
 * @property {ContentShardType} contentType - API path segment for the shard route
 * @property {string} contentSlug - Slug of the parent content item
 * @property {string} contentKey - Heading key to fetch within the content item
 * @property {string} [cachedText] - Optional pre-fetched body text
 * @property {string} bodyId - DOM id for aria-controls
 * @property {string} expandLabel - Accessible label for the expand button
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
}

/**
 * Generic feature card used by picker lists (FeatPicker, BoonPicker).
 * Clicking the toggle or expand button sets the focused shard for the
 * right detail panel. The inline expand body fetches and renders prose
 * content lazily on first expand.
 *
 * @component
 * @param {FeatureCardProps} props - Component props
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
    <li
      className={`${styles.boonCard} ${selected ? styles.boonSelected : ''}`}
      onClick={() => onFocus?.()}>
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
