/**
 * @fileoverview Vocation-pick Hint Marker
 * @description Hint asterisk for a skill/trade a vocation offers as a free base
 * pick. Never disables or restricts the row. Renders nothing when `show` is false.
 *
 * @module modules/character-builder/presentation/atoms/hintMarker
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from './hintMarker.module.scss';

/**
 * Props for `<HintMarker>`.
 *
 * @interface HintMarkerProps
 * @property {boolean} show - Whether the marker should render
 */
export interface HintMarkerProps {
  show: boolean;
}

/**
 * Renders the vocation-pick hint asterisk with a screen-reader label and a
 * hover tooltip, or nothing when `show` is false.
 *
 * @component
 * @param {HintMarkerProps} props - Component props
 * @param {boolean} props.show - Whether the marker should render
 * @returns {JSX.Element | null} The hint marker, or null when hidden
 */
const HintMarkerImpl: React.FC<HintMarkerProps> = ({ show }) => {
  const t = useTranslations('characterSheet');
  if (!show) return null;
  return (
    <span
      className={styles.hintMarker}
      role='img'
      aria-label={t('ariaVocationPickHint')}
      title={t('hintVocationPick')}>
      *
    </span>
  );
};

/** Memoized `HintMarker` export. */
export const HintMarker = memo(HintMarkerImpl);
