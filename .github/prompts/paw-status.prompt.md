---
description: 'PAW status check. Active violations, gate health, enforcement state.'
agent: 'PawAgent'
---

# PAW Status

1. Load PAW skill (.github/skills/paw/SKILL.md)
2. Run `npm run paw -- status` → report violations
3. Run `npm run paw -- gates run` → summarize by severity
4. Run `npm run paw -- severity-override` → check if override is active
5. Check `.pawignore` exists, well-formed
6. Summary: violations count + files, gate pass/fail/warn, severity override state, fix recommendations

Active violations? Report which files + broken rules.
Severity override active? Flag it — all gates are downgraded.
Deadlocks? Flag explicitly.
