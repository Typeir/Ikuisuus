# Library of Ikuisuus

[![CI Pipeline](https://github.com/Typeir/Ikuisuus/actions/workflows/ci.yml/badge.svg)](https://github.com/Typeir/Ikuisuus/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/Typeir/Ikuisuus/graph/badge.svg?token=7Y5PMU9AK8)](https://codecov.io/gh/Typeir/Ikuisuus)

A Next.js 15 internationalized documentation site for Damocles OSR content, featuring MDX-based content management.

---

> Technical descriptions on documentation files such as README.md or other .md files can be incorrect or outdated

## 📦 Features

- **Dark / Light Themes** with persistent storage
- **Multi-language Support** (currently only hosts content in English)
- **MDX Content System** with dynamic routing and metadata extraction
- **Filterable Tables** for monsters and items with search and sorting
- **Responsive Sidebar Navigation** generated from content structure
- **Print Optimization** with two-column layout
- **Static Site Generation** for fast page loads

---

## 🚀 Getting Started

### Setup

```bash
# Install dependencies — `postinstall` auto-runs `paw sync` so PAW hooks
# are ready immediately on fresh clones.
npm install

# One-shot bootstrap: installs the `ik` CLI on your PATH, configures the
# content submodule to merge (not detach) on update, installs content-repo
# git hooks, and verifies PAW. Open a new shell afterwards.
npm run setup

# Run development server (auto-runs pre-init build pipeline)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Requirements

- Node.js 18+
- Git LFS (`git lfs install`)
- PostgreSQL 14+ (optional, for database features)

### Key Commands

```bash
npm run test           # Run test suite
npm run build          # Production build
npm run test:hooks     # Verify git hooks are installed

# Content workflow
npm run pre-init       # Full build pipeline (compress, kebabify, generate metadata)
npm run linkify:world  # Auto-link content (with backup)

# Multirepo (both repos together)
bash scripts/multirepo/ik.sh commit -m "message"
bash scripts/multirepo/ik.sh status

# Database (if needed)
npm run db:init       # Create schema
npm run db:migrate    # Apply migrations
npm run db:seed       # Load content
```

See [Copilot Instructions](.github/copilot-instructions.md) for architecture & hard rules, or [Building & Architecture](.github/docs/) for detailed guides.

---
