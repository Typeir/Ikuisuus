/**
 * @fileoverview MDX Editor Component
 * @description Full-page tool for creating new MDX content files or editing existing ones
 * via the content repo GitHub API. When loaded with `?slug=...` query parameters the
 * editor pre-fetches the file; otherwise it presents a blank editor for new file creation.
 *
 * Edits are submitted through the corrections API which creates a branch + commit + PR
 * in the content repo. New file creation uses the same flow with a new path.
 *
 * @module lib/components/mdxEditor/mdxEditor
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import { useCorrectionsAuth } from '@/lib/hooks/useCorrectionsAuth';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './mdxEditor.module.scss';

/**
 * Props for the MdxEditor component.
 *
 * @property {string} locale - Current locale (e.g. `"en"`)
 */
interface MdxEditorProps {
  /** Current locale */
  locale: string;
}

/** Internal state machine for the editor. */
type EditorStatus =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'ready'; sha: string; resolvedPath: string }
  | { phase: 'new' }
  | { phase: 'submitting' }
  | { phase: 'success'; prUrl: string }
  | { phase: 'error'; message: string };

/**
 * MDX Editor tool view.
 *
 * Renders a full-page editor with file path input, authorization token input,
 * MDX textarea, and submit button. Supports two modes:
 *   - **Edit**: Pre-loads an existing file from the content repo (when `?slug` is present)
 *   - **New**: Blank editor for creating a new MDX file
 *
 * @component
 * @param {MdxEditorProps} props - Component properties
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

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const initialSlug = searchParams.get('slug') ?? '';
  const initialLocale = searchParams.get('locale') ?? locale;

  const [mode, setMode] = useState<'edit' | 'new'>(
    initialSlug ? 'edit' : 'new',
  );
  const [status, setStatus] = useState<EditorStatus>({ phase: 'idle' });
  const [content, setContent] = useState('');
  const [filePath, setFilePath] = useState('');
  const [slug, setSlug] = useState(initialSlug);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Loads the raw MDX content from the corrections read API.
   */
  const loadContent = useCallback(
    async (targetSlug: string, targetLocale: string) => {
      if (!targetSlug.trim()) {
        setStatus({ phase: 'error', message: t('slugRequired') });
        return;
      }

      setStatus({ phase: 'loading' });
      try {
        const res = await fetch(
          `/api/corrections/read?slug=${encodeURIComponent(targetSlug)}&locale=${encodeURIComponent(targetLocale)}`,
        );
        if (!res.ok) {
          const data = await res
            .json()
            .catch(() => ({ error: 'Unknown error' }));
          setStatus({
            phase: 'error',
            message: data.error || `HTTP ${res.status}`,
          });
          return;
        }
        const data = await res.json();
        setContent(data.content);
        setFilePath(data.path);
        setStatus({ phase: 'ready', sha: data.sha, resolvedPath: data.path });
      } catch (err) {
        setStatus({
          phase: 'error',
          message:
            err instanceof Error ? err.message : 'Failed to load content',
        });
      }
    },
    [t],
  );

  /**
   * Auto-loads content when the component mounts with a slug parameter.
   */
  useEffect(() => {
    if (initialSlug && mode === 'edit') {
      loadContent(initialSlug, initialLocale);
    } else if (mode === 'new') {
      setStatus({ phase: 'new' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Focus the textarea when content loads.
   */
  useEffect(() => {
    if (
      (status.phase === 'ready' || status.phase === 'new') &&
      editorRef.current
    ) {
      editorRef.current.focus();
    }
  }, [status.phase]);

  /**
   * Switches between Edit and New modes.
   */
  const handleModeSwitch = useCallback((newMode: 'edit' | 'new') => {
    setMode(newMode);
    setContent('');
    setFilePath('');
    setSlug('');
    setStatus(newMode === 'new' ? { phase: 'new' } : { phase: 'idle' });
  }, []);

  /**
   * Manually triggers a content fetch in edit mode.
   */
  const handleLoad = useCallback(() => {
    loadContent(slug, initialLocale);
  }, [slug, initialLocale, loadContent]);

  /**
   * Submits the edited/new content to the corrections API.
   */
  const handleSubmit = useCallback(async () => {
    if (!token) {
      setStatus({ phase: 'error', message: t('loginRequired') });
      return;
    }
    if (!filePath.trim()) {
      setStatus({ phase: 'error', message: t('pathRequired') });
      return;
    }
    if (!content.trim()) {
      setStatus({ phase: 'error', message: t('contentRequired') });
      return;
    }

    const baseSha = status.phase === 'ready' ? status.sha : '';

    /** For new files baseSha is empty — the API route handles creation. */
    setStatus({ phase: 'submitting' });

    try {
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify({
          path: filePath.trim(),
          content,
          baseSha,
          isNew: mode === 'new',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({
          phase: 'error',
          message: data.error || `HTTP ${res.status}`,
        });
        return;
      }

      setStatus({ phase: 'success', prUrl: data.prUrl });
    } catch (err) {
      setStatus({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Submission failed',
      });
    }
  }, [status, content, filePath, token, mode, t]);

  /** Whether the submit button should be enabled. */
  const canSubmit =
    status.phase === 'ready' ||
    status.phase === 'new' ||
    status.phase === 'error';

  /** Whether the editor textarea should be interactive. */
  const editorDisabled =
    status.phase === 'submitting' || status.phase === 'success';

  return (
    <div className={styles.editorContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>
        <div className={styles.modeToggle}>
          <button
            type='button'
            className={
              mode === 'edit' ? styles.modeLabelActive : styles.modeLabel
            }
            onClick={() => handleModeSwitch('edit')}>
            {t('modeEdit')}
          </button>
          <button
            type='button'
            className={
              mode === 'new' ? styles.modeLabelActive : styles.modeLabel
            }
            onClick={() => handleModeSwitch('new')}>
            {t('modeNew')}
          </button>
        </div>
      </div>

      {/* Auth */}
      <div className={styles.fieldGroup}>
        {user ? (
          <div className={styles.authStatus}>
            <span className={styles.authUser}>
              {t('loggedInAs', { username: user.username, role: user.role })}
            </span>
            <button
              type='button'
              className={styles.logoutButton}
              onClick={logout}>
              {t('logout')}
            </button>
          </div>
        ) : (
          <div className={styles.loginForm}>
            <label className={styles.fieldLabel}>{t('loginLabel')}</label>
            <div className={styles.fieldRow}>
              <input
                type='text'
                className={styles.loginInput}
                placeholder={t('usernamePlaceholder')}
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                autoComplete='username'
              />
              <input
                type='password'
                className={styles.loginInput}
                placeholder={t('passwordPlaceholder')}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete='current-password'
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && loginUsername && loginPassword) {
                    doLogin(loginUsername, loginPassword);
                  }
                }}
              />
              <button
                type='button'
                className={styles.submitButton}
                disabled={isLoggingIn || !loginUsername || !loginPassword}
                onClick={() => doLogin(loginUsername, loginPassword)}>
                {isLoggingIn ? t('loggingIn') : t('loginButton')}
              </button>
            </div>
            {authError && (
              <span className={styles.statusError}>
                {authError}{' '}
                <button
                  type='button'
                  className={styles.dismissButton}
                  onClick={clearAuthError}>
                  ✕
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* File path / slug */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor='mdx-editor-path'>
          {mode === 'edit' ? t('slugLabel') : t('pathLabel')}
        </label>
        <div className={styles.fieldRow}>
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
                disabled={!slug.trim() || status.phase === 'loading'}>
                {t('loadButton')}
              </button>
            </>
          ) : (
            <input
              id='mdx-editor-path'
              type='text'
              className={styles.pathInput}
              placeholder={t('pathPlaceholder')}
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Loading state */}
      {status.phase === 'loading' && (
        <div className={styles.loading}>{t('loading')}</div>
      )}

      {/* Editor */}
      {status.phase !== 'idle' && status.phase !== 'loading' && (
        <textarea
          ref={editorRef}
          className={styles.editor}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={editorDisabled}
          spellCheck={false}
          placeholder={mode === 'new' ? t('newPlaceholder') : ''}
        />
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.statusText}>
          {status.phase === 'submitting' && t('submitting')}
          {status.phase === 'success' && (
            <span className={styles.statusSuccess}>
              {t('success')}{' '}
              <a
                href={(status as { prUrl: string }).prUrl}
                target='_blank'
                rel='noopener noreferrer'>
                {t('viewPr')}
              </a>
            </span>
          )}
          {status.phase === 'error' && (
            <span className={styles.statusError}>
              {(status as { message: string }).message}
            </span>
          )}
          {status.phase === 'ready' && (
            <span>
              {t('editing')}:{' '}
              <code>{(status as { resolvedPath: string }).resolvedPath}</code>
            </span>
          )}
          {status.phase === 'new' && t('newFileMode')}
        </div>
        <button
          type='button'
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={!canSubmit}>
          {mode === 'new' ? t('submitNew') : t('submitEdit')}
        </button>
      </div>
    </div>
  );
};
