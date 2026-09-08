/**
 * @fileoverview Vocation and specialization card.
 * @description The core traits table as the page wrote it
 *
 * @module modules/library/presentation/components/slots/Vocation
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-04
 */

'use client';

import { DataTable, type DataTableCellSpec, type DataTableRow } from '@/lib/components/ui/dataTable';
import { CONTENT_SUBDIRS } from '@/lib/constants/contentPaths';
import {
  slotLabelKey,
  VOCATION_SLOT_NAMES,
  type SlotProps,
  type VocationSlotName,
} from '@/modules/library/domain/slots';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import React, { type ReactNode } from 'react';
import { isHeadingNode } from '../headingParts';
import { inlineValue, readSlots } from './slotElements';
import { capitalize } from './text';
import { collectFeatureHeadings, VocationFeaturesContext } from './vocationFeatures';

/**
 * Props for the card
 */
export type VocationProps = SlotProps<VocationSlotName> & {
  children?: ReactNode;
};

/**
 * Which tag the card renders under.
 */
type VocationKind = 'vocation' | 'specialization';

/**
 * A vocation's name as its slug reads
 *
 * @param {string} slug - Vocation slug
 * @returns {string} Display name
 */
function nameOfSlug(slug: string): string {
  return slug.split('-').map(capitalize).join(' ');
}

/**
 * The parent vocation as a link, when the slot holds a slug; anything else
 * prints as given.
 *
 * @param {ReactNode} value - Parent slot value
 * @param {string} locale - Current locale
 * @returns {ReactNode} Link or value
 */
function parentLink(value: ReactNode, locale: string): ReactNode {
  const inline = inlineValue(value);
  if (typeof inline !== 'string' || !/^[a-z0-9-]+$/.test(inline)) return inline;
  return (
    <Link href={`/${locale}/library/${CONTENT_SUBDIRS.vocations}/${inline}`}>
      {nameOfSlug(inline)}
    </Link>
  );
}

/**
 * The card behind both tags.
 *
 * @param {VocationProps & { kind: VocationKind }} props - Card props and kind
 * @returns {JSX.Element} The section
 */
const VocationCard: React.FC<VocationProps & { kind: VocationKind }> = ({
  kind,
  children,
  ...slots
}) => {
  const locale = useLocale();
  const t = useTranslations('library');
  const { values, kept } = readSlots(children, VOCATION_SLOT_NAMES, slots, true);
  const names = VOCATION_SLOT_NAMES.filter(
    (name) => values[name] !== undefined,
  );
  const host = kind === 'specialization' ? 'Specialization' : 'Vocation';
  const features = collectFeatureHeadings(kept);
  const headingIndex = kept.findIndex((node) => isHeadingNode(node));
  const heading = headingIndex >= 0 ? kept[headingIndex] : null;
  const body = headingIndex >= 0 ? kept.filter((_, index) => index !== headingIndex) : kept;

  const rows: DataTableRow[] = names.map((name) => {
    const label: DataTableCellSpec = {
      content: t(slotLabelKey(name, host)),
      header: true,
      dataAttributes: { 'slot-label': name },
    };
    const value: DataTableCellSpec = {
      content: (
        <span data-slot-value>
          {name === 'vocation' ? parentLink(values[name], locale) : inlineValue(values[name])}
        </span>
      ),
      dataAttributes: { slot: name },
    };
    return { key: name, cells: [label, value] };
  });

  return (
    <VocationFeaturesContext.Provider value={features}>
      <section data-vocation data-kind={kind}>
        {heading}
        {rows.length > 0 && (
          <DataTable
            columns={[
              { key: 'trait', header: t('vocationTraits.trait') },
              { key: 'description', header: t('vocationTraits.description') },
            ]}
            rows={rows}
            dataAttributes={{ 'slot-grid': 'traits', 'vocation-traits': kind }}
          />
        )}
        <div data-vocation-body>{body}</div>
      </section>
    </VocationFeaturesContext.Provider>
  );
};

/**
 * Vocation card component.
 *
 * @param {VocationProps} props - Card props
 * @returns {JSX.Element} The vocation section
 */
const Vocation: React.FC<VocationProps> = (props) => (
  <VocationCard kind='vocation' {...props} />
);

Vocation.displayName = 'Vocation';

/**
 * Specialization card component
 *
 * @param {VocationProps} props - Card props
 * @returns {JSX.Element} The specialization section
 */
export const Specialization: React.FC<VocationProps> = (props) => (
  <VocationCard kind='specialization' {...props} />
);

Specialization.displayName = 'Specialization';

export default Vocation;
