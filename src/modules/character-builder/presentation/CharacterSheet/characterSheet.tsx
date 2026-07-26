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

import { useIsMobileViewport } from '@/lib/hooks/useMediaQuery';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import {
  ActiveSheetProvider,
  useActiveSheet,
  useSheetData,
  type SheetTabId,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { deriveGrantFloors } from '@/modules/character-builder/lib/utils/grants';
import { syncHitDiceLog } from '@/modules/character-builder/lib/utils/hitDiceSync';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { GradientTabs } from '../../../../lib/components/ui/gradientTabs';
import { CharacterSheetHeader } from '../Header/characterSheetHeader';
import { PagePreviewHost } from '../PagePreview/pagePreviewHost';
import { PagePreviewProvider } from '../PagePreview/pagePreviewProvider';
import { AbilityScoreBlock } from '../stats/abilityScoreBlock';
import { CombatStatChips } from '../stats/combatStatChips';
import { AbilitiesTab } from '../tabs/abilities/AbilitiesTab';
import { BibliographyTab } from '../tabs/bibliographyTab';
import { BloodlineTab } from '../tabs/bloodlineTab';
import { EquipmentTab } from '../tabs/equipmentTab';
import { FeatsTab } from '../tabs/featsTab';
import { OverviewTab } from '../tabs/overviewTab';
import { VocationTab } from '../tabs/vocationTab';
import styles from './characterSheet.module.scss';

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
 * @property {string | null} [startEditingId] - When it matches `character.id`, the sheet opens in edit mode (for freshly-created characters)
 */
export interface CharacterSheetProps {
  character: CharacterSheetType;
  startEditingId?: string | null;
}

/**
 * Full character sheet view. Wraps the body in an `ActiveSheetProvider`
 * so every descendant can read state and call mutators via context hooks
 * instead of prop drilling.
 *
 * @component
 * @param {CharacterSheetProps} props - Component props
 * @param {CharacterSheetType} props.character - The character sheet to display
 * @param {string | null} [props.startEditingId] - Opens the sheet in edit mode when it matches `character.id`
 * @returns {JSX.Element} Rendered character sheet
 */
export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character,
  startEditingId,
}) => (
  <PagePreviewProvider>
    <ActiveSheetProvider character={character} startEditingId={startEditingId}>
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
  const data = useSheetData();
  const { editing, activeTab, mutators } = useActiveSheet();
  const { patch, patchAbility, setActiveTab } = mutators;
  const isMobile = useIsMobileViewport();
  const grantFloors = useMemo(() => deriveGrantFloors(data), [data]);

  useEffect(() => {
    const update = syncHitDiceLog(data);
    if (update) patch(update);
  }, [data, patch]);

  const tabs = useMemo(
    () => [
      { value: 'overview', label: t('tabOverview') },
      { value: 'bloodline', label: t('tabBloodline') },
      { value: 'vocation', label: t('tabVocation') },
      { value: 'feats', label: t('tabFeats') },
      { value: 'equipment', label: t('tabEquipment') },
      { value: 'abilities', label: t('tabAbilities') },
      { value: 'bibliography', label: t('tabBibliography') },
    ],
    [t],
  );

  const activePanel = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'bloodline':
        return <BloodlineTab />;
      case 'vocation':
        return <VocationTab />;
      case 'feats':
        return <FeatsTab />;
      case 'equipment':
        return <EquipmentTab />;
      case 'abilities':
        return <AbilitiesTab />;
      case 'bibliography':
        return <BibliographyTab />;
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <article
      className={styles.characterSheet}
      aria-label={t('ariaCharacterSheet', { name: data.name })}>
      <CharacterSheetHeader />

      <section className={styles.statsRow} aria-label={t('ariaAbilityScores')}>
        <div className={styles.abilityRow}>
          {ABILITY_KEYS.map(({ key, label }) => (
            <AbilityScoreBlock
              key={key}
              label={label}
              score={data.abilityScores[key]}
              saveTier={data.savingThrows?.[key] ?? 'none'}
              saveFloor={grantFloors.savingThrows[key] ?? 'none'}
              tierBonus={data.tierBonus}
              editing={editing}
              onChange={(score) => patchAbility(key, score)}
              onSaveTierChange={(tier) =>
                patch({
                  savingThrows: {
                    ...(data.savingThrows ?? {}),
                    [key]: tier,
                  },
                })
              }
            />
          ))}
        </div>

        <CombatStatChips />
      </section>

      <div>
        <GradientTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(v) => setActiveTab(v as TabId)}
          variant={isMobile === true ? 'compact' : 'default'}>
          {activePanel}
        </GradientTabs>
      </div>
    </article>
  );
};
