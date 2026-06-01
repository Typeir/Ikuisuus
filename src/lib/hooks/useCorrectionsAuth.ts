/**
 * @fileoverview Backward-compatible shim for mdx-editor corrections auth hook.
 * @module lib/hooks/useCorrectionsAuth
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

export { useCorrectionsAuth } from '@/modules/mdx-editor/application/hooks/useCorrectionsAuth';

export type {
    CorrectionsAuthActions,
    CorrectionsAuthState
} from '@/modules/mdx-editor/application/hooks/useCorrectionsAuth';

export type { AuthUser } from '@/modules/mdx-editor/domain/types';

