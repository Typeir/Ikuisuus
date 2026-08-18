/**
 * @fileoverview Path/slug input section for MDX editor.
 *
 * @module lib/components/mdxEditor/editorPathSection
 * @version 2.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import { useCorrectionsTree } from '@/modules/mdx-editor/application/hooks/useCorrectionsTree';
import { FileTreeSelect } from '@/modules/mdx-editor/presentation/FileTreeSelect/FileTreeSelect';
import type { JSX } from 'react';
import { useCallback, useState } from 'react';
import styles from './EditorPathSection.module.scss';

/**
 * @property {'edit' | 'new'} mode - Editor mode
 * @property {string} slug - Content slug
 * @property {(v: string) => void} setSlug - Update slug
 * @property {string} filePath - File path for new content
 * @property {(v: string) => void} setFilePath - Update file path
 * @property {() => void} handleLoad - Trigger content load
 * @property {boolean} isLoading - Whether content is loading
 * @property {string} locale - Current locale
 * @property {boolean} renameEnabled - Whether rename is enabled
 * @property {string} renameToPath - Target rename path
 * @property {(v: boolean) => void} onRenameToggle - Rename toggle handler
 * @property {(v: string) => void} onRenamePathChange - Rename path change handler
 * @property {(key: string) => string} t - Translation function
 */
interface EditorPathSectionProps {
  /** Editor mode */
  mode: 'edit' | 'new';
  /** Content slug */
  slug: string;
  /** Update slug */
  setSlug: (v: string) => void;
  /** File path for new content */
  filePath: string;
  /** Update file path */
  setFilePath: (v: string) => void;
  /** Trigger content load */
  handleLoad: () => void;
  /** Whether content is loading */
  isLoading: boolean;
  /** Current locale */
  locale: string;
  /** Whether rename is enabled */
  renameEnabled: boolean;
  /** Target rename path */
  renameToPath: string;
  /** Rename toggle handler */
  onRenameToggle: (v: boolean) => void;
  /** Rename path change handler */
  onRenamePathChange: (v: string) => void;
  /** Translation function */
  t: (key: string) => string;
}

/**
 * Path/slug input section for the MDX editor.
 *
 * @component
 * @param {EditorPathSectionProps} props - Component properties
 * @param {'edit' | 'new'} props.mode - Editor mode
 * @param {string} props.slug - Content slug
 * @param {Function} props.setSlug - Update slug callback
 * @param {string} props.filePath - File path for new content
 * @param {Function} props.setFilePath - Update file path callback
 * @param {Function} props.handleLoad - Trigger content load
 * @param {boolean} props.isLoading - Whether content is loading
 * @param {string} props.locale - Current locale
 * @param {Function} props.t - Translation function
 * @returns {JSX.Element} Path section
 */
export function EditorPathSection({
  mode,
  slug,
  setSlug,
  filePath,
  setFilePath,
  handleLoad,
  isLoading,
  locale,
  renameEnabled,
  renameToPath,
  onRenameToggle,
  onRenamePathChange,
  t,
}: EditorPathSectionProps): JSX.Element {
  const { tree, loading: treeLoading } = useCorrectionsTree(locale);
  const [selectedFolder, setSelectedFolder] = useState('');

  const handleFolderSelect = useCallback(
    (folderPath: string) => {
      setSelectedFolder(folderPath);
      if (mode === 'edit') {
        const stripped = folderPath
          .replace(/\/$/, '')
          .replace(new RegExp(`^${locale}/`), '')
          .replace(/\.(md|mdx)$/, '')
          .replace(
            /\.(sheet|specialization|list|reference|heirloom|trinket|bloodline|lore)$/,
            '',
          );
        setSlug(stripped);
      } else {
        /* Keep whatever filename the flat path already holds; only the
           destination folder changes. */
        const fileName = filePath.slice(filePath.lastIndexOf('/') + 1);
        setFilePath(folderPath + fileName);
      }
    },
    [mode, locale, filePath, setFilePath, setSlug],
  );

  const handlePathChange = useCallback(
    (value: string) => {
      setFilePath(value);
      const slash = value.lastIndexOf('/');
      setSelectedFolder(slash === -1 ? '' : value.slice(0, slash + 1));
    },
    [setFilePath],
  );

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.pathFieldLabel} htmlFor='mdx-editor-path'>
        {mode === 'edit' ? t('slugLabel') : t('pathLabel')}
      </label>
      <div className={styles.pathFieldRow}>
        <FileTreeSelect
          value={selectedFolder}
          onSelect={handleFolderSelect}
          tree={tree}
          loading={treeLoading}
          placeholder={
            mode === 'edit' ? t('slugPlaceholder') : t('pathPlaceholder')
          }
          newFileLabel={t('newFile')}
          disabled={isLoading}
          foldersOnly={mode === 'new'}
        />
        {mode === 'edit' ? (
          <>
            <input
              id='mdx-editor-path'
              type='text'
              className={styles.pathInput}
              placeholder={t('slugPlaceholder')}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <button
              type='button'
              className={styles.submitButton}
              onClick={handleLoad}
              disabled={!slug.trim() || isLoading}>
              {t('loadButton')}
            </button>
          </>
        ) : (
          <input
            id='mdx-editor-path'
            type='text'
            className={styles.pathInput}
            placeholder={t('fullPathPlaceholder')}
            value={filePath}
            onChange={(e) => handlePathChange(e.target.value)}
          />
        )}
      </div>

      {mode === 'edit' && (
        <div className={styles.renameToggleRow}>
          <label className={styles.renameLabel}>
            <input
              type='checkbox'
              checked={renameEnabled}
              onChange={(e) => onRenameToggle(e.target.checked)}
              className={styles.renameCheckbox}
            />
            <span>{t('renameFile')}</span>
          </label>
          {renameEnabled && (
            <input
              type='text'
              value={renameToPath}
              onChange={(e) => onRenamePathChange(e.target.value)}
              placeholder={t('newPath')}
              className={styles.renamePathInput}
            />
          )}
        </div>
      )}
    </div>
  );
}
