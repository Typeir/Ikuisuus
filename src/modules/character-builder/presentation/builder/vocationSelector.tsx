/**
 * @fileoverview Vocation Selector Component
 * @description Renders bloodline, vocation, and specialization selection.
 * Multiclassing supported via multiple {@link VocationEntryBlock} rows.
 * Metadata loads via {@link useVocationMetadata}; skeletons shown while loading.
 *
 * @module modules/character-builder/presentation/builder/vocationSelector
 * @version 7.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Skeleton } from '@/lib/components/skeleton/skeleton';
import { FilterSelect } from '@/lib/components/ui/filterSelect';
import { useVocationMetadata } from '@/lib/hooks/data/useVocationMetadata';
import { useVocationBaseSync } from './useVocationBaseSync';
import type { VocationEntry } from '@/lib/types/character';
import { UNKNOWN_DIE } from '@/lib/utils/diceUtils';
import {
  useSheetData,
  useSheetEditing,
  useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { createEmptyVocationEntry } from '@/modules/character-builder/lib/utils/characterStorage';
import { fetchFeatureShards } from '@/modules/character-builder/lib/utils/featureShards';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { BoonPicker } from './boonPicker';
import { IdentityRows } from './identityRows';
import { SummaryBar } from './summaryBar';
import { VocationEntryBlock } from './vocationEntryBlock';
import { IconButton } from '@/lib/components/ui/iconButton';
import styles from './vocationSelector.module.scss';

/**
 * Props for the VocationSelector component.
 *
 * @interface VocationSelectorProps
 * @property {boolean} [showBoonPicker] - Whether to render the BoonPicker beneath the selectors (default `true`)
 */
export interface VocationSelectorProps {
  showBoonPicker?: boolean;
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
 * Selector panel for bloodline and multiple vocations.
 * Uses `FilterSelect` comboboxes in edit mode; identity pills in view mode.
 * Reads character and edit mode from the active-sheet context.
 *
 * @component
 * @param {VocationSelectorProps} props - Component props
 * @param {boolean} [props.showBoonPicker=true] - Whether to render the BoonPicker beneath the selectors (default `true`)
 * @returns {JSX.Element} Rendered selector panel
 */
export const VocationSelector: React.FC<VocationSelectorProps> = ({
  showBoonPicker = true,
}) => {
  const t = useTranslations('characterSheet');
  const locale = useLocale();
  const data = useSheetData();
  const editing = useSheetEditing();
  const { patch: onChange } = useSheetMutators();
  const {
    bloodlineSlug,
    vocations,
    selectedBoons,
    boonBudget,
  } = data;
  const bloodlineTitle = data.bloodlineTitle || '';
  const { bloodlines, vocOptions, specs, isLoading } = useVocationMetadata(
    editing,
    locale,
  );
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setCollapsed(!editing);
  }, [editing]);

  const summaryBar = (
    <SummaryBar
      collapsed={collapsed}
      onToggle={() => setCollapsed((c) => !c)}
      bloodlineTitle={bloodlineTitle}
      vocations={vocations}
    />
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

  useVocationBaseSync(vocOptions);

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
        hitDie: voc?.hitDie ?? UNKNOWN_DIE,
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
    <IdentityRows
      bloodlineSlug={bloodlineSlug}
      bloodlineTitle={bloodlineTitle}
      vocations={vocations}
    />
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

  return (
    <div
      className={styles.vocationSelector}
      aria-label={t('ariaVocationSelector')}>
      {identityRows}
      <div className={styles.summaryPanel}>
        {summaryBar}
        {!collapsed && (
          <div className={styles.summaryBody}>
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

            <IconButton
              kind='add'
              dashed
              size='s'
              onClick={handleAddVocation}
              className={styles.addVocationBtn}>
              {t('addVocation')}
            </IconButton>
          </div>
        )}
      </div>

      {!collapsed && bloodlineSlug && showBoonPicker && (
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
