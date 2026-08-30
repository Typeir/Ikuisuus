/**
 * @fileoverview Editor Split Pane
 * @description Draggable split-pane layout with code editor on the left and
 * live MDX preview on the right.
 *
 * @module lib/components/mdxEditor/editorSplitPane
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import { handleEditorKeyDown } from '@/modules/mdx-editor/domain/editorCommands';
import { EditorToolbar } from '@/modules/mdx-editor/presentation/EditorToolbar/EditorToolbar';
import { MdxPreview } from '@/modules/mdx-editor/presentation/MdxPreview/MdxPreview';
import { MetadataPane } from '@/modules/mdx-editor/presentation/MetadataPane/MetadataPane';
import { IconButton } from '@/lib/components/ui/iconButton';
import { useTranslations } from 'next-intl';
import type { JSX } from 'react';
import { useCallback, useRef, useState } from 'react';
import Editor from 'react-simple-code-editor';
import styles from './EditorSplitPane.module.scss';

import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-markup';

/**
 * @property {string} textareaId - DOM id of the code editor textarea
 * @property {string} content - Editor text content
 * @property {(v: string) => void} setContent - Update editor content
 * @property {boolean} disabled - Whether the editor is inactive
 * @property {'edit' | 'new'} mode - Editor mode
 * @property {string} newPlaceholder - Placeholder text for new file mode
 */
interface EditorSplitPaneProps {
  /** DOM id of the code editor textarea */
  textareaId: string;
  /** Editor text content */
  content: string;
  /** Update editor content */
  setContent: (v: string) => void;
  /** Whether the editor is inactive */
  disabled: boolean;
  /** Editor mode */
  mode: 'edit' | 'new';
  /** Placeholder text for new file mode */
  newPlaceholder: string;
  /** Locale-relative content path (e.g. `en/spells/foo.mdx`), for metadata preview */
  filePath?: string;
  /** Loads an existing page's source into the buffer, by editor slug */
  onCopyFrom?: (slug: string) => void;
}

/**
 * Syntax-highlights code using Prism's markdown grammar.
 *
 * @param {string} code - Raw source to highlight
 * @returns {string} HTML string with Prism token spans
 */
const highlight = (code: string): string =>
  Prism.highlight(code, Prism.languages.markdown, 'markdown');

/**
 * Split-pane editor layout with a draggable divider.
 * Left side: toolbar + syntax-highlighted code editor.
 * Right side: live MDX preview (toggleable).
 *
 * @component
 * @param {EditorSplitPaneProps} props - Component properties
 * @param {string} props.textareaId - DOM id of the code editor textarea
 * @param {string} props.content - Editor text content
 * @param {Function} props.setContent - Update editor content callback
 * @param {boolean} props.disabled - Whether the editor is inactive
 * @param {'edit' | 'new'} props.mode - Editor mode
 * @param {string} props.newPlaceholder - Placeholder text for new file mode
 * @returns {JSX.Element} Split pane editor
 */
export function EditorSplitPane({
  textareaId,
  content,
  setContent,
  disabled,
  mode,
  newPlaceholder,
  filePath = '',
  onCopyFrom,
}: EditorSplitPaneProps): JSX.Element {
  const t = useTranslations('mdxEditor.preview');
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewFace, setPreviewFace] = useState<'file' | 'meta'>('file');
  const [metaRefreshToken, setMetaRefreshToken] = useState(0);
  const [splitPercent, setSplitPercent] = useState(50);
  const repoPath = filePath ? `src/content/${filePath.replace(/^\/+/, '')}` : '';

  const handleDividerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handleDividerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPercent(Math.min(80, Math.max(20, pct)));
  }, []);

  const handleDividerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.splitPane}
      style={
        showPreview
          ? { ['--split-percent' as string]: `${splitPercent}%` }
          : undefined
      }>
      <div className={styles.editorPane}>
        <EditorToolbar
          textareaId={textareaId}
          value={content}
          disabled={disabled}
          onCopyFrom={onCopyFrom}
        />
        <Editor
          value={content}
          onValueChange={setContent}
          highlight={highlight}
          disabled={disabled}
          padding={12}
          className={styles.codeEditor}
          textareaClassName={styles.codeEditorTextarea}
          textareaId={textareaId}
          onKeyDown={(e) => handleEditorKeyDown(e, textareaId, content)}
          placeholder={mode === 'new' ? newPlaceholder : ''}
        />
      </div>

      {showPreview && (
        <>
          <div
            className={styles.divider}
            onPointerDown={handleDividerDown}
            onPointerMove={handleDividerMove}
            onPointerUp={handleDividerUp}
          />
          <div className={styles.previewPane}>
            <IconButton
              kind='previewOff'
              shape='square'
              label={t('hide')}
              title={t('hide')}
              onClick={() => setShowPreview(false)}
              className={styles.previewBadge}
            />
            <IconButton
              kind={previewFace === 'file' ? 'meta' : 'file'}
              shape='square'
              label={previewFace === 'file' ? t('showMetadata') : t('showFile')}
              title={previewFace === 'file' ? t('showMetadata') : t('showFile')}
              onClick={() =>
                setPreviewFace(previewFace === 'file' ? 'meta' : 'file')
              }
              className={styles.faceBadge}
            />
            {previewFace === 'meta' && (
              <IconButton
                kind='refresh'
                shape='square'
                label={t('refreshMetadata')}
                title={t('refreshMetadata')}
                onClick={() => setMetaRefreshToken((n) => n + 1)}
                className={styles.refreshBadge}
              />
            )}
            {previewFace === 'file' ? (
              <MdxPreview source={content} />
            ) : (
              <MetadataPane
                path={repoPath}
                content={content}
                refreshToken={metaRefreshToken}
              />
            )}
          </div>
        </>
      )}

      {!showPreview && (
        <IconButton
          kind='preview'
          shape='square'
          label={t('show')}
          title={t('show')}
          onClick={() => setShowPreview(true)}
          className={styles.showPreviewBadge}
        />
      )}
    </div>
  );
}
