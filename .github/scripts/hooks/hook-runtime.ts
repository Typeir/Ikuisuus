/**
 * Hook Runtime Utilities
 *
 * @fileoverview Shared helpers for Copilot hook TypeScript entrypoints.
 *
 * @module .github/scripts/hooks/hook-runtime
 */

/**
 * Generic dictionary type for hook payload objects.
 */
type HookRecord = Record<string, unknown>;

/**
 * Hook output shape accepted by Copilot hooks.
 */
export interface HookResult {
  continue: boolean;
  hookSpecificOutput?: {
    hookEventName: string;
    decision?: 'block' | 'allow';
    reason?: string;
    additionalContext?: string;
  };
  systemMessage?: string;
}

/**
 * Read JSON hook payload from stdin.
 *
 * @returns Parsed payload object
 */
export async function readHookInput(): Promise<HookRecord> {
  return await new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk: string) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data) as HookRecord);
      } catch {
        resolve({});
      }
    });
    setTimeout(() => resolve({}), 3000);
  });
}

/**
 * Emit hook output as one-line JSON.
 *
 * @param result Result object
 */
export function writeHookOutput(result: HookResult): void {
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

/**
 * Resolve file path candidates from tool payload.
 *
 * @param hookInput Hook payload
 * @returns Resolved file path if present
 */
export function resolveEditedFilePath(
  hookInput: HookRecord,
): string | undefined {
  const candidates: string[] = [];
  const input = hookInput as {
    filePath?: unknown;
    toolInput?: { filePath?: unknown; file_path?: unknown };
    toolArgs?: unknown;
  };

  if (typeof input.filePath === 'string') {
    candidates.push(input.filePath);
  }
  if (typeof input.toolInput?.path === 'string') {
    candidates.push(input.toolInput.path);
  }
  if (typeof input.toolInput?.filePath === 'string') {
    candidates.push(input.toolInput.filePath);
  }
  if (typeof input.toolInput?.file_path === 'string') {
    candidates.push(input.toolInput.file_path);
  }

  let parsedArgs: HookRecord = {};
  if (typeof input.toolArgs === 'string') {
    try {
      parsedArgs = JSON.parse(input.toolArgs) as HookRecord;
    } catch {
      parsedArgs = {};
    }
  } else if (typeof input.toolArgs === 'object' && input.toolArgs !== null) {
    parsedArgs = input.toolArgs as HookRecord;
  }

  if (typeof parsedArgs.filePath === 'string') {
    candidates.push(parsedArgs.filePath);
  }
  if (typeof parsedArgs.file_path === 'string') {
    candidates.push(parsedArgs.file_path);
  }

  const nestedInput = parsedArgs.input as HookRecord | undefined;
  if (nestedInput && typeof nestedInput.filePath === 'string') {
    candidates.push(nestedInput.filePath);
  }

  const firstCandidate = candidates.find((value) => value.trim().length > 0);
  return firstCandidate ?? process.argv[2];
}

/**
 * Determine whether this invocation is a hook re-entry guard event.
 *
 * @param hookInput Hook payload
 * @returns True if guard flags indicate nested hook execution
 */
export function isNestedHookRun(hookInput: HookRecord): boolean {
  return (
    hookInput.stop_hook_active === true ||
    hookInput.session_end_hook_active === true ||
    hookInput.sessionEnd_hook_active === true
  );
}
