/**
 * Keyword Index
 *
 * @fileoverview Keyword template id derivation. Pure, with no filesystem
 * access, so the remark plugin stays safe to bundle for the client.
 *
 * @module lib/md/keywordIndex
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

/** Namespace key for references written without a namespace. */
export const BARE_NAMESPACE = '';

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
