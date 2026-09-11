/**
 * @fileoverview A sheet read as pages rather than one scroll.
 * @description A monster sheet is long, and most of it is not what a reader
 * wants this turn.
 *
 * @module modules/library/presentation/components/slots/sheet/Sheet
 * @version 2.0.0
 * @author Typeir
 * @since 2026-09-08
 */

'use client';

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
} from '../utils/divisions';
import { CardFoldProvider } from '../utils/cardFold';
import { foldHolders, rebuild } from './sheetFolding';
import { measureSheet } from './sheetMeasure';
import { unprefixed } from './sheetNames';
import { useSheetSpy } from './sheetSpy';
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
const Sheet: React.FC<SheetProps> = ({
  pages: wantedList,
  level,
  nest = 1,
  closed = false,
  foot = false,
  multi = false,
  children,
}) => {
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
  /* Reading the pages means walking every node the sheet was given, and a
     sheet is given a whole creature. What it is walking arrives once and does
     not change, while what makes the sheet render again — a page turned, a
     header taking its ground — changes often, so the walk is kept rather than
     repeated. */
  const { lead, pages, labels } = React.useMemo(() => {
    /* Naming the pages is an override; left alone, every subsection is one. */
    const named = anchorsOf(wantedList);
    const wanted = named.size > 0 ? byAnchor(named) : byRank(rank);
    const read: ReactNode[] = [];
    const held: Division[] = [];

    for (const part of readDivisions(children, wanted)) {
      if (part.kind === 'division') {
        held.push(part.division);
        continue;
      }
      /* Before the first page, a node introduces the sheet and stays above
         the selector. After one, it belongs to the page it followed — except
         a rule, which only separated divisions that no longer sit next to
         each other. */
      if (held.length === 0) read.push(part.node);
      else if (!React.isValidElement(part.node) || part.node.type !== 'hr') {
        held[held.length - 1].body.push(part.node);
      }
    }

    return { lead: read, pages: held, labels: labelsOf(wantedList) };
  }, [children, rank, wantedList]);

  const strip = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const rack = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const { stuck } = useStuck(strip, offset);
  /* Every section is written out, one after another, at whatever height it
     needs. The bar says which one has been reached; it does not decide it. */
  const active = useSheetSpy(rack, strip, shell, pages.length);

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

  /* The bar names where the reader is, so asking for a section is asking to
     be taken there. Nothing is set: the scroll arrives, the band it crosses
     says so, and the bar follows. */
  const turn = useCallback((index: number) => {
    const section = rack.current?.children[index];
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);


  if (pages.length === 0) return <>{children}</>;

  /* A footer carries the sheets a page holds rather than the sections one
     sheet holds, so it rests at the bottom and is grounded from the start:
     there is nothing above it for it to rise out of. */
  /* Every page is drawn, and only one of them is being read. Held by
     reference, the pages nobody turned to are the same elements they were, and
     what renders again stops at the wrapper around them. */
  const bodies = React.useMemo(
    () =>
      pages.map((entry) => (
        <CardFoldProvider value={true}>
          {rebuild(
            entry,
            multi ? entry.body : foldHolders(entry.body, nest, closed),
          )}
        </CardFoldProvider>
      )),
    [pages, multi, nest, closed],
  );

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
        data-multi={multi ? 'true' : undefined}
>
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
            {pages.map((entry, index) => (
              <div
                key={entry.anchor}
                className={styles.page}
                data-sheet-page
                data-anchor={entry.anchor}
                data-reading={index === active ? 'true' : undefined}>
                {bodies[index]}
              </div>
            ))}
          </div>
        </div>
        {foot && bar}
      </div>
    </SheetRank.Provider>
  );
};

Sheet.displayName = 'Sheet';

export default Sheet;
