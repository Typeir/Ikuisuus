/**
 * @fileoverview A sheet read as pages rather than one scroll.
 * @description A monster sheet is long, and most of it is not what a reader
 * wants this turn.
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
import { useResizeSignal, useStuck } from '@/lib/hooks/motion';
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
import { measureSheet } from './sheetMeasure';
import { usePagePresence } from './sheetPresence';
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
  multi?: boolean;
  children?: ReactNode;
}

/**
 * The rank the sheet around this one pages at, or zero outside any.
 *
 * @description A page carries one first-level heading, its title, so a sheet
 * inside a sheet opens one rank below the one holding it.
 */
const SheetRank = React.createContext(0);

/**
 * Sheet component.
 *
 * @description The selector sticks to the top of the viewport and grows once it
 * does
 *
 * @param {SheetProps} props - Component props
 * @returns {JSX.Element} The sheet
 */
/**
 * Names for the bar, with the opening every page shares taken off.
 *
 * @param {Division[]} pages - The pages the bar carries
 * @returns {string[]} What to print for each, in order
 */
function unprefixed(pages: Division[]): string[] {
  const names = pages.map((page) => page.name);
  if (names.length < 2) return names;

  let shared = names[0];
  for (const name of names.slice(1)) {
    let at = 0;
    while (at < shared.length && at < name.length && shared[at] === name[at]) {
      at += 1;
    }
    shared = shared.slice(0, at);
  }
  const cut = Math.max(
    ...[' ', ',', '(', '–', '-'].map((mark) => shared.lastIndexOf(mark)),
  );
  if (cut < 1) return names;

  const trimmed = names.map((name) => {
    const rest = name
      .slice(cut + 1)
      .replace(/^[\s,–(-]+/, '')
      .trim();
    return /^[^()]*\)$/.test(rest) ? rest.slice(0, -1).trim() : rest;
  });
  return trimmed.every((name) => name !== '') ? trimmed : names;
}

const Sheet: React.FC<SheetProps> = ({
  pages: wantedList,
  level,
  nest = 1,
  closed = false,
  foot = false,
  multi = false,
  children,
}) => {
  const labels = labelsOf(wantedList);
  const named = anchorsOf(wantedList);
  const outer = React.useContext(SheetRank);
  /* Written in content the rank arrives as text, and a rank that never equals
     any heading's would quietly page nothing. Left unwritten it is the rank
     below the sheet around this one: a page's own creatures at two, and the
     sections each of them holds at three. */
  const rank = multi
    ? 2
    : level === undefined
      ? Math.max(2, outer + 1)
      : typeof level === 'number'
        ? level
        : Number(level) || 2;
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
  const strip = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const outgoing = useRef<HTMLDivElement>(null);
  const rack = useRef<HTMLDivElement>(null);
  /* Whether the header is pinned, readable from an effect without making the
     effect run on every change of it. */
  /** The trailing height last written, so a rounding wobble is not rewritten. */
  const [offset, setOffset] = useState(0);
  const { stuck, pinned } = useStuck(strip, offset);

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

  const measure = useCallback(() => {
    const box = body.current;
    const shelf = shell.current;
    if (box && shelf) measureSheet(box, shelf);
  }, []);

  useResizeSignal(() => document.body, measure);

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
    body.current?.closest('.prose')?.setAttribute('data-settled', 'true');
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

  usePagePresence(rack, active, leaving, turn);

  /* What reads the page rather than renders it — the section track, the
     scroll progress — has no way to know a page was turned. It is told, both
     when the new page arrives and again when the old one is finally taken
     away, since the document's length changes at each. */
  useEffect(() => {
    window.dispatchEvent(new Event(CONTENT_CHANGED_EVENT));
  }, [active, leaving]);


  if (pages.length === 0) return <>{children}</>;

  const turning =
    leaving !== null && leaving !== active && pages[leaving] !== undefined;

  /* A footer carries the sheets a page holds rather than the sections one
     sheet holds, so it rests at the bottom and is grounded from the start:
     there is nothing above it for it to rise out of. */
  const printed = multi ? unprefixed(pages) : pages.map((page) => page.name);
  const bar = (
    <SheetBar
      pages={pages}
      names={printed}
      labels={labels}
      active={active}
      foot={foot}
      stuck={stuck}
      innerRef={strip}
      onTurn={turn}
    />
  );

  return (
    <SheetRank.Provider value={rank}>
      <div
        ref={shell}
        className={styles.sheet}
        data-sheet
        data-foot={foot ? 'true' : undefined}
        data-multi={multi ? 'true' : undefined}>
        {lead}
        {/* A sticky box travels only inside its containing block, so the header
          and the page it heads share one. */}
        <div
          ref={body}
          className={styles.body}
          data-foot={foot ? 'true' : undefined}>
          {!foot && bar}
          {/* Both panels are keyed by their page, so turning mounts the one
            arriving and keeps the one leaving until the seam has crossed. */}
          <div ref={rack} className={styles.stack}>
            {pages.map((entry, index) => {
              const shown = index === active;
              const going = turning && index === leaving;
              return (
                <div
                  key={entry.anchor}
                  ref={going ? outgoing : undefined}
                  className={styles.page}
                  data-sheet-page
                  data-anchor={entry.anchor}
                  data-shown={shown ? 'true' : undefined}
                  data-leaving={going ? 'true' : undefined}
                  aria-hidden={going ? 'true' : undefined}
                  role='tabpanel'>
                  <CardFoldProvider value={true}>
                    {rebuild(
                      entry,
                      multi
                        ? entry.body
                        : foldHolders(entry.body, nest, closed),
                    )}
                  </CardFoldProvider>
                </div>
              );
            })}
          </div>
        </div>
        {foot && bar}
      </div>
    </SheetRank.Provider>
  );
};

Sheet.displayName = 'Sheet';

export default Sheet;
