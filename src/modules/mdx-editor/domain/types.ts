/**
 * Mdx Editor Domain Types
 *
 * @fileoverview Shared domain types for the mdx-editor module.
 * @description Used by application hooks, presentation components, and
 * infrastructure clients/routes.
 *
 * @module modules/mdx-editor/domain/types
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

import type { DraftMetadata } from '@/lib/db/content/schemas/draftMetadata';

/**
 * Tree node representing a content folder or file.
 *
 * @interface TreeNode
 * @property {string} name - Display name for this node.
 * @property {string} path - Full relative path from locale root.
 * @property {TreeNode[]} children - Nested child nodes.
 * @property {boolean} [isFile] - Whether the node represents a file.
 */
export interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isFile?: boolean;
}

/**
 * Public user info returned by editor authentication.
 *
 * @interface AuthUser
 * @property {string} id - User identifier.
 * @property {string} username - Display username.
 * @property {'admin' | 'editor'} role - Effective editor role.
 */
export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'editor';
}

/**
 * Internal state machine for the editor.
 *
 * @typedef {Object} EditorStatus
 */
export type EditorStatus =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'ready'; sha: string; resolvedPath: string }
  | { phase: 'new' }
  | { phase: 'submitting' }
  | { phase: 'success'; prUrl: string }
  | { phase: 'error'; message: string };

/**
 * Return type contract of the editor state hook.
 *
 * @interface EditorState
 * @property {'edit' | 'new'} mode - Edit existing or create new mode.
 * @property {EditorStatus} status - Current editor state machine phase.
 * @property {string} content - Current source content.
 * @property {(v: string) => void} setContent - Set editor content.
 * @property {string} filePath - Current target file path.
 * @property {(v: string) => void} setFilePath - Set target file path.
 * @property {string} slug - Current slug.
 * @property {(v: string) => void} setSlug - Set slug.
 * @property {() => void} handleLoad - Load content action.
 * @property {() => Promise<void>} handleSubmit - Submit content action.
 * @property {boolean} canSubmit - Whether submit action is enabled.
 * @property {boolean} editorDisabled - Whether editor interactions are disabled.
 */
export interface EditorState {
  mode: 'edit' | 'new';
  status: EditorStatus;
  content: string;
  setContent: (v: string) => void;
  filePath: string;
  setFilePath: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  renameEnabled: boolean;
  renameToPath: string;
  setRenameEnabled: (v: boolean) => void;
  setRenameToPath: (v: string) => void;
  handleLoad: () => void;
  handleSubmit: () => Promise<void>;
  canSubmit: boolean;
  editorDisabled: boolean;
}

/**
 * Tree node shape returned by corrections tree API client.
 *
 * @interface CorrectionsTreeNode
 * @property {string} name - Display name for node.
 * @property {string} path - Full relative path.
 * @property {'file' | 'directory'} type - Node type discriminator.
 * @property {CorrectionsTreeNode[]} [children] - Nested nodes for directories.
 */
export interface CorrectionsTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: CorrectionsTreeNode[];
}

/**
 * Active draft hook state.
 *
 * @interface DraftState
 * @property {DraftMetadata | null} draft - Active draft when present.
 * @property {boolean} loading - Whether the draft request is in flight.
 */
export interface DraftState {
  draft: DraftMetadata | null;
  loading: boolean;
}

/**
 * Corrections tree hook state.
 *
 * @interface CorrectionsTreeState
 * @property {TreeNode[]} tree - Picker tree data.
 * @property {boolean} loading - Whether tree request is in flight.
 */
export interface CorrectionsTreeState {
  tree: TreeNode[];
  loading: boolean;
}
