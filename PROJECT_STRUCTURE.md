# Project structure

This document describes the top-level folders and important files in the repository.

```
store/
├── api/                   # Backend Express API (TypeScript)
│   ├── prisma/            # Prisma schema, migrations, and generated client (after generate)
│   │   ├── migrations/    # Generated migration folders
│   │   └── schema.prisma  # Prisma schema file
│   ├── src/
│   │   ├── index.ts       # API entry (server bootstrap)
│   │   ├── features/      # Feature modules: auth, products, users, etc.
│   │   ├── middleware/    # Express middleware
│   │   ├── config/        # Configuration helpers (dotenv, env parsing)
│   │   └── utils/         # Utilities (db client wrapper, helpers)
│   ├── tests/             # Unit & integration tests
│   ├── package.json       # API package scripts and deps
│   └── .env               # Local env file (not committed) containing DATABASE_URL
|
├── web/                   # Frontend Next.js app (App Router)
│   ├── src/
│   │   ├── app/           # Next app routes and page components
│   │   ├── components/    # Reusable React components
│   │   ├── lib/           # Client-side utilities
│   │   ├── hooks/         # React hooks
│   │   └── store/         # Zustand stores
│   ├── public/            # Static assets
│   └── package.json       # Web package scripts and deps
|
├── .github/               # CI workflows (if present)
├── LICENSE
├── README.md              # Project overview and quickstart (this file)
└── PROJECT_STRUCTURE.md   # This file
```

Notes

- The `api` package is the authoritative place for database operations and contains Prisma schema and migrations.
- If you later need to share the Prisma client between `api` and `web`, consider creating a workspace package (e.g., `packages/db`) or using pnpm workspaces and moving `prisma/` to the repo root.
- Never commit `.env` files with secrets. Use `.env.example` to document required variables.

If you want I can also scaffold a small `packages/db` workspace and move Prisma to a shared package — say the word and I’ll do it.
