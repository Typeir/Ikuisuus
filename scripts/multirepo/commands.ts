/**
 * @fileoverview Deprecated monolith — superseded by `./commands/*.ts`.
 *
 * This file previously contained all ik subcommand implementations in a single
 * module. Each command now lives in its own file under `./commands/` and is
 * discovered at runtime by the fs-based loader in `scripts/utils/cli-loader.ts`.
 *
 * Kept as an empty module so any stale build artifact references resolve to a
 * no-op rather than a missing-module error.
 *
 * @module multirepo/commands
 * @author Typeir
 * @version 2.0.0
 * @since 3.0.0
 * @deprecated Use the individual files in `./commands/`.
 */

export { };

