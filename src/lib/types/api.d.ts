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
 * @property {string} [shardType] - Singular content kind the route resolved, e.g. `'feat'`
 * @property {Record<string, string>} shards - Map of heading key to markdown body
 * @property {ResolvedShard[]} [keywordShards] - Definitions for the keywords that prose writes, resolved server-side because the client compiles it
 */
export interface ContentShardResponse {
  shardType?: string;
  shards: Record<string, string>;
  keywordShards?: ResolvedShard[];
}

/**
 * A resolved keyword shard and where it came from.
 *
 * @interface ResolvedShard
 * @property {string} id - Shard id, derived from namespace and anchor
 * @property {string} heading - Heading text of the defining section
 * @property {string} source - Section body markdown, without the heading
 * @property {string} href - Locale-relative route and anchor of the defining heading
 */
export interface ResolvedShard {
  id: string;
  heading: string;
  source: string;
  href: string;
}

/**
 * API path segment accepted by the content-shard routes.
 *
 * @typedef {'feats' | 'bloodlines' | 'vocations' | 'specializations'} ContentShardType
 */
export type ContentShardType =
  | 'feats'
  | 'bloodlines'
  | 'vocations'
  | 'specializations';

/**
 * One candidate route returned by `/api/find-nearest-route`.
 *
 * @interface RouteMatch
 * @property {string} path - Locale-relative route path
 * @property {string} [title] - Human-readable page title
 * @property {number} similarity - Match score in [0, 1]
 */
export interface RouteMatch {
  path: string;
  title?: string;
  similarity: number;
}
