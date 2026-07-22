/**
 * @fileoverview Vocation Tab
 * @description Two-level tabbed viewer for vocation data.
 *
 * - When the character has multiple vocation entries (mixing/multiclass), an outer
 *   tab strip switches between entries.
 * - Within each entry, an inner tab strip switches between the vocation view
 *   and the specialization view. Each view shows that section's feature list
 *   stacked above the matching `ContentShardPanel`.
 *
 * When a vocation entry has no specialization, the inner Specialization tab
 * is disabled. When no vocations exist, an empty prompt is shown.
 *
 * @module lib/components/characterSheet/tabs/vocationTab
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Tab, TabList, TabPanel, Tabs } from '@/lib/components/ui/tabs';
import type {
    CharacterSheet as CharacterSheetType,
    VocationEntry,
} from '@/lib/types/character';
import { ContentShardPanel } from '@/modules/character-builder/presentation/shards/contentShardPanel';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BuilderSplitPane } from '../builder/builderSplitPane';
import { VocationFeatureCard } from '../builder/vocationFeatureCard';
import styles from './tabs.module.scss';
import vocationStyles from './vocationTab.module.scss';

/**
 * Props for `<VocationTab>`.
 *
 * @interface VocationTabProps
 * @property {CharacterSheetType} data - Active character data
 */
export interface VocationTabProps {
  data: CharacterSheetType;
}

/** Inner-tab section value. */
type SectionTab = 'vocation' | 'specialization';

/**
 * Inner section tabs (Vocation / Specialization) for a single vocation entry.
 * Renders the matching feature list stacked above the `ContentShardPanel` for
 * each section. The Specialization tab is disabled when the entry has no
 * specialization slug.
 *
 * @component
 * @param {object} props - Component props
 * @param {VocationEntry} props.entry - Vocation entry to render
 * @param {string} props.fallbackVocationLabel - i18n label when entry has no vocation title
 * @param {string} props.fallbackSpecLabel - i18n label when entry has no specialization title
 * @param {'nested' | 'inset'} [props.variant='nested'] - Tab colour depth; `inset` when rendered inside the multiclass entry tabs
 * @returns {JSX.Element} Inner tabs
 */
