/**
 * @fileoverview Vocation Proficiency Summary
 * @description Compact fixed summary of the proficiencies a vocation grants
 * (saving throws, skill choices, armor, weapons, trades), shown beneath a
 * vocation entry so the player sees what it confers without opening the vocation
 * page. Every row is always rendered in a stable order; a row the vocation does
 * not provide — or the empty state when no vocation is selected — shows an em
 * dash, so the summary never changes height and the layout never shifts. Values
 * are stripped of inline markdown so bold markers from the source traits table
 * never leak into the display.
 *
 * @module lib/components/characterSheet/builder/vocationProficiencySummary
 * @version 2.0.0
 * @author Typeir
 * @since 7.0.0
 */

'use client';

import type { VocationOption } from '@/lib/types/vocations';
import { stripInlineMarkdown } from '@/lib/utils/stripInlineMarkdown';
import { useTranslations } from 'next-intl';
import styles from './vocationSelector.module.scss';

/** Placeholder shown for a proficiency the vocation does not grant. */
const EM_DASH = '—';

/**
 * Props for the VocationProficiencySummary component.
 *
 * @interface VocationProficiencySummaryProps
 * @property {VocationOption} [vocation] - Selected vocation whose grants are summarised; when omitted every row shows an em dash
 */
export interface VocationProficiencySummaryProps {
  vocation?: VocationOption;
}

/**
 * A single labelled summary segment.
 *
 * @interface SummarySegment
 * @property {string} key - Stable React key / segment id
 * @property {string} label - Translated segment label (e.g. "Saves")
 * @property {string} value - Human-readable grant list, or an em dash when none
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
 * Cleans and comma-joins a proficiency value list, stripping inline markdown
 * from each entry and substituting an em dash when the list is empty.
 *
 * @function formatGrantList
 * @param {string[] | undefined} values - Raw grant values from vocation metadata
 * @returns {string} Comma-joined clean list, or an em dash when empty
 */
function formatGrantList(values: string[] | undefined): string {
  const cleaned = (values ?? [])
    .map((value) => stripInlineMarkdown(value).trim())
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(', ') : EM_DASH;
}

/**
 * Formats a vocation's saving-throw grants as abbreviated codes, or an em dash
 * when there are none.
 *
 * @function formatSaves
 * @param {string[] | undefined} saves - Saving-throw ability names
 * @returns {string} Comma-joined 3-letter codes, or an em dash when empty
 */
function formatSaves(saves: string[] | undefined): string {
  const codes = (saves ?? [])
    .map((name) => abbreviateAbility(stripInlineMarkdown(name).trim()))
    .filter(Boolean);
  return codes.length > 0 ? codes.join(', ') : EM_DASH;
}

/**
 * Renders a compact, fixed-layout proficiency summary for a vocation entry.
 * Always shows the SAVES / SKILLS / ARMOR / WEAPONS / TRADES rows; absent grants
 * (or the no-vocation state) render an em dash so the row set never changes.
 *
 * @component
 * @param {VocationProficiencySummaryProps} props - Component props
 * @param {VocationOption} [props.vocation] - Selected vocation whose grants are summarised; when omitted every row shows an em dash
 * @returns {JSX.Element} Fixed summary row set
 */
export const VocationProficiencySummary: React.FC<
  VocationProficiencySummaryProps
> = ({ vocation }) => {
  const t = useTranslations('characterSheet');
  const skills = vocation?.skillProficiencies;
  const skillsValue =
    skills && skills.count > 0
      ? skills.choices.length > 0
        ? t('profSkillCount', {
            count: skills.count,
            total: skills.choices.length,
          })
        : String(skills.count)
      : EM_DASH;

  const segments: SummarySegment[] = [
    { key: 'saves', label: t('profSaves'), value: formatSaves(vocation?.savingThrows) },
    { key: 'skills', label: t('profSkills'), value: skillsValue },
    {
      key: 'armor',
      label: t('profArmor'),
      value: formatGrantList(vocation?.armorProficiencies),
    },
    {
      key: 'weapons',
      label: t('profWeapons'),
      value: formatGrantList(vocation?.weaponProficiencies),
    },
    {
      key: 'trades',
      label: t('profTrades'),
      value: formatGrantList(vocation?.toolProficiencies),
    },
  ];

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
