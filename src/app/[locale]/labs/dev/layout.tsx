/**
 * @fileoverview Segment guard for the `/[locale]/labs/dev` route family.
 * @description Renders dev labs pages only while `NODE_ENV` is `development`; any
 * other mode returns 404. The guard sits on `dev` rather than `labs` so sibling
 * `labs` routes can ship to production. New scratch routes inherit it by living
 * under this segment.
 *
 * @module app/[locale]/labs/dev/layout
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

/**
 * Keeps dev labs pages out of search indexes even when a dev build is exposed.
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Dev labs segment layout.
 *
 * @function LabsDevLayout
 * @param {object} props - Layout props.
 * @param {React.ReactNode} props.children - Dev labs page content.
 * @returns {React.ReactElement} The children, or a 404 outside development.
 */
export default function LabsDevLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <>{children}</>;
}
