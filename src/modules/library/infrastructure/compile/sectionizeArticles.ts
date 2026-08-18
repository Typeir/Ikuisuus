/**
 * @fileoverview Sectionize helpers: anchor registry, text helpers, entry→article pass. Wraps feature entries in articles.
 *
 * @module sectionizeArticles
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import type { Element, ElementContent, RootContent } from 'hast';
import { h } from 'hastscript';

/** A node with children the sectionizer may descend into. */
export type Parent = { children: RootContent[] } & Record<string, unknown>;

/**
 * Bold labels that are stat lines of a block, never feature entries.
 */
const STAT_LINE_LABELS = new Set(
  [
    'size',
    'material',
    'resistances',
    'vulnerabilities',
    'immunities',
    'damage resistances',
    'damage immunities',
    'damage vulnerabilities',
    'condition immunities',
    'senses',
    'languages',
    'saving throws',
    'skills',
    'tier bonus',
    'challenge',
    'speed',
    'hit',
  ].map((l) => l.toLowerCase()),
);

/**
 * Section headings where colon-labels are entries, not fields.
 */
const ENTRY_GROUP_HEADINGS = /^(traits?|actions?|minor actions?|reactions?|legendary actions?)$/i;

/**
 * Group prefixes on an entry label (`Actions — Claw.`).
 */
const GROUP_PREFIX =
  /^(traits?|actions?|minor actions?|reactions?|legendary actions?)\s*[—–-]\s*/i;


/**
 * Plain text of a node, MDX inline JSX included as its text.
 *
 * @param {RootContent | Element} node - HAST node
 * @returns {string} Concatenated text
 */
export function textOf(node: RootContent | ElementContent): string {
  if (node.type === 'text') return node.value;
  const kids = (node as unknown as Partial<Parent>).children;
  return kids ? kids.map((c) => textOf(c as RootContent)).join('') : '';
}


/**
 * Anchor registry: first use is bare slug, repeats prefixed with parent anchor.
 */
export class Anchors {
  private readonly used = new Set<string>();

  claim(slug: string, parent: string | undefined): string {
    let anchor = slug;
    if (this.used.has(anchor) && parent) anchor = `${parent}-${slug}`;
    let n = 2;
    const base = anchor;
    while (this.used.has(anchor)) anchor = `${base}-${n++}`;
    this.used.add(anchor);
    return anchor;
  }
}


/* ─────────────────────────  Pass 2: articles  ───────────────────────── */

/** What an entry-shaped paragraph/list item resolves to. */
interface Entry {
  label: string;
}

/**
 * Extract bold-led feature entry from paragraph or list item.
 *
 * @param {Element} block - `<p>` or tight `<li>`
 * @param {boolean} colonEntries - Whether colon-labels count as entries here
 * @returns {Entry | null} The entry, or null
 */
function entryOf(
  block: Element,
  colonEntries: boolean,
  hasFollowingBody = false,
): Entry | null {
  const kids = block.children.filter(
    (c) => !(c.type === 'text' && c.value.trim() === ''),
  );
  const first = kids[0];
  if (!first || first.type !== 'element' || first.tagName !== 'strong') return null;

  const labelRaw = textOf(first).trim();
  const rest = kids.slice(1);
  const restText = rest.map((c) => textOf(c)).join('');
  const restTrimmed = restText.trim();
  const colon = restTrimmed.startsWith(':') || labelRaw.endsWith(':');
  const terminated = /[.—–-]$/.test(labelRaw);
  /* Hard break or soft line break after label means it's on own line. */
  const afterLabel = block.children[block.children.indexOf(first) + 1];
  const breakNext =
    (afterLabel?.type === 'element' && afterLabel.tagName === 'br') ||
    (afterLabel?.type === 'text' && /^[ \t]*\r?\n/.test(afterLabel.value));
  const hasProse = restTrimmed.replace(/^:/, '').trim().length > 0;

  const label = labelRaw
    .replace(/[.:]$/, '')
    .replace(GROUP_PREFIX, '')
    .trim();
  if (!label || STAT_LINE_LABELS.has(label.toLowerCase())) return null;

  if (colon) return colonEntries && hasProse ? { label } : null;
  /* Label line with body in following blocks of same list item. */
  if (!hasProse) return hasFollowingBody ? { label } : null;
  if (!terminated && !breakNext) return null;
  return { label };
}

