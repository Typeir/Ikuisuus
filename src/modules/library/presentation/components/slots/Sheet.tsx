/**
 * @fileoverview A sheet read as pages rather than one scroll.
 * @description A monster sheet is long, and most of it is not what a reader
 * wants this turn. Its subsections become pages with a selector that stays in
 * reach, and inside a page anything that holds further divisions collapses, so
 * what is on screen is a page of headings rather than a page of everything.
 *
 * @module modules/library/presentation/components/slots/Sheet
 * @version 2.0.0
 * @author Typeir
 * @since 2026-09-08
 */

'use client';

import { CONTENT_CHANGED_EVENT } from '@/lib/constants/domEvents';
import {
  usePersistentUiDispatchOptional,
  usePersistentUiStateOptional,
} from '@/lib/context/PersistentUiContext';
import { PERSISTED_UI_ACTION_TYPES } from '@/lib/types/persistentUiState';
import { scrollParentOf } from '@/lib/utils/scrollParentOf';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  anchorsOf,
  byAnchor,
  byRank,
  labelsOf,
  readDivisions,
  type Division,
  type DivisionProps,
} from './divisions';
import { CardFoldProvider } from './cardFold';
import { foldHolders, holdOf, rebuild } from './sheetFolding';
import SheetBar from './SheetBar';
import styles from './sheet.module.scss';

/**
 * Props for the sheet.
 *
 * @property {string} [pages] - Anchors of the divisions to page, comma separated,
 * each optionally followed by `: Label`; every subsection at `level` when absent
 * @property {number} [level] - Heading rank whose divisions become pages
 * @property {number} [nest] - How deep a division must nest before it collapses
 * @property {boolean} [closed] - Start the collapsed divisions folded away
 * @property {ReactNode} [children] - The sheet's divisions
 */
export interface SheetProps {
  pages?: string;
  level?: number | string;
  nest?: number;
  closed?: boolean;
  foot?: boolean;
  children?: ReactNode;
}

/**
 * The layout's own bars, and the properties the sheet keeps their heights in.
 *
 * @description The sheet's header stands as tall as the sidebar's title and
 * its footer as tall as the sidebar's footer, so both are read from the same
 * place at the same time and neither can drift from the other.
 */
const EDGES: ReadonlyArray<readonly [string, string]> = [
  ['.sidebar-header', '--sheet-headline'],
  ['.sidebar-footer', '--sheet-footline'],
];

/**
 * Sheet component.
 *
 * @description The selector sticks to the top of the viewport and grows once it
 * does, so it reads as the sheet's own header rather than a strip left behind
 * by the scroll. Only its ground grows, so nothing is laid out twice. A page
 * arriving is wiped in from the leading edge, the way a sheet is drawn past a
 * scanner head, which shows that the page was replaced.
 *
 * @param {SheetProps} props - Component props
 * @returns {JSX.Element} The sheet
 */
