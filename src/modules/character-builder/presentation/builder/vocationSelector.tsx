/**
 * @fileoverview Vocation Selector Component
 * @description Panel for selecting a character's bloodline, vocations, and
 * specializations. Supports mixing (multiclassing) — multiple `VocationEntry`
 * rows, each managed by a {@link VocationEntryBlock}.
 *
 * Metadata is loaded lazily via {@link useVocationMetadata} when the panel first
 * enters edit mode. While loading, a skeleton placeholder replaces the bloodline
 * combobox and each entry block with an existing slug shows skeleton rows in-place.
 * Feature shards are fetched per-entry on selection; each {@link VocationEntryBlock}
 * manages its own async loading state so multiclassing entries remain independent.
 *
 * @module lib/components/characterSheet/vocationSelector
 * @version 7.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Skeleton } from '@/lib/components/skeleton/skeleton';
import { Chip } from '@/lib/components/ui/chip';
import { FilterSelect } from '@/lib/components/ui/filterSelect';
import { useVocationMetadata } from '@/lib/hooks/data/useVocationMetadata';
import type {
    CharacterSheet as CharacterSheetType,
    VocationEntry,
} from '@/lib/types/character';
import { createEmptyVocationEntry } from '@/modules/character-builder/lib/utils/characterStorage';
import { fetchFeatureShards } from '@/modules/character-builder/lib/utils/featureShards';
import { usePagePreview } from '@/modules/character-builder/presentation/PagePreview/pagePreviewProvider';
import { ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { BoonPicker } from './boonPicker';
import { VocationEntryBlock } from './vocationEntryBlock';
import styles from './vocationSelector.module.scss';

/**
 * Props for the VocationSelector component.
 *
 * @interface VocationSelectorProps
 * @property {string | null} bloodlineSlug - Active bloodline slug
 * @property {string} bloodlineTitle - Active bloodline display name
 * @property {VocationEntry[]} vocations - Current vocation entries (mixing supported)
 * @property {import('@/lib/types/character').CharacterShard[]} selectedBoons - Currently selected boon shards
 * @property {number} boonBudget - Total boon point budget from the bloodline
 * @property {boolean} editing - Whether the sheet is in edit mode
 * @property {boolean} [showBoonPicker] - Whether to render the BoonPicker beneath the selectors (default `true`)
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch callback
 */
export interface VocationSelectorProps {
  bloodlineSlug: string | null;
  bloodlineTitle: string;
  vocations: VocationEntry[];
  selectedBoons: import('@/lib/types/character').CharacterShard[];
  boonBudget: number;
  editing: boolean;
  showBoonPicker?: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
}

/**
 * Converts a slug/title pair to a FilterSelect option.
 *
 * @function toOpt
 * @param {{ slug: string; title: string }} item - Source item
 * @returns {{ value: string; label: string }} Option object
 */
function toOpt(item: { slug: string; title: string }): {
  value: string;
  label: string;
} {
  return { value: item.slug, label: item.title };
}

/**
 * Selector panel for bloodline and multiple vocations (mixing supported).
 * Uses `FilterSelect` comboboxes in edit mode; shows identity pills in view mode.
 *
 * @component
 * @param {VocationSelectorProps} props - Component props
 * @returns {JSX.Element} Rendered selector panel
 */
