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
import { CreatureCombobox } from '@/lib/components/encounterPlanner/comboboxes';
import { getMonsterBySlug, MonsterData } from '@/lib/utils/monsterCache';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { QuantityPopup } from './quantityPopup';
import styles from './monsterImporter.module.scss';

const log = logger.child({ module: 'MonsterImporter' });

/**
 * Props for MonsterImporter component
 * 
 * @interface MonsterImporterProps
 * @property {string} locale - Current locale for API requests and translations
 * @property {(monsterData: MonsterData, quantity: number) => void} onImport - Callback when creatures are confirmed
 * @property {boolean} [disabled] - Whether the importer is disabled
 */
export interface MonsterImporterProps {
  locale: string;
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
 * @param {string} props.locale - Locale for API requests
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
  locale,
  onImport,
  disabled = false,
}) => {
  const t = useTranslations('encounterPlanner');
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatureSelect = useCallback(
    (slug: string, title: string) => {
      if (disabled || isLoading) return;
      setPendingImport({ slug, title });
    },
    [disabled, isLoading]
  );

  const handleConfirm = useCallback(
    async (quantity: number) => {
      if (!pendingImport) return;

      setIsLoading(true);
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
          locale
        });
      } finally {
        setIsLoading(false);
        setPendingImport(null);
      }
    },
    [pendingImport, locale, onImport]
  );

  const handleCancel = useCallback(() => {
    setPendingImport(null);
  }, []);

  return (
    <div className={styles.monsterImporter}>
      <div className={styles.comboboxContainer}>
        <CreatureComboboxWithTitle
          locale={locale}
          onSelect={handleCreatureSelect}
          disabled={disabled || isLoading || pendingImport !== null}
        />
      </div>
      
      {pendingImport && (
        <div className={styles.popupContainer}>
          <QuantityPopup
            isOpen={true}
            creatureName={pendingImport.title}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            confirmLabel={t('addCreature')}
            cancelLabel={t('cancel')}
            quantityLabel={t('quantity')}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Props for CreatureComboboxWithTitle wrapper
 * 
 * @interface CreatureComboboxWithTitleProps
 * @property {string} locale - Locale for API requests
 * @property {(slug: string, title: string) => void} onSelect - Callback with slug AND title
 * @property {boolean} [disabled] - Whether combobox is disabled
 */
interface CreatureComboboxWithTitleProps {
  locale: string;
  onSelect: (slug: string, title: string) => void;
  disabled?: boolean;
}

/**
 * Wrapper around CreatureCombobox that passes both slug and title on selection.
 * The underlying CreatureCombobox only passes slug, but we need title for display.
 * 
 * @component
 * @param {CreatureComboboxWithTitleProps} props - Component props
 * @param {string} props.locale - Locale for API requests
 * @param {(slug: string, title: string) => void} props.onSelect - Callback with slug AND title
 * @param {boolean} [props.disabled] - Whether the combobox is disabled
 * @returns {JSX.Element} Rendered combobox wrapper
 */
const CreatureComboboxWithTitle: React.FC<CreatureComboboxWithTitleProps> = ({
  locale,
  onSelect,
  disabled = false,
}) => {
  const [monsterIndex, setMonsterIndex] = useState<Array<{ slug: string; title: string }>>([]);

  const handleSelect = useCallback(
    (slug: string) => {
      const monster = monsterIndex.find((m) => m.slug === slug);
      const title = monster?.title || slug;
      onSelect(slug, title);
    },
    [monsterIndex, onSelect]
  );

  return (
    <CreatureComboboxWrapper
      locale={locale}
      onSelect={handleSelect}
      onIndexLoaded={setMonsterIndex}
      disabled={disabled}
    />
  );
};

/**
 * Props for CreatureComboboxWrapper
 * 
 * @interface CreatureComboboxWrapperProps
 * @property {string} locale - Locale for API requests
 * @property {(slug: string) => void} onSelect - Callback when creature selected
 * @property {(index: Array<{ slug: string; title: string }>) => void} onIndexLoaded - Callback when index loads
 * @property {boolean} [disabled] - Whether combobox is disabled
 */
interface CreatureComboboxWrapperProps {
  locale: string;
  onSelect: (slug: string) => void;
  onIndexLoaded: (index: Array<{ slug: string; title: string }>) => void;
  disabled?: boolean;
}

/**
 * Internal wrapper that hooks into CreatureCombobox's data loading.
 * Uses the existing CreatureCombobox but captures the loaded index.
 * 
 * @component
 * @param {CreatureComboboxWrapperProps} props - Component props
 * @param {string} props.locale - Locale for API requests
 * @param {(slug: string) => void} props.onSelect - Callback when creature is selected
 * @param {(index: Array<{ slug: string; title: string }>) => void} props.onIndexLoaded - Callback when monster index loads
 * @param {boolean} [props.disabled] - Whether the combobox is disabled
 * @returns {JSX.Element} Rendered creature combobox with index capture
 */
const CreatureComboboxWrapper: React.FC<CreatureComboboxWrapperProps> = ({
  locale,
  onSelect,
  onIndexLoaded,
  disabled = false,
}) => {
  const [hasLoadedRef] = useState({ loaded: false });

  const handleIndexData = useCallback(
    (data: Array<{ slug: string; title: string }>) => {
      if (!hasLoadedRef.loaded && data.length > 0) {
        hasLoadedRef.loaded = true;
        onIndexLoaded(data);
      }
    },
    [onIndexLoaded, hasLoadedRef]
  );

  return (
    <CreatureComboboxWithCapture
      locale={locale}
      onSelect={onSelect}
      onDataCapture={handleIndexData}
      disabled={disabled}
    />
  );
};

/**
 * Props for CreatureComboboxWithCapture
 * 
 * @interface CreatureComboboxWithCaptureProps
 * @property {string} locale - Locale for API requests
 * @property {(slug: string) => void} onSelect - Callback when creature selected
 * @property {(data: Array<{ slug: string; title: string }>) => void} onDataCapture - Callback with loaded data
 * @property {boolean} [disabled] - Whether combobox is disabled
 */
interface CreatureComboboxWithCaptureProps {
  locale: string;
  onSelect: (slug: string) => void;
  onDataCapture: (data: Array<{ slug: string; title: string }>) => void;
  disabled?: boolean;
}

/**
 * Modified creature combobox that captures loaded data for parent components.
 * This allows the MonsterImporter to know the title of selected creatures.
 * 
 * @component
 * @param {CreatureComboboxWithCaptureProps} props - Component props
 * @param {string} props.locale - Locale for API requests
 * @param {(slug: string) => void} props.onSelect - Callback when creature is selected
 * @param {(data: Array<{ slug: string; title: string }>) => void} props.onDataCapture - Callback with loaded data for parent components
 * @param {boolean} [props.disabled] - Whether the combobox is disabled
 * @returns {JSX.Element} Rendered combobox with data capture
 */
const CreatureComboboxWithCapture: React.FC<CreatureComboboxWithCaptureProps> = ({
  locale,
  onSelect,
  onDataCapture,
  disabled = false,
}) => {
  const t = useTranslations('encounterPlanner');
  const [monsterIndex, setMonsterIndex] = useState<
    Array<{ slug: string; title: string; cr: string; size: string; creatureType: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadMonsterIndex = useCallback(async () => {
    if (monsterIndex.length > 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/monsters/index?locale=${locale}`);
      const data = await response.json();
      const mappedData = data.map((monster: any) => ({
        ...monster,
        id: monster.slug,
        searchableText: `${monster.title} ${monster.creatureType} ${monster.size} ${monster.cr} ${monster.slug}`,
      }));
      setMonsterIndex(mappedData);
      onDataCapture(mappedData);
    } catch (error) {
      log.error('Failed to load monster index', {
        error: error instanceof Error ? error.message : String(error),
        locale
      });
    } finally {
      setIsLoading(false);
    }
  }, [locale, monsterIndex.length, onDataCapture]);

  const handleFocus = useCallback(() => {
    loadMonsterIndex();
  }, [loadMonsterIndex]);

  const handleSelectWithTitle = useCallback(
    (slug: string) => {
      onSelect(slug);
      setSearchQuery('');
    },
    [onSelect]
  );

  const filteredItems = searchQuery.trim()
    ? monsterIndex.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.creatureType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : monsterIndex;

  return (
    <div className={styles.comboboxWrapper}>
      <input
        type="text"
        className={styles.comboboxInput}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={handleFocus}
        placeholder={isLoading ? 'Loading...' : t('searchCreatures')}
        disabled={disabled || isLoading}
        aria-label={t('searchCreatures')}
      />
      
      {searchQuery && filteredItems.length > 0 && !disabled && (
        <ul className={styles.dropdown}>
          {filteredItems.slice(0, 50).map((monster) => (
            <li
              key={monster.slug}
              className={styles.dropdownItem}
              onClick={() => handleSelectWithTitle(monster.slug)}
            >
              <span className={styles.monsterTitle}>{monster.title}</span>
              <span className={styles.monsterMeta}>
                {monster.size} {monster.creatureType} • CR {monster.cr}
              </span>
            </li>
          ))}
        </ul>
      )}
      
      {searchQuery && filteredItems.length === 0 && !isLoading && (
        <div className={styles.noResults}>{t('noCreaturesFound')}</div>
      )}
    </div>
  );
};

MonsterImporter.displayName = 'MonsterImporter';
