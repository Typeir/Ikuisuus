/**
 * @fileoverview Live MDX Preview Panel
 * @description Compiles raw MDX source at runtime and renders it in a prose-styled container.
 * Preview compiles after a 400ms debounce on source changes.
 *
 * @module lib/components/mdxEditor/mdxPreview
 * @version 2.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import { compileMdxToComponent } from '@/modules/library/infrastructure/compile/compileMdxToComponent';
import { mdxComponents } from '@/modules/library/presentation';
import contentStyles from '@/styles/mdxContent.module.scss';
import { useTranslations } from 'next-intl';
import type { JSX } from 'react';
import { Suspense, useEffect, useRef, useState, useTransition } from 'react';
import cn from '../../../../lib/utils/classNameMerge';
import styles from './MdxPreview.module.scss';

/**
 * @property {string} source - Raw MDX string to compile and preview
 */
interface MdxPreviewProps {
  /** Raw MDX source text */
  source: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Splits leading YAML frontmatter from MDX source.
 *
 * @param {string} source - Raw MDX text
 * @returns {{ yaml: string | null; body: string }} Frontmatter text (without fences) and the remaining body
 */
export function splitFrontmatter(source: string): {
  yaml: string | null;
  body: string;
} {
  const match = FRONTMATTER.exec(source);
  if (!match) return { yaml: null, body: source };
  return { yaml: match[1], body: source.slice(match[0].length) };
}

/**
 * Loading indicator rendered while the preview compiles.
 *
 * @returns {JSX.Element} Loading indicator
 */
function PreviewFallback(): JSX.Element {
  const t = useTranslations('mdxEditor.preview');
  return <div className={styles.previewLoading}>{t('compiling')}</div>;
}

/**
 * Renders the compiled MDX component in a prose-styled container with a fade-in animation.
 *
 * @param {{ Component: React.ComponentType<any>; renderKey: number }} props - Compiled MDX component and render key
 * @param {React.ComponentType<any>} props.Component - Compiled MDX component
 * @param {number} props.renderKey - Changes key to reset the fade-in animation
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
      className={cn(
        'prose',
        'prose-invert',
        contentStyles.mdxContent,
        styles.previewContainer,
        styles.previewFadeIn,
      )}>
      <Component components={mdxComponents} />
    </div>
  );
}

/**
 * Renders a live preview of MDX source text.
 * Compiles 400ms after source changes; empty source and compile errors return status messages.
 *
 * @component
 * @param {MdxPreviewProps} props - Component properties
 * @param {string} props.source - Raw MDX source text
 * @returns {JSX.Element} Rendered preview or status message
 */
export function MdxPreview({ source }: MdxPreviewProps): JSX.Element {
  const t = useTranslations('mdxEditor.preview');
  const [Content, setContent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  const { yaml, body } = splitFrontmatter(source);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!body.trim()) {
      setContent(null);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const Compiled = await compileMdxToComponent(body);
        startTransition(() => {
          setContent(() => Compiled);
          setRenderKey((k) => k + 1);
          setError(null);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t('compileFailed'));
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [body, startTransition, t]);

  const frontmatterBlock = yaml ? (
    <pre className={styles.frontmatterBlock} aria-label={t('frontmatter')}>
      {yaml}
    </pre>
  ) : null;

  if (error) {
    return (
      <>
        {frontmatterBlock}
        <div className={styles.previewError}>{error}</div>
      </>
    );
  }

  if (!Content) {
    return (
      <>
        {frontmatterBlock}
        <div className={styles.previewEmpty}>{t('empty')}</div>
      </>
    );
  }

  return (
    <>
      {frontmatterBlock}
      <Suspense fallback={<PreviewFallback />}>
        <PreviewContent Component={Content} renderKey={renderKey} />
      </Suspense>
    </>
  );
}
