/**
 * Converts plain text references to markdown links in MDX content.
 *
 * @fileoverview Converts plain text references to markdown links in MDX content.
 * Skips self-links when `opts.selfPath` is provided.
 * Supports multiple terms per path (use array for term field).
 *
 * @module linkifyMarkdown
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

/** Link specification entry */
interface LinkSpec {
  /** Term or array of terms to link */
  term: string | string[];
  /** Target URL path */
  path: string;
}

/** Options for the linkifier */
interface LinkifyOptions {
  /** Path of the current page (to skip self-links) */
  selfPath?: string;
}

/**
 * Applies link specs to markdown text, converting plain text references to markdown links.
 * Skips self-links and existing links; supports bold-wrapped terms.
 *
 * @param {string} markdown - Source markdown text
 * @param {LinkSpec[]} specs - Array of link specifications
 * @param {LinkifyOptions} opts - Options including optional selfPath
 * @returns Linkified markdown text
 */
export const linkifyMarkdown = (
  markdown: string,
  specs: LinkSpec[],
  opts: LinkifyOptions = {},
): string => {
  const expanded: { term: string; path: string }[] = [];
  for (const spec of specs) {
    const terms = Array.isArray(spec.term) ? spec.term : [spec.term];
    for (const term of terms) {
      expanded.push({ term, path: spec.path });
    }
  }

  const sorted = [...expanded].sort((a, b) => b.term.length - a.term.length);
  const selfPath = opts.selfPath ? normalize(opts.selfPath) : null;

  const isInsideExistingLink = (text: string, idx: number): boolean => {
    const lastOpen = text.lastIndexOf('[', idx);
    const lastClose = text.lastIndexOf(']', idx);
    if (lastOpen !== -1 && lastOpen > lastClose) {
      const nextParen = text.indexOf('](', lastOpen);
      if (nextParen !== -1 && nextParen < idx) return true;
      return true;
    }
    return false;
  };

  const samePath = (a: string | null, b: string | null): boolean =>
    !!a && !!b && normalize(a.split('#')[0]) === normalize(b.split('#')[0]);

  function normalize(p: string): string {
    return p
      .replace(/\\/g, '/')
      .replace(/\/index$/, '')
      .replace(/\/+$/, '');
  }

  let out = markdown;

  for (const { term, path } of sorted) {
    if (selfPath && samePath(path, selfPath)) continue;

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      `(?<!\\w)(\\*\\*)?(${escaped})(\\*\\*)?(?!\\w)`,
      'g',
    );

    out = out.replace(pattern, (match, preBold, core, postBold, offset) => {
      if (isInsideExistingLink(out, offset)) return match;

      const linked = `[${core}](${path})`;
      const hasBold = Boolean(preBold && postBold);
      return hasBold ? `**${linked}**` : linked;
    });
  }

  return out;
};
