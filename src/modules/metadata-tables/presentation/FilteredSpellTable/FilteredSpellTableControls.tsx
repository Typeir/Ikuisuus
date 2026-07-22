/**
 * @fileoverview Extracted filter controls for FilteredSpellTable.
 * @module src/modules/metadata-tables/presentation/FilteredSpellTable/FilteredSpellTableControls
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { FilterSelect, type FilterSelectOption } from '@/lib/components/ui';
import { useTranslations } from 'next-intl';
import type {
    ConcentrationFilter,
    SpellTableFilterSetters,
    SpellTableFilterState,
} from '@/modules/metadata-tables/application/hooks/useSpellTableFilters';
import styles from '@/modules/metadata-tables/presentation/SpellTable/SpellTable.module.scss';

/**
 * Props for spell table filter controls.
 *
 * @interface FilteredSpellTableControlsProps
 * @property {SpellTableFilterState} state - Current filter state.
 * @property {SpellTableFilterSetters} setters - Filter state setters.
 * @property {FilterSelectOption[]} schoolOptions - School options.
 * @property {FilterSelectOption[]} concentrationOptions - Concentration options.
 * @property {(key: string) => string} tFilters - Translation function for filter labels.
 */
interface FilteredSpellTableControlsProps {
  state: SpellTableFilterState;
  setters: SpellTableFilterSetters;
  schoolOptions: FilterSelectOption[];
  concentrationOptions: FilterSelectOption[];
  tFilters: (key: string) => string;
}

/**
 * Renders filter controls for filtered spell table.
 *
 * @component
 * @param {FilteredSpellTableControlsProps} props - Filter control props.
 * @returns {JSX.Element} Filter controls block.
 */
export function FilteredSpellTableControls({
  state,
  setters,
  schoolOptions,
  concentrationOptions,
  tFilters,
}: FilteredSpellTableControlsProps): JSX.Element {
  const tCommon = useTranslations('common');
  return (
    <div className={styles.filterControls}>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor='spell-damocles-filter'>
            {tFilters('damoclesOnly')}
          </label>
          <div className={styles.filterCheckboxRow}>
            <input
              id='spell-damocles-filter'
              className={styles.filterCheckbox}
              type='checkbox'
              checked={state.damoclesOnly}
              onChange={(e) => setters.setDamoclesOnly(e.target.checked)}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>{tFilters('school')}</span>
          <FilterSelect
            id='spell-school-filter'
            value={state.schoolFilter}
            options={schoolOptions}
            onChange={setters.setSchoolFilter}
            allLabel={tFilters('allSchools')}
            placeholder={tFilters('allSchools')}
            ariaLabel={tFilters('school')}
            size='sm'
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>
            {tFilters('concentration')}
          </span>
          <FilterSelect
            id='spell-concentration-filter'
            value={state.concentrationFilter}
            options={concentrationOptions}
            onChange={(value) =>
              setters.setConcentrationFilter(value as ConcentrationFilter)
            }
            allLabel={tCommon('all')}
            placeholder={tCommon('all')}
            ariaLabel={tFilters('concentration')}
            size='sm'
          />
        </div>
      </div>
    </div>
  );
}
