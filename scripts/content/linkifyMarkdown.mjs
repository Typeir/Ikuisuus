/** @typedef {{ term: string | string[], path: string }} LinkSpec */

/**
 * Global markdown linkifier.
 * Skips self-links when `opts.selfPath` is provided.
 * Supports multiple terms per path (use array for term field).
 *
 * @param {string} markdown
 * @param {LinkSpec[]} specs
 * @param {{ selfPath?: string }} [opts]
 * @returns {string}
 */
export const linkifyMarkdown = (markdown, specs, opts = {}) => {
  // Expand specs with multiple terms into individual entries
  const expanded = [];
  for (const spec of specs) {
    const terms = Array.isArray(spec.term) ? spec.term : [spec.term];
    for (const term of terms) {
      expanded.push({ term, path: spec.path });
    }
  }
  
  const sorted = [...expanded].sort((a, b) => b.term.length - a.term.length);
  const selfPath = opts.selfPath ? normalize(opts.selfPath) : null;

  const isInsideExistingLink = (text, idx) => {
    const lastOpen = text.lastIndexOf("[", idx);
    const lastClose = text.lastIndexOf("]", idx);
    if (lastOpen !== -1 && lastOpen > lastClose) {
      const nextParen = text.indexOf("](", lastOpen);
      if (nextParen !== -1 && nextParen < idx) return true;
      return true;
    }
    return false;
  };

  const samePath = (a, b) =>
    !!a && !!b && normalize(a.split("#")[0]) === normalize(b.split("#")[0]);

  function normalize(p) {
    return p.replace(/\\/g, "/").replace(/\/index$/, "").replace(/\/+$/, "");
  }

  let out = markdown;

  for (const { term, path } of sorted) {
    // Skip self-reference
    if (selfPath && samePath(path, selfPath)) continue;

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?<!\\w)(\\*\\*)?(${escaped})(\\*\\*)?(?!\\w)`, "g");

    out = out.replace(pattern, (match, preBold, core, postBold, offset) => {
      if (isInsideExistingLink(out, offset)) return match;

      const linked = `[${core}](${path})`;
      const hasBold = Boolean(preBold && postBold);
      return hasBold ? `**${linked}**` : linked;
    });
  }

  return out;
};
