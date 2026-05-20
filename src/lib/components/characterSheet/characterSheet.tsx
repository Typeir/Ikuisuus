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
import { CharacterSheetEditProvider } from '@/lib/context/CharacterSheetEditContext';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { CHARACTER_SHEET_ACTION_TYPES } from '@/lib/types/characterSheet';
import { computeProficiencyBonus } from '@/lib/utils/characterStorage';
import { getXPForLevel, MAX_XP_LEVEL } from '@/lib/utils/xpProgression';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { GradientTabs } from '../ui/gradientTabs';
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

  const handleChange = useCallback((patch: Partial<CharacterSheetType>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      if (patch.vocations !== undefined) {
        const activeVocs = next.vocations.filter((v) => Boolean(v.slug));
        if (activeVocs.length > 0) {
          const totalLevel = activeVocs.reduce(
            (sum, v) => sum + (v.level ?? 1),
            0,
          );
          next.level = totalLevel;
          const floor = getXPForLevel(Math.min(totalLevel, MAX_XP_LEVEL));
          if ((next.experience ?? 0) < floor) {
            next.experience = floor;
          }
          next.proficiencyBonus = computeProficiencyBonus(totalLevel);
        }
      }
      return next;
    });
  }, []);

  const data = editing ? draft : character;

  const handleAbilityChange = useCallback(
    (key: keyof CharacterSheetType['abilityScores'], score: number) => {
      handleChange({
        abilityScores: { ...data.abilityScores, [key]: score },
      });
    },
    [handleChange, data.abilityScores],
  );

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

  const handleTabChange = useCallback((v: string) => {
    setActiveTab(v as TabId);
  }, []);

  const activePanel = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab data={data} editing={editing} onChange={handleChange} />
        );
      case 'bloodline':
        return (
          <BloodlineTab
            data={data}
            editing={editing}
            onChange={handleChange}
            locale={locale}
          />
        );
      case 'vocation':
        return <VocationTab data={data} locale={locale} />;
      case 'equipment':
        return (
          <EquipmentTab data={data} editing={editing} onChange={handleChange} />
        );
      case 'feats':
        return (
          <FeatsTab
            data={data}
            editing={editing}
            onChange={handleChange}
            locale={locale}
          />
        );
      default:
        return null;
    }
  }, [activeTab, data, editing, handleChange, locale]);

  return (
    <PagePreviewProvider>
      <CharacterSheetEditProvider
        data={data}
        editing={editing}
        onChange={handleChange}
        locale={locale}>
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
                editing={editing}
                onChange={(score) => handleAbilityChange(key, score)}
              />
            ))}
          </section>

          <div className={styles.tabsSection}>
            <GradientTabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={handleTabChange}>
              {activePanel}
            </GradientTabs>
          </div>
        </article>
      </CharacterSheetEditProvider>
      <PagePreviewHost locale={locale} />
    </PagePreviewProvider>
  );
};
