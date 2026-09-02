import {
  PLUGINS_DIR
} from "./chunk-5NZEGB7U.mjs";

// pluginLoader.ts
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
function discoverPlugins(hookName) {
  const dir = path.join(PLUGINS_DIR, hookName);
  if (!existsSync(dir)) return [];
  const allFiles = readdirSync(dir);
  const compiledBasenames = new Set(
    allFiles.filter((f) => f.endsWith(".mjs")).map((f) => f.slice(0, -4))
  );
  return allFiles.filter((f) => {
    if (f.endsWith(".mjs")) return true;
    if (f.endsWith(".ts") && !f.endsWith(".d.ts")) {
      return !compiledBasenames.has(f.slice(0, -3));
    }
    return false;
  }).sort().map((f) => path.join(dir, f));
}
async function importPlugin(filePath) {
  try {
    const mod = await import(filePath);
    const candidate = mod.plugin ?? mod.default;
    if (candidate && typeof candidate.name === "string" && typeof candidate.run === "function") {
      return candidate;
    }
    process.stderr.write(
      `PAW plugin-loader: ${path.basename(filePath)} does not export a valid plugin
`
    );
    return null;
  } catch (err) {
    process.stderr.write(
      `PAW plugin-loader: failed to import ${path.basename(filePath)}: ${err instanceof Error ? err.message : String(err)}
`
    );
    return null;
  }
}
async function runPlugins(hookName, hookInput, db) {
  const files = discoverPlugins(hookName);
  if (files.length === 0) {
    return { block: false, messages: [] };
  }
  const messages = [];
  let block = false;
  for (const filePath of files) {
    const plugin = await importPlugin(filePath);
    if (!plugin) continue;
    try {
      const result = await plugin.run(hookInput, db);
      if (result.block) {
        block = true;
        if (result.message) {
          messages.push(`[${plugin.name}] ${result.message}`);
        }
      }
    } catch (err) {
      process.stderr.write(
        `PAW plugin ${plugin.name}: ${err instanceof Error ? err.message : String(err)}
`
      );
    }
  }
  return { block, messages };
}

export {
  runPlugins
};
