'use client';

import { LibrarySearch } from '@/lib/components/librarySearch/librarySearch';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.scss';

/**
 * Renders an external URL in an iframe or shows a poetic fallback
 * if the domain refuses embedding (like Wikidot).
 *
 * @returns {JSX.Element}
 */
export default function BeyondViewer() {
  const searchParams = useSearchParams();
  const [safeUrl, setSafeUrl] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<boolean>(false);
  const [opened, setOpened] = useState<boolean>(false);

  useEffect(() => {
    const rawUrl = searchParams.get('url');
    try {
      if (!rawUrl) return;
      const parsed = new URL(rawUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        setSafeUrl(parsed.toString());

        if (parsed.hostname.endsWith('wikidot.com')) {
          setBlocked(true);
        }
      }
    } catch {
      setSafeUrl(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (blocked && safeUrl && !opened) {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
      setOpened(true);
    }
  }, [blocked, safeUrl, opened]);

  if (!safeUrl) {
    return (
      <div className={styles.message}>
        Invalid or missing URL. This portal could not be opened.
      </div>
    );
  }

  if (blocked) {
    return (
      <div className={styles.blocked}>
        <div className={styles.blockedText}>
          This reality refused the grasp of the Tree of Fate, travelling beyond
          the folds.
        </div>
        <LibrarySearch />
      </div>
    );
  }

  return (
    <div className={styles.viewer}>
      <div className={styles.urlBanner}>
        Viewing external archive:
        <span className={styles.url}>{safeUrl}</span>
      </div>
      <iframe
        src={safeUrl}
        className={styles.iframe}
        sandbox='allow-scripts allow-same-origin allow-forms'
      />
    </div>
  );
}
