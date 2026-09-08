/**
 * @fileoverview Overview Tab
 * @description Two-column overview
 *
 * @module modules/character-builder/presentation/tabs/overviewTab
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useIsMobileViewport } from '@/lib/hooks/useMediaQuery';
import { GrantedProficiencies } from '../stats/grantedProficiencies';
import { MobileOverviewTab } from './mobileOverviewTab';
import {
    AspectSummary,
    AttacksPanel,
    HintLegend,
    NotesPanel,
    SelectedShardClouds,
    SkillsPanel,
    TradesPanel,
} from './overview/overviewPanels';
import styles from './tabs.module.scss';

/**
 * Overview tab content.
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
        <AspectSummary />
        <SelectedShardClouds />
        <NotesPanel />
      </div>
    </div>
  );
};
