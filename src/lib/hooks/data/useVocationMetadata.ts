/**
 * @fileoverview Vocation Metadata Hook
 * @description Client hook that loads bloodline, vocation, and specialization
 * metadata when the character sheet enters edit mode.
 *
 * @module lib/hooks/data/useVocationMetadata
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import {
    bloodlinesKey,
    specializationsKey,
    urlForBloodlines,
    urlForSpecializations,
    urlForVocations,
    vocationsKey,
} from '@/lib/fetch/swrKeys';
import type {
    BloodlineOption,
    SpecOption,
    VocationOption,
} from '@/lib/types/vocations';
import { fetcher } from '@/lib/fetch/fetcher';
import useSWR from 'swr';

/**
 * Loaded vocation metadata state returned by the hook.
 *
 * @interface VocationMetadataState
 * @property {BloodlineOption[]} bloodlines - Available bloodlines
 * @property {VocationOption[]} vocOptions - Available vocations
 * @property {SpecOption[]} specs - Available specializations
 * @property {boolean} isLoading - Whether any metadata fetch is in progress
 */
export interface VocationMetadataState {
  bloodlines: BloodlineOption[];
  vocOptions: VocationOption[];
  specs: SpecOption[];
  isLoading: boolean;
}

/**
 * Loads bloodline, vocation, and specialization metadata in parallel when
 * `editing` becomes `true`.
 *
 * @param {boolean} editing - Whether the character sheet is in edit mode
 * @param {string} locale - Content locale (e.g. `'en'`, `'es'`)
 * @returns {VocationMetadataState} Loaded metadata arrays and loading flag
 */
export function useVocationMetadata(
  editing: boolean,
  locale: string,
): VocationMetadataState {
  const { data: bloodlines, isLoading: loadingBl } = useSWR<BloodlineOption[]>(
    bloodlinesKey(locale, editing),
    () =>
      fetcher<BloodlineOption[]>(urlForBloodlines(locale)).catch(() => []),
  );

  const { data: vocOptions, isLoading: loadingVoc } = useSWR<VocationOption[]>(
    vocationsKey(locale, editing),
    () =>
      fetcher<VocationOption[]>(urlForVocations(locale)).catch(() => []),
  );

  const { data: specs, isLoading: loadingSpec } = useSWR<SpecOption[]>(
    specializationsKey(locale, editing),
    () =>
      fetcher<SpecOption[]>(urlForSpecializations(locale)).catch(() => []),
  );

  return {
    bloodlines: bloodlines ?? [],
    vocOptions: vocOptions ?? [],
    specs: specs ?? [],
    isLoading: loadingBl || loadingVoc || loadingSpec,
  };
}