const VocationEntryTabs: React.FC<{
  entry: VocationEntry;
  fallbackVocationLabel: string;
  fallbackSpecLabel: string;
  variant?: 'nested' | 'inset';
}> = ({ entry, fallbackVocationLabel, fallbackSpecLabel, variant = 'nested' }) => {
  const t = useTranslations('characterSheet');
  const hasSpec = !!entry.specializationSlug;
  const [active, setActive] = useState<SectionTab>('vocation');

  const vocationLabel = entry.title || fallbackVocationLabel;
  const specLabel = entry.specializationTitle || fallbackSpecLabel;

  return (
    <Tabs
      value={active}
      onChange={(v) => setActive(v as SectionTab)}
      variant={variant}
      ariaLabel={t('ariaVocationSectionTabs')}>
      <TabList ariaLabel={t('ariaVocationSectionTabs')}>
        <Tab value='vocation'>{vocationLabel}</Tab>
        <Tab value='specialization' disabled={!hasSpec}>
          {specLabel}
        </Tab>
      </TabList>

      <TabPanel value='vocation'>
        {entry.slug ? (
          <BuilderSplitPane
            id='builder.vocation.vocation'
            ariaLabel={vocationLabel}
            sheetTitle={t('shardPreviewTitle', { name: vocationLabel })}
            mobileTriggerLabel={t('viewShardDetails')}
            left={
              <div className={styles.column}>
                <VocationFeatureCard
                  section='vocation'
                  vocationFeatures={entry.vocationFeatures}
                  specializationFeatures={entry.specializationFeatures}
                  characterLevel={entry.level}
                  vocationTitle={vocationLabel}
                  hasVocation={!!entry.slug}
                  hideTitle
                />
              </div>
            }
            right={
              <ContentShardPanel contentType='vocations' slug={entry.slug} />
            }
          />
        ) : (
          <div className={styles.column}>
            <VocationFeatureCard
              section='vocation'
              vocationFeatures={entry.vocationFeatures}
              specializationFeatures={entry.specializationFeatures}
              characterLevel={entry.level}
              vocationTitle={vocationLabel}
              hasVocation={!!entry.slug}
              hideTitle
            />
          </div>
        )}
      </TabPanel>

      <TabPanel value='specialization'>
        {entry.specializationSlug ? (
          <BuilderSplitPane
            id='builder.vocation.specialization'
            ariaLabel={specLabel}
            sheetTitle={t('shardPreviewTitle', { name: specLabel })}
            mobileTriggerLabel={t('viewShardDetails')}
            left={
              <div className={styles.column}>
                <VocationFeatureCard
                  section='specialization'
                  vocationFeatures={entry.vocationFeatures}
                  specializationFeatures={entry.specializationFeatures}
                  characterLevel={entry.level}
                  specializationTitle={specLabel}
                  hasSpecialization={hasSpec}
                  hideTitle
                />
              </div>
            }
            right={
              <ContentShardPanel
                contentType='specializations'
                slug={entry.specializationSlug}
              />
            }
          />
        ) : (
          <div className={styles.column}>
            <VocationFeatureCard
              section='specialization'
              vocationFeatures={entry.vocationFeatures}
              specializationFeatures={entry.specializationFeatures}
              characterLevel={entry.level}
              specializationTitle={specLabel}
              hasSpecialization={hasSpec}
              hideTitle
            />
          </div>
        )}
      </TabPanel>
    </Tabs>
  );
};

/**
 * Vocation tab content. Renders the nothing-selected prompt when no vocations
 * are configured; otherwise renders an outer entry-tab strip (only when there
 * are 2+ entries) wrapping inner Vocation/Specialization tabs.
 *
 * @component
 * @param {VocationTabProps} props - Component props
 * @returns {JSX.Element} Rendered tab body
 */
export const VocationTab: React.FC<VocationTabProps> = ({ data }) => {
  const t = useTranslations('characterSheet');
  const [activeEntry, setActiveEntry] = useState<string>('0');

  if (data.vocations.length === 0) {
    return <div className={styles.empty}>{t('addVocationPrompt')}</div>;
  }

  const fallbackVocLabel = t('vocationFeatures');
  const fallbackSpecLabel = t('specializationFeatures');

  if (data.vocations.length === 1) {
    return (
      <div className={vocationStyles.entryContainer}>
        <VocationEntryTabs
          entry={data.vocations[0]}
          fallbackVocationLabel={fallbackVocLabel}
          fallbackSpecLabel={fallbackSpecLabel}
        />
      </div>
    );
  }

  return (
    <Tabs
      value={activeEntry}
      onChange={setActiveEntry}
      variant='nested'
      ariaLabel={t('ariaVocationEntryTabs')}>
      <TabList ariaLabel={t('ariaVocationEntryTabs')}>
        {data.vocations.map((entry, i) => {
          const vocPart = entry.title || `#${i + 1}`;
          const specPart = entry.specializationTitle
            ? ` / ${entry.specializationTitle}`
            : '';
          return (
            <Tab key={i} value={String(i)}>
              {`${vocPart}${specPart}`}
            </Tab>
          );
        })}
      </TabList>

      {data.vocations.map((entry, i) => (
        <TabPanel key={i} value={String(i)}>
          <div className={vocationStyles.entryContainer}>
            <VocationEntryTabs
              entry={entry}
              fallbackVocationLabel={fallbackVocLabel}
              fallbackSpecLabel={fallbackSpecLabel}
              variant='inset'
            />
          </div>
        </TabPanel>
      ))}
    </Tabs>
  );
};
