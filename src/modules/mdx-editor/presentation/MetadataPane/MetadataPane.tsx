/**
 * @fileoverview Metadata Pane
 * @description Preview-panel face showing the metadata records the generators
 * would produce for the current buffer, fetched from the metadata preview API.
 * Carries its own refresh button; nothing refetches implicitly while typing.
 *
 * @module modules/mdx-editor/presentation/MetadataPane/MetadataPane
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import {
  fetchMetadataPreview,
  type MetadataPreviewResult,
} from '@/modules/mdx-editor/infrastructure/api-clients/metadataPreviewClient';
import type { JSX } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './MetadataPane.module.scss';

/**
 * @property {string} path - Repo-relative content path under `src/content/`
 * @property {string} content - Current editor buffer
 * @property {number} refreshToken - Increment to trigger a refetch
 */
interface MetadataPaneProps {
  /** Repo-relative content path under `src/content/`; '' for unsaved buffers */
  path: string;
  /** Current editor buffer */
  content: string;
  /** Increment to trigger a refetch */
  refreshToken: number;
}

/**
 * Renders one parsed record.
 *
 * @param {object} props - Component properties
 * @param {Record<string, unknown>} props.record - Parsed metadata record
 * @returns {JSX.Element} Record block
 */
function RecordBlock({
  record,
}: {
  record: Record<string, unknown>;
}): JSX.Element {
  const tags = Array.isArray(record.tags) ? (record.tags as string[]) : [];

  return (
    <div className={styles.record}>
      <div className={styles.recordTitle}>
        {String(record.title ?? record.slug ?? 'untitled')}
      </div>
      {tags.length > 0 && (
        <div className={styles.tagRow}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <pre className={styles.json}>{JSON.stringify(record, null, 2)}</pre>
    </div>
  );
}

/**
 * Metadata visualization for the editor preview panel.
 *
 * @component
 * @param {MetadataPaneProps} props - Component properties
 * @param {string} props.path - Repo-relative content path
 * @param {string} props.content - Current editor buffer
 * @returns {JSX.Element} Metadata pane
 */
export function MetadataPane({
  path,
  content,
  refreshToken,
}: MetadataPaneProps): JSX.Element {
  const [result, setResult] = useState<MetadataPreviewResult | null>(null);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'error'>('idle');
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    if (!content) return;
    const seq = ++requestSeq.current;
    setPhase('loading');
    const payload = await fetchMetadataPreview(path, content);
    if (seq !== requestSeq.current) return;
    if (payload) {
      setResult(payload);
      setPhase('idle');
    } else {
      setPhase('error');
    }
  }, [path, content]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  return (
    <div className={styles.pane}>
      <div className={styles.header}>
        <span className={styles.kind}>
          {result ? `kind: ${result.kind}` : 'metadata'}
        </span>
        {phase === 'loading' && <span className={styles.notice}>…</span>}
      </div>

      {phase === 'error' && (
        <div className={styles.notice}>Metadata parse failed.</div>
      )}
      {result?.records.map((record, index) => (
        <RecordBlock
          key={`${String(record.slug ?? 'record')}-${index}`}
          record={record}
        />
      ))}
    </div>
  );
}
