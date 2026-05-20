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

import {
  ActiveSheetProvider,
  useActiveSheet,
  type SheetTabId,
} from '@/lib/components/characterSheet/context/activeSheetContext';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { GradientTabs } from '../ui/gradientTabs';
import styles from './characterSheet.module.scss';
import { CharacterSheetHeader } from './header/characterSheetHeader';
import { PagePreviewHost } from './pagePreview/pagePreviewHost';
import { PagePreviewProvider } from './pagePreview/pagePreviewProvider';
import { AbilityScoreBlock } from './stats/abilityScoreBlock';
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
type TabId = SheetTabId;

/**
 * Props for the CharacterSheet component.
 *
 * @interface CharacterSheetProps
 * @property {CharacterSheetType} character - The character sheet to display
 */
export interface CharacterSheetProps {
  character: CharacterSheetType;
}

/**
 * Full character sheet view. Wraps the body in an `ActiveSheetProvider`
 * so every descendant can read state and call mutators via context hooks
 * instead of prop drilling.
 *
 * @component
 * @param {CharacterSheetProps} props - Component props
 * @returns {JSX.Element} Rendered character sheet
 */
export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character,
}) => (
  <PagePreviewProvider>
    <ActiveSheetProvider character={character}>
      <CharacterSheetBody />
    </ActiveSheetProvider>
    <PagePreviewHost />
  </PagePreviewProvider>
);

/**
 * Inner body of the character sheet. Reads all state from the active-sheet
 * context and renders the header, ability row, and active tab.
 *
 * @component
 * @returns {JSX.Element} Rendered sheet body
 */
const CharacterSheetBody: React.FC = () => {
  const t = useTranslations('characterSheet');
  const { data, editing, activeTab, mutators } = useActiveSheet();
  const { patch, patchAbility, beginEdit, saveEdit, cancelEdit, setActiveTab } =
    mutators;

  const tabs = useMemo(
    () => [
      { value: 'overview', label: t('tabOverview') },
      { value: 'bloodline', label: t('tabBloodline') },
      { value: 'vocation', label: t('tabVocation') },
      { value: 'equipment', label: t('tabEquipment') },
      { value: 'feats', label: t('tabFeats') },
    ],
    [t],
  );

  const activePanel = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab data={data} editing={editing} onChange={patch} />;
      case 'bloodline':
        return <BloodlineTab data={data} onChange={patch} />;
      case 'vocation':
        return <VocationTab data={data} />;
      case 'equipment':
        return <EquipmentTab data={data} editing={editing} onChange={patch} />;
      case 'feats':
        return <FeatsTab data={data} onChange={patch} />;
      default:
        return null;
    }
  }, [activeTab, data, editing, patch]);

  return (
    <article
      className={styles.characterSheet}
      aria-label={t('ariaCharacterSheet', { name: data.name })}>
      <CharacterSheetHeader
        data={data}
        editing={editing}
        onEdit={beginEdit}
        onSave={saveEdit}
        onCancel={cancelEdit}
        onChange={patch}
      />

      <section
        className={styles.abilityRow}
        aria-label={t('ariaAbilityScores')}>
        {ABILITY_KEYS.map(({ key, label }) => (
          <AbilityScoreBlock
            key={key}
            label={label}
            score={data.abilityScores[key]}
            editing={editing}
            onChange={(score) => patchAbility(key, score)}
          />
        ))}
      </section>

      <div className={styles.tabsSection}>
        <GradientTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(v) => setActiveTab(v as TabId)}>
          {activePanel}
        </GradientTabs>
      </div>
    </article>
  );
};
