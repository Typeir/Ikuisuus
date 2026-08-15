/**
 * @fileoverview MDX Editor Component
 * @description Full-page shell for creating or editing MDX content files via the content repo
 * GitHub API. Orchestrates useEditorState; UI sections: EditorAuthSection, EditorPathSection,
 * EditorSplitPane, EditorFooter.
 *
 * @module lib/components/mdxEditor/mdxEditor
 * @version 3.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import type { JSX } from 'react';
import { useCorrectionsAuth } from '@/modules/mdx-editor/application/hooks/useCorrectionsAuth';
import { useEditorState } from '@/modules/mdx-editor/application/hooks/useEditorState';
import { EditorAuthSection } from '@/modules/mdx-editor/presentation/EditorAuthSection/EditorAuthSection';
import { EditorFooter } from '@/modules/mdx-editor/presentation/EditorFooter/EditorFooter';
import { EditorPathSection } from '@/modules/mdx-editor/presentation/EditorPathSection/EditorPathSection';
import { EditorSplitPane } from '@/modules/mdx-editor/presentation/EditorSplitPane/EditorSplitPane';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import styles from './MdxEditor.module.scss';

/** Stable DOM id for the code editor textarea. */
const TEXTAREA_ID = 'mdx-code-editor';

/**
 * Props for the MdxEditor component.
 *
 * @property {string} locale - Current locale (e.g. `"en"`)
 */
interface MdxEditorProps {
  /** Current locale */
  locale: string;
}

/**
 * MDX Editor tool view.
 *
 * Renders a full-page editor with file path input, authorization token input,
 * MDX textarea, and submit button. Two modes via `?slug`: **Edit** pre-loads an
 * existing file from the content repo; **New** shows a blank editor.
 *
 * @component
 * @param {MdxEditorProps} props - Component properties
 * @param {string} props.locale - Current locale
 * @returns {JSX.Element} Full editor view
 *
 * @example
 * <MdxEditor locale="en" />
 */
export const MdxEditor = ({ locale }: MdxEditorProps): JSX.Element => {
  const t = useTranslations('mdxEditor');
  const searchParams = useSearchParams();
  const {
    token,
    user,
    isLoggingIn,
    error: authError,
    login: doLogin,
    logout,
    clearError: clearAuthError,
  } = useCorrectionsAuth();

  const rawSlug = searchParams.get('slug') ?? '';
  const initialSlug = (() => {
    try {
      return decodeURIComponent(rawSlug);
    } catch {
      return rawSlug;
    }
  })();
  const initialLocale = searchParams.get('locale') ?? locale;

  const editor = useEditorState({
    initialSlug,
    initialLocale,
    token,
    t,
  });

  return (
    <div className={styles.editorContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>
      </div>

      <EditorAuthSection
        user={user}
        isLoggingIn={isLoggingIn}
        authError={authError}
        doLogin={doLogin}
        logout={logout}
        clearAuthError={clearAuthError}
        t={t}
      />

      <EditorPathSection
        mode={editor.mode}
        slug={editor.slug}
        setSlug={editor.setSlug}
        filePath={editor.filePath}
        setFilePath={editor.setFilePath}
        handleLoad={editor.handleLoad}
        isLoading={editor.status.phase === 'loading'}
        locale={initialLocale}
        renameEnabled={editor.renameEnabled}
        renameToPath={editor.renameToPath}
        onRenameToggle={editor.setRenameEnabled}
        onRenamePathChange={editor.setRenameToPath}
        t={t}
      />

      {editor.status.phase === 'loading' && (
        <div className={styles.loading}>{t('loading')}</div>
      )}

      {editor.status.phase !== 'idle' && editor.status.phase !== 'loading' && (
        <EditorSplitPane
          textareaId={TEXTAREA_ID}
          content={editor.content}
          setContent={editor.setContent}
          disabled={editor.editorDisabled}
          mode={editor.mode}
          newPlaceholder={t('newPlaceholder')}
          filePath={editor.filePath}
        />
      )}

      <EditorFooter
        status={editor.status}
        mode={editor.mode}
        canSubmit={editor.canSubmit}
        handleSubmit={editor.handleSubmit}
        t={t}
        editorDisabled={editor.editorDisabled}
      />
    </div>
  );
};
