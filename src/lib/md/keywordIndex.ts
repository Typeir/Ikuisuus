/**
 * Keyword Index
 *
 * @fileoverview Shapes and lookups for the keyword namespace index. Pure, with
 * no filesystem access, so the remark plugin stays safe to bundle for the
 * client. Discovery lives in `keywordIndexRegistry`, which is server only.
 *
 * @module lib/md/keywordIndex
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { REGEX_EXTENSION, stripContentSuffix } from '@/lib/enums/constants';
import { anchorSlug } from '@/modules/library/domain/anchorSlug';

/** Namespace key for references written without a namespace. */
export const BARE_NAMESPACE = '';

/**
 * One heading that defines a keyword value.
 *
 * @interface KeywordValue
 * @property {string} anchor - Slug of the defining heading
 * @property {string} heading - Heading text as authored
 * @property {string} filePath - Defining file, relative to the locale root
 */
export interface KeywordValue {
  anchor: string;
  heading: string;
  filePath: string;
}

/**
 * A namespace and every value contributed to it.
 *
 * @interface KeywordNamespace
 * @property {string} namespace - Declared name, or the empty string for bare terms
 * @property {Map<string, KeywordValue[]>} values - Anchor mapped to its definitions
 * @property {string[]} sources - Files that contribute to this namespace
 */
export interface KeywordNamespace {
  namespace: string;
  values: Map<string, KeywordValue[]>;
  sources: string[];
}

/** Namespace name mapped to its contents. */
export type KeywordRegistry = Map<string, KeywordNamespace>;

/**
 * A value claimed by more than one file.
 *
 * @interface KeywordCollision
 * @property {string} namespace - Namespace the value belongs to
 * @property {string} anchor - Contested value slug
 * @property {string[]} filePaths - Every file claiming it
 */
export interface KeywordCollision {
  namespace: string;
  anchor: string;
  filePaths: string[];
}

/**
 * Adds a value to a namespace, creating the namespace when absent.
 *
 * @param {KeywordRegistry} registry - Registry being built
 * @param {string} namespace - Namespace to contribute to
 * @param {KeywordValue} value - Value being contributed
 * @returns {void}
 */
export function contributeKeyword(
  registry: KeywordRegistry,
  namespace: string,
  value: KeywordValue,
): void {
  let entry = registry.get(namespace);
  if (!entry) {
    entry = { namespace, values: new Map(), sources: [] };
    registry.set(namespace, entry);
  }

  if (!entry.sources.includes(value.filePath)) {
    entry.sources.push(value.filePath);
  }

  const existing = entry.values.get(value.anchor);
  if (!existing) {
    entry.values.set(value.anchor, [value]);
    return;
  }

  /* A page that both declares `keywords:` and is indexed wholesale would
     otherwise claim the same anchor twice and read as a collision. */
  if (existing.some((held) => held.filePath === value.filePath)) return;

  existing.push(value);
}

/**
 * Lists every value claimed by more than one file. A collision is reported
 * rather than thrown, so headings that merely share text stay harmless until
 * something references them.
 *
 * @param {KeywordRegistry} registry - Discovered namespaces
 * @returns {KeywordCollision[]} Contested values across all namespaces
 */
export function listKeywordCollisions(
  registry: KeywordRegistry,
): KeywordCollision[] {
  const collisions: KeywordCollision[] = [];

  for (const entry of registry.values()) {
    for (const [anchor, values] of entry.values) {
      if (values.length < 2) continue;
      collisions.push({
        namespace: entry.namespace,
        anchor,
        filePaths: values.map((value) => value.filePath),
      });
    }
  }

  return collisions;
}

/**
 * Resolves a reference to the file and anchor that define it.
 *
 * @param {KeywordRegistry} registry - Discovered namespaces
 * @param {string | undefined} namespace - Reference namespace, or undefined when bare
 * @param {string} value - Reference value, e.g. `prone`
 * @returns {KeywordValue | null} The single definition, or null when unresolved or contested
 */
export function resolveKeywordRef(
  registry: KeywordRegistry,
  namespace: string | undefined,
  value: string,
): KeywordValue | null {
  const entry = registry.get((namespace ?? BARE_NAMESPACE).toLowerCase());
  if (!entry) return null;

  const found = entry.values.get(anchorSlug(value));
  if (!found || found.length !== 1) return null;

  return found[0];
}

/**
 * DOM id of the baked `<template>` holding a reference's shard prose. The
 * namespace segment is always present, so a bare term yields `kw--accuracy`
 * and cannot collide with a namespaced one.
 *
 * @param {string | undefined} namespace - Reference namespace, or undefined when bare
 * @param {string} anchor - Slug of the defining heading
 * @returns {string} Template element id
 */
export function keywordTemplateId(
  namespace: string | undefined,
  anchor: string,
): string {
  return `kw-${namespace ?? BARE_NAMESPACE}-${anchor}`;
}

/**
 * Route path for a content file, without locale prefix.
 *
 * @param {string} filePath - Path relative to the locale root
 * @returns {string} Library route, e.g. `library/rules/steel-and-strife/conditions`
 */
export function routeForFile(filePath: string): string {
  const stem = stripContentSuffix(filePath.replace(REGEX_EXTENSION, ''));
  return `library/${stem}`;
}