/**
 * Wraps `children` in an `<article data-anchor>`.
 *
 * @param {ElementContent[]} children - Content to wrap
 * @param {string} anchor - Article anchor
 * @param {string} slug - Bare slug before collision prefixing
 * @returns {Element} The article
 */
function article(children: ElementContent[], anchor: string, slug: string): Element {
  const el = (h as unknown as (t: string, p: object) => Element)('article', {
    'data-anchor': anchor,
  });
  el.data = { slug } as unknown as Element["data"];
  el.children = children;
  return el;
}

/**
 * Article pass over subtree. Tracks section anchor and group heading status.
 *
 * @param {Parent} node - Node whose children to scan
 * @param {Anchors} anchors - Document anchor registry
 * @param {string | undefined} sectionAnchor - Nearest enclosing section anchor
 * @param {boolean} colonEntries - Nearest section is a Traits/Actions group inside a quote
 * @param {boolean} inQuote - Inside a blockquote
 * @param {boolean} inSection - Inside any section
 */
export function articleize(
  node: Parent,
  anchors: Anchors,
  sectionAnchor: string | undefined,
  colonEntries: boolean,
  inQuote: boolean,
  inSection: boolean,
): void {
  for (let i = 0; i < node.children.length; i++) {
    const c = node.children[i];
    if (c.type !== 'element') {
      if ((c.type as unknown as string) === 'mdxJsxFlowElement') {
        articleize(c as unknown as Parent, anchors, sectionAnchor, colonEntries, inQuote, inSection);
      }
      continue;
    }

    if (c.tagName === 'section') {
      const anchor = (c.properties?.['data-anchor'] ?? c.properties?.dataAnchor) as
        | string
        | undefined;
      const heading = c.children.find((x) => x.type === 'element' && /^h[1-6]$/.test(x.tagName)) as
        | Element
        | undefined;
      const group = heading ? ENTRY_GROUP_HEADINGS.test(textOf(heading).trim()) : false;
      /* Group headings use enclosing feature's anchor for entries. */
      const owner = group ? sectionAnchor : (anchor ?? sectionAnchor);
      articleize(c as unknown as Parent, anchors, owner, inQuote && group, inQuote, true);
      continue;
    }

    if (c.tagName === 'blockquote') {
      articleize(c as unknown as Parent, anchors, sectionAnchor, colonEntries, true, inSection);
      continue;
    }

    if (c.tagName === 'ul' || c.tagName === 'ol') {
      for (const li of c.children) {
        if (li.type !== 'element' || li.tagName !== 'li') continue;
        const lead = li.children.find((x) => x.type === 'element') as Element | undefined;
        const block = lead && lead.tagName === 'p' ? lead : li;
        const followingBody =
          block === lead &&
          li.children.some((x) => x !== lead && x.type === 'element');
        const entry = inSection ? entryOf(block, colonEntries, followingBody) : null;
        if (entry) {
          const slug = anchorSlug(entry.label);
          const anchor = anchors.claim(slug, sectionAnchor);
          const art = article(li.children, anchor, slug);
          li.children = [art];
          for (const inner of art.children) {
            if (inner.type === 'element' && (inner.tagName === 'ul' || inner.tagName === 'ol')) {
              articleize({ children: [inner] } as Parent, anchors, sectionAnchor, colonEntries, inQuote, inSection);
            }
          }
          continue;
        }
        articleize(li as unknown as Parent, anchors, sectionAnchor, colonEntries, inQuote, inSection);
      }
      continue;
    }

    if (c.tagName === 'p' && inSection) {
      const entry = entryOf(c, colonEntries);
      if (entry) {
        const slug = anchorSlug(entry.label);
        const anchor = anchors.claim(slug, sectionAnchor);
        node.children[i] = article([c], anchor, slug);
        continue;
      }
    }

    if (c.tagName === 'li' || c.tagName === 'article' || c.tagName === 'div' || c.tagName === 'details') {
      articleize(c as unknown as Parent, anchors, sectionAnchor, colonEntries, inQuote, inSection);
    }
  }
}
