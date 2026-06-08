/**
 * @fileoverview Draft persistence use-case.
 * @module modules/mdx-editor/application/use-cases/persistDraft
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { draftRepository } from '@/lib/db/content/repositories/draftRepository';

/**
 * Draft persistence payload.
 *
 * @interface PersistDraftPayload
 * @property {string} locale - Content locale.
 * @property {string} slug - Content slug.
 * @property {string} content - Draft source content.
 */
export interface PersistDraftPayload {
  locale: string;
  slug: string;
  content: string;
}

/**
 * Creates or updates a draft document.
 *
 * @param {PersistDraftPayload} payload - Draft payload.
 * @returns {Promise<Awaited<ReturnType<typeof draftRepository.upsert>>>} Saved draft entity.
 */
export async function persistDraft(payload: PersistDraftPayload) {
  return draftRepository.upsert(payload);
}
