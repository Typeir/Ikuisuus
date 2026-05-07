/**
 * @fileoverview Vocation Selector Component
 * @description Panel for selecting a character's bloodline, vocation, and
 * specialization. Uses `FilterSelect` combobox dropdowns in edit mode and
 * styled pills in view mode.
 *
 * When a vocation or specialization is selected, feature shards are fetched from
 * the `/api/content-shards/vocations/[slug]` or
 * `/api/content-shards/specializations/[slug]` endpoints. The server resolves
 * all prose content internally so this component never needs raw MDX access.
 *
 * Metadata is fetched from `/api/bloodlines`, `/api/vocations`, and
 * `/api/specializations` once when the panel first enters edit mode.
 *
 * @module lib/components/characterSheet/vocationSelector
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { FilterSelect } from '@/lib/components/ui/filterSelect';
import type {
    CharacterShard,
    CharacterSheet as CharacterSheetType,
} from '@/lib/types/character';
import type { FeatureEntry } from '@/lib/utils/mdxSource';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { BoonPicker } from './boonPicker';
import styles from './vocationSelector.module.scss';

/**
 * Bloodline entry as returned by `/api/bloodlines`.
 *
 * @interface BloodlineOption
 * @property {string} slug - Bloodline identifier
 * @property {string} title - Display name
 * @property {string} file - Source file path (may have `src/content/en/` prefix)
 * @property {number} [boonBudget] - Total boon point budget
 */
interface BloodlineOption {
  slug: string;
  title: string;
  file: string;
  boonBudget?: number;
}

/**
 * Vocation entry as returned by `/api/vocations`.
 *
 * @interface VocationOption
 * @property {string} slug - Vocation identifier
 * @property {string} title - Display name
 * @property {FeatureEntry[]} features - Level–feature progression
 */
interface VocationOption {
  slug: string;
  title: string;
  features: FeatureEntry[];
}

/**
 * Specialization entry as returned by `/api/specializations`.
 *
 * @interface SpecOption
 * @property {string} slug - Specialization identifier
 * @property {string} title - Display name
 * @property {string} vocation - Parent vocation slug
 * @property {FeatureEntry[]} features - Level–feature list
 */
interface SpecOption {
  slug: string;
  title: string;
  vocation: string;
  features: FeatureEntry[];
}

/**
 * Props for the VocationSelector component.
 *
 * @interface VocationSelectorProps
 * @property {string | null} bloodlineSlug - Active bloodline slug
 * @property {string} bloodlineTitle - Active bloodline display name
 * @property {string | null} vocationSlug - Active vocation slug
 * @property {string} vocationTitle - Active vocation display name
 * @property {string | null} specializationSlug - Active specialization slug
 * @property {string} specializationTitle - Active specialization display name
 * @property {CharacterShard[]} selectedBoons - Currently selected boon shards
 * @property {number} boonBudget - Total boon point budget from the bloodline
 * @property {boolean} editing - Whether the sheet is in edit mode
 * @property {string} [locale] - Content locale (default `en`)
 * @property {boolean} [showBoonPicker] - Whether to render the BoonPicker beneath the selectors when in edit mode (default `true`)
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch callback
 */
export interface VocationSelectorProps {
  bloodlineSlug: string | null;
  bloodlineTitle: string;
  vocationSlug: string | null;
  vocationTitle: string;
  specializationSlug: string | null;
  specializationTitle: string;
  selectedBoons: CharacterShard[];
  boonBudget: number;
  editing: boolean;
  locale?: string;
  showBoonPicker?: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
}

/**
 * Selector panel for bloodline, vocation, and specialization.
 * Uses `FilterSelect` comboboxes in edit mode; shows identity pills in view mode.
 * Pre-populates shard `cachedText` from locally fetched source files.
 *
 * @component
 * @param {VocationSelectorProps} props - Component props
 * @returns {JSX.Element} Rendered selector panel
 */
