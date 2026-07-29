/**
 * @fileoverview Recursive row renderer for FileTreeSelect.
 * @module modules/mdx-editor/presentation/FileTreeSelect/FileTreeSelectRow
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import type { JSX } from 'react';
import type { TreeNode } from '@/modules/mdx-editor/domain/types';
import {
    ChevronDown,
    ChevronRight,
    FilePlus,
    FileText,
    Folder,
    FolderOpen,
} from 'lucide-react';
import styles from './FileTreeSelect.module.scss';

/**
 * Props for one tree row node.
 *
 * @interface FileTreeSelectRowProps
 * @property {TreeNode} node - Node being rendered.
 * @property {number} depth - Current depth level.
 * @property {Set<string>} expanded - Expanded directory path set.
 * @property {(path: string) => void} toggle - Toggle directory expansion.
 * @property {(path: string) => void} onSelect - Selection callback.
 * @property {string} newFileLabel - Label for new-file pseudo-node.
 */
interface FileTreeSelectRowProps {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  toggle: (path: string) => void;
  onSelect: (path: string) => void;
  newFileLabel: string;
}

/**
 * Renders a tree row recursively for files and directories.
 *
 * @param {FileTreeSelectRowProps} props - Row properties.
 * @returns {JSX.Element} Recursive row tree.
 */
export function FileTreeSelectRow({
  node,
  depth,
  expanded,
  toggle,
  onSelect,
  newFileLabel,
}: FileTreeSelectRowProps): JSX.Element {
  const isOpen = expanded.has(node.path);
  const indent = depth * 16;

  if (node.isFile) {
    return (
      <button
        type='button'
        className={styles.fileNode}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => onSelect(node.path)}>
        <span className={styles.nodeIcon}>
          <FileText size={14} />
        </span>
        <span className={styles.nodeName}>{node.name}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type='button'
        className={styles.treeNode}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => toggle(node.path)}
        aria-expanded={isOpen}>
        <span
          className={`${styles.nodeIcon} ${isOpen ? styles.nodeIconOpen : ''}`}>
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        <span className={styles.nodeIcon}>
          {isOpen ? <FolderOpen size={14} /> : <Folder size={14} />}
        </span>
        <span className={styles.nodeName}>{node.name}/</span>
      </button>

      {isOpen && (
        <>
          {node.children.map((child) => (
            <FileTreeSelectRow
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              onSelect={onSelect}
              newFileLabel={newFileLabel}
            />
          ))}
          <button
            type='button'
            className={styles.newFileNode}
            style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            onClick={() => onSelect(node.path + '/')}>
            <FilePlus size={12} className={styles.newFileIcon} />
            {newFileLabel}
          </button>
        </>
      )}
    </>
  );
}
