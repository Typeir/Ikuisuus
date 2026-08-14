/**
 * @fileoverview Renders the SAVES / SKILLS / ARMOR / WEAPONS / TRADES summary
 * for a vocation entry. Missing grants (or no vocation) render an em dash;
 * values are stripped of inline markdown.
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
 * Returns a comma-joined, inline-markdown-stripped grant list, or an em dash when empty.
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
 * Returns saving-throw grants as comma-joined 3-letter codes, or an em dash when empty.
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
 * Renders the fixed SAVES / SKILLS / ARMOR / WEAPONS / TRADES row set; absent
 * grants (or no vocation) render an em dash.
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
