/**
 * @fileoverview Compiles project SCSS to resolved CSS rules for the labs catalogue.
 * @description Loads `sass` lazily so it never enters a production server bundle, and
 * mirrors the `next.config.ts` resolution setup: `src/styles` on `loadPaths` plus an
 * importer for the `@/` alias. Returns flat rules so mixin-produced declarations are
 * visible the same way the browser sees them.
 *
 * @module app/[locale]/labs/dev/buttons/scssCompiler
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import path from 'node:path';

const SRC = path.join(process.cwd(), 'src');
const STYLES = path.join(SRC, 'styles');

/**
 * One resolved CSS rule.
 *
 * @interface CssRule
 * @property {string} selector - Whitespace-collapsed selector text.
 * @property {Record<string, string>} decls - Declarations as property/value pairs.
 */
export interface CssRule {
  selector: string;
  decls: Record<string, string>;
}

/**
 * Splits compiled CSS into flat rules, dropping comments and at-rule wrappers.
 *
 * @function extractRules
 * @param {string} css - Compiled CSS source.
 * @returns {CssRule[]} Rules in source order.
 */
export function extractRules(css: string): CssRule[] {
  const rules: CssRule[] = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(clean)) !== null) {
    const selector = match[1].trim().replace(/\s+/g, ' ');
    if (!selector || selector.startsWith('@')) continue;

    const decls: Record<string, string> = {};
    for (const chunk of match[2].split(';')) {
      const colon = chunk.indexOf(':');
      if (colon === -1) continue;
      const prop = chunk.slice(0, colon).trim();
      if (prop)
        decls[prop] = chunk
          .slice(colon + 1)
          .trim()
          .replace(/\s+/g, ' ');
    }
    if (Object.keys(decls).length) rules.push({ selector, decls });
  }

  return rules;
}

/**
 * Compiles one SCSS file, returning its rules or an empty array on failure.
 * Failures are swallowed so one broken stylesheet cannot blank the catalogue.
 *
 * @async
 * @function compileScss
 * @param {string} file - Absolute path to the stylesheet.
 * @returns {Promise<CssRule[]>} Resolved rules.
 */
export async function compileScss(file: string): Promise<CssRule[]> {
  try {
    const sass = await import('sass');
    const result = sass.compile(file, {
      loadPaths: [STYLES],
      importers: [
        {
          findFileUrl(url: string) {
            if (!url.startsWith('@/')) return null;
            const resolved = path
              .join(SRC, url.slice(2))
              .split(path.sep)
              .join('/');
            return new URL(`file:///${resolved}`);
          },
        },
      ],
      style: 'expanded',
      quietDeps: true,
    });
    return extractRules(result.css);
  } catch {
    return [];
  }
}

/**
 * Merges every rule whose selector targets the class, ignoring state and
 * pseudo-element variants, into a single declaration block.
 *
 * @function baseDeclarations
 * @param {CssRule[]} rules - Rules from one compiled stylesheet.
 * @param {string} className - Class to resolve, without the leading dot.
 * @returns {Record<string, string>} Merged base declarations.
 */
export function baseDeclarations(
  rules: CssRule[],
  className: string,
): Record<string, string> {
  const target = `.${className}`;
  const exact = rules.filter((rule) =>
    rule.selector.split(',').some((part) => part.trim() === target),
  );
  const source = exact.length
    ? exact
    : rules.filter(
        (rule) =>
          rule.selector
            .split(',')
            .some((part) => part.trim().endsWith(target)) &&
          !/:(hover|focus|active|disabled|focus-visible)|::/.test(
            rule.selector,
          ),
      );

  return source.reduce<Record<string, string>>(
    (acc, rule) => Object.assign(acc, rule.decls),
    {},
  );
}
