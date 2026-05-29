/**
 * Global module declarations for static asset imports.
 *
 * @fileoverview Allows TypeScript to resolve `.svg` imports as React
 * components (via the Next.js / webpack SVGR loader configured in
 * `next.config.js`). Required so `tsc --noEmit` succeeds outside the
 * Next build pipeline (e.g. in the composite health check).
 *
 * @module svg
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

declare module '*.svg' {
  import type { FC, SVGProps } from 'react';
  const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
