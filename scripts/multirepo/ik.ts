#!/usr/bin/env tsx
/**
 * @fileoverview ik — Interactive multirepo sync CLI entry point. With no
 * arguments, launches the interactive TUI. With arguments, routes to the
 * matching command in `./commands/*.ts`; unrecognised commands fall through to
 * a dual-repo git passthrough.
 *
 * @module ik
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { log } from '@clack/prompts';

import {
  loadCommands,
  resolveCommandsDir,
  type CommandRegistry,
} from '../utils/cli-loader';
import { checkSubmodule, cmdPassthrough } from './git';
import { runInteractive } from './tui';

/**
 * CLI entry point. Launches the interactive TUI when called with no arguments;
 * otherwise routes directly to the matching command handler.
 */
async function main(): Promise<void> {
  process.env['IK_RUNNING'] = '1';

  const argv = process.argv.slice(2);
  const command = argv[0];
  const rest = argv.slice(1);

  if (command !== 'setup') {
    checkSubmodule();
  }

  if (!command) {
    await runInteractive();
    return;
  }

  const commandsDir = resolveCommandsDir(import.meta.url);
  const registry: CommandRegistry = await loadCommands(commandsDir);
  const match = registry.commands.get(command);

  if (match) {
    await match.run(rest);
  } else {
    cmdPassthrough(command, rest);
  }
}

main().catch((err) => {
  log.error(String(err));
  process.exit(1);
});
