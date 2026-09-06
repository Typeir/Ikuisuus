/**
 * @fileoverview Vocation and specialization card.
 * @description The core traits table, one slot per row.
 *
 * @module modules/library/presentation/components/slots/Vocation
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-04
 */

'use client';

import { CONTENT_SUBDIRS } from '@/lib/constants/contentPaths';
import {
  VOCATION_SLOT_NAMES,
  type SlotProps,
  type VocationSlotName,
} from '@/modules/library/domain/slots';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import React, { type ReactNode } from 'react';
import { inlineValue, readSlots, SlotRow } from './slotElements';
import { capitalize } from './text';
import { collectFeatureHeadings, VocationFeaturesContext } from './vocationFeatures';

/**
 * Props for the card: one optional prop per slot, plus the body.
 */
export type VocationProps = SlotProps<VocationSlotName> & {
  children?: ReactNode;
};

/**
 * Which tag the card renders under.
 */
type VocationKind = 'vocation' | 'specialization';

/**
 * A vocation's name as its slug reads: hyphens to spaces, each word capitalised.
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
  const { values, kept } = readSlots(children, VOCATION_SLOT_NAMES, slots);
  const rows = VOCATION_SLOT_NAMES.filter(
    (name) => values[name] !== undefined,
  );
  const host = kind === 'specialization' ? 'Specialization' : 'Vocation';
  const features = collectFeatureHeadings(kept);

  return (
    <VocationFeaturesContext.Provider value={features}>
      <section data-vocation data-kind={kind}>
        {rows.length > 0 && (
          <p data-slot-grid data-vocation-traits>
            {rows.map((name) => (
              <SlotRow key={name} name={name} host={host}>
                {name === 'vocation'
                  ? parentLink(values[name], locale)
                  : inlineValue(values[name])}
              </SlotRow>
            ))}
          </p>
        )}
        <div data-vocation-body>{kept}</div>
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
 * Specialization card component: the vocation card under its own tag.
 *
 * @param {VocationProps} props - Card props
 * @returns {JSX.Element} The specialization section
 */
export const Specialization: React.FC<VocationProps> = (props) => (
  <VocationCard kind='specialization' {...props} />
);

Specialization.displayName = 'Specialization';

export default Vocation;
