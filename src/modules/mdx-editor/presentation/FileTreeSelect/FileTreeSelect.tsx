/**
 * @fileoverview Combobox for folder path selection from tree.
 *
 * @module modules/mdx-editor/presentation/FileTreeSelect/FileTreeSelect
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import type { TreeNode } from '@/modules/mdx-editor/domain/types';
import { FileTreeSelectRow } from '@/modules/mdx-editor/presentation/FileTreeSelect/FileTreeSelectRow';
import { useOutsideClick } from '@/lib/hooks/useOutsideClick';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  /** Render folders as destinations only; file rows are hidden */
  foldersOnly?: boolean;
}

/**
 * Combobox for selecting a folder from a tree. Renders expandable folder
 * nodes; each ends with a "New file" option styled with a dashed border.
 *
 * @component
 * @param {FileTreeSelectProps} props - Component properties
 * @param {string} props.value - Currently selected path
 * @param {Function} props.onSelect - Callback when a folder is selected
 * @param {TreeNode[]} props.tree - Tree data
 * @param {boolean} [props.loading=false] - Whether tree data is loading
 * @param {string} [props.placeholder] - Placeholder text; defaults to the localized mdxEditor.selectFolder string
 * @param {string} [props.newFileLabel] - Label for the "New file" row; defaults to the localized mdxEditor.newFile string
 * @param {boolean} [props.disabled=false] - Whether the select is disabled
 * @returns {JSX.Element} Tree select dropdown
 */
export function FileTreeSelect({
  value,
  onSelect,
  tree,
  loading = false,
  placeholder,
  newFileLabel,
  disabled = false,
  foldersOnly = false,
}: FileTreeSelectProps): JSX.Element {
  const t = useTranslations('mdxEditor');
  const resolvedPlaceholder = placeholder ?? t('selectFolder');
  const resolvedNewFileLabel = newFileLabel ?? t('newFile');
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

  useOutsideClick(containerRef, () => setIsOpen(false), isOpen);

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
          {loading ? '...' : value || resolvedPlaceholder}
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
              {loading ? '...' : t('noFolders')}
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
                newFileLabel={resolvedNewFileLabel}
                foldersOnly={foldersOnly}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
