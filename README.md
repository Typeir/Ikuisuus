# Library of Ikuisuus

[![CI Pipeline](https://github.com/Typeir/Ikuisuus/actions/workflows/ci.yml/badge.svg)](https://github.com/Typeir/Ikuisuus/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/Typeir/Ikuisuus/graph/badge.svg?token=7Y5PMU9AK8)](https://codecov.io/gh/Typeir/Ikuisuus)

> _All that will ever be, laid bare._

**Damocles** is an old-school (OSR) tabletop roleplaying game set after the end of everything. The universe is already dead, and you play the characters and stories that happened anyway. It is a tragic, mythic setting, summed up as "the vile and beautiful lands of Damocles."

**The Library of Ikuisuus** is where Damocles is published: its rules, spells, monsters, items, character options and world lore, written as MDX and built into a fast, searchable, printable website. It also hosts the tools you use at the table.

---

## Disclaimer and Disclosure

Damocles is my life's work. Times have changed and computers talk, and people can now somehow come across my silly little grimdark hopecore game on the internet. If you do, and insist on contributing despite my grumpiness about it: Agentic work is welcome in the codebase, but please abstain from using anything other than your hands to write content. We can all prompt Claude to write a cool-ass monster, keep that to your table. You may use agents for formatting and copyediting, or as a sounding board, but be reasonable and don't let them write content for you. The content is the soul of the game, don't lose it.

## What's inside

**The library**

- The full rulebook, organised into chapters: character creation, combat, magic, travel and more
- Spell, monster and item catalogues, shown as filterable and sortable tables
- An encyclopedia of the setting: lands, gods, creatures, ages and artifacts
- Full-text search and a sidebar built from the content tree
- Print-friendly two-column layout, plus dark and light themes

**Table tools**

- **Character builder**: build a character step by step
- **Encounter planner**: plan encounters and run combat with a live turn tracker
- **World sim**: an interactive Three.js view of the cosmos
- **Foundry VTT export**: turns monster data into a Foundry module (`npm run foundry:build`)

**Under the hood**

- Next.js 16 and React 19, statically generated at build time
- `next-intl` routing: the UI is translated into English, Spanish and Finnish, but the content is English only for now
- A build pipeline that compresses assets, normalises file names to kebab-case and generates metadata for every content file
- Optional PostgreSQL backend (MikroORM) for metadata and API features. By default everything reads from the filesystem.

---

## Repository layout

| Path            | What lives there                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `src/content/`  | Game content, a git submodule ([`ikuisuus-content`](https://github.com/Typeir/ikuisuus-content)) |
| `src/app/`      | Next.js routes and API handlers                                                                  |
| `src/modules/`  | Features: character builder, encounter planner, world sim, search, sidebar and more              |
| `messages/`     | UI translations (`en`, `es`, `fi`)                                                               |
| `scripts/`      | Build pipeline, database, multirepo `ik` CLI                                                     |
| `foundry/`      | Foundry VTT module output                                                                        |
| `GDD.md`        | Game design document: the rules for writing Damocles content                                     |
| `.github/docs/` | Architecture docs                                                                                |

---

## Getting started

### Requirements

- Node.js 20+ (needed by Next.js 16)
- Git LFS (`git lfs install`), since images are stored in LFS
- PostgreSQL 14+, only if you use the database backend

### Setup

```bash
git clone --recurse-submodules https://github.com/Typeir/Ikuisuus.git
cd Ikuisuus

npm install      # postinstall runs `paw sync` only if the PAW CLI is present; otherwise it skips
npm run setup    # installs the `ik` CLI, sets the content submodule to merge on update, installs hooks
npm run dev      # runs the pre-init pipeline, then `next dev`
```

Open [http://localhost:3000](http://localhost:3000). Open a new shell after `setup` so `ik` is on your PATH.

`npm run dev` accepts these flags:

| Flag           | Effect                                        |
| -------------- | --------------------------------------------- |
| `--pg`         | Use PostgreSQL as the metadata backend        |
| `--fs`         | Read content at build time instead of runtime |
| `--no-preinit` | Skip the pre-init pipeline                    |
| `--no-replace` | Don't stop an already running dev server      |

### Common commands

```bash
npm run pre-init       # Build pipeline: compress, kebab-case, md→mdx, metadata, locales, search index
npm run build          # Clean, pre-init, run tests, then next build
npm test               # Test suite (enforcement checks run first)
npm run health:check   # Project-wide quality gates
npm run lint           # ESLint on src/

# Database (optional)
npm run db:init        # Create schema
npm run db:migrate     # Apply migrations
npm run db:seed        # Load content from the filesystem

# Site and content repos together (after `npm run setup`)
ik status
ik commit -m "message"
ik pull
ik push
```

---

## Documentation

- [Architecture docs](.github/docs/README.md): build pipeline, metadata, content and i18n, theming, world sim, Foundry
- [AGENTS.md](AGENTS.md): hard rules for contributors and coding agents (JSDoc, SCSS tokens, testing)
- [GDD.md](GDD.md): tone, pillars and the mechanical philosophy behind the content
