/**
 * @fileoverview Feature Card Component
 * @description Toggleable card for feature lists (feats, boons). Renders a
 * toggle button (select/deselect), an optional open-source button that focuses
 * the shard for the detail panel, an expand chevron, and an optional badge.
 *
 * @module lib/components/characterSheet/builder/featureCard
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import {
  ChevronDown,
  ChevronRight,
  Minus,
  SquareArrowOutUpRight,
} from 'lucide-react';
import type { ReactNode } from 'react';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import type { ContentShardType } from '../shards/contentShardPanel';
import expandStyles from './boonExpand.module.scss';
import { ContentExpandBody } from './contentExpandBody';
import { displayAspects } from '@/modules/library/domain/aspects';
import { AspectGlyphs } from '@/modules/library/presentation/components/Aspects/AspectGlyphs';

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
 * @property {FeatureCardMultiSelect} [multiSelect] - When present, the primary button adds an instance, a count chip and remove button appear, and `onToggle`/`selected` are ignored
 * @property {string[]} [aspects] - Aspects of the feature, shown as glyphs under the row
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
  multiSelect?: FeatureCardMultiSelect;
  aspects?: string[];
}

/**
 * Repeatable-selection controls for a {@link FeatureCard}. Used for feats
 * (such as Ability Score Improvement) that may be taken more than once.
 *
 * @interface FeatureCardMultiSelect
 * @property {number} count - How many instances are currently selected
 * @property {() => void} onAdd - Adds one instance (fired by the primary button)
 * @property {() => void} onRemove - Removes one instance (fired by the remove button)
 * @property {string} addLabel - Accessible label / tooltip for the add action
 * @property {string} removeLabel - Accessible label for the remove button
 * @property {string} countLabel - Rendered count chip text (e.g. `×2`)
 */
export interface FeatureCardMultiSelect {
  count: number;
  onAdd: () => void;
  onRemove: () => void;
  addLabel: string;
  removeLabel: string;
  countLabel: string;
}

/**
 * Feature card for picker lists (FeatPicker, BoonPicker). The open-source
 * button focuses the shard for the detail panel; the toggle selects/deselects
 * and the chevron expands inline prose. The inline expand body fetches prose
 * lazily on first expand.
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
 * @param {FeatureCardMultiSelect} [props.multiSelect] - Repeatable-selection controls; when present the primary button adds an instance and a count chip + remove button appear
 * @param {string[]} [props.aspects] - Aspects shown as glyphs under the row
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
  multiSelect,
  aspects,
}) => {
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const isSelected = multiSelect ? multiSelect.count > 0 : selected;

  const handlePrimary = () => {
    if (readOnly) return;
    if (multiSelect) multiSelect.onAdd();
    else onToggle();
  };

  const handleExpand = () => {
    onExpand();
  };

  return (
    <li className={`${styles.boonCard} ${isSelected ? styles.boonSelected : ''}`}>
      <div className={expandStyles.boonRow}>
        <button
          type='button'
          className={styles.boonToggleBtn}
          onClick={handlePrimary}
          aria-disabled={readOnly}
          aria-pressed={isSelected}
          title={multiSelect ? multiSelect.addLabel : undefined}>
          <span className={styles.boonName}>{label}</span>
          {badge && <span className={styles.boonBpBadge}>{badge}</span>}
          {multiSelect && multiSelect.count > 0 && (
            <span className={styles.boonBpBadge}>{multiSelect.countLabel}</span>
          )}
        </button>
        <div className={expandStyles.boonActions}>
          {multiSelect && multiSelect.count > 0 && !readOnly && (
            <button
              type='button'
              className={expandStyles.boonExpandBtn}
              onClick={multiSelect.onRemove}
              aria-label={multiSelect.removeLabel}>
              <Minus size={14} aria-hidden='true' />
            </button>
          )}
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
      {displayAspects(aspects).length > 0 && (
        <div className={expandStyles.boonAspects}>
          <AspectGlyphs tags={aspects} />
        </div>
      )}
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
