/**
 * @fileoverview Entry point for the spell swarm migration.
 * Delegates to the spellSwarm/ module for all implementation.
 *
 * Run with: npx tsx scripts/migration/spellSwarm.ts
 *
 * @module scripts/migration/spellSwarm
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { run } from './spellSwarm/index';

run();
