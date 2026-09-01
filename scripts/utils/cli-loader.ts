/**
 * @fileoverview CLI command contract and filesystem-based loader.
 *
 * Discovers command modules by scanning a commands/ directory. Each command
 * file exports `meta` and `run` conforming to the {@link CliCommand} interface.
 *
 * @module scripts/utils/cli-loader
 * @author Typeir
 * @version 1.0.1
 * @since 3.0.0
 */

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Metadata describing a CLI command for discovery and help text.
 *
 * @interface CommandMeta
 * @property {string} name - Primary command name (matches filename sans extension)
 * @property {string} description - One-line description for help output
 * @property {Array<string>} [aliases] - Alternative names that route to this command
 * @property {Record<string, SubcommandDef>} [subcommands] - Nested subcommands (e.g. violations ls)
 */
export interface CommandMeta {
  name: string;
  description: string;
  aliases?: string[];
  subcommands?: Record<string, SubcommandDef>;
}

/**
 * A nested subcommand within a parent command.
 *
 * @interface SubcommandDef
 * @property {string} description - One-line description
 * @property {Array<string>} [aliases] - Alternative names
 * @property {boolean} [isDefault] - Run when parent is invoked without a subcommand
 */
export interface SubcommandDef {
  description: string;
  aliases?: string[];
  isDefault?: boolean;
}

/**
 * The contract every command file must satisfy.
 *
 * @interface CliCommand
 * @property {CommandMeta} meta - Command metadata for discovery
 * @property {Function} run - Handler invoked when the command is matched
 */
export interface CliCommand {
  meta: CommandMeta;
  run: (args: string[]) => void | Promise<void>;
}

/**
 * Loaded command registry keyed by primary name and aliases.
 *
 * @interface CommandRegistry
 * @property {Map<string, CliCommand>} commands - Name/alias → command lookup
 * @property {Array<CliCommand>} all - All loaded commands in discovery order
 */
export interface CommandRegistry {
  commands: Map<string, CliCommand>;
  all: CliCommand[];
}

/**
 * Load all command modules from a directory.
 *
 * Scans for `.ts` files (excluding `index.ts`), dynamically imports each,
 * and indexes by primary name and aliases. Imports use `file://` URLs.
 *
 * @param {string} commandsDir - Absolute path to the commands/ directory
 * @returns {Promise<CommandRegistry>} Registry of loaded commands
 */
export async function loadCommands(
  commandsDir: string,
): Promise<CommandRegistry> {
  const files = readdirSync(commandsDir).filter(
    (f) => f.endsWith('.ts') && f !== 'index.ts',
  );

  const registry: CommandRegistry = {
    commands: new Map(),
    all: [],
  };

  for (const file of files) {
    const fullPath = join(commandsDir, file);
    const mod = (await import(pathToFileURL(fullPath).href)) as CliCommand;

    if (!mod.meta || typeof mod.run !== 'function') continue;

    registry.all.push(mod);
    registry.commands.set(mod.meta.name, mod);

    if (mod.meta.aliases) {
      for (const alias of mod.meta.aliases) {
        registry.commands.set(alias, mod);
      }
    }
  }

  return registry;
}

/**
 * Resolve a subcommand within a parent command's meta.
 * Returns the matching subcommand key (canonical name) or the default
 * subcommand if one is marked `isDefault`, or null if no match.
 *
 * @param {CommandMeta} meta - Parent command meta
 * @param {string | undefined} sub - Subcommand name from argv (may be undefined)
 * @returns {string | null} Canonical subcommand key or null
 */
export function resolveSubcommand(
  meta: CommandMeta,
  sub: string | undefined,
): string | null {
  if (!meta.subcommands) return null;

  if (sub) {
    if (meta.subcommands[sub]) return sub;

    for (const [key, def] of Object.entries(meta.subcommands)) {
      if (def.aliases?.includes(sub)) return key;
    }
    return null;
  }

  for (const [key, def] of Object.entries(meta.subcommands)) {
    if (def.isDefault) return key;
  }

  return null;
}

/**
 * Format help text from a command registry.
 *
 * @param {CommandRegistry} registry - Loaded command registry
 * @returns {string} Formatted help string
 */
export function formatCommandHelp(registry: CommandRegistry): string {
  const lines: string[] = [];
  for (const cmd of registry.all) {
    const aliases =
      cmd.meta.aliases && cmd.meta.aliases.length > 0
        ? ` (${cmd.meta.aliases.join(', ')})`
        : '';
    lines.push(
      `  ${cmd.meta.name}${aliases}`.padEnd(28) + cmd.meta.description,
    );

    if (cmd.meta.subcommands) {
      for (const [key, def] of Object.entries(cmd.meta.subcommands)) {
        const subAliases =
          def.aliases && def.aliases.length > 0
            ? ` (${def.aliases.join(', ')})`
            : '';
        const defaultTag = def.isDefault ? ' [default]' : '';
        lines.push(
          `    ${key}${subAliases}${defaultTag}`.padEnd(28) + def.description,
        );
      }
    }
  }
  return lines.join('\n');
}

/**
 * Resolve the commands directory relative to the calling module.
 *
 * @param {string} importMetaUrl - The calling module's `import.meta.url`
 * @param {string} [relPath] - Relative path from the calling module to commands/
 * @returns {string} Absolute path to the commands directory
 */
export function resolveCommandsDir(
  importMetaUrl: string,
  relPath: string = 'commands',
): string {
  return join(dirname(fileURLToPath(importMetaUrl)), relPath);
}
