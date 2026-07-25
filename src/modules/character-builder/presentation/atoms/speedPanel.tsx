/**
 * @fileoverview Speed Panel Component
 * @description Expandable panel triggered by a ▼ button adjacent to the SPEED
 * value. Shows all movement speeds from the character's selected bloodline.
 * A `+` badge is displayed when more than one speed mode is available.
 *
 * Panel open/close state and portal rendering are delegated to
 * {@link DropdownPanel}, which escapes parent stacking contexts.
 *
 * @module lib/components/characterSheet/atoms/speedPanel
 * @version 2.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import { DropdownPanel } from '@/modules/character-builder/presentation/atoms/dropdownPanel';
import { useTranslations } from 'next-intl';
import styles from './speedPanel.module.scss';

/**
 * Props for the SpeedPanel component.
 *
 * @interface SpeedPanelProps
 * @property {string[]} bloodlineSpeeds - Raw speed strings from the active bloodline (e.g. `["Walk: 30 ft.", "Fly: 60 ft."]`)
 */
export interface SpeedPanelProps {
  bloodlineSpeeds: string[];
}

/**
 * Expandable speed modes panel. Renders a ▼ button next to the SPEED value;
 * clicking opens a small dropdown listing every movement mode the bloodline
 * provides. A `+` badge appears when there are two or more speed entries.
 *
 * @component
 * @param {SpeedPanelProps} props - Component props
 * @param {string[]} props.bloodlineSpeeds - Raw speed strings from the active bloodline (e.g. `["Walk: 30 ft.", "Fly: 60 ft."]`)
 * @returns {JSX.Element | null} Rendered wrapper, or null when no speeds are available
 */
export const SpeedPanel: React.FC<SpeedPanelProps> = ({ bloodlineSpeeds }) => {
  const t = useTranslations('characterSheet');
  if (bloodlineSpeeds.length === 0) return null;

  const hasMultiple = bloodlineSpeeds.length > 1;

  const badge = hasMultiple ? (
    <span className={styles.badge} aria-hidden='true'>
      +
    </span>
  ) : undefined;

  return (
    <DropdownPanel
      triggerLabel={t('speedPanelTrigger')}
      badge={badge}
      triggerClassName={styles.trigger}
      panelClassName={styles.panel}
      panelRole='list'
      panelLabel={t('speedPanelLabel')}>
      {bloodlineSpeeds.map((speed, i) => (
        <div key={i} className={styles.speedRow} role='listitem'>
          {speed}
        </div>
      ))}
    </DropdownPanel>
  );
};
