/**
 * @fileoverview Renders the bespoke button inventory with live previews.
 * @description Each entry is previewed by injecting its compiled declarations under a
 * `data-bespoke` attribute, so the real appearance is shown without importing forty
 * stylesheets. The global `button` rule still applies underneath, which is what the
 * class sees in situ.
 *
 * @component BespokeSection
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @module app/[locale]/labs/dev/buttons/BespokeSection
 */

import { Settings } from 'lucide-react';
import type { BespokeButton } from './bespokeCatalog';
import styles from './page.module.scss';

const ICON_SIZE = 16;

/**
 * Serialises declarations into a scoped rule, dropping any angle bracket so the
 * block cannot terminate the style element early.
 *
 * @function toScopedRule
 * @param {BespokeButton} entry - Entry to serialise.
 * @returns {string} One CSS rule.
 */
function toScopedRule(entry: BespokeButton): string {
  const body = Object.entries(entry.decls)
    .map(([prop, value]) => `${prop}:${value.replace(/[<>]/g, '')}`)
    .join(';');
  return `[data-bespoke='${entry.id}']{${body}}`;
}

/**
 * Decides whether an entry should preview as an icon button.
 *
 * @function isIconLike
 * @param {BespokeButton} entry - Entry to test.
 * @returns {boolean} True when the entry reads as icon-only.
 */
function isIconLike(entry: BespokeButton): boolean {
  if (entry.nearest.name?.startsWith('icon')) return true;
  return Boolean(entry.decls.width && entry.decls.height);
}

/**
 * Props for BespokeSection.
 *
 * @interface BespokeSectionProps
 * @property {string} title - Section heading.
 * @property {string} note - One-line explanation shown under the heading.
 * @property {BespokeButton[]} entries - Entries to render.
 */
interface BespokeSectionProps {
  title: string;
  note: string;
  entries: BespokeButton[];
}

/**
 * Renders one group of bespoke button cards.
 *
 * @component
 * @param {BespokeSectionProps} props - Component props.
 * @param {string} props.title - Section heading.
 * @param {string} props.note - Explanation under the heading.
 * @param {BespokeButton[]} props.entries - Entries to render.
 * @returns {React.ReactElement | null} The section, or null when empty.
 */
export function BespokeSection({
  title,
  note,
  entries,
}: BespokeSectionProps): React.ReactElement | null {
  if (!entries.length) return null;

  return (
    <section className={styles.group}>
      <h2 className={styles.groupTitle}>
        {title} <span className={styles.count}>{entries.length}</span>
      </h2>
      <p className={styles.lede}>{note}</p>
      <style>{entries.map(toScopedRule).join('\n')}</style>

      <div className={styles.grid}>
        {entries.map((entry) => (
          <article key={entry.id} className={styles.card}>
            <div className={styles.preview}>
              <button
                type='button'
                data-bespoke={entry.id}
                aria-label={entry.className}>
                {isIconLike(entry) ? (
                  <Settings size={ICON_SIZE} aria-hidden='true' />
                ) : (
                  entry.className
                )}
              </button>
            </div>

            <div className={styles.identity}>
              <code className={styles.className} data-testid='bespoke-name'>
                .{entry.className}
              </code>
              <span className={styles.count}>{entry.usages.length}</span>
            </div>

            <p className={styles.doc}>
              {entry.nearest.name ? (
                <>
                  nearest canonical <code>btn.{entry.nearest.name}</code>{' '}
                  <strong>{(entry.nearest.score * 100).toFixed(0)}%</strong>
                </>
              ) : (
                'no canonical match'
              )}
              {entry.buttonMixins.length > 0 && (
                <>
                  {' · builds on '}
                  <code>{entry.buttonMixins.join(', ')}</code>
                </>
              )}
            </p>

            <footer className={styles.sites}>
              <div className={styles.declaredAt} title={entry.stylesheet}>
                declared {entry.module} &gt; {entry.stylesheet.split('/').pop()}
                {entry.line ? `:${entry.line}` : ''}
              </div>
              <ul className={styles.siteList}>
                {entry.usages.map((usage) => (
                  <li
                    key={`${usage.relativePath}:${usage.line}`}
                    className={styles.site}
                    title={`${usage.relativePath}:${usage.line}`}>
                    <span className={styles.siteModule}>{usage.module}</span>
                    {' > '}
                    {usage.file}:{usage.line}
                  </li>
                ))}
              </ul>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
