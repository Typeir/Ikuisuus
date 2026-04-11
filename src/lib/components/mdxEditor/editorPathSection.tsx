/**
 * @fileoverview Editor Path Section
 * @description Slug/path input with load button for the MDX editor.
 * In new-file mode, shows a FileTreeSelect to pick a folder, plus a text input
 * for the filename. In edit mode, shows a slug input with a load button.
 *
 * @module lib/components/mdxEditor/editorPathSection
 * @version 2.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import { useCorrectionsTreeData } from '@/lib/hooks/data/useDraftAndRouteData';
import { useCallback, useState } from 'react';
import { FileTreeSelect } from './fileTreeSelect';
import styles from './mdxEditor.module.scss';

/**
 * @property {'edit' | 'new'} mode - Editor mode
 * @property {string} slug - Content slug
 * @property {(v: string) => void} setSlug - Update slug
 * @property {string} filePath - File path for new content
 * @property {(v: string) => void} setFilePath - Update file path
 * @property {() => void} handleLoad - Trigger content load
 * @property {boolean} isLoading - Whether content is loading
 * @property {string} locale - Current locale
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
  /** Translation function */
  t: (key: string) => string;
}

/**
 * Path/slug input section for the MDX editor.
 * In edit mode shows a slug input with a load button.
 * In new mode shows a folder tree picker and filename input.
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
  t,
}: EditorPathSectionProps): JSX.Element {
  const { tree, loading: treeLoading } = useCorrectionsTreeData(locale);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [fileName, setFileName] = useState('');

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
        setFilePath(fileName ? folderPath + fileName : folderPath);
      }
    },
    [mode, locale, fileName, setFilePath, setSlug],
  );

  const handleFileNameChange = useCallback(
    (name: string) => {
      setFileName(name);
      setFilePath(selectedFolder + name);
    },
    [selectedFolder, setFilePath],
  );

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel} htmlFor='mdx-editor-path'>
        {mode === 'edit' ? t('slugLabel') : t('pathLabel')}
      </label>
      <div className={styles.fieldRow}>
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
            placeholder='filename.mdx'
            value={fileName}
            onChange={(e) => handleFileNameChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
