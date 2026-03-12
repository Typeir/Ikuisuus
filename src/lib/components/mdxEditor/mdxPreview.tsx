/**
 * @fileoverview Live MDX Preview Panel
 * @description Compiles raw MDX source at runtime and renders it inside a prose container.
 * Uses a debounced compilation cycle with React transitions so updates never block typing.
 *
 * @module lib/components/mdxEditor/mdxPreview
 * @version 2.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import mdxComponents from '@/lib/components/mdx';
import { compileMdxToComponent } from '@/lib/components/mdx/compileMdxToComponent';
import { Suspense, useEffect, useRef, useState, useTransition } from 'react';
import styles from './mdxEditor.module.scss';
import contentStyles from '@/styles/mdxContent.module.scss';

/**
 * @property {string} source - Raw MDX string to compile and preview
 */
interface MdxPreviewProps {
  /** Raw MDX source text */
  source: string;
}

/**
 * Fallback shown while the preview compiles.
 *
 * @returns {JSX.Element} Loading indicator
 */
function PreviewFallback(): JSX.Element {
  return <div className={styles.previewLoading}>Compiling…</div>;
}

/**
 * Inner renderer that holds the compiled component.
 * Applies a fade-in animation each time the content re-compiles.
 *
 * @param {{ Component: React.ComponentType<any>; renderKey: number }} props - Compiled MDX component and render key
 * @param {React.ComponentType<any>} props.Component - Compiled MDX component
 * @param {number} props.renderKey - Render key for animation reset
 * @returns {JSX.Element} Rendered MDX
 */
function PreviewContent({
  Component,
  renderKey,
}: {
  Component: React.ComponentType<any>;
  renderKey: number;
}): JSX.Element {
  return (
    <div
      key={renderKey}
      className={`prose prose-invert ${contentStyles.mdxContent} ${styles.previewFadeIn}`}>
      <Component components={mdxComponents} />
    </div>
  );
}

/**
 * Renders a live preview of MDX source text.
 * Debounces compilation by 400ms and wraps updates in `startTransition`
 * so the editor stays responsive while the preview re-compiles.
 *
 * @component
 * @param {MdxPreviewProps} props - Component properties
 * @param {string} props.source - Raw MDX source text
 * @returns {JSX.Element} Rendered preview or status message
 */
export function MdxPreview({ source }: MdxPreviewProps): JSX.Element {
  const [Content, setContent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!source.trim()) {
      setContent(null);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const Compiled = await compileMdxToComponent(source);
        startTransition(() => {
          setContent(() => Compiled);
          setRenderKey((k) => k + 1);
          setError(null);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Compilation failed');
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [source, startTransition]);

  if (error) {
    return <div className={styles.previewError}>{error}</div>;
  }

  if (!Content) {
    return <div className={styles.previewEmpty}>Preview</div>;
  }

  return (
    <Suspense fallback={<PreviewFallback />}>
      <PreviewContent Component={Content} renderKey={renderKey} />
    </Suspense>
  );
}
