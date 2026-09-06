/**
 * @fileoverview Feat card.
 * @description Category and prerequisite read as the brief; the score a feat
 * raises becomes a sentence the card writes.
 *
 * @module modules/library/presentation/components/slots/Feat
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

'use client';

import {
  FEAT_CATEGORIES,
  FEAT_SLOT_NAMES,
  featCategoryKey,
  type FeatSlotName,
  type SlotProps,
} from '@/modules/library/domain/slots';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import { inlineValue, readSlots, SlotRow } from './slotElements';
import { capitalize, flagOf } from './text';
import styles from './slots.module.scss';

/**
 * Props for the feat card: one optional prop per header slot, plus the body.
 */
export type FeatProps = SlotProps<FeatSlotName> & {
  children?: ReactNode;
};

/**
 * A category as the card names it.
 *
 * @param {ReactNode} value - Category slot value
 * @param {(key: string) => string} t - Translator over `library.feat`
 * @returns {ReactNode} Label to print
 */
function categoryLabel(
  value: ReactNode,
  t: (key: string) => string,
): ReactNode {
  if (typeof value !== 'string') return value;
  const key = value.trim().toLowerCase();
  return (FEAT_CATEGORIES as readonly string[]).includes(key)
    ? t(`category.${featCategoryKey(value)}`)
    : capitalize(value.trim());
}

/**
 * Feat card component.
 *
 * @param {FeatProps} props - Card props
 * @returns {JSX.Element} The feat section
 */
const Feat: React.FC<FeatProps> = ({ children, ...slots }) => {
  const t = useTranslations('library.feat');
  const { values, kept } = readSlots(children, FEAT_SLOT_NAMES, slots);

  const brief: ReactNode[] = [];
  if (values.category !== undefined) {
    const category = inlineValue(values.category);
    brief.push(categoryLabel(category, t));
  }
  const repeatable = flagOf(values.repeatable);
  if (repeatable !== false) {
    brief.push(brief.length ? ', ' : '');
    brief.push(repeatable === true ? t('repeatable') : (repeatable as ReactNode));
  }

  const rows: FeatSlotName[] = (['prerequisite'] as FeatSlotName[]).filter(
    (name) => values[name] !== undefined,
  );

  return (
    <section data-feat>
      {brief.length > 0 && (
        <p className={styles.brief} data-feat-brief>
          <em>{brief}</em>
        </p>
      )}
      {rows.length > 0 && (
        <p data-slot-grid data-feat-stats>
          {rows.map((name) => (
            <SlotRow key={name} name={name} host='Feat'>
              {inlineValue(values[name])}
            </SlotRow>
          ))}
        </p>
      )}
      {values.ability !== undefined && (
        <p data-feat-ability>
          {t('increase', { ability: String(inlineValue(values.ability)) })}
        </p>
      )}
      <div data-feat-body>{kept}</div>
    </section>
  );
};

Feat.displayName = 'Feat';

export default Feat;
