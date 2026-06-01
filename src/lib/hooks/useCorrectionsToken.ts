/**
 * @fileoverview Backward-compatible shim for mdx-editor corrections token hooks.
 * @module lib/hooks/useCorrectionsToken
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

export {
    useCorrectionsTokenActions,
    useCorrectionsTokenState
} from '@/modules/mdx-editor/application/hooks/useCorrectionsToken';

export type {
    CorrectionsTokenActions,
    CorrectionsTokenState
} from '@/modules/mdx-editor/application/hooks/useCorrectionsToken';

