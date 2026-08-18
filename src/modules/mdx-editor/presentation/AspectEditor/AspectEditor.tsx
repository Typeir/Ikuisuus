/**
 * @fileoverview Two-pane aspect picker. Staged aspects top, vocabulary bottom. Apply commits to buffer.
 *
 * @module modules/mdx-editor/presentation/AspectEditor/AspectEditor
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { Modal } from '@/lib/components/ui/modal';
import type { AspectVocabularyGroup } from '@/lib/metadata/aspectVocabulary';
import { parseAspect, type ParsedAspect } from '@/modules/library/domain/aspects';
import { AspectPill } from '@/modules/library/presentation/components/Aspects';
import { fetchAspectVocabulary } from '@/modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient';
import { useLocale, useTranslations } from 'next-intl';
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './AspectEditor.module.scss';

/**
 * @property {boolean} isOpen - Whether the modal is shown
 * @property {() => void} onClose - Close without applying
 * @property {string[]} initial - Aspects currently authored in the buffer
 * @property {(aspects: string[]) => void} onApply - Commit the staged list
 */
interface AspectEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initial: string[];
  onApply: (aspects: string[]) => void;
}

/** Groups rendered in the first commit; the rest follow in idle slices. */
const INITIAL_GROUPS = 2;
/** Groups mounted per idle slice. */
const GROUPS_PER_SLICE = 4;

/**
 * Parses a raw aspect for pill rendering; falls back to a plain split.
 *
 * @param {string} raw - `group:value`
 * @returns {ParsedAspect} Parsed aspect
 */
function toParsed(raw: string): ParsedAspect {
  return (
    parseAspect(raw) ?? {
      raw,
      group: raw.split(':')[0] ?? raw,
      value: raw.split(':').slice(1).join(':'),
    }
  );
}

/**
 * Aspect editor modal.
 *
 * @component
 * @param {AspectEditorProps} props - Component properties
 * @returns {JSX.Element | null} The modal, or null when closed
 */
export function AspectEditor({
  isOpen,
  onClose,
  initial,
  onApply,
}: AspectEditorProps): JSX.Element | null {
  const t = useTranslations('mdxEditor.aspects');
  const locale = useLocale();
  const [staged, setStaged] = useState<string[]>(initial);
  const [groups, setGroups] = useState<AspectVocabularyGroup[] | null>(null);
  const [failed, setFailed] = useState(false);
  /* Progressive mount: the vocabulary is ~600 pills with SVG glyphs; painting
     them all in one commit stalls low-end devices. Groups mount in idle-time
     slices after the first paint. */
  const [mounted, setMounted] = useState(INITIAL_GROUPS);

  useEffect(() => {
    if (isOpen) setStaged(initial);
  }, [isOpen, initial]);

  useEffect(() => {
    if (!isOpen || !groups) return;
    setMounted(INITIAL_GROUPS);
    let cancelled = false;
    let handle: number | undefined;
    const schedule = (fn: () => void) => {
      const w = window as Window & {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      };
      handle = w.requestIdleCallback
        ? w.requestIdleCallback(fn, { timeout: 120 })
        : window.setTimeout(fn, 16);
    };
    const step = () => {
      if (cancelled) return;
      setMounted((n) => {
        const next = Math.min(n + GROUPS_PER_SLICE, groups.length);
        if (next < groups.length) schedule(step);
        return next;
      });
    };
    schedule(step);
    return () => {
      cancelled = true;
      if (handle !== undefined) {
        const w = window as Window & { cancelIdleCallback?: (h: number) => void };
        if (w.cancelIdleCallback) w.cancelIdleCallback(handle);
        else window.clearTimeout(handle);
      }
    };
  }, [isOpen, groups]);

  useEffect(() => {
    if (!isOpen || groups) return;
    let cancelled = false;
    void fetchAspectVocabulary().then((data) => {
      if (cancelled) return;
      if (data) setGroups(data);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, groups]);

  const stagedSet = useMemo(() => new Set(staged), [staged]);

  const stage = useCallback((aspect: ParsedAspect) => {
    setStaged((prev) => (prev.includes(aspect.raw) ? prev : [...prev, aspect.raw]));
  }, []);

  const unstage = useCallback((aspect: ParsedAspect) => {
    setStaged((prev) => prev.filter((a) => a !== aspect.raw));
  }, []);

  const apply = () => {
    onApply(staged);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      ariaLabel={t('title')}
      className={styles.modal}
      bodyClassName={styles.modalBody}>
      <div className={styles.body}>
        <section className={styles.staged} aria-label={t('stagedLabel')}>
          <div className={styles.sectionLabel}>{t('stagedLabel')}</div>
          <div className={styles.pills}>
            {staged.length === 0 && (
              <span className={styles.empty}>{t('stagedEmpty')}</span>
            )}
            {staged.map((raw) => (
              <AspectPill
                key={raw}
                aspect={toParsed(raw)}
                locale={locale}
                onSelect={unstage}
                pressed
              />
            ))}
          </div>
        </section>

        <section className={styles.vocabulary} aria-label={t('vocabularyLabel')}>
          {failed && <div className={styles.empty}>{t('loadFailed')}</div>}
          {!failed && !groups && <div className={styles.empty}>…</div>}
          {groups?.slice(0, mounted).map(({ group, values, authored }) => {
            const disabled = authored === false;
            return (
              <div
                key={group}
                className={`${styles.group} ${disabled ? styles.groupDisabled : ''}`}
                aria-disabled={disabled || undefined}>
                <div className={styles.groupLabel}>
                  {group}:
                  {disabled && (
                    <span className={styles.groupNote}> {t('notAuthored')}</span>
                  )}
                </div>
                <div className={styles.pills}>
                  {values.map((value) => {
                    const raw = `${group}:${value}`;
                    return (
                      <AspectPill
                        key={raw}
                        aspect={toParsed(raw)}
                        locale={locale}
                        onSelect={disabled ? undefined : stage}
                        pressed={stagedSet.has(raw)}
                        disabled={disabled}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
          {groups && mounted < groups.length && (
            <div className={styles.empty} aria-live='polite'>
              …
            </div>
          )}
        </section>
      </div>

      <div className={styles.footer}>
        <button type='button' className={styles.secondary} onClick={onClose}>
          {t('close')}
        </button>
        <button type='button' className={styles.primary} onClick={apply}>
          {t('apply')}
        </button>
      </div>
    </Modal>
  );
}
