/**
 * @fileoverview Vocation Proficiency Summary
 * @description Compact one-line summary of the proficiencies a vocation grants
 * (saving throws, skill choices, tools, armor, weapons), shown beneath a
 * selected vocation so the player sees what it confers without opening the
 * vocation page. Segments with no grants are omitted; renders nothing when the
 * vocation carries no proficiency metadata.
 *
 * @module lib/components/characterSheet/builder/vocationProficiencySummary
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

'use client';

import type { VocationOption } from '@/lib/types/vocations';
import { useTranslations } from 'next-intl';
import styles from './vocationSelector.module.scss';

/**
 * Props for the VocationProficiencySummary component.
 *
 * @interface VocationProficiencySummaryProps
 * @property {VocationOption} vocation - Selected vocation whose grants are summarised
 */
export interface VocationProficiencySummaryProps {
  vocation: VocationOption;
}

/**
 * A single labelled summary segment.
 *
 * @interface SummarySegment
 * @property {string} key - Stable React key / segment id
 * @property {string} label - Translated segment label (e.g. "Saves")
 * @property {string} value - Human-readable grant list
 */
interface SummarySegment {
  key: string;
  label: string;
  value: string;
}

/**
 * Abbreviates a saving-throw ability name to a 3-letter uppercase code.
 *
 * @function abbreviateAbility
 * @param {string} name - Full ability name (e.g. "Strength")
 * @returns {string} Three-letter uppercase code (e.g. "STR")
 */
function abbreviateAbility(name: string): string {
  return name.slice(0, 3).toUpperCase();
}

/**
 * Renders a compact proficiency summary for a selected vocation.
 *
 * @component
 * @param {VocationProficiencySummaryProps} props - Component props
 * @param {VocationOption} props.vocation - Selected vocation whose grants are summarised
 * @returns {JSX.Element | null} Summary row, or null when there is nothing to show
 */
export const VocationProficiencySummary: React.FC<
  VocationProficiencySummaryProps
> = ({ vocation }) => {
  const t = useTranslations('characterSheet');
  const saves = vocation.savingThrows ?? [];
  const skills = vocation.skillProficiencies;
  const tools = vocation.toolProficiencies ?? [];
  const armor = vocation.armorProficiencies ?? [];
  const weapons = vocation.weaponProficiencies ?? [];

  const segments: SummarySegment[] = [];
  if (saves.length > 0)
    segments.push({
      key: 'saves',
      label: t('profSaves'),
      value: saves.map(abbreviateAbility).join(', '),
    });
  if (skills && skills.count > 0)
    segments.push({
      key: 'skills',
      label: t('profSkills'),
      value:
        skills.choices.length > 0
          ? t('profSkillCount', {
              count: skills.count,
              total: skills.choices.length,
            })
          : String(skills.count),
    });
  if (tools.length > 0)
    segments.push({
      key: 'tools',
      label: t('profTools'),
      value: tools.join(', '),
    });
  if (armor.length > 0)
    segments.push({
      key: 'armor',
      label: t('profArmor'),
      value: armor.join(', '),
    });
  if (weapons.length > 0)
    segments.push({
      key: 'weapons',
      label: t('profWeapons'),
      value: weapons.join(', '),
    });

  if (segments.length === 0) return null;

  return (
    <div
      className={styles.profSummary}
      aria-label={t('ariaVocationProficiencies')}>
      {segments.map((seg) => (
        <span key={seg.key} className={styles.profSummaryItem}>
          <span className={styles.profSummaryLabel}>{seg.label}:</span>{' '}
          <span className={styles.profSummaryValue}>{seg.value}</span>
        </span>
      ))}
    </div>
  );
};
