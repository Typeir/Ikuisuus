/**
 * @fileoverview Feature block slot vocabulary.
 * @description Kinds, the slots each kind accepts, and how a slot value prints
 *
 * @module modules/library/presentation/components/slots/feature/featureSlotValues
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-12
 */

import {
  ATTACK_SLOT_NAMES,
  FEATURE_SLOT_NAMES,
  POOL_SLOT_NAMES,
  type SlotName,
} from '@/modules/library/domain/slots';
import { type ReactNode } from 'react';

/**
 * Feature kind values.
 */
export type FeatureKind =
  | 'feature'
  | 'trait'
  | 'curse'
  | 'action'
  | 'pool'
  | 'attack';

/**
 * Slot names each kind accepts.
 */
export const SLOT_NAMES_BY_KIND: Record<FeatureKind, readonly SlotName[]> = {
  feature: FEATURE_SLOT_NAMES,
  trait: FEATURE_SLOT_NAMES,
  curse: FEATURE_SLOT_NAMES,
  action: FEATURE_SLOT_NAMES,
  pool: POOL_SLOT_NAMES,
  attack: ATTACK_SLOT_NAMES,
};

/**
 * Deed types whose timing the card writes.
 */
export const DEED_TYPES = [
  'stratagem',
  'act',
  'resist',
  'lair',
  'phase',
] as const;

/**
 * Host heading tags by level.
 */
export const HEADING_TAGS = [
  null,
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
] as const;

/**
 * A slot value as the card prints it.
 *
 * @param {SlotName} name - Slot name
 * @param {ReactNode} value - Authored value
 * @param {(key: string, values?: Record<string, string>) => string} t -
 * Translator over the `library` namespace
 * @returns {ReactNode} Value to print
 */
export function constructed(
  name: SlotName,
  value: ReactNode,
  t: (key: string, values?: Record<string, string>) => string,
): ReactNode {
  const text = typeof value === 'string' ? value.trim() : '';

  if (name === 'mastery') {
    return text
      ? t('feature.masteryWith', { kind: text })
      : t('feature.masteryAny');
  }

  if (name === 'level') {
    return text ? t('feature.level', { level: text }) : value;
  }

  if (name === 'deed') {
    const type = text.toLowerCase();
    return (DEED_TYPES as readonly string[]).includes(type)
      ? t('feature.deed.' + type)
      : value;
  }

  return value;
}
