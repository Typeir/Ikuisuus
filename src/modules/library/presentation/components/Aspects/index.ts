/**
 * @fileoverview Aspects component barrel.
 * @module modules/library/presentation/components/Aspects/index
 * @author Typeir
 * @version 1.0.0
 * @since 2026-08-04
 */

/**
 * Client-safe surface only. `MonsterAspects` reads the monster repository, which
 * reaches the ORM, so it is imported from its own path by the server components
 * that need it — re-exporting it here would drag the database layer into the MDX
 * component map and from there into the browser bundle.
 */
export { Aspects, default, type AspectsProps } from './Aspects';
