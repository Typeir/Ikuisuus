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
import { Eye, EyeOff } from 'lucide-react';
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
}: EditorSplitPaneProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [showPreview, setShowPreview] = useState(true);
  const [splitPercent, setSplitPercent] = useState(50);

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
            <button
              type='button'
              className={styles.previewBadge}
              onClick={() => setShowPreview(false)}
              title='Hide preview'>
              <EyeOff size={14} />
            </button>
            <MdxPreview source={content} />
          </div>
        </>
      )}

      {!showPreview && (
        <button
          type='button'
          className={styles.showPreviewBadge}
          onClick={() => setShowPreview(true)}
          title='Show preview'>
          <Eye size={14} />
        </button>
      )}
    </div>
  );
}