export const VocationSelector: React.FC<VocationSelectorProps> = ({
  bloodlineSlug,
  bloodlineTitle,
  vocationSlug,
  vocationTitle,
  specializationSlug,
  specializationTitle,
  selectedBoons,
  boonBudget,
  editing,
  locale = 'en',
  showBoonPicker = true,
  onChange,
}) => {
  const t = useTranslations('characterSheet');
  const [bloodlines, setBloodlines] = useState<BloodlineOption[]>([]);
  const [vocations, setVocations] = useState<VocationOption[]>([]);
  const [specs, setSpecs] = useState<SpecOption[]>([]);
  const [metaFetched, setMetaFetched] = useState(false);

  useEffect(() => {
    if (!editing || metaFetched) return;
    let cancelled = false;

    Promise.all([
      fetch(`/api/bloodlines?locale=${locale}`).then((r) =>
        r.ok ? (r.json() as Promise<BloodlineOption[]>) : Promise.resolve([]),
      ),
      fetch(`/api/vocations?locale=${locale}`).then((r) =>
        r.ok ? (r.json() as Promise<VocationOption[]>) : Promise.resolve([]),
      ),
      fetch(`/api/specializations?locale=${locale}`).then((r) =>
        r.ok ? (r.json() as Promise<SpecOption[]>) : Promise.resolve([]),
      ),
    ])
      .then(([bls, vocs, sps]) => {
        if (cancelled) return;
        if (Array.isArray(bls)) setBloodlines(bls);
        if (Array.isArray(vocs)) setVocations(vocs);
        if (Array.isArray(sps)) setSpecs(sps);
        setMetaFetched(true);
      })
      .catch(() => {
        if (!cancelled) setMetaFetched(true);
      });

    return () => {
      cancelled = true;
    };
  }, [editing, metaFetched, locale]);

  const handleBloodlineChange = useCallback(
    async (slug: string) => {
      const bl = bloodlines.find((b) => b.slug === slug);
      onChange({
        bloodlineSlug: slug || null,
        bloodlineTitle: bl?.title ?? '',
        boonBudget: bl?.boonBudget ?? 0,
        selectedBoons: [],
      });
    },
    [bloodlines, onChange],
  );

  const handleVocationChange = useCallback(
    async (slug: string) => {
      const voc = vocations.find((v) => v.slug === slug);
      let vocationFeatures: CharacterShard[] = [];

      if (voc) {
        try {
          const res = await fetch(
            `/api/content-shards/vocations/${slug}?locale=${locale}`,
          );
          if (res.ok) {
            const data = (await res.json()) as {
              shards: Record<string, string>;
            };
            vocationFeatures = voc.features.map((f) => ({
              id: `${slug}::${f.level}::${f.name}`,
              sourceFile: slug,
              heading: f.name,
              category: 'vocation-feature' as const,
              level: f.level,
              cachedText: data.shards[f.name],
            }));
          }
        } catch {
          /** Feature shards unavailable; ShardDisplay will lazy-fetch on expand */
        }
      }

      onChange({
        vocationSlug: slug || null,
        vocationTitle: voc?.title ?? '',
        vocationFeatures,
        specializationSlug: null,
        specializationTitle: '',
        specializationFeatures: [],
      });
    },
    [vocations, locale, onChange],
  );

  const handleSpecChange = useCallback(
    async (slug: string) => {
      const spec = specs.find((s) => s.slug === slug);
      let specializationFeatures: CharacterShard[] = [];

      if (spec) {
        try {
          const res = await fetch(
            `/api/content-shards/specializations/${slug}?locale=${locale}`,
          );
          if (res.ok) {
            const data = (await res.json()) as {
              shards: Record<string, string>;
            };
            specializationFeatures = spec.features.map((f) => ({
              id: `${slug}::${f.level}::${f.name}`,
              sourceFile: slug,
              heading: f.name,
              category: 'specialization-feature' as const,
              level: f.level,
              cachedText: data.shards[f.name],
            }));
          }
        } catch {
          /** Feature shards unavailable; ShardDisplay will lazy-fetch on expand */
        }
      }

      onChange({
        specializationSlug: slug || null,
        specializationTitle: spec?.title ?? '',
        specializationFeatures,
      });
    },
    [specs, locale, onChange],
  );

  const filteredSpecs = vocationSlug
    ? specs.filter((s) => s.vocation === vocationSlug)
    : specs;
  const toOpt = (x: { slug: string; title: string }) => ({
    value: x.slug,
    label: x.title,
  });

  if (!editing) {
    return (
      <div
        className={styles.vocationSelector}
        aria-label={t('ariaVocationSelectorView')}>
        <div className={styles.identityRow}>
          <span className={styles.identityLabel}>{t('colBloodline')}</span>
          {bloodlineTitle ? (
            <span className={styles.identityPill}>{bloodlineTitle}</span>
          ) : (
            <span className={styles.identityEmpty}>—</span>
          )}
        </div>
        <div className={styles.identityRow}>
          <span className={styles.identityLabel}>{t('colVocation')}</span>
          {vocationTitle ? (
            <span className={styles.identityPill}>{vocationTitle}</span>
          ) : (
            <span className={styles.identityEmpty}>—</span>
          )}
        </div>
        <div className={styles.identityRow}>
          <span className={styles.identityLabel}>{t('colSpecialization')}</span>
          {specializationTitle ? (
            <span className={styles.identityPill}>{specializationTitle}</span>
          ) : (
            <span className={styles.identityEmpty}>—</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.vocationSelector}
      aria-label={t('ariaVocationSelector')}>
      <div className={styles.selectorRow}>
        <span className={styles.selectorLabel}>{t('colBloodline')}</span>
        <div className={styles.selectorInput}>
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
        </div>
      </div>

      <div className={styles.selectorRow}>
        <span className={styles.selectorLabel}>{t('colVocation')}</span>
        <div className={styles.selectorInput}>
          <FilterSelect
            id='vocation-select'
            value={vocationSlug ?? ''}
            options={vocations.map(toOpt)}
            onChange={handleVocationChange}
            placeholder={t('selectVocation')}
            searchable
            size='sm'
            ariaLabel={t('colVocation')}
          />
        </div>
      </div>

      <div className={styles.selectorRow}>
        <span className={styles.selectorLabel}>{t('colSpecialization')}</span>
        <div className={styles.selectorInput}>
          <FilterSelect
            id='spec-select'
            value={specializationSlug ?? ''}
            options={filteredSpecs.map(toOpt)}
            onChange={handleSpecChange}
            placeholder={t('selectSpecialization')}
            searchable
            size='sm'
            disabled={!vocationSlug}
            ariaLabel={t('colSpecialization')}
          />
        </div>
      </div>

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
