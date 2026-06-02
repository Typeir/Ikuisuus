---
name: memory-drafter
description: >
  PAW memory-worker prompt contract. System prompt, output format, quality rules
  for mini-LLM (gpt-4.1-mini) generating per-file memory notes from source code.
---

# Memory Drafter

## Purpose

mini-LLM calls generate concise, actionable file memories. L1 context injection.
This skill = prompt contract.

## System Prompt

```
Concise code memory assistant. Output ONLY memory note —
no headers, no markdown, no explanation. 3-5 sentences max.
```

## Output Contract

- Plain text, 3-5 sentences
- No markdown
- Must mention: purpose, exports, pattern
- Should mention: gotchas, coupling, naming
- Never hallucinate; be specific
- Note patterns (barrel exports useful, "has imports" not)
- Flag gotchas (mutations, non-obvious coupling)
