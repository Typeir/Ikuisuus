/**
 * @fileoverview What the bar over a sheet says the reader is looking at.
 * @module modules/library/presentation/components/slots/sheet/sheetSpy
 * @version 3.1.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { READING_LINE } from '@/lib/constants/reading';
import { watchViewport } from '@/lib/utils/motion';
import { atPageEnd } from '@/lib/utils/atPageEnd';
import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Says which section of a sheet the reader has reached, and how far through.
 *
 * @description Nothing here moves the page or holds it still. The sections sit
 * where they were written, at whatever height they need, and the scroll is the
 * reader's — this only watches, so the bar can say where they are and draw how
 * far they have come. Both answers come from one reading of the page, on the
 * frame every watcher shares: which section last passed the line a reader
 * reads at, and how far through the sheet they have come. How far is measured
 * across the scroll the page allows, so the bar is empty at the top of the
 * page and full at its foot. It is written as a property rather than kept as
 * state, since it changes with every frame of scroll and only a gradient
 * reads it.
 *
 * The last section of a sheet at the foot of the page is one the reader can
 * never bring up to that line, because the page runs out first; reaching the
 * end of the page is reaching the end of the sheet. A sheet the reader has
 * scrolled clean past has every section behind the line already, so the same
 * answer is the right one there too.
 *
 * @param {RefObject<HTMLElement | null>} rack - The element holding the sections.
 * @param {RefObject<HTMLElement | null>} strip - The bar, which draws the progress.
 * @param {RefObject<HTMLElement | null>} shell - The sheet, whose length is the progress.
 * @param {number} sections - How many sections the sheet holds.
 * @returns {number} The section being read.
 */
export function useSheetSpy(
  rack: RefObject<HTMLElement | null>,
  strip: RefObject<HTMLElement | null>,
  shell: RefObject<HTMLElement | null>,
  sections: number,
): number {
  const [at, setAt] = useState(0);

  useEffect(() => {
    const stack = rack.current;
    const sheet = shell.current;
    if (!stack || !sheet || sections < 2) return;

    return watchViewport(() => {
      const line = window.innerHeight * READING_LINE;
      const done = atPageEnd(
        window.scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight,
      );
      const pages = stack.children;

      let reached = 0;
      for (let index = 0; index < pages.length; index += 1) {
        if (pages[index].getBoundingClientRect().top <= line) reached = index;
      }
      if (done) reached = Math.max(0, pages.length - 1);
      setAt((held) => (held === reached ? held : reached));

      const box = sheet.getBoundingClientRect();
      if (box.height <= 0) return;

      /* How much of the sheet is behind the line now, and how much would be at
         the top and the foot of the page. The page runs out before a sheet at
         its end can pass the line, and a sheet at its start is already partly
         behind it, so the bar is drawn across what the reader can actually
         scroll: empty at the top, full at the foot, and even between. */
      const behind = line - box.top;
      const remaining = Math.max(
        0,
        document.documentElement.scrollHeight -
          window.innerHeight -
          window.scrollY,
      );
      const first = Math.max(0, behind - window.scrollY);
      const last = Math.min(box.height, behind + remaining);
      const span = last - first;

      const through =
        done || span <= 0
          ? 1
          : Math.min(1, Math.max(0, (behind - first) / span));
      strip.current?.style.setProperty('--sheet-read', `${through}`);
    });
  }, [rack, strip, shell, sections]);

  return at;
}
