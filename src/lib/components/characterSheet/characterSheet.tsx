/**
 * @fileoverview Character Sheet Component
 * @description Tabbed character sheet view. Renders a sticky header
 * (`<CharacterSheetHeader>`) with name + level + bloodline / vocation /
 * specialization selectors + edit controls, and a five-tab body
 * (Overview / Bloodline / Vocation / Equipment / Feats). All tabs are wrapped
 * in a `<PagePreviewProvider>` so library-page tooltips can open draggable
 * iframes anywhere inside the sheet.
 *
 * @module lib/components/characterSheet/characterSheet
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useCharacterSheetDispatch } from '@/lib/context/CharacterSheetContext';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { CHARACTER_SHEET_ACTION_TYPES } from '@/lib/types/characterSheet';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from '../ui/tabs';
import { AbilityScoreBlock } from './abilityScoreBlock';
import styles from './characterSheet.module.scss';
import { CharacterSheetHeader } from './characterSheetHeader';
import { PagePreviewHost } from './pagePreviewHost';
import { PagePreviewProvider } from './pagePreviewProvider';
import { BloodlineTab } from './tabs/bloodlineTab';
import { EquipmentTab } from './tabs/equipmentTab';
import { FeatsTab } from './tabs/featsTab';
import { OverviewTab } from './tabs/overviewTab';
import { VocationTab } from './tabs/vocationTab';

/** Ordered ability keys for rendering the six-block row. */
const ABILITY_KEYS: Array<{
  key: keyof CharacterSheetType['abilityScores'];
  label: string;
}> = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' },
  { key: 'wis', label: 'WIS' },
  { key: 'cha', label: 'CHA' },
];

/** Available tabs in the character sheet. */
type TabId = 'overview' | 'bloodline' | 'vocation' | 'equipment' | 'feats';

/**
 * Props for the CharacterSheet component.
 *
 * @interface CharacterSheetProps
 * @property {CharacterSheetType} character - The character sheet to display
 * @property {string} [locale] - Content locale for library iframes (default `en`)
 */
export interface CharacterSheetProps {
  character: CharacterSheetType;
  locale?: string;
}

/**
 * Full character sheet view with read/edit toggle and tabbed body.
 * Reads from and writes to the CharacterSheetContext reducer.
 *
 * @component
 * @param {CharacterSheetProps} props - Component props
 * @returns {JSX.Element} Rendered character sheet
 */
export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character,
  locale = 'en',
}) => {
  const dispatch = useCharacterSheetDispatch();
  const t = useTranslations('characterSheet');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CharacterSheetType>(character);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const handleSave = useCallback(() => {
    dispatch({
      type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
      payload: { character: draft },
    });
    setEditing(false);
  }, [dispatch, draft]);

  const handleCancel = useCallback(() => {
    setDraft(character);
    setEditing(false);
  }, [character]);

  const handleEdit = useCallback(() => {
    setDraft(character);
    setEditing(true);
  }, [character]);

  const handleChange = useCallback(
    (patch: Partial<CharacterSheetType>) => {
      setDraft((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const data = editing ? draft : character;

  return (
    <PagePreviewProvider>
      <article
        className={styles.characterSheet}
        aria-label={t('ariaCharacterSheet', { name: data.name })}>
        <CharacterSheetHeader
          data={data}
          editing={editing}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onChange={handleChange}
          locale={locale}
        />

        <section
          className={styles.abilityRow}
          aria-label={t('ariaAbilityScores')}>
          {ABILITY_KEYS.map(({ key, label }) => (
            <AbilityScoreBlock
              key={key}
              label={label}
              score={data.abilityScores[key]}
            />
          ))}
        </section>

        <Tabs
          value={activeTab}
          onChange={(v) => setActiveTab(v as TabId)}
          ariaLabel={t('ariaTabs')}>
          <TabList>
            <Tab value='overview'>{t('tabOverview')}</Tab>
            <Tab value='bloodline'>{t('tabBloodline')}</Tab>
            <Tab value='vocation'>{t('tabVocation')}</Tab>
            <Tab value='equipment'>{t('tabEquipment')}</Tab>
            <Tab value='feats'>{t('tabFeats')}</Tab>
          </TabList>

          <TabPanel value='overview'>
            <OverviewTab data={data} editing={editing} onChange={handleChange} />
          </TabPanel>
          <TabPanel value='bloodline'>
            <BloodlineTab
              data={data}
              editing={editing}
              onChange={handleChange}
              locale={locale}
            />
          </TabPanel>
          <TabPanel value='vocation'>
            <VocationTab data={data} locale={locale} />
          </TabPanel>
          <TabPanel value='equipment'>
            <EquipmentTab data={data} editing={editing} onChange={handleChange} />
          </TabPanel>
          <TabPanel value='feats'>
            <FeatsTab data={data} editing={editing} onChange={handleChange} />
          </TabPanel>
        </Tabs>
      </article>
      <PagePreviewHost locale={locale} />
    </PagePreviewProvider>
  );
};
