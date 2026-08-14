/**
 * @fileoverview Granted Proficiencies Strip
 * @description Read-only digest of the proficiencies a character's active
 * features and feats confer via grant tags. Derived from the character's shards.
 *
 * @module modules/character-builder/presentation/stats/grantedProficiencies
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useSheetData } from '@/modules/character-builder/application/context/activeSheetContext';
import {
  collectActiveGrants,
  deriveGrants,
} from '@/modules/character-builder/lib/utils/grants';
import { useTranslations } from 'next-intl';
import styles from './grantedProficiencies.module.scss';

/**
 * A single labelled strip segment.
 *
 * @interface GrantSegment
 * @property {string} key - Stable react key
 * @property {string} label - Translated label
 * @property {string} value - Human-readable grant list
 */
interface GrantSegment {
  key: string;
  label: string;
  value: string;
}

/**
 * Title-cases a grant value, turning kebab/underscore into spaced words.
 *
 * @param {string} value - Raw grant value (e.g. `sleight-of-hand`)
 * @returns {string} Display form (e.g. `Sleight Of Hand`)
 */
function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Renders the granted-proficiency strip, or nothing when no active feature
 * grants any proficiency. Reads the character from the active-sheet context.
 *
 * @component
 * @returns {JSX.Element | null} The strip, or null when there is nothing granted
 */
export const GrantedProficiencies: React.FC = () => {
  const t = useTranslations('characterSheet');
  const data = useSheetData();
  const derived = deriveGrants(collectActiveGrants(data));

  const segments: GrantSegment[] = [];
  const saves = Object.keys(derived.savingThrows);
  if (saves.length > 0) {
    segments.push({
      key: 'saves',
      label: t('profSaves'),
      value: saves.map((ability) => ability.toUpperCase()).join(', '),
    });
  }
  const skills = Object.entries(derived.skills);
  if (skills.length > 0) {
    segments.push({
      key: 'skills',
      label: t('profSkills'),
      value: skills
        .map(([name, tier]) => `${titleCase(name)} (${tier})`)
        .join(', '),
    });
  }
  const trades = Object.entries(derived.trades);
  if (trades.length > 0) {
    segments.push({
      key: 'trades',
      label: t('profTrades'),
      value: trades
        .map(([name, tier]) => `${titleCase(name)} (${tier})`)
        .join(', '),
    });
  }
  if (derived.armor.length > 0) {
    segments.push({
      key: 'armor',
      label: t('profArmor'),
      value: derived.armor.map(titleCase).join(', '),
    });
  }
  if (derived.weapons.length > 0) {
    segments.push({
      key: 'weapons',
      label: t('profWeapons'),
      value: derived.weapons.map(titleCase).join(', '),
    });
  }

  if (segments.length === 0) return null;

  return (
    <div className={styles.granted} aria-label={t('ariaGrantedProficiencies')}>
      <span className={styles.grantedTitle}>{t('grantedProficiencies')}</span>
      <div className={styles.grantedItems}>
        {segments.map((segment) => (
          <span key={segment.key} className={styles.grantedItem}>
            <span className={styles.grantedLabel}>{segment.label}:</span>{' '}
            {segment.value}
          </span>
        ))}
      </div>
    </div>
  );
};
