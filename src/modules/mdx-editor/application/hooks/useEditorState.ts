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

import { loadContentForEditing } from '@/modules/mdx-editor/application/use-cases/loadContentForEditing';
import { submitEditFromClient } from '@/modules/mdx-editor/application/use-cases/submitEditFromClient';
import type {
    EditorState,
    EditorStatus,
} from '@/modules/mdx-editor/domain/types';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const lastShaRef = useRef('');
  const lastDraftCursorRef = useRef<{
    updatedAt: string | null;
    versionHash: string | null;
  }>({
    updatedAt: null,
    versionHash: null,
  });

  const loadContent = useCallback(
    async (targetSlug: string, targetLocale: string) => {
      if (!targetSlug.trim()) {
        setStatus({ phase: 'error', message: t('slugRequired') });
        return;
      }

      setStatus({ phase: 'loading' });
      try {
        const data = await loadContentForEditing(targetSlug, targetLocale);
        setContent(data.content);
        setFilePath(data.path);
        lastShaRef.current = data.sha;
        const cursor = data.draftCursor as
          | { updatedAt?: string | null; versionHash?: string | null }
          | undefined;
        lastDraftCursorRef.current = {
          updatedAt: cursor?.updatedAt ?? null,
          versionHash: cursor?.versionHash ?? null,
        };
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

    const baseSha = status.phase === 'ready' ? status.sha : lastShaRef.current;
    setStatus({ phase: 'submitting' });

    try {
      const result = await submitEditFromClient({
        token,
        path: filePath.trim(),
        content,
        baseSha,
        isNew: mode === 'new',
        expectedDraftUpdatedAt: lastDraftCursorRef.current.updatedAt,
        expectedDraftVersionHash: lastDraftCursorRef.current.versionHash,
      });

      if (!result.ok) {
        setStatus({
          phase: 'error',
          message: result.error || `HTTP ${result.status}`,
        });
        return;
      }

      setStatus({ phase: 'success', prUrl: result.prUrl ?? '' });
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
