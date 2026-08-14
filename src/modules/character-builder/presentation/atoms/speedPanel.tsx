/**
 * @fileoverview Speed panel component.
 * @description Expandable panel triggered by a ▼ button next to the SPEED
 * value; lists all movement speeds from the selected bloodline. Renders a `+`
 * badge when more than one speed mode is available.
 *
 * Open/close state and portal rendering are delegated to {@link DropdownPanel}.
 *
 * @module lib/components/characterSheet/atoms/speedPanel
 * @version 2.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import { Measure } from '@/modules/library/presentation/components/Measure';
import { DropdownPanel } from '@/modules/character-builder/presentation/atoms/dropdownPanel';
import { useTranslations } from 'next-intl';
import styles from './speedPanel.module.scss';

/**
 * Props for the SpeedPanel component.
 *
 * @interface SpeedPanelProps
 * @property {string[]} bloodlineSpeeds - Native speed strings from the active bloodline (e.g. `["Walk: 6 stride", "Fly: 12 stride"]`)
 */
export interface SpeedPanelProps {
  bloodlineSpeeds: string[];
}

/**
 * Expandable speed modes panel. Renders a ▼ button next to the SPEED value;
 * opens a dropdown listing every movement mode the bloodline provides. A `+`
 * badge appears when there are two or more speed entries.
 *
 * @component
 * @param {SpeedPanelProps} props - Component props
 * @param {string[]} props.bloodlineSpeeds - Native speed strings from the active bloodline (e.g. `["Walk: 6 stride", "Fly: 12 stride"]`)
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
          <Measure text={speed} />
        </div>
      ))}
    </DropdownPanel>
  );
};
