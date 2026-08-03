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

import type { TreeNode } from '@/modules/mdx-editor/domain/types';
import { FileTreeSelectRow } from '@/modules/mdx-editor/presentation/FileTreeSelect/FileTreeSelectRow';
import { ChevronDown } from 'lucide-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './FileTreeSelect.module.scss';

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
          className={`${styles.pathLabel} ${!value ? styles.triggerPlaceholder : ''}`}>
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
              <FileTreeSelectRow
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
