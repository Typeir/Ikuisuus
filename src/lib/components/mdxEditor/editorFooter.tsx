/**
 * @fileoverview Editor Footer
 * @description Status text and submit button for the MDX editor.
 *
 * @module lib/components/mdxEditor/editorFooter
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import styles from './mdxEditor.module.scss';
import type { EditorStatus } from './useEditorState';

/**
 * @property {EditorStatus} status - Current editor state
 * @property {'edit' | 'new'} mode - Editor mode
 * @property {boolean} canSubmit - Whether submit is allowed
 * @property {() => void} handleSubmit - Submit handler
 * @property {(key: string) => string} t - Translation function
 */
interface EditorFooterProps {
  /** Current editor state */
  status: EditorStatus;
  /** Editor mode */
  mode: 'edit' | 'new';
  /** Whether submit is allowed */
  canSubmit: boolean;
  /** Submit handler */
  handleSubmit: () => void;
  /** Translation function */
  t: (key: string) => string;
}

/**
 * Footer bar for the MDX editor.
 * Displays status messages (submitting, success, error, editing, new file)
 * and a submit button.
 *
 * @component
 * @param {EditorFooterProps} props - Component properties
 * @param {EditorStatus} props.status - Current editor state
 * @param {'edit' | 'new'} props.mode - Editor mode
 * @param {boolean} props.canSubmit - Whether submit is allowed
 * @param {Function} props.handleSubmit - Submit handler
 * @param {Function} props.t - Translation function
 * @returns {JSX.Element} Footer bar
 */
export function EditorFooter({
  status,
  mode,
  canSubmit,
  handleSubmit,
  t,
}: EditorFooterProps): JSX.Element {
  return (
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
  );
}
