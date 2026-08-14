---
applyTo: 'src/**/*.ts,src/**/*.tsx,scripts/**/*.mjs,scripts/**/*.ts'
---

# JSDoc Standards Analysis

Before modifying any TypeScript or script file, you MUST:

1. **Read** `.github/docs/jsdoc.md` for the full JSDoc standards (file-level `@fileoverview`, `@property` tags, component `@param` exhaustiveness).
2. **NEVER add inline comments** (`// comment`) inside function bodies — extract to helper functions with JSDoc instead.
3. **Every exported declaration** must have JSDoc: functions, interfaces, types, classes, constants.
4. **Interface properties** use `@property` tags in the interface JSDoc, not inline `/** */` on each property.
5. **React components** require `@component` tag and exhaustive `@param` for every prop.
6. **Tone is dry. Caveman style. Technical descriptions only. Nothing else. Nothing more.** NO philosophy. NO literary prose. NO poetry. NO poetic allegory. NO bible-style writing. NO storytelling. NO metaphors. If caveman can't explain it, use strict ASD-STE100 (Simplified Technical English).

## Task Summary Requirement

When implementation begins, create a task summary in `.ignore/tasks/` using the task-lifecycle skill. Include:

- List of files being modified and their current JSDoc compliance status
- New declarations that need JSDoc
- Any inline comments that need extraction to helper functions

## Hard Rule Verification

After implementation, `grep -rn "// " src/` must find NO logic comments in modified files.

Read every JSDoc block written. Tone must be dry, caveman-style, technical. Reject philosophy, literary prose, poetry, allegory, bible-style. If caveman can't explain it, use strict ASD-STE100. Nothing else. Nothing more.
