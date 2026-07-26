/**
 * @fileoverview Overview Tab
 * @description Two-column overview: granted proficiencies, skills and trades on
 * the left; attacks, selected shard chips, and notes on the right. Phone
 * viewports get the same blocks arranged as a tab strip by
 * {@link MobileOverviewTab}.
 *
 * This file holds arrangement only — every block reads the character itself, so
 * the two layouts share their content rather than mirroring it.
 *
 * @module lib/components/characterSheet/tabs/overviewTab
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useIsMobileViewport } from '@/lib/hooks/useMediaQuery';
import { GrantedProficiencies } from '../stats/grantedProficiencies';
import { MobileOverviewTab } from './mobileOverviewTab';
import {
    AttacksPanel,
    HintLegend,
    NotesPanel,
    SelectedShardClouds,
    SkillsPanel,
    TradesPanel,
} from './overview/overviewPanels';
import styles from './tabs.module.scss';

/**
 * Overview tab content. Switches to the phone layout on narrow viewports.
 *
 * @component
 * @returns {JSX.Element} Rendered tab body
 */
export const OverviewTab: React.FC = () => {
  const isMobile = useIsMobileViewport();

  if (isMobile === true) return <MobileOverviewTab />;

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        <GrantedProficiencies />
        <div className={styles.skillsToolsRow}>
          <SkillsPanel />
          <TradesPanel />
        </div>
        <HintLegend />
      </div>

      <div className={styles.column}>
        <AttacksPanel />
        <SelectedShardClouds />
        <NotesPanel />
      </div>
    </div>
  );
};
