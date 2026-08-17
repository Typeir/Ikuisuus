/**
 * @fileoverview Mobile Overview Tab.
 * @description Phone-layout overview: tab strip (skills / trades / attacks / notes)
 * above selected-shard chip clouds. Blocks live in `./overview/overviewPanels`.
 *
 * @module modules/character-builder/presentation/tabs/mobileOverviewTab
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { Tab, TabList, TabPanel, Tabs } from '@/lib/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
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

/** Overview section tab value on phone layouts. */
type OverviewSection = 'skills' | 'trades' | 'attacks' | 'notes';

/**
 * Mobile (≤phone) overview layout with tabbed sections + shard clouds.
 *
 * @component
 * @returns {JSX.Element} Rendered mobile overview
 */
export const MobileOverviewTab: React.FC = () => {
  const t = useTranslations('characterSheet');
  const [section, setSection] = useState<OverviewSection>('skills');

  return (
    <div className={styles.column}>
      <Tabs
        value={section}
        onChange={(v) => setSection(v as OverviewSection)}
        variant='nested'
        ariaLabel={t('ariaOverviewSections')}>
        <TabList ariaLabel={t('ariaOverviewSections')}>
          <Tab value='skills'>{t('overviewSkills')}</Tab>
          <Tab value='trades'>{t('overviewTrades')}</Tab>
          <Tab value='attacks'>{t('overviewAttacks')}</Tab>
          <Tab value='notes'>{t('overviewNotes')}</Tab>
        </TabList>

        <TabPanel value='skills'>
          <div className={styles.chipAnchor}>
            <SkillsPanel />
            <HintLegend />
          </div>
        </TabPanel>
        <TabPanel value='trades'>
          <TradesPanel />
        </TabPanel>
        <TabPanel value='attacks'>
          <AttacksPanel />
        </TabPanel>
        <TabPanel value='notes'>
          <NotesPanel />
        </TabPanel>
      </Tabs>

      <AspectSummary />
      <SelectedShardClouds />
    </div>
  );
};
