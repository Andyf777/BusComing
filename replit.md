# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### Bus ETA Display (`artifacts/bus-eta`)

Real-time bus arrival board for **Route 103 (CTB)** at **Stop 10 — 樓梯街, 堅道 (Ladder Street, Caine Road)**.

- Frontend: React + Vite, served at `/`
- Data source: Citybus ETA API v2 (`https://rt.data.gov.hk/v2/transport/citybus/...`)
- CORS proxy: Express backend forwards requests for CTB, KMB, and GMB APIs
- Auto-refreshes ETA every 30 seconds
- Routes:
  - **103** (CTB/KMB joint): CTB stop `001015` + KMB stop `7D77D56CB708BCED`
  - **40M** (CTB): CTB stop `001015`
  - **31** (GMB minibus): GMB stop `20000017`, route_id `2006738`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
