/**
 * API Response Types
 *
 * @fileoverview Centralized API response type definitions for all client-side
 * data-fetching hooks. Re-exports existing domain types and declares
 * endpoint-specific response shapes that do not live elsewhere.
 *
 * @module lib/types/api
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @description
 * All SWR data hooks (`useFeats`, `useBloodlines`, `useVocationMetadata`,
 * etc.) import their response generics from this module. Domain entity types
 * (e.g. `BloodlineOption`) are re-exported so consumers have a single import
 * point for both the hook and its return type.
 *
 * @example
 * import type { BloodlineApiItem, FeatMetadata } from '@/lib/types/api';
 */

export type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
export type { BloodlineBoon } from '@/lib/db/content/schemas/bloodlineMetadata.d';
export type {
  BloodlineOption,
  SpecOption,
  VocationOption,
} from '@/lib/types/vocations';

import type { BloodlineBoon } from '@/lib/db/content/schemas/bloodlineMetadata.d';

/**
 * Shape of a single item returned by `/api/bloodlines`.
 *
 * @interface BloodlineApiItem
 * @property {string} slug - Bloodline identifier
 * @property {string} title - Display name
 * @property {number} [boonBudget] - Total boon point budget
 * @property {BloodlineBoon[]} boons - Available boons
 */
export interface BloodlineApiItem {
  slug: string;
  title: string;
  boonBudget?: number;
  boons: BloodlineBoon[];
}

/**
 * Response shape for `/api/content-shards/[type]/[slug]`.
 *
 * @interface ContentShardResponse
 * @property {Record<string, string>} shards - Map of heading key to markdown body
 */
export interface ContentShardResponse {
  shards: Record<string, string>;
}
