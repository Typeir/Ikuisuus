/**
 * @fileoverview Public barrel for mdx-editor module.
 * @module modules/mdx-editor/index
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

export { DraftBanner } from '@/modules/mdx-editor/presentation/DraftBanner/DraftBanner';
export { DraftOverlay } from '@/modules/mdx-editor/presentation/DraftOverlay/DraftOverlay';
export { EditPageButton } from '@/modules/mdx-editor/presentation/EditPageButton/EditPageButton';
export { MdxEditor } from '@/modules/mdx-editor/presentation/MdxEditor/MdxEditor';

export { useActiveDraft } from '@/modules/mdx-editor/application/hooks/useActiveDraft';
export { useCorrectionsAuth } from '@/modules/mdx-editor/application/hooks/useCorrectionsAuth';
export { useCorrectionsTree } from '@/modules/mdx-editor/application/hooks/useCorrectionsTree';

export type {
    AuthUser, CorrectionsTreeNode, EditorState, EditorStatus, TreeNode
} from '@/modules/mdx-editor/domain/types';

