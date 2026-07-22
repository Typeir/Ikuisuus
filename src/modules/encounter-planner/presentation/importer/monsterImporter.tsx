/**
 * @fileoverview Monster Importer Component
 * @description Unified monster importer used by both Encounter Planner and Play Mode.
 * Combines CreatureCombobox with QuantityPopup for selecting creatures and specifying
 * how many to add. Uses cached monster data to minimize API calls.
 *
 * @module monsterImporter
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react
 * @requires next-intl
 * @requires @/lib/utils/monsterCache
 * @requires @/lib/components/encounterPlanner/comboboxes
 * @requires ./quantityPopup
 *
 * @example
 * ```tsx
 * <MonsterImporter
 *   locale="en"
 *   onImport={(monsterData, quantity) => {
 *     for (let i = 0; i < quantity; i++) {
 *       addCreature(createCreatureFromMonster(monsterData, locale));
 *     }
 *   }}
 * />
 * ```
 */

'use client';

import { logger } from '@/lib/logging/logger';
import {
    getMonsterBySlug,
    MonsterData,
} from '@/modules/encounter-planner/lib/utils/monsterCache';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import styles from './monsterImporter.module.scss';
import { QuantityPopup } from './quantityPopup';
import { useMonsterIndex } from './useMonsterIndex';

const log = logger.child({ module: 'MonsterImporter' });

/**
 * Props for MonsterImporter component
 *
 * @interface MonsterImporterProps
 * @property {(monsterData: MonsterData, quantity: number) => void} onImport - Callback when creatures are confirmed
 * @property {boolean} [disabled] - Whether the importer is disabled
 */
export interface MonsterImporterProps {
  onImport: (monsterData: MonsterData, quantity: number) => void;
  disabled?: boolean;
}

/**
 * Pending import state while waiting for user confirmation.
 *
 * @interface PendingImport
 * @property {string} slug - Monster slug for fetching full data
 * @property {string} title - Monster title for display in popup
 */
interface PendingImport {
  slug: string;
  title: string;
}

/**
 * Unified monster importer component for Encounter Planner and Play Mode.
 * Provides creature search via combobox and quantity selection via popup.
 *
 * Flow:
 * 1. User searches and selects a creature from combobox
 * 2. Quantity popup appears with default quantity of 1
 * 3. User adjusts quantity (optional) and confirms or cancels
 * 4. On confirm, fetches full monster data and calls onImport with quantity
 *
 * @component
 * @param {MonsterImporterProps} props - Component props
 * @param {(monsterData: MonsterData, quantity: number) => void} props.onImport - Callback with monster data and quantity
 * @param {boolean} [props.disabled] - Whether the importer is disabled
 * @returns {JSX.Element} Rendered monster importer
 *
 * @example
 * ```tsx
 * <MonsterImporter
 *   locale="en"
 *   onImport={(monster, qty) => {
 *     const creatures = Array(qty).fill(null).map(() =>
 *       createCreatureFromMonster(monster, locale)
 *     );
 *     addCreatures(creatures);
 *   }}
 * />
 * ```
 */
export const MonsterImporter: React.FC<MonsterImporterProps> = ({
  onImport,
  disabled = false,
}) => {
  const t = useTranslations('encounterPlanner');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { index, isLoading: indexLoading, loadIndex } = useMonsterIndex(locale);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(
    null,
  );
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreatureSelect = useCallback(
    (slug: string) => {
      if (disabled || isImporting) return;
      const monster = index.find((m) => m.slug === slug);
      setPendingImport({ slug, title: monster?.title || slug });
      setSearchQuery('');
    },
    [disabled, isImporting, index],
  );

  const handleConfirm = useCallback(
    async (quantity: number) => {
      if (!pendingImport) return;

      setIsImporting(true);
      try {
        const monsterData = await getMonsterBySlug(pendingImport.slug, locale);
        if (monsterData) {
          onImport(monsterData, quantity);
        } else {
          log.error('Monster not found', { slug: pendingImport.slug, locale });
        }
      } catch (error) {
        log.error('Failed to import creature', {
          error: error instanceof Error ? error.message : String(error),
          slug: pendingImport.slug,
          locale,
        });
      } finally {
        setIsImporting(false);
        setPendingImport(null);
      }
    },
    [pendingImport, locale, onImport],
  );

  const handleCancel = useCallback(() => {
    setPendingImport(null);
  }, []);

  const isDisabled = disabled || isImporting || pendingImport !== null;

  const filteredItems = searchQuery.trim()
    ? index.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.creatureType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.slug.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : index;

  return (
    <div className={styles.monsterImporter}>
      <div className={styles.comboboxContainer}>
        <div className={styles.comboboxWrapper}>
          <input
            type='text'
            className={styles.comboboxInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={loadIndex}
            placeholder={indexLoading ? tCommon('loading') : t('searchCreatures')}
            disabled={isDisabled || indexLoading}
            aria-label={t('searchCreatures')}
          />

          {searchQuery && filteredItems.length > 0 && !isDisabled && (
            <ul className={styles.dropdown}>
              {filteredItems.slice(0, 50).map((monster) => (
                <li
                  key={monster.slug}
                  className={styles.dropdownItem}
                  onClick={() => handleCreatureSelect(monster.slug)}>
                  <span className={styles.monsterTitle}>{monster.title}</span>
                  <span className={styles.monsterMeta}>
                    {monster.size} {monster.creatureType} - CR {monster.cr}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {searchQuery && filteredItems.length === 0 && !indexLoading && (
            <div className={styles.noResults}>{t('noCreaturesFound')}</div>
          )}
        </div>
      </div>

      {pendingImport && (
        <div className={styles.popupContainer}>
          <QuantityPopup
            isOpen={true}
            creatureName={pendingImport.title}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            confirmLabel={t('addCreature')}
            cancelLabel={tCommon('cancel')}
            quantityLabel={t('quantity')}
          />
        </div>
      )}
    </div>
  );
};

MonsterImporter.displayName = 'MonsterImporter';
