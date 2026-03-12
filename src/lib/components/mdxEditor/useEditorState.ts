/**
 * @fileoverview useEditorState hook
 * @description Encapsulates the MDX editor state machine, content loading, and
 * submission logic. Extracted from mdxEditor.tsx to keep the view under 250 lines.
 *
 * @module lib/components/mdxEditor/useEditorState
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

import { useCallback, useEffect, useState } from 'react';

/**
 * Internal state machine for the editor.
 *
 * @property {'idle' | 'loading' | 'ready' | 'new' | 'submitting' | 'success' | 'error'} phase - Current phase
 * @property {string} [sha] - File SHA (ready phase)
 * @property {string} [resolvedPath] - Resolved content path (ready phase)
 * @property {string} [prUrl] - Pull request URL (success phase)
 * @property {string} [message] - Error message (error phase)
 */
export type EditorStatus =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'ready'; sha: string; resolvedPath: string }
  | { phase: 'new' }
  | { phase: 'submitting' }
  | { phase: 'success'; prUrl: string }
  | { phase: 'error'; message: string };

/**
 * Return type of useEditorState.
 *
 * @property {'edit' | 'new'} mode - Edit existing vs create new
 * @property {EditorStatus} status - Current state machine phase
 * @property {string} content - Editor text content
 * @property {(v: string) => void} setContent - Update editor content
 * @property {string} filePath - Target file path
 * @property {(v: string) => void} setFilePath - Update file path
 * @property {string} slug - Content slug for editing
 * @property {(v: string) => void} setSlug - Update slug
 * @property {() => void} handleLoad - Load content from API
 * @property {() => Promise<void>} handleSubmit - Submit changes
 * @property {boolean} canSubmit - Whether submit is allowed
 * @property {boolean} editorDisabled - Whether editor is inactive
 */
export interface EditorState {
  /** Edit existing vs create new */
  mode: 'edit' | 'new';
  /** Current state machine phase */
  status: EditorStatus;
  /** Editor text content */
  content: string;
  /** Update editor content */
  setContent: (v: string) => void;
  /** Target file path */
  filePath: string;
  /** Update file path */
  setFilePath: (v: string) => void;
  /** Content slug for editing */
  slug: string;
  /** Update slug */
  setSlug: (v: string) => void;
  /** Load content from API */
  handleLoad: () => void;
  /** Submit changes */
  handleSubmit: () => Promise<void>;
  /** Whether submit is allowed */
  canSubmit: boolean;
  /** Whether editor is inactive */
  editorDisabled: boolean;
}

/**
 * Encapsulates the editor state machine: mode/status, content, file path,
 * loading from the corrections read API, and submitting changes.
 *
 * @param {Object} opts - Hook options
 * @param {string} opts.initialSlug - Slug from query params
 * @param {string} opts.initialLocale - Locale from query params
 * @param {string | null} opts.token - Auth token
 * @param {(key: string) => string} opts.t - Translation function
 * @returns {EditorState} Editor state and actions
 */
export function useEditorState({
  initialSlug,
  initialLocale,
  token,
  t,
}: {
  initialSlug: string;
  initialLocale: string;
  token: string | null;
  t: (key: string) => string;
}): EditorState {
  const [mode] = useState<'edit' | 'new'>(initialSlug ? 'edit' : 'new');
  const [status, setStatus] = useState<EditorStatus>({ phase: 'idle' });
  const [content, setContent] = useState('');
  const [filePath, setFilePath] = useState('');
  const [slug, setSlug] = useState(initialSlug);

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

  useEffect(() => {
    if (initialSlug && mode === 'edit') {
      loadContent(initialSlug, initialLocale);
    } else if (mode === 'new') {
      setStatus({ phase: 'new' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoad = useCallback(() => {
    loadContent(slug, initialLocale);
  }, [slug, initialLocale, loadContent]);

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

  const canSubmit =
    status.phase === 'ready' ||
    status.phase === 'new' ||
    status.phase === 'error';

  const editorDisabled =
    status.phase === 'submitting' || status.phase === 'success';

  return {
    mode,
    status,
    content,
    setContent,
    filePath,
    setFilePath,
    slug,
    setSlug,
    handleLoad,
    handleSubmit,
    canSubmit,
    editorDisabled,
  };
}