const Sheet: React.FC<SheetProps> = ({
  pages: wantedList,
  level = 2,
  nest = 1,
  closed = false,
  foot = false,
  children,
}) => {
  const labels = labelsOf(wantedList);
  const named = anchorsOf(wantedList);
  /* Written in content the rank arrives as text, and a rank that never equals
     any heading's would quietly page nothing. */
  const rank = typeof level === 'number' ? level : Number(level) || 2;
  /* Naming the pages is an override; left alone, every subsection is one. */
  const wanted = named.size > 0 ? byAnchor(named) : byRank(rank);
  const lead: ReactNode[] = [];
  const pages: Division[] = [];

  for (const part of readDivisions(children, wanted)) {
    if (part.kind === 'division') {
      pages.push(part.division);
      continue;
    }
    /* Before the first page, a node introduces the sheet and stays above the
       selector. After one, it belongs to the page it followed — except a rule,
       which only separated divisions that no longer sit next to each other. */
    if (pages.length === 0) lead.push(part.node);
    else if (!React.isValidElement(part.node) || part.node.type !== 'hr') {
      pages[pages.length - 1].body.push(part.node);
    }
  }

  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const remember = usePersistentUiDispatchOptional();
  const { sheetPage } = usePersistentUiStateOptional();
  const [stuck, setStuck] = useState(false);
  const strip = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const outgoing = useRef<HTMLDivElement>(null);
  /* Whether the header is pinned, readable from an effect without making the
     effect run on every change of it. */
  const pinned = useRef(false);
  /** The trailing height last written, so a rounding wobble is not rewritten. */
  const trailing = useRef(-1);
  const [offset, setOffset] = useState(0);

  /* Where the header rests is the stylesheet's to say, and it says something
     different once a title bar of the layout's own holds the top of the
     screen. Reading it back off the strip keeps the breakpoint in one place. */
  useEffect(() => {
    const read = () => {
      const row = strip.current;
      if (row) setOffset(parseFloat(getComputedStyle(row).top) || 0);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  /* The page's run has to end exactly where the document does, or the header
     lands on the page's own heading at the bottom of the scroll. What lies
     under the sheet is the layout's — padding, and nothing the sheet can know
     from a stylesheet — so it is measured. The body's own height cancels out
     of the measurement, so growing it never moves the number. */
  const measure = useCallback(() => {
    const box = body.current;
    if (!box) return;
    const root = document.documentElement;
    /* Embedded in a frame the page scrolls inside a container, so the run ends
       where that container's content does rather than where the document's
       does. */
    const view = scrollParentOf(box);
    const scroller = view ?? document.scrollingElement ?? root;
    const bottom =
      box.getBoundingClientRect().bottom -
      (view ? view.getBoundingClientRect().top : 0) +
      (view ? view.scrollTop : window.scrollY);
    /* This number sets the run's own height, so writing it resizes what was
       just measured and the observer runs again. The two cancel exactly, but
       `scrollHeight` is a whole number and the box's edge is not, so the
       result can land a pixel either side and hand the loop a reason to go
       round forever. A pixel is below what anyone can see and above what the
       rounding can invent, so a change that small is not worth a write. */
    const next = Math.max(0, Math.round(scroller.scrollHeight - bottom));
    if (Math.abs(next - trailing.current) >= 2) {
      trailing.current = next;
      box.style.setProperty('--sheet-trailing', `${next}px`);
    }

    /* The header's ground reaches the edges of the page and no further. Told
       to run a viewport past each side it would clear them, but the surplus is
       real width the page then has to hold, and a narrow screen ends up able
       to pan sideways over it. */
    const row = strip.current;
    if (!row) return;
    const edges = row.getBoundingClientRect();
    box.style.setProperty('--sheet-bleed-start', `${Math.max(0, edges.left)}px`);
    box.style.setProperty(
      '--sheet-bleed-end',
      `${Math.max(0, root.clientWidth - edges.right)}px`,
    );

    /* The rule across the top of the page is the layout's, not the sheet's.
       Its height is read rather than written down, and rather than imposed:
       holding the layout's header to a number the sheet chose is what makes it
       grow and the menu beneath it stutter. */
    /* One reading for both bars, so the header cannot come out level with the
       layout's title while the footer drifts off its rule. */
    for (const [selector, prop] of EDGES) {
      const edge = document.querySelector(selector);
      const tall = edge ? edge.getBoundingClientRect().height : 0;
      if (tall > 0) box.style.setProperty(prop, `${tall}px`);
      else box.style.removeProperty(prop);
    }
  }, []);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [measure]);

  /* Turning the page while the header is pinned opens the new page at its top,
     under the header. The measure is retaken first, before anything paints, so
     the document is already its full length when the scroll is set. */
  /* Both are set together so the page arriving is marked in the same commit
     that mounts it. Marked a frame later it would have painted once already,
     and its starting style would have nothing to start from. */
  const turn = useCallback(
    (index: number) => {
      setLeaving((was) => (was === null ? active : was));
      setActive(index);
      const anchor = pages[index]?.anchor;
      if (remember && anchor) {
        remember({
          type: PERSISTED_UI_ACTION_TYPES.SET_SHEET_PAGE,
          payload: { anchor },
        });
      }
    },
    [active, pages, remember],
  );

  /* A reader who was on the Features of one sheet wants the Features of the
     next, not to be put back to the front of it. The division is looked up by
     anchor, so a sheet that has no such division simply opens where it would
     have. This runs before the browser paints, so the page it settles on is
     the first one drawn rather than a correction of one. */
  useLayoutEffect(() => {
    const at = pages.findIndex((page) => page.anchor === sheetPage);
    if (sheetPage && at > 0) setActive(at);
    /* The article it sits in is what waited, so the article is what is told:
       whichever division it settled on is the one that gets painted, rather
       than the server's guess and then a correction. */
    body.current
      ?.closest('.prose')
      ?.setAttribute('data-settled', 'true');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The turn is over when the page leaving has actually faded, not when a
     clock says it should have. The browser can be several frames late to
     start, and a fixed wait would take the page away mid-fade — which is the
     pop the fade was there to prevent. The clock is only a backstop, for when
     no transition runs at all. */
  useEffect(() => {
    if (leaving === null) return;
    const panel = outgoing.current;
    const done = () => setLeaving(null);
    const faded = (event: TransitionEvent) => {
      if (event.target === panel && event.propertyName === 'opacity') done();
    };
    panel?.addEventListener('transitionend', faded);
    const backstop = window.setTimeout(done, holdOf(panel));
    return () => {
      panel?.removeEventListener('transitionend', faded);
      window.clearTimeout(backstop);
    };
  }, [leaving, active]);

  useLayoutEffect(() => {
    const box = body.current;
    if (!box || !pinned.current) return;
    measure();
    const top = box.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'instant' });
  }, [active, measure, offset]);

  /* What reads the page rather than renders it — the section track, the
     scroll progress — has no way to know a page was turned. It is told, both
     when the new page arrives and again when the old one is finally taken
     away, since the document's length changes at each. */
  useEffect(() => {
    window.dispatchEvent(new Event(CONTENT_CHANGED_EVENT));
  }, [active, leaving]);

  /* The strip is watched directly. With the root's top edge pulled in past
     where the strip rests, a pinned strip is no longer wholly inside it, so
     the ratio leaves 1 at the exact moment it sticks. The rect check keeps a
     strip still arriving from below, also partly outside, from counting. */
  useEffect(() => {
    const row = strip.current;
    if (!row) return;
    const edge = offset + 1;
    const observer = new IntersectionObserver(
      ([entry]) => {
        /* The strip pins to the top of whatever it scrolls in, which is the
           viewport on a page and a container in a frame. `rootBounds` already
           carries the margin below, so it is the pin line in both. */
        const line = entry.rootBounds?.top ?? edge;
        const on =
          entry.intersectionRatio < 1 && entry.boundingClientRect.top <= line;
        pinned.current = on;
        setStuck(on);
      },
      /* Zero as well as one: arriving by a jump rather than a scroll takes the
         strip from outside the root straight to pinned, never passing through
         wholly-inside, and a lone threshold of one would not fire at all. */
      {
        root: scrollParentOf(row),
        threshold: [0, 1],
        rootMargin: `-${edge}px 0px 0px 0px`,
      },
    );
    observer.observe(row);
    return () => observer.disconnect();
  }, [offset]);

  if (pages.length === 0) return <>{children}</>;

  const page = pages[Math.min(active, pages.length - 1)];
  const turning =
    leaving !== null && leaving !== active && pages[leaving] !== undefined;

  /* A footer carries the sheets a page holds rather than the sections one
     sheet holds, so it rests at the bottom and is grounded from the start:
     there is nothing above it for it to rise out of. */
  const bar = (
    <SheetBar
      pages={pages}
      labels={labels}
      active={active}
      foot={foot}
      stuck={stuck}
      innerRef={strip}
      onTurn={turn}
    />
  );

  return (
    <div className={styles.sheet} data-sheet>
      {lead}
      {/* A sticky box travels only inside its containing block, so the header
          and the page it heads share one. */}
      <div ref={body} className={styles.body} data-foot={foot ? 'true' : undefined}>
        {!foot && bar}
        {/* Both panels are keyed by their page, so turning mounts the one
            arriving and keeps the one leaving until the seam has crossed. */}
        <div className={styles.stack}>
          {turning && (
            <div
              key={`${pages[leaving].anchor}-leaving`}
              ref={outgoing}
              className={styles.page}
              data-leaving='true'
              data-sheet-page
              aria-hidden='true'>
              <CardFoldProvider value={true}>
                {rebuild(
                  pages[leaving],
                  foldHolders(pages[leaving].body, nest, closed),
                )}
              </CardFoldProvider>
            </div>
          )}
          <div
            key={page.anchor}
            className={styles.page}
            data-entering={turning ? 'true' : undefined}
            data-sheet-page
            role='tabpanel'>
            <CardFoldProvider value={true}>
              {rebuild(page, foldHolders(page.body, nest, closed))}
            </CardFoldProvider>
          </div>
        </div>
        {foot && bar}
      </div>
    </div>
  );
};

Sheet.displayName = 'Sheet';

export default Sheet;
