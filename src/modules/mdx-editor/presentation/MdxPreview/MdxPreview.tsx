/**
 * @fileoverview Compile and render MDX preview. Debounces source changes.
 *
 * @module modules/mdx-editor/presentation/MdxPreview/MdxPreview
 * @version 2.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import { compileRuntime } from '@/modules/library/infrastructure/compile/compileRuntime';
import { mdxComponents } from '@/modules/library/presentation';
import Keyword, {
  type KeywordProps,
} from '@/modules/library/presentation/components/Keyword';
import contentStyles from '@/styles/mdxContent.module.scss';
import { useTranslations } from 'next-intl';
import type { JSX, ReactElement } from 'react';
import { Suspense, useEffect, useRef, useState, useTransition } from 'react';
import cn from '../../../../lib/utils/classNameMerge';
import styles from './MdxPreview.module.scss';

/**
 * Components for the preview compile. A keyword in the editor carries no
 * compile-time resolution, so it self-resolves through the shard endpoint the
 * way one inside a shard does — the card works while authoring.
 */
const previewComponents = {
  ...mdxComponents,
  Keyword: (props: KeywordProps) => <Keyword {...props} nested />,
};

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
 * Renders the compiled MDX in a prose-styled container with a fade-in animation.
 *
 * @param {{ content: ReactElement; renderKey: number }} props - Compiled MDX and render key
 * @param {ReactElement} props.content - Compiled MDX element
 * @param {number} props.renderKey - Changes key to reset the fade-in animation
 * @returns {JSX.Element} Rendered MDX
 */
function PreviewContent({
  content,
  renderKey,
}: {
  content: ReactElement;
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
      {content}
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
  const [content, setContent] = useState<ReactElement | null>(null);
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
        /* skipCache: every keystroke is a new source, so caching by hash would
           only accumulate dead entries for the session. */
        const compiled = await compileRuntime({
          source: body,
          components: previewComponents,
          skipCache: true,
        });
        startTransition(() => {
          setContent(compiled.content);
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

  if (!content) {
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
        <PreviewContent content={content} renderKey={renderKey} />
      </Suspense>
    </>
  );
}
