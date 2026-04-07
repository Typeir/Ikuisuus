#!/usr/bin/env tsx
/**
 * @fileoverview ik — Interactive multirepo sync CLI entry point.
 *
 * When called with no arguments: launches an arrow-key TUI that walks the user
 * through all common git operations with spinners and confirmations.
 *
 * When called with arguments: behaves as a transparent shorthand (non-interactive),
 * so `ik push`, `ik add .`, `ik commit -m "msg"` all work without the menu.
 *
 * Smart commands (add, commit, push, pull) run repos in the correct dependency
 * order and keep the submodule ref in sync. Everything else is passed through
 * to both repos verbatim.
 *
 * @module ik
 */

import { log } from '@clack/prompts';

import {
    cmdAdd,
    cmdCleanBranches,
    cmdCommit,
    cmdPassthrough,
    cmdPull,
    cmdPush,
    cmdStatus,
    cmdValidate,
} from './commands';
import { checkSubmodule } from './git';
import { cmdNuke } from './nuke';
import { printHelp, runInteractive } from './tui';

/**
 * CLI entry point. Launches the interactive TUI when called with no arguments;
 * otherwise routes directly to the matching command handler.
 */
async function main(): Promise<void> {
  process.env['IK_RUNNING'] = '1';

  const argv = process.argv.slice(2);
  const command = argv[0];
  const rest = argv.slice(1);

  checkSubmodule();

  if (!command) {
    await runInteractive();
    return;
  }

  switch (command) {
    case 'add':
      await cmdAdd(rest);
      break;

    case 'commit':
      await cmdCommit(rest);
      break;

    case 'push':
      await cmdPush(rest);
      break;

    case 'pull':
      await cmdPull(rest);
      break;

    case 'status':
    case 'st':
      cmdStatus();
      break;

    case 'validate':
      cmdValidate();
      break;

    case 'clean-branches':
      await cmdCleanBranches();
      break;

    case 'nuke':
      await cmdNuke(rest);
      break;

    case 'log':
      cmdPassthrough('log', rest.length > 0 ? rest : ['--oneline', '-10']);
      break;

    case 'diff':
      cmdPassthrough('diff', rest);
      break;

    case 'help':
    case '-h':
    case '--help':
      printHelp();
      break;

    default:
      cmdPassthrough(command, rest);
  }
}

main().catch((err) => {
  log.error(String(err));
  process.exit(1);
});
