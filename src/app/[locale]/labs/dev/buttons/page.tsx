/**
 * @fileoverview Button catalogue at /[locale]/labs/dev/buttons.
 * @description Shows the whole button surface: the canonical variants from
 * `buttons.module.scss` with their reach through both distribution channels, then
 * every bespoke class actually applied to a `<button>` elsewhere, split by whether it
 * was built on a canonical mixin or hand-rolled. Source is compiled with sass on each
 * request, so the page reflects what ships rather than what the source implies.
 *
 * @module app/[locale]/labs/dev/buttons/page
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```
 * Route: /en/labs/dev/buttons
 * ```
 */

import btn from '@/styles/buttons.module.scss';
import type { Metadata } from 'next';
import { BespokeSection } from './BespokeSection';
import { loadBespokeButtons } from './bespokeCatalog';
import { collectButtonClassUses } from './buttonInventory';
import {
  loadCanonicalDeclarations,
  loadCanonicalVariants,
  type ButtonVariant,
} from './buttonCatalog';
import { ButtonSample } from './ButtonSample';
import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

const BARE_VARIANT: ButtonVariant = {
  name: 'bare',
  doc: 'A bare button is already the PRIMARY button, styled by the global rule in globals.scss. Never add a class for primary.',
  group: 'Primary',
  mixins: [],
  signatureMixins: [],
  usages: [],
  mixinConsumers: [],
  decls: {},
};

/**
 * Page metadata for the button catalogue.
 *
 * @returns {Metadata} Page metadata.
 */
export const generateMetadata = (): Metadata => ({
  title: 'Labs · Buttons | Library of Ikuisuus',
});

/**
 * Groups variants by their stylesheet section, preserving declaration order.
 *
 * @function groupVariants
 * @param {ButtonVariant[]} variants - Variants to group.
 * @returns {Array<[string, ButtonVariant[]]>} Group name paired with its variants.
 */
function groupVariants(
  variants: ButtonVariant[],
): Array<[string, ButtonVariant[]]> {
  const groups = new Map<string, ButtonVariant[]>();
  for (const variant of variants) {
    groups.set(variant.group, [...(groups.get(variant.group) ?? []), variant]);
  }
  return [...groups.entries()];
}

/**
 * Button catalogue page.
 *
 * @async
 * @function LabsButtonsPage
 * @returns {Promise<React.ReactElement>} Rendered catalogue.
 */
export default async function LabsButtonsPage(): Promise<React.ReactElement> {
  const [canonicalDecls, { uses }] = await Promise.all([
    loadCanonicalDeclarations(),
    collectButtonClassUses(),
  ]);
  const bespoke = await loadBespokeButtons(canonicalDecls, uses);
  const variants = [
    BARE_VARIANT,
    ...(await loadCanonicalVariants(
      bespoke.map((entry) => ({
        className: entry.className,
        mixins: entry.mixins,
        scss: entry.stylesheet,
      })),
      uses,
    )),
  ];

  const realBespoke = bespoke.filter((entry) => !entry.isModifier);
  const reskins = realBespoke.filter((entry) => entry.channel === 'mixin');
  const handrolled = realBespoke.filter(
    (entry) => entry.channel === 'handrolled',
  );
  const modifiers = bespoke.filter((entry) => entry.isModifier);
  const dead = variants.filter(
    (variant) =>
      variant.name !== 'bare' &&
      variant.usages.length === 0 &&
      variant.mixinConsumers.length === 0,
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Button surface</h1>
        <p className={styles.lede}>
          Canonical variants from <code>src/styles/buttons.module.scss</code>,
          then every class applied to a <code>&lt;button&gt;</code> elsewhere.
          SCSS is compiled per request, so previews show resolved output.
        </p>
        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Canonical</dt>
            <dd>{variants.length}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Dead both doors</dt>
            <dd>{dead.length}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Re-skins</dt>
            <dd>{reskins.length}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Hand-rolled</dt>
            <dd>{handrolled.length}</dd>
          </div>
        </dl>
      </header>

      {groupVariants(variants).map(([group, list]) => (
        <section key={group} className={styles.group}>
          <h2 className={styles.groupTitle}>{group}</h2>
          <div className={styles.grid}>
            {list.map((variant) => {
              const reach =
                variant.usages.length + variant.mixinConsumers.length;
              const isDead = variant.name !== 'bare' && reach === 0;

              return (
                <article
                  key={variant.name}
                  className={`${styles.card} ${isDead ? styles.cardUnused : ''}`}>
                  <div className={styles.preview}>
                    <ButtonSample name={variant.name} btn={btn} />
                  </div>

                  <div className={styles.identity}>
                    <code
                      className={styles.className}
                      data-testid='canonical-name'>
                      {variant.name === 'bare'
                        ? '<button>'
                        : `btn.${variant.name}`}
                    </code>
                    {variant.name !== 'bare' && (
                      <span className={styles.count}>{reach}</span>
                    )}
                  </div>

                  {variant.doc && <p className={styles.doc}>{variant.doc}</p>}

                  <footer className={styles.sites}>
                    {variant.name === 'bare' ? (
                      <span className={styles.siteNote}>
                        Global rule — not tracked by class reference.
                      </span>
                    ) : isDead ? (
                      <span className={styles.siteEmpty}>
                        Dead through both doors — removal candidate.
                      </span>
                    ) : (
                      <>
                        <ul className={styles.siteList}>
                          {variant.usages.map((usage) => (
                            <li
                              key={`${usage.relativePath}:${usage.line}`}
                              className={styles.site}
                              title={`${usage.relativePath}:${usage.line}`}>
                              <span className={styles.siteModule}>
                                {usage.module}
                              </span>
                              {' > '}
                              {usage.file}:{usage.line}
                            </li>
                          ))}
                        </ul>
                        {variant.mixinConsumers.length > 0 && (
                          <div className={styles.declaredAt}>
                            via mixin: {variant.mixinConsumers.length} class
                            {variant.mixinConsumers.length === 1 ? '' : 'es'}
                          </div>
                        )}
                      </>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <BespokeSection
        title='Bespoke — built on canonical mixins'
        note='These reach the design system through the mixin door. Cheapest to fold back into a canonical class.'
        entries={reskins}
      />

      <BespokeSection
        title='Bespoke — fully hand-rolled'
        note='No canonical mixin. Each one re-derives button styling from nothing; the percentage is overlap with the nearest canonical variant.'
        entries={handrolled}
      />

      {modifiers.length > 0 && (
        <section className={styles.group}>
          <h2 className={styles.groupTitle}>
            State modifiers{' '}
            <span className={styles.count}>{modifiers.length}</span>
          </h2>
          <p className={styles.lede}>
            Applied alongside another class rather than styling a button on
            their own. Listed so the counts above stay honest.
          </p>
          <ul className={styles.modifierList}>
            {modifiers.map((entry) => (
              <li key={entry.id} className={styles.site}>
                <code>.{entry.className}</code>{' '}
                <span className={styles.siteModule}>{entry.module}</span>
                {' > '}
                {entry.stylesheet.split('/').pop()}
                {entry.line ? `:${entry.line}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
