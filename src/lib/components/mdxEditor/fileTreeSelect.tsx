/**
 * @fileoverview FileTreeSelect Component
 * @description Filesystem-style tree combobox for selecting content folder paths.
 * Displays a hierarchical tree of folders with expandable nodes. Each folder
 * ends with a dotted-line "New file" option that selects that folder path.
 *
 * @module lib/components/mdxEditor/fileTreeSelect
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './fileTreeSelect.module.scss';

/**
 * Tree node representing a content folder.
 *
 * @property {string} name - Display name of the folder
 * @property {string} path - Full path (e.g. `"en/monsters"`)
 * @property {TreeNode[]} children - Nested subfolders
 */
export interface TreeNode {
  /** Folder display name */
  name: string;
  /** Full relative path */
  path: string;
  /** Nested subfolders */
  children: TreeNode[];
}

/**
 * @property {string} value - Currently selected path
 * @property {(path: string) => void} onSelect - Callback when a folder is selected
 * @property {TreeNode[]} tree - Tree data to display
 * @property {boolean} [loading] - Whether tree data is loading
 * @property {string} [placeholder] - Placeholder text
 * @property {boolean} [disabled] - Whether the select is disabled
 */
interface FileTreeSelectProps {
  /** Currently selected path */
  value: string;
  /** Callback when a folder is selected */
  onSelect: (path: string) => void;
  /** Tree data */
  tree: TreeNode[];
  /** Whether tree data is loading */
  loading?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Label for the "New file" row */
  newFileLabel?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
}

/**
 * Renders a single tree node and its children recursively.
 *
 * @param {Object} props - Node props
 * @param {TreeNode} props.node - The tree node to render
 * @param {number} props.depth - Nesting depth for indentation
 * @param {Set<string>} props.expanded - Set of expanded folder paths
 * @param {(path: string) => void} props.toggle - Toggle expansion callback
 * @param {(path: string) => void} props.onSelect - Select callback
 * @param {string} props.newFileLabel - Label for "New file"
 * @returns {JSX.Element} Rendered tree node
 */
function TreeNodeRow({
  node,
  depth,
  expanded,
  toggle,
  onSelect,
  newFileLabel,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  toggle: (path: string) => void;
  onSelect: (path: string) => void;
  newFileLabel: string;
}): JSX.Element {
  const isOpen = expanded.has(node.path);
  const indent = depth * 16;

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
            <TreeNodeRow
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

/**
 * Filesystem-style tree combobox for content folder selection.
 * Opens a dropdown with expandable folder nodes. Each folder ends with
 * a "New file" option styled with a dashed border to draw attention.
 *
 * @component
 * @param {FileTreeSelectProps} props - Component properties
 * @param {string} props.value - Currently selected path
 * @param {Function} props.onSelect - Callback when a folder is selected
 * @param {TreeNode[]} props.tree - Tree data
 * @param {boolean} [props.loading=false] - Whether tree data is loading
 * @param {string} [props.placeholder='Select folder...'] - Placeholder text
 * @param {string} [props.newFileLabel='New file'] - Label for the "New file" row
 * @param {boolean} [props.disabled=false] - Whether the select is disabled
 * @returns {JSX.Element} Tree select dropdown
 */
export function FileTreeSelect({
  value,
  onSelect,
  tree,
  loading = false,
  placeholder = 'Select folder...',
  newFileLabel = 'New file',
  disabled = false,
}: FileTreeSelectProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (path: string) => {
      onSelect(path);
      setIsOpen(false);
    },
    [onSelect],
  );

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={styles.treeSelect}>
      <button
        type='button'
        className={styles.trigger}
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup='listbox'
        aria-expanded={isOpen}>
        <span
          className={`${styles.triggerText} ${!value ? styles.triggerPlaceholder : ''}`}>
          {loading ? '...' : value || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role='listbox'>
          {tree.length === 0 ? (
            <div className={styles.emptyState}>
              {loading ? '...' : 'No folders found'}
            </div>
          ) : (
            tree.map((node) => (
              <TreeNodeRow
                key={node.path}
                node={node}
                depth={0}
                expanded={expanded}
                toggle={toggle}
                onSelect={handleSelect}
                newFileLabel={newFileLabel}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
