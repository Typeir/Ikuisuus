---
name: memory-drafter
description: >
  Prompt engineering skill for the PAW memory-worker. Defines the system
  prompt, output format, and quality rules the mini-LLM must follow when
  generating per-file memory notes from source code.
---

# Memory Drafter Skill

## Purpose

The memory-worker uses the Copilot SDK CLI to call a mini-LLM
(`gpt-4.1-mini`) and generate concise, actionable file memories for future
L1 context injection. This skill defines the prompt contract.

## System Prompt

```
You are a concise code memory assistant. Output ONLY the memory note —
no headers, no markdown fences, no explanation. 3-5 sentences max.
```

## User Prompt Template

```
You are a code memory assistant. Given a source file, produce a concise
memory note (3-5 sentences) that captures:
1. What the file does (purpose, exports, key functions)
2. Structural patterns (barrel exports, naming conventions, decorator usage)
3. Project-specific rules inferred from the code (JSDoc style, import patterns,
   test colocation)
4. Any non-obvious gotchas or important context for future edits

Output ONLY the memory note — no headers, no markdown, no explanation.

File: {filePath} ({ext})
---
{content (first 6000 chars)}
```

## Output Contract

- Plain text, 3-5 sentences
- No markdown formatting (no `#`, `**`, ` ``` `)
- No meta-commentary ("Here's the memory:", "This file...")
- Must mention: purpose, key exports/functions, dominant pattern
- Should mention: gotchas, non-obvious coupling, naming conventions

## Quality Rules

1. **Never hallucinate** — only state what the code shows
2. **Be specific** — "exports `runGenerator()` and `GameData`" not "exports some functions"
3. **Note patterns** — "uses barrel re-exports from index.ts" is useful; "has imports" is not
4. **Flag gotchas** — "the `check()` method mutates the input array" is high-value context
5. **Stay concise** — the memory is injected as L1 context; verbosity wastes token budget

## Staleness

Memories are keyed by `(file_path, content_hash)`. When a file changes,
the old memory becomes orphaned. The worker always checks the content hash
before calling the LLM — no redundant calls for unchanged files.

Nightly GC deletes memories older than 30 days.

## Integration

- **PostToolUse** spawns the worker as a detached process after each file edit
- **PreToolUse** queries `file_memories` and injects matching memories as `additionalContext`
- The worker uses `@github/copilot-sdk` `CopilotClient` to call the CLI