export const VocationSelector: React.FC<VocationSelectorProps> = ({
  bloodlineSlug,
  bloodlineTitle,
  vocations,
  selectedBoons,
  boonBudget,
  editing,
  showBoonPicker = true,
  onChange,
}) => {
  const t = useTranslations('characterSheet');
  const locale = useLocale();
  const preview = usePagePreview();
  const { bloodlines, vocOptions, specs, isLoading } = useVocationMetadata(
    editing,
    locale,
  );
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setCollapsed(!editing);
  }, [editing]);

  const vocationSummary =
    vocations.length > 0
      ? vocations
          .map(
            (v) =>
              `${v.title || '—'}${v.specializationTitle ? ` / ${v.specializationTitle}` : ''} Lv.${v.level}`,
          )
          .join(' · ')
      : '—';

  const summaryBar = (
    <button
      type='button'
      className={styles.identitySummary}
      onClick={() => setCollapsed((c) => !c)}
      aria-expanded={!collapsed}
      aria-label={t('ariaIdentitySummary')}>
      <ChevronRight
        size={14}
        aria-hidden='true'
        className={`${styles.summaryChevron} ${collapsed ? '' : styles.summaryChevronOpen}`}
      />
      <span className={styles.summaryLabel}>{t('colBloodline')}</span>
      <span className={styles.summaryValue}>{bloodlineTitle || '—'}</span>
      <span className={styles.summaryDivider} aria-hidden='true' />
      <span className={styles.summaryLabel}>{t('colVocation')}</span>
      <span className={styles.summaryValue}>{vocationSummary}</span>
    </button>
  );

  const handleBloodlineChange = useCallback(
    (slug: string) => {
      const bl = bloodlines.find((b) => b.slug === slug);
      const rawSpeeds = bl?.coreFeatures?.movementSpeeds ?? [];
      const walkEntry = rawSpeeds.find((s) =>
        s.toLowerCase().startsWith('walk:'),
      );
      const parsedWalk = walkEntry
        ? parseInt(walkEntry.replace(/[^0-9]/g, ''), 10) || null
        : null;
      onChange({
        bloodlineSlug: slug || null,
        bloodlineTitle: bl?.title ?? '',
        boonBudget: bl?.boonBudget ?? 0,
        selectedBoons: [],
        bloodlineSpeeds: rawSpeeds,
        speedOverride: parsedWalk,
      });
    },
    [bloodlines, onChange],
  );

  const patchVocationEntry = useCallback(
    (index: number, patch: Partial<VocationEntry>) => {
      const updated = vocations.map((v, i) =>
        i === index ? { ...v, ...patch } : v,
      );
      onChange({ vocations: updated });
    },
    [vocations, onChange],
  );

  const handleVocationChange = useCallback(
    async (index: number, slug: string) => {
      const voc = vocOptions.find((v) => v.slug === slug);
      const vocationFeatures = voc
        ? await fetchFeatureShards(
            slug,
            voc.file,
            voc.features,
            'vocation-feature',
            'vocations',
            locale,
          )
        : [];
      patchVocationEntry(index, {
        slug: slug || '',
        title: voc?.title ?? '',
        hitDie: voc?.hitDie ?? '',
        vocationFeatures,
        specializationSlug: null,
        specializationTitle: '',
        specializationFeatures: [],
      });
    },
    [vocOptions, locale, patchVocationEntry],
  );

  const handleSpecChange = useCallback(
    async (index: number, slug: string) => {
      const spec = specs.find((s) => s.slug === slug);
      const specializationFeatures = spec
        ? await fetchFeatureShards(
            slug,
            spec.file,
            spec.features,
            'specialization-feature',
            'specializations',
            locale,
          )
        : [];
      patchVocationEntry(index, {
        specializationSlug: slug || null,
        specializationTitle: spec?.title ?? '',
        specializationFeatures,
      });
    },
    [specs, locale, patchVocationEntry],
  );

  const handleLevelChange = useCallback(
    (index: number, value: number) => {
      patchVocationEntry(index, { level: Math.max(1, value) });
    },
    [patchVocationEntry],
  );

  const handleAddVocation = useCallback(() => {
    onChange({ vocations: [...vocations, createEmptyVocationEntry()] });
  }, [vocations, onChange]);

  const handleRemoveVocation = useCallback(
    (index: number) => {
      onChange({ vocations: vocations.filter((_, i) => i !== index) });
    },
    [vocations, onChange],
  );

  const identityRows = (
    <>
      <div className={styles.identityRow}>
        <span className={styles.identityLabel}>{t('colBloodline')}</span>
        {bloodlineTitle ? (
          <Chip
            variant='neutral'
            label={bloodlineTitle}
            onInfo={
              bloodlineSlug
                ? () =>
                    preview.open({
                      kind: 'bloodlines',
                      slug: bloodlineSlug,
                      title: bloodlineTitle,
                    })
                : undefined
            }
          />
        ) : (
          <span className={styles.identityEmpty}>—</span>
        )}
      </div>
      <div className={styles.identityRow}>
        <span className={styles.identityLabel}>{t('colVocation')}</span>
        {vocations.length > 0 ? (
          <div className={styles.pillGroup}>
            {vocations.map((v, i) =>
              v.slug ? (
                <Chip
                  key={`${i}::${v.slug}`}
                  variant='neutral'
                  label={`${v.title}${v.specializationTitle ? ` / ${v.specializationTitle}` : ''} Lv.${v.level}`}
                  onInfo={() =>
                    preview.open({
                      kind: 'vocations',
                      slug: v.slug,
                      title: v.title,
                    })
                  }
                />
              ) : (
                <span key={`${i}::empty`} className={styles.identityPill}>
                  — Lv.{v.level}
                </span>
              ),
            )}
          </div>
        ) : (
          <span className={styles.identityEmpty}>—</span>
        )}
      </div>
    </>
  );

  if (!editing) {
    return (
      <div
        className={styles.vocationSelector}
        aria-label={t('ariaVocationSelectorView')}>
        {identityRows}
      </div>
    );
  }

  if (collapsed) {
    return (
      <div
        className={styles.vocationSelector}
        aria-label={t('ariaVocationSelector')}>
        {identityRows}
        {summaryBar}
      </div>
    );
  }

  return (
    <div
      className={styles.vocationSelector}
      aria-label={t('ariaVocationSelector')}>
      {identityRows}
      {summaryBar}
      <div className={styles.selectorRow}>
        <span className={styles.selectorLabel}>{t('colBloodline')}</span>
        <div className={styles.selectorInput}>
          {isLoading ? (
            <Skeleton variant='button' height='26px' />
          ) : (
            <FilterSelect
              id='bloodline-select'
              value={bloodlineSlug ?? ''}
              options={bloodlines.map(toOpt)}
              onChange={handleBloodlineChange}
              placeholder={t('selectBloodline')}
              searchable
              size='sm'
              ariaLabel={t('colBloodline')}
            />
          )}
        </div>
      </div>

      <div className={styles.entriesRowMulti}>
        {vocations.map((entry, index) => (
          <VocationEntryBlock
            key={index}
            entry={entry}
            index={index}
            isOnlyEntry={vocations.length === 1}
            vocOptions={vocOptions}
            specs={specs}
            metaLoading={isLoading}
            onVocationChange={handleVocationChange}
            onSpecChange={handleSpecChange}
            onLevelChange={handleLevelChange}
            onRemove={handleRemoveVocation}
          />
        ))}
      </div>

      <button
        type='button'
        className={styles.addVocationBtn}
        onClick={handleAddVocation}>
        {t('addVocation')}
      </button>

      {bloodlineSlug && showBoonPicker && (
        <BoonPicker
          bloodlineSlug={bloodlineSlug}
          selectedBoons={selectedBoons}
          boonBudget={boonBudget}
          onToggle={(boons) => onChange({ selectedBoons: boons })}
          locale={locale}
        />
      )}
    </div>
  );
};
